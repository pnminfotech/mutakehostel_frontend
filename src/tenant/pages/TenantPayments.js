// TenantPayments.jsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API, authHeader } from "../tenantApi";

function Money({ v = 0 }) {
  return <>₹{Number(v || 0).toLocaleString("en-IN")}</>;
}

export default function TenantPayments({ me: meProp, rents: rentsProp, refresh }) {
  const [me, setMe] = useState(meProp || null);
  const [rents, setRents] = useState(rentsProp || null);
  const [myPays, setMyPays] = useState([]);
  const [amount, setAmount] = useState("500");
  const [utr, setUTR] = useState("");
  const [note, setNote] = useState("");

  const card = {
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 8px 30px rgba(16,24,40,.06)",
    padding: 16,
    marginBottom: 16,
  };

  const needFetch = !me || !rents;

  useEffect(() => { if (meProp) setMe(meProp); }, [meProp]);
  useEffect(() => { if (rentsProp) setRents(rentsProp); }, [rentsProp]);

  const fetchOwn = async () => {
    const h = { headers: authHeader() };
    const [a, b, c] = await Promise.all([
      axios.get(`${API}/tenant/me`, h),
      axios.get(`${API}/tenant/rents`, h),
      axios.get(`${API}/tenant/payments/my`, h).catch(()=>({ data: [] })),
    ]);
    setMe(a.data);
    setRents(b.data);
    setMyPays(c.data || []);
  };

  useEffect(() => {
    const go = async () => {
      const h = { headers: authHeader() };
      try {
        const pay = await axios.get(`${API}/tenant/payments/my`, h);
        setMyPays(pay.data || []);
      } catch {
        setMyPays([]);
      }
      if (needFetch) await fetchOwn();
    };
    go().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentMonthPaid = useMemo(() => {
    if (!rents?.rents?.length) return false;
    const now = new Date(), m = now.getMonth(), y = now.getFullYear();
    return rents.rents.some((r) => {
      if (!r?.date) return false;
      const d = new Date(r.date);
      return d.getMonth() === m && d.getFullYear() === y && Number(r.rentAmount) > 0;
    });
  }, [rents]);

  const payAmount = Number(amount || 0);
  const qrUrl = `${API}/tenant/upi-qr?amount=${encodeURIComponent(payAmount || 0)}&note=${encodeURIComponent("Hostel Rent")}`;

  const reportPayment = async () => {
    const amt = Number(amount || 0);
    if (!amt) return alert("Enter amount");

    try {
      await axios.post(`${API}/tenant/payments/report`, {
        tenantId: me?._id,
        amount: Number(amount),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        utr,
        note,
        receiptUrl: ""
      }, { headers: authHeader() });

      setUTR("");
      setNote("");

      if (typeof refresh === "function") await refresh();
      await fetchOwn();

      alert("Thanks! Payment reported. Admin will review & approve.");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to report payment");
    }
  };

  return (
    <div style={{ padding: 4 }}>
      <h3 style={{ margin: "8px 0 16px" }}>Bills & Payments</h3>

      {/* Top summary: 3 columns now (Room/Bed, Base Rent, Current Month) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        <div style={card}>
          <div style={{ color: "#6b7280", fontSize: 12 }}>Room / Bed</div>
          <div style={{ fontWeight: 700 }}>{me?.roomNo || "—"} / {me?.bedNo || "—"}</div>
        </div>

        <div style={card}>
          <div style={{ color: "#6b7280", fontSize: 12 }}>Base Rent</div>
          <div style={{ fontWeight: 700 }}>
            <Money v={me?.baseRent} />
          </div>
        </div>

        <div style={card}>
          <div style={{ color: "#6b7280", fontSize: 12 }}>Current Month</div>
          <div style={{ fontWeight: 700, color: currentMonthPaid ? "#16a34a" : "#f59e0b" }}>
            {currentMonthPaid ? "Paid" : "Pending"}
          </div>
        </div>
      </div>

      {/* Pay / QR (same as before) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 12, marginTop: 12 }}>
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Pay via UPI</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Amount (₹)</div>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
                style={{ padding: 10, width: 180, border: "1px solid #e5e7eb", borderRadius: 8 }}
              />
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <img src={qrUrl} alt="UPI QR" style={{ width: 220, height: 220, background: "#fff", borderRadius: 12, border: "1px solid #eee" }} />
          </div>
          <div style={{ color: "#6b7280", fontSize: 12, marginTop: 8 }}>
            Scan with any UPI app, then report the payment below (UTR helps admin confirm faster).
          </div>
        </div>

        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Report Payment</div>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
            After paying via UPI, paste your UTR / Reference ID and a short note.
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Amount (₹)</div>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500" style={{ padding: 10, width: "100%", border: "1px solid #e5e7eb", borderRadius: 8 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>UTR / Ref</div>
            <input value={utr} onChange={(e) => setUTR(e.target.value)} placeholder="e.g., 2309XXXXXXXX" style={{ padding: 10, width: "100%", border: "1px solid #e5e7eb", borderRadius: 8 }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Note (optional)</div>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="September rent" style={{ padding: 10, width: "100%", border: "1px solid #e5e7eb", borderRadius: 8 }} />
          </div>
          <button onClick={reportPayment} style={{ padding: "10px 14px", background: "#16a34a", color: "#fff", borderRadius: 10, border: 0, fontWeight: 700, cursor: "pointer" }}>
            Report Payment
          </button>
        </div>
      </div>

      {/* History (same as before) */}
      <div style={card}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>My Payment Reports</div>
        {myPays?.length ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#6b7280" }}>
                  <th style={{ padding: 8 }}>Date</th>
                  <th style={{ padding: 8 }}>Amount</th>
                  <th style={{ padding: 8 }}>UTR</th>
                  <th style={{ padding: 8 }}>Note</th>
                  <th style={{ padding: 8 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {myPays.map((p) => (
                  <tr key={p._id} style={{ borderTop: "1px solid #eef2f7" }}>
                    <td style={{ padding: 8 }}>{new Date(p.createdAt).toLocaleString()}</td>
                    <td style={{ padding: 8 }}><Money v={p.amount} /></td>
                    <td style={{ padding: 8 }}>{p.utr || "—"}</td>
                    <td style={{ padding: 8 }}>{p.note || "—"}</td>
                    <td style={{ padding: 8, fontWeight: 700, color: p.status === "confirmed" ? "#16a34a" : p.status === "rejected" ? "#ef4444" : "#f59e0b" }}>
                      {p.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: "#6b7280" }}>No payments yet.</div>
        )}
      </div>
    </div>
  );
}
