import { google } from "googleapis";

// Accepts a full Drive folder URL or a bare folder ID and returns the ID.
// Handles the common URL shapes:
//   https://drive.google.com/drive/folders/<ID>
//   https://drive.google.com/drive/folders/<ID>?usp=sharing
//   https://drive.google.com/drive/u/0/folders/<ID>
export function extractFolderId(linkOrId) {
  if (!linkOrId) return null;
  const trimmed = linkOrId.trim();
  const match = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // Fall back to treating the input as a bare ID if it looks like one.
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) return trimmed;
  return null;
}

const VIDEO_MIME_PREFIX = "video/";

// Lists video files directly inside the given folder (not recursive).
export async function listVideosInFolder(auth, folderId) {
  const drive = google.drive({ version: "v3", auth });
  const files = [];
  let pageToken;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains '${VIDEO_MIME_PREFIX}' and trashed = false`,
      fields:
        "nextPageToken, files(id, name, mimeType, size, createdTime, videoMediaMetadata)",
      pageSize: 100,
      pageToken,
    });
    files.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  return files;
}

export async function getFileMetadata(auth, fileId) {
  const drive = google.drive({ version: "v3", auth });
  const res = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, size",
  });
  return res.data;
}

// Returns a readable stream of the raw file bytes.
export async function getFileStream(auth, fileId) {
  const drive = google.drive({ version: "v3", auth });
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );
  return res.data;
}
