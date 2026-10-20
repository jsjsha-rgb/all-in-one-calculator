import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AI_EVALUATION_DISCLAIMER,
  buildDemoEvaluation,
} from '../server/lib/evaluator.ts';
import { validateEvaluation } from '../server/lib/validation.ts';
import { startTestServer, uniqueEmail, type TestServer } from './helpers.ts';

let server: TestServer;
const originalFetch = globalThis.fetch;

before(async () => {
  server = await startTestServer();
});

after(async () => {
  globalThis.fetch = originalFetch;
  delete process.env.AI_PROVIDER;
  delete process.env.GEMINI_API_KEY;
  await server.close();
});

const sampleAnswer = `Federalism in India is a design principle as well as a working practice. The Constitution divides powers between the Union and the States, with the Seventh Schedule listing subjects. Institutions such as the Finance Commission and the Interstate Council support coordination.

However, fiscal centralisation through cesses and surcharges, and the concentration of tax powers, has reduced the fiscal space of states. For example, the Goods and Services Tax Council is a compromise between autonomy and coordination. Critics argue that centrally sponsored schemes impose conditions that weaken state priorities.

On balance, cooperative federalism requires both institutional reform and political restraint. A way forward is to strengthen the Finance Commission's role, reduce cess-based revenue, and make intergovernmental councils more regular.`;

describe('AI mentor in demo mode', () => {
  test('status discloses demo mode and its reason', async () => {
    const response = await server.request('/ai/status');
    assert.equal(response.status, 200);
    assert.equal(response.data.mode, 'demo');
    assert.equal(response.data.provider, 'demo');
    assert.ok(response.data.reason.length > 0);
  });

  test('demo mentor answers, persists the conversation and supports follow-ups', async () => {
    const cookie = await server.signup('Mentor Learner', uniqueEmail('mentor'), 'Study1234');
    const first = await server.request('/mentor/messages', {
      method: 'POST',
      cookie,
      body: { message: 'Explain the basic structure doctrine and link it to the syllabus.' },
    });
    assert.equal(first.status, 200);
    assert.equal(first.data.mode, 'demo');
    assert.ok(first.data.conversationId);
    assert.equal(first.data.userMessage.role, 'user');
    assert.equal(first.data.assistantMessage.role, 'assistant');
    assert.match(first.data.assistantMessage.content, /Direct answer/);
    assert.match(first.data.assistantMessage.content, /Demo mode/i);
    assert.equal(first.data.assistantMessage.sourceMetadata.mode, 'demo');
    assert.ok(Array.isArray(first.data.assistantMessage.sourceMetadata.sources));

    const followUp = await server.request('/mentor/messages', {
      method: 'POST',
      cookie,
      body: {
        conversationId: first.data.conversationId,
        message: 'Give me a revision checklist for this topic.',
      },
    });
    assert.equal(followUp.status, 200);
    assert.equal(followUp.data.conversationId, first.data.conversationId);

    const conversation = await server.request(
      `/mentor/conversations/${first.data.conversationId}`,
      { cookie },
    );
    assert.equal(conversation.status, 200);
    assert.equal(conversation.data.messages.length, 4);

    const list = await server.request('/mentor/conversations', { cookie });
    assert.equal(list.data.conversations.length, 1);
    assert.ok(list.data.conversations[0].messageCount === 4);

    const saved = await server.request(`/mentor/messages/${first.data.assistantMessage.id}/save`, {
      method: 'POST',
      cookie,
    });
    assert.equal(saved.status, 200);
    assert.equal(saved.data.bookmarked, true);
    const notes = await server.request('/bookmarks?type=explanation', { cookie });
    assert.equal(notes.data.bookmarks.length, 1);
  });

  test('mentor input is validated and authentication is required', async () => {
    const cookie = await server.signup('Mentor Invalid', uniqueEmail('mentor-bad'), 'Study1234');
    const empty = await server.request('/mentor/messages', {
      method: 'POST',
      cookie,
      body: { message: '  ' },
    });
    assert.equal(empty.status, 400);
    const anonymous = await server.request('/mentor/messages', {
      method: 'POST',
      body: { message: 'Explain something' },
    });
    assert.equal(anonymous.status, 401);
  });

  test('conversations are private to their owner', async () => {
    const cookieA = await server.signup('Private A', uniqueEmail('private-a'), 'Study1234');
    const cookieB = await server.signup('Private B', uniqueEmail('private-b'), 'Study1234');
    const created = await server.request('/mentor/messages', {
      method: 'POST',
      cookie: cookieA,
      body: { message: 'Explain monetary policy transmission.' },
    });
    const id = created.data.conversationId;

    const foreignRead = await server.request(`/mentor/conversations/${id}`, { cookie: cookieB });
    assert.equal(foreignRead.status, 404);
    const foreignDelete = await server.request(`/mentor/conversations/${id}`, {
      method: 'DELETE',
      cookie: cookieB,
    });
    assert.equal(foreignDelete.status, 404);
    const ownRead = await server.request(`/mentor/conversations/${id}`, { cookie: cookieA });
    assert.equal(ownRead.status, 200);
  });
});

