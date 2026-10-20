import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppShell } from './components/AppShell';
import { BrandMark, Spinner } from './components/ui';
import { WelcomePage } from './pages/Welcome';
import {
  ForgotPasswordPage,
  LoginPage,
  ResetPasswordPage,
  SignupPage,
} from './pages/auth/AuthPages';
import { OnboardingPage } from './pages/Onboarding';
import { DashboardPage } from './pages/Dashboard';
import { LearnPage, SubjectPage } from './pages/Learn';
import { LessonPage } from './pages/Lesson';
import { PracticePage } from './pages/Practice';
import { MentorPage } from './pages/Mentor';
import { MainsPage } from './pages/Mains';
import { AffairsPage, ArticlePage } from './pages/Affairs';
import { ProfilePage } from './pages/Profile';
import { NotFoundPage } from './pages/NotFound';

function FullPageLoader({ label = 'Opening your workspace…' }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-paper px-5">
      <BrandMark />
      <div className="flex items-center gap-2 text-sm text-muted">
        <Spinner />
        {label}
      </div>
    </div>
  );
}

function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (!user) {
    return (
      <Navigate
        to="/welcome"
        replace
        state={{ message: 'Log in to continue where you left off.' }}
      />
    );
  }
  return <Outlet />;
}

function RequireOnboarding() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/welcome" replace />;
  if (!user.onboardingComplete) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (user) return <Navigate to={user.onboardingComplete ? '/dashboard' : '/onboarding'} replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  return <Navigate to={user ? (user.onboardingComplete ? '/dashboard' : '/onboarding') : '/welcome'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnly>
            <SignupPage />
          </PublicOnly>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnly>
            <ForgotPasswordPage />
          </PublicOnly>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicOnly>
            <ResetPasswordPage />
          </PublicOnly>
        }
      />

      <Route element={<RequireAuth />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<RequireOnboarding />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/learn/:subjectId" element={<SubjectPage />} />
            <Route path="/lessons/:lessonId" element={<LessonPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/mentor" element={<MentorPage />} />
            <Route path="/mains" element={<MainsPage />} />
            <Route path="/affairs" element={<AffairsPage />} />
            <Route path="/affairs/:articleId" element={<ArticlePage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
