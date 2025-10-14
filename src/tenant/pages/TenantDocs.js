import React, { useState, useRef } from "react";
import axios from "axios";
import { API, authHeader } from "../tenantApi";
import { FaFilePdf, FaFileImage, FaDownload, FaEye } from "react-icons/fa";

export default function TenantDocs({ me, onChanged }) {
  const [files, setFiles] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef();

  const card = {
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 8px 30px rgba(16,24,40,.06)",
    padding: 20,
    marginBottom: 20,
  };

  const dropArea = {
    border: "2px dashed #4c7cff",
    padding: 20,
    borderRadius: 10,
    textAlign: "center",
    cursor: "pointer",
    background: "#f9fafb",
    marginBottom: 20,
  };

  const handleFiles = (selectedFiles) => {
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const upload = async () => {
    if (!files.length) return;
    const fd = new FormData();
    files.forEach((f) => fd.append("documents", f));

    await axios.post(`${API}/tenant/docs`, fd, {
      headers: { ...authHeader(), "Content-Type": "multipart/form-data" },
    });

    setFiles([]);
    onChanged && onChanged();
  };

  const getFileUrl = (doc) => {
    if (!doc?.url) return "#";
    if (doc.url.startsWith("http")) return doc.url;
    return `${API.replace("/api", "")}${doc.url}`;
  };

  const handleDownload = async (doc) => {
    try {
      setDownloading(true);
      const url = getFileUrl(doc);

      const response = await axios.get(url, {
        responseType: "blob",
        headers: authHeader(),
      });

      const blob = new Blob([response.data], { type: response.data.type });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = doc.fileName || "document";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Download failed", err);
      alert("Download failed. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <FaFilePdf color="#888" />;
    const ext = fileName.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
      return <FaFileImage color="#f97316" />;
    }
    if (["pdf"].includes(ext)) {
      return <FaFilePdf color="#ef4444" />;
    }
    return <FaFilePdf color="#888" />;
  };

  const filteredDocs = me?.documents?.filter((doc) =>
    (doc.fileName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={card} className="tdocs-container">
      {/* Responsive styles */}
      <style>{`
        .tdocs-container .row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .tdocs-container .files-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 8px;
        }
        .tdocs-container .doc-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: 10px;
          background: #f9fafb;
          margin-bottom: 8px;
          gap: 10px;
        }
        .tdocs-container .doc-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .tdocs-container .doc-left span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: inline-block;
          max-width: 52vw;
        }
        .tdocs-container .doc-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
        }

        /* Tablet: tighten text, allow wrapping */
        @media (max-width: 1024px) {
          .tdocs-container .doc-left span {
            max-width: 42vw;
          }
        }

        /* Phone: stack rows and make actions full width when needed */
        @media (max-width: 640px) {
          .tdocs-container .doc-item {
            flex-direction: column;
            align-items: stretch;
          }
          .tdocs-container .doc-left span {
            max-width: 100%;
          }
          .tdocs-container .doc-actions {
            justify-content: stretch;
          }
          .tdocs-container .doc-actions > * {
            flex: 1 1 auto;
            justify-content: center;
            text-align: center;
          }
          .tdocs-container .drop-area {
            padding: 16px;
          }
        }
      `}</style>

      <h5 style={{ marginBottom: 12 }}>📂 Tenant Documents</h5>

      {/* Search */}
      <input
        type="text"
        placeholder="Search documents..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={inputBox}
      />

      {/* Drag & Drop */}
      <div
        className="drop-area"
        style={dropArea}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        Drag & drop files here or click to select
      </div>

      <input
        type="file"
        multiple
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={(e) => handleFiles(Array.from(e.target.files || []))}
      />

      {/* Preview Before Upload */}
      {files.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <h6>Files to upload:</h6>
          <ul style={{ listStyle: "none", padding: 0 }} className="files-grid">
            {files.map((f, idx) => (
              <li key={idx} style={filePreview}>
                {getFileIcon(f.name)}
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {f.name}
                </span>
              </li>
            ))}
          </ul>
          <div className="row">
            <button onClick={upload} style={btnPri} disabled={!files.length}>
              Upload
            </button>
          </div>
        </div>
      )}

      {/* Document List */}
      <div>
        {filteredDocs?.length ? (
          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
            {filteredDocs.map((d, i) => (
              <li key={i} className="doc-item">
                <div className="doc-left">
                  {getFileIcon(d.fileName)}
                  <span title={d.fileName}>{d.fileName}</span>
                </div>
                <div className="doc-actions">
                  <a
                    href={getFileUrl(d)}
                    target="_blank"
                    rel="noreferrer"
                    style={iconBtn}
                  >
                    <FaEye /> View
                  </a>
                  <button onClick={() => handleDownload(d)} style={iconBtn} disabled={downloading}>
                    <FaDownload /> {downloading ? "..." : "Download"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ color: "#6b7280" }}>No documents uploaded</div>
        )}
      </div>
    </div>
  );
}

const btnPri = {
  padding: "10px 14px",
  border: 0,
  borderRadius: 10,
  background: "#4c7cff",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};

const inputBox = {
  padding: "10px",
  marginBottom: 10,
  borderRadius: 8,
  border: "1px solid #d1d5db",
  width: "100%",
};

const filePreview = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 8,
  background: "#f1f5f9",
  border: "1px solid #e5e7eb",
};

const iconBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "none",
  background: "#eef2ff",
  padding: "8px 12px",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 14,
  textDecoration: "none",
  color: "#1d4ed8",
  fontWeight: 600,
};
