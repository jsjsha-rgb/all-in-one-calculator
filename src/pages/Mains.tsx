import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Info,
  Loader2,
  PenLine,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import type { AIStatus, MainsFeedback, MainsQuestion, MainsSubmission, Subject } from '../lib/types';
import { cx, formatDate } from '../lib/format';
import { useToast } from '../context/ToastContext';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  LoadingBlock,
  PageHeader,
  ProgressBar,
  Select,
  TabNav,
  TextArea,
} from '../components/ui';

const MIN_WORDS = 40;
const MAX_WORDS = 800;
const DRAFT_KEY = 'studaymentor.mains.draft.v1';

const sections: Array<{ key: keyof MainsFeedback; label: string }> = [
  { key: 'understanding', label: 'Understanding of the question' },
  { key: 'relevanceAccuracy', label: 'Relevance & factual accuracy' },
  { key: 'introduction', label: 'Introduction' },
  { key: 'body', label: 'Body & argument development' },
  { key: 'examples', label: 'Examples & evidence' },
  { key: 'conclusion', label: 'Conclusion' },
];

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function ScoreRing({ score, max }: { score: number; max: number }) {
  const percent = max ? Math.round((score / max) * 100) : 0;
  return (
    <div
      className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(#0f6a5a ${percent * 3.6}deg, #eef6f3 0deg)`,
      }}
      role="img"
      aria-label={`Indicative score ${score} out of ${max}, ${percent} percent`}
    >
      <div className="flex h-[92px] w-[92px] flex-col items-center justify-center rounded-full bg-surface">
        <span className="font-display text-3xl text-brand-900">{score}</span>
        <span className="text-[10px] uppercase tracking-wide text-muted">out of {max}</span>
      </div>
    </div>
  );
}

