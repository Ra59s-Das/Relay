import { getAuthUrl } from "../../../lib/googleClient";

export default function handler(req, res) {
  const url = getAuthUrl();
  res.redirect(url);
}
