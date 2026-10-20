import { Router } from 'express';
import { getDb, nowIso } from '../db.ts';
import { getSessionUser, requireAuth, type AuthedRequest } from '../lib/auth.ts';
import {
  getLessonDetail,
  getSubjectDetail,
  getSubjectsForUser,
  mapArticle,
  mapQuestionPublic,
} from '../lib/content.ts';
import { asyncHandler, parseLimit, parseSubject } from '../lib/http.ts';
import { getBookmarks, getDashboard, getUserStats, toggleBookmark } from '../lib/study.ts';
import { ValidationError } from '../lib/validation.ts';

export const contentRouter = Router();

contentRouter.get(
  '/dashboard',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    res.json(getDashboard(user.id, user.name, user.dailyGoalMinutes));
  }),
);

contentRouter.get(
  '/subjects',
  asyncHandler((req, res) => {
    const user = getSessionUser(req);
    res.json({ subjects: getSubjectsForUser(user?.id ?? null) });
  }),
);

contentRouter.get(
  '/subjects/:id',
  asyncHandler((req, res) => {
    const user = getSessionUser(req);
    const subject = getSubjectDetail(req.params.id, user?.id ?? null);
    if (!subject) {
      res.status(404).json({ error: 'Subject not found.' });
      return;
    }
    res.json({ subject });
  }),
);

contentRouter.get(
  '/lessons/:id',
  asyncHandler((req, res) => {
    const user = getSessionUser(req);
    const lesson = getLessonDetail(req.params.id, user?.id ?? null);
    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found.' });
      return;
    }
    res.json({ lesson });
  }),
);

contentRouter.post(
  '/lessons/:id/complete',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    const db = getDb();
    const lesson = db.prepare('SELECT id, title FROM lessons WHERE id = ?').get(req.params.id) as
      | { id: string; title: string }
      | undefined;
    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found.' });
      return;
    }
    const completedAt = nowIso();
    db.prepare(
      'INSERT OR IGNORE INTO lesson_progress (user_id, lesson_id, completed_at) VALUES (?, ?, ?)',
    ).run(user.id, lesson.id, completedAt);
    db.prepare(
      `UPDATE study_tasks SET status = 'completed', completed_at = ?
       WHERE user_id = ? AND lesson_id = ? AND status = 'pending'`,
    ).run(completedAt, user.id, lesson.id);
    const stats = getUserStats(user.id);
    res.json({
      completed: true,
      completedAt,
      message: `Lesson marked complete. ${
        stats.lessonsTotal - stats.lessonsCompleted
      } lessons left in the library.`,
      stats,
    });
  }),
);

contentRouter.delete(
  '/lessons/:id/complete',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    const db = getDb();
    db.prepare('DELETE FROM lesson_progress WHERE user_id = ? AND lesson_id = ?').run(
      user.id,
      req.params.id,
    );
    db.prepare(
      `UPDATE study_tasks SET status = 'pending', completed_at = NULL
       WHERE user_id = ? AND lesson_id = ? AND status = 'completed'`,
    ).run(user.id, req.params.id);
    res.json({ completed: false, stats: getUserStats(user.id) });
  }),
);

contentRouter.get(
  '/affairs',
  asyncHandler((req, res) => {
    const db = getDb();
    const user = getSessionUser(req);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const subject = parseSubject(req.query.subject);
    const limit = parseLimit(req.query.limit, 30, 100);
    const clauses: string[] = [];
    const params: Array<string | number> = [];
    if (search) {
      clauses.push('(ca.title LIKE ? OR ca.summary LIKE ? OR ca.content LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (subject) {
      clauses.push('ca.subject_id = ?');
      params.push(subject);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = db
      .prepare(
        `SELECT ca.*, s.name AS subject_name, s.syllabus_section FROM current_affairs ca
         JOIN subjects s ON s.id = ca.subject_id ${where}
         ORDER BY ca.published_at DESC LIMIT ?`,
      )
      .all(...params, limit) as any[];
    const bookmarks = user
      ? new Set(
          (
            db
              .prepare(`SELECT item_id FROM bookmarks WHERE user_id = ? AND item_type = 'article'`)
              .all(user.id) as any[]
          ).map((row) => String(row.item_id)),
        )
      : new Set<string>();
    res.json({ articles: rows.map((row) => mapArticle(row, bookmarks.has(String(row.id)))) });
  }),
);

contentRouter.get(
  '/affairs/:id',
  asyncHandler((req, res) => {
    const db = getDb();
    const user = getSessionUser(req);
    const row = db
      .prepare(
        `SELECT ca.*, s.name AS subject_name, s.syllabus_section FROM current_affairs ca
         JOIN subjects s ON s.id = ca.subject_id WHERE ca.id = ?`,
      )
      .get(req.params.id) as any;
    if (!row) {
      res.status(404).json({ error: 'Article not found.' });
      return;
    }
    const bookmarked = user
      ? Boolean(
          db
            .prepare(
              `SELECT 1 FROM bookmarks WHERE user_id = ? AND item_type = 'article' AND item_id = ?`,
            )
            .get(user.id, row.id),
        )
      : false;
    const related = db
      .prepare(
        `SELECT * FROM questions WHERE subject_id = ?
         ORDER BY CASE WHEN topic = ? THEN 0 ELSE 1 END, id LIMIT 3`,
      )
      .all(String(row.subject_id), String(row.related_topic ?? '')) as any[];
    res.json({
      article: mapArticle(row, bookmarked),
      relatedQuestions: related.map(mapQuestionPublic),
    });
  }),
);

const BOOKMARK_TYPES = new Set(['lesson', 'question', 'article', 'explanation', 'subject']);

contentRouter.get(
  '/bookmarks',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    if (type && !BOOKMARK_TYPES.has(type)) {
      throw new ValidationError([{ field: 'type', message: 'Unknown bookmark type.' }]);
    }
    res.json({ bookmarks: getBookmarks(user.id, type) });
  }),
);

