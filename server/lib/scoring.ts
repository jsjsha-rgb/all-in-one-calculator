/**
 * Pure scoring helpers. Kept free of database access so they can be unit tested
 * and reused by the quiz UI for instant feedback.
 */

export interface ScorableQuestion {
  id: string;
  correctAnswer: number;
}

export function isAnswerCorrect(selectedAnswer: number, correctAnswer: number): boolean {
  return Number.isInteger(selectedAnswer) && selectedAnswer === correctAnswer;
}

export interface QuizScore {
  total: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number;
  percentage: number;
}

/**
 * Scores a quiz attempt. Unanswered questions count towards the total but not
 * the attempted count, so an empty quiz returns zeros rather than NaN.
 */
export function scoreQuiz(
  questions: ScorableQuestion[],
  answers: Record<string, number | null | undefined>,
): QuizScore {
  const total = questions.length;
  let attempted = 0;
  let correct = 0;

  for (const question of questions) {
    const selected = answers[question.id];
    if (
      selected === null ||
      selected === undefined ||
      !Number.isInteger(selected) ||
      selected < 0 ||
      selected > 3
    )
      continue;
    attempted += 1;
    if (isAnswerCorrect(selected, question.correctAnswer)) correct += 1;
  }

  const incorrect = attempted - correct;
  const unanswered = total - attempted;
  return {
    total,
    attempted,
    correct,
    incorrect,
    unanswered,
    accuracy: attempted === 0 ? 0 : Math.round((correct / attempted) * 100),
    percentage: total === 0 ? 0 : Math.round((correct / total) * 100),
  };
}

export function scoreBand(accuracy: number): string {
  if (accuracy >= 80) return 'Excellent';
  if (accuracy >= 60) return 'Good';
  if (accuracy >= 40) return 'Developing';
  return 'Needs revision';
}
