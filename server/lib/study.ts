import crypto from 'node:crypto';
import { addDaysIso, getDb, jsonParse, nowIso, todayIso } from '../db.ts';

export interface StudyTask {
  id: string;
  title: string;
  kind: string;
  lessonId: string | null;
  dueDate: string;
  status: 'pending' | 'completed';
  completedAt: string | null;
  estimatedMinutes: number;
}

export function mapTask(row: any): StudyTask {
  return {
    id: String(row.id),
    title: String(row.title),
    kind: String(row.kind),
    lessonId: row.lesson_id ? String(row.lesson_id) : null,
    dueDate: String(row.due_date),
    status: row.status === 'completed' ? 'completed' : 'pending',
    completedAt: row.completed_at ? String(row.completed_at) : null,
    estimatedMinutes: row.estimated_minutes
      ? Number(row.estimated_minutes)
      : row.kind === 'practice'
        ? 25
        : row.kind === 'current-affairs'
          ? 15
          : 20,
  };
}

/**
 * Creates today's plan only if none exists yet. Chooses the next lessons the
 * learner has not completed, plus one practice block and one current-affairs
 * block, then trims the plan to the daily time goal.
 */
export function ensureTodayTasks(userId: string): StudyTask[] {
  const db = getDb();
  const today = todayIso();
  const existing = db
    .prepare(
      `SELECT t.*, l.estimated_minutes FROM study_tasks t
       LEFT JOIN lessons l ON l.id = t.lesson_id
       WHERE t.user_id = ? AND t.due_date = ? ORDER BY t.created_at`,
    )
    .all(userId, today) as any[];
  if (existing.length) return existing.map(mapTask);

  const profile = db
    .prepare('SELECT daily_goal_minutes FROM profiles WHERE id = ?')
    .get(userId) as { daily_goal_minutes?: number } | undefined;
  const goal = Number(profile?.daily_goal_minutes ?? 120);

  const lessons = db
    .prepare(
      `SELECT l.id, l.title, l.estimated_minutes
       FROM lessons l
       JOIN subjects s ON s.id = l.subject_id
       WHERE l.id NOT IN (SELECT lesson_id FROM lesson_progress WHERE user_id = ?)
       ORDER BY s.sort_order, l.sort_order
       LIMIT 3`,
    )
    .all(userId) as any[];

  const insert = db.prepare(
    `INSERT INTO study_tasks (id, user_id, lesson_id, title, kind, due_date, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
  );
  const created: string[] = [];
  let plannedMinutes = 0;
  for (const lesson of lessons) {
    if (plannedMinutes + Number(lesson.estimated_minutes) > goal + 20) break;
    const id = crypto.randomUUID();
    insert.run(id, userId, lesson.id, `Study: ${lesson.title}`, 'lesson', today, nowIso());
    created.push(id);
    plannedMinutes += Number(lesson.estimated_minutes);
  }

  const practiceId = crypto.randomUUID();
  insert.run(practiceId, userId, null, 'Practice 10 mixed MCQs', 'practice', today, nowIso());
  created.push(practiceId);

  const affairsId = crypto.randomUUID();
  insert.run(
    affairsId,
    userId,
    null,
    'Review today\u2019s current-affairs brief',
    'current-affairs',
    today,
    nowIso(),
  );
  created.push(affairsId);

  const placeholders = created.map(() => '?').join(',');
  const rows = db
    .prepare(
      `SELECT t.*, l.estimated_minutes FROM study_tasks t
       LEFT JOIN lessons l ON l.id = t.lesson_id
       WHERE t.id IN (${placeholders}) ORDER BY t.created_at`,
    )
    .all(...created) as any[];
  return rows.map(mapTask);
}

export function getStreak(userId: string): number {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT DISTINCT day FROM (
         SELECT substr(completed_at, 1, 10) AS day FROM study_tasks
         WHERE user_id = ? AND status = 'completed' AND completed_at IS NOT NULL
         UNION
         SELECT substr(created_at, 1, 10) AS day FROM attempts WHERE user_id = ?
         UNION
         SELECT substr(completed_at, 1, 10) AS day FROM lesson_progress WHERE user_id = ?
       ) ORDER BY day DESC`,
    )
    .all(userId, userId, userId) as Array<{ day: string }>;
  const days = new Set(rows.map((row) => row.day));
  const today = todayIso();
  let cursor = days.has(today) ? today : addDaysIso(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDaysIso(cursor, -1);
  }
  return streak;
}

