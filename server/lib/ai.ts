/**
 * AI provider layer.
 *
 * All provider credentials stay server-side. The client only learns whether the
 * app is in `demo` or `live` mode through /api/ai/status. If a key is missing,
 * requests are answered by the transparent demo engine below and clearly
 * labelled as such.
 */
import { getDb } from '../db.ts';
import type { SeedLesson } from '../seed/types';

export type AIProvider = 'gemini' | 'openai' | 'demo';

export interface AIStatus {
  mode: 'demo' | 'live';
  provider: AIProvider;
  model: string;
  reason?: string;
}

export class AIProviderError extends Error {
  status: number;
  retryable: boolean;
  constructor(message: string, status = 502, retryable = true) {
    super(message);
    this.name = 'AIProviderError';
    this.status = status;
    this.retryable = retryable;
  }
}

export function getAIStatus(): AIStatus {
  const explicit = (process.env.AI_PROVIDER || '').trim().toLowerCase();
  const geminiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim();

  if (explicit === 'gemini' || (!explicit && geminiKey)) {
    if (!geminiKey) {
      return {
        mode: 'demo',
        provider: 'demo',
        model: 'demo-studymentor',
        reason: 'AI_PROVIDER is set to gemini but GEMINI_API_KEY is missing. Falling back to demo mode.',
      };
    }
    return {
      mode: 'live',
      provider: 'gemini',
      model: (process.env.AI_MODEL || 'gemini-2.5-flash').trim(),
    };
  }

  if (explicit === 'openai' || (!explicit && openaiKey)) {
    if (!openaiKey) {
      return {
        mode: 'demo',
        provider: 'demo',
        model: 'demo-studymentor',
        reason: 'AI_PROVIDER is set to openai but OPENAI_API_KEY is missing. Falling back to demo mode.',
      };
    }
    return {
      mode: 'live',
      provider: 'openai',
      model: (process.env.AI_MODEL || 'gpt-4o-mini').trim(),
    };
  }

  return {
    mode: 'demo',
    provider: 'demo',
    model: 'demo-studymentor',
    reason: 'No AI provider credentials configured. Using the built-in demo mentor.',
  };
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface CallAIOptions {
  system: string;
  messages: ChatMessage[];
  json?: boolean;
  maxTokens?: number;
}

const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 30000);

