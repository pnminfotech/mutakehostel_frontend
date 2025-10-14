// src/components/NotificationBell.jsx
import React from "react";
import axios from "axios";

const fmtINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const mmYY = (m, y) => (m && y ? `${String(m).padStart(2,"0")}/${y}` : "—");

export default function NotificationBell({
  apiUrl = "http://localhost:8000/api/",
  onApproved,
}) {
  const [items, setItems] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");

  const fetchItems = React.useCallback(async () => {
    try {
      setLoading(true);
      setErr("");
      // ✅ pull NOTIFICATIONS (not /payments/reports)
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
      // ✅ send NOTIFICATION id here
      await axios.post(`${apiUrl}payments/approve/${notif._id}`);
      setItems((prev) => prev.filter((x) => x._id !== notif._id));
      // onApproved?.(notif);
       // 🔔 send a minimal, stable payload (safe to use for optimistic UI)
   const tenant = notif.tenantId || {};
   const pay = notif.paymentId || {};
   onApproved?.({
     type: "approved",
     tenantId: tenant._id,                 // string
     tenantName: tenant.name,
     roomNo: tenant.roomNo,
     bedNo: tenant.bedNo,
     amount: Number(pay.amount) || 0,      // number
     year: Number(pay.year),               // e.g. 2025
     month: Number(pay.month),             // 1..12
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

  const markAllRead = async () => {
    try {
      await axios.post(`${apiUrl}payments/notifications/read-all`, {
        status: "pending",
      });
      setItems([]);
    } catch (e) {
      console.error("markAllRead failed:", e);
      alert("Could not mark all read");
    }
  };

  return (
    <div className="dropdown">
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

      {open && (
        <div
          className="dropdown-menu dropdown-menu-end show p-2"
          style={{ minWidth: 360, maxWidth: 400, maxHeight: 420, overflowY: "auto" }}
        >
          <div className="d-flex align-items-center justify-content-between px-2 mb-2">
            <strong>Payment notifications</strong>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-outline-secondary" onClick={fetchItems}>
                Refresh
              </button>
              <button className="btn btn-sm btn-outline-dark" onClick={markAllRead}>
                Mark all read
              </button>
            </div>
          </div>

          {loading && <div className="text-muted px-2 py-1">Loading…</div>}
          {err && <div className="text-danger px-2 py-1">{err}</div>}

          {items.length === 0 && !loading ? (
            <div className="text-muted px-2 py-2">No new notifications</div>
          ) : (
            items.map((n) => {
              // n.tenantId and n.paymentId are populated in your router
              const tenant = n.tenantId || {};
              const pay = n.paymentId || {};
              return (
                <div key={n._id} className="border rounded p-2 mb-2 bg-white">
                  <div className="d-flex justify-content-between align-items-baseline">
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
                  {pay.utr && <div className="small">UTR: <span className="text-dark">{pay.utr}</span></div>}
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
    const tenant = n.tenantId || {};
    const pay = n.paymentId || {};
    const lines = [
      `Tenant: ${tenant.name || "—"}`,
      `Room/Bed: ${tenant.roomNo ?? "—"} / ${tenant.bedNo ?? "—"}`,
      `Reported at: ${n.createdAt ? new Date(n.createdAt).toLocaleString() : "—"}`,
      "",
      `Amount: ${fmtINR(pay.amount)}`,
      `For month: ${mmYY(pay.month, pay.year)}`,
      `UTR: ${pay.utr || "—"}`,
      `Note: ${pay.note || "—"}`,
      "",
      // `Status: ${n.status || "pending"}`,
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
