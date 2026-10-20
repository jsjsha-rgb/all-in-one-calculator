#!/usr/bin/env node
/**
 * Cross-platform one-command dev runner: `npm run dev:all`.
 *
 * Starts the Express API and the Vite dev server together, with prefixed
 * output, so Windows / macOS / Linux users do not need two terminals or a
 * third-party tool such as concurrently.
 *
 * Behaviour:
 *  - warns if Node is too old for the built-in `node:sqlite` module
 *  - seeds the database on first run (only when data/ has no database yet)
 *  - waits for /api/health before starting the web server
 *  - reuses an API that is already running on the port
 *  - stops both processes when you press Ctrl+C or close the window
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';
const npm = isWindows ? 'npm.cmd' : 'npm';

const API_PORT = Number(process.env.PORT || 3001);
const WEB_PORT = Number(process.env.WEB_PORT || 3000);
const HEALTH_URL = `http://127.0.0.1:${API_PORT}/api/health`;
const DB_FILE = path.resolve(root, process.env.DB_PATH || path.join('data', 'studaymentor.db'));

const useColor = process.stdout.isTTY;
const paint = (code, text) => (useColor ? `\u001b[${code}m${text}\u001b[0m` : text);
const apiTag = paint('36', '[api]');
const webTag = paint('35', '[web]');

const children = [];
let shuttingDown = false;

function log(tag, line) {
  for (const part of String(line).split(/\r?\n/)) {
    if (part.trim()) process.stdout.write(`${tag} ${part}\n`);
  }
}

function checkNodeVersion() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  const supported = major > 22 || (major === 22 && minor >= 13);
  if (!supported) {
    console.error(
      paint('31', `\nNode ${process.versions.node} is too old for this project.`) +
        '\nThe local database uses Node\'s built-in SQLite module, which needs Node 22.13+.\n' +
        'Install the current Node 22 LTS or Node 24 from https://nodejs.org and try again.\n',
    );
    process.exit(1);
  }
}

function pipe(child, tag) {
  child.stdout.on('data', (chunk) => log(tag, chunk));
  child.stderr.on('data', (chunk) => log(tag, chunk));
}

function killTree(child) {
  if (!child || child.killed || child.exitCode !== null) return;
  if (isWindows) {
    // npm.cmd spawns node as a grandchild; taskkill removes the whole tree.
    spawn('taskkill', ['/pid', String(child.pid), '/f', '/t'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
  }
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) killTree(child);
  setTimeout(() => process.exit(code), 400);
}

async function apiIsUp() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1000);
    const response = await fetch(HEALTH_URL, { signal: controller.signal });
    clearTimeout(timer);
    return response.ok;
  } catch {
    return false;
  }
}

function runOnce(command, args, label) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: root,
      shell: isWindows,
      stdio: 'inherit',
      env: process.env,
    });
    child.on('exit', (code) => resolve(code ?? 0));
    child.on('error', (error) => {
      console.error(`Could not run ${label}:`, error.message);
      resolve(1);
    });
  });
}

async function main() {
  checkNodeVersion();

  if (!fs.existsSync(path.join(root, 'node_modules'))) {
    console.log('Installing dependencies (first run only)…\n');
    const code = await runOnce(npm, ['install'], 'npm install');
    if (code !== 0) process.exit(code);
  }

  if (!fs.existsSync(DB_FILE)) {
    console.log('Seeding sample content and the demo learner…\n');
    const code = await runOnce(npm, ['run', 'seed'], 'npm run seed');
    if (code !== 0) process.exit(code);
  }

  console.log(paint('32', '\nStudyMentor AI — starting local servers\n'));

  if (await apiIsUp()) {
    console.log(`${apiTag} reusing the API already running on port ${API_PORT}`);
  } else {
    const api = spawn(npm, ['run', 'start'], {
      cwd: root,
      shell: isWindows,
      env: { ...process.env, PORT: String(API_PORT) },
      detached: !isWindows,
    });
    children.push(api);
    pipe(api, apiTag);
    api.on('exit', (code) => {
      if (!shuttingDown) {
        console.error(paint('31', `\n[api] stopped with code ${code}. Shutting down.`));
        shutdown(code ?? 1);
      }
    });

    const deadline = Date.now() + 30_000;
    let ready = false;
    while (Date.now() < deadline) {
      if (await apiIsUp()) {
        ready = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    if (!ready) {
      console.error(paint('31', '\nThe API did not become ready within 30 seconds.'));
      shutdown(1);
      return;
    }
  }

  const webArgs = ['run', 'dev'];
  if (WEB_PORT !== 3000) webArgs.push('--', '--port', String(WEB_PORT));
  const web = spawn(npm, webArgs, {
    cwd: root,
    shell: isWindows,
    env: { ...process.env, API_PROXY_TARGET: `http://127.0.0.1:${API_PORT}` },
    detached: !isWindows,
  });
  children.push(web);
  pipe(web, webTag);
  web.on('exit', (code) => {
    if (!shuttingDown) {
      console.error(paint('31', `\n[web] stopped with code ${code}. Shutting down.`));
      shutdown(code ?? 1);
    }
  });

  console.log(
    paint('32', `\nOpen ${paint('4', `http://localhost:${WEB_PORT}`)} in your browser.`) +
      '\nDemo login: demo@studaymentor.app / Demo@1234' +
      paint('90', '\n\nPress Ctrl+C to stop both servers.\n'),
  );
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
  process.on(signal, () => shutdown(0));
}
process.on('exit', () => {
  for (const child of children) killTree(child);
});

main().catch((error) => {
  console.error('Failed to start:', error);
  shutdown(1);
});
