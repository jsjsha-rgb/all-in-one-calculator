# StudyMentor AI

An AI-assisted UPSC Civil Services preparation workspace: structured GS lessons,
MCQ and PYQ-style practice, a doubt-solving mentor, Mains answer evaluation,
dated current-affairs briefs, and a progress view that connects all of it.

> **Independent study tool.** Not affiliated with the UPSC, SuperKalam or any
> publisher. All lessons, questions, current-affairs briefs and Mains prompts in
> this repository are original sample content created for this prototype. The UI
> and branding are original; no proprietary code, designs or study material have
> been copied.

---

## 1. What is in this build

A working full-stack application, not a static mockup:

| Area | What works |
| --- | --- |
| **Authentication** | Email sign-up, login, logout, session persistence, onboarding, forgot/reset password (development delivery), change password |
| **Dashboard** | Personalised greeting, daily plan generated from the syllabus, task completion, streak, continue-learning, quick actions, weak topics, latest brief, progress rail |
| **Learning** | 7 GS subjects, 14 lessons with objectives and notes, bookmarks, mark complete/reopen, per-subject progress, 3-question quick check |
| **Practice** | 35 original questions, filters (subject, topic, difficulty, exam year, bookmarked), server-checked answers, explanations and source labels, attempt history, mistakes review, accuracy stats |
| **AI mentor** | Streaming-style chat UI, suggested prompts, saved conversations, follow-up context, copy, save-to-notes, source chips, retry, demo/live disclosure |
| **Mains** | Sample and custom questions, 10/15/20-mark rubric, live word count, draft autosave, structured six-part feedback, missing dimensions, strengths/weaknesses, improvements, sample model answer, saved history |
| **Current affairs** | Search, subject filters, dated sample briefs, prelims facts, Mains relevance, related questions, bookmarks, clearly labelled demo provenance |
| **Profile** | Goals editing, stats, weekly activity chart, weak topics, bookmarks, question history, Mains submissions, password change, logout |
| **Responsive UI** | Desktop sidebar + optional summary rail, mobile header + bottom navigation (Home/Learn/Practice/AI/Profile), accessible labels, focus styles, empty/loading/error states |

**Deployment-ready pieces:** Vite production build, Express server serving the SPA
and API, SQLite schema, Supabase/Postgres migration with row-level security,
environment template, and an automated test suite.

### Free and unlimited access

Every feature is available to every account, with no commercial limits anywhere
in the product:

- no subscription, licence key, trial timer or credit balance;
- no locked lessons, question packs, current-affairs articles or Mains reviews;
- no daily or monthly quota on AI mentor messages, Mains submissions, quizzes,
  bookmarks, notes or saved history;
- no "premium" flag in the schema, API or UI — there is nothing to unlock;
- AI usage is limited only by the provider key *you* supply, not by this app.

The only throttles are in-memory anti-abuse counters on sign-up, login, password
reset, mentor messages and Mains evaluation, so a script cannot brute-force
passwords or burn through an API key. They are configurable and can be switched
off completely for personal or classroom self-hosting:

```env
RATE_LIMIT_DISABLED=true       # every counter off — literally unlimited
# or keep them and widen the thresholds:
RATE_LIMIT_MULTIPLIER=5
```

With no AI key the mentor and Mains evaluator run in the labelled demo mode,
which is also unlimited. `GET /api/ai/status` reports
`access: { free: true, unlimited: true }` alongside the AI mode.

---

## 2. Quick start

Requirements: **Node.js 22.5+** (the local database uses the built-in
`node:sqlite` module, so no native build tools are needed).

```bash
npm install
cp .env.example .env          # optional for demo mode
npm run seed                  # sample content + demo learner
```

Run the API and the Vite dev server in two terminals:

```bash
# terminal 1 — API on :3001
npm run start

# terminal 2 — web app on :3000 (proxies /api to :3001)
npm run dev
```

Open <http://localhost:3000>.

### Demo account

```
Email:    demo@studaymentor.app
Password: Demo@1234
```

The demo learner arrives with a week of sample progress, bookmarks, a saved AI
conversation and one Mains evaluation. `npm run seed:reset` recreates that data.

### Single-process production-style run

```bash
npm run build
npm start          # serves dist/ + API on PORT (default 3001)
```

---

## 3. Technology choices

