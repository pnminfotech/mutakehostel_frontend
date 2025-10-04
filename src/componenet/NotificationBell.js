// src/components/NotificationBell.js
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_ORIGIN || "http://localhost:8000";
const fmtINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const mmYY = (m, y) => (m && y ? `${String(m).padStart(2, "0")}/${y}` : "—");

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("pending"); // pending|approved|rejected|all
  const boxRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const fn = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const fetchList = async () => {
    const { data } = await axios.get(`${API}/api/notifications`, {
      params: { status, limit: 50 },
    });
    setItems(Array.isArray(data) ? data : []);
  };

  // Initial & status change
  useEffect(() => {
    fetchList().catch(() => {});
  }, [status]);

  // SSE stream (listen to named events the server sends)
  useEffect(() => {
    const ev = new EventSource(`${API}/api/notifications/stream`);

    const onCreated = () => fetchList().catch(() => {});
    const onUpdated = () => fetchList().catch(() => {});

    ev.addEventListener("created", onCreated);
    ev.addEventListener("updated", onUpdated);

    ev.onerror = () => {
      // server may close; UI still refreshes on status changes
    };
    return () => {
      ev.removeEventListener("created", onCreated);
      ev.removeEventListener("updated", onUpdated);
      ev.close();
    };
  }, []);

  const unreadCount = items.filter((n) => !n.read && n.status === "pending").length;

  // Actions (generic approve/reject endpoints; backend decides by type)
  const markRead = async (id) => {
    await axios.patch(`${API}/api/notifications/${id}/read`);
    fetchList();
  };
  const approvePayment = async (id) => {
    await axios.post(`${API}/api/notifications/${id}/approve`);
    fetchList();
  };
  const rejectPayment = async (id) => {
    await axios.post(`${API}/api/notifications/${id}/reject`);
    fetchList();
  };
  const approveLeave = async (id) => {
    await axios.post(`${API}/api/notifications/${id}/approve`);
    fetchList();
  };
  const rejectLeave = async (id) => {
    await axios.post(`${API}/api/notifications/${id}/reject`);
    fetchList();
  };

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      {/* Bell */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        style={{
          position: "relative",
          width: 42,
          height: 42,
          borderRadius: 999,
          border: "1px solid #e5e7eb",
          background: "#fff",
          display: "grid",
          placeItems: "center",
          boxShadow: "0 6px 18px rgba(0,0,0,.08)",
          cursor: "pointer",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .53-.21 1.04-.59 1.41L4 17h5m6 0v1a3 3 0 1 1-6 0v-1h6Z"
            stroke="#0f172a"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#ef4444",
              color: "#fff",
              borderRadius: 999,
              fontSize: 10,
              padding: "2px 6px",
              fontWeight: 800,
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Sheet */}
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "110%",
            width: 420,
            maxWidth: "92vw",
            background: "#0b1220",
            color: "#e5e7eb",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 20px 70px rgba(0,0,0,.45)",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              padding: 12,
              borderBottom: "1px solid rgba(255,255,255,.1)",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 14, flex: 1 }}>Notifications</div>
            {["pending", "approved", "rejected", "all"].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,.15)",
                  background: status === s ? "#111827" : "transparent",
                  color: "#e5e7eb",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={{ maxHeight: 480, overflowY: "auto" }}>
            {items.length === 0 ? (
              <div style={{ padding: 16, color: "#94a3b8", textAlign: "center" }}>
                No notifications.
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n._id}
                  style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,.06)" }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>
                      {n.tenantName || "Tenant"} • Room {n.roomNo || "—"} • Bed{" "}
                      {n.bedNo || "—"}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#94a3b8",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                    </div>
                  </div>

                  {n.type === "payment_report" ? (
                    <>
                      <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4 }}>
                        Payment: {fmtINR(n.amount)} for {mmYY(n.month, n.year)} • UTR:{" "}
                        {n.utr || "—"}
                      </div>
                      {n.note && (
                        <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 2 }}>
                          {n.note}
                        </div>
                      )}
                      {n.receiptUrl && (
                        <div style={{ marginTop: 6 }}>
                          <a
                            href={n.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: 12, color: "#93c5fd" }}
                          >
                            View receipt
                          </a>
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          marginTop: 8,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        {!n.read && (
                          <button
                            onClick={() => markRead(n._id)}
                            style={btn("transparent", "1px solid rgba(255,255,255,.25)")}
                          >
                            Mark read
                          </button>
                        )}
                        {n.status === "pending" && (
                          <>
                            <button
                              onClick={() => approvePayment(n._id)}
                              style={btn("#16a34a")}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectPayment(n._id)}
                              style={btn("#ef4444")}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {badge(n.status)}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4 }}>
                        Leave request for:{" "}
                        {n.leaveDate
                          ? new Date(n.leaveDate).toLocaleDateString("en-GB")
                          : "—"}
                      </div>
                      {n.note && (
                        <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 2 }}>
                          {n.note}
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          marginTop: 8,
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        {!n.read && (
                          <button
                            onClick={() => markRead(n._id)}
                            style={btn("transparent", "1px solid rgba(255,255,255,.25)")}
                          >
                            Mark read
                          </button>
                        )}
                        {n.status === "pending" && (
                          <>
                            <button
                              onClick={() => approveLeave(n._id)}
                              style={btn("#16a34a")}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectLeave(n._id)}
                              style={btn("#ef4444")}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {badge(n.status)}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function btn(bg, border = "none") {
  return {
    padding: "6px 10px",
    border,
    borderRadius: 10,
    background: bg,
    color: "#fff",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  };
}

function badge(status) {
  const map = {
    approved: { bg: "#16a34a", label: "approved" },
    rejected: { bg: "#ef4444", label: "rejected" },
    pending: { bg: "#f59e0b", label: "pending", color: "#111827" },
  };
  const s = map[status] || map.pending;
  return (
    <span
      style={{
        padding: "4px 8px",
        borderRadius: 999,
        background: s.bg,
        color: s.color || "#0b1220",
        fontSize: 12,
        fontWeight: 800,
      }}
    >
      {s.label}
    </span>
  );
}
