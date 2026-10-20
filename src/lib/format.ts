export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export function formatDate(value: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date);
}

export function formatDayMonth(value: string): string {
  return formatDate(value, { year: undefined });
}

export function formatWeekday(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(date);
}

export function relativeDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const today = new Date();
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(today) - startOf(date)) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(value, { year: undefined });
}

export function todayLabel(): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
}

export function formatMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export const PREPARATION_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  'working-professional': 'Working professional',
};

export const ACCENTS: Record<string, { chip: string; dot: string; bar: string; soft: string }> = {
  teal: {
    chip: 'bg-brand-50 text-brand-700 border-brand-100',
    dot: 'bg-brand-500',
    bar: 'bg-brand-500',
    soft: 'bg-brand-50',
  },
  amber: {
    chip: 'bg-accent-50 text-accent-700 border-accent-100',
    dot: 'bg-accent-500',
    bar: 'bg-accent-500',
    soft: 'bg-accent-50',
  },
  blue: {
    chip: 'bg-sky-50 text-sky-800 border-sky-100',
    dot: 'bg-sky-500',
    bar: 'bg-sky-500',
    soft: 'bg-sky-50',
  },
  green: {
    chip: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
    soft: 'bg-emerald-50',
  },
  olive: {
    chip: 'bg-lime-50 text-lime-900 border-lime-100',
    dot: 'bg-lime-600',
    bar: 'bg-lime-600',
    soft: 'bg-lime-50',
  },
  indigo: {
    chip: 'bg-indigo-50 text-indigo-800 border-indigo-100',
    dot: 'bg-indigo-500',
    bar: 'bg-indigo-500',
    soft: 'bg-indigo-50',
  },
  rose: {
    chip: 'bg-rose-50 text-rose-800 border-rose-100',
    dot: 'bg-rose-500',
    bar: 'bg-rose-500',
    soft: 'bg-rose-50',
  },
};

export function accentFor(key: string) {
  return ACCENTS[key] ?? ACCENTS.teal;
}

export const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'bg-success-50 text-success-600 border-success-100',
  medium: 'bg-accent-50 text-accent-700 border-accent-100',
  hard: 'bg-danger-50 text-danger-600 border-danger-100',
};

export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : plural ?? `${singular}s`}`;
}

export function scoreTone(percentage: number): 'success' | 'warning' | 'danger' {
  if (percentage >= 70) return 'success';
  if (percentage >= 45) return 'warning';
  return 'danger';
}
