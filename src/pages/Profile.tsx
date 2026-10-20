import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookMarked,
  Bookmark,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  KeyRound,
  ListChecks,
  LogOut,
  PenLine,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  XCircle,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Bookmark as BookmarkType, HistoryAttempt, MainsSubmission, ProfileOverview, User } from '../lib/types';
import {
  PREPARATION_LABELS,
  cx,
  formatDate,
  formatMinutes,
  formatDayMonth,
  formatWeekday,
  pluralize,
} from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Field,
  LinkButton,
  LoadingBlock,
  PageHeader,
  ProgressBar,
  Select,
  StatTile,
  TabNav,
  TextInput,
} from '../components/ui';

const prepLevels = ['beginner', 'intermediate', 'advanced', 'working-professional'];

export function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState<ProfileOverview | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('bookmarks');

  const [history, setHistory] = useState<HistoryAttempt[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [mains, setMains] = useState<MainsSubmission[] | null>(null);
  const [mainsLoading, setMainsLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [examYear, setExamYear] = useState(String(user?.examYear ?? new Date().getFullYear() + 1));
  const [level, setLevel] = useState(user?.preparationLevel ?? 'beginner');
  const [minutes, setMinutes] = useState(String(user?.dailyGoalMinutes ?? 120));
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const load = () => {
    setError('');
    api
      .profile()
      .then((result) => {
        setData(result);
        setName(result.user.name);
        setExamYear(String(result.user.examYear ?? new Date().getFullYear() + 1));
        setLevel(result.user.preparationLevel ?? 'beginner');
        setMinutes(String(result.user.dailyGoalMinutes));
      })
      .catch((caught) =>
        setError(caught instanceof ApiError ? caught.message : 'Could not load your profile.'),
      );
  };

  useEffect(load, []);

  useEffect(() => {
    if (tab === 'history' && !history) {
      setHistoryLoading(true);
      api
        .history(100)
        .then((result) => setHistory(result.attempts))
        .catch((caught) =>
          toast(caught instanceof ApiError ? caught.message : 'Could not load question history.', 'error'),
        )
        .finally(() => setHistoryLoading(false));
    }
    if (tab === 'mains' && !mains) {
      setMainsLoading(true);
      api
        .mainsSubmissions()
        .then((result) => setMains(result.submissions))
        .catch((caught) =>
          toast(caught instanceof ApiError ? caught.message : 'Could not load Mains history.', 'error'),
        )
        .finally(() => setMainsLoading(false));
    }
  }, [tab, history, mains, toast]);

  const groups = useMemo(() => {
    if (!data)
      return {
        lessons: [],
        subjects: [],
        questions: [],
        articles: [],
        explanations: [],
      } as Record<string, BookmarkType[]>;
    return {
      lessons: data.bookmarks.filter((item) => item.itemType === 'lesson'),
      subjects: data.bookmarks.filter((item) => item.itemType === 'subject'),
      questions: data.bookmarks.filter((item) => item.itemType === 'question'),
      articles: data.bookmarks.filter((item) => item.itemType === 'article'),
      explanations: data.bookmarks.filter((item) => item.itemType === 'explanation'),
    };
  }, [data]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setProfileError('');
    setSavingProfile(true);
    try {
      const result = await api.updateProfile({
        name,
        examYear: Number(examYear),
        preparationLevel: level,
        dailyGoalMinutes: Number(minutes),
      });
      setUser(result.user as User);
      toast(result.message);
      setEditOpen(false);
      load();
    } catch (caught) {
      setProfileError(caught instanceof ApiError ? caught.message : 'Could not save your profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('The new passwords do not match.');
      return;
    }
    setSavingPassword(true);
    try {
      const result = await api.changePassword(currentPassword, newPassword);
      toast(result.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (caught) {
      setPasswordError(caught instanceof ApiError ? caught.message : 'Could not change your password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const removeBookmark = async (bookmark: BookmarkType) => {
    try {
      const result = await api.toggleBookmark(bookmark.itemType, bookmark.itemId);
      if (!result.bookmarked && data) {
        setData({ ...data, bookmarks: data.bookmarks.filter((item) => item.id !== bookmark.id) });
        toast('Bookmark removed.', 'info');
      }
    } catch (caught) {
      toast(caught instanceof ApiError ? caught.message : 'Could not remove the bookmark.', 'error');
    }
  };

  const signOut = async () => {
    await logout();
    navigate('/welcome');
  };

  if (error) {
    return <Alert tone="danger" title="Profile unavailable" onRetry={load}>{error}</Alert>;
  }
  if (!data) return <LoadingBlock label="Loading your progress…" />;

  const { stats, weeklyActivity, weakTopics } = data;
  const maxActivity = Math.max(1, ...weeklyActivity.map((day) => Math.max(day.attempts, day.tasks)));

  const bookmarkLink = (bookmark: BookmarkType): string => {
    if (bookmark.itemType === 'lesson') return `/lessons/${bookmark.itemId}`;
    if (bookmark.itemType === 'article') return `/affairs/${bookmark.itemId}`;
    if (bookmark.itemType === 'question') return '/practice?bookmarked=true';
    if (bookmark.itemType === 'subject') return `/learn/${bookmark.itemId}`;
    return '/mentor';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile & progress"
        title="Your preparation, in one view"
        description="Goals, learning progress, saved material and account settings. Everything here belongs to your account only."
        actions={
          <Button variant="secondary" size="sm" icon={Settings2} onClick={() => setEditOpen((open) => !open)}>
            {editOpen ? 'Close settings' : 'Edit goal'}
          </Button>
        }
      />

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={data.user.name} size="lg" />
            <div>
              <h2 className="font-display text-xl text-brand-900">{data.user.name}</h2>
              <p className="text-sm text-muted">{data.user.email}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge tone="brand" icon={Target}>
                  UPSC {data.user.examYear ?? '—'}
                </Badge>
                <Badge tone="neutral">
                  {PREPARATION_LABELS[data.user.preparationLevel ?? ''] ?? 'Level not set'}
                </Badge>
                <Badge tone="accent" icon={Clock3}>
                  {formatMinutes(data.user.dailyGoalMinutes)} / day
                </Badge>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                Joined {formatDate(data.user.createdAt)} · {pluralize(stats.streak, 'day')} current streak
              </p>
            </div>
          </div>
          <div className="w-full sm:max-w-[220px]">
            <ProgressBar
              value={stats.lessonsCompleted}
              max={stats.lessonsTotal}
              label="Syllabus coverage"
            />
            <p className="mt-2 text-[11px] text-muted">
              {stats.lessonsCompleted} of {stats.lessonsTotal} lessons ·{' '}
              {formatMinutes(stats.studyMinutes)} studied
            </p>
          </div>
        </div>

        {editOpen ? (
          <form onSubmit={saveProfile} className="mt-5 rounded-xl border border-line bg-paper/60 p-4">
            <h3 className="text-sm font-semibold text-ink">Study goals</h3>
            {profileError ? (
              <div className="mt-3">
                <Alert tone="danger">{profileError}</Alert>
              </div>
            ) : null}
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="profile-name">
                <TextInput
                  id="profile-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                />
              </Field>
              <Field label="Exam year" htmlFor="profile-year">
                <Select id="profile-year" value={examYear} onChange={(event) => setExamYear(event.target.value)}>
                  {Array.from({ length: 8 }, (_, index) => new Date().getFullYear() + index).map((year) => (
                    <option key={year} value={year}>
                      UPSC {year}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Preparation level" htmlFor="profile-level">
                <Select id="profile-level" value={level} onChange={(event) => setLevel(event.target.value)}>
                  {prepLevels.map((value) => (
                    <option key={value} value={value}>
                      {PREPARATION_LABELS[value]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Daily study time" htmlFor="profile-minutes">
                <Select id="profile-minutes" value={minutes} onChange={(event) => setMinutes(event.target.value)}>
                  {[30, 60, 90, 120, 150, 180, 240, 300, 360].map((value) => (
                    <option key={value} value={value}>
                      {formatMinutes(value)} per day
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="mt-4 flex gap-2">
              <Button type="submit" size="sm" icon={Save} loading={savingProfile}>
                Save changes
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
      </Card>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Lessons" value={`${stats.lessonsCompleted}/${stats.lessonsTotal}`} icon={BookOpen} />
        <StatTile label="Accuracy" value={`${stats.accuracy}%`} icon={Target} tone="accent" />
        <StatTile label="Questions" value={stats.questionsAttempted} icon={ListChecks} />
        <StatTile label="Streak" value={`${stats.streak}d`} icon={Flame} tone="accent" />
        <StatTile label="Bookmarks" value={stats.bookmarks} icon={Bookmark} />
        <StatTile label="Mains" value={stats.mainsSubmissions} icon={PenLine} tone="accent" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg text-ink">This week</h2>
              <p className="text-xs text-muted">Questions attempted and tasks completed.</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-brand-600" /> Questions
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-accent-400" /> Tasks
              </span>
            </div>
          </div>
          <div className="mt-5 flex h-40 items-end gap-2 sm:gap-3">
            {weeklyActivity.map((day) => (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-32 w-full items-end justify-center gap-0.5">
                  <div
                    className="w-1/2 max-w-[14px] rounded-t-md bg-brand-600"
                    style={{ height: `${Math.max(3, (day.attempts / maxActivity) * 100)}%` }}
                    title={`${day.attempts} questions`}
                  />
                  <div
                    className="w-1/2 max-w-[14px] rounded-t-md bg-accent-400"
                    style={{ height: `${Math.max(3, (day.tasks / maxActivity) * 100)}%` }}
                    title={`${day.tasks} tasks`}
                  />
                </div>
                <span className="text-[10px] font-medium text-muted">
                  {formatWeekday(day.date)}
                </span>
                <span className="text-[9px] text-muted">{formatDayMonth(day.date)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg text-ink">Revision focus</h2>
            <Link to="/practice?tab=mistakes" className="text-xs font-semibold text-brand-700 hover:underline">
              Review mistakes
            </Link>
          </div>
          {weakTopics.length ? (
            <ul className="mt-4 space-y-3">
              {weakTopics.map((topic) => (
                <li key={`${topic.subjectId}-${topic.topic}`}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-ink">{topic.topic}</span>
                    <span className={topic.accuracy < 50 ? 'font-semibold text-danger-600' : 'font-semibold text-accent-700'}>
                      {topic.accuracy}%
                    </span>
                  </div>
                  <p className="text-[10px] text-muted">
                    {topic.subjectName} · {pluralize(topic.attempts, 'attempt')}
                  </p>
                  <div className="mt-1.5">
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
            <div className="mt-4 rounded-xl border border-dashed border-line-strong p-4 text-xs leading-relaxed text-muted">
              No weak topics yet. As you answer questions, this panel highlights areas where accuracy
              is below 100%.
            </div>
          )}
        </Card>
      </div>

      <TabNav
        current={tab}
        onChange={setTab}
        items={[
          { id: 'bookmarks', label: 'Bookmarks', count: data.bookmarks.length },
          { id: 'history', label: 'Question history', count: stats.questionsAttempted },
          { id: 'mains', label: 'Mains submissions', count: stats.mainsSubmissions },
          { id: 'settings', label: 'Account settings' },
        ]}
      />

      {tab === 'bookmarks' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {(
            [
              ['lessons', 'Lessons', BookOpen, 'Saved lesson notes for revision.'],
              ['subjects', 'Subjects', BookMarked, 'Whole GS areas you are tracking.'],
              ['questions', 'Questions', ListChecks, 'Questions you marked for another look.'],
              ['articles', 'Current affairs', BookMarked, 'Sample briefs saved for revision.'],
              ['explanations', 'AI explanations', Sparkles, 'Mentor answers saved to your notes.'],
            ] as Array<[keyof typeof groups, string, typeof BookOpen, string]>
          ).map(([key, label, Icon, description]) => {
            const items = groups[key];
            return (
              <Card key={key} className="p-5">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-brand-700" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-ink">{label}</h2>
                  <Badge tone="neutral">{items.length}</Badge>
                </div>
                <p className="mt-1 text-[11px] text-muted">{description}</p>
                {items.length ? (
                  <ul className="mt-3 space-y-2">
                    {items.map((bookmark) => (
                      <li
                        key={bookmark.id}
                        className="flex items-start gap-2 rounded-xl border border-line px-3 py-2.5"
                      >
                        <Link
                          to={bookmarkLink(bookmark)}
                          className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-ink hover:underline"
                        >
                          <span className={key === 'explanations' ? 'line-clamp-2' : 'line-clamp-1'}>
                            {bookmark.title}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-muted">
                            Saved {formatDate(bookmark.createdAt)}
                          </span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => void removeBookmark(bookmark)}
                          className="rounded-md p-1 text-muted hover:bg-danger-50 hover:text-danger-600"
                          aria-label={`Remove bookmark: ${bookmark.title.slice(0, 40)}`}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 rounded-xl bg-paper px-3 py-2.5 text-xs text-muted">
                    Nothing saved in this category yet.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      ) : null}

      {tab === 'history' ? (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg text-ink">Question history</h2>
              <p className="text-xs text-muted">Your most recent attempts, newest first.</p>
            </div>
            <LinkButton to="/practice?tab=history" variant="secondary" size="sm">
              Open full review
            </LinkButton>
          </div>
          {historyLoading ? (
            <div className="mt-4"><LoadingBlock label="Loading attempts…" /></div>
          ) : history && history.length ? (
            <ul className="mt-4 divide-y divide-line">
              {history.slice(0, 25).map((attempt) => (
                <li key={attempt.id} className="flex items-start gap-3 py-3">
                  {attempt.isCorrect ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-600" aria-hidden="true" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger-600" aria-hidden="true" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[13px] font-medium leading-relaxed text-ink">
                      {attempt.questionText}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted">
                      {attempt.subjectName} · {attempt.topic} · {formatDate(attempt.createdAt)}
                    </p>
                  </div>
                  <Badge tone={attempt.isCorrect ? 'success' : 'danger'}>
                    {attempt.isCorrect ? 'Correct' : 'Incorrect'}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : !historyLoading ? (
            <p className="mt-4 rounded-xl bg-paper px-4 py-5 text-center text-sm text-muted">
              No attempts yet. Start with a ten-question practice set.
            </p>
          ) : null}
        </Card>
      ) : null}

      {tab === 'mains' ? (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg text-ink">Mains submissions</h2>
              <p className="text-xs text-muted">Saved evaluations and their indicative scores.</p>
            </div>
            <LinkButton to="/mains?tab=history" variant="secondary" size="sm">
              Open evaluations
            </LinkButton>
          </div>
          {mainsLoading ? (
            <div className="mt-4"><LoadingBlock label="Loading submissions…" /></div>
          ) : mains && mains.length ? (
            <ul className="mt-4 space-y-2.5">
              {mains.map((submission) => (
                <li key={submission.id} className="rounded-xl border border-line p-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="brand">{submission.subjectName ?? 'Mains'}</Badge>
                    <span className="text-[10px] text-muted">{formatDate(submission.createdAt)}</span>
                    {submission.overall ? (
                      <span className="ml-auto text-xs font-semibold text-brand-700">
                        {submission.overall.score}/{submission.overall.maxScore} · {submission.overall.band}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink">
                    {submission.questionText}
                  </p>
                  <p className="mt-1 text-[10px] text-muted">{submission.wordCount} words · {submission.mode} mode</p>
                </li>
              ))}
            </ul>
          ) : !mainsLoading ? (
            <p className="mt-4 rounded-xl bg-paper px-4 py-5 text-center text-sm text-muted">
              No Mains answers yet. Your first evaluation will appear here.
            </p>
          ) : null}
        </Card>
      ) : null}

      {tab === 'settings' ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-brand-700" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-ink">Change password</h2>
            </div>
            <p className="mt-1 text-xs text-muted">
              Changing your password signs out other devices but keeps this session active.
            </p>
            <form onSubmit={changePassword} className="mt-4 space-y-3.5">
              {passwordError ? <Alert tone="danger">{passwordError}</Alert> : null}
              <Field label="Current password" htmlFor="current-password">
                <TextInput
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                />
              </Field>
              <Field label="New password" htmlFor="new-password" hint="8+ characters, 1 number">
                <TextInput
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
              </Field>
              <Field label="Confirm new password" htmlFor="confirm-password">
                <TextInput
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </Field>
              <Button type="submit" size="sm" loading={savingPassword} icon={ShieldCheck}>
                Update password
              </Button>
            </form>
          </Card>

          <div className="space-y-4">
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-brand-700" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-ink">Account</h2>
              </div>
              <dl className="mt-3 space-y-2.5 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Email</dt>
                  <dd className="break-all font-medium text-ink">{data.user.email}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Member since</dt>
                  <dd className="font-medium text-ink">{formatDate(data.user.createdAt)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Exam goal</dt>
                  <dd className="font-medium text-ink">UPSC {data.user.examYear}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Daily goal</dt>
                  <dd className="font-medium text-ink">{formatMinutes(data.user.dailyGoalMinutes)}</dd>
                </div>
              </dl>
              <Button variant="secondary" size="sm" className="mt-4" icon={Settings2} onClick={() => setEditOpen(true)}>
                Edit study goals
              </Button>
            </Card>

            <Card className="p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-ink">Privacy & data</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                This workspace stores your name, email, goals and study activity. Your lessons,
                attempts, bookmarks, chats and evaluations are visible only to your account. AI
                provider keys are never sent to the browser.
              </p>
              <ul className="mt-3 space-y-1.5 text-[11px] leading-relaxed text-muted">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-success-600" aria-hidden="true" />
                  Server-side session cookies (HttpOnly)
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-success-600" aria-hidden="true" />
                  Per-user data access checks on every endpoint
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-success-600" aria-hidden="true" />
                  Rate limits on AI, login and evaluation routes
                </li>
              </ul>
              <Button variant="ghost" size="sm" className="mt-4 text-danger-600 hover:bg-danger-50" icon={LogOut} onClick={() => void signOut()}>
                Log out
              </Button>
            </Card>

            <Card className="border-accent-100 bg-accent-50 p-5">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-accent-700" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-accent-700">Demo workspace notes</h2>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-accent-700">
                Data is stored locally in SQLite for this prototype. Point the data layer at Supabase
                to move to managed Postgres with row-level security (migration included in the repo).
              </p>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
