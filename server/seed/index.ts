/**
 * Seeds the sample content and a demo learner account.
 *
 * Run with:  npm run seed        (keeps existing accounts)
 *            npm run seed:reset  (recreates the demo learner's data)
 */
import crypto from 'node:crypto';
import { addDaysIso, getDb, nowIso, todayIso } from '../db.ts';
import { hashPassword } from '../lib/auth.ts';
import { demoMentorAnswer } from '../lib/ai.ts';
import { buildDemoEvaluation } from '../lib/evaluator.ts';
import { ensureTodayTasks } from '../lib/study.ts';
import { lessons } from './content/lessons.ts';
import { questions } from './content/questions.ts';
import { articles } from './content/affairs.ts';
import { mainsQuestions } from './content/mains.ts';
import { subjects } from './content/subjects.ts';

export const DEMO_EMAIL = 'demo@studaymentor.app';
export const DEMO_PASSWORD = 'Demo@1234';

function upsertContent(): void {
  const db = getDb();
  const subjectStmt = db.prepare(
    `INSERT INTO subjects (id, name, syllabus_section, description, accent, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, syllabus_section = excluded.syllabus_section,
       description = excluded.description, accent = excluded.accent, sort_order = excluded.sort_order`,
  );
  for (const subject of subjects) {
    subjectStmt.run(
      subject.id,
      subject.name,
      subject.syllabusSection,
      subject.description,
      subject.accent,
      subject.sortOrder,
    );
  }

  const lessonStmt = db.prepare(
    `INSERT INTO lessons (id, subject_id, title, summary, content, objectives, estimated_minutes, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET subject_id = excluded.subject_id, title = excluded.title,
       summary = excluded.summary, content = excluded.content, objectives = excluded.objectives,
       estimated_minutes = excluded.estimated_minutes, sort_order = excluded.sort_order`,
  );
  for (const lesson of lessons) {
    lessonStmt.run(
      lesson.id,
      lesson.subjectId,
      lesson.title,
      lesson.summary,
      lesson.content,
      JSON.stringify(lesson.objectives),
      lesson.estimatedMinutes,
      lesson.sortOrder,
      nowIso(),
    );
  }

  const questionStmt = db.prepare(
    `INSERT INTO questions (id, subject_id, topic, exam_year, question_text, options, correct_answer,
       explanation, difficulty, source, question_type, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET subject_id = excluded.subject_id, topic = excluded.topic,
       exam_year = excluded.exam_year, question_text = excluded.question_text, options = excluded.options,
       correct_answer = excluded.correct_answer, explanation = excluded.explanation,
       difficulty = excluded.difficulty, source = excluded.source, question_type = excluded.question_type`,
  );
  for (const question of questions) {
    questionStmt.run(
      question.id,
      question.subjectId,
      question.topic,
      question.examYear,
      question.questionText,
      JSON.stringify(question.options),
      question.correctAnswer,
      question.explanation,
      question.difficulty,
      question.source,
      question.questionType,
      nowIso(),
    );
  }

  const articleStmt = db.prepare(
    `INSERT INTO current_affairs (id, title, summary, content, subject_id, source_url, source_label,
       published_at, prelims_facts, mains_relevance, related_topic, is_demo, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
     ON CONFLICT(id) DO UPDATE SET title = excluded.title, summary = excluded.summary,
       content = excluded.content, subject_id = excluded.subject_id, source_url = excluded.source_url,
       source_label = excluded.source_label, published_at = excluded.published_at,
       prelims_facts = excluded.prelims_facts, mains_relevance = excluded.mains_relevance,
       related_topic = excluded.related_topic`,
  );
  for (const article of articles) {
    articleStmt.run(
      article.id,
      article.title,
      article.summary,
      article.content,
      article.subjectId,
      article.sourceUrl,
      article.sourceLabel,
      article.publishedAt,
      JSON.stringify(article.prelimsFacts),
      article.mainsRelevance,
      article.relatedTopic,
      nowIso(),
    );
  }
}

