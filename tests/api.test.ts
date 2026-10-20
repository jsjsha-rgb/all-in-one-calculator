import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, uniqueEmail, type TestServer } from './helpers.ts';

let server: TestServer;

before(async () => {
  server = await startTestServer();
});

after(async () => {
  await server.close();
});

describe('authentication boundaries', () => {
  test('public endpoints work without a session and protected ones return 401', async () => {
    const health = await server.request('/health');
    assert.equal(health.status, 200);
    assert.equal(health.data.ok, true);

    for (const path of ['/dashboard', '/profile', '/bookmarks', '/practice/history', '/mentor/conversations']) {
      const response = await server.request(path);
      assert.equal(response.status, 401, `${path} should require authentication`);
      assert.equal(response.data.code, 'UNAUTHENTICATED');
    }
  });

  test('signup validates input and reports field errors', async () => {
    const response = await server.request('/auth/signup', {
      method: 'POST',
      body: { name: 'A', email: 'bad-email', password: 'short' },
    });
    assert.equal(response.status, 400);
    assert.equal(response.data.code, 'VALIDATION_ERROR');
    const fields = response.data.errors.map((item: { field: string }) => item.field).sort();
    assert.deepEqual(fields, ['email', 'name', 'password']);
    assert.equal(response.cookie, undefined);
  });

  test('signup, session, onboarding and re-login persist progress', async () => {
    const email = uniqueEmail('signup');
    const signup = await server.request('/auth/signup', {
      method: 'POST',
      body: { name: 'Test Learner', email, password: 'Study1234' },
    });
    assert.equal(signup.status, 201);
    assert.ok(signup.cookie?.startsWith('sm_session='));
    assert.equal(signup.data.user.onboardingComplete, false);

    const me = await server.request('/auth/me', { cookie: signup.cookie });
    assert.equal(me.status, 200);
    assert.equal(me.data.user.email, email);

    const onboarding = await server.request('/auth/onboarding', {
      method: 'PUT',
      cookie: signup.cookie,
      body: {
        examYear: new Date().getFullYear() + 2,
        preparationLevel: 'beginner',
        dailyGoalMinutes: 90,
      },
    });
    assert.equal(onboarding.status, 200);
    assert.equal(onboarding.data.user.onboardingComplete, true);
    assert.equal(onboarding.data.user.dailyGoalMinutes, 90);

    const dashboard = await server.request('/dashboard', { cookie: signup.cookie });
    assert.equal(dashboard.status, 200);
    assert.ok(dashboard.data.tasks.length > 0, 'a daily plan should be created');
    assert.equal(dashboard.data.stats.lessonsCompleted, 0);

    const complete = await server.request('/lessons/polity-preamble/complete', {
      method: 'POST',
      cookie: signup.cookie,
    });
    assert.equal(complete.status, 200);
    assert.equal(complete.data.stats.lessonsCompleted, 1);

    // Log in again to prove progress is server-side, not in-page state.
    const login = await server.request('/auth/login', {
      method: 'POST',
      body: { email, password: 'Study1234' },
    });
    assert.equal(login.status, 200);
    const later = await server.request('/profile', { cookie: login.cookie });
    assert.equal(later.status, 200);
    assert.equal(later.data.stats.lessonsCompleted, 1);
  });

  test('login rejects wrong credentials with a uniform message', async () => {
    const wrongPassword = await server.request('/auth/login', {
      method: 'POST',
      body: { email: 'demo@studaymentor.app', password: 'NotThePassword1' },
    });
    assert.equal(wrongPassword.status, 401);
    const missingUser = await server.request('/auth/login', {
      method: 'POST',
      body: { email: 'nobody@example.com', password: 'NotThePassword1' },
    });
    assert.equal(missingUser.status, 401);
    assert.equal(wrongPassword.data.error, missingUser.data.error);
  });

  test('logout invalidates the session', async () => {
    const email = uniqueEmail('logout');
    const cookie = await server.signup('Logout Learner', email, 'Study1234');
    const logout = await server.request('/auth/logout', { method: 'POST', cookie });
    assert.equal(logout.status, 200);
    const me = await server.request('/auth/me', { cookie });
    assert.equal(me.status, 401);
  });
});

