import crypto from 'node:crypto';
import { Router } from 'express';
import { getDb, jsonParse, nowIso } from '../db.ts';
import { getSessionUser, requireAuth, type AuthedRequest } from '../lib/auth.ts';
import { mapQuestionPublic } from '../lib/content.ts';
import { asyncHandler, parseLimit } from '../lib/http.ts';
import { isAnswerCorrect } from '../lib/scoring.ts';
import { ValidationError } from '../lib/validation.ts';

export const practiceRouter = Router();

practiceRouter.get(
  '/filters',
  asyncHandler((_req, res) => {
    const db = getDb();
    const subjects = db
      .prepare(
        `SELECT s.id, s.name, COUNT(q.id) AS question_count FROM subjects s
         LEFT JOIN questions q ON q.subject_id = s.id GROUP BY s.id
         HAVING question_count > 0 ORDER BY s.sort_order`,
      )
      .all() as any[];
    const topics = db
      .prepare(
        `SELECT subject_id, topic, COUNT(*) AS count FROM questions
         GROUP BY subject_id, topic ORDER BY topic`,
      )
      .all() as any[];
    const years = db
      .prepare(
        `SELECT DISTINCT exam_year FROM questions WHERE exam_year IS NOT NULL ORDER BY exam_year DESC`,
      )
      .all() as any[];
    const difficulties = db
      .prepare(`SELECT difficulty, COUNT(*) AS count FROM questions GROUP BY difficulty`)
      .all() as any[];
    res.json({
      subjects: subjects.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        count: Number(row.question_count),
      })),
      topics: topics.map((row) => ({
        subjectId: String(row.subject_id),
        topic: String(row.topic),
        count: Number(row.count),
      })),
      years: years.map((row) => Number(row.exam_year)),
      difficulties: difficulties.map((row) => ({
        value: String(row.difficulty),
        count: Number(row.count),
      })),
      total: Number((db.prepare('SELECT COUNT(*) AS c FROM questions').get() as any).c),
    });
  }),
);

