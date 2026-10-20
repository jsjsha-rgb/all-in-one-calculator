/**
 * Mains answer evaluation.
 *
 * Demo mode uses a transparent, rule-based rubric so the product is fully usable
 * without any API key. Live mode asks the configured provider for structured
 * JSON and validates it before saving or displaying anything.
 */
import { callAI, getAIStatus } from './ai.ts';
import type { EvaluationFeedback, EvaluationSection } from './validation.ts';
import { countWords, validateEvaluation } from './validation.ts';

export class EvaluationError extends Error {
  status: number;
  retryable: boolean;
  constructor(message: string, status = 502, retryable = true) {
    super(message);
    this.name = 'EvaluationError';
    this.status = status;
    this.retryable = retryable;
  }
}

export const AI_EVALUATION_DISCLAIMER =
  'This evaluation is AI-generated and indicative only. It is not an official UPSC assessment, does not predict marks, and should be used alongside your own analysis and a mentor\u2019s guidance.';

export interface AnswerAnalysis {
  words: number;
  sentences: number;
  paragraphs: number;
  averageSentenceLength: number;
  questionOverlap: number;
  hasIntroduction: boolean;
  introductionWords: number;
  hasConclusion: boolean;
  hasWayForward: boolean;
  hasExamples: boolean;
  hasData: boolean;
  hasCounterArgument: boolean;
  hasStructureMarkers: boolean;
  addressesDirective: boolean;
  directive: string;
}

const DIRECTIVE_RE = /^(critically\s+)?(examine|discuss|analyse|analyze|evaluate|comment|explain|justify|assess)\b/i;

export function analyseAnswer(questionText: string, answerText: string): AnswerAnalysis {
  const words = countWords(answerText);
  const sentences = answerText
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const paragraphs = answerText
    .split(/\n\s*\n|\n(?=\s*(?:\d+[.)]|[-*]))/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const averageSentenceLength = sentences.length
    ? Math.round((words / sentences.length) * 10) / 10
    : 0;

  const stop = new Set([
    'with','this','that','from','have','been','which','their','there','about','into','what','when',
    'where','while','would','could','should','other','these','those','also','than','then','them',
    'they','your','also','only','does','more','most','such','some','very','will','shall','must',
    'indian','india','upsc','discuss','examine','critically','comment','evaluate','analyse',
  ]);
  const questionTerms = Array.from(
    new Set(
      questionText
        .toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length > 3 && !stop.has(word)),
    ),
  );
  const answerLower = answerText.toLowerCase();
  const matched = questionTerms.filter((term) => answerLower.includes(term)).length;
  const questionOverlap = questionTerms.length ? matched / questionTerms.length : 0;

  const firstParagraph = paragraphs[0] ?? '';
  const introductionWords = countWords(firstParagraph);
  const lastPortion = paragraphs.slice(-1).join(' ').toLowerCase();
  const conclusionRe = /conclusion|to sum up|in sum|way forward|therefore|thus|hence|going forward|overall/i;
  const hasConclusion = conclusionRe.test(lastPortion) || paragraphs.length >= 4;

  const directiveMatch = questionText.match(DIRECTIVE_RE);
  const directive = directiveMatch ? directiveMatch[0].toLowerCase() : 'discuss';
  const hasJudgement = /however|nevertheless|although|critically|balance|judgement|judgment|on balance|arguably/i.test(
    answerText,
  );

  return {
    words,
    sentences: sentences.length,
    paragraphs: paragraphs.length,
    averageSentenceLength,
    questionOverlap,
    hasIntroduction: introductionWords >= 12,
    introductionWords,
    hasConclusion,
    hasWayForward: /way forward|suggest|recommend|reform|measure|step|policy|institutional/i.test(lastPortion),
    hasExamples: /for example|for instance|e\.g\.|such as|case of|scheme|act\b|committee|commission|report|judg|scheme|yojana|mission|niti aayog/i.test(
      answerText,
    ),
    hasData: /\b\d+(\.\d+)?\s*(%|percent|crore|lakh|million|billion|billion|trillion)|\b(19|20)\d{2}\b/i.test(
      answerText,
    ),
    hasCounterArgument: /however|on the other hand|critics|criticism|nevertheless|although|conversely|in contrast/i.test(
      answerText,
    ),
    hasStructureMarkers: /(^|\n)\s*(\d+[.)]|[-*•])/.test(answerText) || paragraphs.length >= 3,
    addressesDirective: directive.startsWith('critically') ? hasJudgement : true,
    directive,
  };
}

