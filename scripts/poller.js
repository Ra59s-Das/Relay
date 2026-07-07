// Optional: hits your own running app's /api/auto-upload endpoint on a
// schedule, so you don't need an external cron service.
//
// Usage:
//   APP_URL=http://localhost:3000 SCAN_SECRET=change-me node scripts/poller.js
//
// Run this alongside `npm start` (e.g. in a second pm2 process, tmux
// pane, or systemd unit) on a VPS/always-on machine.

const APP_URL = process.env.APP_URL || "http://localhost:3000";
const SECRET = process.env.SCAN_SECRET;
const INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 5 * 60 * 1000); // 5 min default

if (!SECRET) {
  console.error("Set SCAN_SECRET (same value as in your .env) before running the poller.");
  process.exit(1);
}

async function runOnce() {
  const url = `${APP_URL}/api/auto-upload?secret=${encodeURIComponent(SECRET)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const time = new Date().toISOString();
    if (!res.ok) {
      console.error(`[${time}] auto-upload failed:`, data.error || res.statusText);
      return;
    }
    console.log(`[${time}] processed ${data.processed || 0} file(s).`);
  } catch (err) {
    console.error("Poll request failed:", err.message);
  }
}

console.log(`Polling ${APP_URL}/api/auto-upload every ${INTERVAL_MS / 1000}s...`);
runOnce();
setInterval(runOnce, INTERVAL_MS);
