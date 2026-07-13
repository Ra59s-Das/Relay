import { google } from "googleapis";
import { getFileStream } from "./drive";

// Streams a Drive file straight into a YouTube resumable upload —
// the video is never fully buffered on disk or in memory.
export async function uploadDriveFileToYouTube(auth, { fileId, title, description, madeForKids }) {
  const youtube = google.youtube({ version: "v3", auth });
  const stream = await getFileStream(auth, fileId);

  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: title || "Untitled upload",
        description: description || `Uploaded automatically from Google Drive.`,
      },
      status: {
        privacyStatus: process.env.DEFAULT_PRIVACY_STATUS || "private",
        // YouTube requires every upload to declare this; false is the
        // sane default for typical channel content.
        selfDeclaredMadeForKids: Boolean(madeForKids),
      },
    },
    media: {
      body: stream,
    },
  });

  return res.data; // includes the new YouTube video id
}

export async function getVideoStatus(auth, youtubeVideoId) {
  const youtube = google.youtube({ version: "v3", auth });
  const res = await youtube.videos.list({
    part: ["status", "processingDetails"],
    id: [youtubeVideoId],
  });
  return res.data.items?.[0] || null;
}

// Permanently deletes a video from YouTube. Cannot be undone.
export async function deleteVideo(auth, youtubeVideoId) {
  const youtube = google.youtube({ version: "v3", auth });
  await youtube.videos.delete({ id: youtubeVideoId });
}
