import { readJSON, writeJSON } from "./store";

const CONFIG_FILE = "config.json";

export function getConfig() {
  return readJSON(CONFIG_FILE, { folderLink: "", folderId: "" });
}

export function setConfig(newConfig) {
  const current = getConfig();
  const merged = { ...current, ...newConfig };
  writeJSON(CONFIG_FILE, merged);
  return merged;
}
