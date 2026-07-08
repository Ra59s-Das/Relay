import { getAuthenticatedClient } from "../../lib/googleClient";
import { deleteVideo } from "../../lib/youtube";
import { getRecord, deleteRecord } from "../../lib/tracker";

// scope "list": forget about this file locally, don't touch YouTube.
// scope "youtube": permanently delete the video from YouTube, then forget it locally.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST" });
    return;
  }

  const { fileId, scope } = req.body || {};
  if (!fileId || !["list", "youtube"].includes(scope)) {
    res.status(400).json({ error: "fileId and scope ('list' or 'youtube') are required" });
    return;
  }

  try {
    if (scope === "youtube") {
      const record = getRecord(fileId);
      if (record?.youtubeVideoId) {
        const auth = getAuthenticatedClient();
        await deleteVideo(auth, record.youtubeVideoId);
      }
    }
    deleteRecord(fileId);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Delete failed:", err);
    res.status(500).json({ error: err.message });
  }
}