const clampScore = (value: number): number => Math.max(1, Math.min(10, Math.round(value)));
const section = (score: number, feedback: string): EvaluationSection => ({
  score: clampScore(score),
  maxScore: 10,
  feedback,
});

export function buildDemoEvaluation(input: {
  questionText: string;
  answerText: string;
  marks?: number;
  modelAnswer?: string;
}): EvaluationFeedback {
  const marks = input.marks ?? 15;
  const a = analyseAnswer(input.questionText, input.answerText);
  const lengthScore = Math.min(a.words / 180, 1);

  const understandingScore = 3 + a.questionOverlap * 5 + lengthScore * 2;
  const relevanceScore = 3 + a.questionOverlap * 5 + (a.addressesDirective ? 2 : 0);
  const introductionScore =
    4 +
    (a.hasIntroduction ? 2 : 0) +
    (a.introductionWords >= 15 && a.introductionWords <= 90 ? 2 : 0) +
    (a.paragraphs >= 3 ? 1 : 0);
  const bodyScore =
    3 +
    (a.paragraphs >= 3 ? 2 : 0) +
    (a.hasCounterArgument ? 1 : 0) +
    (a.hasStructureMarkers ? 1 : 0) +
    Math.min(a.words / 150, 1) * 2;
  const examplesScore =
    3 + (a.hasExamples ? 3 : 0) + (a.hasData ? 3 : 0) + (a.paragraphs >= 3 ? 1 : 0);
  const conclusionScore =
    3 + (a.hasConclusion ? 3 : 0) + (a.hasWayForward ? 3 : 0) + (a.words >= 120 ? 1 : 0);

  const sections = {
    understanding: section(
      understandingScore,
      a.questionOverlap >= 0.5
        ? 'The answer engages with the key terms of the question and stays broadly on topic.'
        : 'The answer uses some question terms but drifts from the core demand. Restate the question in your own words before writing.',
    ),
    relevanceAccuracy: section(
      relevanceScore,
      a.addressesDirective
        ? 'The response follows the directive of the question and keeps examples connected to the argument.'
        : 'The question carries a critical directive, but the answer lacks an explicit judgement. Include a clear "on balance" position.',
    ),
    introduction: section(
      introductionScore,
      a.hasIntroduction
        ? `The opening is a reasonable length (${a.introductionWords} words) and sets up the answer. Try adding a definition, data point or constitutional anchor.`
        : 'The introduction is too short to frame the answer. Open with a definition or context sentence, then state the roadmap.',
    ),
    body: section(
      bodyScore,
      a.paragraphs >= 3
        ? `The body is organised into ${a.paragraphs} parts. Keep one argument per paragraph and signpost with headings or numbering.`
        : 'The body reads as a single block. Break it into two or three labelled arguments with evidence for each.',
    ),
    examples: section(
      examplesScore,
      a.hasExamples
        ? 'Concrete references are present, which strengthens credibility. Verify every fact and add a date or figure where possible.'
        : 'No specific example, scheme, judgment or committee is cited. Add at least two verifiable Indian examples.',
    ),
    conclusion: section(
      conclusionScore,
      a.hasConclusion
        ? 'The answer closes with a concluding move. Make the final sentence a forward-looking, implementable step.'
        : 'The answer ends without a conclusion. Add a short paragraph summarising your position and a way forward.',
    ),
  };

  const total = Object.values(sections).reduce((sum, s) => sum + s.score, 0);
  const overallScore = Math.max(1, Math.round((total / 60) * marks * 10) / 10);
  const percentage = (total / 60) * 100;
  const band =
    percentage >= 75 ? 'Strong' : percentage >= 55 ? 'Developing' : 'Needs structured work';

  const missingDimensions: string[] = [];
  if (!a.hasExamples) missingDimensions.push('Specific examples, schemes or judgments');
  if (!a.hasData) missingDimensions.push('Data or dates to substantiate claims');
  if (!a.hasCounterArgument) missingDimensions.push('A counter-argument or alternative perspective');
  if (!a.hasConclusion) missingDimensions.push('A clear conclusion');
  if (!a.hasWayForward) missingDimensions.push('A practical way forward');
  if (!a.addressesDirective) missingDimensions.push('An explicit critical judgement');
  if (a.words < 120) missingDimensions.push('Sufficient depth (the answer is short for the marks)');

  const ranked = Object.entries(sections).sort((x, y) => y[1].score - x[1].score);
  const strengths = ranked
    .filter(([, value]) => value.score >= 7)
    .slice(0, 3)
    .map(([key]) => labelFor(key));
  if (!strengths.length) strengths.push('You completed a full attempt, which is the first step to improvement');

  const weaknesses = ranked
    .filter(([, value]) => value.score < 6)
    .slice(-3)
    .map(([key]) => labelFor(key));

  const improvements: string[] = [];
  improvements.push(
    a.words < 120
      ? `Expand the answer towards 150-200 words for a ${marks}-mark question, keeping one idea per paragraph.`
      : 'Trim repetition: every sentence should add an argument, example or link.',
  );
  if (!a.hasIntroduction) improvements.push('Write a two-sentence introduction: define the term, then state your line of argument.');
  if (!a.hasExamples) improvements.push('Add two named examples (a scheme, judgment, committee or case) and explain their relevance.');
  if (!a.hasCounterArgument) improvements.push('Insert a counter-view paragraph beginning with "However" or "Critics argue", then rebut it.');
  if (!a.hasConclusion) improvements.push('End with a conclusion that answers the directive and suggests an implementable step.');
  if (a.averageSentenceLength > 28) improvements.push('Shorten long sentences; aim for an average of 18-22 words for clarity.');
  if (!a.addressesDirective) improvements.push('State your judgement explicitly in the introduction and conclusion.');

  return {
    overall: {
      score: overallScore,
      maxScore: marks,
      band,
      summary: `Indicative assessment: ${overallScore}/${marks} (${band}). ${
        a.words
      } words, ${a.paragraphs} paragraph${a.paragraphs === 1 ? '' : 's'}. This rubric checks structure, relevance and evidence — not official UPSC marking.`,
    },
    ...sections,
    missingDimensions: missingDimensions.length
      ? missingDimensions
      : ['No major structural gap detected; refine precision and examples'],
    strengths,
    weaknesses: weaknesses.length ? weaknesses : ['Precision of language and factual verification'],
    improvements: improvements.slice(0, 6),
    modelAnswer: input.modelAnswer,
    disclaimer: AI_EVALUATION_DISCLAIMER,
    mode: 'demo',
    generatedAt: new Date().toISOString(),
  };
}

