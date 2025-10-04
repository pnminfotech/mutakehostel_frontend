import React, { useState } from "react";
import axios from "axios";
import { API, setToken } from "../tenantApi";

export default function TenantLogin({ onLoggedIn }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState("");
  const [busy, setBusy] = useState(false);

  const box = {
    maxWidth: 420, margin: "48px auto", background: "#fff", padding: 20,
    borderRadius: 14, boxShadow: "0 8px 30px rgba(16,24,40,.06)"
  };
  const label = { fontSize: 13, color: "#6b7280", marginBottom: 6 };
  const input = {
    width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb",
    borderRadius: 10, outline: "none", marginBottom: 12
  };
  const btnPri = { width:"100%", padding:"10px 14px", border:0, borderRadius:10, background:"#4c7cff", color:"#fff", cursor:"pointer" };
  const btnSec = { ...btnPri, background:"#16a34a" };

  async function reqOtp() {
    if (!phone) return alert("Enter phone number");
    try {
      setBusy(true);
      const r = await axios.post(`${API}/tenant/auth/request-otp`, { phone });
      if (r.data?.devCode) setDevCode(r.data.devCode);
      setStep(2);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to request OTP");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!otp) return alert("Enter OTP");
    try {
      setBusy(true);
      const r = await axios.post(`${API}/tenant/auth/verify`, { phone, code: otp });
      setToken(r.data.token);
      onLoggedIn && onLoggedIn();
    } catch (e) {
      alert(e?.response?.data?.message || "Invalid OTP");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={box}>
      <h3 style={{ margin:0, marginBottom:16, textAlign:"center" }}>Tenant Login</h3>

      {step === 1 && (
        <>
          <div style={label}>Phone</div>
          <input
            style={input}
            value={phone}
            onChange={(e)=>setPhone(e.target.value)}
            placeholder="Enter your phone number"
          />
          <button disabled={busy} style={btnPri} onClick={reqOtp}>
            {busy ? "Sending..." : "Send OTP"}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div style={label}>Enter OTP</div>
          <input
            style={input}
            value={otp}
            onChange={(e)=>setOtp(e.target.value)}
            placeholder="6-digit code"
          />
          <button disabled={busy} style={btnSec} onClick={verify}>
            {busy ? "Verifying..." : "Verify"}
          </button>
          {devCode && (
            <div style={{marginTop:8, fontSize:12, color:"#64748b"}}>
              Dev OTP: <b>{devCode}</b>
            </div>
          )}
        </>
      )}
    </div>
  );
}
