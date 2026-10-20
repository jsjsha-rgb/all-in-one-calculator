import crypto from 'node:crypto';
import { Router } from 'express';
import { getDb, jsonParse, nowIso } from '../db.ts';
import { requireAuth, rateLimitMiddleware, type AuthedRequest } from '../lib/auth.ts';
import {
  AIProviderError,
  MENTOR_SYSTEM_PROMPT,
  buildDemoConversationTitle,
  callAI,
  demoMentorAnswer,
  getAIStatus,
} from '../lib/ai.ts';
import { asyncHandler } from '../lib/http.ts';
import { toggleBookmark } from '../lib/study.ts';
import { sanitizeText, validateMentorQuestion } from '../lib/validation.ts';

export const mentorRouter = Router();

mentorRouter.get(
  '/ai/status',
  asyncHandler((_req, res) => {
    res.json(getAIStatus());
  }),
);

function mapMessage(row: any) {
  return {
    id: String(row.id),
    role: String(row.role),
    content: String(row.content),
    createdAt: String(row.created_at),
    sourceMetadata: jsonParse<Record<string, unknown>>(String(row.source_metadata), {}),
  };
}

mentorRouter.get(
  '/mentor/conversations',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT c.*,
          (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS message_count,
          (SELECT content FROM messages m WHERE m.conversation_id = c.id
             ORDER BY m.created_at DESC LIMIT 1) AS last_message
         FROM conversations c WHERE c.user_id = ? ORDER BY c.updated_at DESC`,
      )
      .all(user.id) as any[];
    res.json({
      conversations: rows.map((row) => ({
        id: String(row.id),
        title: String(row.title),
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
        messageCount: Number(row.message_count),
        preview: row.last_message ? String(row.last_message).slice(0, 120) : '',
      })),
    });
  }),
);

mentorRouter.post(
  '/mentor/conversations',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    const title = sanitizeText(req.body?.title, 80) || 'New conversation';
    const id = crypto.randomUUID();
    const now = nowIso();
    getDb()
      .prepare(
        'INSERT INTO conversations (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      )
      .run(id, user.id, title, now, now);
    res.status(201).json({
      conversation: { id, title, createdAt: now, updatedAt: now, messageCount: 0, preview: '' },
    });
  }),
);

function loadConversation(userId: string, conversationId: string) {
  const db = getDb();
  const conversation = db
    .prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?')
    .get(conversationId, userId) as any;
  if (!conversation) return null;
  const messages = db
    .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at')
    .all(conversationId) as any[];
  return { conversation, messages };
}

mentorRouter.get(
  '/mentor/conversations/:id',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    const loaded = loadConversation(user.id, req.params.id);
    if (!loaded) {
      res.status(404).json({ error: 'Conversation not found.' });
      return;
    }
    res.json({
      conversation: {
        id: String(loaded.conversation.id),
        title: String(loaded.conversation.title),
        createdAt: String(loaded.conversation.created_at),
        updatedAt: String(loaded.conversation.updated_at),
      },
      messages: loaded.messages.map(mapMessage),
      mode: getAIStatus(),
    });
  }),
);

mentorRouter.delete(
  '/mentor/conversations/:id',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    const db = getDb();
    const result = db
      .prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?')
      .run(req.params.id, user.id);
    if (Number(result.changes) === 0) {
      res.status(404).json({ error: 'Conversation not found.' });
      return;
    }
    res.json({ ok: true });
  }),
);

mentorRouter.post(
  '/mentor/messages',
  requireAuth,
  rateLimitMiddleware('mentor', 20, 10 * 60 * 1000),
  asyncHandler(async (req, res) => {
    const user = (req as AuthedRequest).user!;
    const message = validateMentorQuestion(req.body?.message);
    const db = getDb();
    let conversationId = String(req.body?.conversationId ?? '');
    let createdHere = false;
    let conversation = conversationId
      ? (db
          .prepare('SELECT * FROM conversations WHERE id = ? AND user_id = ?')
          .get(conversationId, user.id) as any)
      : null;

    if (conversationId && !conversation) {
      res.status(404).json({ error: 'Conversation not found.' });
      return;
    }
    if (!conversation) {
      createdHere = true;
      conversationId = crypto.randomUUID();
      const now = nowIso();
      db.prepare(
        'INSERT INTO conversations (id, user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      ).run(conversationId, user.id, buildDemoConversationTitle(message), now, now);
      conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);
    }

    const history = db
      .prepare(
        `SELECT role, content FROM messages WHERE conversation_id = ?
         ORDER BY created_at DESC LIMIT 10`,
      )
      .all(conversationId) as any[];
    const context = history
      .reverse()
      .filter((row) => row.role === 'user' || row.role === 'assistant')
      .map((row) => ({ role: row.role as 'user' | 'assistant', content: String(row.content) }));

    const status = getAIStatus();
    let answer: { content: string; sources: Array<{ title: string; type: string; id: string }> };
    let mode: 'demo' | 'live' = 'demo';

    if (status.mode === 'live') {
      try {
        const result = await callAI({
          system: MENTOR_SYSTEM_PROMPT,
          messages: [...context, { role: 'user', content: message }],
          maxTokens: 1200,
        });
        answer = { content: result.text, sources: [] };
        mode = 'live';
      } catch (error) {
        const providerError =
          error instanceof AIProviderError
            ? error
            : new AIProviderError('The AI mentor is unavailable right now.', 502, true);
        // Do not leave an empty conversation behind when the first request fails.
        if (createdHere) {
          db.prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?').run(
            conversationId,
            user.id,
          );
        }
        res.status(providerError.status).json({
          error: providerError.message,
          code: 'AI_ERROR',
          retryable: providerError.retryable,
        });
        return;
      }
    } else {
      answer = demoMentorAnswer(message);
    }

    const now = nowIso();
    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();
    db.prepare(
      'INSERT INTO messages (id, conversation_id, role, content, source_metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(userMessageId, conversationId, 'user', message, '{}', now);
    db.prepare(
      'INSERT INTO messages (id, conversation_id, role, content, source_metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(
      assistantMessageId,
      conversationId,
      'assistant',
      answer.content,
      JSON.stringify({ mode, provider: status.provider, sources: answer.sources }),
      nowIso(),
    );
    const messageCount = Number(
      (
        db
          .prepare('SELECT COUNT(*) AS c FROM messages WHERE conversation_id = ?')
          .get(conversationId) as any
      ).c,
    );
    db.prepare(
      'UPDATE conversations SET updated_at = ?, title = CASE WHEN ? <= 2 THEN ? ELSE title END WHERE id = ?',
    ).run(nowIso(), messageCount, buildDemoConversationTitle(message), conversationId);

    res.json({
      conversationId,
      mode,
      provider: status.provider,
      userMessage: mapMessage(
        db.prepare('SELECT * FROM messages WHERE id = ?').get(userMessageId),
      ),
      assistantMessage: mapMessage(
        db.prepare('SELECT * FROM messages WHERE id = ?').get(assistantMessageId),
      ),
    });
  }),
);

mentorRouter.post(
  '/mentor/messages/:id/save',
  requireAuth,
  asyncHandler((req, res) => {
    const user = (req as AuthedRequest).user!;
    const db = getDb();
    const row = db
      .prepare(
        `SELECT m.id FROM messages m JOIN conversations c ON c.id = m.conversation_id
         WHERE m.id = ? AND c.user_id = ? AND m.role = 'assistant'`,
      )
      .get(req.params.id, user.id);
    if (!row) {
      res.status(404).json({ error: 'Explanation not found.' });
      return;
    }
    res.json(toggleBookmark(user.id, 'explanation', req.params.id));
  }),
);
