import React, { useState, useEffect, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import './Style.css';
import "../Pages/NewComponent.css";

import axios from "axios";
// import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit } from "react-icons/fa";
import { FaInfoCircle } from "react-icons/fa";
import * as XLSX from "xlsx";
import { getDocHref } from "../utils/getDocHref"; // adjust path if needed
import { FaBolt, FaReceipt, FaEye, FaTrash, FaExchangeAlt } from "react-icons/fa";

import { saveAs } from "file-saver";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
 // example icons
import StaffExpenses from "../componenet/StaffExpenses";

// or "../components/StaffExpense" if you kept it in components
import { useParams } from "react-router-dom";

import { FaThLarge } from "react-icons/fa";
 import OtherExpense from "../Pages/OtherExpense";
import LightBill from "../Pages/LightBill";
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
// 📌 New state for Aadhaar + Photo
const [selfAadharFile, setSelfAadharFile] = useState(null);
const [parentAadharFile, setParentAadharFile] = useState(null);
const [photoFile, setPhotoFile] = useState(null);
// For Staff & Other Expenses
const [showExpensesModal, setShowExpensesModal] = useState(false);
const [expensesForm, setExpensesForm] = useState({
  type: "Employee",      // Employee / Cleaning Lady / Other
  name: "",
  month: "",
  amount: "",
  notes: "",
});



const [showOtherExpenseModal, setShowOtherExpenseModal] = useState(false);






const [paid, setPaid] = useState(false);






  const [tenants, setTenants] = useState([]);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftTenant, setShiftTenant] = useState(null);
  const [shiftTargetKey, setShiftTargetKey] = useState(""); // "roomNo-bedNo"

  const [rentStart, setRentStart] = useState(null); // shared 3-month window start
  const [docs, setDocs] = useState([]);
  const [editingTenant, setEditingTenant] = useState(null);
  const [editRentAmount, setEditRentAmount] = useState("");
  const [editRentDate, setEditRentDate] = useState("");

  
  const [activeTab, setActiveTab] = useState("rent");
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
  const [openStaffModal, setOpenStaffModal] = useState(false);

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
  const [sortConfig, setSortConfig] = useState({
  column: null,      // 'sr' | 'name' | 'status' | 'due'
  direction: "asc",  // 'asc' | 'desc'
});




const [showFormModal, setShowFormModal] = useState(false);
const [formTenant, setFormTenant] = useState(null);

const openAdmissionForm = (tenant) => {
  setFormTenant(tenant);
  setShowFormModal(true);
};

const totalBeds = roomsData.reduce(
  (sum, room) => sum + (room.beds?.length || 0),
  0
);






const [quickRoom, setQuickRoom] = useState({
  category: "",
  floorNo: "",
  roomNo: "",
  bedNo: "",
  bedCategory: "",
  bedPrice: "",
});

const [addingQuickRoom, setAddingQuickRoom] = useState(false);
const [quickRoomMsg, setQuickRoomMsg] = useState("");