| Layer | Choice | Why |
| --- | --- | --- |
| UI | React 19 + TypeScript + Vite | Requested stack; fast feedback, typed components |
| Styling | Tailwind CSS v4 + custom design tokens | Consistent spacing, colour and type scale; responsive utilities |
| Mobile shell | Responsive web + web app manifest | Installable on mobile; the SPA architecture can later be wrapped with Capacitor for native packaging |
| Icons | `lucide-react` | Accessible, consistent icon set |
| Routing | React Router 7 | Nested authenticated routes and guards |
| API | Express 4 + TypeScript (`tsx`) | Clear server boundary for auth, scoring and AI secrets |
| Database (local) | `node:sqlite` | Zero-setup, file-backed persistence; no native compilation in this environment |
| Database (production path) | Supabase / PostgreSQL | Migration with FKs, constraints, indexes and RLS included in `supabase/` |
| AI | Provider-agnostic server client | Gemini or any OpenAI-compatible endpoint; demo fallback with no key |
| Validation | Explicit server-side validators | Shared by routes and unit tests; no schema library dependency |

**Why SQLite rather than Supabase in the running demo?** The target environment
could not compile native Node bindings and has no Supabase project attached.
The data shapes match the Postgres migration one-to-one, and all database access
is behind the Express API, so swapping the data layer does not change the UI.
Sections 7 and 11 explain exactly what remains to connect Supabase.

---

## 4. Project structure

```
.
├── src/                         # React client
│   ├── components/              # Reusable UI, shell, markdown renderer, quiz runner
│   ├── context/                 # Auth session + toast notifications
│   ├── lib/                     # Typed API client, types, formatting helpers
│   ├── pages/                   # Welcome, auth, dashboard, learn, practice, mentor,
│   │                            # mains, affairs, profile, onboarding, 404
│   ├── App.tsx                  # Routes, auth guards, onboarding guard
│   ├── main.tsx                 # Providers + BrowserRouter
│   └── index.css                # Design tokens, base styles, prose styles
├── server/
│   ├── index.ts                 # Express app, static SPA, error handling
│   ├── db.ts                    # SQLite schema + helpers (mirrors Postgres)
│   ├── routes/                  # auth, content, practice, mentor, mains, profile
│   ├── lib/                     # auth, validation, scoring, AI provider, evaluator,
│   │                            # study/dashboard queries, content mappers
│   └── seed/
│       ├── index.ts             # Idempotent seed + demo learner generation
│       └── content/             # Original subjects, lessons, questions, affairs, Mains
├── supabase/
│   ├── migrations/0001_init.sql # Postgres schema, triggers, indexes, RLS policies
│   └── README.md                # Supabase setup and migration notes
├── tests/                       # Node test runner suites (see §10)
├── public/favicon.svg
├── .env.example
└── README.md
```

### API surface (all under `/api`)

- Auth: `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`,
  `PUT /auth/onboarding`, `POST /auth/forgot-password`, `POST /auth/reset-password`
- Content: `GET /dashboard`, `/subjects`, `/subjects/:id`, `/lessons/:id`,
  `POST|DELETE /lessons/:id/complete`, `POST /study-tasks/:id/toggle`,
  `/affairs`, `/affairs/:id`, `/bookmarks`, `/search`
- Practice: `GET /practice/filters`, `/practice/questions`, `/practice/history`,
  `/practice/mistakes`, `/practice/stats`, `POST /practice/attempt`
- Mentor: `GET /ai/status`, `GET|POST /mentor/conversations`,
  `GET|DELETE /mentor/conversations/:id`, `POST /mentor/messages`,
  `POST /mentor/messages/:id/save`
- Mains: `GET /mains/questions`, `POST /mains/evaluate`,
  `GET /mains/submissions`, `GET|DELETE /mains/submissions/:id`
- Profile: `GET|PUT /profile`, `PUT /profile/password`

---

## 5. Environment variables

Copy `.env.example` to `.env`. Only server-side variables are secret.

