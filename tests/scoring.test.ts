import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAnswerCorrect, scoreBand, scoreQuiz } from '../server/lib/scoring.ts';

const questions = [
  { id: 'a', correctAnswer: 1 },
  { id: 'b', correctAnswer: 2 },
  { id: 'c', correctAnswer: 0 },
  { id: 'd', correctAnswer: 3 },
];

test('isAnswerCorrect only accepts the exact option index', () => {
  assert.equal(isAnswerCorrect(2, 2), true);
  assert.equal(isAnswerCorrect(1, 2), false);
  assert.equal(isAnswerCorrect(-1, 2), false);
});

test('an empty quiz returns zeros rather than NaN', () => {
  const score = scoreQuiz([], {});
  assert.deepEqual(score, {
    total: 0,
    attempted: 0,
    correct: 0,
    incorrect: 0,
    unanswered: 0,
    accuracy: 0,
    percentage: 0,
  });
  assert.ok(Number.isFinite(score.accuracy));
});

test('scoreQuiz counts correct, incorrect and unanswered questions', () => {
  const score = scoreQuiz(questions, { a: 1, b: 0, c: 0 });
  assert.equal(score.total, 4);
  assert.equal(score.attempted, 3);
  assert.equal(score.correct, 2);
  assert.equal(score.incorrect, 1);
  assert.equal(score.unanswered, 1);
  assert.equal(score.accuracy, 67);
  assert.equal(score.percentage, 50);
});

test('scoreQuiz ignores missing and out-of-range answers', () => {
  const score = scoreQuiz(questions, { a: 1, b: 9, c: undefined, d: null });
  assert.equal(score.attempted, 1);
  assert.equal(score.correct, 1);
  assert.equal(score.accuracy, 100);
});

test('all-correct and all-wrong attempts score 100 and 0', () => {
  const perfect = scoreQuiz(questions, { a: 1, b: 2, c: 0, d: 3 });
  assert.equal(perfect.accuracy, 100);
  assert.equal(perfect.correct, 4);
  const wrong = scoreQuiz(questions, { a: 0, b: 0, c: 1, d: 1 });
  assert.equal(wrong.accuracy, 0);
  assert.equal(wrong.incorrect, 4);
});

test('score bands match their thresholds', () => {
  assert.equal(scoreBand(80), 'Excellent');
  assert.equal(scoreBand(79), 'Good');
  assert.equal(scoreBand(60), 'Good');
  assert.equal(scoreBand(40), 'Developing');
  assert.equal(scoreBand(39), 'Needs revision');
});
