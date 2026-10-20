#!/usr/bin/env node
/**
 * Pre-flight check run automatically before `npm start` and `npm run dev`.
 *
 * It turns the two most common first-run failures into a readable message
 * instead of a stack trace:
 *   1. an old Node version that lacks the built-in `node:sqlite` module;
 *   2. a missing `node_modules` folder (dependencies not installed yet).
 */
const [major, minor] = process.versions.node.split('.').map(Number);

if (major < 22 || (major === 22 && minor < 13)) {
  console.error(`
StudyMentor AI needs Node.js 22.13 or newer (Node 24 LTS also works).
You are running Node ${process.versions.node}.

The local database uses Node's built-in SQLite module, which older versions
do not provide. Install the current LTS from https://nodejs.org and reopen
your terminal, then run the same command again.
`);
  process.exit(1);
}

try {
  await import('node:sqlite');
} catch {
  console.error(`
This Node build does not include the node:sqlite module (Node ${process.versions.node}).
Install the official build from https://nodejs.org (22.13+ or 24 LTS) and try again.
`);
  process.exit(1);
}

import { existsSync } from 'node:fs';

if (!existsSync(new URL('../node_modules', import.meta.url))) {
  console.error(`
Dependencies are not installed yet. Run:

    npm install

then start the app again.
`);
  process.exit(1);
}
