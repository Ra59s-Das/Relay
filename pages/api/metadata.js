import { setMetadata } from "../../lib/metadata";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST" });
    return;
  }

  const { fileId, description, madeForKids } = req.body || {};
  if (!fileId) {
    res.status(400).json({ error: "fileId is required" });
    return;
  }

  const record = setMetadata(fileId, { description, madeForKids: Boolean(madeForKids) });
  res.status(200).json({ record });
}