async function withTimeout<T>(run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await run(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new AIProviderError('The AI service took too long to respond. Please retry.', 504, true);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function callAI(options: CallAIOptions): Promise<{ text: string; status: AIStatus }> {
  const status = getAIStatus();
  if (status.mode === 'demo') {
    throw new AIProviderError('AI provider is not configured (demo mode).', 503, false);
  }

  const maxTokens = options.maxTokens ?? 1600;

  if (status.provider === 'gemini') {
    const key = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      status.model,
    )}:generateContent?key=${encodeURIComponent(key)}`;
    const body = {
      system_instruction: { parts: [{ text: options.system }] },
      contents: options.messages.map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      })),
      generationConfig: {
        temperature: options.json ? 0.2 : 0.5,
        maxOutputTokens: maxTokens,
        ...(options.json ? { responseMimeType: 'application/json' } : {}),
      },
    };
    return withTimeout(async (signal) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        console.error('Gemini error', response.status, detail.slice(0, 300));
        throw new AIProviderError(
          response.status === 429
            ? 'The AI service is rate-limited right now. Please retry shortly.'
            : 'The AI service returned an error. Please retry.',
          502,
          true,
        );
      }
      const data = (await response.json()) as any;
      const text = (data?.candidates?.[0]?.content?.parts ?? [])
        .map((part: any) => part?.text ?? '')
        .join('')
        .trim();
      if (!text) throw new AIProviderError('The AI service returned an empty response. Please retry.');
      return { text, status };
    });
  }

  // OpenAI-compatible chat completions
  const key = (process.env.OPENAI_API_KEY || '').trim();
  const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const body = {
    model: status.model,
    temperature: options.json ? 0.2 : 0.5,
    max_tokens: maxTokens,
    messages: [{ role: 'system', content: options.system }, ...options.messages],
    ...(options.json ? { response_format: { type: 'json_object' } } : {}),
  };
  return withTimeout(async (signal) => {
    const response = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
      signal,
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('OpenAI-compatible error', response.status, detail.slice(0, 300));
      throw new AIProviderError(
        response.status === 429
          ? 'The AI service is rate-limited right now. Please retry shortly.'
          : 'The AI service returned an error. Please retry.',
        502,
        true,
      );
    }
    const data = (await response.json()) as any;
    const text = String(data?.choices?.[0]?.message?.content ?? '').trim();
    if (!text) throw new AIProviderError('The AI service returned an empty response. Please retry.');
    return { text, status };
  });
}

// --------------------------------------------------------------------------
// Demo mentor: a transparent, retrieval-based answer built from app content.
// --------------------------------------------------------------------------

const STOPWORDS = new Set([
  'about','after','again','also','among','and','are','because','been','before','being','between',
  'both','but','can','could','does','explain','for','from','have','how','into','its','just','like',
  'more','most','not','now','other','our','out','over','please','should','some','such','than','that',
  'the','their','them','then','there','these','they','this','those','through','under','what','when',
  'where','which','while','who','why','will','with','would','your','tell','help','understand','upsc',
  'answer','question','main','mains','prelims','topic','concept',
]);

function keywords(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length > 3 && !STOPWORDS.has(word)),
    ),
  );
}

interface DemoMatch {
  lesson: SeedLesson;
  subjectName: string;
  syllabusSection: string;
  score: number;
}

function findLessonMatches(question: string, limit = 2): DemoMatch[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT l.*, s.name AS subject_name, s.syllabus_section
       FROM lessons l JOIN subjects s ON s.id = l.subject_id`,
    )
    .all() as any[];
  const terms = keywords(question);
  const matches: DemoMatch[] = rows.map((row) => {
    const haystack = `${row.title} ${row.summary} ${row.content} ${row.topic ?? ''}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (haystack.includes(term)) score += 2;
      if (String(row.title).toLowerCase().includes(term)) score += 3;
    }
    return {
      lesson: {
        id: row.id,
        subjectId: row.subject_id,
        title: row.title,
        summary: row.summary,
        content: row.content,
        objectives: JSON.parse(row.objectives || '[]'),
        estimatedMinutes: row.estimated_minutes,
        sortOrder: row.sort_order,
      },
      subjectName: row.subject_name,
      syllabusSection: row.syllabus_section,
      score,
    };
  });
  return matches
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score || a.lesson.sortOrder - b.lesson.sortOrder)
    .slice(0, limit);
}

function firstParagraph(content: string): string {
  const withoutHeadings = content
    .split('\n')
    .filter((line) => !line.startsWith('##') && !line.startsWith('#'))
    .join('\n')
    .trim();
  const paragraph = withoutHeadings.split(/\n\n+/)[0] ?? '';
  return paragraph.replace(/[*_`]/g, '').trim();
}

function bulletsFrom(content: string, limit = 3): string[] {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .slice(0, limit)
    .map((line) => line.replace(/^-\s*/, ''));
}