export function getWeakTopics(userId: string, limit = 5): Array<{
  topic: string;
  subjectId: string;
  subjectName: string;
  attempts: number;
  accuracy: number;
}> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT q.topic, q.subject_id, s.name AS subject_name,
              COUNT(a.id) AS attempts,
              SUM(a.is_correct) AS correct
       FROM attempts a
       JOIN questions q ON q.id = a.question_id
       JOIN subjects s ON s.id = q.subject_id
       WHERE a.user_id = ?
       GROUP BY q.topic, q.subject_id
       HAVING attempts >= 1
       ORDER BY (CAST(SUM(a.is_correct) AS REAL) / COUNT(a.id)) ASC, attempts DESC
       LIMIT ?`,
    )
    .all(userId, limit) as any[];
  return rows
    .map((row) => ({
      topic: String(row.topic),
      subjectId: String(row.subject_id),
      subjectName: String(row.subject_name),
      attempts: Number(row.attempts),
      accuracy: Math.round((Number(row.correct) / Number(row.attempts)) * 100),
    }))
    .filter((row) => row.accuracy < 100);
}

export interface UserStats {
  lessonsCompleted: number;
  lessonsTotal: number;
  questionsAttempted: number;
  questionsCorrect: number;
  accuracy: number;
  streak: number;
  bookmarks: number;
  savedExplanations: number;
  mainsSubmissions: number;
  studyMinutes: number;
}

export function getUserStats(userId: string): UserStats {
  const db = getDb();
  const lessonsCompleted = Number(
    (db.prepare('SELECT COUNT(*) AS c FROM lesson_progress WHERE user_id = ?').get(userId) as any).c,
  );
  const lessonsTotal = Number((db.prepare('SELECT COUNT(*) AS c FROM lessons').get() as any).c);
  const attemptAgg = db
    .prepare(
      'SELECT COUNT(*) AS total, COALESCE(SUM(is_correct), 0) AS correct FROM attempts WHERE user_id = ?',
    )
    .get(userId) as any;
  const questionsAttempted = Number(attemptAgg.total);
  const questionsCorrect = Number(attemptAgg.correct);
  const bookmarks = Number(
    (db.prepare('SELECT COUNT(*) AS c FROM bookmarks WHERE user_id = ?').get(userId) as any).c,
  );
  const savedExplanations = Number(
    (
      db
        .prepare(
          `SELECT COUNT(*) AS c FROM bookmarks WHERE user_id = ? AND item_type = 'explanation'`,
        )
        .get(userId) as any
    ).c,
  );
  const mainsSubmissions = Number(
    (db.prepare('SELECT COUNT(*) AS c FROM answer_submissions WHERE user_id = ?').get(userId) as any).c,
  );
  const studyMinutes = Number(
    (
      db
        .prepare(
          `SELECT COALESCE(SUM(l.estimated_minutes), 0) AS m FROM lesson_progress p
           JOIN lessons l ON l.id = p.lesson_id WHERE p.user_id = ?`,
        )
        .get(userId) as any
    ).m,
  );
  return {
    lessonsCompleted,
    lessonsTotal,
    questionsAttempted,
    questionsCorrect,
    accuracy: questionsAttempted
      ? Math.round((questionsCorrect / questionsAttempted) * 100)
      : 0,
    streak: getStreak(userId),
    bookmarks,
    savedExplanations,
    mainsSubmissions,
    studyMinutes,
  };
}

export function getBookmarks(userId: string, itemType?: string) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT b.id, b.item_type, b.item_id, b.created_at,
              COALESCE(l.title, q.question_text, ca.title, m.content, s.name) AS title,
              COALESCE(l.subject_id, q.subject_id, ca.subject_id) AS subject_id
       FROM bookmarks b
       LEFT JOIN lessons l ON b.item_type = 'lesson' AND l.id = b.item_id
       LEFT JOIN questions q ON b.item_type = 'question' AND q.id = b.item_id
       LEFT JOIN current_affairs ca ON b.item_type = 'article' AND ca.id = b.item_id
       LEFT JOIN messages m ON b.item_type = 'explanation' AND m.id = b.item_id
       LEFT JOIN subjects s ON b.item_type = 'subject' AND s.id = b.item_id
       WHERE b.user_id = ? ${itemType ? 'AND b.item_type = ?' : ''}
       ORDER BY b.created_at DESC`,
    )
    .all(...(itemType ? [userId, itemType] : [userId])) as any[];
  return rows.map((row) => ({
    id: String(row.id),
    itemType: String(row.item_type),
    itemId: String(row.item_id),
    title: String(row.title ?? 'Saved item'),
    subjectId: row.subject_id ? String(row.subject_id) : null,
    createdAt: String(row.created_at),
  }));
}

