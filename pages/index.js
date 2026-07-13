import { useEffect, useState, useCallback } from "react";
import styles from "../styles/Dashboard.module.css";

const POLL_INTERVAL_MS = 15000;

function formatBytes(bytes) {
  if (!bytes) return "—";
  const mb = Number(bytes) / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

function StatusPill({ status }) {
  const map = {
    pending: [styles.pillPending, "Pending"],
    uploading: [styles.pillUploading, "Uploading"],
    uploaded: [styles.pillUploaded, "Uploaded"],
    failed: [styles.pillFailed, "Failed"],
  };
  const [cls, label] = map[status] || map.pending;
  return <span className={`${styles.pill} ${cls}`}>{label}</span>;
}

export default function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [folderLink, setFolderLink] = useState("");
  const [savedFolderId, setSavedFolderId] = useState("");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingFolder, setSavingFolder] = useState(false);
  const [uploadingAll, setUploadingAll] = useState(false);
  const [notice, setNotice] = useState(null);
  const [editingFileId, setEditingFileId] = useState(null);
  const [draft, setDraft] = useState({ description: "", madeForKids: false });
  const [savingEdit, setSavingEdit] = useState(false);

  const loadStatus = useCallback(async () => {
    const res = await fetch("/api/status");
    const data = await res.json();
    setConnected(data.connected);
    setSavedFolderId(data.config.folderId || "");
    if (data.config.folderLink) setFolderLink(data.config.folderLink);
  }, []);

  const loadVideos = useCallback(async () => {
    const res = await fetch("/api/scan");
    const data = await res.json();
    setVideos(data.videos || []);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) setNotice({ type: "success", text: "Google account connected." });
    if (params.get("authError")) setNotice({ type: "error", text: `Connection failed: ${params.get("authError")}` });

    (async () => {
      await loadStatus();
      setLoading(false);
    })();
  }, [loadStatus]);

  useEffect(() => {
    if (!connected || !savedFolderId) return;
    loadVideos();
    const interval = setInterval(loadVideos, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [connected, savedFolderId, loadVideos]);

  async function saveFolder(e) {
    e.preventDefault();
    setSavingFolder(true);
    setNotice(null);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderLink }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSavedFolderId(data.config.folderId);
      loadVideos();
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setSavingFolder(false);
    }
  }

  async function uploadFile(fileId) {
    setVideos((prev) =>
      prev.map((v) => (v.fileId === fileId ? { ...v, status: "uploading" } : v))
    );
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId }),
    });
    await res.json();
    loadVideos();
  }

  async function uploadAllPending() {
    setUploadingAll(true);
    const pending = videos.filter((v) => v.status === "pending" || v.status === "failed");
    for (const v of pending) {
      // eslint-disable-next-line no-await-in-loop
      await uploadFile(v.fileId);
    }
    setUploadingAll(false);
  }

  function openEdit(v) {
    setEditingFileId(v.fileId);
    setDraft({ description: v.description || "", madeForKids: Boolean(v.madeForKids) });
  }

  function closeEdit() {
    setEditingFileId(null);
  }

  async function saveEdit(fileId) {
    setSavingEdit(true);
    try {
      await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, ...draft }),
      });
      closeEdit();
      loadVideos();
    } finally {
      setSavingEdit(false);
    }
  }

  async function removeFromList(fileId) {
    if (!window.confirm("Remove this from the list? This does not delete anything on YouTube.")) return;
    await fetch("/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId, scope: "list" }),
    });
    loadVideos();
  }

  async function deleteFromYouTube(fileId) {
    if (!window.confirm("Permanently delete this video from YouTube? This cannot be undone.")) return;
    await fetch("/api/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId, scope: "youtube" }),
    });
    loadVideos();
  }

  const pendingCount = videos.filter((v) => v.status === "pending" || v.status === "failed").length;

  if (loading) return null;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            RE<span className={styles.titleAccent}>LAY</span>
          </h1>
          <span className={`${styles.connectionPill} ${connected ? styles.live : ""}`}>
            {connected ? "● CONNECTED" : "○ NOT CONNECTED"}
          </span>
        </div>
        <p className={styles.subtitle}>Moves video files from a Drive folder onto your YouTube channel.</p>

        {notice && (
          <p style={{ color: notice.type === "error" ? "var(--error)" : "var(--success)", fontSize: 13, marginTop: -24, marginBottom: 24 }}>
            {notice.text}
          </p>
        )}

        {!connected ? (
          <div className={`${styles.card} ${styles.connectPrompt}`}>
            <p>Connect a Google account to grant Drive read access and YouTube upload access.</p>
            <a href="/api/auth/login">
              <button className={styles.button}>Connect Google account</button>
            </a>
          </div>
        ) : (
          <>
            <div className={styles.card}>
              <label className={styles.label} htmlFor="folderLink">Watched Drive folder</label>
              <form className={styles.folderRow} onSubmit={saveFolder}>
                <input
                  id="folderLink"
                  className={styles.input}
                  placeholder="Paste a Google Drive folder link"
                  value={folderLink}
                  onChange={(e) => setFolderLink(e.target.value)}
                />
                <button className={styles.button} type="submit" disabled={savingFolder || !folderLink}>
                  {savingFolder ? "Saving…" : "Save"}
                </button>
              </form>
            </div>

            {savedFolderId && (
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Manifest ({videos.length})</h2>
                {pendingCount > 0 && (
                  <button className={styles.buttonSmall} onClick={uploadAllPending} disabled={uploadingAll}>
                    {uploadingAll ? "Uploading…" : `Upload all pending (${pendingCount})`}
                  </button>
                )}
              </div>
            )}

            {savedFolderId && (
              <div className={styles.manifest}>
                {videos.length === 0 ? (
                  <div className={styles.emptyState}>No video files found in this folder yet.</div>
                ) : (
                  videos.map((v, i) => {
                    const editable = v.status === "pending" || v.status === "failed";
                    const isEditing = editingFileId === v.fileId;
                    return (
                      <div key={v.fileId}>
                        <div className={styles.row}>
                          <span className={styles.index}>{String(i + 1).padStart(3, "0")}</span>
                          <div className={styles.fileInfo}>
                            <div className={styles.fileName}>{v.name}</div>
                            <div className={styles.fileMeta}>
                              {formatBytes(v.size)}
                              {v.youtubeVideoId && (
                                <>
                                  {" · "}
                                  <a
                                    className={styles.link}
                                    href={`https://youtube.com/watch?v=${v.youtubeVideoId}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    view on YouTube
                                  </a>
                                  {" · "}
                                  <a
                                    className={styles.link}
                                    href={`https://studio.youtube.com/video/${v.youtubeVideoId}/monetization`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    open in Studio
                                  </a>
                                </>
                              )}
                            </div>
                            {v.error && <div className={styles.errorText}>{v.error}</div>}
                          </div>
                          <StatusPill status={v.status} />
                          <div className={styles.actions}>
                            {editable && (
                              <button
                                className={styles.buttonGhost}
                                onClick={() => (isEditing ? closeEdit() : openEdit(v))}
                              >
                                {isEditing ? "Close" : "Edit"}
                              </button>
                            )}
                            {editable && (
                              <button className={styles.buttonSmall} onClick={() => uploadFile(v.fileId)}>
                                Upload
                              </button>
                            )}
                            {v.status === "uploaded" && (
                              <button
                                className={styles.buttonDanger}
                                onClick={() => deleteFromYouTube(v.fileId)}
                              >
                                Delete from YouTube
                              </button>
                            )}
                            <button className={styles.buttonGhost} onClick={() => removeFromList(v.fileId)}>
                              Remove
                            </button>
                          </div>
                        </div>

                        {isEditing && (
                          <div className={styles.editPanel}>
                            <label className={styles.label} htmlFor={`desc-${v.fileId}`}>
                              Description (used when this video is uploaded)
                            </label>
                            <textarea
                              id={`desc-${v.fileId}`}
                              className={styles.textarea}
                              rows={4}
                              value={draft.description}
                              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                              placeholder="What's this video about?"
                            />
                            <label className={styles.checkboxRow}>
                              <input
                                type="checkbox"
                                checked={draft.madeForKids}
                                onChange={(e) => setDraft((d) => ({ ...d, madeForKids: e.target.checked }))}
                              />
                              Made for kids
                            </label>
                            <div className={styles.editActions}>
                              <button
                                className={styles.buttonSmall}
                                onClick={() => saveEdit(v.fileId)}
                                disabled={savingEdit}
                              >
                                {savingEdit ? "Saving…" : "Save details"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            <p className={styles.footerNote}>
              This list refreshes automatically every 15 seconds. For fully hands-off uploads without
              opening this page, point a scheduler at <code>/api/auto-upload?secret=YOUR_SECRET</code> — see the README.
              Monetization can&apos;t be toggled through YouTube&apos;s API — use the &quot;open in Studio&quot; link on an
              uploaded video to turn it on yourself if your channel is eligible.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
