import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandMark, LinkButton } from '../components/ui';

export function NotFoundPage() {
  const { user } = useAuth();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-5 text-center">
      <Link to={user ? '/dashboard' : '/welcome'} aria-label="StudyMentor AI home">
        <BrandMark />
      </Link>
      <div className="mt-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <Compass className="h-6 w-6" aria-hidden="true" />
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
        Page not found
      </p>
      <h1 className="mt-2 font-display text-3xl text-brand-900">That page is not on the syllabus</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        The link may be old, or the page may have moved. Your progress is safe — head back to your
        dashboard and continue where you left off.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <LinkButton to={user ? '/dashboard' : '/welcome'}>
          {user ? 'Back to dashboard' : 'Go to welcome'}
        </LinkButton>
        {user ? (
          <LinkButton to="/learn" variant="secondary">
            Browse lessons
          </LinkButton>
        ) : (
          <LinkButton to="/login" variant="secondary">
            Log in
          </LinkButton>
        )}
      </div>
    </div>
  );
}