describe('Mains evaluation in demo mode', () => {
  test('returns structured feedback, saves it, and labels it clearly', async () => {
    const cookie = await server.signup('Mains Learner', uniqueEmail('mains'), 'Study1234');
    const response = await server.request('/mains/evaluate', {
      method: 'POST',
      cookie,
      body: {
        questionText: 'Discuss the challenges of cooperative federalism in India.',
        answerText: sampleAnswer,
        subjectId: 'polity',
        marks: 15,
      },
    });
    assert.equal(response.status, 201);
    const submission = response.data.submission;
    assert.equal(submission.mode, 'demo');
    assert.equal(submission.wordCount, sampleAnswer.trim().split(/\s+/).length);

    const feedback = validateEvaluation(submission.feedback);
    assert.equal(feedback.mode, 'demo');
    assert.equal(feedback.overall.maxScore, 15);
    assert.ok(feedback.overall.score > 0);
    assert.equal(feedback.disclaimer, AI_EVALUATION_DISCLAIMER);
    assert.match(feedback.disclaimer, /not an official UPSC assessment/i);
    assert.ok(feedback.strengths.length > 0);
    assert.ok(feedback.improvements.length > 0);

    const history = await server.request('/mains/submissions', { cookie });
    assert.equal(history.data.submissions.length, 1);
    assert.equal(history.data.submissions[0].id, submission.id);

    const detail = await server.request(`/mains/submissions/${submission.id}`, { cookie });
    assert.equal(detail.status, 200);
    assert.equal(detail.data.submission.answerText, sampleAnswer);

    const other = await server.signup('Mains Other', uniqueEmail('mains-other'), 'Study1234');
    const foreign = await server.request(`/mains/submissions/${submission.id}`, { cookie: other });
    assert.equal(foreign.status, 404);
  });

  test('rejects short answers and invalid marks without saving fabricated results', async () => {
    const cookie = await server.signup('Mains Invalid', uniqueEmail('mains-bad'), 'Study1234');
    const before = await server.request('/mains/submissions', { cookie });
    const short = await server.request('/mains/evaluate', {
      method: 'POST',
      cookie,
      body: {
        questionText: 'Discuss the role of the monsoon in Indian agriculture.',
        answerText: 'Too short.',
        subjectId: 'geography',
        marks: 15,
      },
    });
    assert.equal(short.status, 400);
    const badMarks = await server.request('/mains/evaluate', {
      method: 'POST',
      cookie,
      body: {
        questionText: 'Discuss the role of the monsoon in Indian agriculture.',
        answerText: sampleAnswer,
        subjectId: 'geography',
        marks: 7,
      },
    });
    assert.equal(badMarks.status, 400);
    const after = await server.request('/mains/submissions', { cookie });
    assert.equal(after.data.submissions.length, before.data.submissions.length);
  });

  test('evaluation scores respond to answer structure', () => {
    const weak = buildDemoEvaluation({
      questionText: 'Discuss cooperative federalism.',
      answerText: 'Cooperative federalism is important for India. It helps states and the centre work together.',
      marks: 15,
    });
    const strong = buildDemoEvaluation({
      questionText: 'Discuss cooperative federalism.',
      answerText: sampleAnswer,
      marks: 15,
    });
    assert.ok(strong.overall.score > weak.overall.score);
    assert.ok(
      strong.missingDimensions.length <= weak.missingDimensions.length,
      'a structured answer should not have more missing dimensions',
    );
  });
});

