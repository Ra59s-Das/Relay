// Minimal JSON-file storage.
//
// This app is built for single-user, always-on hosting (your own VPS,
// a Docker container, a small always-on box, etc.) where the filesystem
// persists between requests. If you deploy to a serverless platform
// (Vercel, Netlify, etc.) the filesystem resets between invocations and
// tokens/config will NOT persist — swap readJSON/writeJSON below for a
// real store (Vercel KV, Redis, a database table) before deploying there.

import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readJSON(fileName, fallback) {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) return fallback;
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to read ${fileName}:`, err);
    return fallback;
  }
}

export function writeJSON(fileName, data) {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}
