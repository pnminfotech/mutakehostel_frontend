// src/tenant/pages/TenantLeave.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API, authHeader } from "../tenantApi";
import { FaCalendarAlt } from "react-icons/fa";

/* ---- Brand & Typography ---- */
const colors = {
  pageBg: "#f6f7fb",
  card: "#ffffff",
  text: "#0f172a",
  sub: "#64748b",
  line: "#e5e7eb",
  primary: "#6d5dfc",
  primarySoft: "rgba(109,93,252,.14)",
  success: "#16a34a",
  warning: "#f59e0b",
  danger:  "#ef4444",
};

function usePoppinsFont() {
  useEffect(() => {
    const id = "poppins-font-link";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

export default function TenantLeave() {
  usePoppinsFont();

  const [me, setMe] = useState(null);
  const [leaveDate, setLeaveDate] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  useEffect(() => { fetchTenant(); }, []);

  const fetchTenant = async () => {
    try {
      const res = await axios.get(`${API}/tenant/me`, { headers: authHeader() });
      setMe(res.data);
    } catch {
      setErrorMsg("Failed to load tenant profile.");
    }
  };

  const submitLeave = async () => {
    setOkMsg("");
    if (!leaveDate) {
      setErrorMsg("Please select a leaving date.");
      return;
    }

    const selectedDate = new Date(leaveDate);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      setErrorMsg("Leave date must be in the future.");
      return;
    }

    // Optional policy: at least 30 days notice
    const diffDays = Math.ceil((selectedDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 30) {
      setErrorMsg("Leave request must be submitted at least 30 days in advance.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      await axios.post(`${API}/tenant/leave`, { leaveDate, note: note.trim() }, { headers: authHeader() });

      setLeaveDate("");
      setNote("");
      setOkMsg("Leave request submitted ✓");
      fetchTenant();
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.response?.data?.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const rules = [
    "Select a leaving date and add a reason. The admin will approve or reject your request.",
    "Leave request must be submitted at least 30 days in advance.",
    "If a tenant leaves without proper notice, a penalty fee may apply.",
    "Leave request must be approved by admin before tenant can officially leave."
  ];

  return (
    <div style={sx.page}>
      <div style={sx.container}>
        <div style={sx.headerWrap}>
          <h3 style={sx.title}>Leave Request</h3>
          {me?.name && <span style={sx.pill}>👤 {me.name}</span>}
        </div>

        <div style={sx.card}>
          <div style={sx.section}>
            <h4 style={sx.sectionTitle}>Before you submit</h4>
            <ul style={sx.rulesList}>
              {rules.map((rule, idx) => (
                <li key={idx} style={sx.ruleItem}>{rule}</li>
              ))}
            </ul>
          </div>

          <div style={sx.formGrid}>
            <div>
              <label style={sx.label}>Leaving Date</label>
              <div style={{ position: "relative" }}>
                <input
                  type="date"
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  style={sx.input}
                  onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primarySoft}`)}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                />
                <FaCalendarAlt style={sx.calendarIcon} />
              </div>
              <small style={sx.hint}>Must be at least 30 days from today.</small>
            </div>

            <div>
              <label style={sx.label}>Reason / Note</label>
              <textarea
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reason for leaving..."
                style={sx.textarea}
                onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primarySoft}`)}
                onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
              />
            </div>

            {errorMsg && <div style={sx.alertError}>{errorMsg}</div>}
            {okMsg && <div style={sx.toast}>{okMsg}</div>}

            <button onClick={submitLeave} disabled={submitting} style={{ ...sx.btnPri, opacity: submitting ? 0.85 : 1 }}>
              {submitting ? "Submitting..." : "Submit Leave Request"}
            </button>
          </div>

          {/* Status */}
          {me?.leaveRequestDate && (
            <div style={sx.statusBox}>
              <h4 style={sx.sectionTitle}>Leave Request Status</h4>
              <div style={sx.statusGrid}>
                <div>
                  <div style={sx.subLabel}>Date</div>
                  <div style={sx.value}>{new Date(me.leaveRequestDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <div style={sx.subLabel}>Status</div>
                  <span style={statusChip(me.leaveStatus)}>{(me.leaveStatus || "Pending").toUpperCase()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Inline Styles (fix right-side space) ---- */
const sx = {
  page: {
    minHeight: "100vh",
    background: `
      radial-gradient(900px 420px at 100% -10%, rgba(109,93,252,.10), transparent 60%),
      radial-gradient(700px 380px at -10% 0%, rgba(34,197,94,.08), transparent 55%),
      ${colors.pageBg}
    `,
    padding: "24px 12px",
    color: colors.text,
    fontFamily: `Poppins, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`,
    overflowX: "hidden",            // ✅ prevents any horizontal scroll / right gap
    boxSizing: "border-box",
    width: "100%",
  },
  container: {
    maxWidth: 760,                  // ✅ tighter width so nothing overflows
    width: "100%",
    margin: "0 auto",
  },

  headerWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  title: { margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: 0.2 },
  pill: {
    marginLeft: "auto",
    fontSize: 12.5,
    fontWeight: 600,
    padding: "6px 10px",
    borderRadius: 999,
    background: colors.primarySoft,
    border: `1px solid ${colors.primary}`,
    color: colors.text,
    whiteSpace: "nowrap",
  },

  card: {
    background: colors.card,
    borderRadius: 14,
    border: `1px solid ${colors.line}`,
    boxShadow: "0 12px 28px rgba(2,6,23,.07)",
    padding: 16,
  },

  // Left-aligned section and rules
  section: {
    marginBottom: 10,
    textAlign: "left",              // ✅ left align
  },
  sectionTitle: { margin: "0 0 8px 0", fontSize: 15, fontWeight: 700, letterSpacing: 0.2 },

  rulesList: {
    margin: 0,
    paddingLeft: 18,
    color: colors.sub,
    fontSize: 14,
    lineHeight: 1.6,
    textAlign: "left",              // ✅ left align
  },
  ruleItem: { marginBottom: 6 },

  formGrid: {
    display: "grid",
    gap: 12,
    maxWidth: "100%",
  },

  label: { display: "block", fontSize: 12.5, color: colors.sub, marginBottom: 6, fontWeight: 600 },
  hint: { display: "block", fontSize: 12, color: colors.sub, marginTop: 6 },

  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 10,
    border: `1px solid ${colors.line}`,
    outline: "none",
    background: "#fff",
    fontSize: 14,
    transition: "box-shadow .15s ease, border-color .15s ease",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 10,
    border: `1px solid ${colors.line}`,
    outline: "none",
    background: "#fff",
    fontSize: 14,
    resize: "vertical",
    transition: "box-shadow .15s ease, border-color .15s ease",
    boxSizing: "border-box",
  },
  calendarIcon: { position: "absolute", right: 12, top: 12, color: colors.sub, pointerEvents: "none" },

  btnPri: {
    padding: "12px 16px",
    borderRadius: 10,
    border: 0,
    background: colors.primary,
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
    boxShadow: "0 10px 24px rgba(109,93,252,.28)",
    width: "fit-content",
  },

  alertError: {
    background: "#fff7f7",
    color: "#991b1b",
    border: `1px solid ${colors.danger}`,
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13,
  },
  toast: {
    background: "#0f172a",
    color: "#fff",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 13,
    width: "fit-content",
  },

  statusBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    background: "#f8fafc",
    border: `1px solid ${colors.line}`,
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 10,
  },
  subLabel: { fontSize: 12, color: colors.sub, marginBottom: 4 },
  value: { fontSize: 14, fontWeight: 600 },
};

const statusChip = (status) => {
  const s = (status || "pending").toLowerCase();
  const tone =
    s === "approved"
      ? { bg: "#ecfdf5", border: "#d1fae5", text: colors.success }
      : s === "rejected"
      ? { bg: "#fef2f2", border: "#fee2e2", text: colors.danger }
      : { bg: "#fffbeb", border: "#fef3c7", text: colors.warning };

  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    fontSize: 12.5,
    fontWeight: 700,
    borderRadius: 999,
    background: tone.bg,
    border: `1px solid ${tone.border}`,
    color: tone.text,
  };
};
