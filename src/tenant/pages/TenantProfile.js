// payment-manager/src/tenant/pages/TenantProfile.js
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API, authHeader } from "../tenantApi";

// ───────────────── helpers ─────────────────
function toDateInputValue(val) {
  if (!val) return "";
  try {
    const d =
      typeof val === "string"
        ? new Date(val)
        : val instanceof Date
        ? val
        : new Date(String(val));
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function fullImg(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API}${url}`; // prefix relative /uploads/... with API origin
}

// ───────────────── component ─────────────────
export default function TenantProfile() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [okToast, setOkToast] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [showAvatar, setShowAvatar] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    companyAddress: "",
    emergencyContact: "",
    dob: "",
  });

  // preview URL for avatar file
  const avatarPreview = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : null),
    [avatarFile]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const r = await axios.get(`${API}/tenant/me`, { headers: authHeader() });
        if (!mounted) return;
        const data = r.data || {};
        setMe(data);
        setForm({
          name: data?.name || "",
          email: data?.email || "",
          address: data?.address || "",
          companyAddress: data?.companyAddress || "",
          emergencyContact: data?.emergencyContact || "",
          dob: toDateInputValue(data?.dob),
        });
      } catch {
        if (!mounted) return;
        setErrorMsg("Failed to load profile.");
        setMe({});
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // auto-hide toast
  useEffect(() => {
    if (!okToast) return;
    const t = setTimeout(() => setOkToast(""), 1800);
    return () => clearTimeout(t);
  }, [okToast]);

  async function saveProfile() {
    setSaving(true);
    setErrorMsg("");
    try {
      await axios.put(`${API}/tenant/profile`, form, { headers: authHeader() });
      const r = await axios.get(`${API}/tenant/me`, { headers: authHeader() });
      setMe(r.data || {});
      setOkToast("Profile saved ✓");
    } catch {
      setErrorMsg("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar() {
    if (!avatarFile) return;
    setErrorMsg("");
    try {
      const fd = new FormData();
      fd.append("avatar", avatarFile);
      await axios.post(`${API}/tenant/profile/avatar`, fd, {
        headers: { ...authHeader(), "Content-Type": "multipart/form-data" },
      });
      const r = await axios.get(`${API}/tenant/me`, { headers: authHeader() });
      setMe(r.data || {});
      setAvatarFile(null);
      setOkToast("Photo updated ✓");
    } catch {
      setErrorMsg("Avatar upload failed.");
    }
  }

  // layout tokens
  const card = {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 8px 30px rgba(16,24,40,.06)",
  };
  const label = { fontSize: 12, color: "#6b7280", marginBottom: 6 };
  const input = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    outline: "none",
  };
  const btnPri = {
    padding: "10px 14px",
    border: 0,
    borderRadius: 10,
    background: "#4c7cff",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  };
  const btnGhost = {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#111827",
    cursor: "pointer",
  };

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <h3 style={{ marginBottom: 12 }}>Profile</h3>
        <div style={{ ...card, padding: 16 }}>Loading…</div>
      </div>
    );
  }

  const currentAvatar =
    avatarPreview ||
    fullImg(me?.avatarUrl) ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      me?.name || "Tenant"
    )}`;

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <h3 style={{ margin: 0 }}>Profile</h3>
        {me?.ekyc?.status ? (
          <span
            style={{
              marginLeft: 6,
              fontSize: 12,
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: 999,
              background:
                me.ekyc.status === "verified"
                  ? "#d1fae5"
                  : me.ekyc.status === "pending"
                  ? "#fef3c7"
                  : "#e5e7eb",
              color:
                me.ekyc.status === "verified"
                  ? "#065f46"
                  : me.ekyc.status === "pending"
                  ? "#92400e"
                  : "#374151",
            }}
          >
            eKYC: {me.ekyc.status}
          </span>
        ) : null}
      </div>

      {errorMsg ? (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 12,
            background: "#fee2e2",
            color: "#991b1b",
          }}
        >
          {errorMsg}
        </div>
      ) : null}

      {okToast ? (
        <div
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            background: "#111827",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,.25)",
            zIndex: 50,
          }}
        >
          {okToast}
        </div>
      ) : null}

      {/* TOP: avatar + quick facts */}
      <div
        style={{
          ...card,
          padding: 16,
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div
          onClick={() => setShowAvatar(true)}
          title="Click to preview"
          style={{ cursor: "zoom-in" }}
        >
          <img
            src={currentAvatar}
            alt="avatar"
            onError={(e) => {
              e.currentTarget.src =
                "https://api.dicebear.com/7.x/initials/svg?seed=" +
                encodeURIComponent(me?.name || "Tenant");
            }}
            style={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #eef2ff",
              background: "#fff",
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{me?.name || "—"}</div>
          <div style={{ color: "#6b7280", fontSize: 12 }}>
            {me?.roomNo ? `Room ${me.roomNo}` : "—"}
            {me?.bedNo ? ` • Bed ${me.bedNo}` : ""}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <label style={{ ...btnGhost, display: "inline-block" }}>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => setAvatarFile((e.target.files || [])[0] || null)}
              />
              Choose Photo
            </label>
            <button
              onClick={uploadAvatar}
              disabled={!avatarFile}
              style={{
                ...btnPri,
                opacity: avatarFile ? 1 : 0.6,
                cursor: avatarFile ? "pointer" : "not-allowed",
              }}
            >
              Upload
            </button>
          </div>
        </div>
      </div>

      {/* FORM */}
      <div style={{ ...card, padding: 16, maxWidth: 640 }}>
        {/* grid 2-col on wide screens */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 12,
          }}
        >
          {/* Full Name */}
          <div>
            <div style={label}>Full Name</div>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              style={input}
            />
          </div>

          {/* Email */}
          <div>
            <div style={label}>Email</div>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              style={input}
              placeholder="name@example.com"
            />
          </div>

          {/* Address */}
          <div>
            <div style={label}>Address</div>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
              style={input}
              placeholder="Street, City, State"
            />
          </div>

          {/* Company / College */}
          <div>
            <div style={label}>Company / College</div>
            <input
              type="text"
              value={form.companyAddress}
              onChange={(e) =>
                setForm((s) => ({ ...s, companyAddress: e.target.value }))
              }
              style={input}
            />
          </div>

          {/* Emergency Contact */}
          <div>
            <div style={label}>Emergency Contact</div>
            <input
              type="text"
              value={form.emergencyContact}
              onChange={(e) =>
                setForm((s) => ({ ...s, emergencyContact: e.target.value }))
              }
              style={input}
              placeholder="+91 9xxxxxxxxx"
            />
          </div>

          {/* DOB */}
          <div>
            <div style={label}>Date of Birth</div>
            <input
              type="date"
              value={form.dob || ""}
              onChange={(e) => setForm((s) => ({ ...s, dob: e.target.value }))}
              style={input}
            />
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <button
            onClick={saveProfile}
            disabled={saving}
            style={{
              ...btnPri,
              opacity: saving ? 0.7 : 1,
              cursor: saving ? "progress" : "pointer",
            }}
          >
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </div>

      {/* Lightbox for avatar */}
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
              src={currentAvatar}
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
            <div style={{ marginTop: 12, fontWeight: 800, fontSize: 18 }}>
              {me?.name || "Tenant"}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              {me?.roomNo ? `Room ${me.roomNo}` : ""}{" "}
              {me?.bedNo ? `/ Bed ${me.bedNo}` : ""}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
