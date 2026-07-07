import { isConnected } from "../../lib/googleClient";
import { getConfig } from "../../lib/config";

export default function handler(req, res) {
  res.status(200).json({
    connected: isConnected(),
    config: getConfig(),
  });
}
