import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Flame,
  ListChecks,
  Loader2,
  Newspaper,
  PenLine,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { AIStatus, DashboardData, StudyTask } from '../lib/types';
import { accentFor, formatMinutes, formatDate, relativeDate, todayLabel, cx } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  LinkButton,
  LoadingBlock,
  ProgressBar,
  SectionHeading,
} from '../components/ui';

const taskMeta: Record<string, { icon: typeof BookOpen; label: string }> = {
  lesson: { icon: BookOpen, label: 'Lesson' },
  practice: { icon: ListChecks, label: 'Practice' },
  'current-affairs': { icon: Newspaper, label: 'Current affairs' },
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyTask, setBusyTask] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboard, status] = await Promise.all([
        api.dashboard(),
        api.aiStatus().catch(() => null),
      ]);
      setData(dashboard);
      setAiStatus(status);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleTask = async (task: StudyTask) => {
    setBusyTask(task.id);
    try {
      const result = await api.toggleTask(task.id);
      setData(result.dashboard);
      toast(
        result.task.status === 'completed'
          ? 'Task completed. Your daily plan is up to date.'
          : 'Task reopened.',
        result.task.status === 'completed' ? 'success' : 'info',
      );
    } catch (caught) {
      toast(caught instanceof ApiError ? caught.message : 'Could not update the task.', 'error');
    } finally {
      setBusyTask(null);
    }
  };

  if (loading) {
    return <LoadingBlock label="Preparing your study day…" />;
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Alert tone="danger" title="Dashboard unavailable" onRetry={() => void load()}>
          {error || 'Please try again in a moment.'}
        </Alert>
      </div>
    );
  }

  const planProgress = data.tasksTotal ? Math.round((data.tasksCompleted / data.tasksTotal) * 100) : 0;
  const stats = data.stats;
  const lessonsPercent = stats.lessonsTotal
    ? Math.round((stats.lessonsCompleted / stats.lessonsTotal) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
            {todayLabel()}
          </p>
          <h1 className="mt-1.5 font-display text-[28px] leading-tight text-brand-900 sm:text-[34px]">
            {greeting()}, {data.greetingName}.
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {data.tasksTotal - data.tasksCompleted > 0
              ? `${data.tasksTotal - data.tasksCompleted} task${
                  data.tasksTotal - data.tasksCompleted === 1 ? '' : 's'
                } left in today's plan. A focused hour is enough to keep the thread.`
              : 'Your plan for today is complete. Take a moment to review what you learned.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="accent" icon={Flame}>
            {data.streak} day streak
          </Badge>
          <LinkButton to="/practice" size="sm" variant="secondary" icon={ListChecks}>
            Practise
          </LinkButton>
        </div>
      </div>

      {/* Mobile stats strip */}
      <div className="grid grid-cols-3 gap-2 sm:hidden">
        {[
          ['Plan', `${planProgress}%`],
          ['Accuracy', `${stats.accuracy}%`],
          ['Lessons', `${stats.lessonsCompleted}/${stats.lessonsTotal}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-surface px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-0.5 text-lg font-semibold text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Today's plan */}
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg text-ink">Today&apos;s plan</h2>
                  <Badge tone={planProgress === 100 ? 'success' : 'neutral'}>
                    {data.tasksCompleted} of {data.tasksTotal} done
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Sized for a {formatMinutes(data.dailyGoalMinutes)} study day.
                </p>
              </div>
              <div className="w-full max-w-[180px]">
                <ProgressBar value={data.tasksCompleted} max={data.tasksTotal} label="Daily plan" size="sm" />
              </div>
            </div>

            <ul className="mt-5 space-y-2">
              {data.tasks.map((task) => {
                const meta = taskMeta[task.kind] ?? taskMeta.lesson;
                const Icon = meta.icon;
                const done = task.status === 'completed';
                return (
                  <li
                    key={task.id}
                    className={cx(
                      'flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors',
                      done ? 'border-brand-100 bg-brand-50/60' : 'border-line bg-surface hover:border-brand-200',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => void toggleTask(task)}
                      disabled={busyTask === task.id}
                      aria-pressed={done}
                      aria-label={done ? `Mark "${task.title}" as pending` : `Mark "${task.title}" complete`}
                      className={cx(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors',
                        done
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-line-strong bg-surface text-transparent hover:border-brand-400',
                      )}
                    >
                      {busyTask === task.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" aria-hidden="true" />
                      ) : (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </button>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-paper text-muted">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      {task.lessonId ? (
                        <Link
                          to={`/lessons/${task.lessonId}`}
                          className={cx(
                            'block truncate text-[13.5px] font-medium hover:underline',
                            done ? 'text-muted line-through' : 'text-ink',
                          )}
                        >
                          {task.title}
                        </Link>
                      ) : (
                        <p className={cx('truncate text-[13.5px] font-medium', done ? 'text-muted line-through' : 'text-ink')}>
                          {task.title}
                        </p>
                      )}
                      <p className="mt-0.5 text-[11px] text-muted">
                        {meta.label} · {formatMinutes(task.estimatedMinutes)}
                      </p>
                    </div>
                    {task.kind === 'practice' ? (
                      <Link to="/practice" className="text-xs font-medium text-brand-700 hover:underline">
                        Open
                      </Link>
                    ) : task.kind === 'current-affairs' ? (
                      <Link to="/affairs" className="text-xs font-medium text-brand-700 hover:underline">
                        Open
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            {data.tasks.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                No tasks for today yet. Open Learn to choose a lesson and a plan will be created.
              </p>
            ) : null}
          </Card>

          {/* Continue learning */}
          {data.continueLearning ? (
            <Card className="overflow-hidden">
              <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge tone="brand">Continue learning</Badge>
                    <span className="text-[11px] text-muted">
                      {data.continueLearning.subjectName}
                    </span>
                  </div>
                  <h2 className="mt-2.5 text-lg leading-snug text-ink">
                    {data.continueLearning.title}
                  </h2>
                  <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
                    {data.continueLearning.summary}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <LinkButton
                      to={`/lessons/${data.continueLearning.id}`}
                      size="sm"
                      icon={ArrowRight}
                    >
                      Resume lesson
                    </LinkButton>
                    <span className="text-xs text-muted">
                      {formatMinutes(data.continueLearning.estimatedMinutes)} read
                    </span>
                  </div>
                </div>
                <div
                  className={cx(
                    'flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl sm:h-24 sm:w-24',
                    accentFor(
                      data.continueLearning.subjectId === 'polity'
                        ? 'teal'
                        : data.continueLearning.subjectId === 'history'
                          ? 'amber'
                          : data.continueLearning.subjectId === 'geography'
                            ? 'blue'
                            : data.continueLearning.subjectId === 'economy'
                              ? 'green'
                              : data.continueLearning.subjectId === 'environment'
                                ? 'olive'
                                : data.continueLearning.subjectId === 'science-tech'
                                  ? 'indigo'
                                  : 'rose',
                    ).soft,
                  )}
                >
                  <BookOpen className="h-8 w-8 text-brand-700" aria-hidden="true" />
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <EmptyState
                icon={CheckCircle2}
                title="Every lesson is complete"
                description="Keep the momentum with mixed practice or a Mains answer. You can also revise a topic from your bookmarks."
                action={<LinkButton to="/practice" size="sm">Open practice</LinkButton>}
              />
            </Card>
          )}

          {/* Quick actions */}
          <section aria-labelledby="quick-actions">
            <SectionHeading title="Where would you like to go?" />
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  to: '/practice',
                  icon: ListChecks,
                  title: 'Practice MCQs',
                  body: 'Filter by subject and difficulty, with explanations after every answer.',
                  tone: 'bg-brand-50 text-brand-700',
                },
                {
                  to: '/mentor',
                  icon: Sparkles,
                  title: 'Ask the AI mentor',
                  body: 'Get a structured explanation of any concept, linked to your lessons.',
                  tone: 'bg-indigo-50 text-indigo-700',
                },
                {
                  to: '/mains',
                  icon: PenLine,
                  title: 'Mains evaluation',
                  body: 'Write an answer and receive rubric-based, clearly labelled feedback.',
                  tone: 'bg-accent-50 text-accent-700',
                },
                {
                  to: '/affairs',
                  icon: Newspaper,
                  title: 'Current affairs',
                  body: 'Dated sample briefs with prelims facts and Mains relevance.',
                  tone: 'bg-sky-50 text-sky-700',
                },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group flex gap-3.5 rounded-2xl border border-line bg-surface p-4 shadow-card transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', item.tone)}>
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">{item.title}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted">{item.body}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Weak topics */}
          <Card className="p-5 sm:p-6">
            <SectionHeading
              title="Revision suggestions"
              description="Based on your recent practice accuracy."
              action={
                <Link to="/practice?tab=mistakes" className="text-xs font-semibold text-brand-700 hover:underline">
                  Review mistakes
                </Link>
              }
            />
            {data.weakTopics.length ? (
              <ul className="space-y-3">
                {data.weakTopics.map((topic) => (
                  <li key={`${topic.subjectId}-${topic.topic}`} className="rounded-xl border border-line p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{topic.topic}</p>
                        <p className="text-[11px] text-muted">
                          {topic.subjectName} · {topic.attempts} attempt{topic.attempts === 1 ? '' : 's'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cx(
                            'text-xs font-semibold',
                            topic.accuracy < 50 ? 'text-danger-600' : 'text-accent-700',
                          )}
                        >
                          {topic.accuracy}% accuracy
                        </span>
                        <Link
                          to={`/practice?subject=${topic.subjectId}&topic=${encodeURIComponent(topic.topic)}`}
                          className="rounded-lg bg-brand-50 px-2.5 py-1.5 text-[11px] font-semibold text-brand-700 hover:bg-brand-100"
                        >
                          Revise
                        </Link>
                      </div>
                    </div>
                    <div className="mt-2.5">
                      <ProgressBar
                        value={topic.accuracy}
                        tone={topic.accuracy < 50 ? 'danger' : 'accent'}
                        size="sm"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-xl border border-dashed border-line-strong bg-paper/60 p-5 text-sm text-muted">
                No weak topics detected yet. Attempt at least a few questions and this space will show
                where to focus.
              </div>
            )}
          </Card>
        </div>

        {/* Right rail */}
        <aside className="space-y-4" aria-label="Progress summary">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">This week</h2>
              <CalendarDays className="h-4 w-4 text-muted" aria-hidden="true" />
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div
                className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#0f6a5a ${lessonsPercent * 3.6}deg, #eef6f3 0deg)`,
                }}
                role="img"
                aria-label={`${lessonsPercent}% of lessons completed`}
              >
                <div className="flex h-[78px] w-[78px] flex-col items-center justify-center rounded-full bg-surface">
                  <span className="font-display text-xl text-brand-900">{lessonsPercent}%</span>
                  <span className="text-[9px] uppercase tracking-wide text-muted">lessons</span>
                </div>
              </div>
              <dl className="min-w-0 flex-1 space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted">Streak</dt>
                  <dd className="font-semibold text-ink">{data.streak} days</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted">Accuracy</dt>
                  <dd className="font-semibold text-ink">{stats.accuracy}%</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted">Lessons</dt>
                  <dd className="font-semibold text-ink">
                    {stats.lessonsCompleted}/{stats.lessonsTotal}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted">Study time</dt>
                  <dd className="font-semibold text-ink">{formatMinutes(stats.studyMinutes)}</dd>
                </div>
              </dl>
            </div>
            <Link
              to="/profile"
              className="mt-4 flex items-center justify-between rounded-xl bg-paper px-3.5 py-2.5 text-xs font-medium text-ink hover:bg-brand-50"
            >
              View full progress
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-brand-600" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-ink">Daily snapshot</h2>
            </div>
            <ul className="mt-3.5 space-y-3 text-xs">
              <li className="flex items-center justify-between">
                <span className="text-muted">Questions today</span>
                <span className="font-semibold text-ink">{data.attemptsToday}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted">Tasks completed</span>
                <span className="font-semibold text-ink">
                  {data.tasksCompleted}/{data.tasksTotal}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted">Saved items</span>
                <span className="font-semibold text-ink">{stats.bookmarks}</span>
              </li>
            </ul>
            <div className="mt-3.5 rounded-xl bg-brand-50 px-3.5 py-3 text-[11px] leading-relaxed text-brand-800">
              <TrendingUp className="mb-1 h-3.5 w-3.5" aria-hidden="true" />
              {stats.accuracy >= 70
                ? 'Your accuracy is strong. Push into harder questions to test recall.'
                : stats.questionsAttempted > 0
                  ? 'Short daily practice beats occasional long sessions. Try ten questions today.'
                  : 'Start with ten questions today. Your accuracy view will fill up as you go.'}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-ink">AI mentor</h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {aiStatus?.mode === 'live'
                ? `Connected to ${aiStatus.provider}. Answers are AI-generated and should be verified.`
                : 'Running in demo mode from the built-in sample library. No external AI model is called.'}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <Badge tone={aiStatus?.mode === 'live' ? 'success' : 'accent'}>
                {aiStatus?.mode === 'live' ? 'Live AI' : 'Demo mode'}
              </Badge>
              <Link to="/mentor" className="text-xs font-semibold text-brand-700 hover:underline">
                Ask a doubt
              </Link>
            </div>
          </Card>

          {data.latestArticle ? (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink">Current affairs</h2>
                <Badge tone="accent">Sample</Badge>
              </div>
              <Link to={`/affairs/${data.latestArticle.id}`} className="group mt-2.5 block">
                <p className="text-[13px] font-medium leading-snug text-ink group-hover:underline">
                  {data.latestArticle.title}
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">
                  {data.latestArticle.summary}
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-wide text-muted">
                  {relativeDate(data.latestArticle.publishedAt)} · Demo brief
                </p>
              </Link>
              <Link
                to="/affairs"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
              >
                All briefs <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </Card>
          ) : null}

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-accent-600" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-ink">Saved for revision</h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {stats.bookmarks} saved item{stats.bookmarks === 1 ? '' : 's'}, including{' '}
              {stats.savedExplanations} AI explanation{stats.savedExplanations === 1 ? '' : 's'}.
            </p>
            <Link
              to="/profile#bookmarks"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
            >
              Open bookmarks <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </Card>

          <p className="px-1 text-[10px] leading-relaxed text-muted">
            Last refreshed {formatDate(new Date().toISOString(), { hour: 'numeric', minute: '2-digit' })}.
            Sample content is for practice only.
          </p>
        </aside>
      </div>
    </div>
  );
}
