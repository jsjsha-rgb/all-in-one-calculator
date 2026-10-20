import crypto from 'node:crypto';
import { Router } from 'express';
import { getDb, jsonParse, nowIso } from '../db.ts';
import { requireAuth, rateLimitMiddleware, type AuthedRequest } from '../lib/auth.ts';
import { getAIStatus } from '../lib/ai.ts';
import { buildDemoEvaluation, evaluateWithProvider, EvaluationError } from '../lib/evaluator.ts';
import { asyncHandler } from '../lib/http.ts';
import { mainsQuestions } from '../seed/content/mains.ts';
import { validateAnswerSubmission, ValidationError } from '../lib/validation.ts';

export const mainsRouter = Router();

const ALLOWED_MARKS = [10, 15, 20];

mainsRouter.get(
  '/mains/questions',
  asyncHandler((_req, res) => {
    const db = getDb();
    const subjects = db.prepare('SELECT id, name FROM subjects').all() as any[];
    const subjectMap = new Map(subjects.map((row) => [String(row.id), String(row.name)]));
    res.json({
      questions: mainsQuestions.map((question) => ({
        ...question,
        subjectName: subjectMap.get(question.subjectId) ?? '',
        isSample: true,
      })),
      status: getAIStatus(),
    });
  }),
);

mainsRouter.post(
  '/mains/evaluate',
  requireAuth,
  rateLimitMiddleware('mains-evaluate', 8, 10 * 60 * 1000),
  asyncHandler(async (req, res) => {
    const user = (req as AuthedRequest).user!;
    const input = validateAnswerSubmission(req.body ?? {});
    const marks = Number(req.body?.marks ?? 15);
    if (!ALLOWED_MARKS.includes(marks)) {
      throw new ValidationError([{ field: 'marks', message: 'Choose 10, 15 or 20 marks.' }]);
    }
    const db = getDb();
    if (input.subjectId) {
      const subject = db.prepare('SELECT id FROM subjects WHERE id = ?').get(input.subjectId);
      if (!subject) {
        throw new ValidationError([{ field: 'subjectId', message: 'Choose a valid subject.' }]);
      }
    }
    const sample = mainsQuestions.find(
      (question) => question.question.trim() === input.questionText.trim(),
    );

    const status = getAIStatus();
    let feedback;
    let mode: 'demo' | 'live';
    if (status.mode === 'live') {
      try {
        feedback = await evaluateWithProvider({
          questionText: input.questionText,
          answerText: input.answerText,
          marks,
        });
      } catch (error) {
        const evaluationError =
          error instanceof EvaluationError
            ? error
            : new EvaluationError('The evaluation service failed. Please retry.', 502, true);
        res.status(evaluationError.status).json({
          error: evaluationError.message,
          code: 'EVALUATION_ERROR',
          retryable: evaluationError.retryable,
        });
        return;
      }
      mode = 'live';
    } else {
      feedback = buildDemoEvaluation({
        questionText: input.questionText,
        answerText: input.answerText,
        marks,
        modelAnswer: sample?.modelAnswer,
      });
      mode = 'demo';
    }

    const id = crypto.randomUUID();
    const createdAt = nowIso();
    db.prepare(
      `INSERT INTO answer_submissions (id, user_id, question_text, subject_id, answer_text, word_count,
        feedback_json, mode, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      user.id,
      input.questionText,
      input.subjectId,
      input.answerText,
      input.wordCount,
      JSON.stringify(feedback),
      mode,
      createdAt,
    );

    res.status(201).json({
      submission: {
        id,
        questionText: input.questionText,
        subjectId: input.subjectId,
        answerText: input.answerText,
        wordCount: input.wordCount,
        feedback,
        mode,
        createdAt,
      },
    });
  }),
);

mainsRouter.get(
  '/mains/submissions',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    const rows = getDb()
      .prepare(
        `SELECT a.*, s.name AS subject_name FROM answer_submissions a
         LEFT JOIN subjects s ON s.id = a.subject_id
         WHERE a.user_id = ? ORDER BY a.created_at DESC`,
      )
      .all(user.id) as any[];
    res.json({
      submissions: rows.map((row) => {
        const feedback = jsonParse<any>(String(row.feedback_json), {});
        return {
          id: String(row.id),
          questionText: String(row.question_text),
          subjectId: row.subject_id ? String(row.subject_id) : null,
          subjectName: row.subject_name ? String(row.subject_name) : null,
          wordCount: Number(row.word_count),
          mode: String(row.mode),
          createdAt: String(row.created_at),
          overall: feedback.overall ?? null,
        };
      }),
    });
  }),
);

mainsRouter.get(
  '/mains/submissions/:id',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    const row = getDb()
      .prepare(
        `SELECT a.*, s.name AS subject_name FROM answer_submissions a
         LEFT JOIN subjects s ON s.id = a.subject_id
         WHERE a.id = ? AND a.user_id = ?`,
      )
      .get(req.params.id, user.id) as any;
    if (!row) {
      res.status(404).json({ error: 'Evaluation not found.' });
      return;
    }
    res.json({
      submission: {
        id: String(row.id),
        questionText: String(row.question_text),
        subjectId: row.subject_id ? String(row.subject_id) : null,
        subjectName: row.subject_name ? String(row.subject_name) : null,
        answerText: String(row.answer_text),
        wordCount: Number(row.word_count),
        mode: String(row.mode),
        createdAt: String(row.created_at),
        feedback: jsonParse<Record<string, unknown>>(String(row.feedback_json), {}),
      },
    });
  }),
);

mainsRouter.delete(
  '/mains/submissions/:id',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    const result = getDb()
      .prepare('DELETE FROM answer_submissions WHERE id = ? AND user_id = ?')
      .run(req.params.id, user.id);
    if (Number(result.changes) === 0) {
      res.status(404).json({ error: 'Evaluation not found.' });
      return;
    }
    res.json({ ok: true });
  }),
);