practiceRouter.get(
  '/questions',
  asyncHandler((req, res) => {
    const db = getDb();
    const user = getSessionUser(req);
    const subject = typeof req.query.subject === 'string' ? req.query.subject : '';
    const topic = typeof req.query.topic === 'string' ? req.query.topic : '';
    const difficulty = typeof req.query.difficulty === 'string' ? req.query.difficulty : '';
    const year = typeof req.query.year === 'string' ? req.query.year : '';
    const bookmarkedOnly = req.query.bookmarked === 'true';
    const limit = parseLimit(req.query.limit, 20, 50);
    const offset = Math.max(0, Number(req.query.offset) || 0);

    const clauses: string[] = [];
    const params: Array<string | number> = [];
    if (subject) {
      clauses.push('q.subject_id = ?');
      params.push(subject);
    }
    if (topic) {
      clauses.push('q.topic = ?');
      params.push(topic);
    }
    if (difficulty) {
      clauses.push('q.difficulty = ?');
      params.push(difficulty);
    }
    if (year) {
      clauses.push('q.exam_year = ?');
      params.push(Number(year));
    }
    if (bookmarkedOnly) {
      if (!user) {
        res.status(401).json({ error: 'Log in to see your bookmarked questions.', code: 'UNAUTHENTICATED' });
        return;
      }
      clauses.push(
        `q.id IN (SELECT item_id FROM bookmarks WHERE user_id = ? AND item_type = 'question')`,
      );
      params.push(user.id);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = db
      .prepare(
        `SELECT q.* FROM questions q ${where}
         ORDER BY CASE q.difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, q.id
         LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset) as any[];
    const total = Number(
      (db.prepare(`SELECT COUNT(*) AS c FROM questions q ${where}`).get(...params) as any).c,
    );
    const bookmarkSet = user
      ? new Set(
          (
            db
              .prepare(`SELECT item_id FROM bookmarks WHERE user_id = ? AND item_type = 'question'`)
              .all(user.id) as any[]
          ).map((row) => String(row.item_id)),
        )
      : new Set<string>();
    res.json({
      questions: rows.map((row) => ({
        ...mapQuestionPublic(row),
        bookmarked: bookmarkSet.has(String(row.id)),
      })),
      total,
      limit,
      offset,
      hasMore: offset + rows.length < total,
    });
  }),
);

practiceRouter.post(
  '/attempt',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    const questionId = String(req.body?.questionId ?? '');
    const selectedAnswer = Number(req.body?.selectedAnswer);
    if (!Number.isInteger(selectedAnswer) || selectedAnswer < 0 || selectedAnswer > 3) {
      throw new ValidationError([{ field: 'selectedAnswer', message: 'Choose one answer before submitting.' }]);
    }
    const db = getDb();
    const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId) as any;
    if (!question) {
      res.status(404).json({ error: 'Question not found.' });
      return;
    }
    const correct = isAnswerCorrect(selectedAnswer, Number(question.correct_answer));
    const attemptId = crypto.randomUUID();
    db.prepare(
      `INSERT INTO attempts (id, user_id, question_id, selected_answer, is_correct, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(attemptId, user.id, questionId, selectedAnswer, correct ? 1 : 0, nowIso());
    // Completing a practice task is recorded when the learner submits at least one answer today.
    db.prepare(
      `UPDATE study_tasks SET status = 'completed', completed_at = ?
       WHERE user_id = ? AND kind = 'practice' AND status = 'pending' AND due_date = ?`,
    ).run(nowIso(), user.id, new Date().toISOString().slice(0, 10));

    res.json({
      attemptId,
      isCorrect: correct,
      selectedAnswer,
      correctAnswer: Number(question.correct_answer),
      explanation: String(question.explanation),
      question: {
        ...mapQuestionPublic(question),
        bookmarked: Boolean(
          db
            .prepare(
              `SELECT 1 FROM bookmarks WHERE user_id = ? AND item_type = 'question' AND item_id = ?`,
            )
            .get(user.id, questionId),
        ),
      },
      source: String(question.source),
    });
  }),
);

practiceRouter.get(
  '/history',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    const db = getDb();
    const limit = parseLimit(req.query.limit, 50, 200);
    const rows = db
      .prepare(
        `SELECT a.*, q.question_text, q.topic, q.subject_id, q.options, q.correct_answer,
                q.explanation, q.difficulty, q.source, q.exam_year, q.question_type, s.name AS subject_name
         FROM attempts a JOIN questions q ON q.id = a.question_id
         JOIN subjects s ON s.id = q.subject_id
         WHERE a.user_id = ? ORDER BY a.created_at DESC LIMIT ?`,
      )
      .all(user.id, limit) as any[];
    res.json({
      attempts: rows.map((row) => ({
        id: String(row.id),
        questionId: String(row.question_id),
        questionText: String(row.question_text),
        topic: String(row.topic),
        subjectId: String(row.subject_id),
        subjectName: String(row.subject_name),
        selectedAnswer: Number(row.selected_answer),
        correctAnswer: Number(row.correct_answer),
        isCorrect: Number(row.is_correct) === 1,
        explanation: String(row.explanation),
        options: jsonParse<string[]>(String(row.options), []),
        difficulty: String(row.difficulty),
        source: String(row.source),
        createdAt: String(row.created_at),
      })),
    });
  }),
);

practiceRouter.get(
  '/mistakes',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT q.*, s.name AS subject_name, a.selected_answer, a.created_at,
                (SELECT COUNT(*) FROM attempts x WHERE x.user_id = ? AND x.question_id = q.id) AS attempt_count
         FROM attempts a
         JOIN questions q ON q.id = a.question_id
         JOIN subjects s ON s.id = q.subject_id
         WHERE a.user_id = ? AND a.is_correct = 0
           AND a.created_at = (SELECT MAX(b.created_at) FROM attempts b
                               WHERE b.user_id = a.user_id AND b.question_id = a.question_id)
         ORDER BY a.created_at DESC LIMIT 30`,
      )
      .all(user.id, user.id) as any[];
    res.json({
      mistakes: rows.map((row) => ({
        ...mapQuestionPublic(row),
        subjectName: String(row.subject_name),
        selectedAnswer: Number(row.selected_answer),
        correctAnswer: Number(row.correct_answer),
        explanation: String(row.explanation),
        attemptedAt: String(row.created_at),
        attemptCount: Number(row.attempt_count),
      })),
    });
  }),
);

practiceRouter.get(
  '/stats',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    const db = getDb();
    const bySubject = db
      .prepare(
        `SELECT s.id, s.name, COUNT(a.id) AS attempts, COALESCE(SUM(a.is_correct), 0) AS correct
         FROM attempts a JOIN questions q ON q.id = a.question_id
         JOIN subjects s ON s.id = q.subject_id
         WHERE a.user_id = ? GROUP BY s.id ORDER BY s.sort_order`,
      )
      .all(user.id) as any[];
    const overall = db
      .prepare(
        `SELECT COUNT(*) AS attempts, COALESCE(SUM(is_correct), 0) AS correct FROM attempts WHERE user_id = ?`,
      )
      .get(user.id) as any;
    res.json({
      overall: {
        attempts: Number(overall.attempts),
        correct: Number(overall.correct),
        accuracy: Number(overall.attempts)
          ? Math.round((Number(overall.correct) / Number(overall.attempts)) * 100)
          : 0,
      },
      bySubject: bySubject.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        attempts: Number(row.attempts),
        correct: Number(row.correct),
        accuracy: Math.round((Number(row.correct) / Number(row.attempts)) * 100),
      })),
    });
  }),
);
