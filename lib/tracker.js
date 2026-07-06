import { readJSON, writeJSON } from "./store";

const TRACKER_FILE = "tracker.json";

// Shape: { [driveFileId]: { status, youtubeVideoId, title, updatedAt, error } }
export function getTracker() {
  return readJSON(TRACKER_FILE, {});
}

export function getRecord(fileId) {
  const tracker = getTracker();
  return tracker[fileId] || null;
}

export function isTerminal(fileId) {
  const record = getRecord(fileId);
  return record && (record.status === "uploaded" || record.status === "uploading");
}

export function setRecord(fileId, record) {
  const tracker = getTracker();
  tracker[fileId] = {
    ...tracker[fileId],
    ...record,
    updatedAt: new Date().toISOString(),
  };
  writeJSON(TRACKER_FILE, tracker);
  return tracker[fileId];
}

// Removes a file from tracking entirely. Does NOT touch YouTube —
// this only makes the app forget about the file (it reappears as
// "pending" next scan if it's still in the Drive folder).
export function deleteRecord(fileId) {
  const tracker = getTracker();
  delete tracker[fileId];
  writeJSON(TRACKER_FILE, tracker);
}
