import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpenCheck, Briefcase, GraduationCap, Rocket, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';
import { Badge, BrandMark, Button, Field, Select } from '../components/ui';
import { cx } from '../lib/format';

const levels = [
  {
    id: 'beginner',
    title: 'Just starting',
    description: 'New to the syllabus, building foundations.',
    icon: GraduationCap,
  },
  {
    id: 'intermediate',
    title: 'Partway through',
    description: 'Covered some GS papers, need structure.',
    icon: BookOpenCheck,
  },
  {
    id: 'advanced',
    title: 'Revision stage',
    description: 'Mostly revising, focusing on gaps and answers.',
    icon: Rocket,
  },
  {
    id: 'working-professional',
    title: 'Working professional',
    description: 'Limited weekday hours, stronger weekends.',
    icon: Briefcase,
  },
];

const timeOptions = [
  { value: 60, label: '1 hour', note: 'A focused daily habit' },
  { value: 120, label: '2 hours', note: 'Steady preparation' },
  { value: 180, label: '3 hours', note: 'Serious daily effort' },
  { value: 240, label: '4+ hours', note: 'Full-time preparation' },
];

export function OnboardingPage() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [examYear, setExamYear] = useState(String(user?.examYear ?? currentYear + 1));
  const [level, setLevel] = useState(user?.preparationLevel ?? 'beginner');
  const [minutes, setMinutes] = useState(user?.dailyGoalMinutes ?? 120);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.auth.onboarding({
        examYear: Number(examYear),
        preparationLevel: level,
        dailyGoalMinutes: minutes,
      });
      await refresh();
      navigate('/dashboard', { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not save your preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-paper">
      <header className="mx-auto flex h-20 w-full max-w-3xl items-center justify-between px-5">
        <BrandMark />
        <Badge tone="brand">Step 2 of 2</Badge>
      </header>
      <main className="mx-auto w-full max-w-3xl px-5 pb-16">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
            Set your preparation goal
          </p>
          <h1 className="mt-2 font-display text-[32px] leading-tight text-brand-900 sm:text-[38px]">
            Let&apos;s shape a plan around your life
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            These choices set your exam goal, the shape of your daily plan and the pace of your
            dashboard. You can change all of them later in your profile.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {error ? (
            <div role="alert" className="rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
              {error}
            </div>
          ) : null}

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700">
                1
              </span>
              <div>
                <h2 className="text-base font-semibold text-ink">Which exam year are you targeting?</h2>
                <p className="mt-0.5 text-xs text-muted">This sets your goal, not a countdown clock.</p>
              </div>
            </div>
            <Field label="Exam year" htmlFor="exam-year">
              <Select
                id="exam-year"
                value={examYear}
                onChange={(event) => setExamYear(event.target.value)}
                className="sm:max-w-xs"
              >
                {Array.from({ length: 8 }, (_, index) => currentYear + index).map((year) => (
                  <option key={year} value={year}>
                    UPSC CSE {year}
                  </option>
                ))}
              </Select>
            </Field>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700">
                2
              </span>
              <div>
                <h2 className="text-base font-semibold text-ink">Where are you in the preparation?</h2>
                <p className="mt-0.5 text-xs text-muted">This helps us pitch lessons and suggestions.</p>
              </div>
            </div>
            <fieldset>
              <legend className="sr-only">Preparation level</legend>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {levels.map((option) => {
                  const selected = level === option.id;
                  return (
                    <label
                      key={option.id}
                      className={cx(
                        'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-brand-300',
                        selected
                          ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-200'
                          : 'border-line hover:border-brand-200 hover:bg-paper',
                      )}
                    >
                      <input
                        type="radio"
                        name="level"
                        value={option.id}
                        checked={selected}
                        onChange={() => setLevel(option.id)}
                        className="sr-only"
                      />
                      <span
                        className={cx(
                          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          selected ? 'bg-brand-700 text-white' : 'bg-paper text-muted',
                        )}
                      >
                        <option.icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-ink">{option.title}</span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                          {option.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-700">
                3
              </span>
              <div>
                <h2 className="text-base font-semibold text-ink">How much time can you give each day?</h2>
                <p className="mt-0.5 text-xs text-muted">
                  We will size your daily plan to fit. A smaller honest goal beats an ambitious one.
                </p>
              </div>
            </div>
            <fieldset>
              <legend className="sr-only">Daily study goal</legend>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {timeOptions.map((option) => {
                  const selected = minutes === option.value;
                  return (
                    <label
                      key={option.value}
                      className={cx(
                        'cursor-pointer rounded-xl border p-3.5 text-center transition-colors focus-within:ring-2 focus-within:ring-brand-300',
                        selected
                          ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-200'
                          : 'border-line hover:border-brand-200 hover:bg-paper',
                      )}
                    >
                      <input
                        type="radio"
                        name="minutes"
                        value={option.value}
                        checked={selected}
                        onChange={() => setMinutes(option.value)}
                        className="sr-only"
                      />
                      <span className="block text-sm font-semibold text-ink">{option.label}</span>
                      <span className="mt-0.5 block text-[11px] text-muted">{option.note}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </section>

          <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-xs text-muted">
              <Sparkles className="h-3.5 w-3.5 text-accent-600" aria-hidden="true" />
              Your first daily plan is created as soon as you continue.
            </p>
            <Button type="submit" size="lg" loading={saving} icon={ArrowRight}>
              Continue to dashboard
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
