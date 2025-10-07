// src/tenant/pages/TenantHome.js
import React, { useMemo } from "react";
import {
  FaRupeeSign,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowRight,
  FaReceipt,
  FaFileUpload,
  FaUserCheck,
  FaFileAlt,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

/* ----------------------------- Utils ---------------------------------- */
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatINR = (v = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(toNumber(v));

const Money = ({ v = 0 }) => <>{formatINR(v)}</>;

const fmtDate = (d) => {
  try {
    if (!d) return "";
    const t = new Date(d);
    if (isNaN(t.getTime())) return "";
    return t.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "";
  }
};

const monthName = (m) =>
  new Date(2000, m, 1).toLocaleString("en-IN", { month: "short" });

/* --------------------------- Component -------------------------------- */
export default function TenantHome({ me = {}, rents = {}, ann = [], refresh = () => {} }) {
  const navigate = useNavigate();

  const colors = {
    primary: "#2563eb",
    success: "#16a34a",
    danger: "#dc2626",
    warning: "#f59e0b",
    lightBg: "#f9fafb",
    textMuted: "#6b7280",
  };

  const styles = {
    card: {
      background: "#ffffff",
      borderRadius: 16,
      boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
      padding: 18,
      marginBottom: 16,
      transition: "all 0.2s ease-in-out",
    },
    row: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
      gap: 16,
    },
    ghostBtn: {
      padding: "8px 12px",
      border: `1px solid ${colors.textMuted}33`,
      borderRadius: 10,
      background: "#fff",
      cursor: "pointer",
      color: colors.textMuted,
    },
    subtle: { color: colors.textMuted },
    pill: {
      display: "inline-block",
      padding: "4px 10px",
      fontSize: 12,
      borderRadius: 999,
      background: colors.lightBg,
      color: "#374151",
      marginLeft: 8,
    },
    kpiNumber: { fontWeight: 700, fontSize: 22 },
    kpiLabel: { fontSize: 13, color: colors.textMuted },
    cta: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "12px 14px",
      border: `1px solid ${colors.textMuted}22`,
      borderRadius: 12,
      cursor: "pointer",
      background: "#f1f5f9",
      fontWeight: 500,
      color: "#1e293b",
      transition: "all 0.2s ease-in-out",
    },
    ctaHover: {
      background: "#e2e8f0",
    },
  };

  // ---- Safe reads -------------------------------------------------------
  const hostel = me?.hostel && typeof me.hostel === "object" ? me.hostel : {};
  const roomNo = me?.roomNo ?? hostel?.roomNo ?? "—";
  const bedNo = me?.bedNo ?? hostel?.bedNo ?? "—";
  const deposit = me?.deposit ?? me?.depositAmount ?? 0;
  const baseRent = toNumber(me?.baseRent ?? hostel?.baseRent ?? 0);

  const computedDue =
    Number.isFinite(+rents?.totalDue) ? +rents.totalDue :
    Number.isFinite(+rents?.due)      ? +rents.due      :
    Number.isFinite(+me?.due)         ? +me.due         : 0;

  const rentList = Array.isArray(rents?.rents) ? rents.rents : [];

  const lastPaid = useMemo(() => {
    return rentList
      .filter((r) => r && r.date && toNumber(r.rentAmount) > 0)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  }, [rentList]);

  const now = new Date();
  const currentMonthPaid = useMemo(() => {
    if (!rentList.length) return false;
    const m = now.getMonth();
    const y = now.getFullYear();
    return rentList.some((r) => {
      const d = r?.date ? new Date(r.date) : null;
      return d && d.getMonth() === m && d.getFullYear() === y && toNumber(r.rentAmount) > 0;
    });
  }, [rentList]);

  const monthsPaidThisYear = useMemo(() => {
    const y = now.getFullYear();
    const set = new Set(
      rentList
        .filter((r) => r?.date && toNumber(r.rentAmount) > 0)
        .map((r) => {
          const d = new Date(r.date);
          return d.getFullYear() === y ? d.getMonth() : null;
        })
        .filter((v) => v !== null)
    );
    return set.size;
  }, [rentList]);

  const nextDueLabel = useMemo(() => {
    if (currentMonthPaid) {
      const nm = (now.getMonth() + 1) % 12;
      return `${monthName(nm)} ${nm === 0 ? now.getFullYear() + 1 : now.getFullYear()}`;
    }
    return `${monthName(now.getMonth())} ${now.getFullYear()}`;
  }, [currentMonthPaid]);

  const lastFive = useMemo(() => {
    return [...rentList]
      .sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0))
      .slice(0, 5);
  }, [rentList]);

  /* ----------------------------- UI ----------------------------------- */
  return (
    <>
      {/* Header / Welcome */}
      <div
        style={{
          ...styles.card,
          background: "linear-gradient(135deg,#e0f2fe,#f8fafc)",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <h5 style={{ margin: 0, color: "#1e293b" }}>Welcome, {me?.name || "Tenant"}</h5>
            <div style={styles.subtle}>
              Room {roomNo} / Bed {bedNo}
              {me?.status && <span style={styles.pill}>{String(me.status).toUpperCase()}</span>}
            </div>
          </div>
          <div style={{ fontSize: 12, color: colors.textMuted }}>
            <button
              style={{
                ...styles.ghostBtn,
                borderColor: colors.primary,
                color: colors.primary,
              }}
              onClick={refresh}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: 10,
          }}
        >
          {[
            { icon: <FaReceipt />, label: "View Payments", path: "/tenant/payments" },
            { icon: <FaRupeeSign />, label: "Rent Details", path: "/tenant/rent" },
            { icon: <FaFileUpload />, label: "Upload Docs", path: "/tenant/documents" },
            { icon: <FaUserCheck />, label: "eKYC", path: "/tenant/ekyc" },
            { icon: <FaFileAlt />, label: "Leave Request", path: "/tenant/leave" },
          ].map((a, i) => (
            <div
              key={i}
              style={styles.cta}
              onClick={() => navigate(a.path)}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
            >
              {a.icon} {a.label}
              <FaArrowRight style={{ marginLeft: "auto", opacity: 0.6 }} />
            </div>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div style={styles.row}>
        {/* Due */}
        <div
          style={{
            ...styles.card,
            borderLeft: `6px solid ${computedDue > 0 ? colors.danger : colors.success}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {computedDue > 0 ? (
              <FaExclamationTriangle color={colors.danger} />
            ) : (
              <FaCheckCircle color={colors.success} />
            )}
            <div style={{ fontWeight: 600 }}>Outstanding Due</div>
          </div>
          <div
            style={{
              ...styles.kpiNumber,
              color: computedDue > 0 ? colors.danger : colors.success,
            }}
          >
            <Money v={computedDue} />
          </div>
          <div style={styles.kpiLabel}>Next due: {nextDueLabel}</div>
          <div className="mt-2">
            <Link to="/tenant/payments" className="btn btn-sm btn-primary">
              Pay / Report Payment
            </Link>
          </div>
        </div>

        {/* Deposit */}
        <div style={styles.card}>
          <div style={{ fontWeight: 600 }}>Security Deposit</div>
          <div style={styles.kpiNumber}><Money v={deposit} /></div>
          <div style={styles.kpiLabel}>As per records</div>
        </div>

        {/* Base Rent */}
        <div style={styles.card}>
          <div style={{ fontWeight: 600 }}>Base Rent</div>
          <div style={styles.kpiNumber}><Money v={baseRent} /></div>
          <div style={styles.kpiLabel}>Monthly</div>
        </div>

        {/* Current Month */}
        <div style={styles.card}>
          <div style={{ fontWeight: 600 }}>Current Month</div>
          <div
            style={{
              ...styles.kpiNumber,
              color: currentMonthPaid ? colors.success : colors.warning,
            }}
          >
            {currentMonthPaid ? "Paid" : "Pending"}
          </div>
          <div style={styles.kpiLabel}>
            {currentMonthPaid
              ? "Thanks for paying on time!"
              : "Please clear dues soon"}
          </div>
        </div>

        {/* Last Payment */}
        <div style={styles.card}>
          <div style={{ fontWeight: 600 }}>Last Payment</div>
          <div style={styles.kpiNumber}>
            {lastPaid ? <Money v={toNumber(lastPaid.rentAmount)} /> : "—"}
          </div>
          <div style={styles.kpiLabel}>
            {lastPaid?.date ? `on ${fmtDate(lastPaid.date)}` : "No payments recorded"}
          </div>
        </div>

        {/* Year Progress */}
        <div style={styles.card}>
          <div style={{ fontWeight: 600 }}>
            {new Date().getFullYear()} Rent Progress
          </div>
          <div style={styles.kpiNumber}>
            {monthsPaidThisYear} / {now.getMonth() + 1} months
          </div>
          <div style={styles.kpiLabel}>Paid this year</div>
          <div className="progress mt-2" aria-label="Yearly rent progress">
            <div
              className="progress-bar"
              role="progressbar"
              style={{
                width: `${Math.min(
                  100,
                  ((monthsPaidThisYear / (now.getMonth() + 1 || 1)) * 100)
                ).toFixed(0)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Payments */}
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h5 style={{ margin: 0 }}>Recent Payments</h5>
          <Link to="/tenant/payments" className="btn btn-sm btn-outline-secondary">
            View all
          </Link>
        </div>

        {lastFive.length ? (
          <div className="table-responsive mt-2">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {lastFive.map((r, i) => (
                  <tr key={r?._id || r?.id || i}>
                    <td>{fmtDate(r?.date)}</td>
                    <td><Money v={toNumber(r?.rentAmount)} /></td>
                    <td className="text-muted small">{r?.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ ...styles.subtle, marginTop: 6 }}>No payments found yet.</div>
        )}
      </div>

      {/* Announcements */}
      <div style={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h5 style={{ margin: 0 }}>Announcements</h5>
          <Link to="/tenant/announcements" className="btn btn-sm btn-outline-secondary">
            View all
          </Link>
        </div>

        {Array.isArray(ann) && ann.length ? (
          <div className="mt-2">
            {ann.slice(0, 3).map((a, idx) => (
              <div key={a?._id || idx} style={{ padding: "8px 0" }}>
                <div style={{ fontWeight: 600, color: "#1e293b" }}>{a?.title || "Untitled"}</div>
                <div style={{ ...styles.subtle, fontSize: 12 }}>
                  {a?.createdAt ? fmtDate(a.createdAt) : ""}
                </div>
                <div className="mt-1">{a?.body || ""}</div>
                {idx < Math.min(ann.length, 3) - 1 && <hr className="my-2" />}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ ...styles.subtle, marginTop: 6 }}>Nothing new right now.</div>
        )}
      </div>
    </>
  );
}