contentRouter.post(
  '/bookmarks',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    const itemType = String(req.body?.itemType ?? '');
    const itemId = String(req.body?.itemId ?? '');
    if (!BOOKMARK_TYPES.has(itemType) || !itemId) {
      throw new ValidationError([{ field: 'itemType', message: 'Invalid bookmark request.' }]);
    }
    const db = getDb();
    const checks: Record<string, string> = {
      lesson: 'SELECT 1 FROM lessons WHERE id = ?',
      question: 'SELECT 1 FROM questions WHERE id = ?',
      article: 'SELECT 1 FROM current_affairs WHERE id = ?',
      subject: 'SELECT 1 FROM subjects WHERE id = ?',
      explanation: `SELECT 1 FROM messages m JOIN conversations c ON c.id = m.conversation_id
                    WHERE m.id = ? AND m.role = 'assistant' AND c.user_id = ?`,
    };
    const params = itemType === 'explanation' ? [itemId, user.id] : [itemId];
    const exists = db.prepare(checks[itemType]).get(...params);
    if (!exists) {
      res.status(404).json({ error: 'The item you tried to save was not found.' });
      return;
    }
    res.json(toggleBookmark(user.id, itemType, itemId));
  }),
);

contentRouter.get(
  '/search',
  asyncHandler((req, res) => {
    const db = getDb();
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (query.length < 2) {
      res.json({ lessons: [], questions: [], articles: [] });
      return;
    }
    const like = `%${query}%`;
    const lessons = db
      .prepare(
        `SELECT l.id, l.title, l.summary, s.name AS subject_name FROM lessons l
         JOIN subjects s ON s.id = l.subject_id
         WHERE l.title LIKE ? OR l.summary LIKE ? OR l.content LIKE ? LIMIT 6`,
      )
      .all(like, like, like) as any[];
    const questions = db
      .prepare(
        `SELECT * FROM questions WHERE question_text LIKE ? OR topic LIKE ? LIMIT 6`,
      )
      .all(like, like) as any[];
    const articles = db
      .prepare(
        `SELECT ca.*, s.name AS subject_name, s.syllabus_section FROM current_affairs ca
         JOIN subjects s ON s.id = ca.subject_id
         WHERE ca.title LIKE ? OR ca.summary LIKE ? LIMIT 6`,
      )
      .all(like, like) as any[];
    res.json({
      lessons: lessons.map((row) => ({
        id: String(row.id),
        title: String(row.title),
        summary: String(row.summary),
        subjectName: String(row.subject_name),
      })),
      questions: questions.map(mapQuestionPublic),
      articles: articles.map((row) => mapArticle(row)),
    });
  }),
);

contentRouter.post(
  '/study-tasks/:id/toggle',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    const db = getDb();
    const task = db
      .prepare('SELECT id, lesson_id, status FROM study_tasks WHERE id = ? AND user_id = ?')
      .get(req.params.id, user.id) as
      | { id: string; lesson_id: string | null; status: string }
      | undefined;
    if (!task) {
      res.status(404).json({ error: 'Study task not found.' });
      return;
    }
    const completing = task.status !== 'completed';
    const completedAt = completing ? nowIso() : null;
    db.prepare('UPDATE study_tasks SET status = ?, completed_at = ? WHERE id = ?').run(
      completing ? 'completed' : 'pending',
      completedAt,
      task.id,
    );
    if (completing && task.lesson_id) {
      db.prepare(
        'INSERT OR IGNORE INTO lesson_progress (user_id, lesson_id, completed_at) VALUES (?, ?, ?)',
      ).run(user.id, task.lesson_id, completedAt);
    }
    res.json({
      task: {
        id: task.id,
        status: completing ? 'completed' : 'pending',
        completedAt,
      },
      // Re-read the dashboard so the client gets consistent counts in one round trip.
      dashboard: getDashboard(user.id, user.name, user.dailyGoalMinutes),
    });
  }),
);
