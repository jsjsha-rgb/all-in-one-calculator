import { test, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

/**
 * Renders the authenticated shell in jsdom and checks that both the desktop
 * sidebar and the mobile bottom navigation expose the required destinations.
 * CSS visibility is responsive; this verifies the underlying navigation model.
 */
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost:3000/',
  pretendToBeVisual: true,
});
const globalAny = globalThis as any;
globalAny.window = dom.window;
globalAny.document = dom.window.document;
Object.defineProperty(globalAny, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
});
globalAny.HTMLElement = dom.window.HTMLElement;
globalAny.Node = dom.window.Node;
globalAny.Event = dom.window.Event;
globalAny.MouseEvent = dom.window.MouseEvent;
globalAny.getComputedStyle = dom.window.getComputedStyle;
globalAny.requestAnimationFrame = (callback: (time: number) => void) => setTimeout(() => callback(Date.now()), 0);
globalAny.cancelAnimationFrame = (id: number) => clearTimeout(id);
globalAny.IS_REACT_ACT_ENVIRONMENT = true;
dom.window.scrollTo = () => undefined;
globalAny.HTMLElement.prototype.scrollIntoView = () => undefined;

const originalFetch = globalThis.fetch;
globalThis.fetch = (async (input: any) => {
  const url = String(input);
  if (url.includes('/api/auth/me')) {
    return new Response(
      JSON.stringify({
        user: {
          id: 'u1',
          name: 'Ananya Rao',
          email: 'ananya@example.com',
          examYear: 2027,
          preparationLevel: 'intermediate',
          dailyGoalMinutes: 120,
          onboardingComplete: true,
          createdAt: new Date().toISOString(),
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
  if (url.includes('/api/ai/status')) {
    return new Response(
      JSON.stringify({ mode: 'demo', provider: 'demo', model: 'demo-studymentor' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}) as typeof fetch;

const React = await import('react');
const { render, screen, within, cleanup } = await import('@testing-library/react');
const { MemoryRouter, Route, Routes } = await import('react-router-dom');
const { AppShell } = await import('../src/components/AppShell.tsx');
const { AuthProvider } = await import('../src/context/AuthContext.tsx');
const { ToastProvider } = await import('../src/context/ToastContext.tsx');

afterEach(() => {
  cleanup();
});

after(() => {
  globalThis.fetch = originalFetch;
});

test('desktop sidebar and mobile bottom navigation both expose the required routes', async () => {
  const element = React.createElement(
    MemoryRouter,
    { initialEntries: ['/dashboard'] },
    React.createElement(
      AuthProvider,
      null,
      React.createElement(
        ToastProvider,
        null,
        React.createElement(
          Routes,
          null,
          React.createElement(
            Route,
            { element: React.createElement(AppShell) },
            React.createElement(Route, {
              path: '/dashboard',
              element: React.createElement('p', null, 'Dashboard body'),
            }),
          ),
        ),
      ),
    ),
  );

  render(element as any);

  const primary = await screen.findByRole('navigation', { name: 'Primary' });
  const primaryLabels = within(primary)
    .getAllByRole('link')
    .map((link) => link.textContent?.trim());
  for (const label of [
    'Home',
    'Learn',
    'Practice',
    'AI Mentor',
    'Mains evaluation',
    'Current affairs',
    'Profile & progress',
  ]) {
    assert.ok(primaryLabels.includes(label), `desktop navigation should contain ${label}`);
  }

  const bottom = screen.getByRole('navigation', { name: 'Bottom navigation' });
  const bottomLabels = within(bottom)
    .getAllByRole('link')
    .map((link) => link.textContent?.trim());
  assert.deepEqual(bottomLabels, ['Home', 'Learn', 'Practice', 'AI', 'Profile']);

  const skip = screen.getByRole('link', { name: 'Skip to main content' });
  assert.equal(skip.getAttribute('href'), '#main-content');

  const main = screen.getByRole('main');
  assert.equal(main.getAttribute('id'), 'main-content');
  assert.match(main.textContent ?? '', /Dashboard body/);
});

test('navigation marks the active destination with aria-current', async () => {
  const element = React.createElement(
    MemoryRouter,
    { initialEntries: ['/learn'] },
    React.createElement(
      AuthProvider,
      null,
      React.createElement(
        ToastProvider,
        null,
        React.createElement(
          Routes,
          null,
          React.createElement(
            Route,
            { element: React.createElement(AppShell) },
            React.createElement(Route, {
              path: '/learn',
              element: React.createElement('p', null, 'Learn body'),
            }),
          ),
        ),
      ),
    ),
  );

  render(element as any);
  const bottom = screen.getByRole('navigation', { name: 'Bottom navigation' });
  const learnLink = within(bottom).getByRole('link', { name: 'Learn' });
  assert.equal(learnLink.getAttribute('aria-current'), 'page');
});
