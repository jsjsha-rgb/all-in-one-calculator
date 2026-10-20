import type {
  ButtonHTMLAttributes,
  ComponentPropsWithRef,
  ReactNode,
} from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Info,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { cx } from '../lib/format';

// ---------------------------------------------------------------- Button
type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 shadow-sm',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-brand-50 hover:border-brand-200',
  ghost: 'text-ink hover:bg-brand-50',
  accent: 'bg-accent-500 text-white hover:bg-accent-600 shadow-sm',
  danger: 'bg-danger-600 text-white hover:bg-danger-700 shadow-sm',
  subtle: 'bg-brand-50 text-brand-800 hover:bg-brand-100',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-[13px] rounded-lg',
  md: 'h-11 px-4 text-sm rounded-xl',
  lg: 'h-12 px-5 text-[15px] rounded-xl',
  icon: 'h-10 w-10 rounded-xl',
};

export function buttonStyles(variant: Variant = 'primary', size: Size = 'md', className = ''): string {
  return cx(
    'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: LucideIcon;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={buttonStyles(variant, size, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="h-4 w-4" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}

interface LinkButtonProps {
  to: string;
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  icon?: LucideIcon;
  state?: unknown;
}

export function LinkButton({
  to,
  children,
  variant = 'primary',
  size = 'md',
  className,
  icon: Icon,
  state,
}: LinkButtonProps) {
  return (
    <Link to={to} state={state} className={buttonStyles(variant, size, className)}>
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------- Surfaces
export function Card({
  children,
  className,
  as: As = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
}) {
  return (
    <As className={cx('rounded-2xl border border-line bg-surface shadow-card', className)}>
      {children}
    </As>
  );
}

export function SectionHeading({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('mb-4 flex flex-wrap items-end justify-between gap-3', className)}>
      <div>
        <h2 className="text-lg text-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[26px] leading-tight text-ink sm:text-[32px]">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

// ---------------------------------------------------------------- Badge
type Tone = 'neutral' | 'brand' | 'accent' | 'success' | 'danger' | 'outline';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-paper text-muted border-line',
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  accent: 'bg-accent-50 text-accent-700 border-accent-100',
  success: 'bg-success-50 text-success-600 border-success-100',
  danger: 'bg-danger-50 text-danger-600 border-danger-100',
  outline: 'bg-transparent text-muted border-line-strong',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
  icon: Icon,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  icon?: LucideIcon;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide',
        toneClasses[tone],
        className,
      )}
    >
      {Icon ? <Icon className="h-3 w-3" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

// ---------------------------------------------------------------- Progress
export function ProgressBar({
  value,
  max = 100,
  label,
  tone = 'brand',
  size = 'md',
}: {
  value: number;
  max?: number;
  label?: string;
  tone?: 'brand' | 'accent' | 'success' | 'danger';
  size?: 'sm' | 'md';
}) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, Math.round((value / max) * 100))) : 0;
  const toneClass = {
    brand: 'bg-brand-500',
    accent: 'bg-accent-500',
    success: 'bg-success-600',
    danger: 'bg-danger-600',
  }[tone];
  return (
    <div>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
          <span>{label}</span>
          <span className="font-medium text-ink">{percentage}%</span>
        </div>
      ) : null}
      <div
        className={cx('w-full overflow-hidden rounded-full bg-paper', size === 'sm' ? 'h-1.5' : 'h-2')}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        <div
          className={cx('h-full rounded-full transition-all duration-500', toneClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Form fields
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  optional,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink">
          {label}
          {optional ? <span className="ml-1 font-normal text-muted">(optional)</span> : null}
        </label>
        {hint ? <span className="text-[11px] text-muted">{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 flex items-center gap-1 text-xs text-danger-600">
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

const inputBase =
  'w-full rounded-xl border border-line-strong bg-surface px-3.5 text-sm text-ink placeholder:text-muted/70 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-paper';

export function TextInput({ className, ...props }: ComponentPropsWithRef<'input'>) {
  return <input className={cx(inputBase, 'h-11', className)} {...props} />;
}

export function TextArea({ className, ...props }: ComponentPropsWithRef<'textarea'>) {
  return <textarea className={cx(inputBase, 'min-h-[120px] py-3 leading-relaxed', className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: ComponentPropsWithRef<'select'>) {
  return (
    <select className={cx(inputBase, 'h-11 pr-8', className)} {...props}>
      {children}
    </select>
  );
}

// ---------------------------------------------------------------- Feedback states
export function Spinner({ className }: { className?: string }) {
  return (
    <span role="status" aria-label="Loading">
      <Loader2 className={cx('h-5 w-5 animate-spin text-brand-600', className)} aria-hidden="true" />
    </span>
  );
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line-strong bg-surface/60 p-8 text-sm text-muted">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Alert({
  tone = 'info',
  title,
  children,
  onRetry,
  retryLabel = 'Retry',
}: {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  const styles = {
    info: 'border-brand-100 bg-brand-50 text-brand-900',
    success: 'border-success-100 bg-success-50 text-success-600',
    warning: 'border-accent-100 bg-accent-50 text-accent-700',
    danger: 'border-danger-100 bg-danger-50 text-danger-700',
  }[tone];
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'danger' ? AlertCircle : Info;
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cx('rounded-xl border px-4 py-3 text-sm', styles)}>
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <div className="flex-1 leading-relaxed">
          {title ? <p className="font-semibold">{title}</p> : null}
          <div className={title ? 'mt-0.5' : ''}>{children}</div>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 hover:opacity-80"
            >
              {retryLabel}
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Tabs
export function TabNav({
  items,
  current,
  onChange,
  className,
}: {
  items: Array<{ id: string; label: string; count?: number }>;
  current: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Sections"
      className={cx('inline-flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1', className)}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={current === item.id}
          onClick={() => onChange(item.id)}
          className={cx(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            current === item.id ? 'bg-brand-700 text-white' : 'text-muted hover:bg-brand-50 hover:text-ink',
          )}
        >
          {item.label}
          {typeof item.count === 'number' ? (
            <span
              className={cx(
                'rounded-full px-1.5 text-[10px] font-semibold',
                current === item.id ? 'bg-white/20 text-white' : 'bg-paper text-muted',
              )}
            >
              {item.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Stat
export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'brand',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: 'brand' | 'accent';
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        {Icon ? (
          <span
            className={cx(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              tone === 'brand' ? 'bg-brand-50 text-brand-700' : 'bg-accent-50 text-accent-700',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </Card>
  );
}

// ---------------------------------------------------------------- Brand
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className="h-9 w-9 shrink-0" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="#0d5147" />
        <path d="M18 20h13c5 0 9 3 9 8v18c-2-3-5-4-9-4H18V20Z" fill="#f6f5ef" />
        <path d="M46 20H33c-5 0-9 3-9 8v18c2-3 5-4 9-4h13V20Z" fill="#b2d9cc" opacity=".92" />
        <circle cx="45" cy="17" r="6" fill="#e0a552" />
      </svg>
      {compact ? null : (
        <span className="leading-tight">
          <span className="block font-display text-[17px] font-semibold text-brand-900">
            StudyMentor<span className="text-accent-600"> AI</span>
          </span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
            UPSC preparation
          </span>
        </span>
      )}
    </span>
  );
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const dimensions = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' }[size];
  const parts = name.split(/\s+/).filter(Boolean);
  const label = parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800',
        dimensions,
      )}
    >
      {label || 'S'}
    </span>
  );
}
