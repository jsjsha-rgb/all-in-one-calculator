import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Bot,
  LayoutDashboard,
  ListChecks,
  Menu,
  Newspaper,
  PenLine,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { cx } from '../lib/format';
import type { AIStatus } from '../lib/types';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge, BrandMark } from './ui';

const primaryNav = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/learn', label: 'Learn', icon: BookOpen },
  { to: '/practice', label: 'Practice', icon: ListChecks },
  { to: '/mentor', label: 'AI Mentor', icon: Sparkles },
];

const secondaryNav = [
  { to: '/mains', label: 'Mains evaluation', icon: PenLine },
  { to: '/affairs', label: 'Current affairs', icon: Newspaper },
  { to: '/profile', label: 'Profile & progress', icon: UserRound },
];

const mobileNav = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/learn', label: 'Learn', icon: BookOpen },
  { to: '/practice', label: 'Practice', icon: ListChecks },
  { to: '/mentor', label: 'AI', icon: Bot },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

function NavItem({
  to,
  label,
  icon: Icon,
  onNavigate,
}: {
  to: string;
  label: string;
  icon: typeof BookOpen;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cx(
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-brand-50 text-brand-800'
            : 'text-muted hover:bg-paper hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cx(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
              isActive ? 'bg-brand-700 text-white' : 'bg-paper text-muted group-hover:text-ink',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}

export function AppShell() {
  const { user } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    api.aiStatus().then(setAiStatus).catch(() => setAiStatus(null));
  }, []);

  return (
    <div className="min-h-dvh bg-paper">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[268px] flex-col border-r border-line bg-surface lg:flex">
        <div className="px-5 pb-4 pt-6">
          <Link to="/dashboard" aria-label="StudyMentor AI home">
            <BrandMark />
          </Link>
        </div>
        <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-2">
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Study
          </p>
          <div className="space-y-0.5">
            {primaryNav.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </div>
          <p className="mb-1.5 mt-5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Improve
          </p>
          <div className="space-y-0.5">
            {secondaryNav.map((item) => (
              <NavItem key={item.to} {...item} />
            ))}
          </div>
        </nav>
        <div className="border-t border-line p-3">
          <Link
            to="/profile"
            className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-paper"
          >
            <Avatar name={user?.name ?? 'Learner'} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">{user?.name}</span>
              <span className="block truncate text-xs text-muted">
                {user?.examYear ? `UPSC ${user.examYear}` : 'UPSC aspirant'}
              </span>
            </span>
          </Link>
          {aiStatus?.mode === 'demo' ? (
            <div className="mt-2 rounded-xl bg-accent-50 px-3 py-2.5 text-[11px] leading-relaxed text-accent-700">
              <span className="font-semibold">Demo AI mode.</span> Answers come from the built-in
              study library. Connect a provider key to go live.
            </div>
          ) : null}
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur lg:hidden">
        <Link to="/dashboard" aria-label="StudyMentor AI home">
          <BrandMark />
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-paper hover:text-ink"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link
            to="/profile"
            aria-label="Open profile"
            className="rounded-full focus-visible:outline-2"
          >
            <Avatar name={user?.name ?? 'Learner'} size="sm" />
          </Link>
        </div>
      </header>

      {menuOpen ? (
        <div
          id="mobile-menu"
          className="animate-rise fixed inset-x-0 top-16 z-30 border-b border-line bg-surface px-4 py-4 shadow-raised lg:hidden"
        >
          <div className="grid grid-cols-2 gap-2">
            {[...primaryNav, ...secondaryNav].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cx(
                    'flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium',
                    isActive
                      ? 'border-brand-200 bg-brand-50 text-brand-800'
                      : 'border-line text-ink hover:bg-paper',
                  )
                }
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
          </div>
          {aiStatus ? (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-paper px-3 py-2 text-xs text-muted">
              <span>AI status</span>
              <Badge tone={aiStatus.mode === 'live' ? 'success' : 'accent'}>
                {aiStatus.mode === 'live' ? `Live · ${aiStatus.provider}` : 'Demo mode'}
              </Badge>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="lg:pl-[268px]">
        <main id="main-content" className="mx-auto w-full max-w-[1240px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-9">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Bottom navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <div className="grid grid-cols-5">
          {mobileNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cx(
                  'flex min-h-[60px] flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors',
                  isActive ? 'text-brand-700' : 'text-muted hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cx(
                      'flex h-7 w-9 items-center justify-center rounded-lg',
                      isActive ? 'bg-brand-50' : '',
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
