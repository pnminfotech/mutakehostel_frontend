// src/components/NotificationBell.jsx
import React from "react";
import axios from "axios";

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const mmYY = (m, y) => (m && y ? `${String(m).padStart(2, "0")}/${y}` : "—");

export default function NotificationBell({
  apiUrl = "https://mutakehostel-backend.onrender.com/api/",
  onApproved,
}) {
  const [items, setItems] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [isMobile, setIsMobile] = React.useState(() =>
    window.matchMedia("(max-width: 576px)").matches
  );

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 576px)");
    const fn = () => setIsMobile(mq.matches);
    mq.addEventListener?.("change", fn);
    fn();
    return () => mq.removeEventListener?.("change", fn);
  }, []);

  const fetchItems = React.useCallback(async () => {
    try {
      setLoading(true);
      setErr("");
      const { data } = await axios.get(`${apiUrl}payments/notifications`, {
        params: { status: "pending", limit: 50 },
      });
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Notifications fetch failed:", e);
      setErr(e?.response?.data?.message || e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  React.useEffect(() => {
    fetchItems();
    const id = setInterval(fetchItems, 20000);
    return () => clearInterval(id);
  }, [fetchItems]);

  const approveNotif = async (notif) => {
    try {
      await axios.post(`${apiUrl}payments/approve/${notif._id}`);
      setItems((prev) => prev.filter((x) => x._id !== notif._id));
      const tenant = notif.tenantId || {};
      const pay = notif.paymentId || {};
      onApproved?.({
        type: "approved",
        tenantId: tenant._id,
        tenantName: tenant.name,
        roomNo: tenant.roomNo,
        bedNo: tenant.bedNo,
        amount: Number(pay.amount) || 0,
        year: Number(pay.year),
        month: Number(pay.month),
        utr: pay.utr || "",
        note: pay.note || "",
        paymentMode: pay.mode || pay.paymentMode || "Online",
        paymentDate: pay.paymentDate || notif.createdAt || new Date().toISOString(),
      });
    } catch (e) {
      console.error("Approve failed:", e);
      alert(e?.response?.data?.message || e.message || "Approval failed");
    }
  };

  const rejectNotif = async (notif) => {
    try {
      await axios.post(`${apiUrl}payments/reject/${notif._id}`);
      setItems((prev) => prev.filter((x) => x._id !== notif._id));
    } catch (e) {
      console.error("Reject failed:", e);
      alert(e?.response?.data?.message || e.message || "Reject failed");
    }
  };

  // Styles
  const panelStyle = isMobile
    ? {
        position: "fixed",
        left: 8,
        right: 8,
        top: 64,
        zIndex: 1055,
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 20px 60px rgba(2,6,23,.25)",
        padding: 8,
        maxHeight: "65vh",
        overflowY: "auto",
      }
    : {
        minWidth: 360,
        maxWidth: 400,
        maxHeight: 420,
        overflowY: "auto",
      };

  const overlayStyle = isMobile
    ? {
        position: "fixed",
        inset: 0,
        zIndex: 1050,
        background: "rgba(2,6,23,.45)",
        backdropFilter: "blur(1px)",
      }
    : null;

  const wrapText = { wordBreak: "break-word", overflowWrap: "anywhere" };

  const IconBtn = ({ onClick, label, title, children }) => (
    <button
      className="btn btn-sm btn-outline-secondary"
      onClick={onClick}
      aria-label={label}
      title={title || label}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, padding: 0 }}
    >
      {children}
    </button>
  );

  return (
    <div className="dropdown" style={{ position: "relative" }}>
      <button
        className="btn btn-light position-relative"
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open ? "true" : "false"}
        title="Notifications"
      >
        🔔
        {items.length > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: "0.7rem" }}
          >
            {items.length > 99 ? "99+" : items.length}
          </span>
        )}
      </button>

      {open && isMobile && <div style={overlayStyle} onClick={() => setOpen(false)} />}

      {open && (
        <div
          className={isMobile ? "p-2" : "dropdown-menu dropdown-menu-end show p-2"}
          style={panelStyle}
        >
          <div className="d-flex align-items-center justify-content-between px-2 mb-2" style={wrapText}>
            <strong>Payment notifications</strong>
            <div className="d-flex gap-2">
              {/* Refresh (icon) */}
              <IconBtn label="Refresh" onClick={fetchItems}>
                {/* circular arrow */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M20 12a8 8 0 1 1-2.343-5.657L20 8M20 8V4m0 4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </IconBtn>

              {/* Close (icon) */}
              <IconBtn label="Close" onClick={() => setOpen(false)}>
                {/* X icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </IconBtn>
            </div>
          </div>

          {loading && <div className="text-muted px-2 py-1">Loading…</div>}
          {err && <div className="text-danger px-2 py-1" style={wrapText}>{err}</div>}

          {items.length === 0 && !loading ? (
            <div className="text-muted px-2 py-2">No new notifications</div>
          ) : (
            items.map((n) => {
              const tenant = n.tenantId || {};
              const pay = n.paymentId || {};
              return (
                <div key={n._id} className="border rounded p-2 mb-2 bg-white" style={wrapText}>
                  <div className="d-flex justify-content-between align-items-baseline" style={wrapText}>
                    <div className="fw-semibold">
                      {(tenant.name || "Tenant")} • Room {(tenant.roomNo ?? "—")} • Bed {(tenant.bedNo ?? "—")}
                    </div>
                    <div className="small text-muted">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                    </div>
                  </div>

                  <div className="small text-muted mt-1">
                    Payment: {fmtINR(pay.amount)} for {mmYY(pay.month, pay.year)}
                  </div>
                  {pay.utr && (
                    <div className="small">UTR: <span className="text-dark">{pay.utr}</span></div>
                  )}
                  {pay.note && <div className="small text-muted">Note: {pay.note}</div>}

                  <div className="d-flex gap-2 mt-2">
                    <button className="btn btn-sm btn-success" onClick={() => approveNotif(n)}>
                      Approve
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => rejectNotif(n)}>
                      Reject
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary ms-auto"
                      onClick={() => {
                        const lines = [
                          `Tenant: ${tenant.name || "—"}`,
                          `Room/Bed: ${tenant.roomNo ?? "—"} / ${tenant.bedNo ?? "—"}`,
                          `Reported at: ${n.createdAt ? new Date(n.createdAt).toLocaleString() : "—"}`,
                          "",
                          `Amount: ${fmtINR(pay.amount)}`,
                          `For month: ${mmYY(pay.month, pay.year)}`,
                          `UTR: ${pay.utr || "—"}`,
                          `Note: ${pay.note || "—"}`,
                        ];
                        window.alert(lines.join("\n"));
                      }}
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
