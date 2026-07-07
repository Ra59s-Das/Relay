import { exchangeCodeForTokens } from "../../../lib/googleClient";

export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    res.redirect(`/?authError=${encodeURIComponent(error)}`);
    return;
  }

  try {
    await exchangeCodeForTokens(code);
    res.redirect("/?connected=1");
  } catch (err) {
    console.error("OAuth callback failed:", err);
    res.redirect(`/?authError=${encodeURIComponent(err.message)}`);
  }
}
