# Relay — Drive → YouTube auto-uploader

A small Next.js app with a dashboard: connect your Google account, paste a
Drive folder link, and it uploads every video in that folder to your
YouTube channel. It can run manually (click "Upload") or fully hands-off
via a scheduled endpoint.

## 1. Google Cloud setup (one-time)

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and create a project (or use an existing one).
2. Under **APIs & Services → Library**, enable:
   - **Google Drive API**
   - **YouTube Data API v3**
3. Under **APIs & Services → OAuth consent screen**: set it up as **External** (or Internal if you're on Workspace), add your own Google account as a **Test user** if the app is in Testing mode.
4. Under **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback` for local dev, or `https://your-domain.com/api/auth/callback` once deployed.
5. Copy the generated **Client ID** and **Client Secret**.

## 2. Configure the app

```bash
cp .env.example .env.local
```

Fill in `.env.local`:
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — from step 1
- `GOOGLE_REDIRECT_URI` — must exactly match what you entered in step 1
- `SCAN_SECRET` — make up any long random string; protects the automated endpoint
- `DEFAULT_PRIVACY_STATUS` — `private`, `unlisted`, or `public` for new uploads

## 3. Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, click **Connect Google account**, sign in
and approve the Drive + YouTube permissions, then paste a Drive folder
link (e.g. `https://drive.google.com/drive/folders/1AbCdeFGhIJK...`) and
click **Save**. The dashboard lists every video in that folder with its
upload status, and refreshes automatically every 15 seconds.

## 4. Fully automatic uploads (no one has to open the dashboard)

The dashboard itself only uploads when it's open, or when you click
Upload. For true "drop a file in and forget it" automation, point a
scheduler at:

```
GET https://your-domain.com/api/auto-upload?secret=YOUR_SCAN_SECRET
```

This scans the configured folder and uploads anything new. Options:

- **Vercel Cron** (if deploying to Vercel) — add a `vercel.json` with a cron entry hitting that URL every few minutes.
- **cron-job.org** or a similar free scheduler — point it at the URL above.
- **Your own server** — run `npm run poll` alongside `npm start` (see `scripts/poller.js`); it hits the endpoint locally on an interval, no external service needed.

## Editing details and deleting videos

- **Custom description**: click **Edit** on any not-yet-uploaded video to set its description and "made for kids" status before it uploads. Saved automatically per file.
- **Delete from YouTube**: on an uploaded video, click **Delete from YouTube** to permanently remove it from your channel (asks for confirmation first — this cannot be undone).
- **Remove from list**: available on any video, this only makes the app forget about the file — it does not touch YouTube, and the file will reappear as "pending" next scan if it's still in the Drive folder.
- **Monetization**: YouTube's public API has no field for enabling monetization or ad settings — that's only available in YouTube Studio, and only once your channel is accepted into the YouTube Partner Program. Each uploaded video gets an **open in Studio** link so you can handle that yourself in a couple of clicks.

## Important limitations to know about

- **Hosting**: this app stores your Google tokens and upload history as
  local JSON files (`data/tokens.json`, `data/tracker.json`,
  `data/config.json`). That works great on an always-on server (a small
  VPS, a Docker container, Render/Railway, your own machine) but **will
  not persist on serverless platforms** like Vercel/Netlify, since their
  filesystem resets between requests. If you deploy there, swap the
  functions in `lib/store.js` for a real store (Vercel KV, Redis, a
  database) first.
- **Large files / serverless timeouts**: uploading streams the video
  directly from Drive to YouTube without buffering it fully in memory,
  but big files still take time. Serverless functions have execution
  time limits; a persistent Node server (VPS) doesn't, so it's the
  simpler choice for large or long videos.
- **YouTube quota**: Google's default YouTube API quota allows roughly
  6 video uploads per day per project. For more, request a quota
  increase from Google — this is normal for anyone building on this API,
  not something the app can bypass.
- **Non-recursive**: only videos directly inside the chosen folder are
  picked up, not subfolders.
- **Single user**: built for one person's Drive + one YouTube channel,
  not a multi-tenant service.

## Project structure

```
lib/            Google auth, Drive, YouTube, and storage helpers
pages/api/      OAuth flow + scan/upload/auto-upload endpoints
pages/index.js  Dashboard UI
scripts/poller.js  Optional local alternative to an external cron service
```
