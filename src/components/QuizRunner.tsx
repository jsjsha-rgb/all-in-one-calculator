import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { AttemptResult, PublicQuestion } from '../lib/types';
import { DIFFICULTY_STYLES, cx, scoreTone } from '../lib/format';
import { useToast } from '../context/ToastContext';
import { Alert, Badge, Button, Card, EmptyState, ProgressBar } from './ui';
import { ListChecks } from 'lucide-react';

interface AnswerRecord {
  selected: number;
  isCorrect: boolean;
  correctAnswer: number;
  explanation: string;
}

export function QuizRunner({
  questions,
  onExit,
  onAttemptSaved,
  compact = false,
}: {
  questions: PublicQuestion[];
  onExit?: () => void;
  onAttemptSaved?: () => void;
  compact?: boolean;
}) {
  const { toast } = useToast();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerRecord>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>(
    Object.fromEntries(questions.map((question) => [question.id, Boolean(question.bookmarked)])),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [finished, setFinished] = useState(false);

  const question = questions[index];
  const answeredCount = Object.keys(answers).length;
  const score = useMemo(() => {
    const records = Object.values(answers);
    const correct = records.filter((record) => record.isCorrect).length;
    return {
      correct,
      attempted: records.length,
      total: questions.length,
      accuracy: records.length ? Math.round((correct / records.length) * 100) : 0,
    };
  }, [answers, questions.length]);

  if (!questions.length) {
    return (
      <EmptyState
        icon={ListChecks}
        title="No questions match this selection"
        description="Try removing a filter or choosing another subject. The sample bank currently has 35 questions across seven GS areas."
        action={
          onExit ? (
            <Button variant="secondary" size="sm" onClick={onExit}>
              Change filters
            </Button>
          ) : undefined
        }
      />
    );
  }

  const submit = async () => {
    if (selected === null || result) return;
    setSubmitting(true);
    setError('');
    try {
      const attempt = await api.submitAttempt(question.id, selected);
      setResult(attempt);
      setAnswers((current) => ({
        ...current,
        [question.id]: {
          selected,
          isCorrect: attempt.isCorrect,
          correctAnswer: attempt.correctAnswer,
          explanation: attempt.explanation,
        },
      }));
      onAttemptSaved?.();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not save this answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((current) => current + 1);
    setSelected(null);
    setResult(null);
    setError('');
  };

  const toggleBookmark = async () => {
    try {
      const response = await api.toggleBookmark('question', question.id);
      setBookmarked((current) => ({ ...current, [question.id]: response.bookmarked }));
      toast(response.bookmarked ? 'Question saved to bookmarks.' : 'Bookmark removed.', 'info');
    } catch (caught) {
      toast(caught instanceof ApiError ? caught.message : 'Could not update bookmark.', 'error');
    }
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setResult(null);
    setAnswers({});
    setFinished(false);
    setError('');
  };

  // ---------------------------------------------------------------- Summary
  if (finished) {
    const percentage = score.total ? Math.round((score.correct / score.total) * 100) : 0;
    const tone = scoreTone(percentage);
    return (
      <div className="animate-rise space-y-5">
        <Card className="overflow-hidden">
          <div className="border-b border-line bg-brand-50/60 p-6 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
              Practice complete
            </p>
            <p className="mt-2 font-display text-5xl text-brand-900">
              {score.correct}
              <span className="text-2xl text-muted">/{score.total}</span>
            </p>
            <p className="mt-1 text-sm text-muted">
              {score.accuracy}% accuracy on {score.attempted} answered question
              {score.attempted === 1 ? '' : 's'}
            </p>
            <div className="mx-auto mt-4 max-w-xs">
              <ProgressBar
                value={score.correct}
                max={score.total}
                tone={tone === 'success' ? 'success' : tone === 'danger' ? 'danger' : 'accent'}
              />
            </div>
            <p className="mt-3 text-xs text-muted">
              {percentage >= 80
                ? 'Excellent recall. Try moving to a harder difficulty.'
                : percentage >= 60
                  ? 'A solid session. Review the explanations below before moving on.'
                  : 'Review each explanation carefully, then retry this set tomorrow.'}
            </p>
          </div>
          <div className="p-5">
            <h3 className="text-sm font-semibold text-ink">Question review</h3>
            <ul className="mt-3 space-y-2.5">
              {questions.map((item, itemIndex) => {
                const record = answers[item.id];
                return (
                  <li key={item.id} className="rounded-xl border border-line p-3.5">
                    <div className="flex items-start gap-2.5">
                      {record ? (
                        record.isCorrect ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-hidden="true" />
                        ) : (
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger-600" aria-hidden="true" />
                        )
                      ) : (
                        <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-line-strong" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium leading-snug text-ink">
                          {itemIndex + 1}. {item.questionText.split('\n')[0]}
                        </p>
                        {record ? (
                          <>
                            <p className="mt-1 text-[11px] text-muted">
                              Your answer: {item.options[record.selected]} · Correct:{' '}
                              <span className="font-medium text-ink">
                                {item.options[record.correctAnswer]}
                              </span>
                            </p>
                            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                              {record.explanation}
                            </p>
                          </>
                        ) : (
                          <p className="mt-1 text-[11px] text-muted">Not answered.</p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" icon={RotateCcw} onClick={restart}>
                Retry this set
              </Button>
              {onExit ? (
                <Button size="sm" icon={ArrowLeft} onClick={onExit}>
                  Back to practice
                </Button>
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const isLast = index + 1 === questions.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="font-semibold text-ink">
            Question {index + 1} of {questions.length}
          </span>
          <span aria-hidden="true">·</span>
          <span>{answeredCount} answered</span>
        </div>
        {onExit ? (
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden="true" /> Exit session
          </button>
        ) : null}
      </div>
      <ProgressBar value={index} max={questions.length} size="sm" />

      <Card className={cx('p-5 sm:p-6', compact && 'sm:p-5')}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{question.topic}</Badge>
          <span
            className={cx(
              'rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize',
              DIFFICULTY_STYLES[question.difficulty] ?? DIFFICULTY_STYLES.medium,
            )}
          >
            {question.difficulty}
          </span>
          {question.questionType === 'pyq-style' && question.examYear ? (
            <Badge tone="accent">PYQ-style · {question.examYear} sample</Badge>
          ) : (
            <Badge tone="neutral">Practice</Badge>
          )}
          <button
            type="button"
            onClick={() => void toggleBookmark()}
            aria-pressed={Boolean(bookmarked[question.id])}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted hover:bg-paper hover:text-ink"
          >
            {bookmarked[question.id] ? (
              <BookmarkCheck className="h-4 w-4 text-accent-600" aria-hidden="true" />
            ) : (
              <Bookmark className="h-4 w-4" aria-hidden="true" />
            )}
            {bookmarked[question.id] ? 'Saved' : 'Save'}
          </button>
        </div>

        <p className="mt-4 whitespace-pre-line text-[15px] font-medium leading-relaxed text-ink">
          {question.questionText}
        </p>

        <div role="radiogroup" aria-label="Answer options" className="mt-5 space-y-2.5">
          {question.options.map((option, optionIndex) => {
            const isSelected = selected === optionIndex;
            const showCorrect = result && optionIndex === result.correctAnswer;
            const showWrong = result && isSelected && !result.isCorrect;
            return (
              <label
                key={option}
                className={cx(
                  'flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-brand-300',
                  result ? 'cursor-default' : '',
                  showCorrect
                    ? 'border-success-600 bg-success-50'
                    : showWrong
                      ? 'border-danger-600 bg-danger-50'
                      : isSelected
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-line bg-surface hover:border-brand-200 hover:bg-paper/60',
                )}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={optionIndex}
                  checked={isSelected}
                  onChange={() => setSelected(optionIndex)}
                  disabled={Boolean(result)}
                  className="sr-only"
                />
                <span
                  className={cx(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold',
                    showCorrect
                      ? 'border-success-600 bg-success-600 text-white'
                      : showWrong
                        ? 'border-danger-600 bg-danger-600 text-white'
                        : isSelected
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-line-strong text-muted',
                  )}
                  aria-hidden="true"
                >
                  {String.fromCharCode(65 + optionIndex)}
                </span>
                <span className="leading-relaxed text-ink">{option}</span>
              </label>
            );
          })}
        </div>

        {error ? (
          <div className="mt-4">
            <Alert tone="danger" onRetry={() => void submit()}>
              {error}
            </Alert>
          </div>
        ) : null}

        {result ? (
          <div
            className={cx(
              'mt-5 rounded-xl border p-4',
              result.isCorrect ? 'border-success-100 bg-success-50' : 'border-danger-100 bg-danger-50',
            )}
            role="status"
          >
            <div className="flex items-center gap-2">
              {result.isCorrect ? (
                <CheckCircle2 className="h-4 w-4 text-success-600" aria-hidden="true" />
              ) : (
                <XCircle className="h-4 w-4 text-danger-600" aria-hidden="true" />
              )}
              <p
                className={cx(
                  'text-sm font-semibold',
                  result.isCorrect ? 'text-success-600' : 'text-danger-700',
                )}
              >
                {result.isCorrect
                  ? 'Correct.'
                  : `Not quite. Correct answer: ${question.options[result.correctAnswer]}`}
              </p>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-ink/90">{result.explanation}</p>
            <p className="mt-2 text-[10px] uppercase tracking-wide text-muted">
              {result.source}
            </p>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-muted">
            {result ? 'Read the explanation, then continue.' : 'Choose one option, then submit.'}
          </p>
          {result ? (
            <Button size={compact ? 'sm' : 'md'} onClick={next} icon={isLast ? CheckCircle2 : ArrowRight}>
              {isLast ? 'See results' : 'Next question'}
            </Button>
          ) : (
            <Button
              size={compact ? 'sm' : 'md'}
              onClick={() => void submit()}
              loading={submitting}
              disabled={selected === null}
            >
              Submit answer
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