export function FeedbackView({ feedback }: { feedback: MainsFeedback }) {
  const percentage = feedback.overall.maxScore
    ? Math.round((feedback.overall.score / feedback.overall.maxScore) * 100)
    : 0;
  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 border-b border-line bg-brand-50/50 p-5 sm:flex-row sm:items-center sm:p-6">
          <ScoreRing score={feedback.overall.score} max={feedback.overall.maxScore} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={feedback.mode === 'live' ? 'success' : 'accent'}>
                {feedback.mode === 'live' ? 'AI evaluation · live provider' : 'Demo evaluation'}
              </Badge>
              <Badge tone="neutral">{feedback.overall.band}</Badge>
              <Badge tone="outline" icon={Clock3}>
                {formatDate(feedback.generatedAt, { hour: 'numeric', minute: '2-digit' })}
              </Badge>
            </div>
            <h2 className="mt-2 text-lg text-ink">Indicative rubric assessment</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{feedback.overall.summary}</p>
            <div className="mt-3 max-w-sm">
              <ProgressBar
                value={feedback.overall.score}
                max={feedback.overall.maxScore}
                tone={percentage >= 65 ? 'success' : percentage >= 45 ? 'accent' : 'danger'}
                size="sm"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          {sections.map(({ key, label }) => {
            const section = feedback[key] as MainsFeedback['understanding'];
            return (
              <div key={key} className="rounded-xl border border-line p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[13px] font-semibold text-ink">{label}</h3>
                  <span className="text-xs font-semibold text-brand-700">
                    {section.score}/{section.maxScore}
                  </span>
                </div>
                <div className="mt-2">
                  <ProgressBar
                    value={section.score}
                    max={section.maxScore}
                    tone={section.score >= 7 ? 'success' : section.score >= 5 ? 'accent' : 'danger'}
                    size="sm"
                  />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted">{section.feedback}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success-600" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-ink">Strengths</h3>
          </div>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted">
            {feedback.strengths.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success-600" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-accent-600" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-ink">What is missing</h3>
          </div>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted">
            {feedback.missingDimensions.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <PenLine className="h-4 w-4 text-danger-600" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-ink">Weaknesses</h3>
          </div>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted">
            {feedback.weaknesses.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger-600" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-brand-700" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-ink">Actionable improvements</h3>
        </div>
        <ol className="mt-3 space-y-2.5">
          {feedback.improvements.map((item, index) => (
            <li key={item} className="flex gap-3 rounded-xl bg-paper px-3.5 py-2.5 text-[13px] leading-relaxed">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-700 text-[10px] font-semibold text-white">
                {index + 1}
              </span>
              <span className="text-ink">{item}</span>
            </li>
          ))}
        </ol>
      </Card>

      {feedback.modelAnswer ? (
        <details className="group rounded-2xl border border-line bg-surface p-5 shadow-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <BookOpenCheck className="h-4 w-4 text-brand-700" aria-hidden="true" />
              Sample model answer
            </span>
            <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="mt-3 whitespace-pre-line text-[13.5px] leading-relaxed text-ink/90">
            {feedback.modelAnswer}
          </p>
          <p className="mt-3 text-[10px] leading-relaxed text-muted">
            Sample answer written for this prototype. It is one possible approach, not an official
            UPSC model answer.
          </p>
        </details>
      ) : null}

      <div className="rounded-xl border border-accent-100 bg-accent-50 px-4 py-3 text-[11px] leading-relaxed text-accent-700">
        <span className="font-semibold">Important: </span>
        {feedback.disclaimer}
      </div>
    </div>
  );
}

export function MainsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'history' ? 'history' : 'evaluate';
  const [tab, setTab] = useState<'evaluate' | 'history'>(initialTab);
  const { toast } = useToast();

  const [questions, setQuestions] = useState<MainsQuestion[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [metaError, setMetaError] = useState('');

  const [selection, setSelection] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [marks, setMarks] = useState(15);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [feedback, setFeedback] = useState<MainsFeedback | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const [submissions, setSubmissions] = useState<MainsSubmission[] | null>(null);
  const [historyError, setHistoryError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [openSubmission, setOpenSubmission] = useState<string | null>(null);
  const [detail, setDetail] = useState<MainsSubmission | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const selectedSample = useMemo(
    () => questions.find((question) => question.id === selection) ?? null,
    [questions, selection],
  );
  const words = countWords(answer);
  const isCustom = selection === 'custom';
  const questionText = isCustom ? customQuestion : selectedSample?.question ?? '';

  useEffect(() => {
    Promise.all([api.mainsQuestions(), api.subjects()])
      .then(([questionData, subjectData]) => {
        setQuestions(questionData.questions);
        setStatus(questionData.status);
        setSubjects(subjectData.subjects);
        if (questionData.questions.length) {
          const first = questionData.questions[0];
          setSelection((current) => current || first.id);
          setSubjectId((current) => current || first.subjectId);
          setMarks((current) => current || first.marks);
        }
      })
      .catch((caught) =>
        setMetaError(caught instanceof ApiError ? caught.message : 'Could not load Mains prompts.'),
      )
      .finally(() => setLoadingMeta(false));

    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft) as {
          answer?: string;
          customQuestion?: string;
          subjectId?: string;
          marks?: number;
          selection?: string;
        };
        if (parsed.answer) setAnswer(parsed.answer);
        if (parsed.customQuestion) setCustomQuestion(parsed.customQuestion);
        if (parsed.subjectId) setSubjectId(parsed.subjectId);
        if (parsed.marks) setMarks(parsed.marks);
        if (parsed.selection) setSelection(parsed.selection);
      }
    } catch {
      /* A corrupted draft should never block the editor. */
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ answer, customQuestion, subjectId, marks, selection }));
      } catch {
        /* Storage may be unavailable in private mode. */
      }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [answer, customQuestion, subjectId, marks, selection]);

  const loadSubmissions = () => {
    setHistoryLoading(true);
    setHistoryError('');
    api
      .mainsSubmissions()
      .then((result) => setSubmissions(result.submissions))
      .catch((caught) =>
        setHistoryError(caught instanceof ApiError ? caught.message : 'Could not load evaluations.'),
      )
      .finally(() => setHistoryLoading(false));
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  useEffect(() => {
    if (tab === 'history') loadSubmissions();
  }, [tab]);

  const switchTab = (next: string) => {
    const value = next === 'history' ? 'history' : 'evaluate';
    setTab(value);
    const params = new URLSearchParams(searchParams);
    if (value === 'history') params.set('tab', 'history');
    else params.delete('tab');
    setSearchParams(params, { replace: true });
  };

  const chooseSample = (id: string) => {
    setSelection(id);
    if (id !== 'custom') {
      const sample = questions.find((question) => question.id === id);
      if (sample) {
        setSubjectId(sample.subjectId);
        setMarks(sample.marks);
      }
    }
  };

  const submit = async () => {
    setSubmitError('');
    if (questionText.trim().length < 10) {
      setSubmitError('Choose a sample question or write your own question first.');
      return;
    }
    if (words < MIN_WORDS) {
      setSubmitError(`Write at least ${MIN_WORDS} words before evaluating (currently ${words}).`);
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await api.evaluateMains({
        questionText: questionText.trim(),
        answerText: answer,
        subjectId: subjectId || subjects[0]?.id || 'polity',
        marks,
      });
      setFeedback(result.submission.feedback);
      setSavedId(result.submission.id);
      toast('Evaluation complete. Read the rubric before starting the next answer.');
      loadSubmissions();
    } catch (caught) {
      setSubmitError(caught instanceof ApiError ? caught.message : 'Evaluation failed. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setFeedback(null);
    setSavedId(null);
    setAnswer('');
    setSubmitError('');
    if (selectedSample) {
      setSelection(selectedSample.id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDetail = async (id: string) => {
    if (openSubmission === id) {
      setOpenSubmission(null);
      setDetail(null);
      return;
    }
    setOpenSubmission(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const result = await api.mainsSubmission(id);
      setDetail(result.submission);
    } catch (caught) {
      toast(caught instanceof ApiError ? caught.message : 'Could not load this evaluation.', 'error');
      setOpenSubmission(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const removeSubmission = async (id: string) => {
    if (!window.confirm('Delete this saved evaluation?')) return;
    try {
      await api.deleteMainsSubmission(id);
      setSubmissions((current) => current?.filter((item) => item.id !== id) ?? null);
      if (openSubmission === id) {
        setOpenSubmission(null);
        setDetail(null);
      }
      toast('Evaluation deleted.', 'info');
    } catch (caught) {
      toast(caught instanceof ApiError ? caught.message : 'Could not delete the evaluation.', 'error');
    }
  };

  const modeNotice = status?.mode === 'demo' ? (
    <Alert tone="warning" title="Demo evaluation mode">
      Feedback is generated by a transparent rule-based rubric in the app, not an external AI model.
      It checks structure, relevance and evidence, and is indicative only. Configure a provider key
      on the server for live AI evaluation.
    </Alert>
  ) : status ? (
    <Alert tone="info" title="AI-generated evaluation">
      Feedback comes from {status.provider} ({status.model}) and is indicative, not official UPSC
      marking. Verify factual claims independently.
    </Alert>
  ) : null;

  if (loadingMeta) return <LoadingBlock label="Preparing the answer workspace…" />;
  if (metaError) {
    return <Alert tone="danger" title="Mains workspace unavailable">{metaError}</Alert>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mains"
        title="Write. Review. Improve."
        description="Practise answer writing against original sample questions. Feedback is structured around the rubric UPSC examiners care about, and clearly labelled as indicative."
        actions={
          <>
            <Badge tone={status?.mode === 'live' ? 'success' : 'accent'}>
              {status?.mode === 'live' ? 'Live evaluation' : 'Demo evaluation'}
            </Badge>
            <Badge tone="neutral" icon={FileText}>
              {submissions?.length ?? 0} saved
            </Badge>
          </>
        }
      />

      <TabNav
        current={tab}
        onChange={switchTab}
        items={[
          { id: 'evaluate', label: 'Evaluate an answer' },
          { id: 'history', label: 'Saved evaluations', count: submissions?.length },
        ]}
      />

      {tab === 'evaluate' ? (
        feedback ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                  Evaluation result
                </p>
                <h2 className="mt-1 text-lg text-ink">Saved to your evaluation history</h2>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" icon={RotateCcw} onClick={reset}>
                  Evaluate another
                </Button>
                <Button variant="ghost" size="sm" onClick={() => switchTab('history')}>
                  View history
                </Button>
              </div>
            </div>
            <Card className="p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Question</p>
              <p className="mt-1 text-sm leading-relaxed text-ink">{questionText}</p>
              <p className="mt-2 text-[11px] text-muted">
                {words} words · {marks} marks · saved reference {savedId?.slice(0, 8)}
              </p>
            </Card>
            <FeedbackView feedback={feedback} />
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
            <Card className="p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <PenLine className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg text-ink">Your answer</h2>
                  <p className="text-xs text-muted">Aim for 150-200 words for a 15-mark question.</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <Field label="Question" htmlFor="mains-question">
                  <Select
                    id="mains-question"
                    value={selection}
                    onChange={(event) => chooseSample(event.target.value)}
                  >
                    {questions.map((question) => (
                      <option key={question.id} value={question.id}>
                        {question.subjectName} · {question.marks} marks — {question.question.slice(0, 90)}
                        {question.question.length > 90 ? '…' : ''}
                      </option>
                    ))}
                    <option value="custom">Write my own question…</option>
                  </Select>
                </Field>

                {isCustom ? (
                  <Field
                    label="Custom question"
                    htmlFor="mains-custom-question"
                    error={
                      isCustom && customQuestion.length > 0 && customQuestion.trim().length < 10
                        ? 'Use at least 10 characters.'
                        : undefined
                    }
                  >
                    <TextArea
                      id="mains-custom-question"
                      value={customQuestion}
                      onChange={(event) => setCustomQuestion(event.target.value)}
                      placeholder="e.g. Critically examine the role of cooperative federalism in India's disaster management framework."
                      className="min-h-[76px]"
                      maxLength={1000}
                    />
                  </Field>
                ) : selectedSample ? (
                  <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-4">
                    <p className="text-sm font-medium leading-relaxed text-brand-900">
                      {selectedSample.question}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-brand-800">
                      <span className="font-semibold">Approach: </span>
                      {selectedSample.guidance}
                    </p>
                    <p className="mt-2 text-[10px] uppercase tracking-wide text-brand-600">
                      Original sample question · not an official UPSC paper
                    </p>
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Subject" htmlFor="mains-subject">
                    <Select
                      id="mains-subject"
                      value={subjectId}
                      onChange={(event) => setSubjectId(event.target.value)}
                    >
                      <option value="">Choose a subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Marks" htmlFor="mains-marks">
                    <Select
                      id="mains-marks"
                      value={marks}
                      onChange={(event) => setMarks(Number(event.target.value))}
                    >
                      {[10, 15, 20].map((value) => (
                        <option key={value} value={value}>
                          {value} marks
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <Field
                  label="Answer"
                  htmlFor="mains-answer"
                  hint={`${words} / ${MAX_WORDS} words`}
                >
                  <TextArea
                    id="mains-answer"
                    value={answer}
                    onChange={(event) => {
                      const next = event.target.value;
                      if (countWords(next) <= MAX_WORDS) setAnswer(next);
                    }}
                    placeholder="Start with a definition or context sentence, develop two or three arguments with examples, and close with a way forward."
                    className="min-h-[300px] text-[14px]"
                    aria-describedby="mains-answer-help"
                  />
                </Field>
                <div id="mains-answer-help" className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
                  <span className={words < MIN_WORDS ? 'text-accent-700' : 'text-success-600'}>
                    {words < MIN_WORDS
                      ? `${MIN_WORDS - words} more words needed for a meaningful evaluation.`
                      : 'Long enough to evaluate.'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAnswer('')}
                    className="inline-flex items-center gap-1 hover:text-ink"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" /> Clear answer
                  </button>
                </div>

                {submitError ? (
                  <Alert tone="danger" onRetry={() => void submit()}>
                    {submitError}
                  </Alert>
                ) : null}

                {submitting ? (
                  <div className="rounded-xl border border-brand-100 bg-brand-50 p-4" role="status">
                    <div className="flex items-center gap-2 text-sm font-medium text-brand-900">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Evaluating your answer…
                    </div>
                    <ul className="mt-2.5 space-y-1.5 text-xs text-brand-800">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Checking relevance and structure
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Scanning for examples and evidence
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Preparing improvement suggestions
                      </li>
                    </ul>
                    <p className="mt-2 text-[10px] text-brand-700">
                      This usually takes a few seconds in demo mode and up to 30 seconds with a live
                      provider.
                    </p>
                  </div>
                ) : (
                  <Button size="lg" onClick={() => void submit()} disabled={words < MIN_WORDS} icon={Sparkles}>
                    Evaluate my answer
                  </Button>
                )}
              </div>
            </Card>

            <div className="space-y-4">
              {modeNotice}
              <Card className="p-5">
                <h2 className="text-sm font-semibold text-ink">How this is assessed</h2>
                <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-muted">
                  {[
                    'Understanding of the question and directive',
                    'Relevance and factual accuracy',
                    'Introduction, body structure and conclusion',
                    'Use of examples, data and judgments',
                    'Missing dimensions and actionable improvements',
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 rounded-xl bg-paper px-3 py-2.5 text-[11px] leading-relaxed text-muted">
                  <Info className="mb-1 h-3.5 w-3.5" aria-hidden="true" />
                  No evaluation is shown unless it has actually run. Failed requests show an error and
                  a retry option.
                </p>
              </Card>
              <Card className="p-5">
                <h2 className="text-sm font-semibold text-ink">Writing checklist</h2>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
                  <li>• Underline the directive: examine, discuss, critically examine.</li>
                  <li>• Two named examples are better than five vague references.</li>
                  <li>• Answer the question in the first and last paragraph.</li>
                  <li>• Reserve two minutes to proofread.</li>
                </ul>
                <Link
                  to="/mentor?prompt=Give%20me%20a%20structure%20for%20a%2015-mark%20Mains%20answer."
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                >
                  Ask for an answer structure <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </Card>
            </div>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {historyLoading ? <LoadingBlock label="Loading saved evaluations…" /> : null}
          {historyError ? <Alert tone="danger" onRetry={loadSubmissions}>{historyError}</Alert> : null}
          {!historyLoading && !historyError ? (
            submissions && submissions.length ? (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <Card key={submission.id} className="overflow-hidden">
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={() => void openDetail(submission.id)}
                        aria-expanded={openSubmission === submission.id}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="brand">{submission.subjectName ?? 'Mains'}</Badge>
                          <Badge tone={submission.mode === 'live' ? 'success' : 'accent'}>
                            {submission.mode === 'live' ? 'AI evaluation' : 'Demo evaluation'}
                          </Badge>
                          <span className="text-[10px] text-muted">{formatDate(submission.createdAt)}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-relaxed text-ink">
                          {submission.questionText}
                        </p>
                        <p className="mt-1 text-[11px] text-muted">
                          {submission.wordCount} words
                          {submission.overall
                            ? ` · ${submission.overall.score}/${submission.overall.maxScore} · ${submission.overall.band}`
                            : ''}
                        </p>
                      </button>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => void openDetail(submission.id)}
                          icon={ChevronDown}
                          className={openSubmission === submission.id ? '[&>svg]:rotate-180' : ''}
                        >
                          {openSubmission === submission.id ? 'Close' : 'View'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void removeSubmission(submission.id)}
                          aria-label="Delete evaluation"
                        >
                          <Trash2 className="h-4 w-4 text-muted" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                    {openSubmission === submission.id ? (
                      <div className="border-t border-line bg-paper/40 p-4">
                        {detailLoading ? (
                          <div className="flex items-center gap-2 text-sm text-muted">
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading evaluation…
                          </div>
                        ) : detail?.feedback ? (
                          <div className="space-y-4">
                            <div className="rounded-xl border border-line bg-surface p-4">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                                Your answer
                              </p>
                              <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-ink/90">
                                {detail.answerText}
                              </p>
                            </div>
                            <FeedbackView feedback={detail.feedback} />
                          </div>
                        ) : (
                          <p className="text-sm text-muted">Evaluation details are unavailable.</p>
                        )}
                      </div>
                    ) : null}
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={PenLine}
                title="No saved evaluations yet"
                description="Write your first Mains answer and the structured feedback will be saved here automatically."
                action={
                  <Button size="sm" onClick={() => switchTab('evaluate')}>
                    Write an answer
                  </Button>
                }
              />
            )
          ) : null}
        </div>
      )}
    </div>
  );
}
