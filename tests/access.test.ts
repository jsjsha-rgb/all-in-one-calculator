import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, type TestServer } from './helpers.ts';

let server: TestServer;

before(async () => {
  server = await startTestServer();
});

after(async () => {
  await server.close();
  delete process.env.RATE_LIMIT_DISABLED;
  delete process.env.RATE_LIMIT_MULTIPLIER;
});

describe('free and unlimited access model', () => {
  test('status endpoint advertises free unlimited access for everyone', async () => {
    const response = await server.request('/ai/status');
    assert.equal(response.status, 200);
    assert.deepEqual(response.data.access, {
      free: true,
      unlimited: true,
      rateLimiting: 'abuse-protection-only',
    });
    // Demo mode is a content mode, never a usage restriction.
    assert.equal(response.data.mode, 'demo');
  });

  test('every lesson, question, brief and Mains prompt is readable without a paywall', async () => {
    const cookie = await server.loginDemo();
    const subjects = await server.request('/subjects', { cookie });
    assert.equal(subjects.status, 200);
    assert.ok(subjects.data.subjects.length >= 7);

    let lessonCount = 0;
    for (const subject of subjects.data.subjects) {
      const detail = await server.request(`/subjects/${subject.id}`, { cookie });
      assert.equal(detail.status, 200);
      assert.equal(detail.data.subject.locked, undefined);
      for (const lesson of detail.data.subject.lessons) {
        const full = await server.request(`/lessons/${lesson.id}`, { cookie });
        assert.equal(full.status, 200, `lesson ${lesson.id} should be readable`);
        assert.ok(
          String(full.data.lesson.content ?? '').length > 0,
          'lesson body is not locked',
        );
        lessonCount += 1;
      }
    }
    assert.ok(lessonCount >= 10, 'at least ten full lessons are available');

    const questions = await server.request('/practice/questions?limit=50', { cookie });
    assert.equal(questions.status, 200);
    assert.ok(questions.data.total >= 30, 'the whole question bank is available');

    const affairs = await server.request('/affairs', { cookie });
    assert.equal(affairs.status, 200);
    assert.ok(affairs.data.articles.length >= 5);

    const mains = await server.request('/mains/questions', { cookie });
    assert.equal(mains.status, 200);
    assert.ok(mains.data.questions.length >= 5);
  });

  test('mentor messages have no plan-based cap', async () => {
    const cookie = await server.loginDemo();
    for (let index = 0; index < 6; index += 1) {
      const message = await server.request('/mentor/messages', {
        method: 'POST',
        body: { message: `Explain Article 21 in one sentence. Follow-up ${index + 1}.` },
        cookie,
      });
      assert.equal(message.status, 200, `message ${index + 1} should not be blocked`);
      assert.ok(message.data.assistantMessage.content.length > 0);
    }
  });

  test('rate limiting can be disabled for self-hosted unlimited use', async () => {
    process.env.RATE_LIMIT_DISABLED = 'true';
    const { rateLimit } = await import('../server/lib/auth.ts');

    for (let attempt = 0; attempt < 50; attempt += 1) {
      const result = rateLimit('test:unlimited', 2, 60_000);
      assert.equal(result.allowed, true);
      assert.equal(result.retryAfterSeconds, 0);
    }

    const status = await server.request('/ai/status');
    assert.equal(status.data.access.rateLimiting, 'disabled');
    delete process.env.RATE_LIMIT_DISABLED;
  });
});