export function toggleBookmark(userId: string, itemType: string, itemId: string) {
  const db = getDb();
  const existing = db
    .prepare('SELECT id FROM bookmarks WHERE user_id = ? AND item_type = ? AND item_id = ?')
    .get(userId, itemType, itemId) as { id: string } | undefined;
  if (existing) {
    db.prepare('DELETE FROM bookmarks WHERE id = ?').run(existing.id);
    return { bookmarked: false, id: existing.id };
  }
  const id = crypto.randomUUID();
  db.prepare(
    'INSERT INTO bookmarks (id, user_id, item_type, item_id, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, userId, itemType, itemId, nowIso());
  return { bookmarked: true, id };
}

export function getDashboard(userId: string, name: string, dailyGoalMinutes: number) {
  const db = getDb();
  const tasks = ensureTodayTasks(userId);
  const stats = getUserStats(userId);
  const weakTopics = getWeakTopics(userId, 4);
  const inProgress = db
    .prepare(
      `SELECT l.id, l.title, l.estimated_minutes, l.summary, s.name AS subject_name, s.id AS subject_id
       FROM lessons l JOIN subjects s ON s.id = l.subject_id
       WHERE l.id NOT IN (SELECT lesson_id FROM lesson_progress WHERE user_id = ?)
       ORDER BY s.sort_order, l.sort_order LIMIT 1`,
    )
    .get(userId) as any;
  const latestArticle = db
    .prepare(
      `SELECT id, title, summary, published_at, subject_id FROM current_affairs
       ORDER BY published_at DESC LIMIT 1`,
    )
    .get() as any;
  const todayStart = `${todayIso()}T00:00:00.000Z`;
  const attemptsToday = Number(
    (
      db
        .prepare('SELECT COUNT(*) AS c FROM attempts WHERE user_id = ? AND created_at >= ?')
        .get(userId, todayStart) as any
    ).c,
  );

  return {
    greetingName: name.split(' ')[0],
    date: todayIso(),
    dailyGoalMinutes,
    tasks,
    tasksCompleted: tasks.filter((task) => task.status === 'completed').length,
    tasksTotal: tasks.length,
    streak: stats.streak,
    stats,
    weakTopics,
    attemptsToday,
    continueLearning: inProgress
      ? {
          id: inProgress.id,
          title: inProgress.title,
          summary: inProgress.summary,
          subjectId: inProgress.subject_id,
          subjectName: inProgress.subject_name,
          estimatedMinutes: Number(inProgress.estimated_minutes),
        }
      : null,
    latestArticle: latestArticle
      ? {
          id: latestArticle.id,
          title: latestArticle.title,
          summary: latestArticle.summary,
          publishedAt: latestArticle.published_at,
          subjectId: latestArticle.subject_id,
        }
      : null,
  };
}

/** Weekly activity for the profile chart: attempts and completed tasks per day. */
export function getWeeklyActivity(userId: string, days = 7) {
  const db = getDb();
  const result: Array<{ date: string; attempts: number; tasks: number }> = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = addDaysIso(todayIso(), -offset);
    const attempts = Number(
      (
        db
          .prepare(
            `SELECT COUNT(*) AS c FROM attempts WHERE user_id = ? AND substr(created_at, 1, 10) = ?`,
          )
          .get(userId, date) as any
      ).c,
    );
    const tasks = Number(
      (
        db
          .prepare(
            `SELECT COUNT(*) AS c FROM study_tasks WHERE user_id = ? AND due_date = ? AND status = 'completed'`,
          )
          .get(userId, date) as any
      ).c,
    );
    result.push({ date, attempts, tasks });
  }
  return result;
}

export function parseJson<T>(value: string, fallback: T): T {
  return jsonParse(value, fallback);
}
