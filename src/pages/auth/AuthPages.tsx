import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../lib/api';
import { Badge, BrandMark, Button, Field, TextInput } from '../../components/ui';

function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-paper">
      <div className="mx-auto grid min-h-dvh max-w-[1200px] lg:grid-cols-[1.05fr_1fr]">
        <aside className="relative hidden overflow-hidden bg-brand-800 p-10 text-brand-50 lg:flex lg:flex-col lg:justify-between">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-brand-600/60"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full border border-brand-600/50"
          />
          <Link to="/welcome" className="relative inline-flex items-center gap-2 text-brand-100">
            <BrandMark />
          </Link>
          <div className="relative max-w-md">
            <p className="mb-4 font-display text-[30px] leading-snug text-white">
              “A clear plan, honest feedback, and a mentor who never runs out of patience.”
            </p>
            <p className="text-sm leading-relaxed text-brand-200">
              StudyMentor brings your syllabus, practice, answer writing and current affairs into
              one calm workspace — so you can spend your energy on learning, not on searching for
              the next resource.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-brand-100">
              {[
                'Structured GS lessons with objectives',
                'Filterable MCQ and PYQ-style practice',
                'Structured Mains feedback in minutes',
                'AI doubt solving grounded in your content',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-300" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative text-xs text-brand-300">
            An independent study tool. Not affiliated with the UPSC.
          </p>
        </aside>

        <div className="flex flex-col">
          <header className="flex items-center justify-between px-5 py-5 lg:px-10">
            <Link to="/welcome" className="lg:hidden">
              <BrandMark />
            </Link>
            <Link
              to="/welcome"
              className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to welcome
            </Link>
          </header>
          <main className="flex flex-1 items-start justify-center px-5 pb-12 pt-2 sm:px-8 lg:items-center lg:px-12">
            <div className="w-full max-w-[420px]">
              <h1 className="text-[28px] leading-tight text-ink">{title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
              <div className="mt-7">{children}</div>
              {footer ? <div className="mt-6 text-sm text-muted">{footer}</div> : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function useFieldErrors() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const apply = (error: unknown): string => {
    if (error instanceof ApiError) {
      if (error.errors.length) {
        setFieldErrors(Object.fromEntries(error.errors.map((item) => [item.field, item.message])));
      }
      return error.message;
    }
    return 'Something went wrong. Please try again.';
  };
  return { fieldErrors, setFieldErrors, apply };
}

function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  invalid,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <TextInput
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="pr-11"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-paper hover:text-ink"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ------------------------------------------------------------------ Login
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { fieldErrors, setFieldErrors, apply } = useFieldErrors();
  const notice = (location.state as { message?: string } | null)?.message;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.onboardingComplete ? '/dashboard' : '/onboarding', { replace: true });
    } catch (caught) {
      setError(apply(caught));
    } finally {
      setLoading(false);
    }
  };

  const useDemo = async () => {
    setEmail('demo@studaymentor.app');
    setPassword('Demo@1234');
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      const user = await login('demo@studaymentor.app', 'Demo@1234');
      navigate(user.onboardingComplete ? '/dashboard' : '/onboarding', { replace: true });
    } catch (caught) {
      setError(apply(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Pick up where you left off. Your plan, progress and saved explanations are waiting."
      footer={
        <p>
          New to StudyMentor?{' '}
          <Link to="/signup" className="font-semibold text-brand-700 underline underline-offset-2">
            Create an account
          </Link>
        </p>
      }
    >
      {notice ? (
        <div className="mb-5 rounded-xl border border-success-100 bg-success-50 px-4 py-3 text-sm text-success-600">
          {notice}
        </div>
      ) : null}
      <form onSubmit={submit} noValidate className="space-y-4">
        {error ? (
          <div role="alert" className="rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
            {error}
          </div>
        ) : null}
        <Field label="Email address" htmlFor="login-email" error={fieldErrors.email}>
          <TextInput
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
          />
        </Field>
        <Field label="Password" htmlFor="login-password" error={fieldErrors.password}>
          <PasswordInput
            id="login-password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            invalid={Boolean(fieldErrors.password)}
          />
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs font-medium text-brand-700 underline underline-offset-2">
            Forgot your password?
          </Link>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Log in
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-muted">
        <span className="h-px flex-1 bg-line" />
        or explore first
        <span className="h-px flex-1 bg-line" />
      </div>
      <Button variant="secondary" size="lg" className="w-full" onClick={useDemo} disabled={loading} icon={Sparkles}>
        Try the demo account
      </Button>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">
        Demo: demo@studaymentor.app · Demo@1234. Sample progress is preloaded.
      </p>
    </AuthLayout>
  );
}

// ------------------------------------------------------------------ Signup
export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { fieldErrors, apply } = useFieldErrors();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate('/onboarding', { replace: true });
    } catch (caught) {
      setError(apply(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your study workspace"
      subtitle="Two minutes to set up. No card, no clutter, and you can change everything later."
      footer={
        <p>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 underline underline-offset-2">
            Log in
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {error ? (
          <div role="alert" className="rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
            {error}
          </div>
        ) : null}
        <Field label="Your name" htmlFor="signup-name" error={fieldErrors.name}>
          <TextInput
            id="signup-name"
            autoComplete="name"
            placeholder="Ananya Rao"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
          />
        </Field>
        <Field label="Email address" htmlFor="signup-email" error={fieldErrors.email}>
          <TextInput
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
          />
        </Field>
        <Field
          label="Password"
          htmlFor="signup-password"
          hint="8+ characters, 1 number"
          error={fieldErrors.password}
        >
          <PasswordInput
            id="signup-password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            invalid={Boolean(fieldErrors.password)}
          />
        </Field>
        <p className="text-[11px] leading-relaxed text-muted">
          StudyMentor stores only what it needs to personalise your plan: your name, email and study
          preferences. You can review this in your profile.
        </p>
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Create account
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>
    </AuthLayout>
  );
}

// ------------------------------------------------------------------ Forgot password
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [devToken, setDevToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setDevToken('');
    try {
      const result = await api.auth.forgotPassword(email);
      setMessage(result.message);
      if (result.devResetToken) setDevToken(result.devResetToken);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not create a reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email you signed up with and we will create a secure reset link."
      footer={
        <p>
          Remembered it?{' '}
          <Link to="/login" className="font-semibold text-brand-700 underline underline-offset-2">
            Back to login
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {error ? (
          <div role="alert" className="rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div role="status" className="rounded-xl border border-success-100 bg-success-50 px-4 py-3 text-sm leading-relaxed text-success-600">
            {message}
          </div>
        ) : null}
        {devToken ? (
          <div className="rounded-xl border border-accent-100 bg-accent-50 px-4 py-3 text-sm text-accent-700">
            <p className="font-semibold">Development mode</p>
            <p className="mt-1 text-xs leading-relaxed">
              Email delivery is not configured, so the reset link is shown here instead. This never
              happens in production.
            </p>
            <Link
              to={`/reset-password?token=${encodeURIComponent(devToken)}`}
              className="mt-2 inline-block text-xs font-semibold underline underline-offset-2"
            >
              Open reset form
            </Link>
          </div>
        ) : null}
        <Field label="Email address" htmlFor="forgot-email">
          <TextInput
            id="forgot-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={loading} icon={KeyRound}>
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  );
}

// ------------------------------------------------------------------ Reset password
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(params.get('token') ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.get('token')) setToken(params.get('token') ?? '');
  }, [params]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const result = await api.auth.resetPassword(token, password);
      setSuccess(result.message);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not reset your password.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Password updated" subtitle="You can now sign in with your new password.">
        <div className="rounded-xl border border-success-100 bg-success-50 p-5 text-sm text-success-600">
          <CheckCircle2 className="mb-2 h-5 w-5" aria-hidden="true" />
          {success}
        </div>
        <Button size="lg" className="mt-5 w-full" onClick={() => navigate('/login')}>
          Go to login
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Use at least 8 characters, including a letter and a number."
      footer={
        <p>
          Need a new link?{' '}
          <Link to="/forgot-password" className="font-semibold text-brand-700 underline underline-offset-2">
            Request another
          </Link>
        </p>
      }
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {error ? (
          <div role="alert" className="rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm text-danger-700">
            {error}
          </div>
        ) : null}
        <Field label="Reset token" htmlFor="reset-token" hint="From your reset link">
          <TextInput
            id="reset-token"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
            autoComplete="off"
          />
        </Field>
        <Field label="New password" htmlFor="reset-password">
          <PasswordInput
            id="reset-password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />
        </Field>
        <Field label="Confirm new password" htmlFor="reset-confirm">
          <PasswordInput
            id="reset-confirm"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
