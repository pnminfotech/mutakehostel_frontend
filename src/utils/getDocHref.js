const API_ORIGIN = process.env.REACT_APP_API_ORIGIN || "http://localhost:5000";

export const getDocHref = (doc) => {
  if (!doc) return "#";

  // 1) absolute URL already provided by backend
  if (doc.url && /^https?:\/\//i.test(doc.url)) return doc.url;

  // 2) relative URL from backend (e.g. "/uploads/docs/abc.webp" or "/api/documents/123")
  if (doc.url) {
    const rel = doc.url.startsWith("/") ? doc.url : `/${doc.url}`;
    return `${API_ORIGIN}${rel}`;
  }

  // 3) DB id route handled by your Express /api/documents/:id endpoint
  if (doc.fileId) return `${API_ORIGIN}/api/documents/${doc.fileId}`;

  // 4) legacy fallback where only a file name was saved
  if (doc.fileName) return `${API_ORIGIN}/uploads/docs/${encodeURIComponent(doc.fileName)}`;

  return "#";
};