| Variable | Purpose | Default |
| --- | --- | --- |
| `NODE_ENV` | `development` or `production` (sets Secure cookies) | — |
| `PORT` | API / production server port | `3001` |
| `DB_PATH` | SQLite file location | `./data/studaymentor.db` |
| `SEED_ON_START` | Seed content at boot | on in dev, off in prod |
| `SEED_DEMO_ACCOUNT` | Create the demo learner when seeding | `true` |
| `AI_PROVIDER` | `gemini`, `openai` or `demo` | auto-detect by key |
| `AI_MODEL` | Model name | `gemini-2.5-flash` / `gpt-4o-mini` |
| `AI_TIMEOUT_MS` | Provider request timeout | `30000` |
| `GEMINI_API_KEY` | Google AI Studio key (server only) | — |
| `OPENAI_API_KEY` | OpenAI or compatible key (server only) | — |
| `OPENAI_BASE_URL` | OpenAI-compatible base URL | `https://api.openai.com/v1` |
| `APP_URL` | Public app origin for links | `http://localhost:3000` |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Future Supabase path; not used by the demo | — |
| `API_PROXY_TARGET` | Vite dev proxy target | `http://127.0.0.1:3001` |

No AI key is ever bundled into client code, and `vite.config.ts` deliberately
does **not** expose provider keys through `define`.

---

## 6. AI mentor and Mains evaluation setup

### Demo mode (default)

With no provider key:

- The mentor answers from the local lesson library using keyword retrieval. It
  shows a **Demo mode** badge, cites the internal lessons it used, and never
  claims to have consulted the web.
- Mains feedback is produced by a transparent, deterministic rubric that checks
  word count, question relevance, introduction/conclusion, examples, data,
  counter-argument and directive words.
- Both surfaces display an explicit disclosure, and `/api/ai/status` reports the
  mode. The UI never presents demo output as live AI.

### Live mode — Gemini

