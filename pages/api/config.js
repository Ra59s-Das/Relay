import { setConfig } from "../../lib/config";
import { extractFolderId } from "../../lib/drive";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST" });
    return;
  }

  const { folderLink } = req.body || {};
  const folderId = extractFolderId(folderLink);

  if (!folderId) {
    res.status(400).json({
      error:
        "Couldn't find a folder ID in that link. Paste the full Google Drive folder URL.",
    });
    return;
  }

  const config = setConfig({ folderLink, folderId });
  res.status(200).json({ config });
}
