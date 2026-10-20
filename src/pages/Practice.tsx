import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  History,
  ListChecks,
  Play,
  RotateCcw,
  Target,
  XCircle,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { HistoryAttempt, Mistake, PublicQuestion } from '../lib/types';
import { DIFFICULTY_STYLES, cx, formatDate, pluralize } from '../lib/format';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  LinkButton,
  LoadingBlock,
  PageHeader,
  ProgressBar,
  Select,
  TabNav,
} from '../components/ui';
import { QuizRunner } from '../components/QuizRunner';

interface Filters {
  subjects: Array<{ id: string; name: string; count: number }>;
  topics: Array<{ subjectId: string; topic: string; count: number }>;
  years: number[];
  difficulties: Array<{ value: string; count: number }>;
  total: number;
}

type Tab = 'practice' | 'history' | 'mistakes';

export function PracticePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: Tab = tabParam === 'history' ? 'history' : tabParam === 'mistakes' ? 'mistakes' : 'practice';

  const [filters, setFilters] = useState<Filters | null>(null);
  const [subject, setSubject] = useState(searchParams.get('subject') ?? '');
  const [topic, setTopic] = useState(searchParams.get('topic') ?? '');
  const [difficulty, setDifficulty] = useState('');
  const [year, setYear] = useState('');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(searchParams.get('bookmarked') === 'true');

  const [session, setSession] = useState<PublicQuestion[] | null>(null);
  const [starting, setStarting] = useState(false);
  const [sessionError, setSessionError] = useState('');

  const [history, setHistory] = useState<HistoryAttempt[] | null>(null);
  const [mistakes, setMistakes] = useState<Mistake[] | null>(null);
  const [tabLoading, setTabLoading] = useState(false);
  const [tabError, setTabError] = useState('');
  const [stats, setStats] = useState<{
    overall: { attempts: number; correct: number; accuracy: number };
    bySubject: Array<{ id: string; name: string; attempts: number; correct: number; accuracy: number }>;
  } | null>(null);

  useEffect(() => {
    api.filters().then(setFilters).catch(() => setFilters(null));
    api.practiceStats().then(setStats).catch(() => setStats(null));
  }, []);

  useEffect(() => {
    if (tab === 'practice') return;
    setTabLoading(true);
    setTabError('');
    const loader = tab === 'history' ? api.history(100) : api.mistakes();
    loader
      .then((result) => {
        if (tab === 'history' && 'attempts' in result) setHistory(result.attempts);
        if (tab === 'mistakes' && 'mistakes' in result) setMistakes(result.mistakes);
      })
      .catch((caught) =>
        setTabError(caught instanceof ApiError ? caught.message : 'Could not load this view.'),
      )
      .finally(() => setTabLoading(false));
  }, [tab]);

  const changeTab = (next: string) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'practice') params.delete('tab');
    else params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  const topics = useMemo(() => {
    if (!filters) return [];
    return subject ? filters.topics.filter((item) => item.subjectId === subject) : filters.topics;
  }, [filters, subject]);

  const start = async (customQuestions?: PublicQuestion[]) => {
    if (customQuestions) {
      setSession(customQuestions);
      return;
    }
    setStarting(true);
    setSessionError('');
    try {
      const result = await api.questions({
        subject,
        topic,
        difficulty,
        year,
        bookmarked: bookmarkedOnly || undefined,
        limit: 10,
      });
      if (!result.questions.length) {
        setSessionError('No questions match those filters yet. Try a different subject or difficulty.');
        setSession([]);
        return;
      }
      setSession(result.questions);
      const params = new URLSearchParams(searchParams);
      if (subject) params.set('subject', subject);
      else params.delete('subject');
      if (topic) params.set('topic', topic);
      else params.delete('topic');
      params.delete('tab');
      setSearchParams(params, { replace: true });
    } catch (caught) {
      setSessionError(caught instanceof ApiError ? caught.message : 'Could not load questions.');
    } finally {
      setStarting(false);
    }
  };

  const exitSession = () => {
    setSession(null);
    setSessionError('');
    api.practiceStats().then(setStats).catch(() => undefined);
  };

  const practiceMistake = (mistake: Mistake) => {
    setSession([
      {
        id: mistake.id,
        subjectId: mistake.subjectId,
        topic: mistake.topic,
        examYear: null,
        questionText: mistake.questionText,
        options: mistake.options,
        difficulty: mistake.difficulty as PublicQuestion['difficulty'],
        source: mistake.source,
        questionType: 'mcq',
        bookmarked: false,
      },
    ]);
    changeTab('practice');
  };

  const retryAllMistakes = () => {
    if (!mistakes?.length) return;
    setSession(
      mistakes.slice(0, 10).map((mistake) => ({
        id: mistake.id,
        subjectId: mistake.subjectId,
        topic: mistake.topic,
        examYear: null,
        questionText: mistake.questionText,
        options: mistake.options,
        difficulty: mistake.difficulty as PublicQuestion['difficulty'],
        source: mistake.source,
        questionType: 'mcq' as const,
        bookmarked: false,
      })),
    );
    changeTab('practice');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Practice"
        title="Turn knowledge into marks"
        description="Attempt original practice questions and clearly labelled PYQ-style samples. Answers are checked on the server, with an explanation and source after every attempt."
        actions={
          stats ? (
            <Badge tone={stats.overall.accuracy >= 60 ? 'success' : 'accent'}>
              {stats.overall.attempts
                ? `${stats.overall.accuracy}% accuracy · ${stats.overall.attempts} attempts`
                : 'No attempts yet'}
            </Badge>
          ) : undefined
        }
      />

      <TabNav
        current={tab}
        onChange={changeTab}
        items={[
          { id: 'practice', label: 'Practice' },
          { id: 'history', label: 'History', count: stats?.overall.attempts },
          { id: 'mistakes', label: 'Mistakes' },
        ]}
      />

      {tab === 'practice' ? (
        session ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface px-4 py-3">
              <p className="text-xs text-muted">
                Session: {pluralize(session.length, 'question')}
                {subject ? ` · ${filters?.subjects.find((item) => item.id === subject)?.name ?? subject}` : ''}
                {topic ? ` · ${topic}` : ''}
              </p>
              <Button variant="ghost" size="sm" icon={RotateCcw} onClick={exitSession}>
                New session
              </Button>
            </div>
            <QuizRunner questions={session} onExit={exitSession} onAttemptSaved={() => {
              api.practiceStats().then(setStats).catch(() => undefined);
            }} />
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <ListChecks className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg text-ink">Build a practice set</h2>
                  <p className="text-xs text-muted">
                    {filters ? `${filters.total} questions available` : 'Loading question bank…'}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Subject" htmlFor="filter-subject">
                  <Select
                    id="filter-subject"
                    value={subject}
                    onChange={(event) => {
                      setSubject(event.target.value);
                      setTopic('');
                    }}
                  >
                    <option value="">All subjects</option>
                    {filters?.subjects.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.count})
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Topic" htmlFor="filter-topic">
                  <Select
                    id="filter-topic"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    disabled={!topics.length}
                  >
                    <option value="">All topics</option>
                    {topics.map((item) => (
                      <option key={`${item.subjectId}-${item.topic}`} value={item.topic}>
                        {item.topic} ({item.count})
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Difficulty" htmlFor="filter-difficulty">
                  <Select
                    id="filter-difficulty"
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value)}
                  >
                    <option value="">Any difficulty</option>
                    {filters?.difficulties.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.value.charAt(0).toUpperCase() + item.value.slice(1)} ({item.count})
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Exam year" htmlFor="filter-year" hint="PYQ-style samples">
                  <Select id="filter-year" value={year} onChange={(event) => setYear(event.target.value)}>
                    <option value="">Any year</option>
                    {filters?.years.map((item) => (
                      <option key={item} value={item}>
                        {item} (sample)
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-line px-3.5 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={bookmarkedOnly}
                  onChange={(event) => setBookmarkedOnly(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-line-strong text-brand-700 focus:ring-brand-200"
                />
                <span>
                  <span className="font-medium text-ink">Only my bookmarked questions</span>
                  <span className="mt-0.5 block text-[11px] text-muted">
                    Useful for a revision-only session.
                  </span>
                </span>
              </label>

              {sessionError ? (
                <div className="mt-4">
                  <Alert tone="warning">{sessionError}</Alert>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button onClick={() => void start()} loading={starting} icon={Play}>
                  Start 10-question set
                </Button>
                <p className="text-[11px] text-muted">
                  Answers and explanations are revealed only after you submit.
                </p>
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="p-5">
                <h2 className="text-sm font-semibold text-ink">Your accuracy by subject</h2>
                {stats && stats.bySubject.length ? (
                  <ul className="mt-4 space-y-3">
                    {stats.bySubject.map((item) => (
                      <li key={item.id}>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate text-ink">{item.name}</span>
                          <span className="shrink-0 font-semibold text-muted">{item.accuracy}%</span>
                        </div>
                        <div className="mt-1.5">
                          <ProgressBar
                            value={item.accuracy}
                            tone={item.accuracy >= 70 ? 'success' : item.accuracy >= 45 ? 'accent' : 'danger'}
                            size="sm"
                          />
                        </div>
                        <p className="mt-1 text-[10px] text-muted">
                          {item.correct}/{item.attempts} correct
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    Attempt a practice set and your subject-wise accuracy will appear here.
                  </p>
                )}
              </Card>
              <Card className="bg-brand-50/60 p-5">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-brand-700" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-brand-900">A useful habit</h2>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-brand-800">
                  Attempt ten questions, then read every explanation — including for the ones you got
                  right. The review, not the score, is where the learning happens.
                </p>
                <LinkButton to="/practice?tab=mistakes" variant="secondary" size="sm" className="mt-3">
                  Review mistakes
                </LinkButton>
              </Card>
            </div>
          </div>
        )
      ) : null}

      {tab === 'history' ? (
        <div>
          {tabLoading ? <LoadingBlock label="Loading attempt history…" /> : null}
          {tabError ? <Alert tone="danger">{tabError}</Alert> : null}
          {!tabLoading && !tabError ? (
            history && history.length ? (
              <div className="space-y-3">
                <p className="text-xs text-muted">
                  Showing the most recent {history.length} attempts. Expand a row to review the
                  explanation.
                </p>
                {history.map((attempt) => (
                  <details key={attempt.id} className="group rounded-2xl border border-line bg-surface p-4 shadow-card">
                    <summary className="flex cursor-pointer list-none items-start gap-3">
                      {attempt.isCorrect ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-hidden="true" />
                      ) : (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger-600" aria-hidden="true" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium leading-snug text-ink">
                          {attempt.questionText.split('\n')[0]}
                        </span>
                        <span className="mt-1 block text-[11px] text-muted">
                          {attempt.subjectName} · {attempt.topic} · {formatDate(attempt.createdAt)} ·{' '}
                          {attempt.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <div className="mt-4 border-t border-line pt-3 text-[13px]">
                      <p className="text-ink">{attempt.questionText}</p>
                      <ul className="mt-3 space-y-1.5">
                        {attempt.options.map((option, index) => (
                          <li
                            key={option}
                            className={cx(
                              'rounded-lg border px-3 py-2',
                              index === attempt.correctAnswer
                                ? 'border-success-100 bg-success-50 text-success-600'
                                : index === attempt.selectedAnswer
                                  ? 'border-danger-100 bg-danger-50 text-danger-700'
                                  : 'border-line text-muted',
                            )}
                          >
                            {String.fromCharCode(65 + index)}. {option}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 leading-relaxed text-muted">{attempt.explanation}</p>
                      <p className="mt-2 text-[10px] uppercase tracking-wide text-muted">
                        {attempt.source}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={History}
                title="No attempts yet"
                description="Your question history will build up as you practise. Attempts are saved to your account automatically."
                action={<Button size="sm" onClick={() => changeTab('practice')}>Start practising</Button>}
              />
            )
          ) : null}
        </div>
      ) : null}

      {tab === 'mistakes' ? (
        <div>
          {tabLoading ? <LoadingBlock label="Gathering your mistakes…" /> : null}
          {tabError ? <Alert tone="danger">{tabError}</Alert> : null}
          {!tabLoading && !tabError ? (
            mistakes && mistakes.length ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-muted">
                    {mistakes.length} question{mistakes.length === 1 ? '' : 's'} to revisit, based on
                    your latest incorrect attempt.
                  </p>
                  <Button size="sm" icon={RotateCcw} onClick={retryAllMistakes}>
                    Retry first 10
                  </Button>
                </div>
                {mistakes.map((mistake) => (
                  <Card key={mistake.id} className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="brand">{mistake.subjectName}</Badge>
                      <span className="text-[11px] text-muted">{mistake.topic}</span>
                      <span
                        className={cx(
                          'rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize',
                          DIFFICULTY_STYLES[mistake.difficulty] ?? DIFFICULTY_STYLES.medium,
                        )}
                      >
                        {mistake.difficulty}
                      </span>
                      <span className="ml-auto text-[10px] text-muted">
                        {formatDate(mistake.attemptedAt)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium leading-relaxed text-ink">
                      {mistake.questionText}
                    </p>
                    <div className="mt-3 space-y-1.5 text-[13px]">
                      <p className="rounded-lg border border-danger-100 bg-danger-50 px-3 py-2 text-danger-700">
                        Your answer: {mistake.options[mistake.selectedAnswer]}
                      </p>
                      <p className="rounded-lg border border-success-100 bg-success-50 px-3 py-2 text-success-600">
                        Correct: {mistake.options[mistake.correctAnswer]}
                      </p>
                    </div>
                    <p className="mt-3 text-[13px] leading-relaxed text-muted">{mistake.explanation}</p>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                      <p className="text-[10px] uppercase tracking-wide text-muted">{mistake.source}</p>
                      <Button size="sm" variant="secondary" icon={Bookmark} onClick={() => practiceMistake(mistake)}>
                        Retry this question
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="No mistakes to review"
                description="Either you have not attempted questions yet, or your latest attempt for every question was correct. Keep it up."
                action={<Button size="sm" onClick={() => changeTab('practice')}>Practise more</Button>}
              />
            )
          ) : null}
        </div>
      ) : null}

      {tab !== 'practice' ? (
        <div className="flex justify-end">
          <LinkButton to="/mentor" variant="ghost" size="sm" icon={ArrowRight}>
            Ask the mentor about a weak area
          </LinkButton>
        </div>
      ) : null}
    </div>
  );
}
