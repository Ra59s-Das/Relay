import { getAuthenticatedClient } from "../../lib/googleClient";
import { listVideosInFolder } from "../../lib/drive";
import { getConfig } from "../../lib/config";
import { uploadOne } from "../../lib/uploadOne";

export const config = {
  api: {
    responseLimit: false,
  },
};

// Point an external scheduler (cron job, Vercel Cron, cron-job.org, etc.)
// at this endpoint every few minutes, e.g.:
//   GET https://your-domain.com/api/auto-upload?secret=YOUR_SECRET
export default async function handler(req, res) {
  const secret = req.query.secret || req.headers["x-scan-secret"];
  if (!process.env.SCAN_SECRET || secret !== process.env.SCAN_SECRET) {
    res.status(401).json({ error: "Missing or invalid secret" });
    return;
  }

  try {
    const { folderId } = getConfig();
    if (!folderId) {
      res.status(200).json({ message: "No Drive folder configured yet.", uploaded: [] });
      return;
    }

    const auth = getAuthenticatedClient();
    const files = await listVideosInFolder(auth, folderId);

    // Sequential on purpose: keeps memory/bandwidth predictable and
    // avoids hitting YouTube's daily quota in one burst.
    const results = [];
    for (const file of files) {
      const record = await uploadOne(file.id);
      results.push({ fileId: file.id, name: file.name, ...record });
    }

    res.status(200).json({ processed: results.length, results });
  } catch (err) {
    console.error("Auto-upload run failed:", err);
    res.status(500).json({ error: err.message });
  }
}
