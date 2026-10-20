import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  countWords,
  validateAnswerSubmission,
  validateEvaluation,
  validateLogin,
  validateMentorQuestion,
  validateOnboarding,
  validateSignup,
  ValidationError,
} from '../server/lib/validation.ts';
import { buildDemoEvaluation } from '../server/lib/evaluator.ts';

const longAnswer = Array.from({ length: 80 }, (_, index) => `word${index}`).join(' ');

test('signup validation returns field-level errors and normalises email', () => {
  assert.throws(
    () => validateSignup({ name: 'A', email: 'not-an-email', password: 'short' }),
    (error: unknown) => {
      assert.ok(error instanceof ValidationError);
      const fields = error.errors.map((item) => item.field);
      assert.deepEqual(fields.sort(), ['email', 'name', 'password']);
      return true;
    },
  );
  const valid = validateSignup({
    name: '  Ananya Rao ',
    email: 'Ananya@Example.COM ',
    password: 'Study1234',
  });
  assert.equal(valid.name, 'Ananya Rao');
  assert.equal(valid.email, 'ananya@example.com');
});

test('login validation rejects malformed email and empty password', () => {
  assert.throws(() => validateLogin({ email: 'x', password: '' }), ValidationError);
  const valid = validateLogin({ email: 'a@b.com', password: 'secret123' });
  assert.equal(valid.email, 'a@b.com');
});

test('onboarding validation enforces future exam years, level and time bounds', () => {
  assert.throws(
    () =>
      validateOnboarding({
        examYear: 1999,
        preparationLevel: 'expert',
        dailyGoalMinutes: 5,
      }),
    (error: unknown) => {
      assert.ok(error instanceof ValidationError);
      assert.equal(error.errors.length, 3);
      return true;
    },
  );
  const year = new Date().getUTCFullYear() + 1;
  const valid = validateOnboarding({
    examYear: year,
    preparationLevel: 'beginner',
    dailyGoalMinutes: 90,
  });
  assert.equal(valid.examYear, year);
  assert.equal(valid.dailyGoalMinutes, 90);
});

test('answer validation enforces minimum and maximum word counts', () => {
  const short = Array.from({ length: 39 }, (_, index) => `w${index}`).join(' ');
  assert.throws(
    () =>
      validateAnswerSubmission({
        questionText: 'A sufficiently long question about governance?',
        answerText: short,
      }),
    ValidationError,
  );
  const tooLong = Array.from({ length: 801 }, (_, index) => `w${index}`).join(' ');
  assert.throws(
    () =>
      validateAnswerSubmission({
        questionText: 'A sufficiently long question about governance?',
        answerText: tooLong,
      }),
    ValidationError,
  );
  const valid = validateAnswerSubmission({
    questionText: 'A sufficiently long question about governance?',
    answerText: longAnswer,
  });
  assert.equal(valid.wordCount, 80);
  assert.equal(countWords('  two   words  '), 2);
});

test('mentor question validation trims and enforces limits', () => {
  assert.throws(() => validateMentorQuestion('  '), ValidationError);
  assert.throws(() => validateMentorQuestion('a'.repeat(2001)), ValidationError);
  assert.equal(validateMentorQuestion('  Explain federalism  '), 'Explain federalism');
});

test('demo evaluation is structurally valid and uses the requested marks', () => {
  const feedback = buildDemoEvaluation({
    questionText: 'Discuss the role of the monsoon in Indian agriculture.',
    answerText: longAnswer,
    marks: 15,
  });
  const validated = validateEvaluation(feedback);
  assert.equal(validated.overall.maxScore, 15);
  assert.ok(validated.overall.score >= 1 && validated.overall.score <= 15);
  assert.equal(validated.mode, 'demo');
  assert.ok(validated.improvements.length > 0);
  for (const key of [
    'understanding',
    'relevanceAccuracy',
    'introduction',
    'body',
    'examples',
    'conclusion',
  ] as const) {
    assert.ok(validated[key].score >= 1 && validated[key].score <= 10);
    assert.ok(validated[key].feedback.length > 0);
  }
});

test('validateEvaluation rejects fabricated or malformed results', () => {
  const good = buildDemoEvaluation({
    questionText: 'Discuss fiscal policy.',
    answerText: longAnswer,
    marks: 10,
  });
  assert.throws(() => validateEvaluation(null), /not an object/);
  assert.throws(
    () => validateEvaluation({ ...good, overall: { ...good.overall, score: 99 } }),
    /out of range/,
  );
  assert.throws(
    () => validateEvaluation({ ...good, disclaimer: '' }),
    /disclaimer missing/,
  );
  assert.throws(
    () => validateEvaluation({ ...good, mode: 'pretend' }),
    /mode must be demo or live/,
  );
  assert.throws(
    () => validateEvaluation({ ...good, improvements: [1, 2] }),
    /improvements must be a string array/,
  );
});

test('demo evaluation responds to answer quality without pretending to be official', () => {
  const weak = buildDemoEvaluation({
    questionText: 'Examine the basic structure doctrine.',
    answerText: 'The basic structure doctrine is about the Constitution and courts.',
    marks: 15,
  });
  const strong = buildDemoEvaluation({
    questionText: 'Examine the basic structure doctrine.',
    answerText: `${longAnswer}. For example, Kesavananda Bharati (1973) and Minerva Mills (1980) are relevant judgments. However, critics argue that judicial discretion is excessive. Therefore, the way forward is reasoned restraint and clearer doctrine.`,
    marks: 15,
  });
  assert.ok(strong.overall.score > weak.overall.score);
  assert.match(strong.disclaimer, /not an official UPSC assessment/i);
});
