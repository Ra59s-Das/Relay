import { getAuthenticatedClient } from "../../lib/googleClient";
import { listVideosInFolder } from "../../lib/drive";
import { getConfig } from "../../lib/config";
import { getTracker } from "../../lib/tracker";
import { getAllMetadata } from "../../lib/metadata";

export default async function handler(req, res) {
  try {
    const { folderId } = getConfig();
    if (!folderId) {
      res.status(200).json({ videos: [], message: "No Drive folder configured yet." });
      return;
    }

    const auth = getAuthenticatedClient();
    const files = await listVideosInFolder(auth, folderId);
    const tracker = getTracker();
    const metadata = getAllMetadata();

    const videos = files.map((f) => ({
      fileId: f.id,
      name: f.name,
      mimeType: f.mimeType,
      size: f.size,
      createdTime: f.createdTime,
      status: tracker[f.id]?.status || "pending",
      youtubeVideoId: tracker[f.id]?.youtubeVideoId || null,
      error: tracker[f.id]?.error || null,
      updatedAt: tracker[f.id]?.updatedAt || null,
      description: metadata[f.id]?.description || "",
      madeForKids: metadata[f.id]?.madeForKids || false,
    }));

    res.status(200).json({ videos });
  } catch (err) {
    console.error("Scan failed:", err);
    res.status(500).json({ error: err.message });
  }
}
