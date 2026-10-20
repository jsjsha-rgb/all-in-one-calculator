# Running StudyMentor AI locally on Windows

A step-by-step guide for Windows 10 and 11. Everything runs on your own machine;
no account, subscription, Docker or cloud service is required.

Total time: about 5 minutes the first time, seconds afterwards.

---

## 1. Install Node.js (once)

The app needs **Node.js 22.13 or newer** (the local database uses Node's built-in
SQLite module). Node 24 LTS is also fine.

1. Go to <https://nodejs.org> and download the **LTS** Windows installer (`.msi`).
2. Run it and keep the default options — this also installs `npm`.
3. Open **Start → "Command Prompt"** and check the versions:

```bat
node -v
npm -v
```

You should see `v22.x` (13 or higher), `v23.4+` or `v24.x`.

> If you already had Node, make sure it is 22.13+. Older versions fail with
> `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`.

---

## 2. Unzip the project

1. Download `studaymentor-ai-source.zip`.
2. Right-click → **Extract All…**
3. Choose a short path without spaces, for example `C:\StudyMentor`.
   Avoid OneDrive-synced folders; the sync service can lock the SQLite file.

You should end up with:

```
C:\StudyMentor\
├── package.json
├── run-windows.bat
├── server\
├── src\
└── ...
```

---

## 3. Start it

**The easy way:** double-click **`run-windows.bat`** in that folder.

It will:

1. check your Node version,
2. run `npm install` on the first launch,
3. create `data\studaymentor.db` and load the sample content,
4. start the API (port 3001) and the web app (port 3000),
5. open <http://localhost:3000> in your browser.

Keep the black window open while you use the app. Press **Ctrl+C** (or close the
window) to stop everything.

**The manual way** — two Command Prompt windows in the project folder:

```bat
:: window 1 — API
npm install
npm run seed
npm start

:: window 2 — web app
npm run dev
```

Or one window with both servers:

```bat
npm run dev:all
```

### Log in

```
Email:    demo@studaymentor.app
Password: Demo@1234
```

Or click **Create a free account** and register your own — everything is free and
unlimited, there is no card and no usage cap.

---

## 4. Everyday use

| Task | Command |
| --- | --- |
| Start everything | double-click `run-windows.bat`, or `npm run dev:all` |
| Reset the demo data | `npm run seed:reset` |
| Run the test suite | `npm test` |
| Type-check | `npm run lint` |
| Production build | `npm run build` then `npm start` (serves `dist\` on port 3001) |

Your progress, notes, bookmarks, conversations and Mains submissions are stored
in `data\studaymentor.db`. Back that file up to keep your data, or delete it and
run `npm run seed` to start fresh.

---

## 5. Optional extras

### Live AI (instead of clearly-labelled demo mode)

1. Copy `.env.example` to `.env` in the project folder:
   ```bat
   copy .env.example .env
   ```
2. Open `.env` in Notepad and add **one** provider:
   ```env
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-your-server-side-key
   AI_MODEL=gpt-4o-mini
   ```
   or
   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your-google-ai-studio-key
   AI_MODEL=gemini-2.0-flash
   ```
3. Restart the app. The banner changes from "Demo mode" to "Live AI".

Keys stay on your machine and are only read by the server. Never put them in a
`VITE_` variable.

### Switch the anti-abuse limits off

Every feature is unlimited by default. The only counters are anti-abuse limits on
login and AI calls. To remove them entirely:

```env
RATE_LIMIT_DISABLED=true
```

---

## 6. Troubleshooting

**"node is not recognized as an internal or external command"**
Node is not installed, or the installer's PATH change needs a new terminal.
Close every Command Prompt, reopen one, and run `node -v` again.

**`ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`**
Your Node is older than 22.13. Install the current LTS from nodejs.org.

**`EADDRINUSE: address already in use :::3001` (or 3000)**
Something else is using the port. Find and stop it:

```bat
netstat -ano | findstr :3001
taskkill /PID <pid-from-the-last-column> /F
```

Or run on different ports:

```bat
set PORT=3101
set WEB_PORT=3100
npm run dev:all
```

**`npm install` fails with a network or proxy error**
Corporate networks often need a proxy:
`npm config set proxy http://user:pass@proxy:port`, or run the install on a
personal connection. Do not use `npm audit fix --force`; it can upgrade past
working versions.

**The page loads but every API call fails**
The API window is closed or crashed. Start both with `npm run dev:all` and check
that <http://localhost:3001/api/health> returns `{"ok":true,...}`.

**Windows Firewall asks for permission**
Allow access on **private networks**. Both servers listen on `0.0.0.0`, so
allowing them lets you open the app from a phone on the same Wi-Fi at
`http://<your-pc-ip>:3000`.

**"Windows protected your PC" when running the `.bat`**
That is SmartScreen reacting to a downloaded script. Either choose
**More info → Run anyway**, or skip the script and use the manual commands in
step 3. The `.bat` only runs `npm install`, `npm run seed` and `npm run dev:all`.

**The browser does not open automatically**
Just visit <http://localhost:3000> yourself after the console prints
`VITE ready`.

**A port is blocked by antivirus**
Some suites block `localhost` ports. Allow node.exe for ports 3000 and 3001, or
change the ports as shown above.

---

## 7. What runs where

| Piece | Address | Started by |
| --- | --- | --- |
| Web app (React + Vite) | <http://localhost:3000> | `npm run dev` / `run-windows.bat` |
| API (Express) | <http://localhost:3001/api> | `npm start` / `run-windows.bat` |
| Database | `data\studaymentor.db` (SQLite file) | created by `npm run seed` |

The browser only talks to port 3000; Vite proxies `/api` to port 3001, so there
are no CORS settings to configure.

For the full feature list, data model and deployment notes see
[`README.md`](README.md). For the Supabase/Postgres production path see
[`supabase/README.md`](supabase/README.md).
