// src/tenant/components/TenantShell.js
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken } from "../tenantApi";
import { API } from "../tenantApi";

// Helper: get full URL for images if backend returns a relative path
function fullImg(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  // If backend gave '/uploads/..', prefix with API origin
  return `${API}${url}`;
}

export default function TenantShell({ me, onLogout }) {
  const nav = useNavigate();
  const [showAvatar, setShowAvatar] = useState(false);

  const linkStyle = (isActive) => ({
    display: "block",
    padding: "10px 12px",
    borderRadius: 10,
    textDecoration: "none",
    color: isActive ? "#0f172a" : "#cbd5e1",
    background: isActive ? "#e2e8f0" : "transparent",
    marginBottom: 6,
    fontWeight: 600,
    transition: "all .15s ease",
  });

  const sidebar = {
    width: 260,
    background: "#0f172a",
    color: "#fff",
    minHeight: "100vh",
    padding: 16,
    position: "sticky",
    top: 0,
    boxShadow: "0 10px 30px rgba(2,6,23,.25)",
  };

  const avatarSrc =
    fullImg(me?.avatarUrl) ||
    "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(me?.name || "Tenant");

  const ekycStatus = me?.ekyc?.status; // "verified" | "pending" | "not_started" etc.
  const ekycPillColor =
    ekycStatus === "verified" ? "#10b981" : ekycStatus === "pending" ? "#f59e0b" : "#94a3b8";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      {/* Sidebar */}
      <aside style={sidebar}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 14, letterSpacing: 0.5 }}>
          Tenant Portal
        </div>

        {/* Profile tile */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            background: "rgba(255,255,255,.06)",
            padding: 10,
            borderRadius: 12,
            marginBottom: 12,
            cursor: "pointer",
          }}
          onClick={() => setShowAvatar(true)}
          title="Click to preview avatar"
        >
          <img
            src={avatarSrc}
            alt="avatar"
            onError={(e) => {
              e.currentTarget.src =
                "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(me?.name || "Tenant");
            }}
            style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid rgba(255,255,255,.15)",
              background: "#0b1220",
              flex: "0 0 auto",
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                nav("/tenant/profile");
              }}
              style={{
                color: "#fff",
                fontWeight: 700,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.1,
              }}
            >
              {me?.name || "Tenant"}
            </div>
            <div style={{ color: "#cbd5e1", fontSize: 12 }}>
              {me?.roomNo ? `Room ${me.roomNo}` : ""} {me?.bedNo ? `/ Bed ${me.bedNo}` : ""}
            </div>
            {/* eKYC pill (optional) */}
            {ekycStatus && (
              <span
                style={{
                  display: "inline-block",
                  marginTop: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: 999,
                  background: ekycPillColor,
                  color: "#0b1220",
                  textTransform: "capitalize",
                }}
              >
                {ekycStatus}
              </span>
            )}
          </div>
        </div>

        <nav>
          <NavLink to="/tenant/home"       style={({ isActive }) => linkStyle(isActive)}>Dashboard</NavLink>
          <NavLink to="/tenant/profile"    style={({ isActive }) => linkStyle(isActive)}>Profile</NavLink>
          <NavLink to="/tenant/documents"  style={({ isActive }) => linkStyle(isActive)}>Documents</NavLink>
          {/* ✅ Added Bills & Payments */}
          <NavLink to="/tenant/payments"   style={({ isActive }) => linkStyle(isActive)}>Bills & Payments</NavLink>
          {/* <NavLink to="/tenant/ekyc"       style={({ isActive }) => linkStyle(isActive)}>eKYC</NavLink> */}
          {/* ✅ NEW: Police Verification link */}
      <NavLink to="/tenant/police-verification" style={({ isActive }) => linkStyle(isActive)}>
  Police Verification
</NavLink>

          <NavLink to="/tenant/leave"      style={({ isActive }) => linkStyle(isActive)}>Leave Request</NavLink>
          <NavLink to="/tenant/support"    style={({ isActive }) => linkStyle(isActive)}>Support</NavLink>
        </nav>

        <button
          onClick={() => {
            clearToken();
            onLogout?.(); // in case it’s passed
            nav("/", { replace: true });
          }}
          style={{
            marginTop: 16,
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            border: "none",
            background: "#ef4444",
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 8px 30px rgba(239,68,68,.25)",
          }}
        >
          Logout
        </button>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            height: 56,
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            background: "#fff",
            position: "sticky",
            top: 0,
            zIndex: 5,
          }}
        >
          <div style={{ fontWeight: 700 }}>Tenant Area</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Hostel Manager</div>
        </div>
        <div style={{ padding: 16 }}>
          <Outlet />
        </div>
      </main>

      {/* Avatar Lightbox */}
      {showAvatar && (
        <div
          onClick={() => setShowAvatar(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2,6,23,.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0b1220",
              borderRadius: 16,
              padding: 16,
              width: "min(92vw, 520px)",
              boxShadow: "0 30px 80px rgba(0,0,0,.45)",
              color: "#e5e7eb",
              textAlign: "center",
            }}
          >
            <img
              src={avatarSrc}
              alt="avatar-large"
              style={{
                width: "100%",
                maxHeight: "60vh",
                objectFit: "contain",
                borderRadius: 12,
                background: "#020617",
                border: "1px solid rgba(255,255,255,.08)",
              }}
            />
            <div style={{ marginTop: 12, fontWeight: 800, fontSize: 18 }}>{me?.name || "Tenant"}</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              {me?.roomNo ? `Room ${me.roomNo}` : ""} {me?.bedNo ? `/ Bed ${me.bedNo}` : ""}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
              <button
                onClick={() => setShowAvatar(false)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,.15)",
                  background: "transparent",
                  color: "#e5e7eb",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowAvatar(false);
                  nav("/tenant/profile");
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: "#4c7cff",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

