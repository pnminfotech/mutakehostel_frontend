import React, { useState, useEffect,useMemo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit } from "react-icons/fa";
import { FaInfoCircle } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { getDocHref } from "../utils/getDocHref"; // adjust path if needed

import { saveAs } from 'file-saver';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { FaBolt, FaReceipt,FaEye ,FaTrash } from 'react-icons/fa'; // example icons
import { FaSearch } from 'react-icons/fa';
import { FaSignOutAlt, FaUndo, FaDownload } from "react-icons/fa";
import FormDownload from '../componenet/Maintanace/FormDownload';
import TenantChatbot from '../componenet/TenantChatbot';
// at top
import PaymentNotifications from "../componenet/PaymentNotifications";
import NotificationBell from "../componenet/NotificationBell";
import AdminNotificationBell from "../componenet/AdminNotificationBell";





import RoomManager from './RoomManager'; // adjust path if needed
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
  const [editRentAmount, setEditRentAmount] = useState('');
  const [editRentDate, setEditRentDate] = useState('');
   const [activeTab, setActiveTab] = useState('light');
    const [lightBills, setLightBills] = useState([]);
    // const [activeTab, setActiveTab] = useState('light'); // 'light' or 'other'
const [searchText, setSearchText] = useState('');
const [leaveDates, setLeaveDates] = useState({});
const [deletedData, setDeletedData] = useState([]);
const [showLeaveModal, setShowLeaveModal] = useState(false);
const [selectedLeaveDate, setSelectedLeaveDate] = useState('');
const [currentLeaveId, setCurrentLeaveId] = useState(null);
const [currentLeaveName, setCurrentLeaveName] = useState('');
const [showRentModal, setShowRentModal] = useState(false);
const [selectedRentDetails, setSelectedRentDetails] = useState([]);
// const [selectedTenantName, setSelectedTenantName] = useState('');
const [showDetailsModal, setShowDetailsModal] = useState(false);
const [selectedTenant, setSelectedTenant] = useState(null);
////form
const [showFModal, setShowFModal] = useState(false);
const [selectedRowData, setSelectedRowData] = useState(null);
const [lang, setLang] = useState("en"); // 'en' | 'hi' | 'mr'
const [showAddModal, setShowAddModal] = useState(false);
const [newTenant, setNewTenant] = useState({
  srNo: '',
  name: '',
  joiningDate: '',
  roomNo: '',
  depositAmount: '',
  address: '',
  phoneNo: '',
  relativeAddress1: '',
  relativeAddress2: '',
  floorNo: '',
  bedNo: '',
  companyAddress: '',
  dateOfJoiningCollege: '',
  dob: ''
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
const [selectedTenantName, setSelectedTenantName] = useState('');

const [showStatusModal, setShowStatusModal] = useState(false);
const [statusMonths, setStatusMonths] = useState([]);
const [statusTenantName, setStatusTenantName] = useState('');

const [selectedYear, setSelectedYear] = useState('All Records');

const years = ['All Records', ...Array.from(new Set(
  formData.map(d => new Date(d.joiningDate).getFullYear())
)).sort((a, b) => b - a)];





const fetchSrNo = async () => {
  try {
    const response = await axios.get(`${apiUrl}forms/count`);
    setNewTenant(prev => ({ ...prev, srNo: response.data.nextSrNo }));
  } catch (error) {
    console.error("Error fetching Sr No:", error);
  }
};

const openAddModal = () => {
  fetchSrNo();
  setShowAddModal(true);
};

  const apiUrl = 'http://localhost:8000/api/';
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
  const mapped = files.map(f => ({ file: f, relation: "Self" }));
  setDocFiles(prev => [...prev, ...mapped]);
}

function removeDoc(i) {
  setDocFiles(prev => prev.filter((_, idx) => idx !== i));
}

// SAVE handler (posts form + files)
// --- NEW: save wrapper that includes docs ---
async function handleAddTenantWithDocs() {
  try {
    let uploaded = [];

    if (docFiles.length) {
      const fd = new FormData();
      docFiles.forEach((d) => {
        fd.append("documents", d.file);   // file is inside d.file
      });

      const up = await axios.post("http://localhost:8000/api/uploads/docs", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedFiles = up.data?.files || [];

      // attach relation from docFiles
      uploaded = uploadedFiles.map((f, i) => ({
        fileName: docFiles[i]?.file?.name || f.filename || `doc-${i + 1}`,
        relation: docFiles[i]?.relation || "Self",
        url: f.url,  // must come from your upload API
      }));
    }

    const payload = {
      ...newTenant,
      documents: uploaded,  // ✅ now contains actual docs
    };

    console.log("🚀 Payload sending:", JSON.stringify(payload, null, 2));

    await axios.post("http://localhost:8000/api/forms", payload);

    setShowAddModal(false);

    const tenantsRes = await axios.get("http://localhost:8000/api/forms");
    setTenants(tenantsRes.data);
  } catch (err) {
    console.error(err);
    alert(err?.response?.data?.message || err.message || "Failed to save tenant");
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
    else { w *= 0.85; h *= 0.85; }      // then downscale

    if (i === 10) { type = "image/webp"; quality = Math.min(quality, 0.5); }
  }

  // Final tiny attempt
  canvas.width = 128; canvas.height = 128;
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

const buildMonthsTimeline = (formData) => {
  const allDates = [];
  formData.forEach(t => {
    (t.rents || []).forEach(r => r?.date && allDates.push(new Date(r.date)));
    if (t.joiningDate) allDates.push(new Date(t.joiningDate));
  });

  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 1); // include next month
  const minDate =
    allDates.length
      ? new Date(Math.min(...allDates.map(d => new Date(d.getFullYear(), d.getMonth(), 1))))
      : new Date(today.getFullYear(), today.getMonth() - 11, 1); // fallback last 12 months

  const months = [];
  let cursor = new Date(minDate);
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

const getRentForMonth = (rents = [], y, m) => {
  const hit = rents.find((r) => {
    if (!r?.date) return false;
    const d = new Date(r.date);
    return d.getFullYear() === y && d.getMonth() === m;
  });
  return hit ? Number(hit.rentAmount) || 0 : 0;
};

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
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "";

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
    const room = roomsData.find(r => String(r.roomNo) === String(tenant.roomNo));
    const bed  = room?.beds?.find(b => String(b.bedNo) === String(tenant.bedNo));
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
  const rec = (tenant.rents || []).find(r => {
    if (!r?.date) return false;
    const d = new Date(r.date);
    return d.getFullYear() === y && d.getMonth() === m;
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
        setError('Failed to fetch data');
        setLoading(false);
      });
  }, []);

 useEffect(() => {
  axios.get(`${apiUrl}forms`)
    .then(response => {
      const leaveMap = {};
      response.data.forEach(item => {
        if (item.leaveDate) {
          leaveMap[item._id] = new Date(item.leaveDate).toISOString().split("T")[0];
        }
      });
      setLeaveDates(leaveMap);
    })
    .catch(err => console.error("Error fetching leave data:", err));
}, []);
useEffect(() => {
  axios.get(`${apiUrl}forms/archived`)
    .then(response => setDeletedData(response.data))
    .catch(err => console.error("Error fetching archived tenants:", err));
}, []);
useEffect(() => {
  axios.get('http://localhost:8000/api/rooms')
    .then(response => setRoomsData(response.data))
    .catch(err => console.error("Failed to fetch rooms:", err));
}, []);
const handleAddTenant = async () => {
  try {
    // Get the rent price based on selected room and bed
    const selectedRoom = roomsData.find(r => r.roomNo === newTenant.roomNo);
    const selectedBed = selectedRoom?.beds.find(b => b.bedNo === newTenant.bedNo);
    const baseRent = selectedBed?.price || 0;

    // Prepare the tenant object with baseRent included
    const tenantToSave = {
      ...newTenant,
      baseRent,
    };

    await axios.post(`${apiUrl}forms`, tenantToSave);
    alert('Tenant added successfully');
    setShowAddModal(false);

    setNewTenant({
      srNo: '',
      name: '',
      joiningDate: '',
      roomNo: '',
      depositAmount: '',
      address: '',
      phoneNo: '',
      relativeAddress1: '',
      relativeAddress2: '',
      floorNo: '',
      bedNo: '',
      companyAddress: '',
      dateOfJoiningCollege: '',
      dob: '',
      baseRent: '', // optional: can be omitted or cleared
      rentAmount: '', // used temporarily for autofill UI
    });

    const response = await axios.get(apiUrl);
    setFormData(response.data);
  } catch (error) {
    alert('Failed to add tenant: ' + (error.response?.data?.message || error.message));
  }
};
const occupiedBeds = new Set(
  formData
    .filter(t => !t.leaveDate) // exclude tenants who left
    .map(t => `${t.roomNo}-${t.bedNo}`)
);

const getPendingMonthsForStatus = (rents = [], joiningDateStr) => {
  if (!joiningDateStr) return [];

  const now = new Date();
  const currentYear = now.getFullYear();

  // Map paid months
  const paidMonths = new Set(
    rents
      .filter(r => r.date && Number(r.rentAmount) > 0)
      .map(r => {
        const d = new Date(r.date);
        return `${d.getMonth()}-${d.getFullYear()}`;
      })
  );

  const months = [];
  const startMonth = new Date(currentYear, 0); // Jan of current year

  const joinDate = new Date(joiningDateStr);
  const startDate = joinDate > startMonth ? joinDate : startMonth;
  const tempDate = new Date(startDate);

  while (tempDate <= now) {
    const key = `${tempDate.getMonth()}-${tempDate.getFullYear()}`;
    if (!paidMonths.has(key)) {
      months.push(tempDate.toLocaleString('default', { month: 'long', year: 'numeric' }));
    }
    tempDate.setMonth(tempDate.getMonth() + 1);
  }

  return months;
};


// ADD THIS helper in NewComponant component (near other handlers)
const openEditForTenantMonth = (tenantId, monthIdx, year) => {
  const tenant = formData.find(t => t._id === tenantId);
  if (!tenant) return;

  // Prefill the modal to the 1st of the requested month/year
  const date = new Date(year, monthIdx, 1).toISOString().split('T')[0];

  setEditingTenant(tenant);
  setEditRentDate(date);

  // Optional: clear or auto-suggest amount
  // setEditRentAmount(expectFromTenant(tenant, roomsData));
};

const handleDownloadExcel = () => {
  const sheetData = formData.map(item => ({
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
    DOB: item.dob
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tenants");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
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

  rents.forEach(rent => {
    const date = new Date(rent.date);
    const m = date.getMonth();
    const y = date.getFullYear();

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
  const rentStart = new Date(joinDate.getFullYear(), joinDate.getMonth() + 1, 1);

  // Determine the actual starting month (either Jan or 1 month after joining)
  const startDate = rentStart > startOfYear ? rentStart : startOfYear;

  const tempDate = new Date(startDate);
  const paidMonths = new Set(
    rents
      .filter(r => r.date && Number(r.rentAmount) > 0)
      .map(r => {
        const d = new Date(r.date);
        return `${d.getMonth()}-${d.getFullYear()}`;
      })
  );

  const lastPaid = rents
    .filter(r => r.date && Number(r.rentAmount) > 0)
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
      setLeaveDates((prev) => ({ ...prev, [currentLeaveId]: selectedLeaveDate }));
      setShowLeaveModal(false);
    } else {
      alert("Failed to mark leave.");
    }
  } catch (err) {
    console.error("Error setting leave:", err);
  }
};

const getDueMonths = (rents = [], joiningDateStr) => {
  if (!joiningDateStr) return [];

  const joiningDate = new Date(joiningDateStr);
  const startDate = new Date(joiningDate.getFullYear(), joiningDate.getMonth() + 1, 1);
  const now = new Date();
  const currentYear = now.getFullYear();

  const rentMap = new Map();
  rents.forEach(rent => {
    const d = new Date(rent.date);
    const key = `${d.getMonth()}-${d.getFullYear()}`;
    rentMap.set(key, true);
  });

  const months = [];
  const tempDate = new Date(startDate);

  while (tempDate <= now) {
    const year = tempDate.getFullYear();
    const month = tempDate.getMonth();
    const key = `${month}-${year}`;

    if (year === currentYear && !rentMap.has(key)) {
      months.push(tempDate.toLocaleString('default', { month: 'long', year: 'numeric' }));
    }

    tempDate.setMonth(tempDate.getMonth() + 1);
  }

  return months;
};

  const handleEdit = (tenant) => {
    const { rentAmount, date } = getDisplayedRent(tenant.rents);
    setEditingTenant(tenant);
    setEditRentAmount(rentAmount);
    setEditRentDate(date || new Date().toISOString().split('T')[0]);
  };

const handleDelete = async (tenant) => {
  try {
    // Determine current month-year key, matching how backend identifies rent
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthKey = `${currentMonth}-${currentYear}`; // format to match backend
    
    // Make sure you pass monthKey in URL or request body as per backend spec
    await axios.delete(`${apiUrl}form/${tenant._id}/rent/${monthKey}`);
    
    // Refresh data after delete
    const response = await axios.get(apiUrl);
    setFormData(response.data);
  } catch (error) {
    alert('Failed to delete rent: ' + (error.response?.data?.message || error.message));
  }
};






// formupdate

const handleUndoClick = (tenant) => {
  if (!window.confirm(`Undo archive for ${tenant.name}?`)) return;

  axios
    .post(`${apiUrl}forms/restore`, { id: tenant._id })
    .then((response) => {
      const restored = response.data;
      setDeletedData((prev) => prev.filter((item) => item._id !== tenant._id));
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
      ["Leave Date", form.leaveDate ? new Date(form.leaveDate).toLocaleDateString() : "N/A"],
    ];

    if (form.rents && form.rents.length > 0) {
      formatted.push(["Rents", ""]);
      form.rents.forEach((rent, i) => {
        formatted.push([`Rent ${i + 1} Amount`, rent.rentAmount]);
        formatted.push([`Rent ${i + 1} Date`, new Date(rent.date).toLocaleDateString()]);
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
    const response = await axios.put(`${apiUrl}update/${editTenantData._id}`, editTenantData);
    alert("Tenant updated successfully!");

    // Replace updated tenant in list
    setFormData(prev =>
      prev.map(t => t._id === editTenantData._id ? response.data : t)
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
    setFormData(prev => prev.filter(t => t._id !== currentDeleteId));
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
  setSelectedRentDetails(sortedRents);  // 👈 full history now
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

  try {
    const payload = {
      rentAmount: editRentAmount,
      date: editRentDate,
      month: new Date(editRentDate).toLocaleString("default", { month: "short", year: "2-digit" }),
      paymentMode: editPaymentMode || "Cash", // 👈 include payment mode (default to Cash)
    };

    await axios.put(`${apiUrl}form/${editingTenant._id}`, payload);

    setEditingTenant(null);

    // refresh UI
    // window.location.reload(); // or better: refetch tenants
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
  const count = formData.filter(t => {
    const lastRent = t.rents && t.rents.length ? t.rents[t.rents.length - 1] : null;
    if (!lastRent) return true;

    const rentDate = new Date(lastRent.date);
    return rentDate.getMonth() !== now.getMonth() || rentDate.getFullYear() !== now.getFullYear();
  }).length;

  setPendingRents(count);
}, [formData]);



  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (error) return <div className="text-center text-danger mt-5">{error}</div>;


// Filter only tenants who left in the last month or this month
const filteredDeletedData = deletedData.filter(t => t.leaveDate);




  return (
    // <div className="container-fluid py-4" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="container-fluid px-4 py-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <h3 className="fw-bold mb-4">Rent & Deposite Tracker</h3>
          {/* Language selector (sticky and simple) */}
     {/* <div className="d-flex align-items-center gap-2 mb-3">
       <span className="text-muted me-2">Language:</span>
       <div className="btn-group">
         <button className={`btn btn-sm ${lang==='en'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setLang('en')}>English</button>
         <button className={`btn btn-sm ${lang==='hi'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setLang('hi')}>हिन्दी</button>
         <button className={`btn btn-sm ${lang==='mr'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setLang('mr')}>मराठी</button>
       </div>
     </div> */}


{/* ===== Right-corner Payment Notifications (admin) ===== */}

{/* …existing header/buttons… */}
{/* <div style={{ position: "fixed", top: 12, right: 12, zIndex: 10000 }}>
  <NotificationBell
    defaultStatus="pending"
    pollMs={30000}
    // If your server is local and mounted as suggested:
    apiOrigin={process.env.REACT_APP_API_ORIGIN || "http://localhost:8000"}
    pathPrefix="/api/payments"
    onUnreadChange={(n) => console.log("unread:", n)}
  />
</div> */}

{/* <div style={{ marginLeft: "auto" }}>
  <NotificationBell />
</div> */}
 <div>
      {/* ...your header ... */}
      {/* <div style={{ position: "fixed", top: 12, right: 12, zIndex: 10000 }}>
        <AdminNotificationBell />
      </div> */}
      {/* ...rest... */}
    </div>


     <div className="d-flex align-items-center mb-4 flex-wrap"> 
  <select
    className="form-select me-2"
    style={{ width: '150px' }}
    value={selectedYear}
    onChange={(e) => setSelectedYear(Number(e.target.value))}
  >
    {years.map((year) => (
      <option key={year} value={year}>{year}</option>
    ))}
  </select>

  <div style={{ position: 'relative', maxWidth: '300px' }} className="me-2">
    <FaSearch 
      style={{
        position: 'absolute',
        left: '10px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#aaa',
        pointerEvents: 'none',
        zIndex: 1,
        marginLeft:2,
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
  onClick={() => navigate('/roommanager')}
>
  <FaPlus className="me-1" /> Manage Rooms
</button>


 <button
    className="btn me-2"
    style={{backgroundColor:"#3db7b1", color:"white"}}
   onClick={openAddModal}>
   <FaPlus className="me-1" /> Add Tenant
  </button>

  <button
    className="btn me-2"
    style={activeTab === 'light' ? style.colorA : style.colorB}
    onClick={() => {
      setActiveTab('light');
      navigate('/lightbillotherexpenses', { state: { tab: 'light' } });
    }}
  >
    <FaBolt className="me-1" />
    Light Bill
  </button>

  <button
    className="btn me-2"
    style={activeTab === 'other' ? style.colorA : style.colorB}
    onClick={() => {
      setActiveTab('other');
      navigate('/lightbillotherexpenses', { state: { tab: 'other' } });
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
    style={activeTab === 'light' ? style.colorA : style.colorB}
    onClick={() => setShowAddModal(true)}
  >
    <FaPlus className="me-1" />
    Add {activeTab === 'light' ? 'Light Bill' : 'Other Expense'}
  </button>

  <button
    className="btn me-2"
    style={{ backgroundColor: "#483f3fab", color: "white" }}
    onClick={() => handleNavigation('/maindashboard')}
  >
    <FaArrowLeft className="me-1" />
    Back 
  </button>

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
            <h4 className="fw-bold"> {formData.filter(d => !d.leaveDate).length}</h4>
          </div>
        </div>
      



<div className="col-md-2">
  <div className="bg-white border rounded shadow-sm p-3 text-center">
    <h6 className="text-muted mb-1">Vacant</h6>
    <h4 className="fw-bold text-danger">{formData.filter(d => d.leaveDate).length}</h4>
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
    <h4 className="fw-bold text-danger">{formData.filter(d => Number(d.depositAmount) > 0).length}</h4>
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
            <th rowSpan={2} style={{ whiteSpace: "nowrap", width: 60 }}>Sr</th>
            <th rowSpan={2} style={{ minWidth: 260 }}>Name</th>

            <th colSpan={PAGE} className="text-center" style={{ minWidth: PAGE * 140 }}>
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

            <th rowSpan={2} style={{ whiteSpace: "nowrap" }}>Due</th>
            <th rowSpan={2} style={{ whiteSpace: "nowrap" }}>Rent Status</th>
            <th rowSpan={2} style={{ whiteSpace: "nowrap" }}>Actions</th>
          </tr>

          {/* Row 2: the 3 month sub-column headers */}
          <tr className="text-secondary">
            {visibleMonths.map((m, i) => (
              <th key={`${m.y}-${m.m}-${i}`} className="text-center" style={{ minWidth: 140 }}>
                {m.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {formData
            .filter((tenant) => {
              const name = tenant.name?.toLowerCase() || "";
              const bed = tenant.bedNo?.toString() || "";
              const joinYear = tenant.joiningDate ? new Date(tenant.joiningDate).getFullYear() : null;
              const leaveDate = leaveDates[tenant._id];
              const isLeaved = leaveDate && new Date(leaveDate) < new Date();

              return (
                !isLeaved &&
                (name.includes((searchText || "").toLowerCase()) || bed.includes(searchText || "")) &&
                (selectedYear === "All Records" || joinYear === Number(selectedYear))
              );
            })
            .map((tenant, rowIdx) => {
              const dueAmount = calculateDue(tenant.rents, tenant.joiningDate);

              return (
                <tr key={tenant._id}>
                  {/* Sr */}
                  <td className="text-muted">{rowIdx + 1}</td>

                  {/* ✅ Name column with Deposit restored */}
                  <td>
                    <div
                      style={{ cursor: "pointer", color: "#111" }}
                      onClick={() => { setSelectedRowData(tenant); setShowFModal(true); }}
                    >
                      <div className="fw-semibold">{tenant.name}</div>

                      {/* Deposit amount */}
                      <small className="text-muted d-block">
                        Deposit: ₹{Number(tenant.depositAmount || 0).toLocaleString("en-IN")}
                      </small>

                      {/* Phone */}
                      <div className="text-muted small">{tenant.phoneNo}</div>

                      {/* Room badge + base monthly rent */}
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <span
                          className="badge rounded-pill"
                          style={{ background: "#f7a3ad", color: "#fff", fontWeight: 600 }}
                        >
                          {tenant.roomNo || "—"}
                        </span>

                        {/* <span className="text-muted small">
                          <span className="me-1">👤</span>
                          ₹ {Number(tenant.rent || tenant.expectedRent || 0).toLocaleString("en-IN")}
                        </span> */}
                      </div>
                    </div>
                  </td>

                  {/* Month cells: badge + date + amount + extra */}
               {visibleMonths.map((m, i) => {
  const c = getMonthCell(tenant, m.y, m.m);
  const extraNum = Number(c.extra || 0);

  // 📌 Compare this month vs tenant's joining month
  const joinDate = new Date(tenant.joiningDate);
  const joinYM = joinDate.getFullYear() * 12 + joinDate.getMonth();
  const cellYM = m.y * 12 + m.m;

  // 👉 If this cell is before joining, return blank
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
        onClick={() => handleEdit(tenant)}
        title="Click to edit this tenant's rent"
      >
        {/* Status badge */}
        <span className={`badge rounded-pill px-3 py-2 ${c.cls}`}>{c.label}</span>

        {/* Paid/record date */}
        <div className="small text-muted mt-1" style={{ lineHeight: 1 }}>
          {c.dateStr}
        </div>

        {/* Amounts */}
        {c.label === "Paid" && (
          <div className="small mt-1 fw-semibold" style={{ lineHeight: 1 }}>
            ₹{c.amountPaid.toLocaleString("en-IN")}
            {c.expected > c.amountPaid && (
              <span className="text-danger ms-1">
                (−₹{(c.expected - c.amountPaid).toLocaleString("en-IN")})
              </span>
            )}
          </div>
        )}

        {c.label === "Pend" && (
          <div className="small mt-1 fw-semibold" style={{ lineHeight: 1 }}>
            ₹{c.amountPaid.toLocaleString("en-IN")}{" "}
            <span className="text-muted">/ ₹{c.expected.toLocaleString("en-IN")}</span>
            {c.outstanding > 0 && (
              <div className="text-danger" style={{ lineHeight: 1 }}>
                Due: ₹{c.outstanding.toLocaleString("en-IN")}
              </div>
            )}
          </div>
        )}

        {c.label === "Due" && (
          <div className="small mt-1 fw-semibold text-danger" style={{ lineHeight: 1 }}>
            {
              (() => {
                const val = toNum(c.outstanding);
                const fb = expectFromTenant(tenant, roomsData);
                return `₹${(val || fb).toLocaleString("en-IN")}`;
              })()
            }
          </div>
        )}

        {/* Extra amount */}
        {extraNum !== 0 && (
          <div
            className="small mt-1 fw-semibold"
            style={{ color: extraNum > 0 ? "#d63384" : "#198754" }}
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


                  {/* Total Due */}
                  <td
                    style={{ cursor: "pointer", color: dueAmount > 0 ? "red" : "inherit" }}
                    onClick={() => {
                      const dueList = getDueMonths(tenant.rents, tenant.joiningDate);
                      setDueMonths(dueList);
                      setSelectedTenantName(tenant.name);
                      setShowDueModal(true);
                    }}
                  >
                    ₹{dueAmount.toLocaleString("en-IN")}
                  </td>

                  {/* Overall Rent Status */}
                  <td>
                    <span
                      className={`badge rounded-pill px-3 py-2 ${
                        dueAmount === 0 ? "bg-success" : "bg-warning text-dark"
                      }`}
                      style={{ cursor: dueAmount > 0 ? "pointer" : "default" }}
                      onClick={() => {
                        if (dueAmount > 0) {
                          const pending = getPendingMonthsForStatus(tenant.rents, tenant.joiningDate);
                          setStatusMonths(pending);
                          setStatusTenantName(tenant.name);
                          setShowStatusModal(true);
                        }
                      }}
                    >
                      {dueAmount === 0 ? "Paid" : "Pending"}
                    </span>
                  </td>

                  {/* Actions — unchanged */}
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => { setEditTenantData(tenant); setShowEditModal(true); }}
                    >
                      <FaEdit />
                    </button>

                    <button
                      className="btn btn-sm"
                      style={{ backgroundColor: "#3db7b1", color: "white" }}
                      onClick={() => { setSelectedTenant(tenant); setShowDetailsModal(true); }}
                    >
                      <FaEye />
                    </button>

                    <button
                      className="btn btn-sm me-2"
                      onClick={() => handleLeave(tenant)}
                      style={{ backgroundColor: "#f49f36", color: "white" }}
                    >
                      <FaSignOutAlt />
                    </button>

                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => openDeleteConfirmation(tenant._id)}
                    >
                      <FaTrash />
                    </button>

                    {leaveDates[tenant._id] && (
                      <div className="text-danger mt-1" style={{ fontSize: 12 }}>
                        Leave on{" "}
                        {new Date(leaveDates[tenant._id]).toLocaleDateString("en-GB", {
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
                  <tr key={index}>
                    <td>
                      {tenant.roomNo} <div className="text-muted small">bed {tenant.bedNo}</div>
                    </td>
                    <td style={{ cursor: "pointer" }} onClick={() => showRentHistory(tenant)}>
                      {tenant.name}
                    </td>
                    <td>{new Date(tenant.joiningDate).toLocaleDateString()}</td>
                    <td>{new Date(tenant.leaveDate).toLocaleDateString()}</td>
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
                        style={{ backgroundColor: "#416ed7d1", color: "white" }}
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
  <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog modal-lg modal-dialog-scrollable">
  <div className="modal-content">
  <div className="modal-header">
    <h5 className="modal-title">Add New Tenant</h5>
    <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
  </div>
  <div className="modal-body">
    <div className="row g-3">
      {/* Standard Inputs */}
      {[
        { label: 'Sr No', key: 'srNo', type: 'text', readOnly: true },
        { label: 'Name', key: 'name' },
        { label: 'Joining Date', key: 'joiningDate', type: 'date' },
        { label: 'Deposit Amount', key: 'depositAmount', type: 'number' },
        { label: 'Phone No', key: 'phoneNo' },
        { label: 'Address', key: 'address' },
        { label: 'Relative Address 1', key: 'relativeAddress1' },
        { label: 'Relative Address 2', key: 'relativeAddress2' },
        // { label: 'Floor No', key: 'floorNo' },
        { label: 'Company Address / College', key: 'companyAddress' },
        { label: 'Date of Joining College / Company', key: 'dateOfJoiningCollege', type: 'date' },
        { label: 'Date of Birth', key: 'dob', type: 'date' },
      ].map(({ label, key, type = 'text', readOnly = false }) => (
        <div className="col-md-6" key={key}>
          <label className="form-label">{label}</label>
          <input
            type={type}
            className="form-control"
            value={newTenant[key]}
            readOnly={readOnly}
            onChange={(e) => setNewTenant({ ...newTenant, [key]: e.target.value })}
          />
        </div>
      ))}

      {/* Room No Dropdown */}
      <div className="col-md-6">
        <label className="form-label">Room No</label>
        <select
          className="form-control"
          value={newTenant.roomNo}
          onChange={(e) => {
            const roomNo = e.target.value;
            const selectedRoom = roomsData.find(room => String(room.roomNo) === String(roomNo));

            setNewTenant(prev => ({
              ...prev,
              roomNo,
              bedNo: '',                 // reset bed
              floorNo: selectedRoom?.floorNo || '',
              baseRent: '',              // reset rents
              rentAmount: '',
              newBedNo: '',              // reset inline form fields
              newBedPrice: '',
              __bedMsg: '',
              __savingBed: false,
            }));
          }}
        >
          <option value="">Select Room</option>
          {roomsData.map(room => (
            <option key={room.roomNo} value={room.roomNo}>
              {room.roomNo} (Floor {room.floorNo})
            </option>
          ))}
        </select>
      </div>

      {/* Bed No Dropdown + inline short form (no popups) */}
      <div className="col-md-6">
        <label className="form-label">Bed No</label>
        <select
          className="form-control"
          value={newTenant.bedNo || ''}
          onChange={(e) => {
            const bedNo = e.target.value;

            if (bedNo === "__other__") {
              setNewTenant(prev => ({
                ...prev,
                bedNo: "__other__",
                baseRent: '',
                rentAmount: '',
                newBedNo: prev.newBedNo || '',
                newBedPrice: prev.newBedPrice || '',
                __bedMsg: '',
                __savingBed: false,
              }));
              return;
            }

            const selectedRoom = roomsData.find(r => String(r.roomNo) === String(newTenant.roomNo));
            const selectedBed  = selectedRoom?.beds.find(b => String(b.bedNo) === String(bedNo));

            setNewTenant(prev => ({
              ...prev,
              bedNo,
              baseRent: selectedBed?.price ?? '',
              rentAmount: selectedBed?.price ?? '',
              newBedNo: '',
              newBedPrice: '',
              __bedMsg: '',
              __savingBed: false,
            }));
          }}
          disabled={!newTenant.roomNo}
        >
          <option value="">{newTenant.roomNo ? "Select Bed" : "Select a Room first"}</option>

          {roomsData
            .find(r => String(r.roomNo) === String(newTenant.roomNo))
            ?.beds
            .filter(bed => !occupiedBeds.has(`${newTenant.roomNo}-${bed.bedNo}`))
            .map(bed => (
              <option key={bed.bedNo} value={bed.bedNo}>
                {bed.bedNo} - {bed.category || '—'} - ₹{bed.price ?? '—'}
              </option>
            ))}

          {!!newTenant.roomNo && <option value="__other__">Other (add new bed…)</option>}
        </select>

        {newTenant.bedNo === "__other__" && (
          <div className="mt-3 p-3 border rounded bg-light">
            <div className="row g-2">
              <div className="col-6">
                <label className="form-label">New Bed No</label>
                <input
                  className="form-control"
                  value={newTenant.newBedNo || ''}
                  onChange={(e) => setNewTenant(prev => ({ ...prev, newBedNo: e.target.value, __bedMsg: '' }))}
                  placeholder="e.g., B4"
                />
                {!((newTenant.newBedNo || '').trim()) && (
                  <small className="text-danger">Bed No is required</small>
                )}
              </div>

              <div className="col-6">
                <label className="form-label">
                  Price <span className="text-muted">(optional)</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={newTenant.newBedPrice ?? ''}
                  onChange={(e) => setNewTenant(prev => ({ ...prev, newBedPrice: e.target.value, __bedMsg: '' }))}
                  placeholder="e.g., 3500 (optional)"
                  min="0"
                />
                {(newTenant.newBedPrice !== '' && newTenant.newBedPrice != null) &&
                  (Number(newTenant.newBedPrice) < 0 || Number.isNaN(Number(newTenant.newBedPrice))) && (
                    <small className="text-danger">Enter a non-negative number or leave blank</small>
                )}
              </div>
            </div>

            {newTenant.__bedMsg ? (
              <div className="mt-2">
                <small className={newTenant.__bedMsg.startsWith('✔') ? 'text-success' : 'text-danger'}>
                  {newTenant.__bedMsg}
                </small>
              </div>
            ) : null}

            <div className="mt-3 d-flex gap-2">
              <button
                type="button"
                className="btn btn-success"
                disabled={
                  newTenant.__savingBed ||
                  !((newTenant.newBedNo || '').trim()) ||
                  ((newTenant.newBedPrice !== '' && newTenant.newBedPrice != null) &&
                    (Number(newTenant.newBedPrice) < 0 || Number.isNaN(Number(newTenant.newBedPrice))))
                }
                onClick={async () => {
                  const roomNo = newTenant.roomNo;
                  const bedNoToAdd = (newTenant.newBedNo || '').trim();
                  const priceStr   = newTenant.newBedPrice;

                  const priceProvided = priceStr !== '' && priceStr != null;
                  const priceNum = priceProvided ? Number(priceStr) : null;

                  const roomIdx = roomsData.findIndex(r => String(r.roomNo) === String(roomNo));
                  if (roomIdx === -1) {
                    setNewTenant(prev => ({ ...prev, __bedMsg: 'Room not found.' }));
                    return;
                  }
                  const exists = roomsData[roomIdx].beds?.some(
                    b => String(b.bedNo).trim().toLowerCase() === bedNoToAdd.toLowerCase()
                  );
                  if (exists) {
                    setNewTenant(prev => ({ ...prev, __bedMsg: 'A bed with this number already exists in this room.' }));
                    return;
                  }

                  try {
                    setNewTenant(prev => ({ ...prev, __savingBed: true, __bedMsg: '' }));

                    const payload = { bedNo: bedNoToAdd };
                    if (priceProvided) payload.price = priceNum;

                    await axios.post(
                      `http://localhost:8000/api/rooms/${encodeURIComponent(roomNo)}/bed`,
                      payload
                    );

                    setRoomsData(prev => {
                      const copy = [...prev];
                      const r = { ...copy[roomIdx] };
                      r.beds = [
                        ...(r.beds || []),
                        { bedNo: bedNoToAdd, ...(priceProvided ? { price: priceNum } : {}) }
                      ];
                      copy[roomIdx] = r;
                      return copy;
                    });

                    setNewTenant(prev => ({
                      ...prev,
                      bedNo: bedNoToAdd,
                      baseRent: priceProvided ? priceNum : '',
                      rentAmount: priceProvided ? priceNum : '',
                      newBedNo: '',
                      newBedPrice: '',
                      __bedMsg: '✔ Bed added successfully',
                      __savingBed: false,
                    }));
                  } catch (err) {
                    console.error(err);
                    setNewTenant(prev => ({
                      ...prev,
                      __bedMsg: 'Could not save the bed. Check network/API route.',
                      __savingBed: false,
                    }));
                  }
                }}
              >
                {newTenant.__savingBed ? 'Saving…' : 'Add & Save'}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setNewTenant(prev => ({
                    ...prev,
                    bedNo: '',
                    newBedNo: '',
                    newBedPrice: '',
                    __bedMsg: '',
                    __savingBed: false,
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
        <label className="form-label">Base Rent Amount (Auto-Filled)</label>
        <input className="form-control" value={newTenant.baseRent || ''} readOnly />
      </div>

      <div className="col-md-6">
        <label className="form-label">Rent Amount (Auto-Filled)</label>
        <input className="form-control" value={newTenant.rentAmount || ''} readOnly />
      </div>

      {/* --- NEW: Documents field (images only, auto-compress to ≤10KB each) --- */}
      <div className="col-md-6">
  <label className="form-label">Upload Documents</label>
  <input
    type="file"
    className="form-control form-control-sm"
    multiple
    accept="image/*"
    onChange={handleDocsChange}
  />

  {docMsg && <small className="d-block mt-2 text-danger">{docMsg}</small>}

  {docFiles.length > 0 && (
    <ul className="mt-2 list-unstyled">
      {docFiles.map((d, i) => (
        <li key={i} className="d-flex align-items-center justify-content-between border rounded px-2 py-1 mb-1" style={{fontSize:"0.85rem"}}>
          <div className="d-flex flex-column flex-md-row align-items-md-center gap-2" style={{maxWidth:"75%"}}>
            <span className="text-truncate">{d.file.name} <small className="text-muted">({Math.ceil(d.file.size/1024)} KB raw)</small></span>
            <select
              className="form-select form-select-sm"
              value={d.relation}
              onChange={(e)=> {
                const copy = [...docFiles];
                copy[i] = {...copy[i], relation: e.target.value};
                setDocFiles(copy);
              }}
            >
              <option value="Self">Self</option>
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Husband">Husband</option>
            </select>
          </div>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={()=>removeDoc(i)}>Remove</button>
        </li>
      ))}
    </ul>
  )}
</div>

      {/* --- END Documents --- */}
    </div>
  </div>

  <div className="modal-footer">
    <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>

    {/* Call the wrapper so docs are included */}
    <button
      className="btn"
      onClick={handleAddTenantWithDocs}
      style={{ backgroundColor: "rgb(94, 182, 92)", color: "white" }}
    >
      <FaPlus className="me-2" /> Save Tenant
    </button>
  </div>
</div>


    </div>
  </div>
)}

{showStatusModal && (
  <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog">
     <div className="modal-content">
  <div className="modal-header">
    <h5 className="modal-title">Add New Tenant</h5>
    <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
  </div>

  <div className="modal-body">
    <div className="row g-3">
      {/* Standard Inputs */}
      {[
        { label: 'Sr No', key: 'srNo', type: 'text', readOnly: true },
        { label: 'Name', key: 'name' },
        { label: 'Joining Date', key: 'joiningDate', type: 'date' },
        { label: 'Deposit Amount', key: 'depositAmount', type: 'number' },
        { label: 'Phone No', key: 'phoneNo' },
        { label: 'Address', key: 'address' },
        { label: 'Relative Address 1', key: 'relativeAddress1' },
        { label: 'Relative Address 2', key: 'relativeAddress2' },
        // { label: 'Floor No', key: 'floorNo' },
        { label: 'Company Address / College', key: 'companyAddress' },
        { label: 'Date of Joining College', key: 'dateOfJoiningCollege', type: 'date' },
        { label: 'Date of Birth', key: 'dob', type: 'date' },
      ].map(({ label, key, type = 'text', readOnly = false }) => (
        <div className="col-md-6" key={key}>
          <label className="form-label">{label}</label>
          <input
            type={type}
            className="form-control"
            value={newTenant[key] || ''}
            readOnly={readOnly}
            onChange={(e) => setNewTenant({ ...newTenant, [key]: e.target.value })}
          />
        </div>
      ))}

      {/* Room No Dropdown */}
      <div className="col-md-6">
        <label className="form-label">Room No</label>
        <select
          className="form-control"
          value={newTenant.roomNo || ''}
          onChange={(e) => {
            const roomNo = e.target.value;
            const selectedRoom = roomsData.find(room => String(room.roomNo) === String(roomNo));

            setNewTenant(prev => ({
              ...prev,
              roomNo,
              bedNo: '',           // reset bed
              floorNo: selectedRoom?.floorNo || '',
              baseRent: '',        // reset base rent too
              rentAmount: '',      // reset rent
              newBedNo: '',        // reset inline form fields (if any)
              newBedPrice: '',
            }));
          }}
        >
          <option value="">Select Room</option>
          {roomsData.map(room => (
            <option key={room.roomNo} value={room.roomNo}>
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
          value={newTenant.bedNo || ''}
          onChange={(e) => {
            const bedNo = e.target.value;

            // If "Other", switch to inline form
            if (bedNo === "__other__") {
              setNewTenant(prev => ({
                ...prev,
                bedNo: "__other__",
                baseRent: '',
                rentAmount: '',
                newBedNo: prev.newBedNo || '',
                newBedPrice: prev.newBedPrice || ''
              }));
              return;
            }

            // Normal path: pick existing bed
            const selectedRoom = roomsData.find(r => String(r.roomNo) === String(newTenant.roomNo));
            const selectedBed = selectedRoom?.beds.find(b => String(b.bedNo) === String(bedNo));

            setNewTenant(prev => ({
              ...prev,
              bedNo,
              baseRent: selectedBed?.price ?? '',
              rentAmount: selectedBed?.price ?? '',
              newBedNo: '',
              newBedPrice: ''
            }));
          }}
          disabled={!newTenant.roomNo}
        >
          <option value="">{newTenant.roomNo ? "Select Bed" : "Select a Room first"}</option>

          {roomsData
            .find(r => String(r.roomNo) === String(newTenant.roomNo))
            ?.beds
            .filter(bed => !occupiedBeds.has(`${newTenant.roomNo}-${bed.bedNo}`)) // only unoccupied beds
            .map(bed => (
              <option key={bed.bedNo} value={bed.bedNo}>
                {bed.bedNo} - {bed.category || '—'} - ₹{bed.price ?? '—'}
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
                  value={newTenant.newBedNo || ''}
                  onChange={(e) =>
                    setNewTenant(prev => ({ ...prev, newBedNo: e.target.value }))
                  }
                  placeholder="e.g., B4"
                />
              </div>
              <div className="col-6">
                <label className="form-label">
                  Price <span className="text-muted">(optional)</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={newTenant.newBedPrice ?? ''}
                  onChange={(e) =>
                    setNewTenant(prev => ({ ...prev, newBedPrice: e.target.value }))
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
                  const bedNoToAdd = (newTenant.newBedNo || '').trim();
                  if (!bedNoToAdd) return alert("Bed No is required.");

                  // validate optional price if provided
                  let priceNum = null;
                  if (newTenant.newBedPrice !== '' && newTenant.newBedPrice !== undefined && newTenant.newBedPrice !== null) {
                    priceNum = Number(newTenant.newBedPrice);
                    if (isNaN(priceNum) || priceNum < 0) {
                      return alert("Enter a valid non-negative price, or leave it blank.");
                    }
                  }

                  // duplicate check (within room)
                  const roomIdx = roomsData.findIndex(r => String(r.roomNo) === String(roomNo));
                  if (roomIdx === -1) return alert("Room not found.");
                  const exists = roomsData[roomIdx].beds?.some(
                    b => String(b.bedNo).trim().toLowerCase() === bedNoToAdd.toLowerCase()
                  );
                  if (exists) return alert("A bed with this number already exists in this room.");

                  try {
                    // 1) persist to backend (send price only if provided)
                    const payload = { bedNo: bedNoToAdd };
                    if (priceNum !== null) payload.price = priceNum;
                    await axios.post(`/api/rooms/${encodeURIComponent(roomNo)}/beds`, payload);

                    // 2) update roomsData locally
                    setRoomsData(prev => {
                      const copy = [...prev];
                      const r = { ...copy[roomIdx] };
                      r.beds = [
                        ...(r.beds || []),
                        { bedNo: bedNoToAdd, ...(priceNum !== null ? { price: priceNum } : {}) }
                      ];
                      copy[roomIdx] = r;
                      return copy;
                    });

                    // 3) select new bed & fill rents only if price provided
                    setNewTenant(prev => ({
                      ...prev,
                      bedNo: bedNoToAdd,
                      baseRent: priceNum !== null ? priceNum : '',
                      rentAmount: priceNum !== null ? priceNum : '',
                      newBedNo: '',
                      newBedPrice: ''
                    }));
                  } catch (err) {
                    console.error(err);
                    alert("Could not save the new bed. Please try again.");
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
                  setNewTenant(prev => ({
                    ...prev,
                    bedNo: '',
                    newBedNo: '',
                    newBedPrice: '',
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
        <label className="form-label">Base Rent Amount (Auto-Filled)</label>
        <input
          className="form-control"
          value={newTenant.baseRent || ''}
          readOnly
        />
      </div>

      {/* Auto-Filled Rent Price */}
      <div className="col-md-6">
        <label className="form-label">Rent Amount (Auto-Filled)</label>
        <input
          className="form-control"
          value={newTenant.rentAmount || ''}
          readOnly
        />
      </div>
    </div>
  </div>

  <div className="modal-footer">
    <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
    <button
      className="btn"
      onClick={handleAddTenant}
      style={{ backgroundColor: "rgb(94, 182, 92)", color: "white" }}
    >
      <FaPlus className="me-2" /> Save Tenant
    </button>
  </div>
</div>

    </div>
  </div>
)}

{showDueModal && (
  <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Due Months for {selectedTenantName}</h5>
          <button type="button" className="btn-close" onClick={() => setShowDueModal(false)}></button>
        </div>
        <div className="modal-body">
          {dueMonths.length > 0 ? (
            <ul className="list-group">
              {dueMonths.map((month, idx) => (
                <li key={idx} className="list-group-item">{month}</li>
              ))}
            </ul>
          ) : (
            <p className="text-success">No dues!</p>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowDueModal(false)}>Close</button>
        </div>
      </div>
    </div>
  </div>
)}

{showEditModal && editTenantData && (
  <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog modal-dialog-scrollable">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Edit Tenant - {editTenantData.name}</h5>
          <button className="btn-close" onClick={() => setShowEditModal(false)}></button>
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
          ].map(field => (
            <div className="mb-3" key={field.key}>
              <label className="form-label">{field.label}</label>
              <input
                type="text"
                className="form-control"
                value={editTenantData[field.key] || ''}
                onChange={(e) =>
                  setEditTenantData(prev => ({ ...prev, [field.key]: e.target.value }))
                }
              />
            </div>
          ))}
          <div className="mb-3">
            <label className="form-label">Joining Date</label>
            <input
              type="date"
              className="form-control"
              value={editTenantData.joiningDate?.split('T')[0]}
              onChange={(e) =>
                setEditTenantData(prev => ({ ...prev, joiningDate: e.target.value }))
              }
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleTenantUpdate}>
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
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1050
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
          <button className="btn-close" onClick={() => setShowFModal(false)}></button>
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
  <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog modal-lg">
   
   

   <div className="modal-content">
  <div className="modal-header">
    <h5 className="modal-title">Tenant Details - {selectedTenant.name}</h5>
    <button className="btn-close" onClick={() => setShowDetailsModal(false)}></button>
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
<div className="tab-pane fade" id="personal" role="tabpanel" aria-labelledby="personal-tab">
  <h6>Personal Information</h6>
  <ul className="list-group mb-3">
    <li className="list-group-item">Name: {selectedTenant.name}</li>
    <li className="list-group-item">Room No: {selectedTenant.roomNo}</li>
    <li className="list-group-item">Bed No: {selectedTenant.bedNo}</li>
    <li className="list-group-item">Phone: {selectedTenant.phoneNo}</li>
    <li className="list-group-item">
      Joining Date:{" "}
      {selectedTenant.joiningDate
        ? new Date(selectedTenant.joiningDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "—"}
    </li>
    <li className="list-group-item">
      Deposit: ₹{Number(selectedTenant.depositAmount || 0).toLocaleString("en-IN")}
    </li>
    <li className="list-group-item">Address: {selectedTenant.address}</li>
    <li className="list-group-item">Company Address: {selectedTenant.companyAddress}</li>
    <li className="list-group-item">
      Date of Birth:{" "}
      {selectedTenant.dob
        ? new Date(selectedTenant.dob).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "—"}
    </li>
    <li className="list-group-item">
      Date of Joining College/Company:{" "}
      {selectedTenant.dateOfJoiningCollege
        ? new Date(selectedTenant.dateOfJoiningCollege).toLocaleDateString("en-GB", {
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
                  alert("No file URL available for this document.");
                  return;
                }
                window.open(url, "_blank", "noopener,noreferrer");
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
                  alert("No file URL available for download.");
                  return;
                }

                try {
                  const response = await fetch(url, { mode: "cors" });
                  const blob = await response.blob();

                  const link = document.createElement("a");
                  link.href = window.URL.createObjectURL(blob);
                  link.download = doc.fileName || `document-${i + 1}`;
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
 <div className="tab-pane fade show active" id="rent" role="tabpanel" aria-labelledby="rent-tab">
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
          const rent = selectedTenant.rents?.find(
            (r) =>
              new Date(r.date).getMonth() === i &&
              new Date(r.date).getFullYear() === monthDate.getFullYear()
          );

          const joiningDate = new Date(selectedTenant.joiningDate);
          const rentStartMonth = new Date(joiningDate.getFullYear(), joiningDate.getMonth() + 1, 1);
          const isFutureMonth = monthDate > new Date();
          const isBeforeRentStart = monthDate < rentStartMonth;

          return (
            <tr key={i}>
              {/* Month */}
              <td>{monthDate.toLocaleString("default", { month: "long", year: "numeric" })}</td>

              {/* Date */}
              <td>{rent ? new Date(rent.date).toLocaleDateString() : "—"}</td>

              {/* Payment Mode */}
              <td>{rent ? (rent.paymentMode || "Cash") : "—"}</td>

              {/* Amount */}
              <td>{rent ? `₹${Number(rent.rentAmount).toLocaleString("en-IN")}` : "—"}</td>

              {/* Status */}
              <td>
                {isBeforeRentStart ? (
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
    <button className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>
      Close
    </button>
  </div>
</div>







      
    </div>
  </div>
)}



{/* editmodel */}
      {editingTenant && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
           <div className="modal-content">
  <div className="modal-header">
    <h5 className="modal-title">Edit Rent for {editingTenant.name}</h5>
    <button type="button" className="btn-close" onClick={() => setEditingTenant(null)}></button>
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
    <button type="button" className="btn btn-secondary" onClick={() => setEditingTenant(null)}>Cancel</button>
    <button type="button" className="btn btn-primary" onClick={handleSave}>Save</button>
  </div>
</div>

          </div>
        </div>
      )}

{showLeaveModal && (
  <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Select Leave Date</h5>
          <button type="button" className="btn-close" onClick={() => setShowLeaveModal(false)}></button>
        </div>
        <div className="modal-body">
          <input
            type="date"
            className="form-control"
            value={selectedLeaveDate}
            onChange={(e) => setSelectedLeaveDate(e.target.value)}
          />
          <p className="mt-3">
            Are you sure you want <strong>{currentLeaveName}</strong> to leave on <strong>{selectedLeaveDate || "..."}</strong>?
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowLeaveModal(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={confirmLeave}>Confirm Leave</button>
        </div>
      </div>
    </div>
  </div>
)}
{showRentModal && (
  <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Last 3 Rents - {selectedTenantName}</h5>
          <button type="button" className="btn-close" onClick={() => setShowRentModal(false)}></button>
        </div>
        <div className="modal-body">
          {selectedRentDetails.length > 0 ? (
            <ul className="list-group">
              {selectedRentDetails.map((rent, index) => (
                <li className="list-group-item" key={index}>
                  ₹{Number(rent.rentAmount).toLocaleString('en-IN')} – {new Date(rent.date).toLocaleDateString()}
                </li>
              ))}
            </ul>
          ) : (
            <p>No rent data available.</p>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowRentModal(false)}>Close</button>
        </div>
      </div>
    </div>
  </div>
)}
{showPasswordPrompt && (
  <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Enter Password</h5>
          <button className="btn-close" onClick={() => setShowPasswordPrompt(false)}></button>
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
          <button className="btn btn-secondary" onClick={() => setShowPasswordPrompt(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={verifyPassword}>Submit</button>
        </div>
      </div>
    </div>
  </div>
)}
{showDeleteConfirmation && (
  <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Confirm Deletion</h5>
          <button className="btn-close" onClick={() => setShowDeleteConfirmation(false)}></button>
        </div>
        <div className="modal-body">
          Are you sure you want to delete this tenant?
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowDeleteConfirmation(false)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDeleteConfirm}>Yes, Delete</button>
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
  lang={lang}
  helpers={{
    calculateDue,
    expectFromTenant: (tenant, roomsData) => expectFromTenant(tenant, roomsData),
    toNum: (v) => Number(String(v).replace(/[,₹\s]/g, "")) || 0,
  }}
  onOpenEdit={openEditForTenantMonth}   // <--- NEW
/>


</>

    </div>
  );
}
const style = {
  colorA: {
    backgroundColor: '#387fbc',
    color: '#fff',
    border: '1px solid #387fbc',
  },
  colorB: {
    backgroundColor: '#5eb65c',
    color: '#fff',
    border: '1px solid #5eb65c',
  },
  successButton: {
    backgroundColor: '#efad4d',
    color: '#fff',
    border: '1px solid #efad4d',
  },
};
export default NewComponant;
