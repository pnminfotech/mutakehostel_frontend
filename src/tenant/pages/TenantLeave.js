import React, { useEffect, useState } from "react";
import axios from "axios";
import { API, authHeader } from "../tenantApi";
import { FaCalendarAlt } from "react-icons/fa";

export default function TenantLeave() {
  const [me, setMe] = useState(null);
  const [leaveDate, setLeaveDate] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchTenant();
  }, []);

  const fetchTenant = async () => {
    try {
      const res = await axios.get(`${API}/tenant/me`, { headers: authHeader() });
      setMe(res.data);
    } catch {
      setErrorMsg("Failed to load tenant profile.");
    }
  };

  const submitLeave = async () => {
    if (!leaveDate) {
      setErrorMsg("Please select a leaving date.");
      return;
    }

    const selectedDate = new Date(leaveDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      setErrorMsg("Leave date must be in the future.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");

      const payload = {
        leaveDate,
        note: note.trim(),
      };

      await axios.post(`${API}/tenant/leave`, payload, { headers: authHeader() });

      setLeaveDate("");
      setNote("");
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
    <div style={container}>
      {/* Leave Request Card */}
      <div style={card}>
        <h3 style={header}>📅 Leave Request</h3>
        <div style={rulesBox}>
          <h4 style={rulesHeading}>Rules for Leaving:</h4>
          <ul style={rulesList}>
            {rules.map((rule, idx) => (
              <li key={idx}>{rule}</li>
            ))}
          </ul>
        </div>

        {/* Form */}
        <div style={{ display: "grid", gap: 12, maxWidth: 500 }}>
          <label style={label}>Leaving Date</label>
          <div style={{ position: "relative" }}>
            <input
              type="date"
              value={leaveDate}
              onChange={(e) => setLeaveDate(e.target.value)}
              style={inputBox}
            />
            <FaCalendarAlt style={{ position: "absolute", right: 10, top: 10, color: "#888" }} />
          </div>

          <label style={label}>Reason / Note</label>
          <textarea
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason for leaving..."
            style={textarea}
          />

          {errorMsg && <div style={errorStyle}>{errorMsg}</div>}

          <button onClick={submitLeave} disabled={submitting} style={btnPrimary}>
            {submitting ? "Submitting..." : "Submit Leave Request"}
          </button>
        </div>

        {/* Leave Status */}
        {me?.leaveRequestDate && (
          <div style={statusBox}>
            <h4>Leave Request Status:</h4>
            <p><b>Date:</b> {new Date(me.leaveRequestDate).toLocaleDateString()}</p>
            <p><b>Status:</b> <span style={statusStyle(me.leaveStatus)}>{me.leaveStatus || "Pending"}</span></p>
          </div>
        )}
      </div>
    </div>
  );
}

// Styles
const container = {
  display: "flex",
  justifyContent: "center",
  padding: "20px",
  background: "#f8f9fa",
  minHeight: "100vh",
};

const card = {
  background: "#fff",
  padding: 25,
  borderRadius: 12,
  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  width: "100%",
  maxWidth: 600,
};

const header = { marginBottom: 16, color: "#333" };

const rulesBox = { marginBottom: 20, textAlign: "left" };
const rulesHeading = { fontSize: 16, fontWeight: "bold", marginBottom: 8 };
const rulesList = { paddingLeft: "20px", color: "#555", fontSize: "14px" };

const label = { fontSize: 14, color: "#555" };
const inputBox = { padding: 10, border: "1px solid #ddd", borderRadius: 6, width: "100%" };
const textarea = { padding: 10, border: "1px solid #ddd", borderRadius: 6, width: "100%" };
const btnPrimary = { padding: "10px 16px", background: "#4c7cff", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" };
const errorStyle = { color: "#b91c1c", fontSize: 13 };

const statusBox = { marginTop: 20, padding: 15, background: "#f1f1f1", borderRadius: 8 };
const statusStyle = (status) => ({
  padding: "4px 8px",
  borderRadius: 4,
  color: "#fff",
  background: status === "approved" ? "#28a745" : status === "pending" ? "#ffc107" : "#dc3545",
});