function labelFor(key: string): string {
  const labels: Record<string, string> = {
    understanding: 'Grasp of the question',
    relevanceAccuracy: 'Relevance and accuracy',
    introduction: 'Introduction',
    body: 'Body structure and argument',
    examples: 'Examples and evidence',
    conclusion: 'Conclusion',
  };
  return labels[key] ?? key;
}

const EVALUATION_SYSTEM_PROMPT = `You are a strict but encouraging UPSC Mains answer evaluator.
Return ONLY a JSON object, no markdown fences, with this exact shape:
{
  "overall": {"score": number, "maxScore": number, "band": string, "summary": string},
  "understanding": {"score": number, "maxScore": 10, "feedback": string},
  "relevanceAccuracy": {"score": number, "maxScore": 10, "feedback": string},
  "introduction": {"score": number, "maxScore": 10, "feedback": string},
  "body": {"score": number, "maxScore": 10, "feedback": string},
  "examples": {"score": number, "maxScore": 10, "feedback": string},
  "conclusion": {"score": number, "maxScore": 10, "feedback": string},
  "missingDimensions": string[],
  "strengths": string[],
  "weaknesses": string[],
  "improvements": string[],
  "modelAnswer": string
}
Rules: be specific and actionable, refer to the candidate's actual text, do not invent citations or facts, do not promise UPSC marks, and set overall.maxScore to the question's marks. The evaluation is indicative.`;

export async function evaluateWithProvider(input: {
  questionText: string;
  answerText: string;
  marks: number;
}): Promise<EvaluationFeedback> {
  const status = getAIStatus();
  if (status.mode === 'demo') {
    throw new EvaluationError('AI provider is not configured.', 503, false);
  }
  let text: string;
  try {
    const result = await callAI({
      system: EVALUATION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Question (${input.marks} marks):\n${input.questionText}\n\nCandidate answer:\n${input.answerText}\n\nEvaluate now.`,
        },
      ],
      json: true,
      maxTokens: 2000,
    });
    text = result.text;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Evaluation service failed.';
    throw new EvaluationError(message, 502, true);
  }

  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new EvaluationError('The evaluation service returned an unreadable response. Please retry.', 502, true);
  }

  let feedback: EvaluationFeedback;
  try {
    feedback = validateEvaluation(parsed);
  } catch {
    throw new EvaluationError('The evaluation service returned an incomplete assessment. Please retry.', 502, true);
  }
  return {
    ...feedback,
    overall: {
      ...feedback.overall,
      score: Math.min(feedback.overall.score, input.marks),
      maxScore: input.marks,
    },
    disclaimer: AI_EVALUATION_DISCLAIMER,
    mode: 'live',
    generatedAt: new Date().toISOString(),
  };
}
