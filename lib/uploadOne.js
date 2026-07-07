import { getAuthenticatedClient } from "./googleClient";
import { getFileMetadata } from "./drive";
import { uploadDriveFileToYouTube } from "./youtube";
import { getRecord, setRecord, isTerminal } from "./tracker";
import { getMetadata } from "./metadata";

// Uploads a single Drive file to YouTube and records the outcome.
// Safe to call repeatedly: skips files already uploaded or in progress,
// and retries files that previously failed.
export async function uploadOne(fileId) {
  if (isTerminal(fileId)) {
    return getRecord(fileId);
  }

  const auth = getAuthenticatedClient();
  setRecord(fileId, { status: "uploading", error: null });

  try {
    const meta = await getFileMetadata(auth, fileId);
    const custom = getMetadata(fileId);
    const result = await uploadDriveFileToYouTube(auth, {
      fileId,
      title: meta.name,
      description: custom.description,
      madeForKids: custom.madeForKids,
    });

    return setRecord(fileId, {
      status: "uploaded",
      youtubeVideoId: result.id,
      title: meta.name,
      error: null,
    });
  } catch (err) {
    console.error(`Upload failed for ${fileId}:`, err);
    return setRecord(fileId, {
      status: "failed",
      error: err.message,
    });
  }
}