function createDemoLearner(): { userId: string; created: boolean } {
  const db = getDb();
  const existing = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(DEMO_EMAIL) as { id: string } | undefined;
  if (existing) return { userId: existing.id, created: false };

  const userId = crypto.randomUUID();
  const createdAt = nowIso();
  const examYear = new Date().getUTCFullYear() + 1;

  db.prepare(
    'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
  ).run(userId, DEMO_EMAIL, hashPassword(DEMO_PASSWORD), createdAt);
  db.prepare(
    `INSERT INTO profiles (id, name, email, exam_year, preparation_level, daily_goal_minutes,
       onboarding_complete, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
  ).run(userId, 'Ananya Rao', DEMO_EMAIL, examYear, 'intermediate', 150, createdAt);

  // Completed lessons across the past week
  const completed = [
    ['polity-preamble', 5],
    ['history-freedom', 4],
    ['geography-monsoon', 3],
    ['economy-monetary', 2],
  ] as const;
  const progressStmt = db.prepare(
    'INSERT OR IGNORE INTO lesson_progress (user_id, lesson_id, completed_at) VALUES (?, ?, ?)',
  );
  const taskStmt = db.prepare(
    `INSERT INTO study_tasks (id, user_id, lesson_id, title, kind, due_date, status, completed_at, created_at)
     VALUES (?, ?, ?, ?, 'lesson', ?, 'completed', ?, ?)`,
  );
  for (const [lessonId, daysAgo] of completed) {
    const date = addDaysIso(todayIso(), -daysAgo);
    const completedAt = `${date}T14:30:00.000Z`;
    progressStmt.run(userId, lessonId, completedAt);
    const lesson = lessons.find((item) => item.id === lessonId);
    if (lesson) {
      taskStmt.run(
        crypto.randomUUID(),
        userId,
        lessonId,
        `Study: ${lesson.title}`,
        date,
        completedAt,
        `${date}T08:00:00.000Z`,
      );
    }
    // An additional completed practice task so the history is not empty.
    db.prepare(
      `INSERT INTO study_tasks (id, user_id, lesson_id, title, kind, due_date, status, completed_at, created_at)
       VALUES (?, ?, NULL, 'Practice 10 mixed MCQs', 'practice', ?, 'completed', ?, ?)`,
    ).run(crypto.randomUUID(), userId, date, `${date}T17:00:00.000Z`, `${date}T08:00:00.000Z`);
  }

  // Attempts with a realistic mix of correct and incorrect answers.
  const attemptPlan: Array<[string, number, number]> = [
    ['q-pol-01', 1, 6],
    ['q-pol-02', 3, 6],
    ['q-his-01', 2, 5],
    ['q-his-03', 0, 5],
    ['q-geo-01', 1, 4],
    ['q-geo-03', 1, 4],
    ['q-eco-01', 1, 3],
    ['q-eco-03', 0, 3],
    ['q-eco-05', 1, 3],
    ['q-env-02', 1, 2],
    ['q-env-01', 1, 2],
    ['q-sci-01', 1, 1],
    ['q-sci-04', 0, 1],
    ['q-eth-02', 1, 1],
    ['q-eth-01', 1, 1],
    ['q-pol-03', 1, 1],
    ['q-pol-04', 2, 0],
    ['q-his-02', 1, 0],
  ];
  const attemptStmt = db.prepare(
    `INSERT INTO attempts (id, user_id, question_id, selected_answer, is_correct, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  for (const [questionId, selected, daysAgo] of attemptPlan) {
    const question = questions.find((item) => item.id === questionId);
    if (!question) continue;
    const date = addDaysIso(todayIso(), -daysAgo);
    const createdAt = `${date}T${daysAgo === 0 ? '09:20' : '18:10'}:00.000Z`;
    attemptStmt.run(
      crypto.randomUUID(),
      userId,
      questionId,
      selected,
      selected === question.correctAnswer ? 1 : 0,
      createdAt,
    );
  }

  // Conversation with the demo mentor
  const conversationId = crypto.randomUUID();
  const question = 'Explain the basic structure doctrine and why it matters for UPSC.';
  db.prepare(
    'INSERT INTO conversations (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
  ).run(
    conversationId,
    userId,
    'Basic structure doctrine',
    `${addDaysIso(todayIso(), -1)}T10:00:00.000Z`,
    `${addDaysIso(todayIso(), -1)}T10:02:00.000Z`,
  );
  const userMessageId = crypto.randomUUID();
  const answer = demoMentorAnswer(question);
  const assistantMessageId = crypto.randomUUID();
  db.prepare(
    'INSERT INTO messages (id, conversation_id, role, content, source_metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(
    userMessageId,
    conversationId,
    'user',
    question,
    '{}',
    `${addDaysIso(todayIso(), -1)}T10:00:00.000Z`,
  );
  db.prepare(
    'INSERT INTO messages (id, conversation_id, role, content, source_metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(
    assistantMessageId,
    conversationId,
    'assistant',
    answer.content,
    JSON.stringify({ mode: 'demo', sources: answer.sources }),
    `${addDaysIso(todayIso(), -1)}T10:02:00.000Z`,
  );

  // Saved bookmarks
  const bookmarkStmt = db.prepare(
    'INSERT OR IGNORE INTO bookmarks (id, user_id, item_type, item_id, created_at) VALUES (?, ?, ?, ?, ?)',
  );
  bookmarkStmt.run(crypto.randomUUID(), userId, 'lesson', 'polity-preamble', `${addDaysIso(todayIso(), -5)}T14:35:00.000Z`);
  bookmarkStmt.run(crypto.randomUUID(), userId, 'question', 'q-env-02', `${addDaysIso(todayIso(), -2)}T18:20:00.000Z`);
  bookmarkStmt.run(crypto.randomUUID(), userId, 'article', 'ca-30x30', `${addDaysIso(todayIso(), -1)}T09:00:00.000Z`);
  bookmarkStmt.run(crypto.randomUUID(), userId, 'explanation', assistantMessageId, `${addDaysIso(todayIso(), -1)}T10:05:00.000Z`);

  // One saved Mains evaluation using the demo rubric
  const mains = mainsQuestions[0];
  const sampleAnswer = `The basic structure doctrine emerged from Kesavananda Bharati (1973), where the Supreme Court held that Parliament's amending power under Article 368 cannot be used to destroy the essential features of the Constitution. It was applied in Indira Nehru Gandhi (1975) and reinforced in Minerva Mills (1980).

The doctrine strengthens constitutionalism because it protects judicial review, free and fair elections, federalism and secularism from transient majorities. For example, it prevents amendments that would undermine the ability of citizens to hold government accountable. It also gives courts a principled basis to review constitutional amendments, not merely their procedure.

However, critics argue that the list of basic features is open-ended and that judges may substitute their own preferences for legislative choices. The doctrine is not mentioned in the constitutional text, which makes its legitimacy contested. On the other hand, it is used rarely and only where a core feature is clearly damaged.

On balance, the doctrine is a necessary but exceptional safeguard. It should be applied with reasoned restraint, clear identification of the threatened feature and deference to policy choices. A way forward is to articulate the protected features with greater precision while preserving the Court's ability to respond to new threats.`;
  const feedback = buildDemoEvaluation({
    questionText: mains.question,
    answerText: sampleAnswer,
    marks: mains.marks,
    modelAnswer: mains.modelAnswer,
  });
  db.prepare(
    `INSERT INTO answer_submissions (id, user_id, question_text, subject_id, answer_text, word_count,
       feedback_json, mode, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'demo', ?)`,
  ).run(
    crypto.randomUUID(),
    userId,
    mains.question,
    mains.subjectId,
    sampleAnswer,
    sampleAnswer.trim().split(/\s+/).length,
    JSON.stringify(feedback),
    `${addDaysIso(todayIso(), -2)}T20:00:00.000Z`,
  );

  ensureTodayTasks(userId);
  return { userId, created: true };
}

export interface SeedResult {
  demoEmail: string;
  demoPassword: string;
  createdDemoUser: boolean;
  counts: { subjects: number; lessons: number; questions: number; articles: number; mains: number };
}

export function seedDatabase(
  options: { reset?: boolean; quiet?: boolean; demo?: boolean } = {},
): SeedResult {
  const db = getDb();
  if (options.reset) {
    db.prepare('DELETE FROM users WHERE email = ?').run(DEMO_EMAIL);
  }
  upsertContent();
  const demo = options.demo === false ? { created: false, userId: null } : createDemoLearner();

  const count = (table: string) =>
    Number((db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as any).c);
  const result: SeedResult = {
    demoEmail: DEMO_EMAIL,
    demoPassword: DEMO_PASSWORD,
    createdDemoUser: demo.created,
    counts: {
      subjects: count('subjects'),
      lessons: count('lessons'),
      questions: count('questions'),
      articles: count('current_affairs'),
      mains: mainsQuestions.length,
    },
  };
  if (!options.quiet) {
    console.log(
      `Seed complete: ${result.counts.subjects} subjects, ${result.counts.lessons} lessons, ` +
        `${result.counts.questions} questions, ${result.counts.articles} sample articles, ` +
        `${result.counts.mains} Mains prompts.`,
    );
    if (options.demo !== false) {
      console.log(`Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
    } else {
      console.log('Demo account skipped.');
    }
  }
  return result;
}

const isDirectRun = process.argv[1]?.includes('seed');
if (isDirectRun) {
  const reset = process.argv.includes('--reset');
  const demo = !process.argv.includes('--no-demo') && process.env.SEED_DEMO_ACCOUNT !== 'false';
  seedDatabase({ reset, demo });
}
