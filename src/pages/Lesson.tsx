import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ListChecks,
  Sparkles,
  Target,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { LessonDetail, PublicQuestion } from '../lib/types';
import { formatMinutes, pluralize } from '../lib/format';
import { useToast } from '../context/ToastContext';
import {
  Alert,
  Badge,
  Button,
  Card,
  LinkButton,
  LoadingBlock,
} from '../components/ui';
import { Markdown } from '../components/Markdown';
import { QuizRunner } from '../components/QuizRunner';

export function LessonPage() {
  const { lessonId = '' } = useParams();
  const { toast } = useToast();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(0);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState<PublicQuestion[] | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState('');

  const load = () => {
    setError('');
    setLesson(null);
    api
      .lesson(lessonId)
      .then((result) => setLesson(result.lesson))
      .catch((caught) => {
        if (caught instanceof ApiError) setStatus(caught.status);
        setError(caught instanceof ApiError ? caught.message : 'Could not open this lesson.');
      });
  };

  useEffect(() => {
    load();
    // Reset optional quiz state when navigating between lessons.
    setQuiz(null);
    setQuizError('');
  }, [lessonId]);

  const toggleComplete = async () => {
    if (!lesson) return;
    setSaving(true);
    try {
      if (lesson.completed) {
        await api.uncompleteLesson(lesson.id);
        setLesson({ ...lesson, completed: false });
        toast('Lesson marked as not complete.', 'info');
      } else {
        const result = await api.completeLesson(lesson.id);
        setLesson({ ...lesson, completed: true });
        toast(result.message);
      }
    } catch (caught) {
      toast(caught instanceof ApiError ? caught.message : 'Could not update progress.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleBookmark = async () => {
    if (!lesson) return;
    try {
      const result = await api.toggleBookmark('lesson', lesson.id);
      setLesson({ ...lesson, bookmarked: result.bookmarked });
      toast(result.bookmarked ? 'Lesson saved for revision.' : 'Bookmark removed.', 'info');
    } catch (caught) {
      toast(caught instanceof ApiError ? caught.message : 'Could not update bookmark.', 'error');
    }
  };

  const startQuickCheck = async () => {
    if (!lesson) return;
    setQuizLoading(true);
    setQuizError('');
    try {
      const result = await api.questions({ subject: lesson.subjectId, limit: 3 });
      if (!result.questions.length) {
        setQuizError('No practice questions are available for this subject yet.');
        return;
      }
      setQuiz(result.questions);
    } catch (caught) {
      setQuizError(caught instanceof ApiError ? caught.message : 'Could not load the quick check.');
    } finally {
      setQuizLoading(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Alert tone="danger" title={status === 404 ? 'Lesson not found' : 'Lesson unavailable'}>
          {error}
        </Alert>
        <LinkButton to="/learn" variant="secondary" size="sm" icon={ArrowLeft}>
          Back to Learn
        </LinkButton>
      </div>
    );
  }

  if (!lesson) return <LoadingBlock label="Opening lesson…" />;

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <Link to="/learn" className="inline-flex items-center gap-1 hover:text-ink">
          <ArrowLeft className="h-3 w-3" aria-hidden="true" /> Learn
        </Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <Link to={`/learn/${lesson.subjectId}`} className="hover:text-ink">
          {lesson.subjectName}
        </Link>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
        <span className="truncate text-ink">{lesson.title}</span>
      </nav>

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{lesson.syllabusSection}</Badge>
          <Badge tone="neutral" icon={Clock3}>
            {formatMinutes(lesson.estimatedMinutes)}
          </Badge>
          {lesson.completed ? (
            <Badge tone="success" icon={CheckCircle2}>
              Completed
            </Badge>
          ) : (
            <Badge tone="outline">Not yet complete</Badge>
          )}
        </div>
        <h1 className="mt-3 font-display text-[30px] leading-tight text-brand-900 sm:text-[36px]">
          {lesson.title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{lesson.summary}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            onClick={toggleComplete}
            loading={saving}
            icon={CheckCircle2}
            variant={lesson.completed ? 'secondary' : 'primary'}
            size="sm"
          >
            {lesson.completed ? 'Completed — reopen' : 'Mark as complete'}
          </Button>
          <Button
            onClick={toggleBookmark}
            variant="secondary"
            size="sm"
            icon={lesson.bookmarked ? BookmarkCheck : Bookmark}
            aria-pressed={lesson.bookmarked}
          >
            {lesson.bookmarked ? 'Saved' : 'Bookmark'}
          </Button>
          <LinkButton
            to={`/mentor?prompt=${encodeURIComponent(`Explain the key ideas in "${lesson.title}" for UPSC.`)}`}
            variant="ghost"
            size="sm"
            icon={Sparkles}
          >
            Ask the mentor
          </LinkButton>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <Card className="border-brand-100 bg-brand-50/50 p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-brand-700" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-brand-900">Learning objectives</h2>
            </div>
            <p className="mt-1 text-xs text-brand-800">
              By the end of this lesson you should be able to:
            </p>
            <ul className="mt-3 space-y-2">
              {lesson.objectives.map((objective) => (
                <li key={objective} className="flex items-start gap-2 text-[13px] leading-relaxed text-ink">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" aria-hidden="true" />
                  {objective}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5 sm:p-8">
            <Markdown content={lesson.content} />
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-brand-700" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-ink">Quick check</h2>
                  <Badge tone="neutral">3 questions</Badge>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Test recall immediately after reading. Attempts are saved to your practice history.
                </p>
              </div>
              {!quiz ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void startQuickCheck()}
                  loading={quizLoading}
                >
                  Start quick check
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setQuiz(null)}>
                  Close
                </Button>
              )}
            </div>
            {quizError ? (
              <div className="mt-3">
                <Alert tone="warning">{quizError}</Alert>
              </div>
            ) : null}
            {quiz ? (
              <div className="mt-4">
                <QuizRunner questions={quiz} compact onExit={() => setQuiz(null)} />
              </div>
            ) : null}
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {lesson.previousLesson ? (
              <Link
                to={`/lessons/${lesson.previousLesson.id}`}
                className="group flex min-w-0 items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink hover:border-brand-200"
              >
                <ArrowLeft className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-wide text-muted">Previous</span>
                  <span className="block truncate text-[13px] font-medium">{lesson.previousLesson.title}</span>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {lesson.nextLesson ? (
              <Link
                to={`/lessons/${lesson.nextLesson.id}`}
                className="group flex min-w-0 items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-right text-sm text-brand-900 hover:bg-brand-100 sm:ml-auto"
              >
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-wide text-brand-600">Next lesson</span>
                  <span className="block truncate text-[13px] font-medium">{lesson.nextLesson.title}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-brand-700 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">Finish this lesson</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Marking complete updates your daily plan, progress and streak. You can always reopen it.
            </p>
            <Button
              onClick={toggleComplete}
              loading={saving}
              icon={CheckCircle2}
              variant={lesson.completed ? 'secondary' : 'primary'}
              className="mt-3 w-full"
              size="sm"
            >
              {lesson.completed ? 'Reopen lesson' : 'Mark as complete'}
            </Button>
            <div className="mt-3 grid gap-2">
              <LinkButton
                to={`/practice?subject=${lesson.subjectId}`}
                variant="secondary"
                size="sm"
                icon={ListChecks}
                className="w-full"
              >
                Practise this subject
              </LinkButton>
              <LinkButton
                to={`/mentor?prompt=${encodeURIComponent(`I just read "${lesson.title}". Give me a short recap and two revision questions.`)}`}
                variant="ghost"
                size="sm"
                icon={Sparkles}
                className="w-full"
              >
                Ask the mentor
              </LinkButton>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-ink">Lesson details</h2>
            <dl className="mt-3 space-y-2.5 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Subject</dt>
                <dd className="text-right font-medium text-ink">{lesson.subjectName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Syllabus</dt>
                <dd className="font-medium text-ink">{lesson.syllabusSection}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Reading time</dt>
                <dd className="font-medium text-ink">{formatMinutes(lesson.estimatedMinutes)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Objectives</dt>
                <dd className="font-medium text-ink">{pluralize(lesson.objectives.length, 'item')}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Related questions</dt>
                <dd className="font-medium text-ink">{lesson.quizCount}</dd>
              </div>
            </dl>
          </Card>

          <p className="px-1 text-[10px] leading-relaxed text-muted">
            Study notes are original sample content written for this prototype. They are concise study
            aids, not a substitute for the official syllabus or standard reference books.
          </p>
        </aside>
      </div>
    </div>
  );
}
