# Supabase path

The running prototype stores data in a local SQLite file so it works with zero
external services. The production-shaped schema lives here so the app can move to
Supabase/Postgres without redesigning the domain model.

## What is included

- `migrations/0001_init.sql` — all tables from the product data model, foreign
  keys, check constraints, indexes, an `updated_at` trigger, an auth-user trigger
  that creates a profile, and row-level security policies for every user-owned
  table.
- Content tables (`subjects`, `lessons`, `questions`, `current_affairs`) are
  readable by authenticated users and writable only with a privileged key.
- User tables (`profiles`, `study_tasks`, `attempts`, `bookmarks`,
  `lesson_progress`, `conversations`, `messages`, `answer_submissions`) are
  restricted to the row owner using `auth.uid()`.

## What is NOT wired yet

- The running UI talks to the Express API in `server/`, which currently uses
  `node:sqlite`. There is no Supabase data adapter in this build.
- Authentication is implemented locally (scrypt password hashes + HttpOnly
  session cookies). Moving to Supabase Auth means replacing
  `server/lib/auth.ts` and the client session calls with Supabase Auth.
- Sample content is seeded through `server/seed/index.ts` into SQLite. To move it
  to Postgres, export the seed arrays (`server/seed/content/*`) or write a small
  script that inserts them after the migration.

## How to apply

1. Create a Supabase project.
2. Install the Supabase CLI and link the project:
   `supabase link --project-ref <your-project-ref>`
3. Apply the migration:
   `supabase db push`
   (or paste the SQL into the Supabase SQL editor for a first test).
4. Add `SUPABASE_URL`, `SUPABASE_ANON_KEY` and a server-only
   `SUPABASE_SERVICE_ROLE_KEY` to your server environment. Never expose the
   service-role key to the browser.
5. Verify policies with two test users: user A must not be able to select,
   update or delete user B's tasks, attempts, bookmarks, conversations or
   submissions.

## Answer-leak note

The practice endpoint in this prototype deliberately omits `correct_answer` and
`explanation` until an attempt is submitted. If you query `questions` directly
from the browser through Supabase, apply the optional column-level grant block at
the bottom of the migration, or serve questions through an Edge Function.
