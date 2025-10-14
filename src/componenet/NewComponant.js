import React, { useState, useEffect, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
// import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit } from "react-icons/fa";
import { FaInfoCircle } from "react-icons/fa";
import * as XLSX from "xlsx";
import { getDocHref } from "../utils/getDocHref"; // adjust path if needed

import { saveAs } from "file-saver";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { FaBolt, FaReceipt, FaEye, FaTrash } from "react-icons/fa"; // example icons
import { FaSearch } from "react-icons/fa";
import { FaSignOutAlt, FaUndo, FaDownload } from "react-icons/fa";
import FormDownload from "../componenet/Maintanace/FormDownload";
import TenantChatbot from "../componenet/TenantChatbot";
import NotificationBell from "../componenet/NotificationBell";
import LeaveNotificationBell from "../componenet/LeaveNotificationBell";
import RoomManager from "./RoomManager"; // adjust path if needed
// import { useNavigate } from 'react-router-dom';
import { FaMoneyBillWave, FaPhoneAlt, FaCalendarAlt } from "react-icons/fa";
import { api } from "../api";
function NewComponant() {
  const [formData, setFormData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomsData, setRoomsData] = useState([]);

  const [tenants, setTenants] = useState([]);

  const [rentStart, setRentStart] = useState(null); // shared 3-month window start
  const [docs, setDocs] = useState([]);
  const [editingTenant, setEditingTenant] = useState(null);
  const [editRentAmount, setEditRentAmount] = useState("");
  const [editRentDate, setEditRentDate] = useState("");
  const [activeTab, setActiveTab] = useState("light");
  const [lightBills, setLightBills] = useState([]);
  // const [activeTab, setActiveTab] = useState('light'); // 'light' or 'other'
  const [searchText, setSearchText] = useState("");
  const [leaveDates, setLeaveDates] = useState({});
  const [deletedData, setDeletedData] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedLeaveDate, setSelectedLeaveDate] = useState("");
  const [currentLeaveId, setCurrentLeaveId] = useState(null);
  const [currentLeaveName, setCurrentLeaveName] = useState("");
  const [showRentModal, setShowRentModal] = useState(false);
  const [selectedRentDetails, setSelectedRentDetails] = useState([]);
  // const [selectedTenantName, setSelectedTenantName] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  ////form
  const [showFModal, setShowFModal] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  // const [lang, setLang] = useState("en");
  const [showAddModal, setShowAddModal] = useState(false);
 const [newTenant, setNewTenant] = useState({
    srNo: "",
    name: "",
    joiningDate: "",
    roomNo: "",
    depositAmount: "",
    address: "",
    phoneNo: "",
    relativeAddress1: "",
    relativeAddress2: "",
    // inline relatives used in the modal:
    relative1Relation: "Self",
    relative1Name: "",
    relative1Phone: "",
    relative2Relation: "Self",
    relative2Name: "",
    relative2Phone: "",
    floorNo: "",
    bedNo: "",
    companyAddress: "",
    dateOfJoiningCollege: "",
    dob: "",
     // rent/bed helpers you already reference:
    baseRent: "",
    rentAmount: "",
    newBedNo: "",
    newBedPrice: "",
    __bedMsg: "",
    __savingBed: false,
  });
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState("");
  const [currentDeleteId, setCurrentDeleteId] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [editPaymentMode, setEditPaymentMode] = useState("Cash");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editTenantData, setEditTenantData] = useState(null);

  const [showDueModal, setShowDueModal] = useState(false);
  const [dueMonths, setDueMonths] = useState([]);
  const [selectedTenantName, setSelectedTenantName] = useState("");

  const [showStatusModal, setShowStatusModal] = useState(false);
  // const [statusMonths, setStatusMonths] = useState([]);
  // const [statusTenantName, setStatusTenantName] = useState("");

  const [selectedYear, setSelectedYear] = useState("All Records");
const [editMonthYM, setEditMonthYM] = useState({ y: null, m: null });

const years = useMemo(() => {
  const ys = new Set();
  (formData || []).forEach((d) => {
    if (!d?.joiningDate) return;
    const dd = new Date(d.joiningDate);
    if (!isNaN(dd)) ys.add(dd.getFullYear());
  });
  return ["All Records", ...Array.from(ys).sort((a, b) => b - a)];
}, [formData]);


  const apiUrl = "http://localhost:8000/api/";



  const refreshTenants = React.useCallback(async () => {
  try {
    const { data } = await axios.get(apiUrl);
    setFormData(data);
  } catch (e) {
    console.error("Failed to refresh tenants after approval:", e);
  }
}, [apiUrl]);
const fmtMonthKey = (y, m) => {
  const mon = new Date(y, m, 1).toLocaleString("en-US", { month: "short" }); // e.g., "Sep"
  const yy = String(y).slice(-2); // "25"
  return `${mon}-${yy}`; // "Sep-25"
};

const parseMonthKey = (key) => {
  // accepts "Sep-25" => { y: 2025, m: 8 }
  if (!key || typeof key !== "string") return null;
  const [mon, yy] = key.split("-");
  if (!mon || !yy) return null;
  const m = new Date(`${mon} 1, 20${yy}`).getMonth();
  const y = Number(`20${yy}`);
  if (!Number.isFinite(m) || !Number.isFinite(y)) return null;
  return { y, m };
};

// Single place to read a record's (y,m)
// Prefers r.month (e.g. "Sep-25"). If absent, uses r.date.
const getYMFromRecord = (r) => {
  if (!r) return null;
  if (r.month) {
    const pm = parseMonthKey(r.month);
    if (pm) return pm;
  }
  if (r.date) {
    const d = new Date(r.date);
    if (!isNaN(d)) return { y: d.getFullYear(), m: d.getMonth() };
  }
  return null;
};
// ➕ add a tiny upsert helper near other helpers:
 const upsertRentForMonth = React.useCallback((tenant, { y, m, amount, date, mode }) => {
   const monthKey = fmtMonthKey(y, m);
   const rents = Array.isArray(tenant.rents) ? [...tenant.rents] : [];
   const idx = rents.findIndex((r) => {
     const ym = getYMFromRecord(r);
     return ym && ym.y === y && ym.m === m;
   });
   const patch = {
     month: monthKey,                    // "Sep-25"
     rentAmount: Number(amount) || 0,
     date: date || new Date().toISOString(),
     paymentMode: mode || "Online",
   };
   if (idx >= 0) rents[idx] = { ...rents[idx], ...patch };
   else rents.push(patch);
   return rents;
 }, []);

const handleApprovedFromBell = React.useCallback((payload) => {
   // payload = { tenantId, amount, year, month(1..12), paymentDate, paymentMode, ... }
   const { tenantId, amount, year, month, paymentDate, paymentMode } = payload || {};
   if (!tenantId || !Number.isFinite(year) || !Number.isFinite(month)) {
     // fallback: safer re-fetch if something is missing
     refreshTenants();
     return;
   }
   // Optimistic UI: update that tenant's month right away
   setFormData((prev) =>
     prev.map((t) =>
       t._id === tenantId
         ? { ...t, rents: upsertRentForMonth(t, {
             y: year,
             m: month - 1,                // convert 1..12 -> 0..11
             amount,
             date: paymentDate,
             mode: paymentMode
           })
           }
         : t
     )
   );
   // Optional safety: also re-fetch to stay perfectly in sync with server
   refreshTenants();
 }, [refreshTenants, upsertRentForMonth]);

  // Build the public tenant form URL (adjust the path if yours is different)
  // Build a shareable URL for the tenant intake page, prefilled + locked
  const buildTenantFormUrl = React.useCallback(() => {
    const base = new URL(
      "/HostelManager/tenant-intake",
      window.location.origin
    );
    const p = new URLSearchParams(base.search);

    p.set("tenant", "true");
    p.set("lock", "1");

    if ((newTenant.name || "").trim()) p.set("name", newTenant.name.trim());
    if ((newTenant.phoneNo || "").trim())
      p.set("phoneNo", String(newTenant.phoneNo).trim());
    if (newTenant.roomNo) p.set("roomNo", String(newTenant.roomNo));
    if (newTenant.bedNo && newTenant.bedNo !== "__other__")
      p.set("bedNo", String(newTenant.bedNo));

    const baseRent = newTenant.baseRent ?? "";
    const rentAmount = newTenant.rentAmount ?? baseRent;
    if (baseRent !== "") p.set("baseRent", String(baseRent));
    if (rentAmount !== "") p.set("rentAmount", String(rentAmount));
    if (newTenant.depositAmount != null && newTenant.depositAmount !== "") {
      p.set("depositAmount", String(newTenant.depositAmount));
    }

    base.search = p.toString(); // ← ensure params are applied
    return base.toString();
  }, [newTenant]);

  // Share button handler (Web Share API with clipboard fallback)
  const handleShareAddTenantModal = React.useCallback(async () => {
    // basic validation
    if (
      !newTenant.roomNo ||
      !newTenant.bedNo ||
      newTenant.bedNo === "__other__"
    ) {
      alert("Please select a Room and a Bed before sharing the form.");
      return;
    }

    const url = buildTenantFormUrl();
    const shareData = {
      title: "Tenant Form",
      text: "Please fill out this tenant form:",
      url,
    };

    const copyFallback = async () => {
      try {
        await navigator.clipboard.writeText(url);
        alert("Form link copied to clipboard. Share it with the tenant.");
      } catch {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        alert("Could not open share dialog. Link copied to clipboard instead.");
      }
    };

    try {
      if (navigator.share) {
        if (
          typeof navigator.canShare === "function" &&
          !navigator.canShare(shareData)
        ) {
          return copyFallback();
        }
        await navigator.share(shareData);
      } else {
        await copyFallback();
      }
    } catch (err) {
      console.error("Share failed:", err);
      await copyFallback();
    }
  }, [buildTenantFormUrl, newTenant.roomNo, newTenant.bedNo]);

  const fetchSrNo = async () => {
    try {
      const response = await axios.get(`${apiUrl}forms/count`);
      setNewTenant((prev) => ({ ...prev, srNo: response.data.nextSrNo }));
    } catch (error) {
      console.error("Error fetching Sr No:", error);
    }
  };

  const openAddModal = () => {
    fetchSrNo();
    setShowAddModal(true);
  };

  const correctPassword = "987654";

  // existing line in your file

  // // ✅ add these right below apiUrl
  // const API_ORIGIN = process.env.REACT_APP_API_ORIGIN || "http://localhost:8000";

  // const getDocHref = (doc) => {
  //   // absolute URL already? use it
  //   if (doc?.url && /^https?:\/\//i.test(doc.url)) return doc.url;

  //   // relative URL from backend like "/api/documents/:id"
  //   if (doc?.url) return `${API_ORIGIN}${doc.url}`;

  //   // ID-only record
  //   if (doc?.fileId) return `${API_ORIGIN}/api/documents/${doc.fileId}`;

  //   return "#";
  // };

  // state at top of component
  const [docFiles, setDocFiles] = useState([]); // [{file: File, relation: "Self"}]
  const [docMsg, setDocMsg] = useState("");

  // onChange for <input type="file" multiple>
  function handleDocsChange(e) {
    const files = Array.from(e.target.files || []);
    const mapped = files.map((f) => ({ file: f, relation: "Self" }));
    setDocFiles((prev) => [...prev, ...mapped]);
  }

  function removeDoc(i) {
    setDocFiles((prev) => prev.filter((_, idx) => idx !== i));
  }
  // --- sanitize payload before sending to backend ---
  // Converts "" -> undefined, coerces number/date-ish fields safely
  function sanitizeTenantPayload(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj || {})) {
      // turn empty strings/null into undefined (so Mongoose can skip/validate)
      if (v === "" || v === null) {
        out[k] = undefined;
        continue;
      }

      // numbers (rent, price, deposit, amounts, srNo)
      if (/(amount|price|rent|deposit|srNo)$/i.test(k)) {
        const n = Number(String(v).replace(/[,₹\s]/g, ""));
        out[k] = Number.isFinite(n) ? n : undefined;
        continue;
      }

      // dates (joiningDate, dob, dateOfJoiningCollege, date, etc.)
      if (/(date|dob|joining)/i.test(k)) {
        out[k] = v || undefined; // keep ISO string or undefined
        continue;
      }

      out[k] = v;
    }
    return out;
  }
  function logAxiosError(err, label = "Axios error") {
    console.error(label, {
      url: err?.config?.url,
      method: err?.config?.method,
      data: err?.config?.data,
      status: err?.response?.status,
      resp: err?.response?.data,
    });
  }

  // SAVE handler (posts form + files)
  // --- NEW: save wrapper that includes docs ---