const addRoomFromTenantModal = async () => {
  const category = (quickRoom.category || "").trim();
  const floorNo = (quickRoom.floorNo || "").trim();
  const roomNo = (quickRoom.roomNo || "").trim();
  const bedNo = (quickRoom.bedNo || "").trim();
  const bedCategory = (quickRoom.bedCategory || "").trim();
  const bedPriceStr = quickRoom.bedPrice;

  if (!category || !floorNo || !roomNo) {
    setQuickRoomMsg("Category, Floor, Room No are required.");
    return;
  }
// ✅ helper (global for this file)
const toNum = (v) => {
  if (v === "" || v == null) return undefined;
  const n = Number(String(v).replace(/[,₹\s]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};

  const priceProvided = bedPriceStr !== "" && bedPriceStr != null;
  const bedPrice = priceProvided ? Number(bedPriceStr) : null;

  if (priceProvided && (Number.isNaN(bedPrice) || bedPrice < 0)) {
    setQuickRoomMsg("Bed Price must be 0 or a valid number.");
    return;
  }

  try {
    setAddingQuickRoom(true);
    setQuickRoomMsg("");

    // 1) create room
    const created = await axios.post(ROOMS_API, { category, floorNo, roomNo });
    const room = created.data;

    // 2) create first bed if bedNo provided
    if (bedNo) {
      await axios.post(`${ROOMS_API}/${room._id}/bed`, {
        bedNo,
        bedCategory,
        price: priceProvided ? bedPrice : null,
      });
    }

    // 3) refresh rooms list (same as your fetchRoomsData / getRooms)
    // 🔁 Use your existing function if you already have it:
    // await fetchRoomsData();
    const res = await axios.get(ROOMS_API);
    setRoomsData(res.data || []);

    // 4) auto-select this created room in tenant form
    setNewTenant((prev) => ({
      ...prev,
      roomId: room._id,         // ✅ NEW
      roomNo: room.roomNo,      // keep if your tenant schema needs roomNo
      floorNo: room.floorNo || "",
      bedNo: bedNo ? bedNo : "",
      baseRent: priceProvided ? bedPrice : "",
      rentAmount: priceProvided ? bedPrice : "",
      newBedNo: "",
      newBedPrice: "",
      __bedMsg: "",
      __savingBed: false,
    }));

    setQuickRoom({
      category: "",
      floorNo: "",
      roomNo: "",
      bedNo: "",
      bedCategory: "",
      bedPrice: "",
    });

    setQuickRoomMsg("✔ Room created successfully");
  } catch (err) {
    console.error("addRoomFromTenantModal error:", err.response?.data || err);
    setQuickRoomMsg(err.response?.data?.message || "Failed to create room.");
  } finally {
    setAddingQuickRoom(false);
  }
};







const [inviteToken, setInviteToken] = useState(null);









const [staffExpenses, setStaffExpenses] = useState([]);


const [formId, setFormId] = useState(null);


const fetchStaffExpenses = async () => {
  try {
    const res = await fetch(" http://localhost:8000/api/staff-expense/all");
    const data = await res.json();
    // if you have list state like setStaffExpenses, update it here
    // setStaffExpenses(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error(e);
  }
};

const handleSaveStaffExpense = async () => {
  try {
    if (!expensesForm.type) return alert("Select Expense Type");
    if (!expensesForm.name?.trim()) return alert("Enter Name");
    if (!expensesForm.month) return alert("Select Month");
    if (!expensesForm.amount || Number(expensesForm.amount) <= 0)
      return alert("Enter Amount");

    const bodyData = {
      type: expensesForm.type,
      name: expensesForm.name.trim(),
      amount: Number(expensesForm.amount),
      notes: expensesForm.notes || "",
      status: expensesForm.status || "pending",
      date: `${expensesForm.month}-01`, // store as YYYY-MM-01 (like LightBill)
    };

    const res = await fetch(" http://localhost:8000/api/staff-expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Failed to save");

    alert("Expense saved!");
    setShowExpensesModal(false);

    setExpensesForm({
      type: "Employee",
      name: "",
      month: "",
      amount: "",
      notes: "",
      status: "pending",
    });

    // refresh list/table if you are showing it
    fetchStaffExpenses();
  } catch (err) {
    alert(err.message);
  }
};









//===========================================================

// ✅ helper: key for occupied bed (roomId-bedNo)
const normRoomNo = (v) =>
  String(v ?? "")
    .trim()
    .split(/[ (]/)[0]; // "102 (Floor 2)" -> "102"

const normBedNo = (v) =>
  String(v ?? "")
    .trim()
    .split(/\s*-\s*|\s+/)[0]; // "1 - lower" -> "1"

const occKey = (roomNo, bedNo) => `${normRoomNo(roomNo)}-${normBedNo(bedNo)}`;

// ✅ use tenants if present else formData (safe)
const occupiedBeds = useMemo(() => {
  const list = (tenants && tenants.length ? tenants : formData) || [];
  const s = new Set();

  list.forEach((t) => {
    if (t.leaveDate) return;

    // prefer roomNo directly; if only roomId exists, map it to roomNo using roomsData
    let roomNo = t.roomNo;
    if (!roomNo) {
      const rid = t.roomId?._id || t.roomId || t.room?._id || t.room;
      const rm = roomsData?.find((r) => String(r._id) === String(rid));
      roomNo = rm?.roomNo;
    }

    const bedNo = t.bedNo;

    if (roomNo && bedNo != null && String(bedNo).trim() !== "") {
      s.add(occKey(roomNo, bedNo));
    }
  });

  return s;
}, [tenants, formData, roomsData]);

// ✅ ONE source of truth: occupied beds (roomNo-bedNo)
const makeOccKey = (roomNo, bedNo) =>
  `${String(roomNo ?? "").trim()}-${String(bedNo ?? "").trim()}`;

const occupiedBedSet = useMemo(() => {
  const s = new Set();
  (formData || []).forEach((t) => {
    if (t.leaveDate) return; // ignore left tenants
    const roomNo = t.roomNo;
    const bedNo = t.bedNo;
    if (String(roomNo ?? "").trim() && String(bedNo ?? "").trim()) {
      s.add(makeOccKey(roomNo, bedNo));
    }
  });
  return s;
}, [formData]);

const roomHasVacantBed = (room) => {
  const roomNo = room?.roomNo;
  return (room?.beds || []).some(
    (bed) => !occupiedBedSet.has(makeOccKey(roomNo, bed?.bedNo))
  );
};






























const handleSort = (column) => {
  setSortConfig((prev) => {
    if (prev.column === column) {
      // same column → toggle asc/desc
      return {
        column,
        direction: prev.direction === "asc" ? "desc" : "asc",
      };
    }
    // new column → start with asc
    return { column, direction: "asc" };
  });
};

const renderSortIcon = (column) => {
  if (sortConfig.column !== column) {
    // neutral icon when this column is not sorted
    return <span style={{ fontSize: 11, opacity: 0.5, marginLeft: 4 }}>↕</span>;
  }

  return sortConfig.direction === "asc" ? (
    <span style={{ fontSize: 11, marginLeft: 4 }}>▲</span>
  ) : (
    <span style={{ fontSize: 11, marginLeft: 4 }}>▼</span>
  );
};

// for Rent status (Pending / Paid)
const getStatusWeight = (status) => {
  if (!status) return 99;
  const s = String(status).toLowerCase();
  if (s.startsWith("pend")) return 0; // Pending
  if (s.startsWith("paid")) return 1; // Paid
  return 2;
};

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



const existingForm = formData?.find(
  (f) => String(f.roomNo) === String(newTenant.roomNo) && String(f.bedNo) === String(newTenant.bedNo)
);



  const apiUrl = " http://localhost:8000/api/";

const ROOMS_API = `${apiUrl}rooms`;

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


const [invToken, setInvToken] = useState("");
const [invLoading, setInvLoading] = useState(false);
const [invError, setInvError] = useState("");

const [form, setForm] = useState({}); // only if you really need setForm

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
      "/mutakegirlshostel/tenant-intake",
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
  // const handleShareAddTenantModal = React.useCallback(async () => {
  //   // basic validation
  //   if (
  //     !newTenant.roomNo ||
  //     !newTenant.bedNo ||
  //     newTenant.bedNo === "__other__"
  //   ) {
  //     alert("Please select a Room and a Bed before sharing the form.");
  //     return;
  //   }

  //   const url = buildTenantFormUrl();
  //   const shareData = {
  //     title: "Tenant Form",
  //     text: "Please fill out this tenant form:",
  //     url,
  //   };

  //   const copyFallback = async () => {
  //     try {
  //       await navigator.clipboard.writeText(url);
  //       alert("Form link copied to clipboard. Share it with the tenant.");
  //     } catch {
  //       const ta = document.createElement("textarea");
  //       ta.value = url;
  //       document.body.appendChild(ta);
  //       ta.select();
  //       document.execCommand("copy");
  //       document.body.removeChild(ta);
  //       alert("Could not open share dialog. Link copied to clipboard instead.");
  //     }
  //   };

  //   try {
  //     if (navigator.share) {
  //       if (
  //         typeof navigator.canShare === "function" &&
  //         !navigator.canShare(shareData)
  //       ) {
  //         return copyFallback();
  //       }
  //       await navigator.share(shareData);
  //     } else {
  //       await copyFallback();
  //     }
  //   } catch (err) {
  //     console.error("Share failed:", err);
  //     await copyFallback();
  //   }
  // }, [buildTenantFormUrl, newTenant.roomNo, newTenant.bedNo]);
const params = new URLSearchParams(window.location.search);
const token = params.get("inv");

useEffect(() => {
  const loadInvite = async () => {
    const res = await axios.get(`${apiUrl}invites/${token}`);
    setFormId(res.data.formId);       // ✅ needed for update
    setForm((p) => ({ ...p, ...(res.data.prefill || {}) }));
  };
  if (token) loadInvite();
}, [token]);


useEffect(() => {
  const token = new URLSearchParams(window.location.search).get("inv");
  if (!token) return;

  setInvToken(token);

  (async () => {
    try {
      setInvLoading(true);
      setInvError("");

      const r = await axios.get(` http://localhost:8000/api/invites/${token}`);
      setFormId(r.data?.formId);
      setNewTenant((p) => ({ ...p, ...(r.data?.prefill || {}) }));
    } catch (e) {
      console.error(e);
      setInvError("Invalid/expired link.");
    } finally {
      setInvLoading(false);
    }
  })();
}, []);




const handleShareAddTenantModal = React.useCallback(async () => {
  // basic validation
  if (!newTenant.roomNo || !newTenant.bedNo || newTenant.bedNo === "__other__") {
    alert("Please select a Room and a Bed before sharing the form.");
    return;
  }

  try {
    // ✅ Create invite + draft form in DB (ONE time)
    const payload = {
      name: (newTenant.name || "").trim(),
      phoneNo: (newTenant.phoneNo || "").trim(),
      roomNo: newTenant.roomNo,
      bedNo: newTenant.bedNo,
      joiningDate: newTenant.joiningDate || new Date().toISOString().slice(0, 10), // ensure exists
      baseRent: newTenant.baseRent ?? "",
      rentAmount: newTenant.rentAmount ?? newTenant.baseRent ?? "",
      depositAmount: newTenant.depositAmount ?? "",
    };

    const res = await axios.post(`${apiUrl}invites`, payload, {
      headers: { "X-Origin": window.location.origin },
    });
setFormId(res.data?.formId || null);

setFormId(res.data?.formId || null);
setInviteToken(res.data?.token || null);
    const url = res.data?.url;
    if (!url) {
      alert("Failed to create invite link");
      return;
    }

    const shareData = {
      title: "Tenant Form",
      text: "Please fill out this tenant form:",
      url,
    };

    const copyFallback = async () => {
      await navigator.clipboard.writeText(url);
      alert("Form link copied to clipboard. Share it with the tenant.");
    };

    if (navigator.share) {
      if (typeof navigator.canShare === "function" && !navigator.canShare(shareData)) {
        await copyFallback();
        return;
      }
      await navigator.share(shareData);
    } else {
      await copyFallback();
    }
  } catch (err) {
    console.error("Share failed:", err.response?.data || err);
    alert(err.response?.data?.message || "Share failed. Check console.");
  }
}, [newTenant]);


































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
  // const API_ORIGIN = process.env.REACT_APP_API_ORIGIN || " http://localhost:8000";

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
// const handleAddTenantWithDocs = async () => {
//   try {
//     setDocMsg("");

//     if (!selfAadharFile || !parentAadharFile) {
//       setDocMsg("Please upload both Self and Parent Aadhaar cards.");
//       return;
//     }

//     // ✅ REQUIRED BY YOUR SCHEMA
//     const srNo = Number(newTenant.srNo);
//     const rentAmount = Number(
//       newTenant.rentAmount ?? newTenant.baseRent ?? 0
//     );
//     const depositAmount = Number(newTenant.depositAmount ?? 0);

//     if (!Number.isFinite(srNo) || srNo <= 0) {
//       setDocMsg("Sr No is required (must be a valid number).");
//       return;
//     }

//     if (!Number.isFinite(rentAmount) || rentAmount <= 0) {
//       setDocMsg("Rent Amount is required (must be a valid number).");
//       return;
//     }

//     if (!newTenant.joiningDate) {
//       setDocMsg("Joining Date is required.");
//       return;
//     }

//     const formData = new FormData();

//     // ✅ MUST SEND
//     formData.append("srNo", String(srNo));
//     formData.append("rentAmount", String(rentAmount)); // backend will convert to rents[0]
//     formData.append("depositAmount", String(depositAmount));

//     // Existing fields
//     formData.append("name", newTenant.name || "");
//     formData.append("phoneNo", newTenant.phoneNo || "");
//     formData.append("address", newTenant.address || "");
//     formData.append("joiningDate", newTenant.joiningDate);

//     // Optional fields
//     if (newTenant.dob) formData.append("dob", newTenant.dob);
//     if (newTenant.dateOfJoiningCollege)
//       formData.append("dateOfJoiningCollege", newTenant.dateOfJoiningCollege);
//     if (newTenant.relativeAddress)
//       formData.append("relativeAddress", newTenant.relativeAddress);
//     if (newTenant.companyAddress)
//       formData.append("companyAddress", newTenant.companyAddress);

//     // Relatives
//     formData.append("relative1Relation", newTenant.relative1Relation || "Self");
//     formData.append("relative1Name", newTenant.relative1Name || "");
//     formData.append("relative1Phone", newTenant.relative1Phone || "");

//     formData.append("relative2Relation", newTenant.relative2Relation || "Self");
//     formData.append("relative2Name", newTenant.relative2Name || "");
//     formData.append("relative2Phone", newTenant.relative2Phone || "");

//     // Room/Bed
//     formData.append("roomNo", newTenant.roomNo || "");
//     if (newTenant.bedNo && newTenant.bedNo !== "__other__") {
//       formData.append("bedNo", newTenant.bedNo);
//     }

//     // Files
//     formData.append("selfAadhar", selfAadharFile);
//     formData.append("parentAadhar", parentAadharFile);
//     if (photoFile) formData.append("photo", photoFile);

//     // ✅ API Call
//     const res = await axios.post(
//       " http://localhost:8000/api/tenant/with-docs",
//       formData
//       // ✅ NOTE: you can omit Content-Type, axios sets boundary automatically
//     );

//     alert("Tenant saved successfully.");
//     console.log("Saved tenant:", res.data);

//     // Reset
//     setSelfAadharFile(null);
//     setParentAadharFile(null);
//     setPhotoFile(null);
//     setDocMsg("");
//     setShowAddModal(false);
//   } catch (err) {
//     console.error("Failed to save tenant:", err.response?.data || err);
//     setDocMsg(
//       err.response?.data?.message || "Could not save tenant. Please check server."
//     );
//   }
// };


// const formId = params?.id; // SAFE


const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];


const handleAddTenantWithDocs = async () => {
  try {
    setDocMsg("");

    const isInviteFlow = !!invToken;

    if (isInviteFlow && !formId) {
      setDocMsg("Link is loading. Please wait 2 seconds and try again.");
      return;
    }

    const rentAmount = Number(newTenant.rentAmount ?? newTenant.baseRent ?? 0);
    const depositAmount = Number(newTenant.depositAmount ?? 0);

    if (!Number.isFinite(rentAmount) || rentAmount <= 0) {
      setDocMsg("Rent Amount is required (must be a valid number).");
      return;
    }

    if (!newTenant.joiningDate) {
      setDocMsg("Joining Date is required.");
      return;
    }

    // ✅ required by your schema
    const paymentMode = "Cash";
    const j = new Date(newTenant.joiningDate);
    const nextMonth = new Date(j.getFullYear(), j.getMonth() + 1, 1);
    const month = fmtMonthKey(nextMonth.getFullYear(), nextMonth.getMonth());

    const fd = new FormData(); // ✅ use fd everywhere

    if (isInviteFlow) {
      if (formId) fd.append("formId", formId);
      if (invToken) fd.append("inv", invToken);
    }

    fd.append("rentAmount", String(rentAmount));
    fd.append("depositAmount", String(depositAmount));

    fd.append("paymentMode", paymentMode);
    fd.append("month", month);

    fd.append("name", newTenant.name || "");
    fd.append("phoneNo", newTenant.phoneNo || "");
    fd.append("address", newTenant.address || "");
    fd.append("joiningDate", newTenant.joiningDate);

    if (newTenant.dob) fd.append("dob", newTenant.dob);
    if (newTenant.dateOfJoiningCollege) fd.append("dateOfJoiningCollege", newTenant.dateOfJoiningCollege);
    if (newTenant.companyAddress) fd.append("companyAddress", newTenant.companyAddress);

    fd.append("relative1Relation", newTenant.relative1Relation || "Self");
    fd.append("relative1Name", newTenant.relative1Name || "");
    fd.append("relative1Phone", newTenant.relative1Phone || "");

    fd.append("relative2Relation", newTenant.relative2Relation || "Self");
    fd.append("relative2Name", newTenant.relative2Name || "");
    fd.append("relative2Phone", newTenant.relative2Phone || "");

    fd.append("roomNo", newTenant.roomNo || "");
    if (newTenant.bedNo && newTenant.bedNo !== "__other__") fd.append("bedNo", newTenant.bedNo);

    const cat = (newTenant.category || existingForm?.category || "").trim();
    if (cat) fd.append("category", cat);

    if (selfAadharFile) { fd.append("documents", selfAadharFile); fd.append("relations", "Self"); }
    if (parentAadharFile) { fd.append("documents", parentAadharFile); fd.append("relations", "Father"); }
    if (photoFile) { fd.append("documents", photoFile); fd.append("relations", "Self"); }

    // ✅ safe URL build (won’t affect other code)
    const API_ROOT = String(apiUrl).replace(/\/+$/, "");
    const FORMS_WITH_DOCS_URL = API_ROOT.endsWith("/api")
      ? `${API_ROOT}/forms-with-docs`
      : `${API_ROOT}/api/forms-with-docs`;

    console.log("POST =>", FORMS_WITH_DOCS_URL);

    const res = await axios.post(FORMS_WITH_DOCS_URL, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    alert("Tenant saved successfully.");
    console.log("Saved tenant:", res.data);

    setSelfAadharFile(null);
    setParentAadharFile(null);
    setPhotoFile(null);
    setDocMsg("");
    setShowAddModal(false);
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const msg =
      data?.message ||
      data?.error ||
      (typeof data === "string" ? data.slice(0, 200) : "") ||
      err?.message ||
      "Request failed";

    console.error("SAVE TENANT ERROR =>", { status, data, err });
    setDocMsg(`(${status || "NO_RESPONSE"}) ${msg}`);
  }
};








// async function handleAddTenantWithDocs() {
//   // ✅ Required-field guard (before any uploads or POSTs)
//   const missing = [];
//   if (!newTenant.name?.trim()) missing.push("Name");
//   if (!newTenant.joiningDate)   missing.push("Joining Date");
//   if (!newTenant.roomNo)        missing.push("Room No");
//   if (!newTenant.bedNo || newTenant.bedNo === "__other__") missing.push("Bed No");

//   // Optional: soft validation for phone and deposit
//   if (newTenant.phoneNo && !/^\d{10}$/.test(String(newTenant.phoneNo).trim())) {
//     alert("Phone No must be a 10-digit number.");
//     return;
//   }
//   if (newTenant.depositAmount !== "" && newTenant.depositAmount != null) {
//     const dep = Number(String(newTenant.depositAmount).replace(/[,₹\s]/g, ""));
//     if (!Number.isFinite(dep) || dep < 0) {
//       alert("Deposit Amount must be a non-negative number.");
//       return;
//     }
//   }

//   if (missing.length) {
//     alert(`Please fill: ${missing.join(", ")}`);
//     return;
//   }

//   try {
//     let uploaded = [];

//     // ⬇️ your existing upload block (unchanged)
//     if (docFiles.length) {
//       const fd = new FormData();
//       docFiles.forEach((d) => {
//         fd.append("documents", d.file); // field name MUST be "documents" on server Multer
//       });

//       const up = await axios.post(`${apiUrl}uploads/docs`, fd, {
//         headers: { "Content-Type": "multipart/form-data" },
//       });

//       const uploadedFiles = up.data?.files || [];
//       uploaded = uploadedFiles.map((f, i) => ({
//         fileName: docFiles[i]?.file?.name || f.filename || `doc-${i + 1}`,
//         relation: docFiles[i]?.relation || "Self",
//         url:
//           f.url ||
//           f.path ||
//           f.location ||
//           f.secure_url ||
//           (f._id ? `${apiUrl}documents/${f._id}` : "#"),
//       }));
//     }

//     const rawPayload = {
//       ...newTenant,
//       documents: uploaded,
//     };
//     const payload = sanitizeTenantPayload(rawPayload);

//     console.log("🚀 Payload sending:", payload);

//     await axios.post(`${apiUrl}forms`, payload);

//     setShowAddModal(false);

//     // const tenantsRes = await axios.get(`${apiUrl}forms`);
//     // setTenants(tenantsRes.data);
//        // 🔄 refresh main table data
//    await refreshTenants();
//   } catch (err) {
//     logAxiosError(err, "handleAddTenantWithDocs");
//     const msg = err?.response?.data?.message || err.message;
//     if (/E11000/i.test(msg)) {
//       alert("Sr No already exists. Close and reopen Add Tenant to get a fresh Sr No.");
//     } else {
//       alert(msg || "Failed to save tenant");
//     }
//   }
// }


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

  //       const up = await axios.post(" http://localhost:8000/api/uploads/docs", fd, {
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

  //     const res = await axios.post(" http://localhost:8000/api/forms", payload);
  //     console.log("Saved:", res.data);

  //     setShowAddModal(false);

  //     // refresh list
  //     const tenantsRes = await axios.get(" http://localhost:8000/api/forms");
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
  // 1️⃣ Always prefer NEW updated bed/room price from roomsData
  if (roomsData && tenant?.roomNo && tenant?.bedNo) {
    const room = roomsData.find(
      (r) => String(r.roomNo) === String(tenant.roomNo)
    );

    const bed = room?.beds?.find(
      (b) => String(b.bedNo) === String(tenant.bedNo)
    );
console.log("ROOM FOUND BED PRICE →", bed?.price, bed);
    const updatedPrice =
      toNum(bed?.price) ||
      toNum(bed?.baseRent) ||
      toNum(bed?.monthlyRent);

    if (updatedPrice) return updatedPrice; // ⭐ THIS WILL NOW RETURN 4000
  }

  // 2️⃣ If room price is not found, fallback to tenant stored values
  return (
    toNum(tenant?.baseRent) ||
    toNum(tenant?.rent) ||
    toNum(tenant?.rentAmount) ||
    toNum(tenant?.expectedRent) ||
    toNum(tenant?.defaultRent) ||
    toNum(tenant?.monthlyRent) ||
    toNum(tenant?.price) ||
    toNum(tenant?.bedPrice) ||
    0
  );
};










const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

const clampDate = (y, m, day) => {
  const d = Math.min(day, daysInMonth(y, m));
  return new Date(y, m, d);
};


  // Single source of truth for a month cell
const getMonthCell = (tenant, y, m) => {
  // Find record for this cell month
  const rec = (tenant.rents || []).find((r) => {
    const ym = getYMFromRecord(r);
    return ym && ym.y === y && ym.m === m;
  });

  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth();

  const cellKey = y * 12 + m;
  const curKey = curY * 12 + curM;

  // ✅ Billing day = joining date day (19, 5, etc.)
  const join = tenant?.joiningDate ? new Date(tenant.joiningDate) : null;
  const billingDay = join ? join.getDate() : 1;

  // helpers (can keep here or move outside)
  const fmtDM = (d) =>
    d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

  const clampDueDate = (yy, mm, dueDay) => {
    const lastDay = new Date(yy, mm + 1, 0).getDate();
    return new Date(yy, mm, Math.min(dueDay, lastDay));
  };

  // ✅ Due date string for this cell month (ex: 12 Jan)
  const dueDate = clampDueDate(y, m, billingDay);
  const dueDateStr = fmtDM(dueDate);

  // ✅ "Cycle end" for current month = currentMonth + billingDay (clamped)
  const curCycleEnd = clampDate(curY, curM, billingDay);

  // ✅ Past logic (your existing)
  const isPast =
    cellKey < curKey ? true : cellKey > curKey ? false : now >= curCycleEnd;

  const isCurrent = cellKey === curKey;
  const isFuture = cellKey > curKey;

  // ✅ rent starts from next month after joining (not in same joining month)
  const rentStart = join
    ? new Date(join.getFullYear(), join.getMonth() + 1, 1)
    : null;
  const cellStart = new Date(y, m, 1);
  const beforeRentStart = rentStart ? cellStart < rentStart : false;

  // extras
  const extra =
    toNum(rec?.extraAmount) +
    toNum(rec?.extra) +
    toNum(rec?.lateFee) +
    toNum(rec?.maintenance) +
    toNum(rec?.adjustment) +
    toNum(rec?.electricityExtra);

  const expectedBase =
    toNum(rec?.expectedRent) ||
    toNum(rec?.monthRent) ||
    toNum(rec?.rentExpected) ||
    toNum(rec?.baseRent) ||
    toNum(rec?.price) ||
    expectFromTenant(tenant, roomsData);

  const expected = beforeRentStart ? 0 : expectedBase + extra;

  const amountPaid = toNum(rec?.rentAmount);
  const outstanding = beforeRentStart ? 0 : Math.max(0, expected - amountPaid);

  // ✅ keep paid date as-is; if missing, we'll fallback to dueDateStr for Due/Upcoming
  let dateStr = rec?.date
    ? new Date(rec?.paymentDate || rec.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      })
    : "";

  // 0) Before rent start => blank
  if (beforeRentStart) {
    return {
      label: "",
      cls: "",
      dateStr: "",
      extra: 0,
      amountPaid: 0,
      expected: 0,
      outstanding: 0,
      isPast,
      isCurrent,
      isFuture,
      beforeRentStart: true,
    };
  }

  // 1) No record
  if (!rec) {
    if (isPast) {
      return {
        label: "Due",
        cls: "",
        dateStr: dueDateStr, // ✅ show due date
        extra,
        amountPaid: 0,
        expected,
        outstanding: expected,
        isPast,
        isCurrent,
        isFuture,
        beforeRentStart: false,
      };
    }
    return {
      label: "Upcoming",
      cls: "",
      dateStr: dueDateStr, // ✅ show upcoming due date
      extra,
      amountPaid: 0,
      expected,
      outstanding: expected,
      isPast,
      isCurrent,
      isFuture,
      beforeRentStart: false,
    };
  }

  // 2) Record exists but nothing paid
  if (amountPaid <= 0) {
    if (isPast) {
      return {
        label: "Due",
        cls: "",
        dateStr: dateStr || dueDateStr, // ✅ fallback to due date if payment date missing
        extra,
        amountPaid,
        expected,
        outstanding,
        isPast,
        isCurrent,
        isFuture,
        beforeRentStart: false,
      };
    }
    return {
      label: "Upcoming",
      cls: "",
      dateStr: dateStr || dueDateStr, // ✅ fallback
      extra,
      amountPaid,
      expected,
      outstanding,
      isPast,
      isCurrent,
      isFuture,
      beforeRentStart: false,
    };
  }

  // 3) Partial
  if (outstanding > 0) {
    return {
      label: "Pend",
      cls: "",
      dateStr: dateStr || dueDateStr, // optional fallback (safe)
      extra,
      amountPaid,
      expected,
      outstanding,
      isPast,
      isCurrent,
      isFuture,
      beforeRentStart: false,
    };
  }

  // 4) Paid
  return {
    label: "Paid",
    cls: "",
    dateStr: dateStr || dueDateStr, // optional fallback
    extra,
    amountPaid,
    expected,
    outstanding: 0,
    isPast,
    isCurrent,
    isFuture,
    beforeRentStart: false,
  };
};

const getTenantDueTotal = (tenant, monthsArr) => {
  return (monthsArr || []).reduce((sum, m) => {
    const c = getMonthCell(tenant, m.y, m.m);

    // ignore months before rent start (joining month etc.)
    if (!c || c.beforeRentStart) return sum;

    // ✅ ONLY past months can be "Due"
    const isRealDue =
      c.isPast && (c.label === "Due" || c.label === "Pend");

    return sum + (isRealDue ? Number(c.outstanding || 0) : 0);
  }, 0);
};


// Rent status for sorting (uses CURRENT month)
const getRentStatusLabelForSort = (tenant) => {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const cell = getMonthCell(tenant, y, m);   // Paid / Pend / Due
  return cell?.label || "";                  // string like "Paid", "Pend", "Due"
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
  // useEffect(() => {
  //   axios
  //     .get(`${apiUrl}forms/archived`)
  //     .then((response) => setDeletedData(response.data))
  //     .catch((err) => console.error("Error fetching archived tenants:", err));
  // }, []);
  // useEffect(() => {
  //   axios
  //     .get(" http://localhost:8000/api/rooms")
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

const occupiedBedsSet = new Set(
  formData
    .filter((t) => !t.leaveDate)
    .map((t) => `${String(t.roomNo).trim()}-${String(t.bedNo).trim()}`)
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
  // const paid = new Set(
  //   (Array.isArray(rents) ? rents : [])
  //     .filter((r) => Number(r?.rentAmount) > 0)
  //     .map(getYMFromRecord)
  //     .filter(Boolean)
  //     .map(({ m, y }) => `${m}-${y}`)
  // );

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


const filteredDeletedData = useMemo(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (formData || []).filter((t) => {
    if (!t.leaveDate) return false;

    const d = new Date(t.leaveDate);
    d.setHours(0, 0, 0, 0);

    return d <= today; // already left
  });
}, [formData]);



const futureOnLeaveTenants = useMemo(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (formData || []).filter((t) => {
    if (!t.isOnLeave || !t.leaveDate) return false;

    const leaveDate = new Date(t.leaveDate);
    leaveDate.setHours(0, 0, 0, 0);

    return leaveDate > today; // 🔥 FUTURE leave only
  });
}, [formData]);



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
const calculateDue = (rents = [], joiningDateStr, tenant, roomsData) => {
  if (!joiningDateStr) return 0;

  // 1️⃣ Always use UPDATED RENT
  const updatedRent = expectFromTenant(tenant, roomsData);

  const now = new Date();
  const currentYear = now.getFullYear();

  const joinDate = new Date(joiningDateStr);
  const rentStart = new Date(
    joinDate.getFullYear(),
    joinDate.getMonth() + 1,
    1
  );

  const startOfYear = new Date(currentYear, 0, 1);
  const startDate = rentStart > startOfYear ? rentStart : startOfYear;

  const paidMonths = new Set(
    (rents || [])
      .filter((r) => Number(r.rentAmount) > 0)
      .map(getYMFromRecord)
      .filter(Boolean)
      .map(({ m, y }) => `${m}-${y}`)
  );

  let tempDate = new Date(startDate);
  let dueCount = 0;

  while (tempDate <= now && tempDate.getFullYear() === currentYear) {
    const key = `${tempDate.getMonth()}-${tempDate.getFullYear()}`;

    if (!paidMonths.has(key)) {
      dueCount++;
    }
    tempDate.setMonth(tempDate.getMonth() + 1);
  }

  // 2️⃣ Due amount = updatedRent × dueCount
  return updatedRent * dueCount;
};

  // Tenants to show in the main table (hide those who have left)
  const visibleTenants = useMemo(() => {
  const search = (searchText || "").toLowerCase();

  // 1) Filter tenants (same logic you already had)
  const base = (formData || []).filter((t) => {
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

  // 2) Sort according to sortConfig
  const sorted = [...base];

  if (sortConfig.column) {
    sorted.sort((a, b) => {
      const dir = sortConfig.direction === "asc" ? 1 : -1;

      // 🔹 Sr: use srNo numeric
      if (sortConfig.column === "sr") {
        const aSr = Number(a.srNo || 0);
        const bSr = Number(b.srNo || 0);
        return (aSr - bSr) * dir;
      }

      // 🔹 Name: A → Z / Z → A
      if (sortConfig.column === "name") {
        return (
          (a.name || "").localeCompare(b.name || "", undefined, {
            sensitivity: "base",
          }) * dir
        );
      }

      // 🔹 Due: numeric due amount (uses your calculateDue helper)
      if (sortConfig.column === "due") {
        const aDue = calculateDue(a.rents, a.joiningDate);
        const bDue = calculateDue(b.rents, b.joiningDate);
        return (aDue - bDue) * dir;
      }

      // 🔹 Rent status: Pending/Due first OR Paid first
      if (sortConfig.column === "status") {
        const aLabel = getRentStatusLabelForSort(a); // "Paid" / "Pend" / "Due"
        const bLabel = getRentStatusLabelForSort(b);

        const rank = (label, direction) => {
          const s = String(label).toLowerCase();
          const isPending = s.startsWith("pend") || s.startsWith("due");
          const isPaid = s.startsWith("paid");

          if (direction === "asc") {
            // 1st click: Pending/Due at top
            if (isPending) return 0;
            if (isPaid) return 1;
            return 2;
          } else {
            // 2nd click: Paid at top
            if (isPaid) return 0;
            if (isPending) return 1;
            return 2;
          }
        };

        const aRank = rank(aLabel, sortConfig.direction);
        const bRank = rank(bLabel, sortConfig.direction);
        return aRank - bRank;
      }

      return 0;
    });
  }

  return sorted;
}, [formData, leaveDates, searchText, selectedYear, sortConfig, calculateDue]);


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
  // All vacant slots (for shifting), not filtered by search/year
  const allVacantSlots = useMemo(() => {
    const activeKeys = new Set(
      (formData || [])
        .filter((t) => {
          const leaveISO = leaveDates[t._id];
          const isLeaved = leaveISO && new Date(leaveISO) < new Date();
          return !isLeaved;
        })
        .map((t) => `${t.roomNo}-${t.bedNo}`)
    );

    return (slots || []).filter((slot) => {
      const key = `${slot.roomNo}-${slot.bedNo}`;
      return !activeKeys.has(key);
    });
  }, [slots, formData, leaveDates]);

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
    const payload = {
      tenantId: currentLeaveId,
      leaveDate: selectedLeaveDate,
    };

    console.log("Sending leave payload:", payload);

    const res = await axios.post(
      `${apiUrl}/leave`,
      payload
    );

    alert("Leave marked successfully");
    setShowLeaveModal(false);

  } catch (error) {
    console.error(
      "Error setting leave:",
      error.response?.data || error.message
    );
    alert(error.response?.data?.message || "Server error");
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

 const handleUndoClick = async (tenantId) => {
  if (!window.confirm("Undo this tenant's leave?")) return;

  try {
    const res = await axios.post(
      `${apiUrl}/cancel-leave`,
      { id: tenantId }
    );

    if (res.data?.success) {
      alert("Leave undone successfully.");

      // Refresh tenant list from backend
      await refreshTenants?.();

    } else {
      alert(res.data?.message || "Failed to undo leave.");
    }
  } catch (error) {
    console.error("Error undoing leave:", error);
    alert("Failed to undo leave.");
  }
};
const handleDownloadForm = async (tenant) => {
  try {
    const id = tenant?._id;
    if (!id) {
      alert("Tenant ID missing.");
      return;
    }

    const response = await axios.get(`${apiUrl}form/${id}`);
    const item = response.data;

    const formatDate = (v) => {
      if (!v) return "N/A";
      const d = new Date(v);
      return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString("en-IN");
    };


    // ✅ Find current month rent from rents array
    const today = new Date();
    const rents = Array.isArray(item.rents) ? item.rents : [];

    const currentMonthRent = rents.find((r) => {
      const d = new Date(r.date);
      return (
        !isNaN(d.getTime()) &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    });

    const currentMonthRentAmount = currentMonthRent ? toNum(currentMonthRent.rentAmount) : 0;

    // ✅ Bed price / base rent fallback
    const bedPrice = toNum(item.baseRent); // your bed price stored here
    const effectiveRentAmount = currentMonthRentAmount > 0 ? currentMonthRentAmount : bedPrice;

    const formatted = [
      ["Field", "Value"],

      ["SrNo", item.srNo ?? ""],
      ["Name", item.name ?? ""],
      ["Phone", item.phoneNo ?? ""],
      ["JoiningDate", formatDate(item.joiningDate)],
      ["RoomNo", item.roomNo ?? ""],
      ["FloorNo", item.floorNo ?? ""],
      ["BedNo", item.bedNo ?? ""],
      ["DepositAmount", item.depositAmount ?? ""],
      ["Address", item.address ?? ""],
      ["RelativeAddress1", item.relativeAddress1 ?? item.relative1Address ?? ""],
      ["RelativeAddress2", item.relativeAddress2 ?? item.relative2Address ?? ""],
      ["CompanyAddress", item.companyAddress ?? ""],
      ["DateOfJoiningCollege", formatDate(item.dateOfJoiningCollege)],
      ["DOB", formatDate(item.dob)],
 
    
    ];

    // ✅ Optional: include full rent history
    if (rents.length > 0) {
      formatted.push(["", ""]);
      formatted.push(["Rents History", ""]);
      rents.forEach((rent, i) => {
        formatted.push([`Rent ${i + 1} Amount`, rent.rentAmount ?? ""]);
        formatted.push([`Rent ${i + 1} Date`, formatDate(rent.date)]);
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(formatted);
    ws["!cols"] = [{ wch: 32 }, { wch: 45 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tenant Data");

    const safeName = (item.name || "Tenant").replace(/[\\/:*?"<>|]/g, "_");
    XLSX.writeFile(wb, `Tenant_${safeName}.xlsx`);
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
  const handleShiftSave = async () => {
    if (!shiftTenant || !shiftTargetKey) return;

    const [roomNo, bedNo] = shiftTargetKey.split("-");

    // Find selected vacant slot to get price/baseRent
    const slot = allVacantSlots.find(
      (s) =>
        String(s.roomNo) === String(roomNo) &&
        String(s.bedNo) === String(bedNo)
    );

    const newBaseRent = slot ? toNum(slot.price) : toNum(shiftTenant.baseRent);
    const newRentAmount = newBaseRent || toNum(shiftTenant.rentAmount);

    try {
      // ⛏️ Uses your existing update endpoint
      const payload = {
        ...shiftTenant,
        roomNo,
        bedNo,
        baseRent: newBaseRent,
        rentAmount: newRentAmount,
      };

      const res = await axios.put(
        `${apiUrl}update/${shiftTenant._id}`,
        payload
      );

      // Update UI
      setFormData((prev) =>
        prev.map((t) => (t._id === shiftTenant._id ? res.data : t))
      );

      setShowShiftModal(false);
      setShiftTenant(null);
      setShiftTargetKey("");
      alert("Tenant shifted successfully.");
    } catch (err) {
      console.error("Shift room failed:", err);
      alert(
        err?.response?.data?.message ||
          "Failed to shift tenant. Please try again."
      );
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

  // ✅ use selected date (fallback to today only if empty)
  const paymentISO =
    editRentDate && String(editRentDate).trim()
      ? editRentDate
      : new Date().toISOString().split("T")[0];

  try {
    const monthKey = fmtMonthKey(editMonthYM.y, editMonthYM.m); // "Sep-25"

    const payload = {
      rentAmount: Number(editRentAmount) || 0,
      date: paymentISO,               // ✅ store selected payment date
      paymentDate: paymentISO,        // ✅ (optional but helps if you read paymentDate)
      month: monthKey,                // "Sep-25"
      paymentMode: editPaymentMode || "Cash",
    };

    await axios.put(`${apiUrl}form/${editingTenant._id}`, payload);

    // local update
    setFormData((prev) =>
      prev.map((t) =>
        t._id === editingTenant._id
          ? {
              ...t,
              rents: upsertRentForMonth(t, {
                y: editMonthYM.y,
                m: editMonthYM.m,
                amount: Number(editRentAmount) || 0,
                date: paymentISO,      // ✅ use selected date here also
                mode: editPaymentMode || "Cash",
              }),
            }
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

  // 🔥 Billing month = previous month of today
  const today = new Date();
  let billYear = today.getFullYear();
  let billMonth = today.getMonth() - 1; // previous month

  if (billMonth < 0) {
    billMonth = 11;      // December
    billYear -= 1;       // previous year
  }

  const list = formData.filter((t) => {
    if (!t) return false;
    if (t.leaveDate) return false;          // already left
    if (!t.bedNo) return false;             // no bed assigned

    const rents = t.rents || [];
    const rentDue = Number(t.rentDue || 0);

    // RULE 1: any due amount => pending
    if (rentDue > 0) return true;

    // RULE 2: check if this tenant has paid for BILLING MONTH
    const paidForBillingMonth = rents.some((r) => {
      if (!r) return false;

      // Prefer the real stored date
      if (r.date) {
        const d = new Date(r.date);
        if (!isNaN(d)) {
          return (
            d.getFullYear() === billYear &&
            d.getMonth() === billMonth &&
            Number(r.rentAmount) > 0
          );
        }
      }

      // Fallback: if you also store "Dec-25" etc in r.month
      if (r.month) {
        try {
          const [mon, yy] = String(r.month).split("-");
          const year =
            yy && yy.length === 2 ? Number("20" + yy) : Number(yy);
          const month = new Date(`${mon} 1, ${year}`).getMonth();
          return (
            year === billYear &&
            month === billMonth &&
            Number(r.rentAmount) > 0
          );
        } catch (e) {
          return false;
        }
      }

      return false;
    });

    // If NOT paid for billing month → pending
    return !paidForBillingMonth;
  });

  setPendingRents(list.length);
}, [formData]);

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (error) return <div className="text-center text-danger mt-5">{error}</div>;

  // Filter only tenants who left in the last month or this month
  // const filteredDeletedData = deletedData.filter((t) => t.leaveDate);
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
    const res = await axios.post(`${apiUrl}/cancel-leave`, { id });
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
      <div className="row">
      <div className="col-md-10 col-10 col-sm-10 col-lg-10 col-xl-10">  <h3 className="fw-bold mb-4 ms-5">Rent & Deposite Tracker</h3></div>

      <div className="col-md-2 col-2 col-sm-2 col-lg-2 col-xl-2">
        {/* <NotificationBell apiUrl={apiUrl} onApproved={handleApprovedFromBell} /> */}
        {/* <NotificationBell
  apiUrl={apiUrl}
  onApproved={handleApprovedFromBell}
  onLeaveApproved={({ tenantId, leaveDateISO }) => {
    setLeaveDates(prev => ({ ...prev, [tenantId]: (leaveDateISO || new Date().toISOString()).slice(0,10) }));
    refreshTenants(); // you already have this
  }}
/>

<LeaveNotificationBell apiUrl=" http://localhost:8000/api/" /> */}
<NotificationBell
  apiUrl={apiUrl}
  onApproved={handleApprovedFromBell}
  onLeaveApproved={({ tenantId, leaveDateISO }) => {
    setLeaveDates(prev => ({
      ...prev,
      [tenantId]: (leaveDateISO || new Date().toISOString()).slice(0, 10)
    }));
    refreshTenants();
  }}
/>

     </div>
      </div>
    
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

       
        <button
          className="btn me-2"
          style={{ backgroundColor: "#5f7dfc", color: "white" }}
          onClick={() => navigate("/roommanager")}
        >
          <FaPlus className="me-1" /> Manage Rooms
        </button>

        <button
          className="btn me-2"
          style={{ backgroundColor: "#5f7dfc", color: "white" }}
          onClick={openAddModal}
        >
          <FaPlus className="me-1" /> Add Tenant
        </button>

        {/* <button
          className="btn me-2"
          style={activeTab === "light" ? style.colorA : style.colorB}
          onClick={() => {
            setActiveTab("light");
            navigate("/lightbillotherexpenses", { state: { tab: "light" } });
          }}
        >
          <FaBolt className="me-1" />
          Light Bill
        </button> */}

        {/* <button
          className="btn me-2"
          style={activeTab === "other" ? style.colorA : style.colorB}
          onClick={() => {
            setActiveTab("other");
            navigate("/lightbillotherexpenses", { state: { tab: "other" } });
          }}
        >
          <FaReceipt className="me-1" />
          Other Expenses
        </button> */}

        <button
          className="btn me-2"
          style={style.successButton}
          onClick={handleDownloadExcel}
        >
          <FaDownload className="me-1" />
          Download Excel
        </button>

        {/* <button
          className="btn me-2"
          style={activeTab === "light" ? style.colorA : style.colorB}
          onClick={() => setShowAddModal(true)}
        >
          <FaPlus className="me-1" />
          Add {activeTab === "light" ? "Light Bill" : "Other Expense"}
        </button> */}

        <button
          className="btn me-2"
          style={{ backgroundColor: "#5f7dfc", color: "white" }}
          onClick={() => handleNavigation("/maindashboard")}
        >
          <FaArrowLeft className="me-1" />
          Back
        </button>
{/* <NotificationBell apiUrl={apiUrl} onApproved={handleApprovedFromBell} /> */}



        {/* <button className="btn btn-outline-dark">
    Logout
  </button> */}

      </div>
<div className="row g-3 mb-4 summary-row">

  {/* Total Beds */}
  <div className="col-md-3 col-sm-6">
    <div className="summary-card blue">
      <div className="summary-left">
        <div className="summary-icon">🛏️</div>
        <div className="summary-text">
          <div className="summary-title">Total Beds</div>
        </div>
      </div>
      <div className="summary-number">
        {roomsData.reduce((sum, room) => sum + (room.beds?.length || 0), 0)}
      </div>
    </div>
  </div>

  {/* Occupied */}
  <div className="col-md-3 col-sm-6">
    <div className="summary-card green">
      <div className="summary-left">
        <div className="summary-icon">🛌</div>
        <div className="summary-text">
          <div className="summary-title">Occupied</div>
        </div>
      </div>
      <div className="summary-number">
        {formData.filter((d) => !d.leaveDate).length}
      </div>
    </div>
  </div>

  {/* Pending Rents */}
  <div className="col-md-3 col-sm-6">
    <div className="summary-card red">
      <div className="summary-left">
        <div className="summary-icon">⏳</div>
        <div className="summary-text">
          <div className="summary-title">Pending Rents</div>
        </div>
      </div>
      <div className="summary-number">{pendingRents}</div>
    </div>
  </div>

  {/* Deposits */}
  <div className="col-md-3 col-sm-6">
    <div className="summary-card purple">
      <div className="summary-left">
        <div className="summary-icon">💰</div>
        <div className="summary-text">
          <div className="summary-title">Deposits</div>
        </div>
      </div>
      <div className="summary-number">
        {formData.filter((d) => Number(d.depositAmount) > 0).length}
      </div>
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

    {/* ⭐ Staff & Other Expenses Button */}
  {/* ----------------- NEW BUTTON ROW ----------------- */}
{/* <div className="expense-tabs-wrapper mb-4">


  <button
    className={`btn btn-lightbill-tab ${activeTab === "light" ? "active-tab" : ""}`}
   onClick={() =>
  setActiveTab(activeTab === "light" ? "rent" : "light")
}

  >
    🔌 Light Bill
    
  </button>
<button
  className={`btn btn-expenses-tab ${
    activeTab === "expenses" ? "active-tab" : ""
  }`}
  onClick={() => setActiveTab("expenses")}
>
  📄 Expenses
  
</button>




  <button
  className="btn btn-light"
  onClick={() => {
    setActiveTab("staff");
    
  }}
>
  🧑‍🔧 Staff 
</button>


</div> */}


<div className="expense-tabs-wrapper mb-4">

  <button
    className={`tab-pill ${activeTab === "rent" ? "active" : ""}`}
    onClick={() => setActiveTab("rent")}
  >
    🚗 Rent
  </button>

  <button
    className={`tab-pill ${activeTab === "light" ? "active" : ""}`}
    onClick={() => setActiveTab("light")}
  >
    🔌 Light Bill
  </button>

  <button
    className={`tab-pill ${activeTab === "expenses" ? "active" : ""}`}
    onClick={() => setActiveTab("expenses")}
  >
    📄 Expenses
  </button>

  <button
    className={`tab-pill ${activeTab === "staff" ? "active" : ""}`}
    onClick={() => setActiveTab("staff")}
  >
    🧑‍🔧 Staff
  </button>

</div>


    {/* <h5 className="fw-bold mb-3">Bed-wise Rent and Deposit Tracker</h5> */}
    {/* ... your table code continues here ... */}

{/* ---------------- LIGHT BILL TAB ---------------- */}
{/* ---------- LIGHT BILL TAB ---------- */}
{activeTab === "light" && (
  <>
    {/* BACK BUTTON */}
    {/* <div className="mb-3 d-flex">
      <button
        className="btn btn-dark me-3"
        onClick={() => setActiveTab("rent")}
      >
        ← Back
      </button>
    </div> */}

    {/* FULL LIGHT BILL UI INSIDE CARD */}
    <div className="card shadow-sm p-3 mb-4 lightbill-card">
      <LightBill embedded={true} />
    </div>
  </>
)}


{/* ---------------- OTHER EXPENSE TAB ---------------- */}
{/* ---------------- OTHER EXPENSE TAB ---------------- */}
{activeTab === "expenses" && (
  <>
    {/* BACK BUTTON */}
    {/* <div className="mb-3 d-flex">
  <button
    className="btn btn-dark me-3"
    onClick={() => setActiveTab("rent")}
  >
    ← Back
  </button>
</div> */}


    <div className="card shadow-sm p-3 mb-4 lightbill-card">
      <OtherExpense embedded={true} />
    </div>
  </>
)}
{activeTab === "staff" && (
  <>
    {/* <div className="mb-3 d-flex">
      <button className="btn btn-dark me-3" onClick={() => setActiveTab("rent")}>
        ← Back
      </button>
    </div> */}

    <div className="card shadow-sm p-3 mb-4 lightbill-card">
      <StaffExpenses
        embedded={true}
        // openAddModal={openStaffModal}
        onModalOpened={() => setOpenStaffModal(false)}
      />
    </div>
  </>
)}



{showOtherExpenseModal && (
  <div className="modal d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
    <div className="modal-dialog modal-xl modal-dialog-scrollable">
      <div className="modal-content">

        <div className="modal-header">
          <h4 className="modal-title">Other Expenses</h4>
          <button
            className="btn-close"
            onClick={() => setShowOtherExpenseModal(false)}
          ></button>
        </div>

        <div className="modal-body" style={{ padding: 0 }}>
          <OtherExpense embedded={true} />
        </div>

      </div>
    </div>
  </div>
)}




     {activeTab === "rent" && (
  <div className="table-responsive rent-table-wrapper">

<div className="section-title mb-3">
  <span className="section-icon">
    <FaThLarge />
  </span>
  <span className="section-text">
    Bed-wise Rent and Deposit Tracker
  </span>
</div>

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

    {/* 🔽 CLICK HERE TO SORT BY RENT STATUS */}
    <button
      type="button"
      className="btn btn-link p-0 m-0 fw-semibold text-decoration-none text-dark d-inline-flex align-items-center"
      onClick={() => handleSort("status")}
      style={{ cursor: "pointer" }}
    >
      Rent {renderSortIcon("status")}
    </button>

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
  <div className="rent-table-wrapper">
            <table className="table table-bordered align-middle">

          <thead>
  <tr className="fw-semibold text-secondary">
    <th
      style={{
  width: 90,
  backgroundColor: "#ffc0cb",
  cursor: "pointer",
  textAlign: "center",
}}

      onClick={() => handleSort("sr")}
    >
      Sr {renderSortIcon("sr")}
    </th>

    <th
      style={{ minWidth: 200, backgroundColor: "#ffc0cb", cursor: "pointer" }}
      onClick={() => handleSort("name")}
    >
      Name {renderSortIcon("name")}
    </th>

    {visibleMonths.map((m, i) => (
      <th
        key={`${m.y}-${m.m}-${i}`}
        className="text-center"
        style={{ minWidth: 140, backgroundColor: "#ffc0cb" }}
      >
        {m.label}
      </th>
    ))}

    <th
      style={{ backgroundColor: "#ffc0cb", cursor: "pointer" }}
      onClick={() => handleSort("due")}
    >
      Due {renderSortIcon("due")}
    </th>

    <th style={{ backgroundColor: "#ffc0cb" }}>
      Actions
    </th>
  </tr>
</thead>


              <tbody>
                {/* Occupied rows */}
                {visibleTenants.map((tenant, rowIdx) => {
                 const dueAmount = calculateDue(
  tenant.rents,
  tenant.joiningDate,
  tenant,
  roomsData
  
);

                  return (
                    <tr key={tenant._id}>
                      {/* Sr */}
                   <td className="text-muted text-center">
  {rowIdx + 1}
</td>


                      {/* Name + meta */}
                    <td>
  <div className="tenant-cell">
  {/* Shift Button (keep same) */}
  <button
    className="btn btn-sm shift-btn mb-1"
    onClick={(e) => {
      e.stopPropagation();
      setShiftTenant(tenant);
      setShiftTargetKey("");
      setShowShiftModal(true);
    }}
  >
    <FaExchangeAlt className="me-1" />
    Shift Bed
  </button>

  {/* CLICKABLE AREA */}
  <div
    className="tenant-open"
    role="button"
    tabIndex={0}
    onClick={() => openAdmissionForm(tenant)}
    onKeyDown={(e) => e.key === "Enter" && openAdmissionForm(tenant)}
    title="Open Admission Form"
  >
    {/* Tenant Name */}
    <div className="tenant-name">{tenant.name}</div>

    {/* Deposit */}
    <div className="tenant-meta">
      Deposit: ₹{Number(tenant.depositAmount || 0).toLocaleString("en-IN")}
    </div>

    {/* Phone */}
    <div className="tenant-meta">{tenant.phoneNo}</div>

    {/* Room badge */}
    <span className="room-pill">{tenant.roomNo || "—"}</span>
  </div>
</div>

</td>


                      {/* Month cells */}
{/* Month cells */}
{visibleMonths.map((m, i) => {
  const c = getMonthCell(tenant, m.y, m.m);
  const extraNum = Number(c.extra || 0);

  // hide months before joining month
  const joinDate = new Date(tenant.joiningDate);
  const joinYM = joinDate.getFullYear() * 12 + joinDate.getMonth();
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
    <td key={`${tenant._id}-${m.y}-${m.m}-${i}`} className="text-center">
      <div
        style={{ cursor: "pointer" }}
        onClick={() => openEditForTenantMonth(tenant._id, m.m, m.y)}
        title="Click to edit this tenant's rent"
      >
        {/* ✅ Status badge inline */}
        {c.label ? (
          <span
            className="badge rounded-pill px-3 py-2"
            style={{
              fontSize: 12,
              fontWeight: 800,
              backgroundColor:
                c.label === "Paid"
                  ? "#198754"
                  : c.label === "Due"
                  ? "#dc3545"
                  : c.label === "Upcoming"
                  ? "#ffb703"
                  : c.label === "Pend"
                  ? "#ffc107"
                  : "#e9ecef",
              color: c.label === "Paid" || c.label === "Due" ? "#fff" : "#111",
              boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
            }}
          >
            {c.label}
          </span>
        ) : (
          <span className="text-muted">—</span>
        )}

        {/* Date */}
        <div className="small text-muted mt-1" style={{ lineHeight: 1 }}>
          {c.dateStr}
        </div>

        {/* 1) PAID */}
        {c.label === "Paid" && (
          <div className="small mt-1 fw-semibold" style={{ lineHeight: 1 }}>
            ₹{Number(c.amountPaid || 0).toLocaleString("en-IN")}
          </div>
        )}

        {/* 2) PEND (partial / balance) */}
        {c.label === "Pend" && (
          <div className="small mt-1 fw-semibold" style={{ lineHeight: 1 }}>
            ₹{Number(c.amountPaid || 0).toLocaleString("en-IN")}
            <span className="text-muted" style={{ fontWeight: 600 }}>
              {" "}
              / ₹{Number(c.expected || 0).toLocaleString("en-IN")}
            </span>

            {Number(c.outstanding || 0) > 0 && (
              <div
                className={c.isPast ? "text-danger" : "text-warning"}
                style={{
                  lineHeight: 1,
                  marginTop: 2,
                  fontWeight: 700,
                }}
              >
                {c.isPast ? "Due" : "Balance"}: ₹
                {Number(c.outstanding || 0).toLocaleString("en-IN")}
              </div>
            )}
          </div>
        )}

        {/* 3) UPCOMING */}
        {c.label === "Upcoming" && (
          <div
            className="small mt-1 fw-semibold text-warning"
            style={{ lineHeight: 1, fontWeight: 800 }}
          >
            ₹{Number(expectFromTenant(tenant, roomsData) || 0).toLocaleString("en-IN")}
          </div>
        )}

        {/* 4) DUE (past only) ✅ Always red */}
        {c.label === "Due" && (
          <div
            className="small mt-1 fw-semibold text-danger"
            style={{ lineHeight: 1, fontWeight: 800 }}
          >
            ₹{Number(expectFromTenant(tenant, roomsData) || 0).toLocaleString("en-IN")}
          </div>
        )}

        {/* Extra charges */}
        {extraNum !== 0 && (
          <div
            className="small mt-1 fw-semibold"
            style={{
              color: extraNum > 0 ? "#d63384" : "#198754",
            }}
          >
            {extraNum > 0
              ? `+₹${extraNum.toLocaleString("en-IN")}`
              : `-₹${Math.abs(extraNum).toLocaleString("en-IN")}`}
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
                      {/* // Overall status */}
{/* <td>
  <span
    className={`badge rounded-pill px-3 py-2 ${
      dueAmount === 0 ? "bg-success" : "bg-warning text-dark"
    }`}
   
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
</td> */}

                      {/* Actions */}
                      <td>
                      <button
    className="action-btn action-edit"
    onClick={() => {
      setEditTenantData(tenant);
      setShowEditModal(true);
    }}
  >
    <FaEdit />
  </button>
  {/* Shift Room / Bed */}
  {/* <button
    className="btn btn-sm btn-outline-secondary me-2"
    onClick={() => {
      setShiftTenant(tenant);
      setShiftTargetKey("");
      setShowShiftModal(true);
    }}
    title="Shift to another vacant bed"
  >
    <FaExchangeAlt />
  </button> */}

                        {/* <button
                          className="btn btn-sm"
                          style={{ backgroundColor: "#3db7b1", color: "white" }}
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setShowDetailsModal(true);
                          }}
                        >
                          <FaEye />
                        </button> */}

                      
{/* Leave (schedule) */}
 <button
    className="action-btn action-leave"
    onClick={() => handleLeave(tenant)}
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
{/* 
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => openDeleteConfirmation(tenant._id)}
                        >
                          <FaTrash />
                        </button> */}

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
                      {/* <td>
                        <span className="badge rounded-pill px-3 py-2 bg-secondary">
                          Vacant
                        </span>
                      </td> */}
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
</div>
            {/* Leaved Tenants Section (unchanged) */}
  {filteredDeletedData.length > 0 && (
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
          // -----------------------------
          // DATE LOGIC (30 DAYS UNDO RULE)
          // -----------------------------
          const leaveDate = new Date(tenant.leaveDate);
          leaveDate.setHours(0, 0, 0, 0);

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const diffInDays =
            (today.getTime() - leaveDate.getTime()) /
            (1000 * 60 * 60 * 24);

          // Allow undo only within last 30 days
          const isUndoAllowed =
            diffInDays >= 0 && diffInDays <= 30;

          return (
            <tr key={tenant._id || index}>
              {/* Room */}
              <td>
                {tenant.roomNo}
                <div className="text-muted small">
                  bed {tenant.bedNo}
                </div>
              </td>

              {/* Name */}
              <td
                style={{ cursor: "pointer" }}
                onClick={() => showRentHistory(tenant)}
              >
                {tenant.name}
              </td>

              {/* Joining Date */}
              <td>
                {new Date(tenant.joiningDate).toLocaleDateString()}
              </td>

              {/* Leave Date */}
              <td>
                {leaveDate.toLocaleDateString()}
              </td>

              {/* Actions */}
              <td>
                {isUndoAllowed && (
                  <button
                    className="btn btn-sm btn-success me-2"
                    onClick={() => handleUndoClick(tenant._id)}
                    title="Undo leave (allowed within 30 days)"
                  >
                    <FaUndo />
                  </button>
                )}

                <button
                  className="btn btn-sm"
                  style={{
                    backgroundColor: "#2d6eef",
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
          )}

        </div>
      </div>
{showFormModal && (
  <>
    {/* BACKDROP (BEHIND modal) */}
    <div
      className="modal-backdrop fade show"
      style={{ zIndex: 1040 }}
      onClick={() => setShowFormModal(false)}
    />

    {/* MODAL (ABOVE backdrop) */}
    <div
      className="modal fade show"
      style={{ display: "block", zIndex: 1050 }}
      tabIndex="-1"
      role="dialog"
      onClick={(e) => {
        // close only if click happens on outside grey area (not inside content)
        if (e.target === e.currentTarget) setShowFormModal(false);
      }}
    >
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Admission Form — {formTenant?.name || ""}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowFormModal(false)}
            />
          </div>

          <div className="modal-body">
            {formTenant ? <FormDownload formData={formTenant} /> : null}
          </div>
        </div>
      </div>
    </div>
  </>
)}

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
            className="btn-close p-0"
            onClick={() => setShowAddModal(false)}
          >
            x
          </button>
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
                <label className="form-label">
                  Name <span className="text-danger">*</span>
                </label>
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
                <label className="form-label">
                  Phone No <span className="text-danger">*</span>
                </label>
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



             {/* Room + Bed */}
<div className="col-12 col-md-6">
  <label className="form-label">
    Room <span className="text-danger">*</span>
  </label>

  <select
    className="form-select"
    value={newTenant.roomId || ""}
   onChange={(e) => {
  const roomId = e.target.value;
  const selectedRoom = roomsData.find((r) => String(r._id) === String(roomId));

  setNewTenant((prev) => ({
    ...prev,
    roomId,
    roomNo: selectedRoom?.roomNo || "",
    category: selectedRoom?.category || "",   // ✅ AUTO CATEGORY FROM ROOM
    bedNo: "",
    floorNo: selectedRoom?.floorNo || "",
    baseRent: "",
    rentAmount: "",
    newBedNo: "",
    newBedPrice: "",
    newBedCategory: "",
    __bedMsg: "",
    __savingBed: false,
  }));
}}

  >
    <option value="">Select Room</option>
{roomsData
  .filter(roomHasVacantBed) // ✅ only rooms with at least 1 vacant bed
  .map((room) => (
    <option key={`room-${room._id}`} value={room._id}>
      {room.roomNo} • {room.category} • Floor {room.floorNo}
    </option>
  ))}


  </select>
</div>

<div className="col-12 col-md-6">
  <label className="form-label">
    Bed No <span className="text-danger">*</span>
  </label>

  <select
    className="form-select"
    value={newTenant.bedNo || ""}
    disabled={!newTenant.roomId}
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
          newBedCategory: prev.newBedCategory || "",
          __bedMsg: "",
          __savingBed: false,
        }));
        return;
      }

      const selectedRoom = roomsData.find((r) => String(r._id) === String(newTenant.roomId));
      const selectedBed = selectedRoom?.beds?.find((b) => String(b.bedNo) === String(bedNo));

      setNewTenant((prev) => ({
        ...prev,
        bedNo,
        baseRent: selectedBed?.price ?? "",
        rentAmount: selectedBed?.price ?? "",
        newBedNo: "",
        newBedPrice: "",
        newBedCategory: "",
        __bedMsg: "",
        __savingBed: false,
      }));
    }}
  >
    <option value="">
      {newTenant.roomId ? "Select Bed" : "Select a Room first"}
    </option>

    {roomsData
      .find((r) => String(r._id) === String(newTenant.roomId))
     ?.beds?.filter((bed) => {
  const selectedRoom = roomsData.find((r) => String(r._id) === String(newTenant.roomId));
  return !occupiedBeds.has(occKey(selectedRoom?.roomNo, bed.bedNo));
})


      .map((bed) => (
        <option key={`bed-${newTenant.roomId}-${bed.bedNo}`} value={bed.bedNo}>
          {bed.bedNo} - {bed.bedCategory || "—"} - ₹{bed.price ?? "—"}
        </option>
      ))}

    {!!newTenant.roomId && <option value="__other__">Other (add new bed…)</option>}
  </select>
</div>

{/* Inline "Other" Bed */}
{newTenant.bedNo === "__other__" && (
  <div className="col-12">
    <div className="mt-1 p-3 border rounded bg-light">
      <div className="row g-2">
        <div className="col-12 col-md-4">
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
            <small className="text-danger">Bed No is required</small>
          )}
        </div>

        <div className="col-12 col-md-4">
          <label className="form-label">Bed Category</label>
          <input
            className="form-control"
            value={newTenant.newBedCategory || ""}
            onChange={(e) =>
              setNewTenant((prev) => ({
                ...prev,
                newBedCategory: e.target.value,
                __bedMsg: "",
              }))
            }
            placeholder="Upper / Lower"
          />
        </div>

        <div className="col-12 col-md-4">
          <label className="form-label">
            Price <span className="text-muted">(optional)</span>
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
            placeholder="e.g., 3500"
            min="0"
          />
          {newTenant.newBedPrice !== "" &&
            newTenant.newBedPrice != null &&
            (Number(newTenant.newBedPrice) < 0 || Number.isNaN(Number(newTenant.newBedPrice))) && (
              <small className="text-danger">Enter a non-negative number</small>
            )}
        </div>
      </div>

      {newTenant.__bedMsg ? (
        <div className="mt-2">
          <small className={newTenant.__bedMsg.startsWith("✔") ? "text-success" : "text-danger"}>
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
              (Number(newTenant.newBedPrice) < 0 || Number.isNaN(Number(newTenant.newBedPrice))))
          }
          onClick={async () => {
            const roomId = newTenant.roomId;
            const bedNoToAdd = (newTenant.newBedNo || "").trim();
            const bedCategoryToAdd = (newTenant.newBedCategory || "").trim();
            const priceStr = newTenant.newBedPrice;

            const priceProvided = priceStr !== "" && priceStr != null;
            const priceNum = priceProvided ? Number(priceStr) : null;

            const roomIdx = roomsData.findIndex((r) => String(r._id) === String(roomId));
            if (roomIdx === -1) {
              setNewTenant((prev) => ({ ...prev, __bedMsg: "Room not found." }));
              return;
            }

            const exists = roomsData[roomIdx].beds?.some(
              (b) => String(b.bedNo).trim().toLowerCase() === bedNoToAdd.toLowerCase()
            );
            if (exists) {
              setNewTenant((prev) => ({
                ...prev,
                __bedMsg: "A bed with this number already exists in this room.",
              }));
              return;
            }

            try {
              setNewTenant((prev) => ({ ...prev, __savingBed: true, __bedMsg: "" }));

              const payload = { bedNo: bedNoToAdd, bedCategory: bedCategoryToAdd };
              if (priceProvided) payload.price = priceNum;

              // ✅ correct endpoint (RoomManager style)
              await axios.post(`${ROOMS_API}/${roomId}/bed`, payload);

              // update local roomsData
              setRoomsData((prev) => {
                const copy = [...prev];
                const r = { ...copy[roomIdx] };
                r.beds = [
                  ...(r.beds || []),
                  { bedNo: bedNoToAdd, bedCategory: bedCategoryToAdd, ...(priceProvided ? { price: priceNum } : {}) },
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
                newBedCategory: "",
                __bedMsg: "✔ Bed added successfully",
                __savingBed: false,
              }));
            } catch (err) {
              console.error(err);
              setNewTenant((prev) => ({
                ...prev,
                __bedMsg: err.response?.data?.message || "Could not save the bed.",
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
              newBedCategory: "",
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
              {/* <div className="col-12 col-md-6">
                <label className="form-label">
                  Rent Amount (Auto-Filled){" "}
                  <span className="text-danger">*</span>
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
              </div> */}

              {/* Deposit + DOJ */}
              <div className="col-12 col-md-6">
                <label className="form-label">
                  Deposit Amount <span className="text-danger">*</span>
                </label>
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
                    {["Self", "Sister", "Brother", "Father", "Husband", "Mother"].map(
                      (r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      )
                    )}
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
                    {["Self", "Sister", "Brother", "Father", "Husband", "Mother"].map(
                      (r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      )
                    )}
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






              <div className="col-12 col-md-6">
                <label className="form-label">
                  Date of Birth <span className="text-muted">(optional)</span>
                </label>
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

              {/* Upload Docs – Self / Parent Aadhaar + Photo */}
              <div className="col-12 col-md-12">
                <label className="form-label d-block mb-2">
                  Upload Documents
                </label>

                <div className="row g-3">
                  {/* Self Aadhaar */}
                  <div className="col-12 col-md-4">
                    <div className="border rounded p-3 h-100">
                      <label className="form-label fw-semibold small">
                        Self Aadhaar Card
                      </label>
                      <input
                        type="file"
                        className="form-control form-control-sm"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setSelfAadharFile(file);
                        }}
                      />
                      {selfAadharFile && (
                        <small className="text-muted d-block mt-1">
                          Selected: {selfAadharFile.name}
                        </small>
                      )}
                    </div>
                  </div>

                  {/* Parent Aadhaar */}
                  <div className="col-12 col-md-4">
                    <div className="border rounded p-3 h-100">
                      <label className="form-label fw-semibold small">
                        Parent Aadhaar Card
                      </label>
                      <input
                        type="file"
                        className="form-control form-control-sm"
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setParentAadharFile(file);
                        }}
                      />
                      {parentAadharFile && (
                        <small className="text-muted d-block mt-1">
                          Selected: {parentAadharFile.name}
                        </small>
                      )}
                    </div>
                  </div>

                  {/* Tenant Photo / Selfie */}
                  <div className="col-12 col-md-4">
                    <div className="border rounded p-3 h-100">
                      <label className="form-label fw-semibold small">
                        Tenant Photograph (Selfie)
                      </label>
                      <input
                        type="file"
                        className="form-control form-control-sm"
                        accept="image/*"
                        capture="user" // 📷 On mobile this opens camera
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setPhotoFile(file);
                        }}
                      />
                      {photoFile && (
                        <small className="text-muted d-block mt-1">
                          Selected: {photoFile.name}
                        </small>
                      )}
                      <small className="text-muted d-block mt-1">
                        On mobile, this will open the camera to take a live
                        selfie.
                      </small>
                    </div>
                  </div>
                </div>

                {docMsg && (
                  <small className="d-block mt-2 text-danger">{docMsg}</small>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer d-flex flex-wrap gap-2">
          {/* NEW: Share + Import (now local handlers) */}
          {/* 
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={handleShareAddTenantModal}
            title="Share a link that opens the tenant form page"
          >
            Share Form
          </button> 
          */}

          <button
            type="button"
            className="btn btn-outline-dark"
onClick={async () => {
  try {
    const INVITES_URL = `${String(apiUrl).replace(/\/+$/, "")}/invites`;

    // values first
    const category = String(newTenant.category || "").trim();
    const roomNo = String(newTenant.roomNo || "").trim();
    const bedNo = String(newTenant.bedNo || "").trim();

    const phone10 = String(newTenant.phoneNo || "")
      .replace(/\D/g, "")
      .slice(0, 10);

    // ✅ define FIRST (no TDZ error)
    const invitePayload = {
      category,
      roomNo,
      bedNo,
      name: String(newTenant.name || "").trim() || undefined,
      phoneNo: phone10 || undefined,
      joiningDate: newTenant.joiningDate || undefined,
      rentAmount: toNum(newTenant.rentAmount ?? newTenant.baseRent),
      depositAmount: toNum(newTenant.depositAmount),
    };

    // ✅ validations AFTER invitePayload exists
    if (!invitePayload.category) {
      alert("Category missing. Select Room again (category auto-fills from room).");
      return;
    }
    if (!invitePayload.roomNo) {
      alert("Room No missing. Please select a Room.");
      return;
    }
    if (!invitePayload.bedNo || invitePayload.bedNo === "__other__") {
      alert("Please select a valid Bed (not 'Other') before sharing link.");
      return;
    }
    if (invitePayload.phoneNo && invitePayload.phoneNo.length !== 10) {
      alert("Phone number must be 10 digits.");
      return;
    }

    console.log("INVITE PAYLOAD =>", invitePayload);

    const res = await axios.post(INVITES_URL, invitePayload, {
      headers: { "X-Origin": window.location.origin },
    });

    const url = res.data?.url;
    if (!url) {
      alert("Invite created but URL missing in response.");
      console.log("INVITE RESPONSE =>", res.data);
      return;
    }

    const shareData = { title: "Tenant Form (One-Time)", text: "Please fill this form:", url };

    if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(url);
      alert("One-time link copied to clipboard.");
    }
  } catch (e) {
    const msg =
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      (typeof e?.response?.data === "string" ? e.response.data : "") ||
      e.message;

    console.error("INVITE ERROR =>", e?.response?.data || e);
    alert(`Could not create invite link.\n\n${msg}`);
  }
}}



          >
            Share Link
          </button>

          <div className="flex" />

          {/* <button
            className="btn"
            onClick={handleAddTenantWithDocs}
            style={{
              backgroundColor: "rgb(94, 182, 92)",
              color: "white",
            }}
          >
            Save
            
          </button> */}


<button
  className="btn"
  onClick={handleAddTenantWithDocs}
  disabled={invLoading || (invToken && !formId) || !!invError}
  style={{ backgroundColor: "rgb(94, 182, 92)", color: "white" }}
>
  {invLoading ? "Loading…" : "Save"}
</button>



          {/* 
          <button
            className="btn btn-secondary"
            onClick={() => setShowAddModal(false)}
          >
            Cancel
          </button> 
          */}
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
                  className="btn-close p-0"
                  onClick={() => setShowAddModal(false)}
                >x</button>
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

                          {/* <button
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
                          </button> */}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* <div className="col-md-6">
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
                  {/* <div className="col-md-6">
                    <label className="form-label">
                      Rent Amount (Auto-Filled)
                    </label>
                    <input
                      className="form-control"
                      value={newTenant.rentAmount || ""}
                      readOnly
                    />
                  </div>  */}
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
                  className="btn-close p-0"
                  onClick={() => setShowDueModal(false)}
                >x</button>
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
    <div className="modal-dialog modal-lg modal-dialog-scrollable modal-fullscreen-md-down">
      <div className="modal-content">

{/* ===== ACTIONS SECTION ===== */}
<div className="px-3 pb-3">
  <hr />

  <div className="d-flex flex-wrap gap-2 align-items-center">
    {/* Shift Room / Bed */}
    {/* <button
      className="btn btn-outline-secondary btn-sm"
      onClick={() => {
        setShiftTenant(editTenantData);
        setShiftTargetKey("");
        setShowShiftModal(true);
      }}
    >
      <FaExchangeAlt /> Shift Bed
    </button> */}

    {/* View Details */}
    <button
      className="btn btn-outline-info btn-sm"
      onClick={() => {
        setSelectedTenant(editTenantData);
        setShowDetailsModal(true);
      }}
    >
      <FaEye /> View Details
    </button>

    {/* Schedule Leave */}
    <button
      className="btn btn-warning btn-sm"
      onClick={() => handleLeave(editTenantData)}
    >
      <FaSignOutAlt /> Schedule Leave
    </button>

    {/* Cancel Leave */}
    {leaveDates[editTenantData._id] &&
      isTodayOrFuture(leaveDates[editTenantData._id]) && (
        <button
          className="btn btn-outline-warning btn-sm"
          onClick={() => handleCancelLeave(editTenantData._id)}
        >
          <FaUndo /> Cancel Leave
        </button>
      )}

    {/* Delete Tenant (right aligned) */}
    <button
      className="btn btn-danger btn-sm ms-auto"
      onClick={() => openDeleteConfirmation(editTenantData._id)}
    >
      <FaTrash /> Delete Tenant
    </button>
  </div>
</div>



        {/* ===== Header ===== */}
        <div className="modal-header">


          
          <h5 className="modal-title">
            Edit Tenant – {editTenantData.name}
          </h5>
          <button className="btn-close p-0" onClick={() => setShowEditModal(false)}>
            x
          </button>
        </div>

        {/* ===== BODY ===== */}
        <div className="modal-body">
          <div className="container-fluid">
            <div className="row g-3">

              {/* NAME */}
              <div className="col-12 col-md-6">
                <label className="form-label">Name</label>
                <input
                  className="form-control"
                  value={editTenantData.name || ""}
                  onChange={(e) =>
                    setEditTenantData({ ...editTenantData, name: e.target.value })
                  }
                />
              </div>

              {/* PHONE */}
              <div className="col-12 col-md-6">
                <label className="form-label">Phone</label>
                <input
                  className="form-control"
                  value={editTenantData.phoneNo || ""}
                  onChange={(e) =>
                    setEditTenantData({ ...editTenantData, phoneNo: e.target.value })
                  }
                />
              </div>

              {/* ADDRESS */}
              <div className="col-12 col-md-6">
                <label className="form-label">Address</label>
                <input
                  className="form-control"
                  value={editTenantData.address || ""}
                  onChange={(e) =>
                    setEditTenantData({ ...editTenantData, address: e.target.value })
                  }
                />
              </div>

              {/* COMPANY ADDRESS */}
              <div className="col-12 col-md-6">
                <label className="form-label">Company / College</label>
                <input
                  className="form-control"
                  value={editTenantData.companyAddress || ""}
                  onChange={(e) =>
                    setEditTenantData({ ...editTenantData, companyAddress: e.target.value })
                  }
                />
              </div>

              {/* JOINING DATE */}
              <div className="col-12 col-md-6">
                <label className="form-label">Joining Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={editTenantData.joiningDate?.split("T")[0] || ""}
                  onChange={(e) =>
                    setEditTenantData({
                      ...editTenantData,
                      joiningDate: e.target.value,
                    })
                  }
                />
              </div>

              {/* DOB */}
              <div className="col-12 col-md-6">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-control"
                  value={editTenantData.dob?.split("T")[0] || ""}
                  onChange={(e) =>
                    setEditTenantData({ ...editTenantData, dob: e.target.value })
                  }
                />
              </div>

              {/* RELATIVE ADDRESS */}
              <div className="col-12 col-md-6">
                <label className="form-label">Relative Address</label>
                <input
                  className="form-control"
                  value={editTenantData.relativeAddress || ""}
                  onChange={(e) =>
                    setEditTenantData({
                      ...editTenantData,
                      relativeAddress: e.target.value,
                    })
                  }
                />
              </div>

              {/* COLLEGE/COMPANY JOINING DATE */}
              <div className="col-12 col-md-6">
                <label className="form-label">
                  Date of Joining (College/Company)
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={editTenantData.dateOfJoiningCollege?.split("T")[0] || ""}
                  onChange={(e) =>
                    setEditTenantData({
                      ...editTenantData,
                      dateOfJoiningCollege: e.target.value,
                    })
                  }
                />
              </div>

              {/* ROOM */}
              <div className="col-12 col-md-6">
                <label className="form-label">Room No</label>
                <select
                  className="form-select"
                  value={editTenantData.roomNo || ""}
                  onChange={(e) => {
                    const roomNo = e.target.value;
                    const selectedRoom = roomsData.find(
                      (r) => String(r.roomNo) === String(roomNo)
                    );

                    setEditTenantData((prev) => ({
                      ...prev,
                      roomNo,
                      bedNo: "",
                      floorNo: selectedRoom?.floorNo || "",
                      baseRent: "",
                      rentAmount: "",
                    }));
                  }}
                >
                  <option value="">Select Room</option>
                 {roomsData.map((room) => (
  <option key={room._id} value={room.roomNo}>
    {room.roomNo} (Floor {room.floorNo})
  </option>
))}

                </select>
              </div>

              {/* BED */}
              <div className="col-12 col-md-6">
                <label className="form-label">Bed No</label>
                <select
                  className="form-select"
                  value={editTenantData.bedNo || ""}
                  onChange={(e) => {
                    const bedNo = e.target.value;

                    const selectedRoom = roomsData.find(
                      (r) => String(r.roomNo) === String(editTenantData.roomNo)
                    );
                    const selectedBed = selectedRoom?.beds.find(
                      (b) => String(b.bedNo) === String(bedNo)
                    );

                    setEditTenantData((prev) => ({
                      ...prev,
                      bedNo,
                      baseRent: selectedBed?.price ?? "",
                      rentAmount: selectedBed?.price ?? "",
                    }));
                  }}
                >
                  <option value="">Select Bed</option>
                  {roomsData
                    .find((r) => String(r.roomNo) === String(editTenantData.roomNo))
                    ?.beds?.map((bed) => (
                      <option key={bed.bedNo} value={bed.bedNo}>
                        {bed.bedNo} - {bed.category || "—"} - ₹{bed.price}
                      </option>
                    ))}
                </select>
              </div>

              {/* RENT */}
              <div className="col-12 col-md-6">
                <label className="form-label">Rent Amount</label>
                <input
                  className="form-control"
                  value={editTenantData.rentAmount || ""}
                  onChange={(e) =>
                    setEditTenantData({
                      ...editTenantData,
                      rentAmount: e.target.value,
                    })
                  }
                />
              </div>

              {/* DEPOSIT */}
              <div className="col-12 col-md-6">
                <label className="form-label">Deposit Amount</label>
                <input
                  type="number"
                  className="form-control"
                  value={editTenantData.depositAmount || ""}
                  onChange={(e) =>
                    setEditTenantData({
                      ...editTenantData,
                      depositAmount: e.target.value,
                    })
                  }
                />
              </div>

              {/* RELATIVE 1 */}
              <div className="col-12 col-md-6">
                <div className="p-3 border rounded">
                  <h6>Relative 1</h6>

                  <label className="form-label">Relation</label>
                  <select
                    className="form-select mb-2"
                    value={editTenantData.relative1Relation || "Self"}
                    onChange={(e) =>
                      setEditTenantData({
                        ...editTenantData,
                        relative1Relation: e.target.value,
                      })
                    }
                  >
                    {["Self", "Sister", "Brother", "Father", "Husband", "Mother"].map(
                      (r) => (
                        <option key={r}>{r}</option>
                      )
                    )}
                  </select>

                  <label className="form-label">Name</label>
                  <input
                    className="form-control mb-2"
                    value={editTenantData.relative1Name || ""}
                    onChange={(e) =>
                      setEditTenantData({
                        ...editTenantData,
                        relative1Name: e.target.value,
                      })
                    }
                  />

                  <label className="form-label">Phone</label>
                  <input
                    className="form-control"
                    value={editTenantData.relative1Phone || ""}
                    onChange={(e) =>
                      setEditTenantData({
                        ...editTenantData,
                        relative1Phone: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* RELATIVE 2 */}
              <div className="col-12 col-md-6">
                <div className="p-3 border rounded">
                  <h6>Relative 2</h6>

                  <label className="form-label">Relation</label>
                  <select
                    className="form-select mb-2"
                    value={editTenantData.relative2Relation || "Self"}
                    onChange={(e) =>
                      setEditTenantData({
                        ...editTenantData,
                        relative2Relation: e.target.value,
                      })
                    }
                  >
                    {["Self", "Sister", "Brother", "Father", "Husband", "Mother"].map(
                      (r) => (
                        <option key={r}>{r}</option>
                      )
                    )}
                  </select>

                  <label className="form-label">Name</label>
                  <input
                    className="form-control mb-2"
                    value={editTenantData.relative2Name || ""}
                    onChange={(e) =>
                      setEditTenantData({
                        ...editTenantData,
                        relative2Name: e.target.value,
                      })
                    }
                  />

                  <label className="form-label">Phone</label>
                  <input
                    className="form-control"
                    value={editTenantData.relative2Phone || ""}
                    onChange={(e) =>
                      setEditTenantData({
                        ...editTenantData,
                        relative2Phone: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handleTenantUpdate}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {showShiftModal && shiftTenant && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Shift Room - {shiftTenant.name}
                </h5>
                <button
                  type="button"
                  className="btn-close p-0"
                  onClick={() => {
                    setShowShiftModal(false);
                    setShiftTenant(null);
                    setShiftTargetKey("");
                  }}
                >
                  x
                </button>
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">
                    Select Vacant Room / Bed
                  </label>
                  <select
                    className="form-select"
                    value={shiftTargetKey}
                    onChange={(e) => setShiftTargetKey(e.target.value)}
                  >
                    <option value="">-- Select vacant bed --</option>
                    {allVacantSlots.map((slot) => {
                      const key = `${slot.roomNo}-${slot.bedNo}`;
                      return (
                        <option key={key} value={key}>
                          Room {slot.roomNo} • Bed {slot.bedNo}
                          {slot.category ? ` • ${slot.category}` : ""}{" "}
                          {slot.price
                            ? ` • ₹${toNum(slot.price).toLocaleString("en-IN")}`
                            : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <p className="small text-muted">
                  Current: Room {shiftTenant.roomNo}, Bed {shiftTenant.bedNo}
                </p>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowShiftModal(false);
                    setShiftTenant(null);
                    setShiftTargetKey("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!shiftTargetKey}
                  onClick={handleShiftSave}
                >
                  Shift
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
                  className="btn-close p-0"
                  onClick={() => setShowFModal(false)}
                >x</button>
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
                  className="btn-close p-0"
                  onClick={() => setShowDetailsModal(false)}
                >x</button>
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
                {/* <button
                  className="btn btn-secondary"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button> */}
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
                  className="btn-close p-0"
                  onClick={() => setEditingTenant(null)}
                >x</button>
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
 <div className="mb-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={editRentDate}
                    onChange={(e) => setEditRentDate(e.target.value)}
                  />
                </div> 
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
                  className="btn-close p-0"
                  onClick={() => setShowLeaveModal(false)}
                >x</button>
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
                {/* <button
                  className="btn btn-secondary"
                  onClick={() => setShowLeaveModal(false)}
                >
                  Cancel
                </button> */}
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
                  className="btn-close p-0"
                  onClick={() => setShowRentModal(false)}
                >x</button>
              </div>
              <div className="modal-body">
                {selectedRentDetails.length > 0 ? (
                  <ul className="list-group">
                 {selectedRentDetails.map((rent, index) => (
                      <li className="list-group-item" key={index}>
                        ₹{Number(rent.rentAmount).toLocaleString("en-IN")} –{" "}
                        {new Date(rent.date).toLocaleDateString()}
                      </li>
                    ))} 
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
                  className="btn-close p-0"
                  onClick={() => setShowPasswordPrompt(false)}
                >x</button>
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
                  className="btn-close p-0"
                  onClick={() => setShowDeleteConfirmation(false)}
                >x</button>
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
 {/* {showExpensesModal && (
  <div
    className="modal d-block"
    tabIndex="-1"
    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
  >
     <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Staff </h5>
          <button
            className="btn-close p-0"
            onClick={() => setShowExpensesModal(false)}
          >
            x
          </button>
        </div>

        <div className="modal-body">
          <div className="mb-3">
            <label className="form-label">Expense Type</label>
            <select
              className="form-select"
              value={expensesForm.type}
              onChange={(e) =>
                setExpensesForm((prev) => ({ ...prev, type: e.target.value }))
              }
            >
              <option value="Employee">Employee Salary</option>
              <option value="Cleaning Lady">Maushi</option>
              <option value="Security">Security</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">
              Name (Employee / Cleaning Lady)
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Sunita (Cleaning Lady)"
              value={expensesForm.name}
              onChange={(e) =>
                setExpensesForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Month</label>
            <input
              type="month"
              className="form-control"
              value={expensesForm.month}
              onChange={(e) =>
                setExpensesForm((prev) => ({ ...prev, month: e.target.value }))
              }
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Amount (₹)</label>
            <input
              type="number"
              className="form-control"
              min="0"
              value={expensesForm.amount}
              onChange={(e) =>
                setExpensesForm((prev) => ({ ...prev, amount: e.target.value }))
              }
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Notes / Details</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="e.g. Monthly salary, extra cleaning on weekend, etc."
              value={expensesForm.notes}
              onChange={(e) =>
                setExpensesForm((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={() => setShowExpensesModal(false)}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
       onClick={handleSaveStaffExpense}

          >
            Save Expense
          </button>
        </div>
      </div>
    </div> 
  </div>
)}  */}

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
  primaryButton: {
    backgroundColor: "#2563EB",
    color: "#fff",
    border: "1px solid #2563EB",
  },

  successButton: {
    backgroundColor: "#5f7dfc",
    color: "#fff",
    border: "1px solid #5f7dfc",
  },

  warningButton: {
    backgroundColor: "#D97706",
    color: "#fff",
    border: "1px solid #D97706",
  },

  dangerButton: {
    backgroundColor: "#DC2626",
    color: "#fff",
    border: "1px solid #DC2626",
  },
};

export default NewComponant;