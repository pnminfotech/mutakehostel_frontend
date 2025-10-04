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
    padding: "20px",
    borderRadius: "10px",
    textAlign: "center",
    cursor: "pointer",
    background: "#f9fafb",
    marginBottom: "20px",
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
    if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
      return <FaFileImage color="#f97316" />;
    }
    if (["pdf"].includes(ext)) {
      return <FaFilePdf color="#ef4444" />;
    }
    return <FaFilePdf color="#888" />;
  };

  const filteredDocs = me?.documents?.filter((doc) =>
    doc.fileName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={card}>
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
        style={dropArea}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current.click()}
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
          <ul style={{ listStyle: "none", padding: 0 }}>
            {files.map((f, idx) => (
              <li key={idx} style={filePreview}>
                {getFileIcon(f.name)}
                <span>{f.name}</span>
              </li>
            ))}
          </ul>
          <button onClick={upload} style={btnPri} disabled={!files.length}>
            Upload
          </button>
        </div>
      )}

      {/* Document List */}
      <div>
        {filteredDocs?.length ? (
          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
            {filteredDocs.map((d, i) => (
              <li key={i} style={docItem}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {getFileIcon(d.fileName)}
                  <span>{d.fileName}</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
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
  padding: "8px 14px",
  border: 0,
  borderRadius: 10,
  background: "#4c7cff",
  color: "#fff",
  cursor: "pointer",
};

const inputBox = {
  padding: "8px",
  marginBottom: "10px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  width: "100%",
};

const filePreview = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "6px 10px",
  borderRadius: "8px",
  background: "#f1f5f9",
  marginBottom: "6px",
};

const docItem = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 14px",
  borderRadius: 10,
  background: "#f9fafb",
  marginBottom: 8,
};

const iconBtn = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  border: "none",
  background: "#eef2ff",
  padding: "6px 10px",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: "14px",
  textDecoration: "none",
  color: "#1d4ed8",
};