1. Create a Google AI Studio API key and set:
   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your_server_side_key
   AI_MODEL=gemini-2.5-flash
   ```
2. Restart the API. `/api/ai/status` should return `"mode": "live"`.
3. The server calls the Gemini `generateContent` REST API. Mains responses are
   requested as JSON and validated before they are saved or shown.

### Live mode — OpenAI or compatible

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_server_side_key
OPENAI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

Any chat-completions-compatible endpoint (for example a self-hosted gateway) can
be used by changing `OPENAI_BASE_URL`.

### Failure behaviour

- Missing credentials → labelled demo fallback with a setup reason.
- Provider error / timeout → HTTP 502/504 with `retryable: true`; the UI shows a
  retry action. No assistant message or evaluation is saved.
- Malformed Mains JSON → rejected by `validateEvaluation`; nothing is displayed
  as a real result.
- Rate limits (anti-abuse only, never a usage quota): mentor 20 requests / 10 min
  per user; Mains 8 / 10 min; login 20 / 15 min; signup 10 / 15 min. Set
  `RATE_LIMIT_DISABLED=true` to remove them, or `RATE_LIMIT_MULTIPLIER` to widen
  them. Counters are in-memory per process — use Redis or an edge limiter for
  multi-instance production.

---

## 7. Supabase setup

The full schema is in [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql),
including foreign keys, check constraints, indexes, an `auth.users` → `profiles`
trigger, and RLS policies for every table.

1. Create a project at <https://supabase.com>.
2. Apply the migration with the Supabase CLI:
   ```bash
   supabase link --project-ref <project-ref>
   supabase db push
   ```
   or paste the SQL into the SQL editor.
3. Add `SUPABASE_URL`, `SUPABASE_ANON_KEY` and a server-only
   `SUPABASE_SERVICE_ROLE_KEY` to the server environment.
4. Verify isolation with two test users: user A must not read or mutate user B's
   profile, tasks, attempts, bookmarks, conversations, messages or submissions.
5. To fully switch the app, replace the helpers in `server/lib/auth.ts` (local
   scrypt sessions → Supabase Auth) and `server/db.ts` (SQLite → Postgres
   client). The API contracts and UI stay the same. This adapter work is **not
   included** in the current build.

See `supabase/README.md` for the answer-visibility hardening note.

---

## 8. Deployment guide

### Option A — single Node service (fastest)

1. Build: `npm ci && npm run build`.
2. Set environment:
   ```env
   NODE_ENV=production
   PORT=3001
   SEED_ON_START=false
   AI_PROVIDER=gemini
   GEMINI_API_KEY=...
   ```
3. Seed sample content once (without the demo learner):
   ```bash
   SEED_ON_START=true SEED_DEMO_ACCOUNT=false npm run seed
   ```
4. Start: `npm start`.
5. Put the service behind HTTPS (required: production cookies are `Secure`).
   Health check: `GET /api/health`.
6. If you keep SQLite, mount a persistent volume at `./data`; otherwise plan the
   Supabase migration. SQLite is single-instance and not suitable for horizontal
   scaling.
7. Set a reverse-proxy request timeout above `AI_TIMEOUT_MS` (default 30s).

`dist/` and `data/` are git-ignored. Do not enable `SEED_ON_START` with
`SEED_DEMO_ACCOUNT=true` on a public deployment — that creates a known password.
The welcome and login screens include a one-click demo shortcut with those
credentials; remove that shortcut (or keep the demo account out of production)
before opening a private deployment to real users.

### Option B — split hosting

- Static client: deploy `dist/` to Netlify/Vercel/Cloudflare Pages.
- API: deploy `server/` to Render/Railway/Fly/VM.
- Point the client at the API by adding a rewrite/proxy from `/api/*` to the API
  origin, or change the fetch base in `src/lib/api.ts`. Same-origin proxying is
  recommended so the HttpOnly session cookie works without CORS/cookie
  relaxation.

### Before going live

- Replace local auth with Supabase Auth (or keep the server sessions behind TLS
  and add email verification).
- Add an email provider for password reset; currently the reset token is returned
  only in non-production responses for testing.
- Move the (optional, anti-abuse only) rate limiting to shared storage if you
  run several API instances.
- Add structured logs/monitoring and error reporting.
- Review data retention and privacy copy with a qualified adviser.

---

## 9. Data model

Implemented in both `server/db.ts` (SQLite) and the Postgres migration:

`profiles`, `subjects`, `lessons`, `study_tasks`, `questions`, `attempts`,
`bookmarks`, `lesson_progress` (supports lesson completion), `conversations`,
`messages`, `answer_submissions`, `current_affairs`.

Relationships and protections:

- All user-owned rows carry `user_id` with `ON DELETE CASCADE`.
- Unique constraint on `(user_id, item_type, item_id)` for bookmarks.
- Partial unique index on `(user_id, lesson_id, due_date)` for lesson tasks.
- Question answers are `CHECK (correct_answer BETWEEN 0 AND 3)`; options are a
  4-item array.
- Every protected API route resolves the user from the signed session, never
  from a request body. Ownership is re-checked for conversations, submissions and
  assistant messages.
- RLS policies in the migration scope every user table to `auth.uid()`, and
  message access is checked through the parent conversation.

---

## 10. Testing

```bash
npm test        # Node test runner + tsx + jsdom for the navigation test
npm run lint    # TypeScript project check
```

Executed on 2026-10-20: **39 tests passed, 0 failed.**

Coverage:

- **Scoring:** `tests/scoring.test.ts` — correct/incorrect/unanswered, empty quiz
  returns zeros (no `NaN`), out-of-range answers ignored, accuracy rounding, bands.
- **Validation:** `tests/validation.test.ts` — signup/login/onboarding fields,
  mentor limits, 40–800-word Mains bounds, evaluation shape validation, and
  rejection of fabricated/malformed feedback.
- **API + auth boundaries:** `tests/api.test.ts` — 401s on every protected route,
  signup/login/logout, persistence across re-login, lesson completion and undo,
  task completion, bookmark create/remove and cross-user isolation, invalid
  bookmark targets, answer secrecy before submission, empty filter results,
  attempt scoring and history, mistakes, accuracy.
- **AI + evaluation:** `tests/ai-eval.test.ts` — demo conversation persistence
  and follow-ups, saved explanations, conversation ownership, demo evaluation
  saved and labelled, short-answer rejection, provider-without-key fallback,
  provider failure returning retryable 502 without fake output, and a successful
  live provider response validated before saving.
- **Responsive navigation:** `tests/navigation.test.tsx` — renders the authenticated
  shell in jsdom and asserts the desktop sidebar destinations, the five mobile
  bottom-nav destinations, the skip link, main landmark and active-link state.

### End-to-end journey checks actually executed

Beyond the unit tests, the critical student journey was exercised as follows:

1. Logged in with the demo account through the real API and confirmed the
   session cookie, dashboard payload and generated daily plan.
2. Completed a lesson and confirmed the progress count changed, then reopened it.
3. Submitted correct and incorrect practice answers and confirmed scoring,
   explanation, attempt history and mistakes.
4. Sent a demo mentor question, posted a follow-up and saved the answer to notes.
5. Submitted a Mains answer, validated the saved rubrics and retrieved it from
   history.
6. Rendered every authenticated page (dashboard, learn, subject, lesson,
   practice, mentor, mains, affairs, article, profile) in jsdom against the live
   API and confirmed each reached its loaded state without runtime errors.

**Not automated:** a human visual click-through and screenshots. No browser
binary is available in this environment, so layout was reviewed in code and
through the production build. Please open the live preview for a final visual
pass on desktop and mobile widths.

---

## 11. Functional vs demo data

### Fully functional

- Account creation, login, logout, onboarding, profile updates, password change.
- Server-side sessions (HttpOnly, SameSite=Lax), per-user data access checks.
- Daily plan generation and task completion, lesson completion and undo.
- Practice filtering, server-side scoring, explanations, bookmarks, history,
  mistakes, accuracy statistics.
- AI chat persistence, conversation history, follow-ups, copy, save-to-notes,
  demo/live mode reporting, retry.
- Mains evaluation submission, saving, structured rendering and deletion.
- Current-affairs search/filter/bookmark, article detail and related questions.
- Responsive layouts, accessible forms, focus states, loading/error/empty states.
- Idempotent seed script, demo reset, SQLite persistence.

### Sample or demo data / services

- **All study content** is original sample material: 7 subjects, 14 lessons, 35
  MCQs, 8 current-affairs briefs, 7 Mains prompts. Exam-year questions are
  explicitly labelled **PYQ-style samples**, not official UPSC papers.
- **Current affairs** are not live news. Every brief carries a demo label and a
  demo source URL (`demo.studaymentor.app`); no publisher is quoted or scraped.
- **AI responses and Mains feedback** default to demo mode unless a provider key
  is configured. Mains feedback is indicative, not official marking.
- **Progress storage** is local SQLite per account, not cloud-synced.
- **Password reset email** is not sent; in development the token is returned in
  the response. Production requires an email provider.
- **File uploads** are not implemented; there is no upload endpoint or storage
  bucket in this build.
- **Supabase/Auth migration** is schema-only; the running app does not use it.

---

## 12. Security and privacy notes

- Passwords are hashed with `scrypt` and a per-user salt; comparison is constant
  time. Sessions are random 256-bit tokens stored as SHA-256 hashes, delivered in
  HttpOnly cookies with a 30-day expiry and `Secure` in production.
- All input is validated and length-limited server-side. Mentor messages are
  capped at 2,000 characters, Mains answers at 800 words, and API JSON bodies at
  256 KB.
- AI and evaluation endpoints are rate-limited per user; auth endpoints per IP.
- AI provider credentials exist only on the server. The client calls
  `/api/ai/status` for mode information, never the provider.
- The markdown renderer builds React nodes; it does not use
  `dangerouslySetInnerHTML`.
- Practice questions omit `correct_answer`/`explanation` until an attempt is
  submitted.
- User data is scoped by the authenticated session on every query. Cross-user
  access to conversations and submissions returns 404.
- RLS policies are provided for the production Supabase path.

**Known limitations:** in-memory rate limits and sessions do not survive
multi-instance restarts; no email verification or password-reset delivery; no
CSRF token (SameSite=Lax plus same-origin API); no audit log; SQLite is intended
for local/demo use. Address these before handling real personal data at scale.

---

## 13. Required credentials and external services

| Service | Needed for the demo? | Used for |
| --- | --- | --- |
| None | Yes | The app runs fully in demo mode with local SQLite |
| Google AI Studio (`GEMINI_API_KEY`) **or** OpenAI-compatible key | No | Live AI mentor + live Mains evaluation |
| Supabase project | No | Production auth/database path (schema provided) |
| Transactional email provider | No | Production password reset / verification (not implemented) |
| Hosting with a persistent disk | No | SQLite persistence if not moving to Supabase |

---

## 14. Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server on `:3000`, `/api` proxied to `:3001` |
| `npm start` | Express API (`:3001`) and built SPA, seeds in development |
| `npm run build` | Production client build into `dist/` |
| `npm run seed` | Upsert sample content and demo learner |
| `npm run seed:reset` | Recreate the demo learner's data from scratch |
| `npm test` | Full automated test suite |
| `npm run lint` | `tsc --noEmit` |

---

## 15. Roadmap (not in this build)

- Supabase data/auth adapter and cloud sync.
- Authorised current-affairs ingestion with editorial review and provenance.
- Spaced-repetition revision queue derived from mistakes and bookmarks.
- Rich Mains editor (headings, rough work) and PDF export.
- File uploads with type/size validation and private storage.
- Email delivery, verification and password reset.
- Streak reminders and weekly review emails.
- Admin content authoring UI.
