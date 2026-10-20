/** Small, explicit validators shared by the API routes and the tests. */

export interface FieldError {
  field: string;
  message: string;
}

export class ValidationError extends Error {
  errors: FieldError[];
  constructor(errors: FieldError[]) {
    super(errors[0]?.message ?? 'Invalid input');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PREPARATION_LEVELS = [
  'beginner',
  'intermediate',
  'advanced',
  'working-professional',
] as const;
export type PreparationLevel = (typeof PREPARATION_LEVELS)[number];

export const PREPARATION_LABEL: Record<string, string> = {
  beginner: 'Beginner (just starting)',
  intermediate: 'Intermediate (part-syllabus done)',
  advanced: 'Advanced (revision stage)',
  'working-professional': 'Working professional',
};

export function validateSignup(input: {
  name?: unknown;
  email?: unknown;
  password?: unknown;
}): { name: string; email: string; password: string } {
  const errors: FieldError[] = [];
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';

  if (name.length < 2 || name.length > 60) {
    errors.push({ field: 'name', message: 'Enter your name (2-60 characters).' });
  }
  if (!EMAIL_RE.test(email)) {
    errors.push({ field: 'email', message: 'Enter a valid email address.' });
  }
  if (password.length < 8) {
    errors.push({ field: 'password', message: 'Use at least 8 characters.' });
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Include at least one letter and one number.',
    });
  }
  if (errors.length) throw new ValidationError(errors);
  return { name, email, password };
}

export function validateLogin(input: { email?: unknown; password?: unknown }): {
  email: string;
  password: string;
} {
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';
  const errors: FieldError[] = [];
  if (!EMAIL_RE.test(email)) errors.push({ field: 'email', message: 'Enter a valid email address.' });
  if (!password) errors.push({ field: 'password', message: 'Enter your password.' });
  if (errors.length) throw new ValidationError(errors);
  return { email, password };
}

export function validateOnboarding(input: {
  examYear?: unknown;
  preparationLevel?: unknown;
  dailyGoalMinutes?: unknown;
}): { examYear: number; preparationLevel: PreparationLevel; dailyGoalMinutes: number } {
  const errors: FieldError[] = [];
  const currentYear = new Date().getUTCFullYear();
  const examYear = Number(input.examYear);
  const dailyGoalMinutes = Number(input.dailyGoalMinutes);
  const level = String(input.preparationLevel ?? '');

  if (!Number.isInteger(examYear) || examYear < currentYear || examYear > currentYear + 10) {
    errors.push({
      field: 'examYear',
      message: `Choose an exam year between ${currentYear} and ${currentYear + 10}.`,
    });
  }
  if (!PREPARATION_LEVELS.includes(level as PreparationLevel)) {
    errors.push({ field: 'preparationLevel', message: 'Choose your preparation level.' });
  }
  if (!Number.isInteger(dailyGoalMinutes) || dailyGoalMinutes < 15 || dailyGoalMinutes > 720) {
    errors.push({
      field: 'dailyGoalMinutes',
      message: 'Daily study time must be between 15 and 720 minutes.',
    });
  }
  if (errors.length) throw new ValidationError(errors);
  return {
    examYear,
    preparationLevel: level as PreparationLevel,
    dailyGoalMinutes,
  };
}

export function validateMentorQuestion(input: unknown): string {
  const text = typeof input === 'string' ? input.trim() : '';
  if (text.length < 3) throw new ValidationError([{ field: 'message', message: 'Type a question to continue.' }]);
  if (text.length > 2000) {
    throw new ValidationError([{ field: 'message', message: 'Keep your question under 2,000 characters.' }]);
  }
  return text;
}

export const MIN_ANSWER_WORDS = 40;
export const MAX_ANSWER_WORDS = 800;

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function validateAnswerSubmission(input: {
  questionText?: unknown;
  answerText?: unknown;
  subjectId?: unknown;
}): { questionText: string; answerText: string; subjectId: string | null; wordCount: number } {
  const errors: FieldError[] = [];
  const questionText =
    typeof input.questionText === 'string' ? input.questionText.trim() : '';
  const answerText = typeof input.answerText === 'string' ? input.answerText.trim() : '';
  const subjectId =
    typeof input.subjectId === 'string' && input.subjectId.trim() ? input.subjectId.trim() : null;
  const wordCount = countWords(answerText);

  if (questionText.length < 10) {
    errors.push({ field: 'questionText', message: 'Select or enter a question (at least 10 characters).' });
  }
  if (questionText.length > 1000) {
    errors.push({ field: 'questionText', message: 'Keep the question under 1,000 characters.' });
  }
  if (wordCount < MIN_ANSWER_WORDS) {
    errors.push({
      field: 'answerText',
      message: `Write at least ${MIN_ANSWER_WORDS} words so the evaluation is meaningful (currently ${wordCount}).`,
    });
  }
  if (wordCount > MAX_ANSWER_WORDS) {
    errors.push({
      field: 'answerText',
      message: `Keep the answer under ${MAX_ANSWER_WORDS} words (currently ${wordCount}).`,
    });
  }
  if (errors.length) throw new ValidationError(errors);
  return { questionText, answerText, subjectId, wordCount };
}

