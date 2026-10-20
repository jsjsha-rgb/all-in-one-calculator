import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  ListChecks,
  Newspaper,
  PenLine,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';
import { Badge, BrandMark, Button, LinkButton } from '../components/ui';

const features = [
  {
    icon: BookOpen,
    title: 'A syllabus you can actually finish',
    body: 'Fourteen focused lessons across seven GS areas, each with objectives, concise notes and a completion trail.',
    tone: 'bg-brand-50 text-brand-700',
  },
  {
    icon: ListChecks,
    title: 'Practice that explains itself',
    body: 'Filter by subject, topic, difficulty or exam year. Every answer comes with an explanation and source label.',
    tone: 'bg-accent-50 text-accent-700',
  },
  {
    icon: PenLine,
    title: 'Mains feedback, structured',
    body: 'Submit an answer and get an indicative rubric review: introduction, body, examples, conclusion and gaps.',
    tone: 'bg-sky-50 text-sky-700',
  },
  {
    icon: Sparkles,
    title: 'A mentor that shows its working',
    body: 'Ask a doubt and receive a structured explanation tied to your lessons — with demo mode clearly labelled.',
    tone: 'bg-indigo-50 text-indigo-700',
  },
];

export function WelcomePage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');

  const tryDemo = async () => {
    setError('');
    setDemoLoading(true);
    try {
      await login('demo@studaymentor.app', 'Demo@1234');
      navigate('/dashboard');
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'The demo account is not available. Run the seed script and try again.',
      );
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-paper">
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link to="/welcome" aria-label="StudyMentor AI home">
          <BrandMark />
        </Link>
        <nav aria-label="Account" className="flex items-center gap-2">
          {user ? (
            <LinkButton to="/dashboard" size="sm" icon={ArrowRight}>
              Open dashboard
            </LinkButton>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-brand-50 hover:text-ink sm:inline-flex"
              >
                Log in
              </Link>
              <LinkButton to="/signup" size="sm">
                Get started
              </LinkButton>
            </>
          )}
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-14">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge tone="brand" icon={Target}>
                Built for UPSC Civil Services
              </Badge>
              <Badge tone="accent">Demo mode ready</Badge>
            </div>
            <h1 className="max-w-xl font-display text-[40px] leading-[1.08] tracking-[-0.02em] text-brand-900 sm:text-[54px]">
              Study with a plan.
              <span className="block text-accent-600">Improve with feedback.</span>
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted sm:text-base">
              StudyMentor AI brings your GS syllabus, MCQ practice, answer writing and current
              affairs into one calm workspace — with an AI mentor that explains its reasoning and a
              progress trail that tells you what to revise next.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <LinkButton to="/signup" size="lg" icon={ArrowRight}>
                Start free
              </LinkButton>
              <Button variant="secondary" size="lg" onClick={tryDemo} loading={demoLoading}>
                Explore the demo
              </Button>
            </div>
            {error ? (
              <p role="alert" className="mt-3 text-sm text-danger-600">
                {error}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-muted">
              No card required · Seven GS subjects · Your data stays yours
            </p>
            <dl className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6">
              {[
                ['14', 'sample lessons'],
                ['35', 'practice questions'],
                ['7', 'Mains prompts'],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="text-[11px] uppercase tracking-wide text-muted">{label}</dt>
                  <dd className="mt-0.5 font-display text-2xl text-brand-800">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Product illustration */}
          <div className="relative mx-auto w-full max-w-[460px]">
            <div
              aria-hidden="true"
              className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-brand-100 via-paper to-accent-50 opacity-80"
            />
            <div className="relative rounded-3xl border border-line bg-surface p-5 shadow-raised">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    Tuesday · sample plan
                  </p>
                  <p className="mt-1 font-display text-xl text-ink">Your study day</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-50 text-sm font-semibold text-accent-700">
                  18
                </span>
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  ['The Preamble and the basic structure', 'Completed', true],
                  ['Monetary policy and inflation', '25 min lesson', false],
                  ['Practice 10 mixed MCQs', '25 min', false],
                ].map(([title, meta, done]) => (
                  <div
                    key={title as string}
                    className="flex items-start gap-3 rounded-xl border border-line px-3.5 py-3"
                  >
                    <span
                      className={
                        done
                          ? 'mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white'
                          : 'mt-0.5 h-5 w-5 rounded-full border border-line-strong'
                      }
                    >
                      {done ? <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[13px] font-medium ${done ? 'text-muted line-through' : 'text-ink'}`}>
                        {title}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted">{meta}</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl bg-brand-50 p-3.5">
                <div className="flex items-center justify-between text-[11px] text-brand-800">
                  <span className="font-semibold">Daily goal</span>
                  <span>70 of 150 min</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-100">
                  <div className="h-full w-[46%] rounded-full bg-brand-600" />
                </div>
              </div>
            </div>

            <div className="absolute -bottom-7 -left-3 w-[250px] rounded-2xl border border-line bg-surface p-4 shadow-raised sm:-left-8">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <p className="text-xs font-semibold text-ink">AI doubt mentor</p>
                <Badge tone="accent" className="ml-auto text-[9px]">
                  DEMO
                </Badge>
              </div>
              <p className="mt-2.5 text-[11px] leading-relaxed text-muted">
                “Why is the basic structure doctrine not in the Constitution?” — explained with a
                lesson reference and revision checkpoints.
              </p>
            </div>
            <div className="absolute -right-2 -top-5 rounded-2xl border border-line bg-surface px-4 py-3 shadow-raised sm:-right-5">
              <p className="text-[10px] uppercase tracking-wide text-muted">Study streak</p>
              <p className="font-display text-xl text-ink">6 days</p>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section id="features" className="border-y border-line bg-surface py-16">
          <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                One workspace
              </p>
              <h2 className="mt-2 text-3xl leading-tight text-brand-900">
                Everything you need between one revision and the next
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Built around the ordinary study day: a lesson, some practice, a doubt, an answer.
                Each piece feeds your progress view.
              </p>
            </div>
            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-line bg-paper/60 p-5 transition-shadow hover:shadow-card"
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${feature.tone}`}>
                    <feature.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold text-ink">{feature.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Journey */}
        <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                The daily loop
              </p>
              <h2 className="mt-2 text-3xl leading-tight text-brand-900">
                Four steps, repeated until it feels natural
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                No streak guilt, no twenty-tab research spirals. Open the app, finish the plan,
                review one weak area, and close it.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['Indian Polity', 'History', 'Geography', 'Economy', 'Environment', 'Science & Tech', 'Ethics'].map(
                  (subject) => (
                    <span
                      key={subject}
                      className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted"
                    >
                      {subject}
                    </span>
                  ),
                )}
              </div>
            </div>
            <ol className="space-y-3">
              {[
                ['Learn a focused topic', 'Read concise notes with clear objectives, then mark the lesson complete.', BookOpen],
                ['Practise with explanations', 'Attempt MCQs by topic and difficulty. Review every mistake while it is fresh.', ListChecks],
                ['Ask when you are stuck', 'Use the AI mentor for a structured explanation linked to your syllabus.', Sparkles],
                ['Write and review', 'Submit a Mains answer, read the rubric feedback, and save one improvement for next time.', PenLine],
              ].map(([title, body, Icon], index) => {
                const StepIcon = Icon as typeof BookOpen;
                return (
                  <li key={title as string} className="flex gap-4 rounded-2xl border border-line bg-surface p-5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-800 font-display text-sm text-white">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                        <StepIcon className="h-4 w-4 text-brand-600" aria-hidden="true" />
                        {title as string}
                      </h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted">{body as string}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Demo panel */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8 lg:pb-24">
          <div className="overflow-hidden rounded-3xl bg-brand-900 px-6 py-9 text-brand-50 sm:px-10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-brand-700 bg-brand-800 text-brand-100">Try before you sign up</Badge>
                  <Badge className="border-brand-700 bg-brand-800 text-brand-100" icon={ShieldCheck}>
                    Original sample content
                  </Badge>
                </div>
                <h2 className="mt-4 max-w-xl font-display text-3xl leading-tight text-white">
                  The demo account is a real, working workspace
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-brand-200">
                  Preloaded with a week of sample progress, saved bookmarks and one Mains evaluation.
                  AI features run in a clearly labelled demo mode unless a provider key is configured
                  on the server.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    size="lg"
                    className="bg-white text-brand-900 hover:bg-brand-50"
                    onClick={tryDemo}
                    loading={demoLoading}
                    icon={ArrowRight}
                  >
                    Enter demo workspace
                  </Button>
                  <Link
                    to="/signup"
                    className="text-center text-sm font-medium text-brand-100 underline underline-offset-4 hover:text-white"
                  >
                    Or create your own account
                  </Link>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Demo email', 'demo@studaymentor.app'],
                  ['Password', 'Demo@1234'],
                  ['AI mode', 'Demo / mock'],
                  ['Data', 'Local SQLite'],
                ].map(([term, value]) => (
                  <div key={term} className="rounded-xl border border-brand-700 bg-brand-800/70 p-3.5">
                    <dt className="text-[10px] uppercase tracking-wide text-brand-300">{term}</dt>
                    <dd className="mt-1 break-words text-[12px] font-medium text-brand-50">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-3">
            <BrandMark compact />
            <span>© {new Date().getFullYear()} StudyMentor AI · An independent study tool, not affiliated with UPSC.</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> Built for focused study
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Newspaper className="h-3.5 w-3.5" aria-hidden="true" /> Sample current affairs
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