export function demoMentorAnswer(question: string): {
  content: string;
  sources: Array<{ title: string; type: string; id: string }>;
} {
  const db = getDb();
  const matches = findLessonMatches(question);

  if (!matches.length) {
    return {
      content: `### A structured way to approach this

I could not match this question to a specific lesson in the sample library, so here is a general framework you can use.

1. **Define the key term.** State what the question is really asking, and define the central concept in one or two sentences.
2. **Locate it in the syllabus.** Decide whether it belongs to GS I (history, geography, society), GS II (polity, governance, international relations), GS III (economy, environment, science) or GS IV (ethics).
3. **Build both sides.** Write two or three arguments for the proposition and two or three against it, each with an example, scheme, committee or case.
4. **Answer the directive.** "Examine" needs causes and consequences; "Discuss" needs a balanced treatment; "Critically examine" needs an explicit judgement.
5. **Close with a way forward.** Suggest a practical, institutionally specific step rather than a slogan.

> **Demo mode:** this response comes from StudyMentor's built-in study library, not an external AI model. Connect an AI provider key on the server to enable live answers.

Try asking about a specific subject, for example: *Explain the basic structure doctrine*, *How does fiscal deficit differ from revenue deficit?*, or *Discuss the role of the monsoon in Indian agriculture*.`,
      sources: [],
    };
  }

  const primary = matches[0];
  const related = matches[1];
  const objectives: string[] = primary.lesson.objectives ?? [];
  const keyPoints = bulletsFrom(primary.lesson.content, 4);
  const questionRow = db
    .prepare(
      `SELECT question_text FROM questions WHERE subject_id = ? AND topic = ? ORDER BY difficulty LIMIT 1`,
    )
    .get(primary.lesson.subjectId, primary.lesson.title.split(':')[0].trim()) as
    | { question_text: string }
    | undefined;

  const sections = [
    `### Direct answer`,
    `${firstParagraph(primary.lesson.content)}`,
    ``,
    `### Key points`,
    ...(keyPoints.length
      ? keyPoints.map((point) => `- ${point}`)
      : objectives.slice(0, 3).map((point) => `- ${point}`)),
    ``,
    `### Syllabus link`,
    `This sits in **${primary.subjectName}** (${primary.syllabusSection}) and connects most naturally to the lesson **${primary.lesson.title}**.`,
    ``,
    `### Revision checkpoints`,
    ...objectives.slice(0, 3).map((objective) => `- Can you ${objective.charAt(0).toLowerCase()}${objective.slice(1)}?`),
    ``,
    `### Practice next`,
    questionRow
      ? `- Attempt a practice question on this area: "${questionRow.question_text.split('\n')[0]}" (Practice tab, filter by this subject).`
      : `- Open the Practice tab and filter by ${primary.subjectName} to attempt related questions.`,
    related ? `- Then compare with **${related.lesson.title}** to connect the concepts.` : '',
    ``,
    `### Sources`,
    `- StudyMentor lesson: ${primary.lesson.title}`,
    related ? `- StudyMentor lesson: ${related.lesson.title}` : '',
    ``,
    `> **Demo mode:** generated from StudyMentor's internal sample library. It is a study aid, not an official source, and no external AI model was called.`,
  ].filter((line) => line !== null);

  return {
    content: sections.join('\n').replace(/\n{3,}/g, '\n\n'),
    sources: [
      { title: primary.lesson.title, type: 'lesson', id: primary.lesson.id },
      ...(related ? [{ title: related.lesson.title, type: 'lesson', id: related.lesson.id }] : []),
    ],
  };
}

export const MENTOR_SYSTEM_PROMPT = `You are StudyMentor, a patient UPSC Civil Services tutor for Indian aspirants.
Rules:
- Explain in clear, simple English with Indian administrative examples where useful.
- Use short markdown sections: Direct answer, Key points, Syllabus link, Revision checkpoints, Practice next, Sources.
- Connect the answer to the relevant GS paper and syllabus area.
- Never invent citations, case names, data points, committee reports or news. If you are not certain, say so plainly.
- Only list Sources when an actual reference is available; otherwise omit that section.
- End with one short confidence-building revision tip.
- Do not claim to be an official UPSC source, and do not promise marks.`;

export function buildDemoConversationTitle(question: string): string {
  const clean = question.replace(/\s+/g, ' ').trim();
  return clean.length > 60 ? `${clean.slice(0, 57)}...` : clean || 'New conversation';
}