export interface EvaluationSection {
  score: number;
  maxScore: number;
  feedback: string;
}

export interface EvaluationFeedback {
  overall: {
    score: number;
    maxScore: number;
    band: string;
    summary: string;
  };
  understanding: EvaluationSection;
  relevanceAccuracy: EvaluationSection;
  introduction: EvaluationSection;
  body: EvaluationSection;
  examples: EvaluationSection;
  conclusion: EvaluationSection;
  missingDimensions: string[];
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  modelAnswer?: string;
  disclaimer: string;
  mode: 'demo' | 'live';
  generatedAt: string;
}

/**
 * Runtime validation for evaluation output. Used on provider responses and in
 * tests so the UI never renders a half-formed evaluation as a real result.
 */
export function validateEvaluation(value: unknown): EvaluationFeedback {
  const errors: string[] = [];
  if (!value || typeof value !== 'object') throw new Error('Evaluation is not an object');
  const v = value as Record<string, any>;
  const isSection = (section: unknown, max: number): boolean => {
    const s = section as Record<string, unknown> | undefined;
    return Boolean(
      s &&
        typeof s.score === 'number' &&
        s.score >= 0 &&
        s.score <= max &&
        typeof s.feedback === 'string' &&
        s.feedback.trim().length > 0,
    );
  };

  const overall = v.overall as Record<string, unknown> | undefined;
  if (!overall || typeof overall.score !== 'number' || typeof overall.maxScore !== 'number') {
    errors.push('overall score missing');
  } else if (overall.score < 0 || overall.score > overall.maxScore) {
    errors.push('overall score out of range');
  } else if (typeof overall.summary !== 'string' || !overall.summary.trim()) {
    errors.push('overall summary missing');
  }
  for (const key of ['understanding', 'relevanceAccuracy', 'introduction', 'body', 'examples', 'conclusion']) {
    if (!isSection(v[key], 10)) errors.push(`${key} invalid`);
  }
  for (const key of ['missingDimensions', 'strengths', 'weaknesses', 'improvements']) {
    if (!Array.isArray(v[key]) || v[key].some((item: unknown) => typeof item !== 'string')) {
      errors.push(`${key} must be a string array`);
    }
  }
  // Provider output may omit these two fields; the server injects the
  // disclaimer and the actual mode. An explicit invalid value is still rejected.
  if (v.disclaimer !== undefined && (typeof v.disclaimer !== 'string' || !v.disclaimer.trim())) {
    errors.push('disclaimer missing');
  }
  if (v.mode !== undefined && v.mode !== 'demo' && v.mode !== 'live') {
    errors.push('mode must be demo or live');
  }

  if (errors.length) throw new Error(`Invalid evaluation: ${errors.join(', ')}`);

  const section = (key: string): EvaluationSection => {
    const s = v[key] as Record<string, unknown>;
    return {
      score: Number(s.score),
      maxScore: Number(s.maxScore ?? 10),
      feedback: String(s.feedback),
    };
  };

  return {
    overall: {
      score: Number(overall!.score),
      maxScore: Number(overall!.maxScore),
      band: typeof overall!.band === 'string' ? overall!.band : 'Indicative',
      summary: String(overall!.summary),
    },
    understanding: section('understanding'),
    relevanceAccuracy: section('relevanceAccuracy'),
    introduction: section('introduction'),
    body: section('body'),
    examples: section('examples'),
    conclusion: section('conclusion'),
    missingDimensions: v.missingDimensions,
    strengths: v.strengths,
    weaknesses: v.weaknesses,
    improvements: v.improvements,
    modelAnswer: typeof v.modelAnswer === 'string' ? v.modelAnswer : undefined,
    disclaimer: v.disclaimer ?? 'This evaluation is AI-generated and indicative only.',
    mode: (v.mode as 'demo' | 'live' | undefined) ?? 'live',
    generatedAt: typeof v.generatedAt === 'string' ? v.generatedAt : new Date().toISOString(),
  };
}

export function sanitizeText(value: unknown, max = 5000): string {
  if (typeof value !== 'string') return '';
  // Strip control characters, keep normal whitespace.
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, max);
}
