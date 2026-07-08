import { uploadOne } from "../../lib/uploadOne";

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST" });
    return;
  }

  const { fileId } = req.body || {};
  if (!fileId) {
    res.status(400).json({ error: "fileId is required" });
    return;
  }

  const record = await uploadOne(fileId);
  res.status(200).json({ record });
}
