// src/tenant/TenantApp.js
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API, getToken, clearToken, authHeader } from "./tenantApi";
import { Routes, Route, Navigate } from "react-router-dom";

import TenantLogin from "./pages/TenantLogin";
import TenantShell from "./components/TenantShell";

import TenantHome from "./pages/TenantHome";
import TenantRent from "./pages/TenantRent";
import TenantPayments from "./pages/TenantPayments";
import TenantDocs from "./pages/TenantDocs";
import TenantAnnouncements from "./pages/TenantAnnouncements";
import TenantLeave from "./pages/TenantLeave";
import TenantSupport from "./pages/TenantSupport";
import TenantProfile from "./pages/TenantProfile";
import TenantEKYC from "./pages/TenantEKYC";

export default function TenantApp() {
  const [authed, setAuthed] = useState(!!getToken());
  const [me, setMe] = useState(null);
  const [rents, setRents] = useState(null);
  const [ann, setAnn] = useState([]);

  const fetchAll = useCallback(async () => {
    const h = { headers: authHeader() };
    const [a, b, c] = await Promise.all([
      axios.get(`${API}/tenant/me`, h),
      axios.get(`${API}/tenant/rents`, h),
      axios.get(`${API}/tenant/announcements`, h),
    ]);
    setMe(a.data);
    setRents(b.data);
    setAnn(c.data || []);
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchAll().catch(() => {
      clearToken();
      setAuthed(false);
    });
  }, [authed, fetchAll]);

  if (!authed) return <TenantLogin onLoggedIn={() => setAuthed(true)} />;

  const logout = () => {
    clearToken();
    setAuthed(false);
  };

  return (
    <Routes>
      <Route element={<TenantShell me={me} onLogout={logout} />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<TenantHome me={me} rents={rents} ann={ann} refresh={fetchAll} />} />
        <Route path="rent" element={<TenantRent rents={rents} />} />
       <Route
  path="payments"
  element={<TenantPayments me={me} rents={rents} refresh={fetchAll} />}
/>

        <Route path="documents" element={<TenantDocs me={me} onChanged={fetchAll} />} />
        <Route path="announcements" element={<TenantAnnouncements ann={ann} />} />
        <Route path="leave" element={<TenantLeave me={me} onChanged={fetchAll} />} />
        <Route path="support" element={<TenantSupport />} />
        <Route path="profile" element={<TenantProfile me={me} onChanged={fetchAll} />} />
        <Route path="ekyc" element={<TenantEKYC />} />

        {/* Safety: if something ever produces /tenant/home/anything, send to the right place */}
        <Route path="home/profile" element={<Navigate to="/tenant/profile" replace />} />
        <Route path="home/documents" element={<Navigate to="/tenant/documents" replace />} />
        <Route path="home/ekyc" element={<Navigate to="/tenant/ekyc" replace />} />
        <Route path="home/leave" element={<Navigate to="/tenant/leave" replace />} />
        <Route path="home/support" element={<Navigate to="/tenant/support" replace />} />
        <Route path="home/rent" element={<Navigate to="/tenant/rent" replace />} />
        <Route path="home/payments" element={<Navigate to="/tenant/payments" replace />} />

        <Route path="*" element={<div style={{ padding: 16 }}>Not found</div>} />
      </Route>
    </Routes>
  );
}