async function handleAddTenantWithDocs() {
  // ✅ Required-field guard (before any uploads or POSTs)
  const missing = [];
  if (!newTenant.name?.trim()) missing.push("Name");
  if (!newTenant.joiningDate)   missing.push("Joining Date");
  if (!newTenant.roomNo)        missing.push("Room No");
  if (!newTenant.bedNo || newTenant.bedNo === "__other__") missing.push("Bed No");

  // Optional: soft validation for phone and deposit
  if (newTenant.phoneNo && !/^\d{10}$/.test(String(newTenant.phoneNo).trim())) {
    alert("Phone No must be a 10-digit number.");
    return;
  }
  if (newTenant.depositAmount !== "" && newTenant.depositAmount != null) {
    const dep = Number(String(newTenant.depositAmount).replace(/[,₹\s]/g, ""));
    if (!Number.isFinite(dep) || dep < 0) {
      alert("Deposit Amount must be a non-negative number.");
      return;
    }
  }

  if (missing.length) {
    alert(`Please fill: ${missing.join(", ")}`);
    return;
  }

  try {
    let uploaded = [];

    // ⬇️ your existing upload block (unchanged)
    if (docFiles.length) {
      const fd = new FormData();
      docFiles.forEach((d) => {
        fd.append("documents", d.file); // field name MUST be "documents" on server Multer
      });

      const up = await axios.post(`${apiUrl}uploads/docs`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedFiles = up.data?.files || [];
      uploaded = uploadedFiles.map((f, i) => ({
        fileName: docFiles[i]?.file?.name || f.filename || `doc-${i + 1}`,
        relation: docFiles[i]?.relation || "Self",
        url:
          f.url ||
          f.path ||
          f.location ||
          f.secure_url ||
          (f._id ? `${apiUrl}documents/${f._id}` : "#"),
      }));
    }

    const rawPayload = {
      ...newTenant,
      documents: uploaded,
    };
    const payload = sanitizeTenantPayload(rawPayload);

    console.log("🚀 Payload sending:", payload);

    await axios.post(`${apiUrl}forms`, payload);

    setShowAddModal(false);

    // const tenantsRes = await axios.get(`${apiUrl}forms`);
    // setTenants(tenantsRes.data);
       // 🔄 refresh main table data
   await refreshTenants();
  } catch (err) {
    logAxiosError(err, "handleAddTenantWithDocs");
    const msg = err?.response?.data?.message || err.message;
    if (/E11000/i.test(msg)) {
      alert("Sr No already exists. Close and reopen Add Tenant to get a fresh Sr No.");
    } else {
      alert(msg || "Failed to save tenant");
    }
  }
}


  //  for file less than 10 kb

  // --- NEW: document upload state ---
  const [compressedDocs, setCompressedDocs] = React.useState([]); // Array<File>
  // const [docMsg, setDocMsg] = React.useState("");                 // inline message

  // Read a File into an <img>
  const loadImage = (file) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });

  // Canvas -> Blob (awaitable)
  const toBlob = (canvas, type, quality) =>
    new Promise((resolve) => canvas.toBlob(resolve, type, quality));

  // Compress an image to <= maxBytes (best effort)
  async function compressImageToTarget(file, maxBytes = 10 * 1024) {
    const img = await loadImage(file);
    let w = img.width;
    let h = img.height;
    let type = "image/jpeg";
    let quality = 0.82;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    for (let i = 0; i < 14; i++) {
      canvas.width = Math.max(128, Math.round(w));
      canvas.height = Math.max(128, Math.round(h));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      let blob = await toBlob(canvas, type, quality);
      if (blob && blob.size <= maxBytes) {
        return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
          type,
          lastModified: Date.now(),
        });
      }

      if (quality > 0.45) quality *= 0.8; // step quality down first
      else {
        w *= 0.85;
        h *= 0.85;
      } // then downscale

      if (i === 10) {
        type = "image/webp";
        quality = Math.min(quality, 0.5);
      }
    }

    // Final tiny attempt
    canvas.width = 128;
    canvas.height = 128;
    ctx.clearRect(0, 0, 128, 128);
    ctx.drawImage(img, 0, 0, 128, 128);
    const finalBlob = await toBlob(canvas, "image/webp", 0.35);
    if (finalBlob && finalBlob.size <= maxBytes) {
      return new File([finalBlob], file.name.replace(/\.\w+$/, ".webp"), {
        type: "image/webp",
        lastModified: Date.now(),
      });
    }
    return null; // couldn’t reach 10KB
  }

  // Handle file choose: allow multiple, images only, compress to <=10KB
  // async function handleDocsChange(e) {
  //   setDocMsg("");
  //   const files = Array.from(e.target.files || []);
  //   if (!files.length) return;

  //   const accepted = [];
  //   for (const f of files) {
  //     if (!f.type.startsWith("image/")) {
  //       setDocMsg("Only images are allowed for 10KB storage (jpg/png/webp).");
  //       continue;
  //     }
  //     try {
  //       const c = await compressImageToTarget(f, 10 * 1024);
  //       if (c) accepted.push(c);
  //       else setDocMsg((m) => (m ? m + " " : "") + `“${f.name}” couldn’t be reduced to ≤ 10KB.`);
  //     } catch {
  //       setDocMsg((m) => (m ? m + " " : "") + `Failed to process “${f.name}”.`);
  //     }
  //   }
  //   setCompressedDocs((prev) => [...prev, ...accepted]);
  //   e.target.value = ""; // allow selecting same file later
  // }

  // const removeDoc = (idx) => setCompressedDocs((prev) => prev.filter((_, i) => i !== idx));

  // --- NEW: save wrapper that includes docs ---
  // async function handleAddTenantWithDocs() {
  //   try {
  //     let uploaded = [];

  //     if (compressedDocs.length) {
  //       const fd = new FormData();
  //       compressedDocs.forEach(doc => {
  //         fd.append("documents", doc.file); // only raw files go to upload API
  //       });

  //       const up = await axios.post("http://localhost:8000/api/uploads/docs", fd, {
  //         headers: { "Content-Type": "multipart/form-data" },
  //       });

  //       const uploadedFiles = up.data?.files || [];

  //       // merge relation + url here
  //       uploaded = uploadedFiles.map((f, i) => ({
  //         fileName: compressedDocs[i].name,
  //         relation: compressedDocs[i].relation,
  //         url: f.url,
  //       }));
  //     }

  //     const payload = {
  //       ...newTenant,
  //       documents: uploaded, // ✅ don't remap again
  //     };

  //     console.log("🚀 Payload sending:", JSON.stringify(payload, null, 2));

  //     const res = await axios.post("http://localhost:8000/api/forms", payload);
  //     console.log("Saved:", res.data);

  //     setShowAddModal(false);

  //     // refresh list
  //     const tenantsRes = await axios.get("http://localhost:8000/api/forms");
  //     setTenants(tenantsRes.data);
  //   } catch (err) {
  //     console.error(err);
  //     alert(err?.response?.data?.message || err.message || "Failed to save tenant");
  //   }
  // }

  // If you already post in handleAddTenant, you can move the FormData logic there instead.

  const PAGE = 3; // number of month sub-columns under Rent

 const buildMonthsTimeline = (forms) => {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 1); // include next month

  // baseline = earliest joining month among active tenants; fallback to 12 months back
  const joinMonths = (Array.isArray(forms) ? forms : [])
    .map((t) => t?.joiningDate ? new Date(t.joiningDate) : null)
    .filter(Boolean)
    .map((d) => new Date(d.getFullYear(), d.getMonth(), 1));

  const minDate = joinMonths.length
    ? new Date(Math.min(...joinMonths.map((d) => d.getTime())))
    : new Date(today.getFullYear(), today.getMonth() - 11, 1);

  const months = [];
  const cursor = new Date(minDate);
  while (cursor <= end) {
    months.push({
      y: cursor.getFullYear(),
      m: cursor.getMonth(),
      label: cursor.toLocaleString("default", { month: "short", year: "numeric" }),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
};


  // const getRentForMonth = (rents = [], y, m) => {
  //   const hit = rents.find((r) => {
  //     if (!r?.date) return false;
  //     const d = new Date(r.date);
  //     return d.getFullYear() === y && d.getMonth() === m;
  //   });
  //   return hit ? Number(hit.rentAmount) || 0 : 0;
  // };

  // --- Memoize months + visible window so header & rows stay in sync ---
  const months = useMemo(() => buildMonthsTimeline(formData), [formData]);
  const defaultStart = Math.max(0, months.length - PAGE);
  const start = rentStart ?? defaultStart;
  const canLeft = start > 0;
  const canRight = start + PAGE < months.length;
  const visibleMonths = months.slice(start, start + PAGE);

  const goLeft = (e) => {
    e?.stopPropagation?.();
    setRentStart((s) => {
      const cur = s ?? defaultStart;
      return Math.max(0, cur - 1);
    });
  };
  const goRight = (e) => {
    e?.stopPropagation?.();
    setRentStart((s) => {
      const cur = s ?? defaultStart;
      return Math.min(months.length - PAGE, cur + 1);
    });
  };

  const formatShort = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        })
      : "";

  // Decide month status + date to show (prefers record.paymentDate; falls back to record.date)

  // ✅ SINGLE SOURCE: status + date + extra

  // Pick an expected monthly rent from tenant or record-level fields
  const pickExpected = (tenant, rec) => {
    // record-level (if you store per-month expected)
    const recExpected =
      Number(rec?.expectedRent ?? 0) ||
      Number(rec?.monthRent ?? 0) ||
      Number(rec?.rentExpected ?? 0);

    // tenant-level (global monthly rent)
    const tenantExpected =
      Number(tenant?.baseRent ?? 0) ||
      Number(tenant?.rent ?? 0) ||
      Number(tenant?.rentAmount ?? 0) ||
      Number(tenant?.expectedRent ?? 0) ||
      Number(tenant?.defaultRent ?? 0);

    return recExpected || tenantExpected || 0;
  };

  // Parses "₹3,250" / "3,250" / " 3250 "
  const toNum = (v) => {
    if (v === null || v === undefined) return 0;
    const n = Number(String(v).replace(/[,₹\s]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  // Get monthly rent from tenant or (fallback) roomsData
  const expectFromTenant = (tenant, roomsData) => {
    const v =
      toNum(tenant?.baseRent) ||
      toNum(tenant?.rent) ||
      toNum(tenant?.rentAmount) ||
      toNum(tenant?.expectedRent) ||
      toNum(tenant?.defaultRent) ||
      toNum(tenant?.monthlyRent) ||
      toNum(tenant?.price) ||
      toNum(tenant?.bedPrice);

    if (v) return v;

    // fallback: price from room/bed definition
    if (roomsData && tenant?.roomNo && tenant?.bedNo) {
      const room = roomsData.find(
        (r) => String(r.roomNo) === String(tenant.roomNo)
      );
      const bed = room?.beds?.find(
        (b) => String(b.bedNo) === String(tenant.bedNo)
      );
      return (
        toNum(bed?.price) ||
        toNum(bed?.baseRent) ||
        toNum(bed?.monthlyRent) ||
        0
      );
    }
    return 0;
  };

  // Single source of truth for a month cell
  const getMonthCell = (tenant, y, m) => {
    // const rec = (tenant.rents || []).find((r) => {
    //   if (!r?.date) return false;
    //   const d = new Date(r.date);
    //   return d.getFullYear() === y && d.getMonth() === m;
    // });

    const rec = (tenant.rents || []).find((r) => {
    const ym = getYMFromRecord(r);
    return ym && ym.y === y && ym.m === m;
  });
    // extras (add other keys if you use them)
    const extra =
      toNum(rec?.extraAmount) +
      toNum(rec?.extra) +
      toNum(rec?.lateFee) +
      toNum(rec?.maintenance) +
      toNum(rec?.adjustment) +
      toNum(rec?.electricityExtra);

    // expected rent for that month: prefer record-level, else tenant/room
    const expectedBase =
      toNum(rec?.expectedRent) ||
      toNum(rec?.monthRent) ||
      toNum(rec?.rentExpected) ||
      toNum(rec?.baseRent) ||
      toNum(rec?.price) ||
      expectFromTenant(tenant, roomsData);

    const expected = expectedBase + extra;
    const amountPaid = toNum(rec?.rentAmount); // money actually paid this month
    const outstanding = Math.max(0, expected - amountPaid);
    const dateStr = rec?.date
      ? new Date(rec?.paymentDate || rec.date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        })
      : "";

    if (!rec) {
      // No record at all => full expected is due
      return {
        label: "Due",
        cls: "bg-danger text-white",
        dateStr: "",
        extra,
        amountPaid: 0,
        expected,
        outstanding: expected,
      };
    }

    if (amountPaid <= 0) {
      return {
        label: "Pend",
        cls: "bg-warning text-dark",
        dateStr,
        extra,
        amountPaid,
        expected,
        outstanding,
      };
    }

    return {
      label: "Paid",
      cls: "bg-success text-white",
      dateStr,
      extra,
      amountPaid,
      expected,
      outstanding, // could be >0 if underpaid
    };
  };

  useEffect(() => {
    axios
      .get(apiUrl)
      .then((response) => {
        setFormData(response.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch data");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    axios
      .get(`${apiUrl}forms`)
      .then((response) => {
        const leaveMap = {};
        response.data.forEach((item) => {
          if (item.leaveDate) {
            leaveMap[item._id] = new Date(item.leaveDate)
              .toISOString()
              .split("T")[0];
          }
        });
        setLeaveDates(leaveMap);
      })
      .catch((err) => console.error("Error fetching leave data:", err));
  }, []);
  useEffect(() => {
    axios
      .get(`${apiUrl}forms/archived`)
      .then((response) => setDeletedData(response.data))
      .catch((err) => console.error("Error fetching archived tenants:", err));
  }, []);
  // useEffect(() => {
  //   axios
  //     .get("http://localhost:8000/api/rooms")
  //     .then((response) => setRoomsData(response.data))
  //     .catch((err) => console.error("Failed to fetch rooms:", err));
  // }, []);

  useEffect(() => {
    axios
      .get(`${apiUrl}rooms`)
      .then((response) => setRoomsData(response.data))
      .catch((err) => console.error("Failed to fetch rooms:", err));
  }, []);

  const handleAddTenant = async () => {
    try {
      const selectedRoom = roomsData.find(
        (r) => String(r.roomNo) === String(newTenant.roomNo)
      );
      const selectedBed = selectedRoom?.beds?.find(
        (b) => String(b.bedNo) === String(newTenant.bedNo)
      );
      const baseRent = selectedBed?.price || 0;

      const tenantToSave = sanitizeTenantPayload({
        ...newTenant,
        baseRent,
      });

      await axios.post(`${apiUrl}forms`, tenantToSave);
      alert("Tenant added successfully");
      setShowAddModal(false);

      setNewTenant({
        srNo: "",
        name: "",
        joiningDate: "",
        roomNo: "",
        depositAmount: "",
        address: "",
        phoneNo: "",
        relativeAddress1: "",
        relativeAddress2: "",
        floorNo: "",
        bedNo: "",
        companyAddress: "",
        dateOfJoiningCollege: "",
        dob: "",
        baseRent: "",
        rentAmount: "",
      });

      // const response = await axios.get(`${apiUrl}`);
      // setFormData(response.data);
      await refreshTenants();
    } catch (err) {
      logAxiosError(err, "handleAddTenant");
      const msg = err?.response?.data?.message || err.message;
      if (/E11000/i.test(msg)) {
        alert(
          "Sr No already exists. Close and reopen Add Tenant to get a fresh Sr No."
        );
      } else {
        alert("Failed to add tenant: " + msg);
      }
    }
  };

  const occupiedBeds = new Set(
    formData
      .filter((t) => !t.leaveDate) // exclude tenants who left
      .map((t) => `${t.roomNo}-${t.bedNo}`)
  );
// Always use month-aware lookup (prefers r.month like "Sep-25", else r.date)
const getRentForMonth = (rents = [], y, m) => {
  const rec = (Array.isArray(rents) ? rents : []).find((r) => {
    const ym = getYMFromRecord(r);
    return ym && ym.y === y && ym.m === m;
  });
  return rec ? Number(rec.rentAmount) || 0 : 0;
};

// Current-year pending months since JOIN+1, month-aware
const getPendingMonthsForStatus = (rents = [], joiningDateStr) => {
  if (!joiningDateStr) return [];
  const today = new Date();
  const currentYear = today.getFullYear();

  const join = new Date(joiningDateStr);
  const rentStart = new Date(join.getFullYear(), join.getMonth() + 1, 1);
  const jan1 = new Date(currentYear, 0, 1);
  const start = rentStart > jan1 ? rentStart : jan1;

  // Set of "m-y" paid months
  const paid = new Set(
    (Array.isArray(rents) ? rents : [])
      .filter((r) => Number(r?.rentAmount) > 0)
      .map(getYMFromRecord)
      .filter(Boolean)
      .map(({ m, y }) => `${m}-${y}`)
  );

  const out = [];
  const cur = new Date(start);
  while (cur <= today && cur.getFullYear() === currentYear) {
    const key = `${cur.getMonth()}-${cur.getFullYear()}`;
    if (!paid.has(key)) {
      out.push(cur.toLocaleString("default", { month: "long", year: "numeric" }));
    }
    cur.setMonth(cur.getMonth() + 1);
  }
  return out;
};

  // const getPendingMonthsForStatus = (rents = [], joiningDateStr) => {
  //   if (!joiningDateStr) return [];

  //   const now = new Date();
  //   const currentYear = now.getFullYear();

  //   // Map paid months
  //   const paidMonths = new Set(
  //     rents
  //       .filter((r) => r.date && Number(r.rentAmount) > 0)
  //       .map((r) => {
  //         const d = new Date(r.date);
  //         return `${d.getMonth()}-${d.getFullYear()}`;
  //       })
  //   );

  //   const months = [];
  //   const startMonth = new Date(currentYear, 0); // Jan of current year

  //   const joinDate = new Date(joiningDateStr);
  //   const startDate = joinDate > startMonth ? joinDate : startMonth;
  //   const tempDate = new Date(startDate);

  //   while (tempDate <= now) {
  //     const key = `${tempDate.getMonth()}-${tempDate.getFullYear()}`;
  //     if (!paidMonths.has(key)) {
  //       months.push(
  //         tempDate.toLocaleString("default", { month: "long", year: "numeric" })
  //       );
  //     }
  //     tempDate.setMonth(tempDate.getMonth() + 1);
  //   }

  //   return months;
  // };

  // All room-bed slots from roomsData
  const slots = useMemo(() => {
    return (roomsData || []).flatMap((room) =>
      (room.beds || []).map((bed) => ({
        roomNo: String(room.roomNo),
        floorNo: room.floorNo,
        bedNo: String(bed.bedNo),
        price: toNum(bed.price),
        category: bed.category || "",
      }))
    );
  }, [roomsData]);

  // Tenants to show in the main table (hide those who have left)
  const visibleTenants = useMemo(() => {
    const search = (searchText || "").toLowerCase();
    return (formData || []).filter((t) => {
      const name = (t.name || "").toLowerCase();
      const bed = t.bedNo != null ? String(t.bedNo) : "";
      const joinYear = t.joiningDate
        ? String(new Date(t.joiningDate).getFullYear())
        : null;

      const leaveISO = leaveDates[t._id];
      const isLeaved = leaveISO && new Date(leaveISO) < new Date();

      return (
        !isLeaved &&
        (name.includes(search) || bed.includes(search)) &&
        (selectedYear === "All Records" || joinYear === String(selectedYear))
      );
    });
  }, [formData, leaveDates, searchText, selectedYear]);

  // Vacant slots = slots that are not currently occupied (by a visible, non-leaved tenant)
  const extraVacantSlots = useMemo(() => {
    const activeKeys = new Set(
      (formData || [])
        .filter((t) => {
          const leaveISO = leaveDates[t._id];
          const isLeaved = leaveISO && new Date(leaveISO) < new Date();
          return !isLeaved;
        })
        .map((t) => `${t.roomNo}-${t.bedNo}`)
    );

    const search = (searchText || "").toLowerCase();

    return (slots || []).filter((slot) => {
      const key = `${slot.roomNo}-${slot.bedNo}`;
      if (activeKeys.has(key)) return false; // occupied

      const matchesSearch =
        !search ||
        String(slot.bedNo).toLowerCase().includes(search) ||
        String(slot.roomNo).toLowerCase().includes(search);

      // year filter applies only to tenants; for slots, show them unless user picked a specific year
      const matchesYear = selectedYear === "All Records";

      return matchesSearch && matchesYear;
    });
  }, [slots, formData, leaveDates, searchText, selectedYear]);

  // ADD THIS helper in NewComponant component (near other handlers)
  const openEditForTenantMonth = (tenantId, monthIdx, year) => {
    const tenant = formData.find((t) => t._id === tenantId);
    if (!tenant) return;

    // Prefill the modal to the 1st of the requested month/year
    // const date = new Date(year, monthIdx, 1).toISOString().split("T")[0];

    // setEditingTenant(tenant);
    // setEditRentDate(date);
setEditingTenant(tenant);
setEditMonthYM({ y: year, m: monthIdx });
// date field now will be "today", set once on open:
setEditRentDate(new Date().toISOString().split("T")[0]);
    // Optional: clear or auto-suggest amount
    // setEditRentAmount(expectFromTenant(tenant, roomsData));
  };
  const openAddForSlot = (roomNo, bedNo) => {
    const room = roomsData.find((r) => String(r.roomNo) === String(roomNo));
    const bed = room?.beds?.find((b) => String(b.bedNo) === String(bedNo));

    // Optionally fetch SrNo if you use it
    fetchSrNo?.();

    setNewTenant((prev) => ({
      ...prev,
      roomNo: String(roomNo),
      bedNo: String(bedNo),
      floorNo: room?.floorNo ?? "",
      baseRent: bed?.price ?? "",
      rentAmount: bed?.price ?? "",
      // clear inline “other bed” form fields if you use them
      newBedNo: "",
      newBedPrice: "",
    }));
    setShowAddModal(true);
  };

  const handleDownloadExcel = () => {
    const sheetData = formData.map((item) => ({
      SrNo: item.srNo,
      Name: item.name,
      Phone: item.phoneNo,
      JoiningDate: item.joiningDate,
      RoomNo: item.roomNo,
      FloorNo: item.floorNo,
      BedNo: item.bedNo,
      DepositAmount: item.depositAmount,
      Address: item.address,
      RelativeAddress1: item.relativeAddress1,
      RelativeAddress2: item.relativeAddress2,
      CompanyAddress: item.companyAddress,
      DateOfJoiningCollege: item.dateOfJoiningCollege,
      DOB: item.dob,
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tenants");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "tenant_data.xlsx");
  };
  const getDisplayedRent = (rents = []) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

    let current = null;
    let previous = null;
    let next = null;

    // rents.forEach((rent) => {
    //   const date = new Date(rent.date);
    //   const m = date.getMonth();
    //   const y = date.getFullYear();
    rents.forEach((rent) => {
    const ym = getYMFromRecord(rent);
    if (!ym) return;
    const { m, y } = ym;
      if (m === currentMonth && y === currentYear) {
        current = rent;
      } else if (m === prevMonth && y === prevYear) {
        previous = rent;
      } else if (m === nextMonth && y === nextYear) {
        next = rent;
      }
    });

    return { previous, current, next };
  };

  // const getDisplayedRent = (rents = []) => {
  //   const now = new Date();
  //   const currentMonth = now.getMonth();
  //   const currentYear = now.getFullYear();
  //   const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  //   const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  //   const matchRent = (month, year) =>
  //     rents.find(r => {
  //       if (!r.date) return false;
  //       const d = new Date(r.date);
  //       return d.getMonth() === month && d.getFullYear() === year && Number(r.rentAmount) > 0;
  //     });

  //   const current = matchRent(currentMonth, currentYear);
  //   if (current) return { rentAmount: Number(current.rentAmount), date: current.date };

  //   const previous = matchRent(previousMonth, previousYear);
  //   if (previous) return { rentAmount: Number(previous.rentAmount), date: previous.date };

  //   const latest = rents
  //     .filter(r => Number(r.rentAmount) > 0 && r.date)
  //     .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  //   return latest ? { rentAmount: Number(latest.rentAmount), date: latest.date } : { rentAmount: 0, date: null };
  // };

  const calculateDue = (rents = [], joiningDateStr) => {
    if (!joiningDateStr) return 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1); // Jan 1 of current year
    const joinDate = new Date(joiningDateStr);
    const rentStart = new Date(
      joinDate.getFullYear(),
      joinDate.getMonth() + 1,
      1
    );

    // Determine the actual starting month (either Jan or 1 month after joining)
    const startDate = rentStart > startOfYear ? rentStart : startOfYear;

    const tempDate = new Date(startDate);
    // const paidMonths = new Set(
    //   rents
    //     .filter((r) => r.date && Number(r.rentAmount) > 0)
    //     .map((r) => {
    //       const d = new Date(r.date);
    //       return `${d.getMonth()}-${d.getFullYear()}`;
    //     })
    // );
const paidMonths = new Set(
      rents
     .filter((r) => Number(r.rentAmount) > 0)
     .map(getYMFromRecord)
     .filter(Boolean)
     .map(({ m, y }) => `${m}-${y}`)
 );
    const lastPaid = rents
      .filter((r) => r.date && Number(r.rentAmount) > 0)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    const rentAmount = lastPaid ? Number(lastPaid.rentAmount) : 0;

    let dueCount = 0;

    // Go from startDate up to the current month of the current year
    while (tempDate <= now && tempDate.getFullYear() === currentYear) {
      const key = `${tempDate.getMonth()}-${tempDate.getFullYear()}`;
      if (!paidMonths.has(key)) {
        dueCount++;
      }
      tempDate.setMonth(tempDate.getMonth() + 1);
    }

    return rentAmount * dueCount;
  };

  const handleLeave = (tenant) => {
    setCurrentLeaveId(tenant._id);
    setCurrentLeaveName(tenant.name);
    setShowLeaveModal(true);
  };
  const confirmLeave = async () => {
    if (!selectedLeaveDate) {
      alert("Please select a leave date.");
      return;
    }

    try {
      const response = await axios.post(`${apiUrl}leave`, {
        formId: currentLeaveId,
        leaveDate: selectedLeaveDate,
      });

      if (response.data?.message) {
        alert(response.data.message);
        setLeaveDates((prev) => ({
          ...prev,
          [currentLeaveId]: selectedLeaveDate,
        }));
        setShowLeaveModal(false);
      } else {
        alert("Failed to mark leave.");
      }
    } catch (err) {
      console.error("Error setting leave:", err);
    }
  };

  // const getDueMonths = (rents = [], joiningDateStr) => {
  //   if (!joiningDateStr) return [];

  //   const joiningDate = new Date(joiningDateStr);
  //   const startDate = new Date(
  //     joiningDate.getFullYear(),
  //     joiningDate.getMonth() + 1,
  //     1
  //   );
  //   const now = new Date();
  //   const currentYear = now.getFullYear();

  //   const rentMap = new Map();
  //   rents.forEach((rent) => {
  //     const d = new Date(rent.date);
  //     const key = `${d.getMonth()}-${d.getFullYear()}`;
  //     rentMap.set(key, true);
  //   });

  //   const months = [];
  //   const tempDate = new Date(startDate);

  //   while (tempDate <= now) {
  //     const year = tempDate.getFullYear();
  //     const month = tempDate.getMonth();
  //     const key = `${month}-${year}`;

  //     if (year === currentYear && !rentMap.has(key)) {
  //       months.push(
  //         tempDate.toLocaleString("default", { month: "long", year: "numeric" })
  //       );
  //     }

  //     tempDate.setMonth(tempDate.getMonth() + 1);
  //   }

  //   return months;
  // };
// Shows ALL pending months from the month AFTER joining up to the current month (across years)
// Uses getYMFromRecord so it works with { month: "Sep-25" } OR { date: "..." }
const getAllPendingMonths = (rents = [], joiningDateStr) => {
  if (!joiningDateStr) return [];

  const join = new Date(joiningDateStr);
  // start billing from the month AFTER joining
  const start = new Date(join.getFullYear(), join.getMonth() + 1, 1);

  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), 1); // current month start

  // Build a set of paid month keys "m-y" (m is 0..11)
  const paidSet = new Set(
    (Array.isArray(rents) ? rents : [])
      .filter(r => Number(r?.rentAmount) > 0)
      .map(getYMFromRecord)
      .filter(Boolean)
      .map(({ m, y }) => `${m}-${y}`)
  );

  const out = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const m = cursor.getMonth();
    const y = cursor.getFullYear();
    const key = `${m}-${y}`;
    if (!paidSet.has(key)) {
      out.push(cursor.toLocaleString("default", { month: "long", year: "numeric" }));
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out;
};

  const handleEdit = (tenant) => {
    const { rentAmount, date } = getDisplayedRent(tenant.rents);
    setEditingTenant(tenant);
    setEditRentAmount(rentAmount);
    setEditRentDate(date || new Date().toISOString().split("T")[0]);
  };

  const handleDelete = async (tenant) => {
    try {
      // Determine current month-year key, matching how backend identifies rent
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      // const monthKey = `${currentMonth}-${currentYear}`; // format to match backend

      // // Make sure you pass monthKey in URL or request body as per backend spec
      // await axios.delete(`${apiUrl}form/${tenant._id}/rent/${monthKey}`);
      // Backend expects e.g. "Apr-25"
      const opts = { month: "short" };
      const monthStr = new Date(currentYear, currentMonth, 1).toLocaleString(
        "en-US",
        opts
      );
      const yy = String(currentYear).slice(-2);
      const monthKey = `${monthStr}-${yy}`;

      await axios.delete(`${apiUrl}form/${tenant._id}/rent/${monthKey}`);

      // Refresh data after delete
      const response = await axios.get(apiUrl);
      setFormData(response.data);
    } catch (error) {
      alert(
        "Failed to delete rent: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // formupdate

  const handleUndoClick = (tenant) => {
    if (!window.confirm(`Undo archive for ${tenant.name}?`)) return;

    axios
      .post(`${apiUrl}forms/restore`, { id: tenant._id })
      .then((response) => {
        const restored = response.data;
        setDeletedData((prev) =>
          prev.filter((item) => item._id !== tenant._id)
        );
        setFormData((prev) => [...prev, restored]);
      })
      .catch((error) => {
        console.error("Error restoring tenant:", error);
        alert("Failed to restore tenant.");
      });
  };
  const handleDownloadForm = async (tenant) => {
    try {
      const response = await axios.get(`${apiUrl}form/${tenant._id}`);
      const form = response.data;

      const formatted = [
        ["Field", "Value"],
        ["Name", form.name],
        ["Joining Date", new Date(form.joiningDate).toLocaleDateString()],
        ["Room No", form.roomNo],
        ["Deposit Amount", form.depositAmount],
        [
          "Leave Date",
          form.leaveDate
            ? new Date(form.leaveDate).toLocaleDateString()
            : "N/A",
        ],
      ];

      if (form.rents && form.rents.length > 0) {
        formatted.push(["Rents", ""]);
        form.rents.forEach((rent, i) => {
          formatted.push([`Rent ${i + 1} Amount`, rent.rentAmount]);
          formatted.push([
            `Rent ${i + 1} Date`,
            new Date(rent.date).toLocaleDateString(),
          ]);
        });
      }

      const ws = XLSX.utils.aoa_to_sheet(formatted);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tenant Data");
      XLSX.writeFile(wb, `Tenant_${tenant.name}.xlsx`);
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to download tenant data.");
    }
  };

  const handleTenantUpdate = async () => {
    try {
      const response = await axios.put(
        `${apiUrl}update/${editTenantData._id}`,
        editTenantData
      );
      alert("Tenant updated successfully!");

      // Replace updated tenant in list
      setFormData((prev) =>
        prev.map((t) => (t._id === editTenantData._id ? response.data : t))
      );

      setShowEditModal(false);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update tenant.");
    }
  };

  const openDeleteConfirmation = (tenantId) => {
    setCurrentDeleteId(tenantId);
    setShowPasswordPrompt(true); // Show password modal
  };
  const verifyPassword = () => {
    if (password === correctPassword) {
      setShowPasswordPrompt(false);
      setShowDeleteConfirmation(true);
    } else {
      alert("Incorrect password. Please try again.");
    }
  };
  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`${apiUrl}form/${currentDeleteId}`);
      setFormData((prev) => prev.filter((t) => t._id !== currentDeleteId));
      alert("Tenant deleted successfully.");
      setShowDeleteConfirmation(false);
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete tenant.");
    }
  };

  // const showLastThreeRents = (tenant) => {
  //   const sortedRents = [...(tenant.rents || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  //   const lastThree = sortedRents.slice(0, 3);
  //   setSelectedRentDetails(lastThree);
  //   setSelectedTenantName(tenant.name);
  //   setShowRentModal(true);
  // };
  const showRentHistory = (tenant) => {
    const sortedRents = [...(tenant.rents || [])].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    setSelectedRentDetails(sortedRents); // 👈 full history now
    setSelectedTenantName(tenant.name);
    setShowRentModal(true);
  };

  // const handleSave = async () => {
  //   if (!editingTenant) return;
  //   try {
  //     await axios.put(`${apiUrl}form/${editingTenant._id}`, {
  //       rentAmount: editRentAmount,
  //       date: editRentDate,
  //       month: new Date(editRentDate).toLocaleString('default', { month: 'short', year: '2-digit' })
  //     });
  //     setEditingTenant(null);
  //     // window.location.reload();
  //   } catch (error) {
  //     alert('Failed to update rent');
  //   }
  // };

 const handleSave = async () => {
  if (!editingTenant) return;

  // must have month/year
  if (!(editMonthYM?.y >= 1900) || !(editMonthYM?.m >= 0)) {
    alert("Please pick a rent month before saving.");
    return;
  }

  try {
    const monthKey = fmtMonthKey(editMonthYM.y, editMonthYM.m); // "Sep-25"
    const todayISO = new Date().toISOString().split("T")[0];

    const payload = {
      rentAmount: editRentAmount,
      date: todayISO,          // store payment date as today
      month: monthKey,         // store rent month, format "Sep-25"
      paymentMode: editPaymentMode || "Cash",
    };

    await axios.put(`${apiUrl}form/${editingTenant._id}`, payload);

    // Optimistic local update (optional, you already refetch elsewhere)
    setFormData((prev) =>
      prev.map((t) =>
        t._id === editingTenant._id
          ? { ...t, rents: upsertRentForMonth(t, {
              y: editMonthYM.y, m: editMonthYM.m,
              amount: Number(editRentAmount) || 0,
              date: todayISO,
              mode: editPaymentMode || "Cash"
            })}
          : t
      )
    );

    setEditingTenant(null);
  } catch (error) {
    console.error(error);
    alert("Failed to update rent");
  }
};

  const navigate = useNavigate();
  const handleNavigation = (path) => {
    navigate(path);
  };

  const [pendingRents, setPendingRents] = useState(0);

  useEffect(() => {
    if (!formData || !formData.length) return;

    const now = new Date();
    const count = formData.filter((t) => {
      const lastRent =
        t.rents && t.rents.length ? t.rents[t.rents.length - 1] : null;
      if (!lastRent) return true;

      const rentDate = new Date(lastRent.date);
      return (
        rentDate.getMonth() !== now.getMonth() ||
        rentDate.getFullYear() !== now.getFullYear()
      );
    }).length;

    setPendingRents(count);
  }, [formData]);

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (error) return <div className="text-center text-danger mt-5">{error}</div>;

  // Filter only tenants who left in the last month or this month
  const filteredDeletedData = deletedData.filter((t) => t.leaveDate);
// --- Month helpers (use month column if available, else fall back to date) ---

// const dateStr = rec?.date
//   ? new Date(rec?.paymentDate || rec.date).toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "short",
//     })
//   : "";
// Cancel a scheduled leave (keeps tenant active)
const handleCancelLeave = async (id) => {
  const ok = window.confirm("Cancel this tenant's scheduled leave?");
  if (!ok) return;

  try {
    const res = await axios.post(`${apiUrl}cancel-leave`, { id });
    if (res.data?.success) {
      // remove the scheduled leave date locally
      setLeaveDates((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      // optional: hard-refresh the list if backend updates more fields
      await refreshTenants?.();
      alert("Leave canceled successfully.");
    } else {
      alert(res.data?.message || "Failed to cancel leave.");
    }
  } catch (err) {
    console.error("Cancel leave error:", err);
    alert(err?.response?.data?.message || "Something went wrong.");
  }
};
const startOfToday = () => {
  const d = new Date();
  d.setHours(0,0,0,0);
  return d;
};
const isTodayOrFuture = (iso) => {
  if (!iso) return false;
  const d = new Date(iso);
  d.setHours(0,0,0,0);
  return d >= startOfToday();
};

  return (
    // <div className="container-fluid py-4" style={{ fontFamily: 'Inter, sans-serif' }}>
    <div
      className="container-fluid px-4 py-3"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      <h3 className="fw-bold mb-4">Rent & Deposite Tracker</h3>
      {/* Language selector (sticky and simple) */}
      {/* <div className="d-flex align-items-center gap-2 mb-3">
        <span className="text-muted me-2">Language:</span>
        <div className="btn-group">
          <button
            className={`btn btn-sm ${
              lang === "en" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setLang("en")}
          >
            English
          </button>
          <button
            className={`btn btn-sm ${
              lang === "hi" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setLang("hi")}
          >
            हिन्दी
          </button>
          <button
            className={`btn btn-sm ${
              lang === "mr" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setLang("mr")}
          >
            मराठी
          </button>
        </div>
      </div> */}
      <div className="d-flex align-items-center mb-4 flex-wrap">
        <select
          className="form-select me-2"
          style={{ width: "150px" }}
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <div
          style={{ position: "relative", maxWidth: "300px" }}
          className="me-2"
        >
          <FaSearch
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#aaa",
              pointerEvents: "none",
              zIndex: 1,
              marginLeft: 2,
            }}
          />
          <input
            type="text"
            placeholder="  Search by Name"
            className="form-control ps-4 "
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {/* <button className="btn btn-primary me-2" onClick={openAddModal}>
    <FaPlus className="me-1" /> Add Tenant
  </button> */}
        <button
          className="btn me-2"
          style={{ backgroundColor: "#9c27b0", color: "white" }}
          onClick={() => navigate("/roommanager")}
        >
          <FaPlus className="me-1" /> Manage Rooms
        </button>

        <button
          className="btn me-2"
          style={{ backgroundColor: "#3db7b1", color: "white" }}
          onClick={openAddModal}
        >
          <FaPlus className="me-1" /> Add Tenant
        </button>

        <button
          className="btn me-2"
          style={activeTab === "light" ? style.colorA : style.colorB}
          onClick={() => {
            setActiveTab("light");
            navigate("/lightbillotherexpenses", { state: { tab: "light" } });
          }}
        >
          <FaBolt className="me-1" />
          Light Bill
        </button>

        <button
          className="btn me-2"
          style={activeTab === "other" ? style.colorA : style.colorB}
          onClick={() => {
            setActiveTab("other");
            navigate("/lightbillotherexpenses", { state: { tab: "other" } });
          }}
        >
          <FaReceipt className="me-1" />
          Other Expenses
        </button>

        <button
          className="btn me-2"
          style={style.successButton}
          onClick={handleDownloadExcel}
        >
          <FaDownload className="me-1" />
          Download Excel
        </button>

        <button
          className="btn me-2"
          style={activeTab === "light" ? style.colorA : style.colorB}
          onClick={() => setShowAddModal(true)}
        >
          <FaPlus className="me-1" />
          Add {activeTab === "light" ? "Light Bill" : "Other Expense"}
        </button>

        <button
          className="btn me-2"
          style={{ backgroundColor: "#483f3fab", color: "white" }}
          onClick={() => handleNavigation("/maindashboard")}
        >
          <FaArrowLeft className="me-1" />
          Back
        </button>
<NotificationBell apiUrl={apiUrl} onApproved={handleApprovedFromBell} />



        {/* <button className="btn btn-outline-dark">
    Logout
  </button> */}

      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-2">
          <div className="bg-white border rounded shadow-sm p-3 text-center">
            <h6 className="text-muted mb-1">Total Beds</h6>
            <h4 className="fw-bold">{formData.length}</h4>
          </div>
        </div>
        <div className="col-md-2">
          <div className="bg-white border rounded shadow-sm p-3 text-center">
            <h6 className="text-muted mb-1">Occupied</h6>
            <h4 className="fw-bold">
              {" "}
              {formData.filter((d) => !d.leaveDate).length}
            </h4>
          </div>
        </div>

        <div className="col-md-2">
          <div className="bg-white border rounded shadow-sm p-3 text-center">
            <h6 className="text-muted mb-1">Vacant</h6>
            <h4 className="fw-bold text-danger">
              {formData.filter((d) => d.leaveDate).length}
            </h4>
          </div>
        </div>
        {/* Pending Maintenance */}
        <div className="col-md-3">
          <div className="bg-white border rounded shadow-sm p-3 text-center">
            <h6 className="text-muted mb-1">Pending Rents</h6>
            <h4 className="fw-bold text-danger">{pendingRents}</h4>
          </div>

          {/* <div className="alert alert-warning mt-3">
  Pending Rents This Month: <strong>{pendingRents}</strong>
</div> */}
        </div>

        <div className="col-md-3">
          <div className="bg-white border rounded shadow-sm p-3 text-center">
            <h6 className="text-muted mb-1">Deposits</h6>
            <h4 className="fw-bold text-danger">
              {formData.filter((d) => Number(d.depositAmount) > 0).length}
            </h4>
          </div>
        </div>
      </div>

      {/* <div className="row text-center mb-4">
        <div className="col">
          <div className="border rounded p-3"><strong>Total Beds</strong><h4>{formData.length}</h4></div>
        </div>
        <div className="col">
          <div className="border rounded p-3"><strong>Occupied</strong><h4>{formData.filter(d => !d.leaveDate).length}</h4></div>
        </div>
        <div className="col">
          <div className="border rounded p-3"><strong>Vacant</strong><h4>{formData.filter(d => d.leaveDate).length}</h4></div>
        </div>
        <div className="col">
          <div className="border rounded p-3"><strong>Pending Rents</strong><h4>{formData.filter(d => calculateDue(d.rents, d.joiningDate) > 0).length}</h4></div>
        </div>
        <div className="col">
          <div className="border rounded p-3"><strong>Deposits</strong><h4>{formData.filter(d => Number(d.depositAmount) > 0).length}</h4></div>
        </div>
      </div> */}
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="fw-bold mb-3">Bed-wise Rent and Deposit Tracker</h5>

          <div className="table-responsive" style={{ overflowX: "auto" }}>
            <table className="table table-bordered align-middle">
              <thead>
                {/* Row 1: main headers — Rent spans PAGE cols */}
                <tr className="fw-semibold text-secondary">
                  <th rowSpan={2} style={{ whiteSpace: "nowrap", width: 60 }}>
                    Sr
                  </th>
                  <th rowSpan={2} style={{ minWidth: 260 }}>
                    Name
                  </th>

                  <th
                    colSpan={PAGE}
                    className="text-center"
                    style={{ minWidth: PAGE * 140 }}
                  >
                    <div className="d-flex align-items-center justify-content-center">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary me-2"
                        disabled={!canLeft}
                        onClick={goLeft}
                        title="Previous months"
                      >
                        &laquo;
                      </button>
                      <strong>Rent</strong>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary ms-2"
                        disabled={!canRight}
                        onClick={goRight}
                        title="Newer months"
                      >
                        &raquo;
                      </button>
                    </div>
                  </th>

                  <th rowSpan={2} style={{ whiteSpace: "nowrap" }}>
                    Due
                  </th>
                  <th rowSpan={2} style={{ whiteSpace: "nowrap" }}>
                    Rent Status
                  </th>
                  <th rowSpan={2} style={{ whiteSpace: "nowrap" }}>
                    Actions
                  </th>
                </tr>

                {/* Row 2: the 3 month sub-column headers */}
                <tr className="text-secondary">
                  {visibleMonths.map((m, i) => (
                    <th
                      key={`${m.y}-${m.m}-${i}`}
                      className="text-center"
                      style={{ minWidth: 140 }}
                    >
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* Occupied rows */}
                {visibleTenants.map((tenant, rowIdx) => {
                  const dueAmount = calculateDue(
                    tenant.rents,
                    tenant.joiningDate
                  );

                  return (
                    <tr key={tenant._id}>
                      {/* Sr */}
                      <td className="text-muted">{rowIdx + 1}</td>

                      {/* Name + meta */}
                      <td>
                        <div
                          style={{ cursor: "pointer", color: "#111" }}
                          onClick={() => {
                            setSelectedRowData(tenant);
                            setShowFModal(true);
                          }}
                        >
                          <div className="fw-semibold">{tenant.name}</div>

                          {/* Deposit */}
                          <small className="text-muted d-block">
                            Deposit: ₹
                            {Number(tenant.depositAmount || 0).toLocaleString(
                              "en-IN"
                            )}
                          </small>

                          {/* Phone */}
                          <div className="text-muted small">
                            {tenant.phoneNo}
                          </div>

                          {/* Room badge */}
                          <div className="d-flex align-items-center gap-2 mt-1">
                            <span
                              className="badge rounded-pill"
                              style={{
                                background: "#f7a3ad",
                                color: "#fff",
                                fontWeight: 600,
                              }}
                            >
                              {tenant.roomNo || "—"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Month cells */}
                      {visibleMonths.map((m, i) => {
                        const c = getMonthCell(tenant, m.y, m.m);
                        const extraNum = Number(c.extra || 0);

                        // hide months before joining
                        const joinDate = new Date(tenant.joiningDate);
                        const joinYM =
                          joinDate.getFullYear() * 12 + joinDate.getMonth();
                        const cellYM = m.y * 12 + m.m;
                        if (cellYM < joinYM) {
                          return (
                            <td
                              key={`${tenant._id}-${m.y}-${m.m}-${i}`}
                              className="text-center text-muted"
                            >
                              —
                            </td>
                          );
                        }

                        return (
                          <td
                            key={`${tenant._id}-${m.y}-${m.m}-${i}`}
                            className="text-center"
                          >
                            <div
                              style={{ cursor: "pointer" }}
                              // onClick={() => handleEdit(tenant)}
                              onClick={() =>
                                openEditForTenantMonth(tenant._id, m.m, m.y)
                              }
                              title="Click to edit this tenant's rent"
                            >
                              {/* Status */}
                              <span
                                className={`badge rounded-pill px-3 py-2 ${c.cls}`}
                              >
                                {c.label}
                              </span>

                              {/* Date */}
                              <div
                                className="small text-muted mt-1"
                                style={{ lineHeight: 1 }}
                              >
                                {c.dateStr}
                              </div>

                              {/* Amounts */}
                              {c.label === "Paid" && (
                                <div
                                  className="small mt-1 fw-semibold"
                                  style={{ lineHeight: 1 }}
                                >
                                  ₹{c.amountPaid.toLocaleString("en-IN")}
                                  {c.expected > c.amountPaid && (
                                    <span className="text-danger ms-1">
                                      (−₹
                                      {(
                                        c.expected - c.amountPaid
                                      ).toLocaleString("en-IN")}
                                      )
                                    </span>
                                  )}
                                </div>
                              )}

                              {c.label === "Pend" && (
                                <div
                                  className="small mt-1 fw-semibold"
                                  style={{ lineHeight: 1 }}
                                >
                                  ₹{c.amountPaid.toLocaleString("en-IN")}{" "}
                                  <span className="text-muted">
                                    / ₹{c.expected.toLocaleString("en-IN")}
                                  </span>
                                  {c.outstanding > 0 && (
                                    <div
                                      className="text-danger"
                                      style={{ lineHeight: 1 }}
                                    >
                                      Due: ₹
                                      {c.outstanding.toLocaleString("en-IN")}
                                    </div>
                                  )}
                                </div>
                              )}

                              {c.label === "Due" && (
                                <div
                                  className="small mt-1 fw-semibold text-danger"
                                  style={{ lineHeight: 1 }}
                                >
                                  {(() => {
                                    const val = toNum(c.outstanding);
                                    const fb = expectFromTenant(
                                      tenant,
                                      roomsData
                                    );
                                    return `₹${(val || fb).toLocaleString(
                                      "en-IN"
                                    )}`;
                                  })()}
                                </div>
                              )}

                              {/* Extra */}
                              {extraNum !== 0 && (
                                <div
                                  className="small mt-1 fw-semibold"
                                  style={{
                                    color: extraNum > 0 ? "#d63384" : "#198754",
                                  }}
                                >
                                  {extraNum > 0
                                    ? `+₹${extraNum.toLocaleString("en-IN")}`
                                    : `-₹${Math.abs(extraNum).toLocaleString(
                                        "en-IN"
                                      )}`}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Due total */}
                     <td
  style={{
    cursor: "pointer",
    color: dueAmount > 0 ? "red" : "inherit",
  }}
  onClick={() => {
    const dueList = getAllPendingMonths(tenant.rents, tenant.joiningDate);
    setDueMonths(dueList);
    setSelectedTenantName(tenant.name);
    setShowDueModal(true);
  }}
>
  ₹{dueAmount.toLocaleString("en-IN")}
</td>


                      {/* Overall status */}
                      {/* <td>
                        <span
                          className={`badge rounded-pill px-3 py-2 ${
                            dueAmount === 0
                              ? "bg-success"
                              : "bg-warning text-dark"
                          }`}
                          style={{
                            cursor: dueAmount > 0 ? "pointer" : "default",
                          }}
                          onClick={() => {
                            if (dueAmount > 0) {
                              const pending = getPendingMonthsForStatus(
                                tenant.rents,
                                tenant.joiningDate
                              );
                              setStatusMonths(pending);
                              setStatusTenantName(tenant.name);
                              setShowStatusModal(true);
                            }
                          }}
                        >
                          {dueAmount === 0 ? "Paid" : "Pending"}
                        </span>
                      </td> */}
<td>
  <span
    className={`badge rounded-pill px-3 py-2 ${
      dueAmount === 0 ? "bg-success" : "bg-warning text-dark"
    }`}
   // always pointer is fine
   onClick={() => {
  if (dueAmount === 0) return;
  const dueList = getAllPendingMonths(tenant.rents, tenant.joiningDate);
  setDueMonths(dueList);
  setSelectedTenantName(tenant.name);
  setShowDueModal(true);
}}
style={{ cursor: dueAmount === 0 ? "default" : "pointer" }}
   >
    {dueAmount === 0 ? "Paid" : "Pending"}
  </span>
</td>

                      {/* Actions */}
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => {
                            setEditTenantData(tenant);
                            setShowEditModal(true);
                          }}
                        >
                          <FaEdit />
                        </button>

                        <button
                          className="btn btn-sm"
                          style={{ backgroundColor: "#3db7b1", color: "white" }}
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setShowDetailsModal(true);
                          }}
                        >
                          <FaEye />
                        </button>

                        {/* <button
                          className="btn btn-sm me-2"
                          onClick={() => handleLeave(tenant)}
                          style={{ backgroundColor: "#f49f36", color: "white" }}
                        >
                          <FaSignOutAlt />
                        </button> */}
{/* Leave (schedule) */}
<button
  className="btn btn-sm me-2"
  onClick={() => handleLeave(tenant)}
  style={{ backgroundColor: "#f49f36", color: "white" }}
  title="Schedule leave"
>
  <FaSignOutAlt />
</button>

{/* Cancel Leave (only show if a leave is scheduled for today or a future date) */}
{leaveDates[tenant._id] && isTodayOrFuture(leaveDates[tenant._id]) && (
  <button
    className="btn btn-sm btn-warning me-2"
    onClick={() => handleCancelLeave(tenant._id)}
    title={`Cancel scheduled leave (${new Date(leaveDates[tenant._id]).toLocaleDateString("en-GB")})`}
  >
    <FaUndo />
  </button>
)}

                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => openDeleteConfirmation(tenant._id)}
                        >
                          <FaTrash />
                        </button>

                        {leaveDates[tenant._id] && (
                          <div
                            className="text-danger mt-1"
                            style={{ fontSize: 12 }}
                          >
                            Leave on{" "}
                            {new Date(
                              leaveDates[tenant._id]
                            ).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* Vacant rows */}
                {extraVacantSlots.map((slot, i) => {
                  const rowNumber = visibleTenants.length + i + 1;
                  const key = `${slot.roomNo}-${slot.bedNo}`;
                  return (
                    <tr key={`vacant-${key}`}>
                      <td className="text-muted">{rowNumber}</td>
                      <td>
                        <div>
                          <div className="fw-semibold text-muted">Vacant</div>
                          <div className="text-muted small">
                            Room {slot.roomNo} • Bed {slot.bedNo}{" "}
                            {slot.category ? `• ${slot.category}` : ""}
                          </div>
                          {toNum(slot.price) > 0 && (
                            <small className="text-muted d-block">
                              Base Rent: ₹
                              {toNum(slot.price).toLocaleString("en-IN")}
                            </small>
                          )}
                        </div>
                      </td>

                      {/* {visibleMonths.map((m, idx) => (
                        <td
                          key={`${key}-${m.y}-${m.m}-${idx}`}
                          className="text-center"
                        >
                          <span className="badge rounded-pill px-3 py-2 bg-danger text-white">
                            Due
                          </span>
                          {toNum(slot.price) > 0 && (
                            <div
                              className="small mt-1 fw-semibold"
                              style={{ lineHeight: 1, color: "#dc3545" }}
                            >
                              ₹{toNum(slot.price).toLocaleString("en-IN")}
                            </div>
                          )}
                        </td>
                      ))} */}
{visibleMonths.map((m, idx) => (
  <td
    key={`${key}-${m.y}-${m.m}-${idx}`}
    className="text-center text-muted"
  >
    —{/* vacant beds show no monthly status */}
  </td>
))}

                      <td>—</td>
                      <td>
                        <span className="badge rounded-pill px-3 py-2 bg-secondary">
                          Vacant
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm"
                          style={{ backgroundColor: "#3db7b1", color: "white" }}
                          onClick={() =>
                            openAddForSlot(slot.roomNo, slot.bedNo)
                          }
                        >
                          <FaPlus className="me-1" /> Add Tenant
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Leaved Tenants Section (unchanged) */}
            {deletedData.length > 0 && (
              <div className="mt-5">
                <h5 style={{ fontWeight: "bold" }}>Leaved Tenants</h5>
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th>Room No</th>
                      <th>Name</th>
                      <th>Joining Date</th>
                      <th>Leave Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeletedData.map((tenant, index) => {
                      const leaveDate = new Date(tenant.leaveDate);
                      const now = new Date();
                      const currentMonth = now.getMonth();
                      const lastMonth = (currentMonth - 1 + 12) % 12;

                      const isLastMonth =
                        leaveDate.getMonth() === lastMonth &&
                        leaveDate.getFullYear() === now.getFullYear();

                      return (
                        // <tr key={index}>
                        <tr key={tenant._id || `${tenant.roomNo}-${tenant.bedNo}-${index}`}>
                          <td>
                            {tenant.roomNo}{" "}
                            <div className="text-muted small">
                              bed {tenant.bedNo}
                            </div>
                          </td>
                          <td
                            style={{ cursor: "pointer" }}
                            onClick={() => showRentHistory(tenant)}
                          >
                            {tenant.name}
                          </td>
                          <td>
                            {new Date(tenant.joiningDate).toLocaleDateString()}
                          </td>
                          <td>
                            {new Date(tenant.leaveDate).toLocaleDateString()}
                          </td>
                          <td>
                            {isLastMonth && (
                              <button
                                className="btn btn-sm btn-success me-2"
                                onClick={() => handleUndoClick(tenant)}
                              >
                                <FaUndo />
                              </button>
                            )}
                            <button
                              className="btn btn-sm"
                              style={{
                                backgroundColor: "#416ed7d1",
                                color: "white",
                              }}
                              onClick={() => handleDownloadForm(tenant)}
                            >
                              <FaDownload />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable modal-fullscreen-md-down">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Tenant</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                />
              </div>

              <div className="modal-body">
                <div className="container-fluid">
                  <div className="row g-3">
                    {/* Sr No + Name */}
                    <div className="col-12 col-md-6">
                      <label className="form-label">Sr No</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newTenant.srNo || ""}
                        readOnly
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newTenant.name || ""}
                        onChange={(e) =>
                          setNewTenant({ ...newTenant, name: e.target.value })
                        }
                      />
                    </div>

                    {/* Phone + Address */}
                    <div className="col-12 col-md-6">
                      <label className="form-label">Phone No</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={newTenant.phoneNo || ""}
                        onChange={(e) =>
                          setNewTenant({
                            ...newTenant,
                            phoneNo: e.target.value,
                          })
                        }
                        placeholder="10-digit number"
                      />
                      {newTenant.phoneNo &&
                        !/^\d{10}$/.test(String(newTenant.phoneNo).trim()) && (
                          <small className="text-danger">
                            Enter 10-digit number
                          </small>
                        )}
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Address</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newTenant.address || ""}
                        onChange={(e) =>
                          setNewTenant({
                            ...newTenant,
                            address: e.target.value,
                          })
                        }
                        placeholder="House, Street, City"
                      />
                    </div>

                    {/* Joining + DOB */}
                    <div className="col-12 col-md-6">
                      <label className="form-label">Joining Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newTenant.joiningDate || ""}
                        onChange={(e) =>
                          setNewTenant({
                            ...newTenant,
                            joiningDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newTenant.dob || ""}
                        onChange={(e) =>
                          setNewTenant({ ...newTenant, dob: e.target.value })
                        }
                      />
                    </div>

                    {/* Relative Address + Company */}
                    <div className="col-12 col-md-6">
                      <label className="form-label">Relative Address</label>
                      <input
                        type="text"
                        className="form-control"
                        value={
                          newTenant.relativeAddress ||
                          newTenant.RelativeAddress ||
                          ""
                        }
                        onChange={(e) =>
                          setNewTenant({
                            ...newTenant,
                            relativeAddress: e.target.value,
                          })
                        }
                        placeholder="Optional single-line relative address"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        Company Address / College
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={newTenant.companyAddress || ""}
                        onChange={(e) =>
                          setNewTenant({
                            ...newTenant,
                            companyAddress: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Relatives */}
                    <div className="col-12 col-md-6">
                      <div className="border rounded p-3 h-100">
                        <h6 className="mb-3">Relative 1</h6>
                        <label className="form-label">Relation</label>
                        <select
                          className="form-select mb-2"
                          value={newTenant.relative1Relation || "Self"}
                          onChange={(e) =>
                            setNewTenant({
                              ...newTenant,
                              relative1Relation: e.target.value,
                            })
                          }
                        >
                          {[
                            "Self",
                            "Sister",
                            "Brother",
                            "Father",
                            "Husband",
                            "Mother",
                          ].map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        <label className="form-label">Name</label>
                        <input
                          type="text"
                          className="form-control mb-2"
                          placeholder="Name"
                          value={newTenant.relative1Name || ""}
                          onChange={(e) =>
                            setNewTenant({
                              ...newTenant,
                              relative1Name: e.target.value,
                            })
                          }
                        />
                        <label className="form-label">Phone</label>
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="Phone"
                          value={newTenant.relative1Phone || ""}
                          onChange={(e) =>
                            setNewTenant({
                              ...newTenant,
                              relative1Phone: e.target.value,
                            })
                          }
                        />
                        {newTenant.relative1Phone &&
                          !/^\d{10}$/.test(
                            String(newTenant.relative1Phone).trim()
                          ) && (
                            <small className="text-danger">
                              Enter 10-digit number
                            </small>
                          )}
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="border rounded p-3 h-100">
                        <h6 className="mb-3">Relative 2</h6>
                        <label className="form-label">Relation</label>
                        <select
                          className="form-select mb-2"
                          value={newTenant.relative2Relation || "Self"}
                          onChange={(e) =>
                            setNewTenant({
                              ...newTenant,
                              relative2Relation: e.target.value,
                            })
                          }
                        >
                          {[
                            "Self",
                            "Sister",
                            "Brother",
                            "Father",
                            "Husband",
                            "Mother",
                          ].map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        <label className="form-label">Name</label>
                        <input
                          type="text"
                          className="form-control mb-2"
                          placeholder="Name"
                          value={newTenant.relative2Name || ""}
                          onChange={(e) =>
                            setNewTenant({
                              ...newTenant,
                              relative2Name: e.target.value,
                            })
                          }
                        />
                        <label className="form-label">Phone</label>
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="Phone"
                          value={newTenant.relative2Phone || ""}
                          onChange={(e) =>
                            setNewTenant({
                              ...newTenant,
                              relative2Phone: e.target.value,
                            })
                          }
                        />
                        {newTenant.relative2Phone &&
                          !/^\d{10}$/.test(
                            String(newTenant.relative2Phone).trim()
                          ) && (
                            <small className="text-danger">
                              Enter 10-digit number
                            </small>
                          )}
                      </div>
                    </div>

                    {/* Room + Bed */}
                    <div className="col-12 col-md-6">
                      <label className="form-label">Room No</label>
                      <select
                        className="form-select"
                        value={newTenant.roomNo || ""}
                        onChange={(e) => {
                          const roomNo = e.target.value;
                          const selectedRoom = roomsData.find(
                            (room) => String(room.roomNo) === String(roomNo)
                          );
                          setNewTenant((prev) => ({
                            ...prev,
                            roomNo,
                            bedNo: "",
                            floorNo: selectedRoom?.floorNo || "",
                            baseRent: "",
                            rentAmount: "",
                            newBedNo: "",
                            newBedPrice: "",
                            __bedMsg: "",
                            __savingBed: false,
                          }));
                        }}
                      >
                        <option value="">Select Room</option>
                       {roomsData.map((room) => (
  <option key={`room-${room._id || room.roomNo}`} value={room.roomNo}>
    {room.roomNo} (Floor {room.floorNo})
  </option>
))}

                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label">Bed No</label>
                      <select
                        className="form-select"
                        value={newTenant.bedNo || ""}
                        onChange={(e) => {
                          const bedNo = e.target.value;
                          if (bedNo === "__other__") {
                            setNewTenant((prev) => ({
                              ...prev,
                              bedNo: "__other__",
                              baseRent: "",
                              rentAmount: "",
                              newBedNo: prev.newBedNo || "",
                              newBedPrice: prev.newBedPrice || "",
                              __bedMsg: "",
                              __savingBed: false,
                            }));
                            return;
                          }
                          const selectedRoom = roomsData.find(
                            (r) => String(r.roomNo) === String(newTenant.roomNo)
                          );
                          const selectedBed = selectedRoom?.beds.find(
                            (b) => String(b.bedNo) === String(bedNo)
                          );
                          setNewTenant((prev) => ({
                            ...prev,
                            bedNo,
                            baseRent: selectedBed?.price ?? "",
                            rentAmount: selectedBed?.price ?? "",
                            newBedNo: "",
                            newBedPrice: "",
                            __bedMsg: "",
                            __savingBed: false,
                          }));
                        }}
                        disabled={!newTenant.roomNo}
                      >
                        <option value="">
                          {newTenant.roomNo
                            ? "Select Bed"
                            : "Select a Room first"}
                        </option>
                        {roomsData
  .find((r) => String(r.roomNo) === String(newTenant.roomNo))
  ?.beds
  ?.filter((bed) => !occupiedBeds.has(`${newTenant.roomNo}-${bed.bedNo}`)) // show only vacant beds
  .map((bed) => (
    <option
      key={`bed-${newTenant.roomNo}-${bed._id || bed.bedNo}`}
      value={bed.bedNo}
    >
      {bed.bedNo} - {bed.category || "—"} - ₹{bed.price ?? "—"}
    </option>
))}


                        {!!newTenant.roomNo && (
                          <option value="__other__">
                            Other (add new bed…)
                          </option>
                        )}
                      </select>
                    </div>

                    {/* Inline "Other" Bed */}
                    {newTenant.bedNo === "__other__" && (
                      <div className="col-12">
                        <div className="mt-1 p-3 border rounded bg-light">
                          <div className="row g-2">
                            <div className="col-12 col-md-6">
                              <label className="form-label">New Bed No</label>
                              <input
                                className="form-control"
                                value={newTenant.newBedNo || ""}
                                onChange={(e) =>
                                  setNewTenant((prev) => ({
                                    ...prev,
                                    newBedNo: e.target.value,
                                    __bedMsg: "",
                                  }))
                                }
                                placeholder="e.g., B4"
                              />
                              {!(newTenant.newBedNo || "").trim() && (
                                <small className="text-danger">
                                  Bed No is required
                                </small>
                              )}
                            </div>
                            <div className="col-12 col-md-6">
                              <label className="form-label">
                                Price{" "}
                                <span className="text-muted">(optional)</span>
                              </label>
                              <input
                                type="number"
                                className="form-control"
                                value={newTenant.newBedPrice ?? ""}
                                onChange={(e) =>
                                  setNewTenant((prev) => ({
                                    ...prev,
                                    newBedPrice: e.target.value,
                                    __bedMsg: "",
                                  }))
                                }
                                placeholder="e.g., 3500 (optional)"
                                min="0"
                              />
                              {newTenant.newBedPrice !== "" &&
                                newTenant.newBedPrice != null &&
                                (Number(newTenant.newBedPrice) < 0 ||
                                  Number.isNaN(
                                    Number(newTenant.newBedPrice)
                                  )) && (
                                  <small className="text-danger">
                                    Enter a non-negative number
                                  </small>
                                )}
                            </div>
                          </div>

                          {newTenant.__bedMsg ? (
                            <div className="mt-2">
                              <small
                                className={
                                  newTenant.__bedMsg.startsWith("✔")
                                    ? "text-success"
                                    : "text-danger"
                                }
                              >
                                {newTenant.__bedMsg}
                              </small>
                            </div>
                          ) : null}

                          <div className="mt-3 d-flex gap-2 flex-wrap">
                            <button
                              type="button"
                              className="btn btn-success"
                              disabled={
                                newTenant.__savingBed ||
                                !(newTenant.newBedNo || "").trim() ||
                                (newTenant.newBedPrice !== "" &&
                                  newTenant.newBedPrice != null &&
                                  (Number(newTenant.newBedPrice) < 0 ||
                                    Number.isNaN(
                                      Number(newTenant.newBedPrice)
                                    )))
                              }
                              onClick={async () => {
                                const roomNo = newTenant.roomNo;
                                const bedNoToAdd = (
                                  newTenant.newBedNo || ""
                                ).trim();
                                const priceStr = newTenant.newBedPrice;

                                const priceProvided =
                                  priceStr !== "" && priceStr != null;
                                const priceNum = priceProvided
                                  ? Number(priceStr)
                                  : null;

                                const roomIdx = roomsData.findIndex(
                                  (r) => String(r.roomNo) === String(roomNo)
                                );
                                if (roomIdx === -1) {
                                  setNewTenant((prev) => ({
                                    ...prev,
                                    __bedMsg: "Room not found.",
                                  }));
                                  return;
                                }
                                const exists = roomsData[roomIdx].beds?.some(
                                  (b) =>
                                    String(b.bedNo).trim().toLowerCase() ===
                                    bedNoToAdd.toLowerCase()
                                );
                                if (exists) {
                                  setNewTenant((prev) => ({
                                    ...prev,
                                    __bedMsg:
                                      "A bed with this number already exists in this room.",
                                  }));
                                  return;
                                }

                                try {
                                  setNewTenant((prev) => ({
                                    ...prev,
                                    __savingBed: true,
                                    __bedMsg: "",
                                  }));
                                  const payload = { bedNo: bedNoToAdd };
                                  if (priceProvided) payload.price = priceNum;

                                  // await axios.post(
                                  //   `${apiUrl}rooms/${encodeURIComponent(
                                  //     roomNo
                                  //   )}/bed`,
                                  //   payload
                                  // );
                                  await axios.post(
                                    `${apiUrl}rooms/${encodeURIComponent(
                                      roomNo
                                    )}/bed`,
                                    payload
                                  );

                                  setRoomsData((prev) => {
                                    const copy = [...prev];
                                    const r = { ...copy[roomIdx] };
                                    r.beds = [
                                      ...(r.beds || []),
                                      {
                                        bedNo: bedNoToAdd,
                                        ...(priceProvided
                                          ? { price: priceNum }
                                          : {}),
                                      },
                                    ];
                                    copy[roomIdx] = r;
                                    return copy;
                                  });

                                  setNewTenant((prev) => ({
                                    ...prev,
                                    bedNo: bedNoToAdd,
                                    baseRent: priceProvided ? priceNum : "",
                                    rentAmount: priceProvided ? priceNum : "",
                                    newBedNo: "",
                                    newBedPrice: "",
                                    __bedMsg: "✔ Bed added successfully",
                                    __savingBed: false,
                                  }));
                                } catch (err) {
                                  console.error(err);
                                  setNewTenant((prev) => ({
                                    ...prev,
                                    __bedMsg:
                                      "Could not save the bed. Check network/API route.",
                                    __savingBed: false,
                                  }));
                                }
                              }}
                            >
                              {newTenant.__savingBed ? "Saving…" : "Add & Save"}
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() =>
                                setNewTenant((prev) => ({
                                  ...prev,
                                  bedNo: "",
                                  newBedNo: "",
                                  newBedPrice: "",
                                  __bedMsg: "",
                                  __savingBed: false,
                                }))
                              }
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Base Rent + Rent Amount */}
                    {/* <div className="col-12 col-md-6">
                      <label className="form-label">
                        Base Rent Amount (Auto-Filled)
                      </label>
                     <input
  className="form-control"
  value={newTenant.baseRent || ""}
  onChange={(e) =>
    setNewTenant((prev) => ({ ...prev, baseRent: e.target.value }))
  }
/>
                    </div> */}
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        Rent Amount (Auto-Filled)
                      </label>
                      <input
                        className="form-control"
                        value={newTenant.rentAmount || ""}
                        onChange={(e) =>
                          setNewTenant((prev) => ({
                            ...prev,
                            rentAmount: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* Deposit + DOJ */}
                    <div className="col-12 col-md-6">
                      <label className="form-label">Deposit Amount</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newTenant.depositAmount || ""}
                        onChange={(e) =>
                          setNewTenant({
                            ...newTenant,
                            depositAmount: e.target.value,
                          })
                        }
                        min="0"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        Date of Joining College / Company
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={newTenant.dateOfJoiningCollege || ""}
                        onChange={(e) =>
                          setNewTenant({
                            ...newTenant,
                            dateOfJoiningCollege: e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* Upload Docs */}
                   <div className="col-12 col-md-12">
  <label className="form-label">Upload Documents</label>
  <input
    type="file"
    className="form-control form-control-sm"
    multiple
    accept="image/*"
    onChange={handleDocsChange}
  />

  {/* ⬇️ Show chosen files with a Relation dropdown + Remove */}
  {docFiles.length > 0 && (
    <div className="mt-2">
      <ul className="list-group">
        {docFiles.map((d, i) => (
          // <li
          //   key={`${d.file?.name || "doc"}-${i}`}
          //   className="list-group-item d-flex justify-content-between align-items-center"
          // >
          <li
  key={`${d.file?.name || "doc"}-${d.file?.lastModified || "x"}-${i}`}
  className="list-group-item d-flex justify-content-between align-items-center"
>

            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted me-2">
                {d.file?.name || `Document ${i + 1}`}
              </span>

              <select
                className="form-select form-select-sm"
                value={d.relation || "Self"}
                onChange={(e) => {
                  const copy = [...docFiles];
                  copy[i] = { ...copy[i], relation: e.target.value };
                  setDocFiles(copy);
                }}
                style={{ width: 140 }}
              >
                <option value="Self">Self</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Husband">Husband</option>
                <option value="Sister">Sister</option>
                <option value="Brother">Brother</option>
              </select>
            </div>

            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={() => removeDoc(i)}
              title="Remove"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  )}

  {docMsg && (
    <small className="d-block mt-2 text-danger">
      {docMsg}
    </small>
  )}
</div>

                  </div>
                </div>
              </div>

              <div className="modal-footer d-flex flex-wrap gap-2">
                {/* NEW: Share + Import (now local handlers) */}
                {/* <button
  type="button"
  className="btn btn-outline-primary"
  onClick={handleShareAddTenantModal}
  title="Share a link that opens the tenant form page"
>
  Share Form
</button> */}

                <button
                  type="button"
                  className="btn btn-outline-dark"
                  onClick={async () => {
                    try {
                      // Build prefill from the current newTenant selection
                      const payload = {
                        name: (newTenant.name || "").trim() || undefined,
                        phoneNo: (newTenant.phoneNo || "").trim() || undefined,
                        roomNo: newTenant.roomNo || undefined,
                        bedNo:
                          newTenant.bedNo && newTenant.bedNo !== "__other__"
                            ? newTenant.bedNo
                            : undefined,
                        baseRent: newTenant.baseRent ?? undefined,
                        rentAmount:
                          newTenant.rentAmount ??
                          newTenant.baseRent ??
                          undefined,
                        depositAmount: newTenant.depositAmount ?? undefined,
                      };

                      const res = await axios.post(
                        `${apiUrl}invites`,
                        payload,
                        {
                          headers: { "X-Origin": window.location.origin },
                        }
                      );

                      const url = res.data?.url;
                      if (!url) {
                        alert("Failed to create invite link");
                        return;
                      }

                      const shareData = {
                        title: "Tenant Form (One-Time)",
                        text: "Please fill this form:",
                        url,
                      };
                      if (
                        navigator.share &&
                        (!navigator.canShare || navigator.canShare(shareData))
                      ) {
                        await navigator.share(shareData);
                      } else {
                        await navigator.clipboard.writeText(url);
                        alert("One-time link copied to clipboard.");
                      }
                    } catch (e) {
                      console.error(e);
                      alert("Could not create invite link.");
                    }
                  }}
                >
                  Share One-Time Link
                </button>

                <div className="flex-grow-1" />

                <button
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={handleAddTenantWithDocs}
                  style={{
                    backgroundColor: "rgb(94, 182, 92)",
                    color: "white",
                  }}
                >
                  <FaPlus className="me-2" /> Save Tenant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Tenant</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>

              <div className="modal-body">
                <div className="row g-3">
                  {/* Standard Inputs */}
                  {[
                    {
                      label: "Sr No",
                      key: "srNo",
                      type: "text",
                      readOnly: true,
                    },
                    { label: "Name", key: "name" },
                    { label: "Joining Date", key: "joiningDate", type: "date" },
                    {
                      label: "Deposit Amount",
                      key: "depositAmount",
                      type: "number",
                    },
                    { label: "Phone No", key: "phoneNo" },
                    { label: "Address", key: "address" },
                    { label: "Relative Address 1", key: "relativeAddress1" },
                    { label: "Relative Address 2", key: "relativeAddress2" },
                    // { label: 'Floor No', key: 'floorNo' },
                    {
                      label: "Company Address / College",
                      key: "companyAddress",
                    },
                    {
                      label: "Date of Joining College",
                      key: "dateOfJoiningCollege",
                      type: "date",
                    },
                    { label: "Date of Birth", key: "dob", type: "date" },
                  ].map(({ label, key, type = "text", readOnly = false }) => (
                    <div className="col-md-6" key={key}>
                      <label className="form-label">{label}</label>
                      <input
                        type={type}
                        className="form-control"
                        value={newTenant[key] || ""}
                        readOnly={readOnly}
                        onChange={(e) =>
                          setNewTenant({ ...newTenant, [key]: e.target.value })
                        }
                      />
                    </div>
                  ))}

                  {/* Room No Dropdown */}
                  <div className="col-md-6">
                    <label className="form-label">Room No</label>
                    <select
                      className="form-control"
                      value={newTenant.roomNo || ""}
                      onChange={(e) => {
                        const roomNo = e.target.value;
                        const selectedRoom = roomsData.find(
                          (room) => String(room.roomNo) === String(roomNo)
                        );

                        setNewTenant((prev) => ({
                          ...prev,
                          roomNo,
                          bedNo: "", // reset bed
                          floorNo: selectedRoom?.floorNo || "",
                          baseRent: "", // reset base rent too
                          rentAmount: "", // reset rent
                          newBedNo: "", // reset inline form fields (if any)
                          newBedPrice: "",
                        }));
                      }}
                    >
                      <option value="">Select Room</option>
                     {roomsData.map((room) => (
  <option key={`room-${room._id || room.roomNo}`} value={room.roomNo}>
    {room.roomNo} (Floor {room.floorNo})
  </option>
))}

                    </select>
                  </div>

                  {/* Bed No Dropdown + inline "Other" form (price optional) */}
                  <div className="col-md-6">
                    <label className="form-label">Bed No</label>
                    <select
                      className="form-control"
                      value={newTenant.bedNo || ""}
                      onChange={(e) => {
                        const bedNo = e.target.value;

                        // If "Other", switch to inline form
                        if (bedNo === "__other__") {
                          setNewTenant((prev) => ({
                            ...prev,
                            bedNo: "__other__",
                            baseRent: "",
                            rentAmount: "",
                            newBedNo: prev.newBedNo || "",
                            newBedPrice: prev.newBedPrice || "",
                          }));
                          return;
                        }

                        // Normal path: pick existing bed
                        const selectedRoom = roomsData.find(
                          (r) => String(r.roomNo) === String(newTenant.roomNo)
                        );
                        const selectedBed = selectedRoom?.beds.find(
                          (b) => String(b.bedNo) === String(bedNo)
                        );

                        setNewTenant((prev) => ({
                          ...prev,
                          bedNo,
                          baseRent: selectedBed?.price ?? "",
                          rentAmount: selectedBed?.price ?? "",
                          newBedNo: "",
                          newBedPrice: "",
                        }));
                      }}
                      disabled={!newTenant.roomNo}
                    >
                      <option value="">
                        {newTenant.roomNo
                          ? "Select Bed"
                          : "Select a Room first"}
                      </option>

                      {roomsData
                        .find(
                          (r) => String(r.roomNo) === String(newTenant.roomNo)
                        )
                        ?.beds.filter(
                          (bed) =>
                            !occupiedBeds.has(
                              `${newTenant.roomNo}-${bed.bedNo}`
                            )
                        ) // only unoccupied beds
                        .map((bed) => (
                          <option key={bed.bedNo} value={bed.bedNo}>
                            {bed.bedNo} - {bed.category || "—"} - ₹
                            {bed.price ?? "—"}
                          </option>
                        ))}

                      {!!newTenant.roomNo && (
                        <option value="__other__">Other (add new bed…)</option>
                      )}
                    </select>

                    {/* Inline "Other" form (no popup) */}
                    {newTenant.bedNo === "__other__" && (
                      <div className="mt-3 p-3 border rounded bg-light">
                        <div className="row g-2">
                          <div className="col-6">
                            <label className="form-label">New Bed No</label>
                            <input
                              className="form-control"
                              value={newTenant.newBedNo || ""}
                              onChange={(e) =>
                                setNewTenant((prev) => ({
                                  ...prev,
                                  newBedNo: e.target.value,
                                }))
                              }
                              placeholder="e.g., B4"
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label">
                              Price{" "}
                              <span className="text-muted">(optional)</span>
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              value={newTenant.newBedPrice ?? ""}
                              onChange={(e) =>
                                setNewTenant((prev) => ({
                                  ...prev,
                                  newBedPrice: e.target.value,
                                }))
                              }
                              placeholder="e.g., 3500 (optional)"
                              min="0"
                            />
                          </div>
                        </div>

                        <div className="mt-3 d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-success"
                            onClick={async () => {
                              const roomNo = newTenant.roomNo;
                              if (!roomNo) return alert("Select a Room first.");
                              const bedNoToAdd = (
                                newTenant.newBedNo || ""
                              ).trim();
                              if (!bedNoToAdd)
                                return alert("Bed No is required.");

                              // validate optional price if provided
                              let priceNum = null;
                              if (
                                newTenant.newBedPrice !== "" &&
                                newTenant.newBedPrice !== undefined &&
                                newTenant.newBedPrice !== null
                              ) {
                                priceNum = Number(newTenant.newBedPrice);
                                if (isNaN(priceNum) || priceNum < 0) {
                                  return alert(
                                    "Enter a valid non-negative price, or leave it blank."
                                  );
                                }
                              }

                              // duplicate check (within room)
                              const roomIdx = roomsData.findIndex(
                                (r) => String(r.roomNo) === String(roomNo)
                              );
                              if (roomIdx === -1)
                                return alert("Room not found.");
                              const exists = roomsData[roomIdx].beds?.some(
                                (b) =>
                                  String(b.bedNo).trim().toLowerCase() ===
                                  bedNoToAdd.toLowerCase()
                              );
                              if (exists)
                                return alert(
                                  "A bed with this number already exists in this room."
                                );

                              try {
                                // 1) persist to backend (send price only if provided)
                                const payload = { bedNo: bedNoToAdd };
                                if (priceNum !== null) payload.price = priceNum;
                                await axios.post(
                                  `/api/rooms/${encodeURIComponent(
                                    roomNo
                                  )}/beds`,
                                  payload
                                );

                                // 2) update roomsData locally
                                setRoomsData((prev) => {
                                  const copy = [...prev];
                                  const r = { ...copy[roomIdx] };
                                  r.beds = [
                                    ...(r.beds || []),
                                    {
                                      bedNo: bedNoToAdd,
                                      ...(priceNum !== null
                                        ? { price: priceNum }
                                        : {}),
                                    },
                                  ];
                                  copy[roomIdx] = r;
                                  return copy;
                                });

                                // 3) select new bed & fill rents only if price provided
                                setNewTenant((prev) => ({
                                  ...prev,
                                  bedNo: bedNoToAdd,
                                  baseRent: priceNum !== null ? priceNum : "",
                                  rentAmount: priceNum !== null ? priceNum : "",
                                  newBedNo: "",
                                  newBedPrice: "",
                                }));
                              } catch (err) {
                                console.error(err);
                                alert(
                                  "Could not save the new bed. Please try again."
                                );
                              }
                            }}
                          >
                            Add & Save
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              // cancel inline form
                              setNewTenant((prev) => ({
                                ...prev,
                                bedNo: "",
                                newBedNo: "",
                                newBedPrice: "",
                              }));
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Base Rent Amount (Auto-Filled)
                    </label>
                    <input
                      className="form-control"
                      value={newTenant.baseRent || ""}
                      readOnly
                    />
                  </div>

                  {/* Auto-Filled Rent Price */}
                  <div className="col-md-6">
                    <label className="form-label">
                      Rent Amount (Auto-Filled)
                    </label>
                    <input
                      className="form-control"
                      value={newTenant.rentAmount || ""}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  // onClick={handleAddTenant}
                  onClick={handleAddTenantWithDocs}
                  style={{
                    backgroundColor: "rgb(94, 182, 92)",
                    color: "white",
                  }}
                >
                  <FaPlus className="me-2" /> Save Tenant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDueModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Due Months for {selectedTenantName}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDueModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {dueMonths.length > 0 ? (
                  <ul className="list-group">
                    {/* {dueMonths.map((month, idx) => (
                      <li key={idx} className="list-group-item">
                        {month}
                      </li>
                    ))} */}
                    {dueMonths.map((month, idx) => (
  <li key={`${month}-${idx}`} className="list-group-item">
    {month}
  </li>
))}

                  </ul>
                ) : (
                  <p className="text-success">No dues!</p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDueModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editTenantData && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Edit Tenant - {editTenantData.name}
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {[
                  { label: "Name", key: "name" },
                  { label: "Phone", key: "phoneNo" },
                  { label: "Room No", key: "roomNo" },
                  { label: "Bed No", key: "bedNo" },
                  { label: "Deposit Amount", key: "depositAmount" },
                  { label: "Address", key: "address" },
                  { label: "Company Address", key: "companyAddress" },
                ].map((field) => (
                  <div className="mb-3" key={field.key}>
                    <label className="form-label">{field.label}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editTenantData[field.key] || ""}
                      onChange={(e) =>
                        setEditTenantData((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
                <div className="mb-3">
                  <label className="form-label">Joining Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={editTenantData.joiningDate?.split("T")[0]}
                    onChange={(e) =>
                      setEditTenantData((prev) => ({
                        ...prev,
                        joiningDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleTenantUpdate}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFModal && (
        <div
          className="modal-backdrop-custom"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1050,
          }}
          onClick={() => setShowFModal(false)} // ✅ Close on backdrop click
        >
          <div
            className="modal-dialog modal-lg"
            style={{ zIndex: 1060 }}
            onClick={(e) => e.stopPropagation()} // ❌ Prevent close when clicking inside
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Tenant Admission Form</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowFModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {selectedRowData && <FormDownload formData={selectedRowData} />}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* show details model */}

      {showDetailsModal && selectedTenant && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Tenant Details - {selectedTenant.name}
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setShowDetailsModal(false)}
                ></button>
              </div>

              <div className="modal-body">
                {/* Tabs */}
                <ul className="nav nav-tabs" id="tenantTabs" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link"
                      id="personal-tab"
                      data-bs-toggle="tab"
                      data-bs-target="#personal"
                      type="button"
                      role="tab"
                      aria-controls="personal"
                      aria-selected="false"
                    >
                      Personal Information
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className="nav-link active"
                      id="rent-tab"
                      data-bs-toggle="tab"
                      data-bs-target="#rent"
                      type="button"
                      role="tab"
                      aria-controls="rent"
                      aria-selected="true"
                    >
                      Rent History
                    </button>
                  </li>
                </ul>

                {/* Tab Content */}
                <div className="tab-content mt-3">
                  {/* Personal Info Tab */}
                  <div
                    className="tab-pane fade"
                    id="personal"
                    role="tabpanel"
                    aria-labelledby="personal-tab"
                  >
                    <h6>Personal Information</h6>
                    <ul className="list-group mb-3">
                      <li className="list-group-item">
                        Name: {selectedTenant.name}
                      </li>
                      <li className="list-group-item">
                        Room No: {selectedTenant.roomNo}
                      </li>
                      <li className="list-group-item">
                        Bed No: {selectedTenant.bedNo}
                      </li>
                      <li className="list-group-item">
                        Phone: {selectedTenant.phoneNo}
                      </li>
                      <li className="list-group-item">
                        Joining Date:{" "}
                        {selectedTenant.joiningDate
                          ? new Date(
                              selectedTenant.joiningDate
                            ).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "—"}
                      </li>
                      <li className="list-group-item">
                        Deposit: ₹
                        {Number(
                          selectedTenant.depositAmount || 0
                        ).toLocaleString("en-IN")}
                      </li>
                      <li className="list-group-item">
                        Address: {selectedTenant.address}
                      </li>
                      <li className="list-group-item">
                        Company Address: {selectedTenant.companyAddress}
                      </li>
                      <li className="list-group-item">
                        Date of Birth:{" "}
                        {selectedTenant.dob
                          ? new Date(selectedTenant.dob).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }
                            )
                          : "—"}
                      </li>
                      <li className="list-group-item">
                        Date of Joining College/Company:{" "}
                        {selectedTenant.dateOfJoiningCollege
                          ? new Date(
                              selectedTenant.dateOfJoiningCollege
                            ).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "—"}
                      </li>
                    </ul>

                    {/* Documents Section */}
                    <h6>Uploaded Documents</h6>
                    {selectedTenant.documents?.length > 0 ? (
                      <ul className="list-group mb-3">
                        {selectedTenant.documents.map((doc, i) => (
                          <li
                            key={i}
                            className="list-group-item d-flex justify-content-between align-items-center"
                          >
                            <span>
                              <strong>{doc.relation}</strong> — {doc.fileName}
                            </span>

                            <div className="btn-group">
                              {/* View Button */}
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const url = getDocHref(doc);
                                  if (!url || url === "#") {
                                    alert(
                                      "No file URL available for this document."
                                    );
                                    return;
                                  }
                                  window.open(
                                    url,
                                    "_blank",
                                    "noopener,noreferrer"
                                  );
                                }}
                              >
                                View
                              </button>

                              {/* Download Button */}
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const url = getDocHref(doc);
                                  if (!url || url === "#") {
                                    alert(
                                      "No file URL available for download."
                                    );
                                    return;
                                  }

                                  try {
                                    const response = await fetch(url, {
                                      mode: "cors",
                                    });
                                    const blob = await response.blob();

                                    const link = document.createElement("a");
                                    link.href =
                                      window.URL.createObjectURL(blob);
                                    link.download =
                                      doc.fileName || `document-${i + 1}`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    window.URL.revokeObjectURL(link.href);
                                  } catch (err) {
                                    console.error("Download failed", err);
                                    alert("Download failed. Please try again.");
                                  }
                                }}
                              >
                                Download
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted">No documents uploaded</p>
                    )}
                  </div>

                  {/* Rent History Tab */}
                  <div
                    className="tab-pane fade show active"
                    id="rent"
                    role="tabpanel"
                    aria-labelledby="rent-tab"
                  >
                    <h6>Rent History ({new Date().getFullYear()})</h6>

                    <div className="table-responsive">
                      <table className="table table-striped table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>Month</th>
                            <th>Date</th>
                            <th>Payment Mode</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
  {Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(new Date().getFullYear(), i, 1);

    // 🔄 Find the rent record for this month using getYMFromRecord
    const rent = selectedTenant.rents?.find((r) => {
      const ym = getYMFromRecord(r); // already defined above in your component
      return ym && ym.m === i && ym.y === monthDate.getFullYear();
    });

    // 📆 Billing now starts from the *joining month* (not +1)
    const joiningDate = new Date(selectedTenant.joiningDate);
    const joinMonthStart = new Date(
      joiningDate.getFullYear(),
      joiningDate.getMonth(),
      1
    );

    const today = new Date();
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const isFutureMonth = monthDate > thisMonthStart;
    const isBeforeJoinMonth = monthDate < joinMonthStart;

    return (
      // <tr key={i}>
      <tr key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`}>
        {/* Month */}
        <td>
          {monthDate.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </td>

        {/* Date */}
        <td>
          {rent
            ? new Date(rent.date || new Date(rent.y || 2000, rent.m || 0, 1))
                .toLocaleDateString()
            : "—"}
        </td>

        {/* Payment Mode */}
        <td>{rent ? rent.paymentMode || "Cash" : "—"}</td>

        {/* Amount */}
        <td>
          {rent
            ? `₹${Number(rent.rentAmount || 0).toLocaleString("en-IN")}`
            : "—"}
        </td>

        {/* Status */}
        <td>
          {isBeforeJoinMonth ? (
            <span className="badge bg-secondary">Not Applicable</span>
          ) : rent ? (
            <span className="badge bg-success">Paid</span>
          ) : isFutureMonth ? (
            <span className="badge bg-warning text-dark">Upcoming</span>
          ) : (
            <span className="badge bg-danger">Pending</span>
          )}
        </td>
      </tr>
    );
  })}
</tbody>

                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* editmodel */}
      {editingTenant && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Edit Rent for {editingTenant.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditingTenant(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Rent Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editRentAmount}
                    onChange={(e) => setEditRentAmount(e.target.value)}
                  />
                </div>

                {/* <div className="mb-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={editRentDate}
                    onChange={(e) => setEditRentDate(e.target.value)}
                  />
                </div> */}
<div className="mb-3">
  <label className="form-label">Month</label>
  <input
    type="month"
    className="form-control"
    value={
      editMonthYM.y != null && editMonthYM.m != null
        ? `${editMonthYM.y}-${String(editMonthYM.m + 1).padStart(2, "0")}`
        : ""
    }
    onChange={(e) => {
      const [yy, mm] = e.target.value.split("-").map(Number);
      if (Number.isFinite(yy) && Number.isFinite(mm)) {
        setEditMonthYM({ y: yy, m: mm - 1 });
      }
    }}
  />
  <small className="text-muted">
    This picks the **rent month**. The payment date stored will be today.
  </small>
</div>
                {/* ✅ New Payment Mode field */}
                <div className="mb-3">
                  <label className="form-label">Payment Mode</label>
                  <select
                    className="form-control"
                    value={editPaymentMode}
                    onChange={(e) => setEditPaymentMode(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingTenant(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSave}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLeaveModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Select Leave Date</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowLeaveModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <input
                  type="date"
                  className="form-control"
                  value={selectedLeaveDate}
                  onChange={(e) => setSelectedLeaveDate(e.target.value)}
                />
                <p className="mt-3">
                  Are you sure you want <strong>{currentLeaveName}</strong> to
                  leave on <strong>{selectedLeaveDate || "..."}</strong>?
                </p>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowLeaveModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={confirmLeave}>
                  Confirm Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showRentModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Last 3 Rents - {selectedTenantName}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowRentModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {selectedRentDetails.length > 0 ? (
                  <ul className="list-group">
                    {/* {selectedRentDetails.map((rent, index) => (
                      <li className="list-group-item" key={index}>
                        ₹{Number(rent.rentAmount).toLocaleString("en-IN")} –{" "}
                        {new Date(rent.date).toLocaleDateString()}
                      </li>
                    ))} */}
                    {selectedRentDetails.map((rent, index) => (
  <li
    className="list-group-item"
    key={`${Number(rent.rentAmount) || 0}-${rent.date || index}`}
  >
    ₹{Number(rent.rentAmount).toLocaleString("en-IN")} – {new Date(rent.date).toLocaleDateString()}
  </li>
))}

                  </ul>
                ) : (
                  <p>No rent data available.</p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowRentModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showPasswordPrompt && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Enter Password</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowPasswordPrompt(false)}
                ></button>
              </div>
              <div className="modal-body">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowPasswordPrompt(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={verifyPassword}>
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDeleteConfirmation && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Deletion</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowDeleteConfirmation(false)}
                ></button>
              </div>
              <div className="modal-body">
                Are you sure you want to delete this tenant?
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteConfirmation(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteConfirm}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <>
        {/* ...your existing JSX... */}
        <TenantChatbot
          formData={formData}
          roomsData={roomsData}
          leaveDates={leaveDates}
          // lang={lang}
          helpers={{
            calculateDue,
            expectFromTenant: (tenant, roomsData) =>
              expectFromTenant(tenant, roomsData),
            toNum: (v) => Number(String(v).replace(/[,₹\s]/g, "")) || 0,
          }}
          onOpenEdit={openEditForTenantMonth} // <--- NEW
        />
      </>
    </div>
  );
}
const style = {
  colorA: {
    backgroundColor: "#387fbc",
    color: "#fff",
    border: "1px solid #387fbc",
  },
  colorB: {
    backgroundColor: "#5eb65c",
    color: "#fff",
    border: "1px solid #5eb65c",
  },
  successButton: {
    backgroundColor: "#efad4d",
    color: "#fff",
    border: "1px solid #efad4d",
  },
};
export default NewComponant;