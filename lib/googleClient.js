import { google } from "googleapis";
import { readJSON, writeJSON } from "./store";

const TOKENS_FILE = "tokens.json";

// Scopes needed:
// - drive.readonly: list/read video files from your Drive folder
// - youtube.upload: upload videos to your channel
// - youtube.readonly: check upload/processing status
export const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
];

function newOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl() {
  const client = newOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline", // required to get a refresh_token
    prompt: "consent", // forces refresh_token on every re-auth
    scope: SCOPES,
  });
}

export async function exchangeCodeForTokens(code) {
  const client = newOAuthClient();
  const { tokens } = await client.getToken(code);
  // Merge instead of overwrite so we don't lose a previously-issued
  // refresh_token (Google only sends it on the first consent).
  const existing = readJSON(TOKENS_FILE, {});
  const merged = { ...existing, ...tokens };
  writeJSON(TOKENS_FILE, merged);
  return merged;
}

export function isConnected() {
  const tokens = readJSON(TOKENS_FILE, null);
  return Boolean(tokens && tokens.refresh_token);
}

export function getAuthenticatedClient() {
  const tokens = readJSON(TOKENS_FILE, null);
  if (!tokens || !tokens.refresh_token) {
    throw new Error("Not connected to Google yet. Visit /api/auth/login first.");
  }
  const client = newOAuthClient();
  client.setCredentials(tokens);
  client.on("tokens", (newTokens) => {
    // googleapis auto-refreshes the access_token; persist any updates.
    const merged = { ...tokens, ...newTokens };
    writeJSON(TOKENS_FILE, merged);
  });
  return client;
}

export function disconnect() {
  writeJSON(TOKENS_FILE, {});
}
