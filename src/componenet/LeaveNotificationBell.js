// src/components/LeaveNotificationBell.jsx
import React from "react";
import axios from "axios";

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString() : "—");

export default function LeaveNotificationBell({
  apiUrl = "http://localhost:8000/api/",
  onDecision, // optional callback ({type: 'approved'|'rejected', tenantName, roomNo, bedNo, leaveDate, requestId})
}) {
  const [items, setItems] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [unreadCount, setUnreadCount] = React.useState(0);

  const fetchUnreadCount = React.useCallback(async () => {
    try {
      const { data } = await axios.get(`${apiUrl}admin/notifications/leave/unread-count`);
      setUnreadCount(Number(data?.count || 0));
    } catch {
      // ignore
    }
  }, [apiUrl]);

  const fetchItems = React.useCallback(async () => {
    try {
      setLoading(true);
      setErr("");
      const { data } = await axios.get(`${apiUrl}admin/notifications/leave`, {
        params: { limit: 50, unread: true }, // only unread
      });
      setItems(Array.isArray(data) ? data : []);
      // keep badge in sync
      setUnreadCount(Array.isArray(data) ? data.length : 0);
    } catch (e) {
      console.error("Leave notifications fetch failed:", e);
      setErr(e?.response?.data?.message || e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  React.useEffect(() => {
    fetchItems();
    fetchUnreadCount();
    const id = setInterval(() => {
      fetchItems();
      fetchUnreadCount();
    }, 20000);
    return () => clearInterval(id);
  }, [fetchItems, fetchUnreadCount]);

  const markAllRead = async () => {
    try {
      await axios.post(`${apiUrl}admin/notifications/leave/read-all`);
      setItems([]);
      setUnreadCount(0);
    } catch (e) {
      console.error("markAllRead failed:", e);
      alert("Could not mark all read");
    }
  };

  const approve = async (notif) => {
    // notif.requestId is populated (LeaveRequest)
    const req = notif.requestId || {};
    try {
      await axios.post(`${apiUrl}admin/leave/${req._id}/approve`);
      // mark this notification as read (optimistic)
      await axios.patch(`${apiUrl}admin/notifications/leave/${notif._id}/read`);
      setItems((prev) => prev.filter((x) => x._id !== notif._id));
      setUnreadCount((c) => Math.max(0, c - 1));

      onDecision?.({
        type: "approved",
        tenantId: (notif.tenant && notif.tenant._id) || notif.tenant,
        tenantName: notif.tenantName || notif?.tenant?.name || "Tenant",
        roomNo: notif?.tenant?.roomNo,
        bedNo: notif?.tenant?.bedNo,
        leaveDate: req.leaveDate,
        requestId: req._id,
      });
    } catch (e) {
      console.error("Approve failed:", e);
      alert(e?.response?.data?.message || e.message || "Approval failed");
    }
  };

  const reject = async (notif) => {
    const req = notif.requestId || {};
    const reason = window.prompt("Optional reason for rejection:", "");
    try {
      await axios.post(`${apiUrl}admin/leave/${req._id}/reject`, { reason });
      await axios.patch(`${apiUrl}admin/notifications/leave/${notif._id}/read`);
      setItems((prev) => prev.filter((x) => x._id !== notif._id));
      setUnreadCount((c) => Math.max(0, c - 1));

      onDecision?.({
        type: "rejected",
        tenantId: (notif.tenant && notif.tenant._id) || notif.tenant,
        tenantName: notif.tenantName || notif?.tenant?.name || "Tenant",
        roomNo: notif?.tenant?.roomNo,
        bedNo: notif?.tenant?.bedNo,
        leaveDate: req.leaveDate,
        requestId: req._id,
        reason,
      });
    } catch (e) {
      console.error("Reject failed:", e);
      alert(e?.response?.data?.message || e.message || "Reject failed");
    }
  };

  return (
    <div className="dropdown">
      <button
        className="btn btn-light position-relative"
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open ? "true" : "false"}
        title="Leave notifications"
      >
        🧳
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: "0.7rem" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="dropdown-menu dropdown-menu-end show p-2"
          style={{ minWidth: 360, maxWidth: 420, maxHeight: 420, overflowY: "auto" }}
        >
          <div className="d-flex align-items-center justify-content-between px-2 mb-2">
            <strong>Leave requests</strong>
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
            <div className="text-muted px-2 py-2">No new leave requests</div>
          ) : (
            items.map((n) => {
              const tenant = n.tenant || {};
              const req = n.requestId || {};
              return (
                <div key={n._id} className="border rounded p-2 mb-2 bg-white">
                  <div className="d-flex justify-content-between align-items-baseline">
                    <div className="fw-semibold">
                      {(n.tenantName || tenant.name || "Tenant")} • Room {(tenant.roomNo ?? "—")} • Bed {(tenant.bedNo ?? "—")}
                    </div>
                    <div className="small text-muted">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                    </div>
                  </div>

                  <div className="small text-muted mt-1">
                    Leave on: <span className="text-dark">{fmtDate(n.leaveDate || req.leaveDate)}</span>
                  </div>
                  {req.note && <div className="small text-muted">Note: {req.note}</div>}

                  <div className="d-flex gap-2 mt-2">
                    <button className="btn btn-sm btn-success" onClick={() => approve(n)}>
                      Approve
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => reject(n)}>
                      Reject
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary ms-auto"
                      onClick={() => {
                        const lines = [
                          `Tenant: ${n.tenantName || tenant.name || "—"}`,
                          `Room/Bed: ${tenant.roomNo ?? "—"} / ${tenant.bedNo ?? "—"}`,
                          `Requested at: ${fmtDate(n.createdAt)}`,
                          "",
                          `Leave date: ${fmtDate(n.leaveDate || req.leaveDate)}`,
                          `Status now: ${req.status || "pending"}`,
                          `Reason: ${req.note || "—"}`,
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
