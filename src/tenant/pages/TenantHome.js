import React, { useMemo } from "react";

// ---- Utils ---------------------------------------------------------------
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

// ---- Component -----------------------------------------------------------
export default function TenantHome({ me = {}, rents = {}, ann = [], refresh = () => {} }) {
  const styles = {
    card: {
      background: "#fff",
      borderRadius: 14,
      boxShadow: "0 8px 30px rgba(16,24,40,.06)",
      padding: 16,
      marginBottom: 16,
    },
    row: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
      gap: 16,
    },
    ghostBtn: {
      padding: "8px 10px",
      border: "1px solid #e5e7eb",
      borderRadius: 10,
      background: "#fff",
      cursor: "pointer",
    },
    subtle: { color: "#6b7280" },
  };

  // ---- Resilient field reads --------------------------------------------
  const hostel = me?.hostel && typeof me.hostel === "object" ? me.hostel : {};
  const roomNo = me?.roomNo ?? hostel?.roomNo ?? "—";
  const bedNo = me?.bedNo ?? hostel?.bedNo ?? "—";

  const deposit = me?.deposit ?? me?.depositAmount ?? 0;
  // Prefer server-computed rents.due; fall back to me.due if not present
  const due = Number.isFinite(+rents?.due)
    ? +rents.due
    : Number.isFinite(+me?.due)
    ? +me.due
    : 0;

  const baseRent = me?.baseRent ?? hostel?.baseRent ?? 0;

  const lastPaid = useMemo(() => {
    const list = Array.isArray(rents?.rents) ? rents.rents : [];
    return list
      .filter((r) => r && r.date && toNumber(r.rentAmount) > 0)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  }, [rents]);

  // ✅ This hook MUST be inside the component:
  const currentMonthPaid = useMemo(() => {
    const list = Array.isArray(rents?.rents) ? rents.rents : [];
    if (!list.length) return false;
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    return list.some((r) => {
      if (!r?.date) return false;
      const d = new Date(r.date);
      return d.getMonth() === m && d.getFullYear() === y && toNumber(r.rentAmount) > 0;
    });
  }, [rents]);

  return (
    <>
      {/* Welcome Card */}
      <div style={styles.card}>
        <h5 style={{ margin: 0, marginBottom: 8 }}>Welcome, {me?.name || "Tenant"}</h5>
        <div style={styles.subtle}>
          Room {roomNo} / Bed {bedNo}
        </div>
      </div>

      {/* Info Cards */}
      <div style={styles.row}>
        <div style={styles.card}>
          <div>Deposit</div>
          <div style={{ fontWeight: 700 }}>
            <Money v={toNumber(deposit)} />
          </div>
        </div>

      
      

      

        <div style={styles.card}>
          <div>Base Rent</div>
          <div style={{ fontWeight: 700 }}>
            <Money v={toNumber(baseRent)} />
          </div>
        </div>

        <div style={styles.card}>
          <div>Last Payment</div>
          <div style={{ fontWeight: 700 }}>
            {lastPaid ? <Money v={toNumber(lastPaid.rentAmount)} /> : "—"}
          </div>
          {lastPaid?.date && (
            <div style={{ ...styles.subtle, fontSize: 12 }}>on {fmtDate(lastPaid.date)}</div>
          )}
        </div>

        {/* Optional: Current Month status */}
        <div style={styles.card}>
          <div>Current Month</div>
          <div style={{ fontWeight: 700, color: currentMonthPaid ? "#16a34a" : "#f59e0b" }}>
            {currentMonthPaid ? "Paid" : "Pending"}
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div style={styles.card}>
        <h5 style={{ margin: 0, marginBottom: 10 }}>Announcements</h5>

        {Array.isArray(ann) && ann.length ? (
          ann.slice(0, 3).map((a, idx) => {
            const key =
              a?._id || a?.id || (a?.title ? `${a.title}-${a?.createdAt || idx}` : `ann-${idx}`);
            return (
              <div key={key} style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 600 }}>{a?.title || "Untitled"}</div>
                {a?.createdAt && (
                  <div style={{ ...styles.subtle, fontSize: 12 }}>{fmtDate(a.createdAt)}</div>
                )}
                <div>{a?.body || ""}</div>
                <hr />
              </div>
            );
          })
        ) : (
          <div style={styles.subtle}>Nothing new</div>
        )}

        <button type="button" style={styles.ghostBtn} onClick={refresh}>
          Refresh
        </button>
      </div>
    </>
  );
}