describe('provider configuration and failure handling', () => {
  test('an AI provider without credentials falls back to a labelled demo mode', async () => {
    process.env.AI_PROVIDER = 'openai';
    delete process.env.OPENAI_API_KEY;
    const response = await server.request('/ai/status');
    assert.equal(response.data.mode, 'demo');
    assert.match(response.data.reason, /OPENAI_API_KEY is missing/);
    delete process.env.AI_PROVIDER;
  });

  test('live provider failures return a retryable error and do not save fake output', async () => {
    const cookie = await server.signup('Live Failure', uniqueEmail('live-fail'), 'Study1234');
    process.env.AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'test-key';
    globalThis.fetch = (async (input: any, init?: any) => {
      const url = String(input);
      if (url.includes('generativelanguage.googleapis.com')) {
        return new Response('provider unavailable', { status: 500 });
      }
      return originalFetch(input, init);
    }) as typeof fetch;

    try {
      const mentor = await server.request('/mentor/messages', {
        method: 'POST',
        cookie,
        body: { message: 'Explain fiscal deficit.' },
      });
      assert.equal(mentor.status, 502);
      assert.equal(mentor.data.code, 'AI_ERROR');
      assert.equal(mentor.data.retryable, true);
      assert.match(mentor.data.error, /retry/i);

      const before = await server.request('/mains/submissions', { cookie });
      const evaluation = await server.request('/mains/evaluate', {
        method: 'POST',
        cookie,
        body: {
          questionText: 'Discuss India\u2019s inflation-targeting framework.',
          answerText: sampleAnswer,
          subjectId: 'economy',
          marks: 15,
        },
      });
      assert.equal(evaluation.status, 502);
      assert.equal(evaluation.data.code, 'EVALUATION_ERROR');
      const after = await server.request('/mains/submissions', { cookie });
      assert.equal(after.data.submissions.length, before.data.submissions.length);
    } finally {
      globalThis.fetch = originalFetch;
      delete process.env.AI_PROVIDER;
      delete process.env.GEMINI_API_KEY;
    }
  });

  test('a successful live response is validated before it is shown or saved', async () => {
    const cookie = await server.signup('Live Success', uniqueEmail('live-ok'), 'Study1234');
    process.env.AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'test-key';
    const liveFeedback = {
      overall: { score: 9, maxScore: 15, band: 'Developing', summary: 'Indicative live assessment.' },
      understanding: { score: 6, maxScore: 10, feedback: 'Understands the core question.' },
      relevanceAccuracy: { score: 6, maxScore: 10, feedback: 'Mostly relevant.' },
      introduction: { score: 5, maxScore: 10, feedback: 'Needs a clearer definition.' },
      body: { score: 6, maxScore: 10, feedback: 'Some structure is visible.' },
      examples: { score: 4, maxScore: 10, feedback: 'Add named examples.' },
      conclusion: { score: 5, maxScore: 10, feedback: 'Conclude with a way forward.' },
      missingDimensions: ['Named examples'],
      strengths: ['Relevant'],
      weaknesses: ['Evidence'],
      improvements: ['Add two examples'],
      modelAnswer: 'A model answer outline.',
    };

    globalThis.fetch = (async (input: any, init?: any) => {
      const url = String(input);
      if (url.includes('generativelanguage.googleapis.com')) {
        if (url.includes('generateContent')) {
          return new Response(
            JSON.stringify({
              candidates: [{ content: { parts: [{ text: JSON.stringify(liveFeedback) }] } }],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
      }
      return originalFetch(input, init);
    }) as typeof fetch;

    try {
      const status = await server.request('/ai/status');
      assert.equal(status.data.mode, 'live');
      assert.equal(status.data.provider, 'gemini');

      const evaluation = await server.request('/mains/evaluate', {
        method: 'POST',
        cookie,
        body: {
          questionText: 'Discuss India\u2019s inflation-targeting framework.',
          answerText: sampleAnswer,
          subjectId: 'economy',
          marks: 15,
        },
      });
      assert.equal(evaluation.status, 201);
      assert.equal(evaluation.data.submission.mode, 'live');
      assert.equal(evaluation.data.submission.feedback.overall.score, 9);
      assert.match(evaluation.data.submission.feedback.disclaimer, /AI-generated/);
    } finally {
      globalThis.fetch = originalFetch;
      delete process.env.AI_PROVIDER;
      delete process.env.GEMINI_API_KEY;
    }
  });
});
