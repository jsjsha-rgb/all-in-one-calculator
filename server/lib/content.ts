import { getDb, jsonParse } from '../db.ts';

export interface PublicQuestion {
  id: string;
  subjectId: string;
  topic: string;
  examYear: number | null;
  questionText: string;
  options: string[];
  difficulty: string;
  source: string;
  questionType: string;
}

/** Strips the answer and explanation so the client cannot inspect them early. */
export function mapQuestionPublic(row: any): PublicQuestion {
  return {
    id: String(row.id),
    subjectId: String(row.subject_id),
    topic: String(row.topic),
    examYear: row.exam_year === null ? null : Number(row.exam_year),
    questionText: String(row.question_text),
    options: jsonParse<string[]>(String(row.options), []),
    difficulty: String(row.difficulty),
    source: String(row.source),
    questionType: String(row.question_type ?? 'mcq'),
  };
}

export function getSubjectsForUser(userId: string | null) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT s.*, COUNT(l.id) AS lesson_count
       FROM subjects s LEFT JOIN lessons l ON l.subject_id = s.id
       GROUP BY s.id ORDER BY s.sort_order`,
    )
    .all() as any[];
  const completed = userId
    ? (db
        .prepare(
          `SELECT l.subject_id, COUNT(*) AS c FROM lesson_progress p
           JOIN lessons l ON l.id = p.lesson_id WHERE p.user_id = ? GROUP BY l.subject_id`,
        )
        .all(userId) as any[])
    : [];
  const completedMap = new Map(completed.map((row) => [String(row.subject_id), Number(row.c)]));
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    syllabusSection: String(row.syllabus_section),
    description: String(row.description),
    accent: String(row.accent),
    lessonCount: Number(row.lesson_count),
    completedCount: completedMap.get(String(row.id)) ?? 0,
  }));
}

export function getSubjectDetail(subjectId: string, userId: string | null) {
  const db = getDb();
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subjectId) as any;
  if (!subject) return null;
  const lessons = db
    .prepare('SELECT * FROM lessons WHERE subject_id = ? ORDER BY sort_order')
    .all(subjectId) as any[];
  const progress = userId
    ? (db
        .prepare(
          `SELECT p.lesson_id FROM lesson_progress p JOIN lessons l ON l.id = p.lesson_id
           WHERE p.user_id = ? AND l.subject_id = ?`,
        )
        .all(userId, subjectId) as any[])
    : [];
  const completedSet = new Set(progress.map((row) => String(row.lesson_id)));
  return {
    id: String(subject.id),
    name: String(subject.name),
    syllabusSection: String(subject.syllabus_section),
    description: String(subject.description),
    accent: String(subject.accent),
    lessons: lessons.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      summary: String(row.summary),
      estimatedMinutes: Number(row.estimated_minutes),
      completed: completedSet.has(String(row.id)),
      objectives: jsonParse<string[]>(String(row.objectives), []).length,
    })),
    completedCount: lessons.filter((row) => completedSet.has(String(row.id))).length,
    lessonCount: lessons.length,
  };
}

export function getLessonDetail(lessonId: string, userId: string | null) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT l.*, s.name AS subject_name, s.syllabus_section, s.accent
       FROM lessons l JOIN subjects s ON s.id = l.subject_id WHERE l.id = ?`,
    )
    .get(lessonId) as any;
  if (!row) return null;
  const siblings = db
    .prepare(
      `SELECT l.id, l.title FROM lessons l JOIN subjects s ON s.id = l.subject_id
       WHERE l.subject_id = ? ORDER BY l.sort_order`,
    )
    .all(String(row.subject_id)) as any[];
  const position = siblings.findIndex((item) => String(item.id) === lessonId);
  const completed = userId
    ? Boolean(
        db
          .prepare('SELECT 1 FROM lesson_progress WHERE user_id = ? AND lesson_id = ?')
          .get(userId, lessonId),
      )
    : false;
  const bookmarked = userId
    ? Boolean(
        db
          .prepare(
            `SELECT 1 FROM bookmarks WHERE user_id = ? AND item_type = 'lesson' AND item_id = ?`,
          )
          .get(userId, lessonId),
      )
    : false;
  const quizCount = Number(
    (
      db
        .prepare('SELECT COUNT(*) AS c FROM questions WHERE subject_id = ?')
        .get(String(row.subject_id)) as any
    ).c,
  );
  return {
    id: String(row.id),
    subjectId: String(row.subject_id),
    subjectName: String(row.subject_name),
    syllabusSection: String(row.syllabus_section),
    accent: String(row.accent),
    title: String(row.title),
    summary: String(row.summary),
    content: String(row.content),
    objectives: jsonParse<string[]>(String(row.objectives), []),
    estimatedMinutes: Number(row.estimated_minutes),
    completed,
    bookmarked,
    quizCount,
    nextLesson: position >= 0 && siblings[position + 1]
      ? { id: String(siblings[position + 1].id), title: String(siblings[position + 1].title) }
      : null,
    previousLesson: position > 0
      ? { id: String(siblings[position - 1].id), title: String(siblings[position - 1].title) }
      : null,
  };
}

export function mapArticle(row: any, bookmarked = false) {
  return {
    id: String(row.id),
    title: String(row.title),
    summary: String(row.summary),
    content: String(row.content),
    subjectId: String(row.subject_id),
    subjectName: String(row.subject_name ?? ''),
    syllabusSection: String(row.syllabus_section ?? ''),
    sourceUrl: String(row.source_url),
    sourceLabel: String(row.source_label),
    publishedAt: String(row.published_at),
    prelimsFacts: jsonParse<string[]>(String(row.prelims_facts), []),
    mainsRelevance: String(row.mains_relevance),
    relatedTopic: row.related_topic ? String(row.related_topic) : null,
    isDemo: Number(row.is_demo) === 1,
    bookmarked,
    createdAt: String(row.created_at),
  };
}