describe('learning progress', () => {
  test('lesson completion updates progress, tasks and can be undone', async () => {
    const cookie = await server.signup('Lesson Learner', uniqueEmail('lesson'), 'Study1234');
    await server.request('/auth/onboarding', {
      method: 'PUT',
      cookie,
      body: { examYear: new Date().getFullYear() + 1, preparationLevel: 'intermediate', dailyGoalMinutes: 120 },
    });

    const subjectBefore = await server.request('/subjects/history', { cookie });
    const lessonBefore = subjectBefore.data.subject.lessons.find(
      (lesson: { id: string }) => lesson.id === 'history-freedom',
    );
    assert.equal(lessonBefore.completed, false);

    const complete = await server.request('/lessons/history-freedom/complete', {
      method: 'POST',
      cookie,
    });
    assert.equal(complete.status, 200);
    assert.equal(complete.data.completed, true);
    assert.equal(complete.data.stats.lessonsCompleted, 1);

    const subjectAfter = await server.request('/subjects/history', { cookie });
    assert.equal(
      subjectAfter.data.subject.lessons.find((lesson: { id: string }) => lesson.id === 'history-freedom')
        .completed,
      true,
    );

    const reopen = await server.request('/lessons/history-freedom/complete', {
      method: 'DELETE',
      cookie,
    });
    assert.equal(reopen.status, 200);
    assert.equal(reopen.data.stats.lessonsCompleted, 0);
  });

  test('completing a lesson task also records lesson progress', async () => {
    const cookie = await server.signup('Task Learner', uniqueEmail('task'), 'Study1234');
    await server.request('/auth/onboarding', {
      method: 'PUT',
      cookie,
      body: { examYear: new Date().getFullYear() + 1, preparationLevel: 'beginner', dailyGoalMinutes: 120 },
    });
    const dashboard = await server.request('/dashboard', { cookie });
    const lessonTask = dashboard.data.tasks.find((task: { kind: string }) => task.kind === 'lesson');
    assert.ok(lessonTask, 'expected a lesson task in the plan');

    const toggled = await server.request(`/study-tasks/${lessonTask.id}/toggle`, {
      method: 'POST',
      cookie,
    });
    assert.equal(toggled.status, 200);
    assert.equal(toggled.data.task.status, 'completed');
    assert.ok(toggled.data.dashboard.stats.lessonsCompleted >= 1);
  });

  test('bookmarks can be created and removed, and are private to each user', async () => {
    const cookieA = await server.signup('Bookmark A', uniqueEmail('bookmark-a'), 'Study1234');
    const cookieB = await server.signup('Bookmark B', uniqueEmail('bookmark-b'), 'Study1234');

    const added = await server.request('/bookmarks', {
      method: 'POST',
      cookie: cookieA,
      body: { itemType: 'lesson', itemId: 'polity-preamble' },
    });
    assert.equal(added.status, 200);
    assert.equal(added.data.bookmarked, true);

    const listA = await server.request('/bookmarks', { cookie: cookieA });
    assert.equal(listA.data.bookmarks.length, 1);
    const listB = await server.request('/bookmarks', { cookie: cookieB });
    assert.equal(listB.data.bookmarks.length, 0, 'user B must not see user A bookmarks');

    const removed = await server.request('/bookmarks', {
      method: 'POST',
      cookie: cookieA,
      body: { itemType: 'lesson', itemId: 'polity-preamble' },
    });
    assert.equal(removed.data.bookmarked, false);

    const empty = await server.request('/bookmarks', { cookie: cookieA });
    assert.equal(empty.data.bookmarks.length, 0);
  });

  test('bookmark requests validate item type and existence', async () => {
    const cookie = await server.signup('Bookmark C', uniqueEmail('bookmark-c'), 'Study1234');
    const badType = await server.request('/bookmarks', {
      method: 'POST',
      cookie,
      body: { itemType: 'secrets', itemId: 'x' },
    });
    assert.equal(badType.status, 400);
    const missing = await server.request('/bookmarks', {
      method: 'POST',
      cookie,
      body: { itemType: 'lesson', itemId: 'does-not-exist' },
    });
    assert.equal(missing.status, 404);
  });
});

describe('practice', () => {
  test('question payloads never include answers or explanations', async () => {
    const response = await server.request('/practice/questions?limit=50');
    assert.equal(response.status, 200);
    assert.ok(response.data.questions.length >= 30, 'sample bank should contain 30+ questions');
    for (const question of response.data.questions) {
      assert.equal(question.correctAnswer, undefined);
      assert.equal(question.explanation, undefined);
      assert.ok(Array.isArray(question.options));
      assert.equal(question.options.length, 4);
    }
  });

  test('filters accept empty results gracefully', async () => {
    const response = await server.request('/practice/questions?subject=does-not-exist');
    assert.equal(response.status, 200);
    assert.deepEqual(response.data.questions, []);
    assert.equal(response.data.total, 0);
    assert.equal(response.data.hasMore, false);
  });

  test('submitting an answer scores it, explains it and saves an attempt', async () => {
    const cookie = await server.signup('Practice Learner', uniqueEmail('practice'), 'Study1234');
    const wrong = await server.request('/practice/attempt', {
      method: 'POST',
      cookie,
      body: { questionId: 'q-pol-01', selectedAnswer: 0 },
    });
    assert.equal(wrong.status, 200);
    assert.equal(wrong.data.isCorrect, false);
    assert.equal(wrong.data.correctAnswer, 1);
    assert.ok(wrong.data.explanation.includes('42nd'));

    const correct = await server.request('/practice/attempt', {
      method: 'POST',
      cookie,
      body: { questionId: 'q-his-01', selectedAnswer: 2 },
    });
    assert.equal(correct.data.isCorrect, true);

    const history = await server.request('/practice/history', { cookie });
    assert.equal(history.data.attempts.length, 2);
    assert.equal(history.data.attempts[0].questionId, 'q-his-01');

    const mistakes = await server.request('/practice/mistakes', { cookie });
    assert.equal(mistakes.data.mistakes.length, 1);
    assert.equal(mistakes.data.mistakes[0].id, 'q-pol-01');
    assert.equal(mistakes.data.mistakes[0].correctAnswer, 1);

    const stats = await server.request('/practice/stats', { cookie });
    assert.equal(stats.data.overall.attempts, 2);
    assert.equal(stats.data.overall.correct, 1);
    assert.equal(stats.data.overall.accuracy, 50);
  });

  test('invalid answers are rejected', async () => {
    const cookie = await server.signup('Practice Invalid', uniqueEmail('practice-bad'), 'Study1234');
    const response = await server.request('/practice/attempt', {
      method: 'POST',
      cookie,
      body: { questionId: 'q-pol-01', selectedAnswer: 9 },
    });
    assert.equal(response.status, 400);
    assert.equal(response.data.code, 'VALIDATION_ERROR');
  });
});
