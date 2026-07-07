import { readJSON, writeJSON } from "./store";

const METADATA_FILE = "metadata.json";

// Shape: { [driveFileId]: { description, madeForKids } }
// Lets you set a custom description (and the required "made for kids"
// flag) before a file is uploaded. Read at upload time by uploadOne.js.
export function getAllMetadata() {
  return readJSON(METADATA_FILE, {});
}

export function getMetadata(fileId) {
  const all = getAllMetadata();
  return all[fileId] || { description: "", madeForKids: false };
}

export function setMetadata(fileId, fields) {
  const all = getAllMetadata();
  all[fileId] = { ...all[fileId], ...fields };
  writeJSON(METADATA_FILE, all);
  return all[fileId];
}