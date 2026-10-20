import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  ListChecks,
  Search,
  Sparkles,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { Subject, SubjectDetail } from '../lib/types';
import { accentFor, cx, formatMinutes, pluralize } from '../lib/format';
import { useToast } from '../context/ToastContext';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  LinkButton,
  LoadingBlock,
  PageHeader,
  ProgressBar,
  TextInput,
} from '../components/ui';

export function LearnPage() {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const load = () => {
    setError('');
    api
      .subjects()
      .then((result) => setSubjects(result.subjects))
      .catch((caught) =>
        setError(caught instanceof ApiError ? caught.message : 'Could not load the syllabus.'),
      );
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    if (!subjects) return [];
    const term = query.trim().toLowerCase();
    if (!term) return subjects;
    return subjects.filter(
      (subject) =>
        subject.name.toLowerCase().includes(term) ||
        subject.description.toLowerCase().includes(term) ||
        subject.syllabusSection.toLowerCase().includes(term),
    );
  }, [subjects, query]);

  if (error) {
    return <Alert tone="danger" title="Syllabus unavailable" onRetry={load}>{error}</Alert>;
  }
  if (!subjects) return <LoadingBlock label="Opening the syllabus…" />;

  const totalLessons = subjects.reduce((sum, subject) => sum + subject.lessonCount, 0);
  const completedLessons = subjects.reduce((sum, subject) => sum + subject.completedCount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learn"
        title="Your learning journey"
        description="Seven GS areas, concise notes and clear objectives. Work through a lesson at a time and your progress carries across practice and revision."
        actions={
          <LinkButton to="/practice" variant="secondary" icon={ListChecks}>
            Practice instead
          </LinkButton>
        }
      />

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
              Library progress
            </p>
            <h2 className="mt-1 font-display text-2xl text-brand-900">
              {completedLessons} of {totalLessons} lessons complete
            </h2>
            <p className="mt-1 text-sm text-muted">
              {completedLessons === 0
                ? 'Begin with Indian Polity. The first lesson takes about 20 minutes.'
                : `${totalLessons - completedLessons} lessons remain. A steady pace beats a weekend sprint.`}
            </p>
          </div>
          <div className="w-full sm:max-w-xs">
            <ProgressBar
              value={completedLessons}
              max={totalLessons}
              label="Overall completion"
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {subjects.map((subject) => (
                <span
                  key={subject.id}
                  title={`${subject.name}: ${subject.completedCount}/${subject.lessonCount}`}
                  className={cx(
                    'h-1.5 flex-1 rounded-full',
                    subject.completedCount === subject.lessonCount
                      ? accentFor(subject.accent).bar
                      : subject.completedCount > 0
                        ? 'bg-brand-300'
                        : 'bg-line',
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <label htmlFor="subject-search" className="sr-only">
            Search subjects
          </label>
          <TextInput
            id="subject-search"
            placeholder="Search subjects or syllabus sections"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted">{pluralize(filtered.length, 'subject')} shown</p>
      </div>

      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((subject) => {
            const accent = accentFor(subject.accent);
            const percent = subject.lessonCount
              ? Math.round((subject.completedCount / subject.lessonCount) * 100)
              : 0;
            return (
              <Link
                key={subject.id}
                to={`/learn/${subject.id}`}
                className="group flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition-colors hover:border-brand-200 hover:bg-brand-50/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold', accent.chip)}>
                    <span className={cx('h-1.5 w-1.5 rounded-full', accent.dot)} />
                    {subject.syllabusSection}
                  </span>
                  <span className="text-[11px] text-muted">
                    {subject.completedCount}/{subject.lessonCount} done
                  </span>
                </div>
                <h2 className="mt-3 font-display text-xl leading-snug text-brand-900">{subject.name}</h2>
                <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-muted">{subject.description}</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1">
                    <ProgressBar value={percent} tone={percent === 100 ? 'success' : 'brand'} size="sm" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
                    {subject.completedCount === 0 ? 'Start' : percent === 100 ? 'Review' : 'Continue'}
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title="No subjects match that search"
          description="Try a broader term such as polity, geography or ethics."
          action={<Button variant="secondary" size="sm" onClick={() => setQuery('')}>Clear search</Button>}
        />
      )}

      <Card className="flex flex-col gap-4 border-brand-100 bg-brand-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-brand-700">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-brand-900">Stuck on a concept?</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-brand-800">
              The AI mentor can explain a topic in plain language, then suggest what to revise next.
            </p>
          </div>
        </div>
        <LinkButton to="/mentor" size="sm" variant="secondary" icon={ArrowRight}>
          Ask the mentor
        </LinkButton>
      </Card>
    </div>
  );
}

export function SubjectPage() {
  const { subjectId = '' } = useParams();
  const { toast } = useToast();
  const [subject, setSubject] = useState<SubjectDetail | null>(null);
  const [error, setError] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [marking, setMarking] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setError('');
    setSubject(null);
    api
      .subject(subjectId)
      .then((result) => {
        if (active) setSubject(result.subject);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof ApiError ? caught.message : 'Could not load this subject.');
      });
    api
      .bookmarks('subject')
      .then((result) => {
        if (active) setBookmarked(result.bookmarks.some((item) => item.itemId === subjectId));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [subjectId]);

  const toggleBookmark = async () => {
    try {
      const result = await api.toggleBookmark('subject', subjectId);
      setBookmarked(result.bookmarked);
      toast(result.bookmarked ? 'Subject saved to bookmarks.' : 'Bookmark removed.', 'info');
    } catch (caught) {
      toast(caught instanceof ApiError ? caught.message : 'Could not update bookmark.', 'error');
    }
  };

  const complete = async (lessonId: string, isComplete: boolean) => {
    setMarking(lessonId);
    try {
      if (isComplete) {
        await api.uncompleteLesson(lessonId);
        toast('Lesson marked as not complete.', 'info');
      } else {
        const result = await api.completeLesson(lessonId);
        toast(result.message);
      }
      const refreshed = await api.subject(subjectId);
      setSubject(refreshed.subject);
    } catch (caught) {
      toast(caught instanceof ApiError ? caught.message : 'Could not update the lesson.', 'error');
    } finally {
      setMarking(null);
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Alert tone="danger" title="Subject unavailable">{error}</Alert>
        <LinkButton to="/learn" variant="secondary" size="sm" icon={ArrowLeft}>Back to Learn</LinkButton>
      </div>
    );
  }
  if (!subject) return <LoadingBlock label="Loading lessons…" />;

  const percent = subject.lessonCount
    ? Math.round((subject.completedCount / subject.lessonCount) * 100)
    : 0;
  const accent = accentFor(subject.accent);
  const nextLesson = subject.lessons.find((lesson) => !lesson.completed) ?? subject.lessons[0];

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted">
        <Link to="/learn" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft className="h-3 w-3" aria-hidden="true" /> Learn
        </Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <span className="text-ink">{subject.name}</span>
      </nav>

      <Card className="overflow-hidden">
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cx('rounded-full border px-2.5 py-1 text-[10px] font-semibold', accent.chip)}>
                  {subject.syllabusSection}
                </span>
                <Badge tone="neutral">{pluralize(subject.lessonCount, 'lesson')}</Badge>
              </div>
              <h1 className="mt-3 font-display text-[30px] leading-tight text-brand-900">{subject.name}</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">{subject.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={toggleBookmark}
                icon={bookmarked ? BookmarkCheck : Bookmark}
                aria-pressed={bookmarked}
              >
                {bookmarked ? 'Saved' : 'Save'}
              </Button>
              <LinkButton
                to={`/practice?subject=${subject.id}`}
                size="sm"
                variant="subtle"
                icon={ListChecks}
              >
                Practise
              </LinkButton>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <ProgressBar value={subject.completedCount} max={subject.lessonCount} label="Subject progress" />
            <p className="text-xs text-muted">
              {subject.completedCount} of {subject.lessonCount} complete · {percent}%
            </p>
          </div>
        </div>
        {nextLesson ? (
          <div className="flex flex-col gap-3 border-t border-line bg-brand-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-700">
                {nextLesson.completed ? 'Revisit' : 'Up next'}
              </p>
              <p className="truncate text-sm font-medium text-ink">{nextLesson.title}</p>
            </div>
            <LinkButton to={`/lessons/${nextLesson.id}`} size="sm" icon={ArrowRight}>
              Open lesson
            </LinkButton>
          </div>
        ) : null}
      </Card>

      <section aria-labelledby="lesson-list">
        <div className="mb-3 flex items-end justify-between">
          <h2 id="lesson-list" className="text-lg text-ink">Lessons</h2>
          <p className="text-xs text-muted">Read · mark complete · quick check</p>
        </div>
        <ol className="space-y-2.5">
          {subject.lessons.map((lesson, index) => (
            <li key={lesson.id}>
              <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card sm:flex-row sm:items-center">
                <span
                  className={cx(
                    'hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:flex',
                    lesson.completed ? 'bg-brand-600 text-white' : 'bg-paper text-muted',
                  )}
                  aria-hidden="true"
                >
                  {lesson.completed ? <CheckCircle2 className="h-4 w-4" /> : String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <Link to={`/lessons/${lesson.id}`} className="text-[14px] font-medium text-ink hover:underline">
                    {lesson.title}
                  </Link>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted">{lesson.summary}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3 w-3" aria-hidden="true" /> {formatMinutes(lesson.estimatedMinutes)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Circle className="h-2 w-2" aria-hidden="true" /> {pluralize(lesson.objectives, 'objective')}
                    </span>
                    {lesson.completed ? (
                      <span className="inline-flex items-center gap-1 font-medium text-success-600">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Completed
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={lesson.completed ? 'ghost' : 'secondary'}
                    size="sm"
                    onClick={() => void complete(lesson.id, lesson.completed)}
                    loading={marking === lesson.id}
                  >
                    {lesson.completed ? 'Mark pending' : 'Mark complete'}
                  </Button>
                  <LinkButton to={`/lessons/${lesson.id}`} size="sm" variant="subtle">
                    {lesson.completed ? 'Review' : 'Start'}
                  </LinkButton>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Finished the lessons? Test recall with a short practice set on this subject.
        </p>
        <LinkButton to={`/practice?subject=${subject.id}`} size="sm" icon={ListChecks}>
          Practise {subject.name.split(' ')[0]}
        </LinkButton>
      </Card>
    </div>
  );
}
