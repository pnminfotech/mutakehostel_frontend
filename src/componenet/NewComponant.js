import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import './Style.css';
import "../Pages/NewComponent.css";

import axios from "axios";
// import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaBars } from "react-icons/fa";
import { FaInfoCircle } from "react-icons/fa";
import * as XLSX from "xlsx";
import { getDocHref } from "../utils/getDocHref"; // adjust path if needed
import { FaBolt, FaReceipt, FaEye, FaTrash, FaExchangeAlt } from "react-icons/fa";

import { saveAs } from "file-saver";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
 // example icons
import StaffExpenses from "../componenet/StaffExpenses";

// or "../components/StaffExpense" if you kept it in components
import { useParams } from "react-router-dom";
import {FaUtensils} from "react-icons/fa";
import { FaThLarge } from "react-icons/fa";
 import OtherExpense from "../Pages/OtherExpense";
import LightBill from "../Pages/LightBill";
import { FaSearch } from "react-icons/fa";
import { FaSignOutAlt, FaUndo, FaDownload } from "react-icons/fa";
import FormDownload from "../componenet/Maintanace/FormDownload";
import TenantChatbot from "../componenet/TenantChatbot";
import NotificationBell from "../componenet/NotificationBell";
import RentSummaryCards from "./RentSummaryCards";
import RentHeaderBar from "./RentHeaderBar";
import MobileSectionSidebar from "./MobileSectionSidebar";
import RentTenantListView from "./RentTenantListView";
import RentTenantProfileView from "./RentTenantProfileViewCard";
import LeavedTenantScreen from "./LeavedTenantScreen";
import VacantBedScreen from "./VacantBedScreen";
import { MdOutlineBedroomParent, MdLightbulbOutline, MdOutlineReceiptLong, MdPerson, MdCalendarToday, MdDashboard } from "react-icons/md";

import LeaveNotificationBell from "../componenet/LeaveNotificationBell";
import RoomManager from "./RoomManager"; // adjust path if needed
// import { useNavigate } from 'react-router-dom';
import { FaMoneyBillWave, FaPhoneAlt, FaCalendarAlt } from "react-icons/fa";
import { API_BASE } from "../api";
function NewComponant() {
  console.log("[NewComponant] loaded at", new Date().toISOString());
  const location = useLocation();
  const [formData, setFormData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomsData, setRoomsData] = useState([]);
// 📌 New state for Aadhaar + Photo
const [selfAadharFile, setSelfAadharFile] = useState(null);
const [parentAadharFile, setParentAadharFile] = useState(null);
const [photoFile, setPhotoFile] = useState(null);
// Edit Tenant: document uploads
const [editSelfAadharFile, setEditSelfAadharFile] = useState(null);
const [editParentAadharFile, setEditParentAadharFile] = useState(null);
const [editPhotoFile, setEditPhotoFile] = useState(null);
const [editDocMsg, setEditDocMsg] = useState("");
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


const [showPendingModal, setShowPendingModal] = useState(false);
const [showUpcomingModal, setShowUpcomingModal] = useState(false);

const [pendingTenants, setPendingTenants] = useState([]);



const [paid, setPaid] = useState(false);



const [showVacantModal, setShowVacantModal] = useState(false);
const [editNote, setEditNote] = useState("");
const [rentUpdateMode, setRentUpdateMode] = useState("add");

  const roomColorStyleMap = useMemo(() => {
    const rooms = Array.from(
      new Set(
        (formData || [])
          .map((t) => String(t?.roomNo ?? "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const total = Math.max(rooms.length, 1);
    const out = {};

    rooms.forEach((roomNo, idx) => {
      const hue = Math.round((idx * 360) / total);
      out[roomNo] = {
        backgroundColor: `hsl(${hue} 72% 44%)`,
        border: `1px solid hsl(${hue} 72% 34%)`,
        color: "#ffffff",
      };
    });

    return out;
  }, [formData]);
  const [tenants, setTenants] = useState([]);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftTenant, setShiftTenant] = useState(null);
  const [shiftTargetKey, setShiftTargetKey] = useState(""); // "roomNo-bedNo"
  const [shiftEffectiveDate, setShiftEffectiveDate] = useState("");

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
  const [currentLeaveTenant, setCurrentLeaveTenant] = useState(null);
  const [leaveDeductFromDeposit, setLeaveDeductFromDeposit] = useState(false);
  const [leaveSelectedMonths, setLeaveSelectedMonths] = useState([]);
  const [undoBedModal, setUndoBedModal] = useState({
    show: false,
    tenantId: "",
    message: "",
    vacantBeds: [],
    selectedIndex: "",
    busy: false,
  });
  const [showRentModal, setShowRentModal] = useState(false);
  const [selectedRentDetails, setSelectedRentDetails] = useState([]);
  const [photoEditTenant, setPhotoEditTenant] = useState(null);
  // const [selectedTenantName, setSelectedTenantName] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  ////form
  const [mobileSelectedTenant, setMobileSelectedTenant] = useState(null);
  const [showMobileLeavedTenants, setShowMobileLeavedTenants] = useState(false);
  const [showMobileVacantBeds, setShowMobileVacantBeds] = useState(false);
  const [showMobileSections, setShowMobileSections] = useState(false);
 const [showMobileTenantProfile, setShowMobileTenantProfile] = useState(false);

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
    pincode: "",
    city: "",
    state: "",
    houseNo: "",
    nearbyPlace: "",
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


  firstRentStatus: "ADVANCE_PAID",
  firstRentPaidDate: "",
  });
  useEffect(() => {
    const pin = String(newTenant?.pincode || "").trim();
    if (!/^\d{6}$/.test(pin)) return;

    let cancelled = false;
    // Clear previous city/state so user can enter manually if lookup fails
    setNewTenant((prev) => ({ ...prev, city: "", state: "" }));

    const fetchPincodeDetails = async () => {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        if (!res.ok) return;
        const data = await res.json();
        const office = data?.[0]?.PostOffice?.[0];
        if (!office || cancelled) return;

        setNewTenant((prev) => ({
          ...prev,
          city: office.District || "",
          state: office.State || "",
        }));
      } catch {
        // Fail silently to keep form usable
      }
    };

    fetchPincodeDetails();
    return () => {
      cancelled = true;
    };
  }, [newTenant?.pincode]);

  const [firstRentStatusSelection, setFirstRentStatusSelection] = useState("ADVANCE_PAID");
  const [sortConfig, setSortConfig] = useState({
    column: null,      // 'sr' | 'name' | 'status' | 'due'
    direction: "asc",  // 'asc' | 'desc'
  });




const [showFormModal, setShowFormModal] = useState(false);
const [formTenant, setFormTenant] = useState(null);
const [showLeavedHistoryView, setShowLeavedHistoryView] = useState(false);
const [historyDocsTenant, setHistoryDocsTenant] = useState(null);

const openAdmissionForm = (tenant) => {
  setFormTenant(tenant);
  setShowFormModal(true);
};

const totalBeds = roomsData.reduce(
  (sum, room) => sum + (room.beds?.length || 0),
  0
);


 const sectionItems = [
    { key: "dashboard", label: "Dashboard", icon: <MdDashboard size={20} />, onClick: () => handleNavigation("/maindashboard") },
    { key: "rent", label: "Rent & Deposit", icon: <MdOutlineBedroomParent /> },
    { key: "light", label: "Light Bill", icon: <MdLightbulbOutline /> },
    { key: "other-expense", label: "Other Expense", icon: <MdOutlineReceiptLong /> },
    { key: "staff", label: "Staff", icon: <MdPerson /> },
    // { key: "holiday", label: "Holiday Management", icon: <MdCalendarToday /> },
    // { key: "canteen-expenses", label: "Canteen Portal", icon: <FaUtensils /> },
    // { key: "canteen-attendance", label: "Meal Attendance", icon: <FaUtensils /> },
  ];




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
const [submittingAdd, setSubmittingAdd] = useState(false); // for Save
const [creatingInvite, setCreatingInvite] = useState(false); // for Share Link
const [creatingEditInvite, setCreatingEditInvite] = useState(false); // Edit: Share Link


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
    const res = await fetch(`${apiUrl}staff-expense/all`);
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

    const res = await fetch(`${apiUrl}staff-expense`, {
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

const parseOccupancyDate = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const ymd = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymd) return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));

  const dmy = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};



// A bed becomes vacant on the tenant's leave date.
const hasLeaveDatePassed = (leaveDate) => {
  if (!leaveDate) return false;
  const ld = parseOccupancyDate(leaveDate);


  
  if (isNaN(ld.getTime())) return false;
  ld.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return ld <= today;
};
// ✅ use tenants if present else formData (safe)
const occupiedBeds = useMemo(() => {
  const list = (tenants && tenants.length ? tenants : formData) || [];
  const s = new Set();

  list.forEach((t) => {
    if (t.leaveDate && hasLeaveDatePassed(t.leaveDate)) return;

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
    if (t.leaveDate && hasLeaveDatePassed(t.leaveDate)) return; // ignore tenants whose leave date has passed
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



//-------------------------------------------------------------------------

useEffect(() => {
  if (!formData || !formData.length) return;

  // 🔥 Billing month = previous month of today
  const today = new Date();
  let billYear = today.getFullYear();
  let billMonth = today.getMonth() - 1; // previous month

  if (billMonth < 0) {
    billMonth = 11;
    billYear -= 1;
  }

  const billLabel = new Date(billYear, billMonth, 1).toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });

  // ✅ helper inside effect (no hoisting issues)
  const isPaidForBillingMonth = (r) => {
    if (!r) return false;

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

    if (r.month) {
      try {
        const [mon, yy] = String(r.month).split("-");
        const year = yy && yy.length === 2 ? Number("20" + yy) : Number(yy);
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
  };

  // ✅ Build detailed list for modal
  const pendingList = (formData || [])
    .filter((t) => {
      if (!t) return false;
      if (t.leaveDate) return false;
      if (!t.bedNo) return false;

      const rentDue = Number(t.rentDue || 0);
      if (rentDue > 0) return true;

      const rents = t.rents || [];
      const paidForBillingMonth = rents.some(isPaidForBillingMonth);
      return !paidForBillingMonth;
    })
    .map((t) => {
      const rentDue = Number(t.rentDue || 0);
      const rents = t.rents || [];
      const paidForBillingMonth = rents.some(isPaidForBillingMonth);

      return {
        tenant: t,
        billLabel,
        reason: rentDue > 0 ? "Due Amount Pending" : `Not paid for ${billLabel}`,
        dueAmount: rentDue > 0 ? rentDue : null,
      };
    });

  setPendingRents(pendingList.length);
  setPendingTenants(pendingList);
}, [formData]);









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
  const isEditRentAtJoiningVisible = useMemo(() => {
    if (!editTenantData?.joiningDate) return false;
    const joinDate = new Date(String(editTenantData.joiningDate).split("T")[0]);
    const createdAt = new Date(
      String(editTenantData.createdAt || editTenantData.joiningDate).split("T")[0]
    );
    if (Number.isNaN(joinDate.getTime()) || Number.isNaN(createdAt.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    joinDate.setHours(0, 0, 0, 0);
    createdAt.setHours(0, 0, 0, 0);
    const windowEnd = new Date(joinDate);
    windowEnd.setMonth(windowEnd.getMonth() + 1);
    windowEnd.setHours(23, 59, 59, 999);
    return today >= createdAt && today <= windowEnd;
  }, [editTenantData?.createdAt, editTenantData?.joiningDate]);
  useEffect(() => {
    const pin = String(editTenantData?.pincode || "").trim();
    if (!/^\d{6}$/.test(pin)) return;

    let cancelled = false;
    // Clear previous city/state so user can enter manually if lookup fails
    setEditTenantData((prev) => (prev ? { ...prev, city: "", state: "" } : prev));

    const fetchPincodeDetails = async () => {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        if (!res.ok) return;
        const data = await res.json();
        const office = data?.[0]?.PostOffice?.[0];
        if (!office || cancelled) return;

        setEditTenantData((prev) =>
          prev
            ? {
                ...prev,
                city: office.District || "",
                state: office.State || "",
              }
            : prev
        );
      } catch {
        // Fail silently to keep form usable
      }
    };

    fetchPincodeDetails();
    return () => {
      cancelled = true;
    };
  }, [editTenantData?.pincode]);



// const [password, setPassword] = useState("");
// const [currentDeleteId, setCurrentDeleteId] = useState(null);
// const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
// const [editPaymentMode, setEditPaymentMode] = useState("Cash");
  const [showPhotoEditModal, setShowPhotoEditModal] = useState(false);
  // const [photoEditTenant, setPhotoEditTenant] = useState(null);
  const [photoEditDocIndex, setPhotoEditDocIndex] = useState(null);
  const [photoEditTransform, setPhotoEditTransform] = useState({
    rotate: 0,
    flipX: false,
    flipY: false,
  });
  const [savingPhotoTransform, setSavingPhotoTransform] = useState(false);



  const [showDueModal, setShowDueModal] = useState(false);
  const [dueMonths, setDueMonths] = useState([]);
  const [selectedTenantName, setSelectedTenantName] = useState("");

  const [showStatusModal, setShowStatusModal] = useState(false);
  // const [statusMonths, setStatusMonths] = useState([]);
  // const [statusTenantName, setStatusTenantName] = useState("");

  const [selectedYear, setSelectedYear] = useState("All Records");
const [editMonthYM, setEditMonthYM] = useState({ y: null, m: null });
 const closeFormModal = () => {
 setShowAddModal(false);
  setFormTenant(null);          // ✅ clear selected tenant
  // if you have any other related states, reset them here too
  // setSomethingElse(...)
};
const normalizeSearchValue = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const compactSearchValue = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");

const formatSearchDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return [
    d.toLocaleDateString("en-IN"),
    d.toLocaleDateString("en-GB"),
    d.toLocaleString("en-IN", { month: "short", year: "numeric" }),
    d.toLocaleString("en-IN", { month: "long", year: "numeric" }),
    String(d.getFullYear()),
  ].join(" ");
};

const getYearFromMonthLabel = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const fourDigit = text.match(/\b(19|20)\d{2}\b/);
  if (fourDigit) return Number(fourDigit[0]);

  const twoDigit = text.match(/\b\d{2}\b/);
  if (twoDigit) {
    const yy = Number(twoDigit[0]);
    return yy >= 70 ? 1900 + yy : 2000 + yy;
  }

  return null;
};

const getTenantDateYears = (tenant) => {
  const yearsSet = new Set();
  const addDateYear = (value) => {
    if (!value) return;
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) yearsSet.add(d.getFullYear());
  };

  [
    tenant?.joiningDate,
    tenant?.leaveDate,
    tenant?.dateOfJoiningCollege,
    tenant?.dob,
    tenant?.firstRentPaidDate,
    tenant?.createdAt,
    tenant?.updatedAt,
  ].forEach(addDateYear);

  (Array.isArray(tenant?.rents) ? tenant.rents : []).forEach((rent) => {
    addDateYear(rent?.date);
    const monthYear = getYearFromMonthLabel(rent?.month);
    if (monthYear) yearsSet.add(monthYear);
  });

  (Array.isArray(tenant?.rentHistory) ? tenant.rentHistory : []).forEach((rent) => {
    addDateYear(rent?.date);
    const monthYear = getYearFromMonthLabel(rent?.month);
    if (monthYear) yearsSet.add(monthYear);
  });

  (Array.isArray(tenant?.leaveSettlement?.deductions)
    ? tenant.leaveSettlement.deductions
    : []
  ).forEach((deduction) => {
    const monthYear = getYearFromMonthLabel(deduction?.month);
    if (monthYear) yearsSet.add(monthYear);
  });

  return yearsSet;
};

const tenantMatchesSelectedYear = (tenant) => {
  if (selectedYear === "All Records") return true;
  const selected = Number(selectedYear);
  if (!Number.isFinite(selected)) return true;
  return getTenantDateYears(tenant).has(selected);
};

const tenantMatchesSearchText = (tenant) => {
  const query = normalizeSearchValue(searchText);
  const compactQuery = compactSearchValue(searchText);
  if (!query && !compactQuery) return true;

  const roomQuery = query.match(/\b(?:room|roomno|room no)\s+([a-z0-9]+)/i);
  if (roomQuery) {
    return compactSearchValue(tenant?.roomNo).includes(compactSearchValue(roomQuery[1]));
  }

  const bedQuery = query.match(/\b(?:bed|bedno|bed no)\s+([a-z0-9]+)/i);
  if (bedQuery) {
    return compactSearchValue(tenant?.bedNo).includes(compactSearchValue(bedQuery[1]));
  }

  const phoneQuery = query.match(/\b(?:mobile|mob|phone|contact)\s+([0-9]+)/i);
  if (phoneQuery) {
    const needle = compactSearchValue(phoneQuery[1]);
    return [
      tenant?.phoneNo,
      tenant?.mobileNo,
      tenant?.relative1Phone,
      tenant?.relative2Phone,
    ].some((value) => compactSearchValue(value).includes(needle));
  }

  const nameQuery = query.match(/\b(?:name|tenant)\s+(.+)/i);
  if (nameQuery) {
    return normalizeSearchValue(tenant?.name).includes(
      normalizeSearchValue(nameQuery[1])
    );
  }

  const rents = Array.isArray(tenant?.rents) ? tenant.rents : [];
  const rentHistory = Array.isArray(tenant?.rentHistory) ? tenant.rentHistory : [];
  const docs = Array.isArray(tenant?.documents) ? tenant.documents : [];
  const deductions = Array.isArray(tenant?.leaveSettlement?.deductions)
    ? tenant.leaveSettlement.deductions
    : [];

  const values = [
    tenant?.srNo,
    tenant?.name,
    tenant?.phoneNo,
    `phone ${tenant?.phoneNo || ""}`,
    `mobile ${tenant?.phoneNo || tenant?.mobileNo || ""}`,
    tenant?.mobileNo,
    tenant?.roomNo,
    `room ${tenant?.roomNo || ""}`,
    `room no ${tenant?.roomNo || ""}`,
    tenant?.bedNo,
    `bed ${tenant?.bedNo || ""}`,
    `bed no ${tenant?.bedNo || ""}`,
    tenant?.floorNo,
    `floor ${tenant?.floorNo || ""}`,
    tenant?.category,
    tenant?.address,
    tenant?.houseNo,
    tenant?.nearbyPlace,
    tenant?.city,
    tenant?.state,
    tenant?.pincode,
    tenant?.companyAddress,
    tenant?.relativeAddress,
    tenant?.relativeAddress1,
    tenant?.relativeAddress2,
    tenant?.relative1Name,
    tenant?.relative1Phone,
    tenant?.relative1Relation,
    tenant?.relative2Name,
    tenant?.relative2Phone,
    tenant?.relative2Relation,
    tenant?.depositAmount,
    tenant?.baseRent,
    tenant?.rentAmount,
    tenant?.firstRentStatus,
    tenant?.joiningDate,
    formatSearchDate(tenant?.joiningDate),
    tenant?.leaveDate,
    formatSearchDate(tenant?.leaveDate),
    tenant?.dateOfJoiningCollege,
    formatSearchDate(tenant?.dateOfJoiningCollege),
    tenant?.dob,
    formatSearchDate(tenant?.dob),
    tenant?.leaveSettlement?.grossDeposit,
    tenant?.leaveSettlement?.refundableDeposit,
    tenant?.leaveSettlement?.amountDueFromTenant,
    tenant?.leaveSettlement?.totalDeduction,
    ...rents.flatMap((rent) => [
      rent?.month,
      rent?.date,
      formatSearchDate(rent?.date),
      rent?.rentAmount,
      rent?.paymentMode,
      rent?.paymentType,
      rent?.status,
      rent?.note,
    ]),
    ...rentHistory.flatMap((rent) => [
      rent?.month,
      rent?.date,
      formatSearchDate(rent?.date),
      rent?.rentAmount,
      rent?.paymentMode,
      rent?.paymentType,
      rent?.status,
      rent?.note,
    ]),
    ...docs.flatMap((doc) => [
      doc?.relation,
      doc?.fileName,
      doc?.contentType,
      doc?.url,
    ]),
    ...deductions.flatMap((deduction) => [
      deduction?.month,
      deduction?.amount,
      deduction?.days,
      deduction?.dailyRent,
      deduction?.cycleRange,
    ]),
  ];

  const joined = values.filter(Boolean).join(" ");
  const haystack = normalizeSearchValue(joined);
  const compactHaystack = compactSearchValue(joined);
  return haystack.includes(query) || compactHaystack.includes(compactQuery);
};

const years = useMemo(() => {
  const ys = new Set();
  (formData || []).forEach((d) => {
    getTenantDateYears(d).forEach((year) => ys.add(year));
  });
  return ["All Records", ...Array.from(ys).sort((a, b) => b - a)];
}, [formData]);

const handleRentYearChange = (nextValueOrEvent) => {
  const value =
    typeof nextValueOrEvent === "string"
      ? nextValueOrEvent
      : nextValueOrEvent?.target?.value;
  setSelectedYear(value || "All Records");
};

const handleRentSearchChange = (nextValueOrEvent) => {
  const value =
    typeof nextValueOrEvent === "string"
      ? nextValueOrEvent
      : nextValueOrEvent?.target?.value;
  setSearchText(value || "");
};



const existingForm = formData?.find(
  (f) => String(f.roomNo) === String(newTenant.roomNo) && String(f.bedNo) === String(newTenant.bedNo)
);



  const apiUrl = `${API_BASE}/`;

const ROOMS_API = `${apiUrl}rooms`;

  const refreshTenants = React.useCallback(async () => {
    try {
      const { data } = await axios.get(`${apiUrl}forms`);
      setFormData(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to refresh tenants:", e);
    }
  }, [apiUrl]);

  const refreshRooms = useCallback(async () => {
    try {
      const { data } = await axios.get(`${apiUrl}rooms`);
      setRoomsData(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to refresh rooms:", e);
    }
  }, [apiUrl]);

  const refreshAllData = useCallback(async () => {
    await Promise.all([refreshTenants(), refreshRooms()]);
  }, [refreshTenants, refreshRooms]);

  const lastModalStateRef = useRef(null);

  useEffect(() => {
    const modalState = {
      add: showAddModal,
      edit: showEditModal,
      leave: showLeaveModal,
      rent: showRentModal,
      shift: showShiftModal,
      deleteConfirm: showDeleteConfirmation,
      password: showPasswordPrompt,
      vacant: showVacantModal,
      pending: showPendingModal,
      upcoming: showUpcomingModal,
      details: showDetailsModal,
      admissionForm: showFormModal,
      form: showFModal,
      expenses: showExpensesModal,
      otherExpense: showOtherExpenseModal,
      photoEdit: showPhotoEditModal,
    };

    const previous = lastModalStateRef.current;
    lastModalStateRef.current = modalState;

    if (!previous) return undefined;

    const didAnyModalClose = Object.keys(modalState).some(
      (key) => previous[key] && !modalState[key]
    );

    if (!didAnyModalClose) return undefined;

    const timer = window.setTimeout(() => {
      refreshAllData();
    }, 150);

    return () => window.clearTimeout(timer);
  }, [
    showAddModal,
    showEditModal,
    showLeaveModal,
    showRentModal,
    showShiftModal,
    showDeleteConfirmation,
    showPasswordPrompt,
    showVacantModal,
    showPendingModal,
    showUpcomingModal,
    showDetailsModal,
    showFormModal,
    showFModal,
    showExpensesModal,
    showOtherExpenseModal,
    showPhotoEditModal,
    refreshAllData,
  ]);

  useEffect(() => {
    const handleFocus = () => {
      refreshAllData();
    };
    const handleVisibilityChange = () => {
      if (!document.hidden) refreshAllData();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshAllData]);
const fmtMonthKey = (y, m) => {
  const mon = new Date(y, m, 1).toLocaleString("en-US", { month: "short" }); // e.g., "Sep"
  const yy = String(y).slice(-2); // "25"
  return `${mon}-${yy}`; // "Sep-25"
};

const getEditRentMonthKey = (editMonthYM, fallbackDate) => {
  if (editMonthYM?.y != null && editMonthYM?.m != null) {
    return fmtMonthKey(editMonthYM.y, editMonthYM.m);
  }

  if (fallbackDate) {
    const d = new Date(fallbackDate);
    if (!Number.isNaN(d.getTime())) {
      return fmtMonthKey(d.getFullYear(), d.getMonth());
    }
  }

  return "";
};

const getFirstRentMonthForStatus = (joiningDate, firstRentStatus) => {
  if (!joiningDate) return "";
  const joinDate = new Date(String(joiningDate).split("T")[0]);
  if (Number.isNaN(joinDate.getTime())) return "";

  const status = String(firstRentStatus || "NOT_PAID").trim();
  const monthOffset = status === "ADVANCE_PAID" ? 0 : 1;
  return fmtMonthKey(joinDate.getFullYear(), joinDate.getMonth() + monthOffset);
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

const pad2 = (n) => String(n).padStart(2, "0");

const monthKeyFromDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;

const addMonthsSafe = (date, months) => {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);

  // handle month overflow (e.g. Jan 31 + 1 month)
  if (d.getDate() !== day) d.setDate(0);
  return d;
};

const sameMonthKey = (y, m) => `${y}-${pad2(m + 1)}`; // m is 0-based

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
    if (newTenant.address) p.set("address", String(newTenant.address));
    if (newTenant.pincode) p.set("pincode", String(newTenant.pincode));
    if (newTenant.city) p.set("city", String(newTenant.city));
    if (newTenant.state) p.set("state", String(newTenant.state));
    if (newTenant.houseNo) p.set("houseNo", String(newTenant.houseNo));
    if (newTenant.nearbyPlace) p.set("nearbyPlace", String(newTenant.nearbyPlace));
    if (newTenant.relativeAddress) p.set("relativeAddress", String(newTenant.relativeAddress));
    if (newTenant.relative1Relation) p.set("relative1Relation", String(newTenant.relative1Relation));
    if (newTenant.relative1Name) p.set("relative1Name", String(newTenant.relative1Name));
    if (newTenant.relative1Phone) p.set("relative1Phone", String(newTenant.relative1Phone));
    if (newTenant.relative2Relation) p.set("relative2Relation", String(newTenant.relative2Relation));
    if (newTenant.relative2Name) p.set("relative2Name", String(newTenant.relative2Name));
    if (newTenant.relative2Phone) p.set("relative2Phone", String(newTenant.relative2Phone));
    if (newTenant.companyAddress) p.set("companyAddress", String(newTenant.companyAddress));
    if (newTenant.dateOfJoiningCollege)
      p.set("dateOfJoiningCollege", String(newTenant.dateOfJoiningCollege));
    if (newTenant.dob) p.set("dob", String(newTenant.dob));

    const baseRent = newTenant.baseRent ?? "";
    const rentAmount = baseRent !== "" && baseRent != null ? baseRent : newTenant.rentAmount;
    if (baseRent !== "") p.set("baseRent", String(baseRent));
    if (rentAmount !== "") p.set("rentAmount", String(rentAmount));
    if (newTenant.depositAmount != null && newTenant.depositAmount !== "") {
      p.set("depositAmount", String(newTenant.depositAmount));
    }
    if (newTenant.firstRentStatus) p.set("firstRentStatus", String(newTenant.firstRentStatus));
    if (newTenant.firstRentMonth) p.set("firstRentMonth", String(newTenant.firstRentMonth));
    if (newTenant.firstRentPaidDate)
      p.set("firstRentPaidDate", String(newTenant.firstRentPaidDate));

    base.search = p.toString(); // ← ensure params are applied
    return base.toString();
  }, [newTenant]);


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

      const r = await axios.get(`${apiUrl}invites/${token}`);
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
    const roomFromId = roomsData.find((r) => String(r._id) === String(newTenant.roomId));
    const roomFromNo = roomsData.find((r) => String(r.roomNo) === String(newTenant.roomNo));
    const pickedRoom = roomFromId || roomFromNo;
    const rentSource =
      newTenant.baseRent !== "" && newTenant.baseRent != null
        ? newTenant.baseRent
        : newTenant.rentAmount;

    const payload = {
      category: (newTenant.category || pickedRoom?.category || "").trim() || undefined,
      name: (newTenant.name || "").trim(),
      phoneNo: (newTenant.phoneNo || "").trim(),
      roomNo: newTenant.roomNo,
      bedNo: newTenant.bedNo,
      joiningDate: newTenant.joiningDate || new Date().toISOString().slice(0, 10), // ensure exists
      baseRent: newTenant.baseRent ?? "",
      rentAmount: rentSource ?? "",
      depositAmount: newTenant.depositAmount ?? "",
      address: newTenant.address || undefined,
      pincode: newTenant.pincode || undefined,
      city: newTenant.city || undefined,
      state: newTenant.state || undefined,
      houseNo: newTenant.houseNo || undefined,
      nearbyPlace: newTenant.nearbyPlace || undefined,
      relativeAddress: newTenant.relativeAddress || newTenant.RelativeAddress || undefined,
      relative1Relation: newTenant.relative1Relation || undefined,
      relative1Name: newTenant.relative1Name || undefined,
      relative1Phone: newTenant.relative1Phone || undefined,
      relative2Relation: newTenant.relative2Relation || undefined,
      relative2Name: newTenant.relative2Name || undefined,
      relative2Phone: newTenant.relative2Phone || undefined,
      companyAddress: newTenant.companyAddress || undefined,
      dateOfJoiningCollege: newTenant.dateOfJoiningCollege || undefined,
      dob: newTenant.dob || undefined,
      firstRentStatus: newTenant.firstRentStatus || "ADVANCE_PAID",
      firstRentMonth: newTenant.firstRentMonth || undefined,
      firstRentPaidDate: newTenant.firstRentPaidDate || undefined,
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









const parseDate = (v) => {
  if (!v) return null;

  // Prefer explicit date formats so DD/MM/YYYY is not parsed as MM/DD/YYYY.
  const s = String(v).trim();
  const ymd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymd) return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));

  const m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));

  const d = new Date(v);
  if (!isNaN(d)) return d;

  return null;
};

const today0 = useMemo(() => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}, []);

const isActiveTenant = (t) => {
  // active if: no leaveDate OR leaveDate is in the future (upcoming)
  const ld = parseDate(t.leaveDate);
  if (!ld) return true;
  ld.setHours(0, 0, 0, 0);
  return ld > today0;
};

const vacantBedsList = useMemo(() => {
  // ✅ Occupied set = ACTIVE tenants only (includes upcoming leaveDate)
  const occupiedSet = new Set(
    (formData || [])
      .filter(isActiveTenant)
      .map((t) => `${t.roomNo}__${t.bedNo}`)
  );

  const list = [];
  (roomsData || []).forEach((room) => {
    const roomNo = room.roomNo ?? room.room ?? room.number ?? "";
    const floorNo = room.floorNo ?? room.floor ?? "";
    const category = room.category ?? "";

    (room.beds || []).forEach((bed) => {
      const bedNo = bed.bedNo ?? bed.no ?? bed.number ?? bed;
      const key = `${roomNo}__${bedNo}`;

      // ✅ vacant only if not in occupiedSet
      if (!occupiedSet.has(key)) {
        list.push({
          roomNo,
          bedNo,
          floorNo,
          category,
          price: bed.price ?? bed.bedRent ?? room.bedRent ?? room.price ?? 0,
        });
      }
    });
  });

  list.sort((a, b) => {
    const r = String(a.roomNo).localeCompare(String(b.roomNo), undefined, { numeric: true });
    if (r !== 0) return r;
    return String(a.bedNo).localeCompare(String(b.bedNo), undefined, { numeric: true });
  });

  return list;
}, [roomsData, formData, today0]);

const vacantCount = vacantBedsList.length;













const clampRotate = (deg) => ((deg % 360) + 360) % 360;

const getTenantPhotoDoc = (tenant) => {
  const docs = tenant?.documents || [];
  if (!docs.length) return null;

  // priority: relation contains 'photo'
  const byRelation = docs.find(
    (d) => d?.url && String(d?.relation || "").toLowerCase().includes("photo")
  );
  if (byRelation) return byRelation;

  // fallback: first image contentType
  const byType = docs.find(
    (d) => d?.url && String(d?.contentType || "").toLowerCase().startsWith("image/")
  );
  return byType || null;
};






// ✅ Always return a usable URL from your doc object
 const getDocHref = (doc) => {
  const url = (doc?.url || "").trim();
  return url ? url : "#"; // ✅ ImageKit URL stored in DB
};


// ✅ Pick tenant photo from documents
// const getTenantPhotoUrl = (tenant) => {
//   const docs = tenant?.documents || [];
//   if (!docs.length) return "";

//   // priority: relation contains 'photo'
//   const byRelation = docs.find(
//     (d) => d?.url && String(d?.relation || "").toLowerCase().includes("photo")
//   );
//   if (byRelation?.url) return byRelation.url;

//   // fallback: first image contentType
//   const byType = docs.find(
//     (d) => d?.url && String(d?.contentType || "").toLowerCase().startsWith("image/")
//   );
//   return byType?.url || "";
// };



const docHrefSafe = (doc) => {
  const u = getDocHref(doc);
  return u && u !== "#" ? String(u).trim() : "";
};

const isMediaDoc = (d) => {
  const ct = String(d?.contentType || "").toLowerCase();
  const name = String(d?.fileName || "").toLowerCase();
  return (
    ct.startsWith("image/") ||
    ct.startsWith("video/") ||
    /\.(png|jpe?g|webp|gif|heic|heif|avif|mp4|mov|webm)$/i.test(name)
  );
};

const docRel = (d) => String(d?.relation || "").trim().toLowerCase();
const docName = (d) => String(d?.fileName || "").toLowerCase();


const findTenantPhotoDoc = (tenant) => {
  const docs = tenant?.documents || [];
  if (!Array.isArray(docs) || docs.length === 0) return null;

  // ✅ 1) STRICT: preferred labels (new system)
  let idx =
    docs.findIndex((d) => docRel(d) === "tenant photo" && docHrefSafe(d)) ??
    -1;
  if (idx < 0) idx = docs.findIndex((d) => docRel(d) === "photo" && docHrefSafe(d));
  if (idx < 0) idx = docs.findIndex((d) => docRel(d) === "selfie" && docHrefSafe(d));
  if (idx >= 0) return { doc: docs[idx], index: idx };

  // ✅ 2) Fallback (old system): look for filename hints
  idx = docs.findIndex(
    (d) => isMediaDoc(d) && /photo|selfie|tenant|profile|passport/.test(docName(d)) && docHrefSafe(d)
  );
  if (idx >= 0) return { doc: docs[idx], index: idx };

  // ✅ 3) LAST fallback (old uploads): take the LAST "Self" media file
  let lastIdx = -1;
  docs.forEach((d, i) => {
    if (docRel(d) === "self" && isMediaDoc(d) && docHrefSafe(d)) lastIdx = i;
  });
  if (lastIdx >= 0) return { doc: docs[lastIdx], index: lastIdx };

  return null;
};


const normalizePhotoTransform = (doc) => {
  const rotate = Number(doc?.photoTransform?.rotate) || 0;
  const flipX = !!doc?.photoTransform?.flipX;
  const flipY = !!doc?.photoTransform?.flipY;
  return { rotate, flipX, flipY };
};
const photoTransformStyle = (t) => {
  const nt = normalizePhotoTransform(t);
  const sx = nt.flipX ? -1 : 1;
  const sy = nt.flipY ? -1 : 1;
  return {
    transform: `rotate(${nt.rotate}deg) scaleX(${sx}) scaleY(${sy})`,
    transformOrigin: "center",
  };
};

const isSameDoc = (a, b) => {
  if (!a || !b) return false;
  if (a._id && b._id) return String(a._id) === String(b._id);
  if (a.url && b.url) return String(a.url) === String(b.url);
  return String(a.fileName || "") === String(b.fileName || "");
};








// ✅ Pick tenant photo from documents
const getTenantPhotoUrl = (tenant) => {
  const docs = tenant?.documents || [];
  if (!docs.length) return "";

  // priority: relation contains 'photo'
  const byRelation = docs.find(
    (d) => d?.url && String(d?.relation || "").toLowerCase().includes("photo")
  );
  if (byRelation?.url) return byRelation.url;

  // fallback: first image contentType
  const byType = docs.find(
    (d) => d?.url && String(d?.contentType || "").toLowerCase().startsWith("image/")
  );
  return byType?.url || "";
};

const updateTenantPhotoTransform = async (tenant, updater, setFormData, setTenants, apiUrl) => {
  const photoDoc = getTenantPhotoDoc(tenant);
  if (!photoDoc) return;

  const current = normalizePhotoTransform(photoDoc);
  const next = updater(current);

  const updatedDocs = (tenant.documents || []).map((d) =>
    isSameDoc(d, photoDoc)
      ? {
          ...d,
          photoTransform: {
            rotate: clampRotate(next.rotate || 0),
            flipX: !!next.flipX,
            flipY: !!next.flipY,
          },
        }
      : d
  );

  try {
    await axios.put(`${apiUrl}update/${tenant._id}`, {
      documents: updatedDocs,
    });

    setFormData((prev) =>
      prev.map((t) =>
        t._id === tenant._id ? { ...t, documents: updatedDocs } : t
      )
    );
    setTenants((prev) =>
      prev.map((t) =>
        t._id === tenant._id ? { ...t, documents: updatedDocs } : t
      )
    );
  } catch (err) {
    console.error("Failed to update photo transform:", err);
    alert("Failed to update photo orientation.");
  }
};









const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const clampDay = (y, m, d) => Math.min(d, daysInMonth(y, m));

const fmtDM = (d) =>
  d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }); // "07 Jan"

function getCycleRangeStr(tenant, cycleIndex) {
  const baseStart = getFirstCycleStart(tenant);
  baseStart.setHours(0, 0, 0, 0);

  const start = new Date(baseStart);
  start.setMonth(start.getMonth() + cycleIndex);

  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  return `${start.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  })} - ${end.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  })}`;
}











//------------------------------------------------------------------------------------------------------------------------------------------------------------------------













  const fetchSrNo = async () => {
    try {
      const response = await axios.get(`${apiUrl}forms/count`);
      setNewTenant((prev) => ({ ...prev, srNo: response.data.nextSrNo }));
    } catch (error) {
      console.error("Error fetching Sr No:", error);
    }
  };

  const getTodayISODate = () => new Date().toISOString().slice(0, 10);

  const syncFirstRentStatusForAdd = (status) => {
    const normalized = status === "NOT_PAID" ? "NOT_PAID" : "ADVANCE_PAID";
    setFirstRentStatusSelection(normalized);
    setNewTenant((prev) => ({
      ...prev,
      firstRentStatus: normalized,
      firstRentPaidDate: normalized === "ADVANCE_PAID" ? getTodayISODate() : "",
    }));
  };

  const openAddModal = () => {
    fetchSrNo();
    syncFirstRentStatusForAdd("ADVANCE_PAID");
    setShowAddModal(true);
  };

  const correctPassword = "987654";

 

  // state at top of component
  const [docFiles, setDocFiles] = useState([]); // [{file: File, relation: "Self"}]
  const [docMsg, setDocMsg] = useState("");

  const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png"]);
  const ALLOWED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png"]);

  const isAllowedImageFile = (file) => {
    if (!file) return false;

    const mime = String(file.type || "").toLowerCase();
    const name = String(file.name || "");
    const dotIndex = name.lastIndexOf(".");
    const ext = dotIndex >= 0 ? name.slice(dotIndex).toLowerCase() : "";

    return ALLOWED_IMAGE_MIME_TYPES.has(mime) && ALLOWED_IMAGE_EXTENSIONS.has(ext);
  };

  const handleStrictImageSelection = (file, setter, messageSetter, label) => {
    if (!file) {
      setter(null);
      if (messageSetter) messageSetter("");
      return false;
    }

    if (!isAllowedImageFile(file)) {
      setter(null);
      if (messageSetter) messageSetter(`${label} must be JPG, JPEG, or PNG.`);
      return false;
    }

    if (messageSetter) messageSetter("");
    setter(file);
    return true;
  };

  // onChange for <input type="file" multiple>
  function handleDocsChange(e) {
    const files = Array.from(e.target.files || []);
    const invalid = files.find((f) => !isAllowedImageFile(f));
    if (invalid) {
      setDocMsg("Only JPG, JPEG, and PNG files are allowed.");
      e.target.value = "";
      return;
    }

    const mapped = files.map((f) => ({ file: f, relation: "Self" }));
    setDocMsg("");
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
      // keep non-numeric rent fields as-is
      if (k === "firstRentStatus" || k === "firstRentMonth" || k === "firstRentPaidDate") {
        out[k] = v;
        continue;
      }
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
  const isAxios = !!err?.isAxiosError;

  console.error(label, {
    isAxios,
    message: err?.message,
    url: err?.config?.url,
    method: err?.config?.method,
    status: err?.response?.status,
    resp: err?.response?.data,
  });

  // ✅ useful extra: show the upload response shape when upload fails
  if (err?.response?.data?.files) {
    console.error(label + " (files)", err.response.data.files);
  }

  // ✅ useful extra: show FormData keys when request was multipart
  const data = err?.config?.data;
  try {
    if (data && typeof data?.entries === "function") {
      const keys = [];
      for (const [k] of data.entries()) keys.push(k);
      console.error(label + " (FormData keys)", keys);
    }
  } catch (_) {}
}





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

    const rentAmount = Number(newTenant.baseRent ?? newTenant.rentAmount ?? 0);
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
    const joinDate = new Date(newTenant.joiningDate);
    const firstRentStatus =
      firstRentStatusSelection || newTenant.firstRentStatus || "ADVANCE_PAID";

let firstRentMonth;

if (firstRentStatus === "ADVANCE_PAID") {
  // ✅ joining month
  firstRentMonth = fmtMonthKey(
    joinDate.getFullYear(),
    joinDate.getMonth()
  );
} else {
  // ✅ next cycle month
  const next = new Date(
    joinDate.getFullYear(),
    joinDate.getMonth() + 1,
    1
  );
  firstRentMonth = fmtMonthKey(
    next.getFullYear(),
    next.getMonth()
  );
}

    const fd = new FormData(); // ✅ use fd everywhere

    if (isInviteFlow) {
      if (formId) fd.append("formId", formId);
      if (invToken) fd.append("inv", invToken);
    }

    fd.append("rentAmount", String(rentAmount));
    fd.append("depositAmount", String(depositAmount));

    fd.append("paymentMode", paymentMode);
    fd.append("month", firstRentMonth);

    fd.append("name", newTenant.name || "");
    fd.append("phoneNo", newTenant.phoneNo || "");
    fd.append("address", newTenant.address || "");
    fd.append("joiningDate", newTenant.joiningDate);
    if (newTenant.pincode) fd.append("pincode", newTenant.pincode);
    if (newTenant.city) fd.append("city", newTenant.city);
    if (newTenant.state) fd.append("state", newTenant.state);
    if (newTenant.houseNo) fd.append("houseNo", newTenant.houseNo);
    if (newTenant.nearbyPlace) fd.append("nearbyPlace", newTenant.nearbyPlace);

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
    fd.append("firstRentStatus", firstRentStatus);
    fd.append("firstRentMonth", firstRentMonth);
    fd.append(
      "firstRentPaidDate",
      firstRentStatus === "ADVANCE_PAID"
        ? newTenant.firstRentPaidDate || getTodayISODate()
        : ""
    );

    if (newTenant.bedNo && newTenant.bedNo !== "__other__") fd.append("bedNo", newTenant.bedNo);

    const cat = (newTenant.category || existingForm?.category || "").trim();
    if (cat) fd.append("category", cat);

    if (selfAadharFile && !isAllowedImageFile(selfAadharFile)) {
      setDocMsg("Self Aadhaar Card must be JPG, JPEG, or PNG.");
      return;
    }
    if (parentAadharFile && !isAllowedImageFile(parentAadharFile)) {
      setDocMsg("Parent Aadhaar Card must be JPG, JPEG, or PNG.");
      return;
    }
    if (photoFile && !isAllowedImageFile(photoFile)) {
      setDocMsg("Tenant Photograph must be JPG, JPEG, or PNG.");
      return;
    }

    if (selfAadharFile) {
      const f = await compressForUpload(selfAadharFile);
      fd.append("documents", f);
      fd.append("relations", "Self Aadhaar Card");
    }
    if (parentAadharFile) {
      const f = await compressForUpload(parentAadharFile);
      fd.append("documents", f);
      fd.append("relations", "Parent Aadhaar Card");
    }
    if (photoFile) {
      const f = await compressForUpload(photoFile);
      fd.append("documents", f);
      fd.append("relations", "Tenant Photo");
    }

    // ✅ safe URL build (won’t affect other code)
    const API_ROOT = String(apiUrl).replace(/\/+$/, "");
    const FORMS_WITH_DOCS_URL = API_ROOT.endsWith("/api")
      ? `${API_ROOT}/forms-with-docs`
      : `${API_ROOT}/api/forms-with-docs`;

    console.log("POST =>", FORMS_WITH_DOCS_URL);
    console.log("firstRentStatus (submit):", firstRentStatus);

    const res = await axios.post(FORMS_WITH_DOCS_URL, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    alert("Tenant saved successfully.");
    
    console.log("Saved tenant:", res.data);
closeAddTenantModal(); // ✅ closes + clears form
    await refreshTenants();
    window.location.reload();

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




// ✅ ADD THIS FUNCTION
const closeAddTenantModal = () => {
  setShowAddModal(false);

  // ✅ clear Add Tenant form
  setNewTenant(EMPTY_TENANT);
  setFirstRentStatusSelection("ADVANCE_PAID");

  // ✅ clear files + message
  setSelfAadharFile(null);
  setParentAadharFile(null);
  setPhotoFile(null);
  setDocMsg("");

  // ✅ clear locking states (if you have these)
  setCreatingInvite(false);
  setSubmittingAdd(false);
};




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

  // Compress large images before upload to speed up slow networks
  const DEFAULT_UPLOAD_MAX = 300 * 1024; // 300KB target
  const compressForUpload = async (file, maxBytes = DEFAULT_UPLOAD_MAX) => {
    if (!file || !file.type || !file.type.startsWith("image/")) return file;
    if (file.size && file.size <= maxBytes) return file;
    try {
      const compressed = await compressImageToTarget(file, maxBytes);
      return compressed || file;
    } catch {
      return file;
    }
  };

  
  // If you already post in handleAddTenant, you can move the FormData logic there instead.

  const PAGE = 3; // number of month sub-columns under Rent

  const timelineYear = useMemo(() => {
    const currentYear = new Date().getFullYear();
    if (selectedYear === "All Records") return currentYear;

    const parsedYear = Number(selectedYear);
    return Number.isFinite(parsedYear) ? parsedYear : currentYear;
  }, [selectedYear]);

  const buildMonthsTimeline = (year) => {
    const months = [];
    const cursor = new Date(Number(year) || new Date().getFullYear(), 0, 1);
    const end = new Date(Number(year) || new Date().getFullYear(), 11, 1);

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
  const months = useMemo(() => buildMonthsTimeline(timelineYear), [timelineYear]);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const maxStart = Math.max(0, months.length - PAGE);
  const defaultStart =
    timelineYear === currentYear
      ? Math.max(0, Math.min(maxStart, currentMonth - 1))
      : 0;
  const start = rentStart ?? defaultStart;
  const canLeft = start > 0;
  const canRight = start + PAGE < months.length;
  const visibleMonths = months.slice(start, start + PAGE);

  useEffect(() => {
    setRentStart(null);
  }, [timelineYear]);

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
      return Math.min(maxStart, cur + 1);
    });
  };

  const renderMonthWindowNav = (index) => (
    <>
      {index === 0 && (
        <button
          type="button"
          className="month-inline-nav month-inline-nav-prev"
          disabled={!canLeft}
          onClick={goLeft}
          title="Previous months"
          aria-label="Previous months"
        >
          &lsaquo;
        </button>
      )}
      {index === visibleMonths.length - 1 && (
        <button
          type="button"
          className="month-inline-nav month-inline-nav-next"
          disabled={!canRight}
          onClick={goRight}
          title="Newer months"
          aria-label="Newer months"
        >
          &rsaquo;
        </button>
      )}
    </>
  );

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
      Number(tenant?.rentAmount ?? 0) ||
      Number(tenant?.rent ?? 0) ||
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




 const explicitRentFromTenant = (tenant) =>
  toNum(tenant?.baseRent) ||
  toNum(tenant?.rentAmount) ||
  toNum(tenant?.rent) ||
  toNum(tenant?.expectedRent) ||
  toNum(tenant?.defaultRent) ||
  toNum(tenant?.monthlyRent) ||
  toNum(tenant?.price) ||
  toNum(tenant?.bedPrice);

 const latestPaidRentAmount = (tenant) => {
  const paidRents = (tenant?.rents || [])
    .filter((r) => toNum(r?.rentAmount) > 0)
    .map((r) => ({
      amount: toNum(r.rentAmount),
      time: (() => {
        if (r?.date) {
          const d = new Date(r.date);
          if (!Number.isNaN(d.getTime())) return d.getTime();
        }
        const ym = getYMFromRecord(r);
        return ym ? new Date(ym.y, ym.m, 1).getTime() : 0;
      })(),
    }))
    .sort((a, b) => a.time - b.time);

  return paidRents.length ? paidRents[paidRents.length - 1].amount : 0;
 };

 const getShiftPreservedRent = (tenant) => {
  const hasShiftHistory = (tenant?.rentHistory || []).some(
    (entry) => entry?.source === "shift"
  );
  const hasShiftFlag = Boolean(
    tenant?.shiftEffectiveFrom || tenant?.shiftDate || tenant?.effectiveFrom
  );
  const canUsePaidRent =
    hasShiftHistory ||
    hasShiftFlag ||
    tenant?.firstRentStatus === "ADVANCE_PAID";

  const latestPaid = latestPaidRentAmount(tenant);
  const explicitRent = explicitRentFromTenant(tenant);
  if (
    canUsePaidRent &&
    latestPaid > 0 &&
    explicitRent > 0 &&
    latestPaid < explicitRent
  ) {
    return latestPaid;
  }

  return 0;
 };

 const expectFromTenant = (tenant, roomsData) => {
  // 1️⃣ Always prefer NEW updated bed/room price from roomsData
  if (roomsData && tenant?.roomNo && tenant?.bedNo) {
    const room = roomsData.find(
      (r) => String(r.roomNo) === String(tenant.roomNo)
    );

    const bed = room?.beds?.find(
      (b) => String(b.bedNo) === String(tenant.bedNo)
    );
    const updatedPrice =
      toNum(bed?.price) ||
      toNum(bed?.baseRent) ||
      toNum(bed?.monthlyRent);

    if (updatedPrice) return updatedPrice; // ⭐ THIS WILL NOW RETURN 4000
  }

 // 2️⃣ If room price is not found, fallback to tenant stored values
  return explicitRentFromTenant(tenant);
};

const firstDayOfNextMonth = (date = new Date()) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  return d;
};

const startOfDayTime = (date) => {
  const d = date ? new Date(date) : null;
  if (!d || Number.isNaN(d.getTime())) return 0;
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const normalizeRentSnapshot = (entry = {}) => {
  const effectiveFrom =
    entry?.effectiveFrom ||
    entry?.from ||
    entry?.changedAt ||
    entry?.date ||
    null;
  const parsed = effectiveFrom ? new Date(effectiveFrom) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return null;

  const amount =
    toNum(entry?.baseRent) ||
    toNum(entry?.rentAmount) ||
    toNum(entry?.amount) ||
    toNum(entry?.price) ||
    toNum(entry?.monthlyRent);
  if (!amount) return null;

  return {
    effectiveFrom: parsed,
    amount,
    previousAmount: toNum(entry?.previousBaseRent) || toNum(entry?.previousRentAmount),
    source: entry?.source || "",
  };
};

const getCycleStartForMonth = (tenant, y, m) => {
  if (!tenant?.joiningDate) return null;

  const joinDate = new Date(tenant.joiningDate);
  if (Number.isNaN(joinDate.getTime())) return null;

  let firstBillYM;
  if (tenant.firstRentMonth) {
    const pm = parseMonthKey(tenant.firstRentMonth);
    if (!pm) return null;
    firstBillYM = pm.y * 12 + pm.m;
  } else {
    const isAdvance = tenant.firstRentStatus === "ADVANCE_PAID";
    firstBillYM = joinDate.getFullYear() * 12 + joinDate.getMonth() + (isAdvance ? 0 : 1);
  }

  const cellYM = y * 12 + m;
  if (cellYM < firstBillYM) return null;

  const cycleIndex = cellYM - firstBillYM;
  const cycleStart = new Date(joinDate);
  cycleStart.setHours(0, 0, 0, 0);
  cycleStart.setMonth(cycleStart.getMonth() + cycleIndex);

  return cycleStart;
};

const buildRentSnapshots = (tenant, roomsData) => {
  const snapshots = [];
  const history = Array.isArray(tenant?.rentHistory) ? tenant.rentHistory : [];
 const paidRents = (tenant?.rents || [])
    .filter((r) => toNum(r?.rentAmount) > 0)
    .map((r) => ({
      amount: toNum(r.rentAmount),
      ym: getYMFromRecord(r),
      date: r?.date ? new Date(r.date) : null,
    }))
    .filter((r) => r.ym && r.date && !Number.isNaN(r.date.getTime()))
    .sort((a, b) => (a.ym.y * 12 + a.ym.m) - (b.ym.y * 12 + b.ym.m));

  history
    .map((entry) => normalizeRentSnapshot(entry))
    .filter(Boolean)
    .sort((a, b) => a.effectiveFrom - b.effectiveFrom)
    .forEach((snap) => snapshots.push(snap));

  const selectedShiftDate =
    tenant?.shiftEffectiveFrom || tenant?.shiftDate || tenant?.effectiveFrom;
  const parsedShiftDate = selectedShiftDate ? new Date(selectedShiftDate) : null;
  if (parsedShiftDate && !Number.isNaN(parsedShiftDate.getTime())) {
    parsedShiftDate.setHours(0, 0, 0, 0);
    const latestShiftIndex = snapshots
      .map((snap, index) => ({ snap, index }))
      .filter(({ snap }) => snap.source === "shift")
      .sort((a, b) => b.snap.effectiveFrom - a.snap.effectiveFrom)[0]?.index;

    if (latestShiftIndex !== undefined) {
      snapshots[latestShiftIndex] = {
        ...snapshots[latestShiftIndex],
        effectiveFrom: parsedShiftDate,
      };
    }
  }

  const joinDate = tenant?.joiningDate ? new Date(tenant.joiningDate) : null;
  if (
    snapshots.length &&
    joinDate &&
    !Number.isNaN(joinDate.getTime()) &&
    snapshots[0].effectiveFrom > joinDate
  ) {
    const paidBeforeFirstShift = paidRents
      .filter((rent) => rent.date < snapshots[0].effectiveFrom)
      .sort((a, b) => b.date - a.date)[0];
    const previousAmount =
      toNum(snapshots[0].previousAmount) || toNum(paidBeforeFirstShift?.amount);

    if (previousAmount > 0) {
    snapshots.unshift({
      effectiveFrom: joinDate,
      amount: previousAmount,
    });
    }
  }

  if (!snapshots.length) {
    const fallback = expectFromTenant(tenant, roomsData);
    if (fallback > 0) {
      const joinDate = tenant?.joiningDate ? new Date(tenant.joiningDate) : new Date();
      snapshots.push({
        effectiveFrom: Number.isNaN(joinDate.getTime()) ? new Date() : joinDate,
        amount: fallback,
      });
    }
  }

  const currentAmount = expectFromTenant(tenant, roomsData);
  const lastSnapshot = snapshots[snapshots.length - 1];
  if (currentAmount > 0 && (!lastSnapshot || toNum(lastSnapshot.amount) !== currentAmount)) {
    snapshots.push({
      effectiveFrom: new Date(),
      amount: currentAmount,
    });
  }

  return snapshots.sort((a, b) => a.effectiveFrom - b.effectiveFrom);
};

const getExpectedRentForMonth = (tenant, y, m, roomsData) => {
  const snapshots = buildRentSnapshots(tenant, roomsData);
  if (!snapshots.length) return expectFromTenant(tenant, roomsData);

  const cycleStart = getCycleStartForMonth(tenant, y, m);
  if (!cycleStart) return expectFromTenant(tenant, roomsData);

  const cycleEnd = new Date(cycleStart);
  cycleEnd.setMonth(cycleEnd.getMonth() + 1);
  let expected = 0;
  const cycleStartTime = startOfDayTime(cycleStart);
  const cycleEndTime = startOfDayTime(cycleEnd);
  const hasSelectedShiftDate = Boolean(
    tenant?.shiftEffectiveFrom || tenant?.shiftDate || tenant?.effectiveFrom
  );

  for (const snap of snapshots) {
    const snapDate = new Date(snap.effectiveFrom);
    const isLegacyMonthStartShift =
      !hasSelectedShiftDate &&
      snap.source === "shift" &&
      !Number.isNaN(snapDate.getTime()) &&
      snapDate.getDate() === 1;
    const appliesToCycle = isLegacyMonthStartShift
      ? startOfDayTime(snap.effectiveFrom) <= cycleStartTime
      : startOfDayTime(snap.effectiveFrom) < cycleEndTime;

    if (appliesToCycle) {
      expected = toNum(snap.amount);
    } else {
      break;
    }
  }

  return expected || expectFromTenant(tenant, roomsData);
};








function getFirstBillYM(tenant) {
  if (tenant?.firstRentMonth) {
    const pm = parseMonthKey(tenant.firstRentMonth); // "Jan-26"
    if (pm) return pm.y * 12 + pm.m;
  }
  const jd = new Date(tenant.joiningDate);
  const isAdvance = tenant?.firstRentStatus === "ADVANCE_PAID";
  return jd.getFullYear() * 12 + jd.getMonth() + (isAdvance ? 0 : 1);
}

function getJoiningPaymentLabel(tenant) {
  if (!tenant) return "";
  return tenant.firstRentStatus === "ADVANCE_PAID"
    ? "Paid in advance at joining"
    : "Not paid in advance";
}

function getFirstCycleStart(tenant) {
  const joinDate = new Date(tenant.joiningDate);
  return joinDate;
}


// const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

const clampDate = (y, m, day) => {
  const d = Math.min(day, daysInMonth(y, m));
  return new Date(y, m, d);
};


  // Single source of truth for a month cell
const getMonthCell = (tenant, y, m) => {
  if (!tenant?.joiningDate) return { label: "", amountText: "" };

  const joinDate = new Date(tenant.joiningDate);
  const cellYM = y * 12 + m;

  // 🔑 first bill month (from DB, set at admission)
let firstBillYM;
if (tenant.firstRentMonth) {
  const pm = parseMonthKey(tenant.firstRentMonth);
  if (!pm) return { label: "", amountText: "" };
  firstBillYM = pm.y * 12 + pm.m;
} else {
  const isAdvance = tenant.firstRentStatus === "ADVANCE_PAID";
  firstBillYM = joinDate.getFullYear() * 12 + joinDate.getMonth() + (isAdvance ? 0 : 1);
}


  // ⛔ before rent starts
  if (cellYM < firstBillYM) {
    return { label: "", amountText: "" };
  }

  // 🔁 cycle index
  const cycleIndex = cellYM - firstBillYM;
  const isAdvancePaymentMonth =
    tenant.firstRentStatus === "ADVANCE_PAID" && cellYM === firstBillYM;

  const baseStart = getFirstCycleStart(tenant);
  const periodStart = new Date(baseStart);
  periodStart.setMonth(periodStart.getMonth() + cycleIndex);

  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // 🔎 payment record for this month
  const rentRec = (tenant.rents || []).find((r) => {
    const ym = getYMFromRecord(r);
    return ym && ym.y === y && ym.m === m;
  });

  const paidAmount = rentRec ? Number(rentRec.rentAmount || 0) : 0;
  const expected = getExpectedRentForMonth(tenant, y, m, roomsData);
  const outstanding = Math.max(0, Number(expected || 0) - Number(paidAmount || 0));

  let label;
  let dateStr = "";
  const today = new Date();
  const isAdvanceCycle = tenant.firstRentStatus === "ADVANCE_PAID";
  const isPast = isAdvanceCycle ? today >= periodStart : today >= periodEnd;

  if (paidAmount > 0 && expected > 0 && paidAmount < expected) {
    label = "Pending";
    // show payment date for partial payment if available
    if (rentRec?.date) {
      dateStr = new Date(rentRec.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      });
    } else {
      dateStr = periodStart.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      });
    }
  } else if (paidAmount >= expected && expected > 0) {
    label = "Paid";
    if (rentRec?.date) {
      dateStr = new Date(rentRec.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      });
    }
  } else {
    // Advance-cycle rent is due at cycle start; normal-cycle rent is due at cycle end.
    label = isPast ? "Due" : "Upcoming";
    const displayDate = isAdvanceCycle ? periodStart : periodEnd;

    dateStr = displayDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
  }

  return {
    label,
    headerDate: `${pad2(periodEnd.getDate())} ${periodEnd.toLocaleString("en-US", { month: "short" })}`,
    rangeText: `${fmtDM(periodStart)} - ${fmtDM(periodEnd)}`,
    amountText: `₹${expected.toLocaleString("en-IN")}`,
    dateStr,
    amountPaid: paidAmount,
    expected,
    outstanding,
    isPast,
    isAdvancePaymentMonth,
  };
};


const getTenantDueTotal = (tenant, monthsArr) => {
  return (monthsArr || []).reduce((sum, m) => {
    const c = getMonthCell(tenant, m.y, m.m);

    // ignore months before rent start (joining month etc.)
    if (!c || c.beforeRentStart) return sum;

    // ✅ ONLY past months can be "Due"
    const isRealDue =
      c.isPast && (c.label === "Due" || c.label === "Pending");

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
      .get(`${apiUrl}forms`)
      .then((response) => {
        setFormData(Array.isArray(response.data) ? response.data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch data");
        setLoading(false);
      });
  }, [apiUrl]);

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
  //     .get("   https://mutakegirlshostel-0ko7.onrender.com/api/rooms")
  //     .then((response) => setRoomsData(response.data))
  //     .catch((err) => console.error("Failed to fetch rooms:", err));
  // }, []);

  useEffect(() => {
    refreshRooms();
  }, [refreshRooms]);

  const renderTenantPhoto = (tenant) => {
    const photoUrl = getTenantPhotoUrl(tenant);
    if (!photoUrl) {
      return (
        <div
          style={{
            width: 75,
            height: 70,
            borderRadius: 6,
            background: "#eee",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            color: "#777",
            border: "1px solid #ccc",
            flexShrink: 0,
          }}
        >
          N/A
        </div>
      );
    }

    const photoDoc = getTenantPhotoDoc(tenant);
    const t = normalizePhotoTransform(photoDoc);
    const rotate = clampRotate(t.rotate || 0);
    const scaleX = t.flipX ? -1 : 1;
    const scaleY = t.flipY ? -1 : 1;

    return (
      <div className="tenant-photo-wrap">
        <div className="tenant-photo-frame">
          <img
            src={photoUrl}
            alt="photo"
            crossOrigin="anonymous"
            className="tenant-photo-img"
            style={{
              transform: `rotate(${rotate}deg) scale(${scaleX}, ${scaleY})`,
            }}
          />
          <button
            type="button"
            className="photo-edit-btn"
            title="Edit photo"
            onClick={(e) => {
              e.stopPropagation();
              setPhotoEditTenant(tenant);
            }}
          >
            <FaEdit style={{color:"#aa0e03cc"}}/>
          </button>
        </div>

      </div>
    );
  };

  const handleAddTenant = async () => {
    try {
      const selectedRoom = roomsData.find(
        (r) => String(r.roomNo) === String(newTenant.roomNo)
      );
      const selectedBed = selectedRoom?.beds?.find(
        (b) => String(b.bedNo) === String(newTenant.bedNo)
      );
      const baseRent = selectedBed?.price || 0;

      const joinDate = new Date(newTenant.joiningDate);
      const firstRentStatus =
        firstRentStatusSelection || newTenant.firstRentStatus || "ADVANCE_PAID";
      const firstRentMonth =
        firstRentStatus === "ADVANCE_PAID"
          ? fmtMonthKey(joinDate.getFullYear(), joinDate.getMonth())
          : fmtMonthKey(joinDate.getFullYear(), joinDate.getMonth() + 1);

      console.log("firstRentStatus (legacy submit):", firstRentStatus);
      const tenantToSave = sanitizeTenantPayload({
        ...newTenant,
        baseRent,
        firstRentStatus,
        firstRentMonth,
        firstRentPaidDate:
          firstRentStatus === "ADVANCE_PAID"
            ? newTenant.firstRentPaidDate || getTodayISODate()
            : "",
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
        pincode: "",
        city: "",
        state: "",
        houseNo: "",
        nearbyPlace: "",
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
        firstRentStatus: "ADVANCE_PAID",
        firstRentPaidDate: "",
        firstRentMonth: "",
      });
      setFirstRentStatusSelection("ADVANCE_PAID");

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
    .filter((t) => !(t.leaveDate && hasLeaveDatePassed(t.leaveDate)))
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

    return (
      d <= today &&
      tenantMatchesSearchText(t) &&
      tenantMatchesSelectedYear(t)
    ); // already left
  });
}, [formData, searchText, selectedYear]);



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
const getBillingMonthsUpToNow = (tenant) => {
  if (!tenant?.joiningDate) return [];

  const firstBillYM = getFirstBillYM(tenant);
  const now = new Date();
  const lastYM = now.getFullYear() * 12 + now.getMonth();

  const months = [];
  for (let ym = firstBillYM; ym <= lastYM; ym++) {
    const y = Math.floor(ym / 12);
    const m = ym % 12;
    months.push({ y, m });
  }
  return months;
};

const getBillingMonthsUpToDate = (tenant, cutoffDate) => {
  if (!tenant?.joiningDate) return [];

  const firstBillYM = getFirstBillYM(tenant);
  const cutoff = cutoffDate ? new Date(cutoffDate) : new Date();
  if (Number.isNaN(cutoff.getTime())) return [];

  const lastYM = cutoff.getFullYear() * 12 + cutoff.getMonth();
  const months = [];

  for (let ym = firstBillYM; ym <= lastYM; ym++) {
    const y = Math.floor(ym / 12);
    const m = ym % 12;
    months.push({ y, m });
  }

  return months;
};

const getLeaveSettlementMonths = (tenant, cutoffDate) => {
  const cutoff = cutoffDate ? new Date(cutoffDate) : null;
  if (!tenant?.joiningDate || !cutoff || Number.isNaN(cutoff.getTime())) return [];

  const joinDate = new Date(tenant.joiningDate);
  if (Number.isNaN(joinDate.getTime())) return [];

  const months = getBillingMonthsUpToDate(tenant, cutoffDate);
  const firstBillYM = getFirstBillYM(tenant);
  return months
    .map(({ y, m }) => {
      const cycleIndex = y * 12 + m - firstBillYM;
      const periodStart = new Date(joinDate);
      periodStart.setMonth(periodStart.getMonth() + cycleIndex);
      periodStart.setHours(0, 0, 0, 0);
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setHours(0, 0, 0, 0);

      const cell = getMonthCell(tenant, y, m);
      const outstanding = Number(cell?.outstanding || 0);
      const isSettledByLeaveDate = periodEnd <= cutoff;

      if (!isSettledByLeaveDate || outstanding <= 0) return null;

      return {
        key: `${y}-${m}`,
        label: new Date(y, m, 1).toLocaleString("en-IN", {
          month: "short",
          year: "numeric",
        }),
        amount: outstanding,
      };
    })
    .filter(Boolean);
};

const getLeaveExtraDaysDeduction = (tenant, cutoffDate) => {
  const cutoff = cutoffDate ? new Date(cutoffDate) : null;
  if (!tenant?.joiningDate || !cutoff || Number.isNaN(cutoff.getTime())) return null;

  cutoff.setHours(0, 0, 0, 0);

  const joinDate = new Date(tenant.joiningDate);
  if (Number.isNaN(joinDate.getTime())) return null;
  joinDate.setHours(0, 0, 0, 0);

  const months = getBillingMonthsUpToDate(tenant, cutoffDate);
  const firstBillYM = getFirstBillYM(tenant);
  const active = months
    .map(({ y, m }) => {
      const cycleIndex = y * 12 + m - firstBillYM;
      const periodStart = new Date(joinDate);
      periodStart.setMonth(periodStart.getMonth() + cycleIndex);
      periodStart.setHours(0, 0, 0, 0);

      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setHours(0, 0, 0, 0);

      return { y, m, periodStart, periodEnd };
    })
    .find(({ periodStart, periodEnd }) => cutoff > periodStart && cutoff < periodEnd);

  if (!active) return null;

  const expectedRent = Number(getExpectedRentForMonth(tenant, active.y, active.m, roomsData) || 0);
  if (expectedRent <= 0) return null;

  const msPerDay = 1000 * 60 * 60 * 24;
  const cycleDays = Math.max(1, Math.round((active.periodEnd - active.periodStart) / msPerDay));
  const extraDays = Math.max(0, Math.round((cutoff - active.periodStart) / msPerDay));
  if (extraDays <= 0 || extraDays >= cycleDays) return null;

  const cell = getMonthCell(tenant, active.y, active.m);
  const alreadyPaid = Number(cell?.amountPaid || 0);
  const proratedAmount = Math.round((expectedRent / cycleDays) * extraDays);
  const amount = Math.max(0, proratedAmount - alreadyPaid);
  if (amount <= 0) return null;

  return {
    key: "extra-days-rent",
    label: `Extra days rent (${extraDays} day${extraDays === 1 ? "" : "s"})`,
    amount,
    days: extraDays,
    dailyRent: expectedRent / cycleDays,
    cycleRange: `${fmtDM(active.periodStart)} - ${fmtDM(active.periodEnd)}`,
  };
};

const calculateDue = (rents = [], joiningDateStr, tenant, roomsData) => {
  if (!tenant?.joiningDate) return 0;

  const months = getBillingMonthsUpToNow(tenant);
  return months.reduce((sum, m) => {
    const c = getMonthCell(tenant, m.y, m.m);
    const isRealDue =
      c?.isPast && (c.label === "Due" || c.label === "Pending");
    return sum + (isRealDue ? Number(c.outstanding || 0) : 0);
  }, 0);
};
const toInt = (v) => {
  const s = String(v ?? "");
  const m = s.match(/\d+/); // takes first number from "301", "301 (Floor 3)" etc
  const n = m ? parseInt(m[0], 10) : NaN;
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
};

const compareRoomBed = (a, b) => {
  const r = toInt(a.roomNo) - toInt(b.roomNo);
  if (r !== 0) return r;
  return toInt(a.bedNo) - toInt(b.bedNo);
};

  const leaveSettlementMonths = useMemo(
    () => getLeaveSettlementMonths(currentLeaveTenant, selectedLeaveDate),
    [currentLeaveTenant, roomsData, selectedLeaveDate]
  );

  const selectedLeaveSettlementMonths = useMemo(
    () =>
      leaveSettlementMonths.filter((month) =>
        leaveSelectedMonths.includes(month.key)
      ),
    [leaveSettlementMonths, leaveSelectedMonths]
  );

  const leaveExtraDaysDeduction = useMemo(
    () => getLeaveExtraDaysDeduction(currentLeaveTenant, selectedLeaveDate),
    [currentLeaveTenant, roomsData, selectedLeaveDate]
  );

  const leaveSettlementSummary = useMemo(() => {
    const grossDeposit = Number(currentLeaveTenant?.depositAmount || 0);
    const monthDeduction = selectedLeaveSettlementMonths.reduce(
      (sum, month) => sum + Number(month.amount || 0),
      0
    );
    const extraDaysDeduction = Number(leaveExtraDaysDeduction?.amount || 0);
    const totalDeduction = monthDeduction + extraDaysDeduction;

    return {
      grossDeposit,
      monthDeduction,
      extraDaysDeduction,
      totalDeduction,
      refundableDeposit: Math.max(0, grossDeposit - totalDeduction),
      amountDueFromTenant: Math.max(0, totalDeduction - grossDeposit),
    };
  }, [currentLeaveTenant, selectedLeaveSettlementMonths, leaveExtraDaysDeduction]);

  // Tenants to show in the main table (hide those who have left)
  const visibleTenants = useMemo(() => {
  // 1) Filter tenants (same logic you already had)
  const base = (formData || []).filter((t) => {
    const leaveISO = leaveDates[t._id];
    const isLeaved = leaveISO && new Date(leaveISO) < new Date();

    return (
      !isLeaved &&
      tenantMatchesSearchText(t) &&
      tenantMatchesSelectedYear(t)
    );
  });

  // 2) Sort according to sortConfig
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

    // 🔹 Due: numeric due amount
    if (sortConfig.column === "due") {
      // ✅ IMPORTANT: pass tenant + roomsData (matches your calculateDue usage)
      const aDue = calculateDue(a.rents, a.joiningDate, a, roomsData);
      const bDue = calculateDue(b.rents, b.joiningDate, b, roomsData);
      return (aDue - bDue) * dir;
    }

    // 🔹 Rent status: Pending/Due first OR Paid first
    if (sortConfig.column === "status") {
      const aLabel = getRentStatusLabelForSort(a); // "Paid" / "Pend" / "Due"
      const bLabel = getRentStatusLabelForSort(b);

      const rank = (label, direction) => {
        const s = String(label).toLowerCase();
        const isPending = s.startsWith("pending") || s.startsWith("due");
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
} else {
  // ✅ DEFAULT FLOW when no sorting selected: 301,302,303... then 401,402...
  sorted.sort((a, b) => {
    const toInt = (v) => {
      const m = String(v ?? "").match(/\d+/);
      const n = m ? parseInt(m[0], 10) : NaN;
      return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
    };
    const r = toInt(a.roomNo) - toInt(b.roomNo);
    if (r !== 0) return r;
    return toInt(a.bedNo) - toInt(b.bedNo);
  });
}

return sorted;
  }, [formData, leaveDates, searchText, selectedYear, sortConfig, roomsData]);

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

   return (slots || [])
  .filter((slot) => {
    const key = `${slot.roomNo}-${slot.bedNo}`;
    if (activeKeys.has(key)) return false;

    const matchesSearch =
      !search ||
      String(slot.bedNo).toLowerCase().includes(search) ||
      String(slot.roomNo).toLowerCase().includes(search);

    const matchesYear = selectedYear === "All Records";
    return matchesSearch && matchesYear;
  })
  .sort(compareRoomBed); // ✅ vacant flow

  }, [slots, formData, leaveDates, searchText, selectedYear]);

  // Build combined rows (occupied + vacant) in room-wise flow when no sorting selected
  const combinedRows = useMemo(() => {
    if (sortConfig.column) return null;

    const byRoom = new Map();
    const addRoomBucket = (roomNo) => {
      const key = String(roomNo ?? "");
      if (!byRoom.has(key)) byRoom.set(key, { tenants: [], vacants: [] });
      return byRoom.get(key);
    };

    (visibleTenants || []).forEach((t) => {
      const bucket = addRoomBucket(t.roomNo);
      bucket.tenants.push(t);
    });

    (extraVacantSlots || []).forEach((s) => {
      const bucket = addRoomBucket(s.roomNo);
      bucket.vacants.push(s);
    });

    const roomKeys = Array.from(byRoom.keys()).sort((a, b) => {
      const ra = toInt(a);
      const rb = toInt(b);
      return ra - rb;
    });

    const rows = [];
    roomKeys.forEach((roomKey) => {
      const bucket = byRoom.get(roomKey);
      if (!bucket) return;
      bucket.tenants.sort(compareRoomBed);
      bucket.vacants.sort(compareRoomBed);

      bucket.tenants.forEach((t) => rows.push({ type: "tenant", tenant: t }));
      bucket.vacants.forEach((s) => rows.push({ type: "vacant", slot: s }));
    });

    return rows;
  }, [visibleTenants, extraVacantSlots, sortConfig]);


   const groupedRooms = useMemo(() => {
    const roomMap = new Map();

    (visibleTenants || []).forEach((t) => {
      const roomNo = String(t.roomNo ?? "");
      if (!roomMap.has(roomNo)) {
        roomMap.set(roomNo, { roomNo, occupied: [], vacant: [] });
      }
      roomMap.get(roomNo).occupied.push(t);
    });

    (extraVacantSlots || []).forEach((s) => {
      const roomNo = String(s.roomNo ?? "");
      if (!roomMap.has(roomNo)) {
        roomMap.set(roomNo, { roomNo, occupied: [], vacant: [] });
      }
      roomMap.get(roomNo).vacant.push(s);
    });

    const rooms = Array.from(roomMap.values()).sort(
      (a, b) => toInt(a.roomNo) - toInt(b.roomNo)
    );

    rooms.forEach((r) => {
      r.occupied.sort(compareRoomBed);
      r.vacant.sort(compareRoomBed);
    });

    return rooms;
  }, [visibleTenants, extraVacantSlots]);
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

 return (slots || [])
  .filter((slot) => {
    const key = `${slot.roomNo}-${slot.bedNo}`;
    return !activeKeys.has(key);
  })
  .sort(compareRoomBed);

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
const cell = getMonthCell(tenant, year, monthIdx);
setEditRentAmount(
  Number(cell?.outstanding || cell?.expected || 0) > 0
    ? String(Number(cell?.outstanding || cell?.expected || 0))
    : ""
);
setRentUpdateMode("add");
    // Optional: clear or auto-suggest amount
    // setEditRentAmount(expectFromTenant(tenant, roomsData));
  };
  const openAddForSlot = (slotOrRoomNo, bedNoArg) => {
    const slot =
      slotOrRoomNo && typeof slotOrRoomNo === "object" ? slotOrRoomNo : null;
    const roomNo = slot ? slot.roomNo : slotOrRoomNo;
    const bedNo = slot ? slot.bedNo : bedNoArg;

    const room = roomsData.find((r) => String(r.roomNo) === String(roomNo));
    const bed = room?.beds?.find((b) => String(b.bedNo) === String(bedNo));
    const price =
      toNum(slot?.price) || toNum(bed?.price) || toNum(bed?.baseRent) || "";

    // Optionally fetch SrNo if you use it
    fetchSrNo?.();

    setNewTenant((prev) => ({
      ...prev,
      roomId: room?._id || prev.roomId || "",
      roomNo: String(roomNo ?? ""),
      category: room?.category || slot?.category || prev.category || "",
      bedNo: String(bedNo ?? ""),
      floorNo: room?.floorNo ?? slot?.floorNo ?? "",
      bedPrice: price,
      baseRent: price,
      rentAmount: price,
      firstRentStatus: "ADVANCE_PAID",
      firstRentPaidDate: new Date().toISOString().slice(0, 10),
      // clear inline “other bed” form fields if you use them
      newBedNo: "",
      newBedPrice: "",
    }));
    setShowAddModal(true);
  };





  const openCurrentMonthEdit = (tenant) => {
    if (!tenant?._id) return;
    const now = new Date();
    openEditForTenantMonth(tenant._id, now.getMonth(), now.getFullYear());
  };

  const openDueMonthsModal = (tenant) => {
    if (!tenant) return;
    const dueList = getAllPendingMonths(tenant);
    setDueMonths(dueList);
    setSelectedTenantName(tenant.name || "");
    setSelectedTenant(tenant);
    setShowDueModal(true);
  };

  const openShiftTenantModal = (tenant) => {
    if (!tenant) return;
    setShiftTenant(tenant);
    setShiftTargetKey("");
    setShiftEffectiveDate(new Date().toISOString().slice(0, 10));
    setShowShiftModal(true);
  };

  const openDesktopTenantDetails = (tenant) => {
    if (!tenant) return;
    setSelectedTenant(tenant);
    setShowDetailsModal(true);
  };

  const openTenantEditModal = (tenant) => {
    if (!tenant) return;
    const copy = { ...tenant };
    if (!copy.firstRentStatus && copy.joiningDate) {
      const joinDate = new Date(String(copy.joiningDate).split("T")[0]);
      if (!Number.isNaN(joinDate.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        joinDate.setHours(0, 0, 0, 0);
        const diffDays = (today - joinDate) / (1000 * 60 * 60 * 24);
        if (diffDays >= 0 && diffDays < 31) {
          copy.firstRentStatus = "ADVANCE_PAID";
          copy.firstRentPaidDate = copy.firstRentPaidDate || new Date().toISOString().slice(0, 10);
        }
      }
    }
    if (!copy.firstRentMonth && copy.joiningDate) {
      copy.firstRentMonth = getFirstRentMonthForStatus(
        copy.joiningDate,
        copy.firstRentStatus || "NOT_PAID"
      );
    }
    setEditTenantData(copy);
    setShowEditModal(true);
  };

  const openTenantDeleteModal = (tenant) => {
    if (!tenant?._id) return;
    openDeleteConfirmation(tenant._id);
  };

  const openTenantDetails = (tenant) => {
  if (!tenant) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(max-width: 768px)").matches
    ) {
      setMobileSelectedTenant(tenant);
      setShowMobileTenantProfile(true);
      return;
    }
    openDesktopTenantDetails(tenant);
  };

  const closeMobileTenantProfile = () => {
    setShowMobileTenantProfile(false);
    setMobileSelectedTenant(null);
  };

  const openMobileLeavedTenants = () => {
    setShowMobileLeavedTenants(true);
    setShowMobileVacantBeds(false);
    setShowMobileTenantProfile(false);
    setMobileSelectedTenant(null);
  };

  const closeMobileLeavedTenants = () => {
    setShowMobileLeavedTenants(false);
  };

  const openMobileVacantBeds = () => {
    setShowMobileVacantBeds(true);
    setShowMobileLeavedTenants(false);
    setShowMobileTenantProfile(false);
    setMobileSelectedTenant(null);
  };

  const closeMobileVacantBeds = () => {
    setShowMobileVacantBeds(false);
  };

  const getTenantPhotoMetaForMobile = (tenant) => {
    const found = findTenantPhotoDoc(tenant);
    return found?.doc
      ? {
          photoUrl: docHrefSafe(found.doc),
          photoTransform: found.doc.transform,
        }
      : null;
  };

  const openPhotoEditor = (tenant) => {
    const found = findTenantPhotoDoc(tenant);
    if (!found?.doc) {
      alert("No tenant photo found.");
      return;
    }

    setPhotoEditTenant(tenant);
    setPhotoEditDocIndex(found.index);
    setPhotoEditTransform(normalizePhotoTransform(found.doc.transform));
    setShowPhotoEditModal(true);
  };

  const savePhotoTransform = async () => {
    if (!photoEditTenant || photoEditDocIndex == null) return;

    const docs = Array.isArray(photoEditTenant.documents)
      ? [...photoEditTenant.documents]
      : [];

    if (!docs[photoEditDocIndex]) {
      alert("Photo document not found.");
      return;
    }

    const normalized = normalizePhotoTransform(photoEditTransform);
    docs[photoEditDocIndex] = {
      ...docs[photoEditDocIndex],
      transform: normalized,
    };

    try {
      setSavingPhotoTransform(true);
      await axios.put(`${apiUrl}forms/${photoEditTenant._id}`, {
        documents: docs,
      });

      setFormData((prev) =>
        prev.map((t) =>
          t._id === photoEditTenant._id ? { ...t, documents: docs } : t
        )
      );

      setShowPhotoEditModal(false);
      setPhotoEditTenant(null);
      setPhotoEditDocIndex(null);
    } catch (err) {
      console.error("Failed to save photo transform:", err);
      alert("Failed to save photo changes.");
    } finally {
      setSavingPhotoTransform(false);
    }
  };
// ✅ ADD THIS (near top inside component)
const EMPTY_TENANT = {
  srNo: "",
  name: "",
  phoneNo: "",
  address: "",
  pincode: "",
  city: "",
  state: "",
  houseNo: "",
  nearbyPlace: "",
  joiningDate: "",
  depositAmount: "",

  roomId: "",
  roomNo: "",
  category: "",
  floorNo: "",

  bedNo: "",
  bedPrice: "",
  baseRent: "",
  rentAmount: "",

  __priceMode: "current",
  __newBedPriceEdit: "",
  __priceMsg: "",
  __savingPrice: false,

  newBedNo: "",
  newBedPrice: "",
  newBedCategory: "",
  __bedMsg: "",
  __savingBed: false,

  relative1Relation: "Self",
  relative1Name: "",
  relative1Phone: "",
  relative2Relation: "Self",
  relative2Name: "",
  relative2Phone: "",

  dob: "",
  dateOfJoiningCollege: "",
  companyAddress: "",
  relativeAddress: "",
  firstRentStatus: "ADVANCE_PAID",
  firstRentPaidDate: "",
  firstRentMonth: "",

};

const EXPORT_COLORS = {
  title: "1E3A8A",
  header: "2563EB",
  section: "0F766E",
  labelFill: "EFF6FF",
  bandFill: "F8FAFC",
  border: "CBD5E1",
  text: "0F172A",
  subText: "475569",
};

const rgb = (hex) => ({ rgb: hex });

const borderStyle = (color = EXPORT_COLORS.border) => ({
  top: { style: "thin", color: rgb(color) },
  bottom: { style: "thin", color: rgb(color) },
  left: { style: "thin", color: rgb(color) },
  right: { style: "thin", color: rgb(color) },
});

const setCellStyle = (ws, row, col, style) => {
  const cell = ws[XLSX.utils.encode_cell({ r: row, c: col })];
  if (cell) cell.s = style;
};

const mergeRow = (ws, row, lastCol) => {
  ws["!merges"] = ws["!merges"] || [];
  ws["!merges"].push({ s: { r: row, c: 0 }, e: { r: row, c: lastCol } });
};

const styleDataGrid = (ws, startRow, endRow, colCount, options = {}) => {
  const alternate = options.alternate !== false;
  for (let r = startRow; r <= endRow; r++) {
    for (let c = 0; c < colCount; c++) {
      const isLabel = c === 0;
      const fillColor = alternate && r % 2 === 0 ? EXPORT_COLORS.bandFill : "FFFFFF";
      setCellStyle(ws, r, c, {
        font: {
          name: "Calibri",
          sz: 11,
          color: rgb(EXPORT_COLORS.text),
          bold: isLabel,
        },
        fill: {
          patternType: "solid",
          fgColor: rgb(isLabel ? EXPORT_COLORS.labelFill : fillColor),
        },
        border: borderStyle(),
        alignment: {
          vertical: "center",
          horizontal: "left",
          wrapText: true,
        },
      });
    }
  }
};

const styleTitleRow = (ws, row, lastCol, subtitle = false) => {
  mergeRow(ws, row, lastCol);
  setCellStyle(ws, row, 0, {
    font: {
      name: "Calibri",
      sz: subtitle ? 10 : 14,
      bold: !subtitle,
      italic: subtitle,
      color: rgb(subtitle ? EXPORT_COLORS.subText : "FFFFFF"),
    },
    fill: {
      patternType: "solid",
      fgColor: rgb(subtitle ? "E2E8F0" : EXPORT_COLORS.title),
    },
    border: borderStyle(subtitle ? "CBD5E1" : EXPORT_COLORS.title),
    alignment: {
      horizontal: subtitle ? "left" : "center",
      vertical: "center",
      wrapText: true,
    },
  });
};

const styleSectionRow = (ws, row, lastCol) => {
  mergeRow(ws, row, lastCol);
  setCellStyle(ws, row, 0, {
    font: {
      name: "Calibri",
      sz: 11,
      bold: true,
      color: rgb("FFFFFF"),
    },
    fill: {
      patternType: "solid",
      fgColor: rgb(EXPORT_COLORS.section),
    },
    border: borderStyle(EXPORT_COLORS.section),
    alignment: {
      horizontal: "left",
      vertical: "center",
      wrapText: true,
    },
  });
};

const normalizeSheetText = (ws, startRow, endRow, startCol, endCol) => {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (!cell || cell.v === undefined || cell.v === null || cell.v === "") continue;
      cell.v = String(cell.v);
      cell.t = "s";
    }
  }
};

const setHyperlinkCell = (ws, row, col, url, tooltip) => {
  if (!url) return;
  const addr = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = ws[addr];
  if (!cell) return;
  cell.l = {
    Target: url,
    Tooltip: tooltip || url,
  };
};

const getExportDocuments = (...sources) => {
  const candidates = [];

  sources.forEach((source) => {
    if (!source || typeof source !== "object") return;
    candidates.push(
      source.documents,
      source.documentFiles,
      source.uploadedDocuments,
      source.docs
    );
  });

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate;
    }
  }

  return [];
};

const handleDownloadExcel = () => {
  const headers = [
    "SrNo",
    "Name",
    "Phone",
    "JoiningDate",
    "RoomNo",
    "FloorNo",
    "BedNo",
    "DepositAmount",
    "Address",
    "RelativeAddress1",
    "RelativeAddress2",
    "CompanyAddress",
    "DateOfJoiningCollege",
    "DOB",
  ];

  const rows = formData.map((item) => ([
    item.srNo ?? "",
    item.name ?? "",
    item.phoneNo ?? "",
    item.joiningDate ?? "",
    item.roomNo ?? "",
    item.floorNo ?? "",
    item.bedNo ?? "",
    item.depositAmount ?? "",
    item.address ?? "",
    item.relativeAddress1 ?? "",
    item.relativeAddress2 ?? "",
    item.companyAddress ?? "",
    item.dateOfJoiningCollege ?? "",
    item.dob ?? "",
  ]));

  const aoa = [
    ["Tenant Summary Report"],
    [`Generated on ${new Date().toLocaleString("en-IN")}`],
    [],
    headers,
    ...rows,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  normalizeSheetText(worksheet, 4, aoa.length - 1, 0, headers.length - 1);
  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
  ];
  worksheet["!cols"] = [
    { wch: 10 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 },
    { wch: 26 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
  ];

  styleTitleRow(worksheet, 0, headers.length - 1, false);
  styleTitleRow(worksheet, 1, headers.length - 1, true);
  for (let c = 0; c < headers.length; c++) {
    setCellStyle(worksheet, 3, c, {
      font: {
        name: "Calibri",
        sz: 11,
        bold: true,
        color: rgb("FFFFFF"),
      },
      fill: {
        patternType: "solid",
        fgColor: rgb(EXPORT_COLORS.header),
      },
      border: borderStyle(EXPORT_COLORS.header),
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
    });
  }
  styleDataGrid(worksheet, 4, aoa.length - 1, headers.length);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tenants");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
    cellStyles: true,
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

  
const sectionHeadingMap = {
  rent: "Bed-wise Rent and Deposit Tracker",
  light: "Light Bill",
  expenses: "Other Expenses",
  staff: "Staff Expenses",
  holiday: "Holiday Management",
  canteen: "Canteen Portal",
  "canteen attendance": "Meal Attendance",
};

const currentSectionHeading =
  sectionHeadingMap[activeTab] || "Bed-wise Rent and Deposit Tracker";
useEffect(() => {
  if (location.state?.tab) {
    setActiveTab(location.state.tab);
  }
}, [location.state?.tab]);

const openNewComponantSection = (tab) => {
  navigate("/NewComponant", { state: { tab } });
};

const handleMobileSectionSelect = (key) => {
  setShowMobileSections(false);

  if (key === "dashboard") {
    navigate("/maindashboard");
    return;
  }

  if (key === "rent") {
    openNewComponantSection("rent");
    return;
  }

  if (key === "light") {
    openNewComponantSection("light");
    return;
  }

  if (key === "other-expense") {
    openNewComponantSection("expenses");
    return;
  }

  if (key === "staff") {
    openNewComponantSection("staff");
    return;
  }

 
};
  const handleLeave = (tenant) => {
    setCurrentLeaveId(tenant._id);
    setCurrentLeaveName(tenant.name);
    setCurrentLeaveTenant(tenant);
    setSelectedLeaveDate(new Date().toISOString().slice(0, 10));
    setLeaveDeductFromDeposit(false);
    setLeaveSelectedMonths([]);
    setShowLeaveModal(true);
  };

  const closeLeaveModal = () => {
    setShowLeaveModal(false);
    setCurrentLeaveTenant(null);
    setLeaveDeductFromDeposit(false);
    setLeaveSelectedMonths([]);
    setSelectedLeaveDate("");
    setCurrentLeaveId(null);
    setCurrentLeaveName("");
  };

 const confirmLeave = async () => {
  if (!selectedLeaveDate) {
    alert("Please select a leave date.");
    return;
  }

  const settlementMonths = leaveSettlementMonths;
  const selectedSettlementMonths = selectedLeaveSettlementMonths;
  if (
    leaveDeductFromDeposit &&
    settlementMonths.length > 0 &&
    selectedSettlementMonths.length === 0 &&
    !leaveExtraDaysDeduction
  ) {
    alert("Please select at least one month to deduct, or turn off deposit deduction.");
    return;
  }
  const grossDeposit = leaveSettlementSummary.grossDeposit;
  const totalDeduction = leaveDeductFromDeposit
    ? leaveSettlementSummary.totalDeduction
    : 0;
  const refundableDeposit = leaveDeductFromDeposit
    ? leaveSettlementSummary.refundableDeposit
    : grossDeposit;
  const amountDueFromTenant = leaveDeductFromDeposit
    ? leaveSettlementSummary.amountDueFromTenant
    : 0;
  const deductionRows = leaveDeductFromDeposit
    ? [
        ...selectedSettlementMonths.map((month) => ({
          month: month.label,
          amount: Number(month.amount || 0),
        })),
        ...(leaveExtraDaysDeduction
          ? [
              {
                month: leaveExtraDaysDeduction.label,
                amount: Number(leaveExtraDaysDeduction.amount || 0),
                days: leaveExtraDaysDeduction.days,
                dailyRent: Math.round(Number(leaveExtraDaysDeduction.dailyRent || 0)),
                cycleRange: leaveExtraDaysDeduction.cycleRange,
              },
            ]
          : []),
      ]
    : [];

  try {
    const payload = {
      tenantId: currentLeaveId,
      leaveDate: selectedLeaveDate,
      leaveSettlement: {
        deductFromDeposit: leaveDeductFromDeposit,
        selectedMonths: leaveDeductFromDeposit
          ? selectedSettlementMonths.map((month) => month.label)
          : [],
        deductions: deductionRows,
        grossDeposit,
        totalDeduction,
        refundableDeposit,
        amountDueFromTenant,
      },
    };

    console.log("Sending leave payload:", payload);

    const res = await axios.post(
      `${apiUrl}/leave`,
      payload
    );

    alert("Leave marked successfully");
    const updatedTenant = res?.data?.tenant;
    if (updatedTenant?._id) {
      setFormData((prev) =>
        prev.map((tenant) =>
          tenant._id === updatedTenant._id ? { ...tenant, ...updatedTenant } : tenant
        )
      );
      setTenants((prev) =>
        prev.map((tenant) =>
          tenant._id === updatedTenant._id ? { ...tenant, ...updatedTenant } : tenant
        )
      );
    } else {
      setFormData((prev) =>
        prev.map((tenant) =>
          tenant._id === currentLeaveId
            ? { ...tenant, leaveDate: selectedLeaveDate, isOnLeave: true, leaveSettlement: payload.leaveSettlement }
            : tenant
        )
      );
      setTenants((prev) =>
        prev.map((tenant) =>
          tenant._id === currentLeaveId
            ? { ...tenant, leaveDate: selectedLeaveDate, isOnLeave: true, leaveSettlement: payload.leaveSettlement }
            : tenant
        )
      );
    }
    setLeaveDates((prev) => ({
      ...prev,
      [currentLeaveId]: selectedLeaveDate,
    }));
    closeLeaveModal();
    await refreshTenants();

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
// Shows ALL pending/due months based on the new rent cycle logic (advance/normal)
const getAllPendingMonths = (tenant) => {
  if (!tenant?.joiningDate) return [];

  const months = getBillingMonthsUpToNow(tenant);
  const out = [];

  months.forEach(({ y, m }) => {
    const c = getMonthCell(tenant, y, m);
    const isRealDue =
      c?.isPast && (c.label === "Due" || c.label === "Pending");
    const outstanding = Number(c?.outstanding || 0);
    if (isRealDue && outstanding > 0) {
      const monthLabel = new Date(y, m, 1).toLocaleString("default", {
          month: "long",
          year: "numeric",
      });
      out.push({
        y,
        m,
        key: `${y}-${m}`,
        label: monthLabel,
        cycle: c.rangeText || "",
        dueDate: c.dateStr || "",
        expected: Number(c.expected || 0),
        paid: Number(c.amountPaid || 0),
        outstanding,
      });
    }
  });

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

 const formatVacantBedOption = (bed) =>
  `Room ${bed.roomNo} - Bed ${bed.bedNo}` +
  `${bed.category ? ` - ${bed.category}` : ""}` +
  `${bed.floorNo ? ` - Floor ${bed.floorNo}` : ""}` +
  `${bed.price != null ? ` - Rs. ${bed.price}` : ""}`;

 const openUndoBedModal = (tenantId, message, vacantBeds = []) => {
  if (!vacantBeds.length) {
    alert(`${message}\n\nNo vacant beds are available right now.`);
    return;
  }

  setUndoBedModal({
    show: true,
    tenantId,
    message,
    vacantBeds,
    selectedIndex: "",
    busy: false,
  });
};

 const undoLeaveRequest = async (tenantId, bedOverride = null) => {
  const payload = { id: tenantId };
  if (bedOverride) {
    payload.roomNo = bedOverride.roomNo;
    payload.bedNo = bedOverride.bedNo;
    payload.category = bedOverride.category;
  }

  return axios.post(`${apiUrl}/cancel-leave`, payload);
};

 const handleConfirmUndoWithSelectedBed = async () => {
  const selectedIndex = Number(undoBedModal.selectedIndex);
  const pickedBed = undoBedModal.vacantBeds[selectedIndex];
  if (!pickedBed) {
    alert("Please select a vacant bed.");
    return;
  }

  try {
    setUndoBedModal((prev) => ({ ...prev, busy: true }));
    const retryRes = await undoLeaveRequest(undoBedModal.tenantId, pickedBed);
    if (retryRes.data?.success) {
      const restored = retryRes.data?.form;
      alert(
        `Leave undone successfully.\nAssigned bed: Room ${restored?.roomNo || pickedBed.roomNo}, Bed ${restored?.bedNo || pickedBed.bedNo}`
      );
      setUndoBedModal({
        show: false,
        tenantId: "",
        message: "",
        vacantBeds: [],
        selectedIndex: "",
        busy: false,
      });
      await refreshTenants?.();
      return;
    }
    alert(retryRes.data?.message || "Failed to undo leave.");
    setUndoBedModal((prev) => ({ ...prev, busy: false }));
  } catch (retryError) {
    console.error("Error undoing leave with selected bed:", retryError);
    alert(retryError?.response?.data?.message || "Failed to undo leave with selected bed.");
    setUndoBedModal((prev) => ({ ...prev, busy: false }));
  }
};

 const handleUndoClick = async (tenantId) => {
  try {
    let res = await undoLeaveRequest(tenantId);

    if (res.data?.success) {
      const restored = res.data?.form;
      alert(
        `Leave undone successfully.\nAssigned bed: Room ${restored?.roomNo || "-"}, Bed ${restored?.bedNo || "-"}`
      );
      await refreshTenants?.();
      return;
    }

    alert(res.data?.message || "Failed to undo leave.");
  } catch (error) {
    const data = error?.response?.data;
    if (error?.response?.status === 409 && (data?.code === "BED_OCCUPIED" || data?.code === "BED_REQUIRED")) {
      openUndoBedModal(tenantId, data.message || "Please select another vacant bed.", data.vacantBeds || []);
      return;
    }

    console.error("Error undoing leave:", error);
    alert(data?.message || "Failed to undo leave.");
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
    const exportDocs = getExportDocuments(item, tenant);
    const docLinkRows = [];
    const settlement = item.leaveSettlement || {};
    const settlementDeductions = Array.isArray(settlement.deductions)
      ? settlement.deductions
      : [];
    const totalDeductionAmount =
      settlement.totalDeduction != null
        ? Number(settlement.totalDeduction || 0)
        : settlementDeductions.reduce(
            (sum, deduction) => sum + Number(deduction?.amount || 0),
            0
          );
    const extraDaysDeductions = settlementDeductions.filter((deduction) => {
      const label = String(deduction?.month || "").toLowerCase();
      return (
        Number(deduction?.days || 0) > 0 ||
        Number(deduction?.dailyRent || 0) > 0 ||
        Boolean(deduction?.cycleRange) ||
        label.includes("extra")
      );
    });
    const extraDaysDeductionAmount = extraDaysDeductions.reduce(
      (sum, deduction) => sum + Number(deduction?.amount || 0),
      0
    );
    const fullMonthDeductionAmount = Math.max(
      0,
      totalDeductionAmount - extraDaysDeductionAmount
    );
    const extraDaysDetailText = extraDaysDeductions
      .map((deduction) => {
        const parts = [
          deduction.month || "Extra days rent",
          deduction.days ? `${deduction.days} days` : "",
          deduction.dailyRent
            ? `Rs. ${Number(deduction.dailyRent || 0).toLocaleString("en-IN")} per day`
            : "",
          deduction.cycleRange || "",
          `Rs. ${Number(deduction.amount || 0).toLocaleString("en-IN")}`,
        ].filter(Boolean);
        return parts.join(" | ");
      })
      .join("\n");

    const reportTitle = `Tenant Report - ${item.name || "Tenant"}`;
    const generatedLine = `Generated on ${new Date().toLocaleString("en-IN")}`;

    const formatted = [
      [reportTitle],
      [generatedLine],
      [],
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
      ["LeaveDate", formatDate(item.leaveDate)],
      [
        "DeductFromDeposit",
        settlement.deductFromDeposit ? "Yes" : "No",
      ],
      [
        "GrossDeposit",
        settlement.grossDeposit ?? item.depositAmount ?? "",
      ],
      ["FullMonthDeduction", fullMonthDeductionAmount],
      ["ExtraDaysDeduction", extraDaysDeductionAmount],
      ["ExtraDaysDetails", extraDaysDetailText || "N/A"],
      ["TotalDeduction", totalDeductionAmount],
      [
        "RefundableDeposit",
        settlement.refundableDeposit ?? item.depositAmount ?? "",
      ],
      [
        "AmountDueFromTenant",
        settlement.amountDueFromTenant ?? 0,
      ],
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

    if (exportDocs.length > 0) {
      formatted.push(["", ""]);
      formatted.push(["Documents", ""]);
      exportDocs.forEach((doc, i) => {
        const href = docHrefSafe(doc);
        formatted.push([`Doc ${i + 1} Relation`, doc.relation || ""]);
        formatted.push([`Doc ${i + 1} URL`, href || "No link available"]);
        if (href) {
          docLinkRows.push({
            row: formatted.length - 1,
            label: doc.fileName || doc.relation || `Document ${i + 1}`,
            url: href,
          });
        }
      });
    }

    const ws = XLSX.utils.aoa_to_sheet(formatted);
    normalizeSheetText(ws, 4, formatted.length - 1, 0, 1);
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
    ];
    ws["!cols"] = [{ wch: 32 }, { wch: 45 }];

    styleTitleRow(ws, 0, 1, false);
    styleTitleRow(ws, 1, 1, true);
    setCellStyle(ws, 3, 0, {
      font: {
        name: "Calibri",
        sz: 11,
        bold: true,
        color: rgb("FFFFFF"),
      },
      fill: {
        patternType: "solid",
        fgColor: rgb(EXPORT_COLORS.header),
      },
      border: borderStyle(EXPORT_COLORS.header),
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
    });
    setCellStyle(ws, 3, 1, {
      font: {
        name: "Calibri",
        sz: 11,
        bold: true,
        color: rgb("FFFFFF"),
      },
      fill: {
        patternType: "solid",
        fgColor: rgb(EXPORT_COLORS.header),
      },
      border: borderStyle(EXPORT_COLORS.header),
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
    });

    for (let row = 4; row < formatted.length; row++) {
      const [label, value] = formatted[row] || [];
      if (!label && !value) continue;

      if (label && !value && label !== "Field") {
        styleSectionRow(ws, row, 1);
        continue;
      }

      const fillColor = row % 2 === 0 ? EXPORT_COLORS.bandFill : "FFFFFF";
      setCellStyle(ws, row, 0, {
        font: {
          name: "Calibri",
          sz: 11,
          bold: true,
          color: rgb(EXPORT_COLORS.text),
        },
        fill: {
          patternType: "solid",
          fgColor: rgb(EXPORT_COLORS.labelFill),
        },
        border: borderStyle(),
        alignment: {
          horizontal: "left",
          vertical: "center",
          wrapText: true,
        },
      });
      setCellStyle(ws, row, 1, {
        font: {
          name: "Calibri",
          sz: 11,
          color: rgb(EXPORT_COLORS.text),
        },
        fill: {
          patternType: "solid",
          fgColor: rgb(fillColor),
        },
        border: borderStyle(),
        alignment: {
          horizontal: "left",
          vertical: "center",
          wrapText: true,
        },
      });
    }

    docLinkRows.forEach(({ row, url, label }) => {
      setCellStyle(ws, row, 1, {
        font: {
          name: "Calibri",
          sz: 11,
          color: rgb("0563C1"),
          underline: true,
        },
        fill: {
          patternType: "solid",
          fgColor: rgb(row % 2 === 0 ? EXPORT_COLORS.bandFill : "FFFFFF"),
        },
        border: borderStyle(),
        alignment: {
          horizontal: "left",
          vertical: "center",
          wrapText: true,
        },
      });
      setHyperlinkCell(ws, row, 1, url, `Open ${label}`);
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tenant Data");

    const settlementRows = [
      [`Leave Settlement - ${item.name || "Tenant"}`],
      [`Generated on ${new Date().toLocaleString("en-IN")}`],
      [],
      ["Field", "Value"],
      ["Leave Date", formatDate(item.leaveDate)],
      ["Deduct From Deposit", settlement.deductFromDeposit ? "Yes" : "No"],
      [
        "Gross Deposit",
        settlement.grossDeposit ?? item.depositAmount ?? "",
      ],
      ["Full Month Deduction", fullMonthDeductionAmount],
      ["Extra Days Deduction", extraDaysDeductionAmount],
      ["Total Deduction", totalDeductionAmount],
      [
        "Refundable Deposit",
        settlement.refundableDeposit ?? item.depositAmount ?? "",
      ],
      [
        "Amount Due From Tenant",
        settlement.amountDueFromTenant ?? 0,
      ],
    ];

    settlementDeductions.forEach((deduction, idx) => {
      settlementRows.push([`Deduction ${idx + 1} Month`, deduction.month || ""]);
      settlementRows.push([`Deduction ${idx + 1} Amount`, deduction.amount ?? 0]);
      if (Number(deduction?.days || 0) > 0) {
        settlementRows.push([`Deduction ${idx + 1} Days`, deduction.days]);
      }
      if (Number(deduction?.dailyRent || 0) > 0) {
        settlementRows.push([`Deduction ${idx + 1} Daily Rent`, deduction.dailyRent]);
      }
      if (deduction?.cycleRange) {
        settlementRows.push([`Deduction ${idx + 1} Cycle Range`, deduction.cycleRange]);
      }
    });

    if (settlementRows.length > 1) {
      const settlementSheet = XLSX.utils.aoa_to_sheet(settlementRows);
      normalizeSheetText(settlementSheet, 4, settlementRows.length - 1, 0, 1);
      settlementSheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      ];
      settlementSheet["!cols"] = [{ wch: 24 }, { wch: 40 }];
      styleTitleRow(settlementSheet, 0, 1, false);
      styleTitleRow(settlementSheet, 1, 1, true);
      setCellStyle(settlementSheet, 3, 0, {
        font: {
          name: "Calibri",
          sz: 11,
          bold: true,
          color: rgb("FFFFFF"),
        },
        fill: {
          patternType: "solid",
          fgColor: rgb(EXPORT_COLORS.header),
        },
        border: borderStyle(EXPORT_COLORS.header),
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
      });
      setCellStyle(settlementSheet, 3, 1, {
        font: {
          name: "Calibri",
          sz: 11,
          bold: true,
          color: rgb("FFFFFF"),
        },
        fill: {
          patternType: "solid",
          fgColor: rgb(EXPORT_COLORS.header),
        },
        border: borderStyle(EXPORT_COLORS.header),
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
      });
      for (let row = 4; row < settlementRows.length; row++) {
        const fillColor = row % 2 === 0 ? EXPORT_COLORS.bandFill : "FFFFFF";
        setCellStyle(settlementSheet, row, 0, {
          font: {
            name: "Calibri",
            sz: 11,
            bold: true,
            color: rgb(EXPORT_COLORS.text),
          },
          fill: {
            patternType: "solid",
            fgColor: rgb(EXPORT_COLORS.labelFill),
          },
          border: borderStyle(),
          alignment: {
            horizontal: "left",
            vertical: "center",
            wrapText: true,
          },
        });
        setCellStyle(settlementSheet, row, 1, {
          font: {
            name: "Calibri",
            sz: 11,
            color: rgb(EXPORT_COLORS.text),
          },
          fill: {
            patternType: "solid",
            fgColor: rgb(fillColor),
          },
          border: borderStyle(),
          alignment: {
            horizontal: "left",
            vertical: "center",
            wrapText: true,
          },
        });
      }
      XLSX.utils.book_append_sheet(wb, settlementSheet, "Leave Settlement");
    }

    const docs = exportDocs;
    if (docs.length > 0) {
      const docRows = [["Documents"]];
      docRows.push([`Generated on ${new Date().toLocaleString("en-IN")}`]);
      docRows.push([""]);
      docRows.push(["Document", "Relation", "ImageKit URL"]);
      docs.forEach((doc, idx) => {
        const href = docHrefSafe(doc);
        docRows.push([
          doc.fileName || doc.relation || `Document ${idx + 1}`,
          doc.relation || "",
          href || "No link available",
        ]);
      });

      const docsSheet = XLSX.utils.aoa_to_sheet(docRows);
      normalizeSheetText(docsSheet, 4, docRows.length - 1, 0, 2);
      docsSheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
      ];
      docsSheet["!cols"] = [{ wch: 28 }, { wch: 20 }, { wch: 90 }];
      styleTitleRow(docsSheet, 0, 2, false);
      styleTitleRow(docsSheet, 1, 2, true);
      for (let c = 0; c < 3; c++) {
        setCellStyle(docsSheet, 3, c, {
          font: {
            name: "Calibri",
            sz: 11,
            bold: true,
            color: rgb("FFFFFF"),
          },
          fill: {
            patternType: "solid",
            fgColor: rgb(EXPORT_COLORS.header),
          },
          border: borderStyle(EXPORT_COLORS.header),
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
        });
      }
      for (let row = 4; row < docRows.length; row++) {
        const fillColor = row % 2 === 0 ? EXPORT_COLORS.bandFill : "FFFFFF";
        setCellStyle(docsSheet, row, 0, {
          font: {
            name: "Calibri",
            sz: 11,
            bold: true,
            color: rgb(EXPORT_COLORS.text),
          },
          fill: {
            patternType: "solid",
            fgColor: rgb(EXPORT_COLORS.labelFill),
          },
          border: borderStyle(),
          alignment: {
            horizontal: "left",
            vertical: "center",
            wrapText: true,
          },
        });
        setCellStyle(docsSheet, row, 1, {
          font: {
            name: "Calibri",
            sz: 11,
            color: rgb(EXPORT_COLORS.text),
          },
          fill: {
            patternType: "solid",
            fgColor: rgb(fillColor),
          },
          border: borderStyle(),
          alignment: {
            horizontal: "left",
            vertical: "center",
            wrapText: true,
          },
        });
        const href = docHrefSafe(docs[row - 4]);
        setCellStyle(docsSheet, row, 2, {
          font: {
            name: "Calibri",
            sz: 11,
            color: rgb(href ? "0563C1" : EXPORT_COLORS.text),
            underline: !!href,
          },
          fill: {
            patternType: "solid",
            fgColor: rgb(fillColor),
          },
          border: borderStyle(),
          alignment: {
            horizontal: "left",
            vertical: "center",
            wrapText: true,
          },
        });
        if (href) {
          setHyperlinkCell(
            docsSheet,
            row,
            2,
            href,
            `Open ${docs[row - 4]?.fileName || docs[row - 4]?.relation || "document"}`
          );
        }
      }
      XLSX.utils.book_append_sheet(wb, docsSheet, "Documents");
    }

    const safeName = (item.name || "Tenant").replace(/[\\/:*?"<>|]/g, "_");
    XLSX.writeFile(wb, `Tenant_${safeName}.xlsx`, { cellStyles: true });
  } catch (err) {
    console.error("Download failed", err);
    alert("Failed to download tenant data.");
  }
};

  const closeEditTenantModal = () => {
    setShowEditModal(false);
    setEditSelfAadharFile(null);
    setEditParentAadharFile(null);
    setEditPhotoFile(null);
    setEditDocMsg("");
  };

  const handleShareEditTenantLink = async () => {
    try {
      if (!editTenantData?._id) {
        alert("Tenant ID missing.");
        return;
      }
      if (creatingEditInvite) return;
      setCreatingEditInvite(true);

      const toNumLocal = (v) => {
        if (v === "" || v == null) return undefined;
        const n = Number(String(v).replace(/[,₹\s]/g, ""));
        return Number.isFinite(n) ? n : undefined;
      };

      const joinDate =
        editTenantData.joiningDate?.split("T")[0] ||
        editTenantData.joiningDate ||
        undefined;

      const inferredCategory =
        editTenantData.category ||
        roomsData.find((r) => String(r.roomNo) === String(editTenantData.roomNo))
          ?.category ||
        undefined;

      const payload = {
        name: editTenantData.name || undefined,
        phoneNo: editTenantData.phoneNo || undefined,
        address: editTenantData.address || undefined,
        pincode: editTenantData.pincode || undefined,
        city: editTenantData.city || undefined,
        state: editTenantData.state || undefined,
        houseNo: editTenantData.houseNo || undefined,
        nearbyPlace: editTenantData.nearbyPlace || undefined,
        relativeAddress: editTenantData.relativeAddress || undefined,
        relative1Relation: editTenantData.relative1Relation || undefined,
        relative1Name: editTenantData.relative1Name || undefined,
        relative1Phone: editTenantData.relative1Phone || undefined,
        relative2Relation: editTenantData.relative2Relation || undefined,
        relative2Name: editTenantData.relative2Name || undefined,
        relative2Phone: editTenantData.relative2Phone || undefined,
        companyAddress: editTenantData.companyAddress || undefined,
        dateOfJoiningCollege: editTenantData.dateOfJoiningCollege || undefined,
        dob: editTenantData.dob || undefined,
        roomNo: editTenantData.roomNo || undefined,
        bedNo: editTenantData.bedNo || undefined,
        joiningDate: joinDate,
        baseRent: toNumLocal(editTenantData.baseRent),
        rentAmount: toNumLocal(
          editTenantData.baseRent !== "" && editTenantData.baseRent != null
            ? editTenantData.baseRent
            : editTenantData.rentAmount
        ),
        depositAmount: toNumLocal(editTenantData.depositAmount),
        category: inferredCategory,
        firstRentStatus: editTenantData.firstRentStatus || undefined,
        firstRentMonth: editTenantData.firstRentMonth || undefined,
        firstRentPaidDate: editTenantData.firstRentPaidDate || undefined,
      };

      const res = await axios.post(
        `${apiUrl}invites/for-form/${editTenantData._id}`,
        payload,
        { headers: { "X-Origin": window.location.origin } }
      );

      const url = res.data?.url;
      if (!url) {
        alert("Invite created but URL missing.");
        setCreatingEditInvite(false);
        return;
      }

      const shareData = {
        title: "Tenant Form (One-Time)",
        text: "Please fill this form:",
        url,
      };

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
      console.error("EDIT INVITE ERROR =>", e?.response?.data || e);
      alert(`Could not create invite link.\n\n${msg}`);
    } finally {
      setCreatingEditInvite(false);
    }
  };




  const handleTenantUpdate = async () => {
    try {
      setEditDocMsg("");
      const hasEditDocs =
        !!editSelfAadharFile || !!editParentAadharFile || !!editPhotoFile;
      const firstRentStatus = String(
        editTenantData.firstRentStatus || "NOT_PAID"
      ).trim();
      const firstRentMonth = getFirstRentMonthForStatus(
        editTenantData.joiningDate,
        firstRentStatus
      );

      if (hasEditDocs) {
        const rentAmountNum = Number(
          editTenantData.baseRent ?? editTenantData.rentAmount ?? 0
        );
        if (!Number.isFinite(rentAmountNum) || rentAmountNum <= 0) {
          setEditDocMsg("Rent Amount is required (must be a valid number).");
          return;
        }
        if (!editTenantData.joiningDate) {
          setEditDocMsg("Joining Date is required.");
          return;
        }

        const fd = new FormData();
        fd.append("formId", editTenantData._id);
        fd.append("rentAmount", String(rentAmountNum));
        fd.append(
          "depositAmount",
          String(Number(editTenantData.depositAmount ?? 0))
        );
        fd.append("paymentMode", "Cash");
        fd.append("month", firstRentMonth);
        fd.append("firstRentStatus", firstRentStatus);
        fd.append("firstRentMonth", firstRentMonth);

        fd.append("name", editTenantData.name || "");
        fd.append("phoneNo", editTenantData.phoneNo || "");
        fd.append("address", editTenantData.address || "");
        if (editTenantData.pincode) fd.append("pincode", editTenantData.pincode);
        if (editTenantData.city) fd.append("city", editTenantData.city);
        if (editTenantData.state) fd.append("state", editTenantData.state);
        if (editTenantData.houseNo) fd.append("houseNo", editTenantData.houseNo);
        if (editTenantData.nearbyPlace) fd.append("nearbyPlace", editTenantData.nearbyPlace);
        fd.append(
          "joiningDate",
          editTenantData.joiningDate?.split("T")[0] ||
            editTenantData.joiningDate ||
            ""
        );
        fd.append("roomNo", editTenantData.roomNo || "");
        fd.append("bedNo", editTenantData.bedNo || "");
        fd.append("floorNo", editTenantData.floorNo || "");
        fd.append(
          "baseRent",
          String(
            Number(editTenantData.baseRent ?? rentAmountNum ?? 0) || rentAmountNum
          )
        );
        fd.append("companyAddress", editTenantData.companyAddress || "");
        fd.append(
          "dateOfJoiningCollege",
          editTenantData.dateOfJoiningCollege?.split("T")[0] ||
            editTenantData.dateOfJoiningCollege ||
            ""
        );
        fd.append(
          "dob",
          editTenantData.dob?.split("T")[0] || editTenantData.dob || ""
        );
        fd.append("category", editTenantData.category || "");

        fd.append("relative1Relation", editTenantData.relative1Relation || "");
        fd.append("relative1Name", editTenantData.relative1Name || "");
        fd.append("relative1Phone", editTenantData.relative1Phone || "");
        fd.append("relative2Relation", editTenantData.relative2Relation || "");
        fd.append("relative2Name", editTenantData.relative2Name || "");
        fd.append("relative2Phone", editTenantData.relative2Phone || "");

        if (editSelfAadharFile && !isAllowedImageFile(editSelfAadharFile)) {
          setEditDocMsg("Self Aadhaar Card must be JPG, JPEG, or PNG.");
          return;
        }
        if (editParentAadharFile && !isAllowedImageFile(editParentAadharFile)) {
          setEditDocMsg("Parent Aadhaar Card must be JPG, JPEG, or PNG.");
          return;
        }
        if (editPhotoFile && !isAllowedImageFile(editPhotoFile)) {
          setEditDocMsg("Tenant Photograph must be JPG, JPEG, or PNG.");
          return;
        }

        if (editSelfAadharFile) {
          const f = await compressForUpload(editSelfAadharFile);
          fd.append("documents", f);
          fd.append("relations", "Self Aadhaar Card");
        }
        if (editParentAadharFile) {
          const f = await compressForUpload(editParentAadharFile);
          fd.append("documents", f);
          fd.append("relations", "Parent Aadhaar Card");
        }
        if (editPhotoFile) {
          const f = await compressForUpload(editPhotoFile);
          fd.append("documents", f);
          fd.append("relations", "Tenant Photo");
        }

        const API_ROOT = String(apiUrl).replace(/\/+$/, "");
        const FORMS_WITH_DOCS_URL = API_ROOT.endsWith("/api")
          ? `${API_ROOT}/forms-with-docs`
          : `${API_ROOT}/api/forms-with-docs`;

        const res = await axios.post(FORMS_WITH_DOCS_URL, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        alert("Tenant updated successfully!");
        const updated = res.data?.form || editTenantData;
        setFormData((prev) =>
          prev.map((t) => (t._id === editTenantData._id ? updated : t))
        );

        closeEditTenantModal();
        return;
      }

      const response = await axios.put(
        `${apiUrl}update/${editTenantData._id}`,
        {
          ...editTenantData,
          firstRentStatus,
          firstRentMonth,
        }
      );
      alert("Tenant updated successfully!");

      // Replace updated tenant in list
      setFormData((prev) =>
        prev.map((t) => (t._id === editTenantData._id ? response.data : t))
      );

      closeEditTenantModal();
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update tenant.");
    }
  };
  const handleShiftSave = async () => {
    if (!shiftTenant || !shiftTargetKey) return;
    if (!shiftEffectiveDate) {
      alert("Please select the shift effective date.");
      return;
    }

    const [roomNo, bedNo] = shiftTargetKey.split("-");

    // Find selected vacant slot to get price/baseRent
    const slot = allVacantSlots.find(
      (s) =>
        String(s.roomNo) === String(roomNo) &&
        String(s.bedNo) === String(bedNo)
    );

    const newBaseRent = slot ? toNum(slot.price) : toNum(shiftTenant.baseRent);
    const agreedRentAmount = newBaseRent;

    try {
      // ⛏️ Uses your existing update endpoint
      const payload = {
        ...shiftTenant,
        roomNo,
        bedNo,
        baseRent: newBaseRent,
        rentAmount: agreedRentAmount,
        shiftEffectiveFrom: shiftEffectiveDate,
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
      setShiftEffectiveDate("");
      alert("Tenant shifted successfully.");
    } catch (err) {
      console.error("Shift room failed:", err);
      const unpaid = err?.response?.data?.unpaidRents;
      const unpaidText = Array.isArray(unpaid) && unpaid.length
        ? `\n\nPending: ${unpaid
            .map((item) => `${item.month} ₹${toNum(item.outstanding).toLocaleString("en-IN")}`)
            .join(", ")}`
        : "";
      alert(
        (err?.response?.data?.message ||
          "Failed to shift tenant. Please try again.") + unpaidText
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

  const paymentISO =
    editRentDate && String(editRentDate).trim()
      ? editRentDate
      : new Date().toISOString().split("T")[0];

  try {
    const monthKey = getEditRentMonthKey(editMonthYM, paymentISO);

    if (!monthKey) {
      alert("Please pick a valid rent month before saving.");
      return;
    }

    const addedAmount = Number(editRentAmount) || 0;
    const existingCell = getMonthCell(editingTenant, editMonthYM.y, editMonthYM.m);
    const existingPaidAmount = Number(existingCell?.amountPaid || 0);
    const totalPaidAmount =
      rentUpdateMode === "replace" ? addedAmount : existingPaidAmount + addedAmount;

    const payload = {
      rentAmount: addedAmount,
      date: paymentISO,
      paymentDate: paymentISO,
      month: monthKey,
      rentUpdateMode,
      paymentMode: editPaymentMode || "Cash",
      note: editNote || "", // ✅ NEW (optional)
    };

    await axios.put(`${apiUrl}form/${editingTenant._id}`, payload);

    setFormData((prev) =>
      prev.map((t) =>
        t._id === editingTenant._id
          ? {
              ...t,
              rents: upsertRentForMonth(t, {
                y: editMonthYM.y,
                m: editMonthYM.m,
                amount: totalPaidAmount,
                date: paymentISO,
                mode: editPaymentMode || "Cash",
                note: editNote || "", // ✅ NEW
              }),
            }
          : t
      )
    );

    await refreshTenants();
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

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/");
  };

 const [pendingRents, setPendingRents] = useState(0);

useEffect(() => {
  if (!formData || !formData.length) {
    setPendingTenants([]);
    setPendingRents(0);
    return;
  }

  const fmt = (y, m) =>
    new Date(y, m, 1).toLocaleString("en-IN", { month: "short", year: "numeric" });

  const list = (formData || [])
    .filter((t) => !t.leaveDate) // ignore left tenants
    .map((t) => {
      // ✅ your existing due calc (same as table logic)
      const due = calculateDue(t.rents, t.joiningDate, t, roomsData);
      if (!due || due <= 0) return null;

      // build "Not paid for ..." based on your month-cells
      const dueMonths = getBillingMonthsUpToNow(t)
        .filter(({ y, m }) => {
          const c = getMonthCell(t, y, m);
          const isRealDue = c?.isPast && (c.label === "Due" || c.label === "Pending");
          return isRealDue && Number(c.outstanding || 0) > 0;
        })
        .map(({ y, m }) => fmt(y, m));

      return {
        tenant: t,
        dueAmount: due,
        reason:
          dueMonths.length > 0
            ? `Not paid for ${dueMonths.join(", ")}`
            : "Rent pending",
      };
    })
    .filter(Boolean)
    .sort(compareRoomBed);

  setPendingTenants(list);
  setPendingRents(list.length);
}, [formData, roomsData]);

const upcomingRentEntries = useMemo(() => {
  if (!formData || !formData.length) return [];

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return (formData || [])
    .filter((t) => !t.leaveDate)
    .flatMap((t) =>
      months
        .map(({ y, m }) => {
          if (y !== currentYear || m > currentMonth) return null;

          const c = getMonthCell(t, y, m);
          if (!c || c.label !== "Upcoming") return null;

          return {
            key: `${t._id}-${y}-${m}`,
            tenant: t,
            roomNo: t.roomNo,
            bedNo: t.bedNo,
            billYear: y,
            billMonth: m,
            monthText: new Date(y, m, 1).toLocaleString("default", {
              month: "long",
              year: "numeric",
            }),
            dateStr:
              c.dateStr ||
              new Date(y, m, 1).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
              }),
            amount: Number(c.expected || expectFromTenant(t, roomsData) || 0),
          };
        })
        .filter(Boolean)
    )
    .sort((a, b) => {
      const roomCmp = compareRoomBed(a, b);
      if (roomCmp !== 0) return roomCmp;
      if (a.billYear !== b.billYear) return a.billYear - b.billYear;
      return a.billMonth - b.billMonth;
    });
}, [formData, roomsData, months]);


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
      className="container-fluid  py-3"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
     
    
      

{/* ///////////////////// */}
     
{/* /////////////////// */}





{showVacantModal && (
  <div
    className="modal d-block"
    tabIndex="-1"
    style={{
      background: "rgba(0,0,0,0.5)",
      position: "fixed",
      inset: 0,
      zIndex: 9999,
    }}
  >
    <div className="modal-dialog modal-lg modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Vacant Beds</h5>
          <button
            type="button"
            className="modal-x-btn"
            onClick={() => setShowVacantModal(false)}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {vacantBedsList.length === 0 ? (
            <p>No vacant beds found.</p>
          ) : (
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Room No</th>
                  <th>Bed No</th>
                  <th>Floor No</th>
                  <th>Category</th>
                  <th>Action</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {vacantBedsList.map((b, i) => (
                  <tr key={i}>
                    <td>{b.roomNo}</td>
                    <td>{b.bedNo}</td>
                    <td>{b.floorNo}</td>
                    <td>{b.category}</td>
                    <td>
                      <button
                        className="btn btn-sm"
                        style={{ backgroundColor: "#3db7b1", color: "white" }}
                        onClick={() => {
                          setShowVacantModal(false);
                          openAddForSlot(b);
                        }}
                      >
                        <FaPlus className="me-1" /> Add Tenant
                      </button>
                    </td>
                    <td>₹{Number(b.price || 0).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowVacantModal(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}




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
 <div className="card ">
  <div className="card-body">

    {/* ⭐ Staff & Other Expenses Button */}
  {/* ----------------- NEW BUTTON ROW ----------------- */}
      <MobileSectionSidebar
        open={showMobileSections}
        items={sectionItems}
        title="Sections"
        onSelect={handleMobileSectionSelect}
        onClose={() => setShowMobileSections(false)}
        onLogout={handleLogout}
      />

   <div className="mobile-section-trigger-wrap">
  <button
    type="button"
    className="mobile-section-trigger"
    onClick={() => setShowMobileSections(true)}
  >
    <FaBars />
    {/* <span>Sections</span> */}
  </button>

  <h3 className="mobile-dynamic-heading">{currentSectionHeading}</h3>
</div>

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
    type="button"
    className="tab-pill tab-pill-back"
    onClick={() => handleNavigation("/maindashboard")}
    title="Back"
  >
    ← Back
  </button>

  <button
  className={`tab-pill ${activeTab === "rent" ? "active" : ""}`}
  onClick={() => setActiveTab("rent")}
>
  💰 Rent
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
    <div className="card  p-3 mb-4 lightbill-card">
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


    <div className="card  p-3 mb-4 lightbill-card">
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

    <div className="card  p-3 mb-4 lightbill-card">
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

<div className="section-title mb-3 section-text1">
  <span className="section-icon section-text1">
    <FaThLarge />
  </span>
  <span className="section-text section-text1 ">
    Bed-wise Rent and Deposit Tracker 
  </span>
</div>
<RentHeaderBar
  title="Rent & Deposit Tracker"
  notificationSlot={
    <NotificationBell
      apiUrl={apiUrl}
      onApproved={handleApprovedFromBell}
      onLeaveApproved={({ tenantId, leaveDateISO }) => {
        setLeaveDates((prev) => ({
          ...prev,
          [tenantId]: (leaveDateISO || new Date().toISOString()).slice(0, 10),
        }));
        refreshTenants();
      }}
    />
  }
  selectedYear={selectedYear}
  years={years}
  searchText={searchText}
  onYearChange={handleRentYearChange}
  onSearchChange={handleRentSearchChange}
  onManageRooms={() => navigate("/roommanager")}
  onAddTenant={openAddModal}
  onDownloadExcel={handleDownloadExcel}
  onOpenHistory={() => setShowLeavedHistoryView((prev) => !prev)}
  isHistoryView={showLeavedHistoryView}
/>

{/* Rent-only summary cards */}
<RentSummaryCards
  totalBeds={roomsData.reduce((sum, room) => sum + (room.beds?.length || 0), 0)}
  occupiedBeds={formData.filter((d) => !hasLeaveDatePassed(d?.leaveDate)).length}
  vacantBeds={vacantCount}
  pendingRents={pendingRents}
  upcomingRents={upcomingRentEntries.length}
  onVacantClick={() => setShowVacantModal(true)}
  onPendingClick={() => setShowPendingModal(true)}
  onUpcomingClick={() => setShowUpcomingModal(true)}
/>

  {showMobileVacantBeds ? (
    <VacantBedScreen
      beds={vacantBedsList}
      onAddTenant={openAddForSlot}
      onBack={closeMobileVacantBeds}
    />
  ) : showMobileLeavedTenants ? (
    <LeavedTenantScreen
      tenants={filteredDeletedData}
      onOpenHistory={showRentHistory}
      onUndo={handleUndoClick}
      onDownload={handleDownloadForm}
      onBack={closeMobileLeavedTenants}
    />
  ) : showMobileTenantProfile && mobileSelectedTenant ? (
    <RentTenantProfileView
      tenant={mobileSelectedTenant}
      visibleMonths={visibleMonths}
      getTenantPhotoMeta={getTenantPhotoMetaForMobile}
      photoTransformStyle={photoTransformStyle}
      roomColorStyleMap={roomColorStyleMap}
      getMonthCell={getMonthCell}
      getCycleRangeStr={getCycleRangeStr}
      onPrevMonths={goLeft}
      onNextMonths={goRight}
      canPrevMonths={canLeft}
      canNextMonths={canRight}
      onBack={closeMobileTenantProfile}
      onOpenDetails={openDesktopTenantDetails}
      onOpenAdmissionForm={openAdmissionForm}
      onEditPhoto={openPhotoEditor}
      onOpenHistory={showRentHistory}
      onEditCurrentMonth={openCurrentMonthEdit}
      onEditTenant={openTenantEditModal}
      onDeleteTenant={openTenantDeleteModal}
      onEditMonth={(tenant, month) =>
        month ? openEditForTenantMonth(tenant._id, month.m, month.y) : null
      }
      onShiftTenant={openShiftTenantModal}
      onLeave={handleLeave}
      // onHoliday={handleHoliday}
      onOpenLeavedTenants={openMobileLeavedTenants}
      onOpenVacantBeds={openMobileVacantBeds}
      onManageRooms={() => navigate("/roommanager")}
      onAddTenant={openAddModal}
      onDownloadExcel={handleDownloadExcel}
    />
  ) : (
    <>
      <RentTenantListView
        visibleTenants={visibleTenants}
        visibleMonths={visibleMonths}
        groupedRooms={groupedRooms}
        roomsData={roomsData}
        selectedYear={selectedYear}
        years={years}
        searchText={searchText}
        onYearChange={handleRentYearChange}
        onSearchChange={handleRentSearchChange}
        getTenantPhotoMeta={getTenantPhotoMetaForMobile}
        photoTransformStyle={photoTransformStyle}
        roomColorStyleMap={roomColorStyleMap}
        getMonthCell={getMonthCell}
        getCycleRangeStr={getCycleRangeStr}
        onPrevMonths={goLeft}
        onNextMonths={goRight}
        canPrevMonths={canLeft}
        canNextMonths={canRight}
        onOpenTenant={openTenantDetails}
        onOpenHistory={showRentHistory}
        onEditMonth={(tenant, month) =>
          month ? openEditForTenantMonth(tenant._id, month.m, month.y) : null
        }
        onShiftTenant={openShiftTenantModal}
        onOpenDueMonths={openDueMonthsModal}
        onOpenAdmissionForm={openAdmissionForm}
        onEditPhoto={openPhotoEditor}
        onManageRooms={() => navigate("/roommanager")}
        onAddTenant={openAddModal}
        onDownloadExcel={handleDownloadExcel}
        onOpenLeavedTenants={openMobileLeavedTenants}
        onOpenVacantBeds={openMobileVacantBeds}
        onAddTenantForSlot={openAddForSlot}
        onMarkLeave={handleLeave}
      />
    </>
  )}

  <div className="desktop-rent-tables-group">
  {!showLeavedHistoryView && (
  <div className="desktop-rent-table-group">
  <div className="rent-table-desktop d-flex align-items-center justify-content-center">
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
            <table className="table table-bordered align-middle renttable">

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
      Sr{renderSortIcon("sr")}
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
        className="text-center rent-month-header"
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
                {/* Occupied + Vacant rows (room-wise flow) */}
                {combinedRows
                  ? combinedRows.map((row, rowIdx) => {
                      const rowNumber = rowIdx + 1;
                      const currentRoomNo =
                        row.type === "tenant" ? row.tenant?.roomNo : row.slot?.roomNo;
                      const nextRow = combinedRows[rowIdx + 1];
                      const nextRoomNo = nextRow
                        ? nextRow.type === "tenant"
                          ? nextRow.tenant?.roomNo
                          : nextRow.slot?.roomNo
                        : null;
                      const isRoomEnd =
                        String(nextRoomNo ?? "") !== String(currentRoomNo ?? "");
                      const rowClassName = isRoomEnd ? "room-separator" : undefined;
                      if (row.type === "tenant") {
                        const tenant = row.tenant;
                 const dueAmount = calculateDue(
  tenant.rents,
  tenant.joiningDate,
  tenant,
  roomsData
  
);

                  return (
                    <tr key={tenant._id} className={rowClassName}>
                      {/* Sr */}
                   <td className="text-muted text-center">
  {rowNumber}
</td>


                      {/* Name + meta */}
  {/* Name + meta */}
              <td>
  <div className="tenant-cell">
    {/* Shift Button */}
    <button
      className="btn btn-sm shift-btn mb-1"
      onClick={(e) => {
        e.stopPropagation();
        openShiftTenantModal(tenant);
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
      style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}
    >
      {/* PHOTO (only tenant photo) */}
      {renderTenantPhoto(tenant)}

      {/* TEXT INFO */}
      <div>
        <div className="tenant-name">{tenant.name}</div>
<div className="tenant-meta"> Joining Date:
          {tenant.joiningDate
            ? new Date(tenant.joiningDate).toLocaleDateString("en-GB")
            : "—"}
        </div>
        <div className="tenant-meta">
          Deposit: ₹{Number(tenant.depositAmount || 0).toLocaleString("en-IN")}
        </div>

        <div className="tenant-meta">{tenant.phoneNo}</div>
        {tenant.firstRentStatus === "ADVANCE_PAID" ? (
          <div className="mt-1">
            <span className="badge bg-info text-dark">Advance paid</span>
          </div>
        ) : null}
        
        <span className="room-pill">
  {tenant.roomNo || "—"}
  {((tenant.bedNo || tenant.bed?.bedNo) && ` - ${tenant.bedNo || tenant.bed?.bedNo}`) || ""}
</span>

      </div>
    </div>
  </div>
</td>




                      {/* Month cells */}
                 {visibleMonths.map((m, i) => {
  const c = getMonthCell(tenant, m.y, m.m);
  const extraNum = Number(c.extra || 0);

  // ✅ show rent starting from NEXT month (first due month)
 const firstBillYM = getFirstBillYM(tenant);
const cellYM = m.y * 12 + m.m;

if (cellYM < firstBillYM) {
  return (
    <td
      key={`${tenant._id}-${m.y}-${m.m}-${i}`}
      className={`text-center text-muted rent-month-window-cell ${i === 0 ? "has-prev-nav" : ""} ${
        i === visibleMonths.length - 1 ? "has-next-nav" : ""
      }`}
    >
      {renderMonthWindowNav(i)}
      —
    </td>
  );
}



  // ✅ cycle range like: 15 Jan - 15 Feb
const cycleIndex = cellYM - firstBillYM;
const cycleRangeStr = getCycleRangeStr(tenant, cycleIndex);

  return (
    <td
      key={`${tenant._id}-${m.y}-${m.m}-${i}`}
      className={`text-center rent-month-window-cell ${i === 0 ? "has-prev-nav" : ""} ${
        i === visibleMonths.length - 1 ? "has-next-nav" : ""
      }`}
    >
      {renderMonthWindowNav(i)}
      <div
        style={{ cursor: "pointer" }}
        onClick={() => openEditForTenantMonth(tenant._id, m.m, m.y)}
        title="Click to edit this tenant's rent"
      >
        {/* ✅ Status badge inline (Paid date inside badge) */}
        {c.label ? (
          <span
            className="badge rounded-pill px-3 py-2 d-inline-flex flex-column align-items-center"
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
                  : c.label === "Pending"
                  ? "#ffc107"
                  : "#e9ecef",
              color: c.label === "Paid" || c.label === "Due" ? "#fff" : "#111",
              boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
              lineHeight: 1.05,
            }}
          >
            <span>{c.label}</span>

            {/* ✅ Paid date INSIDE green badge */}
          {/* ✅ Date INSIDE badge for Paid / Due / Upcoming */}
{(c.label === "Paid" || c.label === "Due" || c.label === "Upcoming" || c.label === "Pending") &&
  c.dateStr && (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        opacity: 0.95,
        marginTop: 2,
      }}
    >
      {c.dateStr}
    </span>
  )}

          </span>
        ) : (
          <span className="text-muted">—</span>
        )}

        {/* ✅ Cycle range below badge (15 Jan - 15 Feb) */}
        <div className="small text-muted mt-1" style={{ lineHeight: 1 }}>
          {cycleRangeStr}
        </div>

        {/* 1) PAID */}
        {c.label === "Paid" && (
          <div className="small mt-1 fw-semibold" style={{ lineHeight: 1 }}>
            ₹{Number(c.amountPaid || 0).toLocaleString("en-IN")}
          </div>
        )}

        {/* 2) PEND (partial / balance) */}
        {c.label === "Pending" && (
          <div className="small mt-1 fw-semibold" style={{ lineHeight: 1 }}>
            ₹{Number(c.amountPaid || 0).toLocaleString("en-IN")}
            <span className="text-muted" style={{ fontWeight: 600 }}>
              {" "}
              / ₹{Number(c.expected || 0).toLocaleString("en-IN")}
            </span>

            {Number(c.outstanding || 0) > 0 && (
              <div
                className={c.isPast ? "text-danger" : ""}
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
            className="small mt-1 fw-semibold "
            style={{ lineHeight: 1, fontWeight: 800 }}
          >
            ₹
            {Number(c.expected || 0).toLocaleString("en-IN")}
          </div>
        )}

        {/* 4) DUE (past only) ✅ Always red */}
        {c.label === "Due" && (
          <div
            className="small mt-1 fw-semibold "
            style={{ lineHeight: 1, fontWeight: 800 }}
          >
            ₹
            {Number(c.expected || 0).toLocaleString("en-IN")}
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

            {/* 📝 NOTE */}
            {c.note && (
              <div
                className="small text-muted mt-1"
                style={{ lineHeight: 1.1, fontStyle: "italic" }}
              >
                📝 {c.note}
              </div>
            )}
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
    openDueMonthsModal(tenant);
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
  const dueList = getAllPendingMonths(tenant);
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
      setEditSelfAadharFile(null);
      setEditParentAadharFile(null);
      setEditPhotoFile(null);
      setEditDocMsg("");
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
                    }

                      if (row.type === "vacant") {
                        const slot = row.slot;
                        const key = `${slot.roomNo}-${slot.bedNo}`;
                        return (
                          <tr key={`vacant-${key}`} className={rowClassName}>
                      <td className="text-muted">{rowNumber}</td>
                      <td>
                        <div>
                          <div className="fw-semibold text-danger " >Empty</div>
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
    className={`text-center text-muted rent-month-window-cell ${idx === 0 ? "has-prev-nav" : ""} ${
      idx === visibleMonths.length - 1 ? "has-next-nav" : ""
    }`}
  >
    {renderMonthWindowNav(idx)}
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
                          onClick={() => openAddForSlot(slot)}
                        >
                          <FaPlus className="me-1" /> Add Tenant
                        </button>
                      </td>
                    </tr>
                        );
                      }
                      return null;
                    })
                  : visibleTenants.map((tenant, rowIdx) => {
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
                              {/* Shift Button */}
                              <button
                                className="btn btn-sm shift-btn mb-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openShiftTenantModal(tenant);
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
                                style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}
                              >
                                  {/* PHOTO (only tenant photo) */}
                                  {renderTenantPhoto(tenant)}

                                {/* TEXT INFO */}
                                <div>
                                  <div className="tenant-name">{tenant.name}</div>

                                  <div className="tenant-meta">
                                    Deposit: ₹{Number(tenant.depositAmount || 0).toLocaleString("en-IN")}
                                  </div>

                                  <div className="tenant-meta">{tenant.phoneNo}</div>
                                  {tenant.firstRentStatus === "ADVANCE_PAID" ? (
                                    <div className="mt-1">
                                      <span className="badge bg-info text-dark">Advance paid</span>
                                    </div>
                                  ) : null}

                                  <span className="room-pill">
                                    {tenant.roomNo || "—"}
                                    {((tenant.bedNo || tenant.bed?.bedNo) && ` - ${tenant.bedNo || tenant.bed?.bedNo}`) || ""}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Month cells */}
                          {visibleMonths.map((m, i) => {
                            const c = getMonthCell(tenant, m.y, m.m);
                            const extraNum = Number(c.extra || 0);

                            const firstBillYM = getFirstBillYM(tenant);
                            const cellYM = m.y * 12 + m.m;

                            if (cellYM < firstBillYM) {
                              return (
                                <td
                                  key={`${tenant._id}-${m.y}-${m.m}-${i}`}
                                  className={`text-center text-muted rent-month-window-cell ${i === 0 ? "has-prev-nav" : ""} ${
                                    i === visibleMonths.length - 1 ? "has-next-nav" : ""
                                  }`}
                                >
                                  {renderMonthWindowNav(i)}
                                  —
                                </td>
                              );
                            }

                            const cycleIndex = cellYM - firstBillYM;
                            const cycleRangeStr = getCycleRangeStr(tenant, cycleIndex);

                            return (
                              <td
                                key={`${tenant._id}-${m.y}-${m.m}-${i}`}
                                className={`text-center rent-month-window-cell ${i === 0 ? "has-prev-nav" : ""} ${
                                  i === visibleMonths.length - 1 ? "has-next-nav" : ""
                                }`}
                              >
                                {renderMonthWindowNav(i)}
                                <div
                                  style={{ cursor: "pointer" }}
                                  onClick={() => openEditForTenantMonth(tenant._id, m.m, m.y)}
                                  title="Click to edit this tenant's rent"
                                >
                                  {c.label ? (
                                    <span
                                      className="badge rounded-pill px-3 py-2 d-inline-flex flex-column align-items-center"
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
                                            : c.label === "Pending"
                                            ? "#ffc107"
                                            : "#e9ecef",
                                        color: c.label === "Paid" || c.label === "Due" ? "#fff" : "#111",
                                        boxShadow: "0 6px 14px rgba(0,0,0,0.12)",
                                        lineHeight: 1.05,
                                      }}
                                    >
                                      <span>{c.label}</span>
                                      {(c.label === "Paid" || c.label === "Due" || c.label === "Upcoming" || c.label === "Pending") &&
                                        c.dateStr && (
                                          <span
                                            style={{
                                              fontSize: 11,
                                              fontWeight: 700,
                                              opacity: 0.95,
                                              marginTop: 2,
                                            }}
                                          >
                                            {c.dateStr}
                                          </span>
                                        )}
                                    </span>
                                  ) : (
                                    <span className="text-muted">—</span>
                                  )}

                                  <div className="small text-muted mt-1" style={{ lineHeight: 1 }}>
                                    {cycleRangeStr}
                                  </div>

                                  {c.label === "Paid" && (
                                    <div className="small mt-1 fw-semibold" style={{ lineHeight: 1 }}>
                                      ₹{Number(c.amountPaid || 0).toLocaleString("en-IN")}
                                    </div>
                                  )}

                                  {c.label === "Pending" && (
                                    <div className="small mt-1 fw-semibold" style={{ lineHeight: 1 }}>
                                      ₹{Number(c.amountPaid || 0).toLocaleString("en-IN")}
                                      <span className="text-muted" style={{ fontWeight: 600 }}>
                                        {" "}
                                        / ₹{Number(c.expected || 0).toLocaleString("en-IN")}
                                      </span>

                                      {Number(c.outstanding || 0) > 0 && (
                                        <div
                                          className={c.isPast ? "text-danger" : ""}
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

                                  {c.label === "Upcoming" && (
                                    <div
                                      className="small mt-1 fw-semibold "
                                      style={{ lineHeight: 1, fontWeight: 800 }}
                                    >
                                      ₹
                                      {Number(c.expected || 0).toLocaleString("en-IN")}
                                    </div>
                                  )}

                                  {c.label === "Due" && (
                                    <div
                                      className="small mt-1 fw-semibold "
                                      style={{ lineHeight: 1, fontWeight: 800 }}
                                    >
                                      ₹
                                      {Number(c.expected || 0).toLocaleString("en-IN")}
                                    </div>
                                  )}

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

                                      {c.note && (
                                        <div
                                          className="small text-muted mt-1"
                                          style={{ lineHeight: 1.1, fontStyle: "italic" }}
                                        >
                                          📝 {c.note}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}

                          <td
                            style={{
                              cursor: "pointer",
                              color: dueAmount > 0 ? "red" : "inherit",
                            }}
                            onClick={() => {
                              openDueMonthsModal(tenant);
                            }}
                          >
                            ₹{dueAmount.toLocaleString("en-IN")}
                          </td>

                          <td>
                            <button
                              className="action-btn action-edit"
                              onClick={() => {
                                setEditTenantData(tenant);
                                setEditSelfAadharFile(null);
                                setEditParentAadharFile(null);
                                setEditPhotoFile(null);
                                setEditDocMsg("");
                                setShowEditModal(true);
                              }}
                            >
                              <FaEdit />
                            </button>

                            <button
                              className="action-btn action-leave"
                              onClick={() => handleLeave(tenant)}
                            >
                              <FaSignOutAlt />
                            </button>

                            {leaveDates[tenant._id] && isTodayOrFuture(leaveDates[tenant._id]) && (
                              <button
                                className="btn btn-sm btn-warning me-2"
                                onClick={() => handleCancelLeave(tenant._id)}
                                title={`Cancel scheduled leave (${new Date(leaveDates[tenant._id]).toLocaleDateString("en-GB")})`}
                              >
                                <FaUndo />
                              </button>
                            )}

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
              </tbody>
            </table>
</div>
</div>
  )}

  {!showLeavedHistoryView && filteredDeletedData.length > 0 && (
    <div className="mt-5 leaved-tenants-section">
      <h5 style={{ fontWeight: "bold" }} className="leavedtenant">
        Leaved Tenants
      </h5>

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
            leaveDate.setHours(0, 0, 0, 0);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const diffInDays =
              (today.getTime() - leaveDate.getTime()) /
              (1000 * 60 * 60 * 24);

            const isUndoAllowed = diffInDays >= 0 && diffInDays <= 30;

            return (
              <tr key={tenant._id || index}>
                <td>
                  {tenant.roomNo}
                  <div className="text-muted small">bed {tenant.bedNo}</div>
                </td>

                <td
                  style={{ cursor: "pointer" }}
                  onClick={() => showRentHistory(tenant)}
                >
                  {tenant.name}
                </td>

                <td>{new Date(tenant.joiningDate).toLocaleDateString()}</td>

                <td>{leaveDate.toLocaleDateString()}</td>

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

  {showLeavedHistoryView && (
    <div className="desktop-rent-table-group leaved-tenants-section">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 style={{ fontWeight: "bold" }} className="leavedtenant mb-0">
          Leaved Tenant History
        </h5>
        <span className="text-muted small">{filteredDeletedData.length} tenants</span>
      </div>

      {filteredDeletedData.length > 0 ? (
        <div className="table-responsive rent-table-wrapper">
          <table className="table table-bordered align-middle renttable">
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Room / Bed</th>
                    <th>Dates</th>
                    <th>Contact</th>
                    <th>Deposit</th>
                    <th>All Rents / Status</th>
                    <th>Documents</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeletedData.map((tenant, index) => {
                    const docs = Array.isArray(tenant.documents) ? tenant.documents : [];
                    const rents = Array.isArray(tenant.rents) ? tenant.rents : [];
                    const totalPaid = rents.reduce(
                      (sum, rent) => sum + (Number(rent?.rentAmount) || 0),
                      0
                    );
                    const leaveDate = tenant.leaveDate ? new Date(tenant.leaveDate) : null;
                    const joiningDate = tenant.joiningDate ? new Date(tenant.joiningDate) : null;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (leaveDate && !isNaN(leaveDate)) leaveDate.setHours(0, 0, 0, 0);
                    const diffInDays = leaveDate && !isNaN(leaveDate)
                      ? (today.getTime() - leaveDate.getTime()) / (1000 * 60 * 60 * 24)
                      : null;
                    const isUndoAllowed = diffInDays != null && diffInDays >= 0 && diffInDays <= 30;
                    const sortedRents = [...rents].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

                    return (
                      <tr key={tenant._id || index}>
                        <td
                          style={{ cursor: "pointer" }}
                          role="button"
                          tabIndex={0}
                          title="Open tenant details"
                          onClick={() => openAdmissionForm(tenant)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") openAdmissionForm(tenant);
                          }}
                        >
                          <div className="fw-semibold text-primary">{tenant.name || "-"}</div>
                        </td>
                        <td>
                          <div>Room {tenant.roomNo || "-"}</div>
                          <div className="text-muted small">Bed {tenant.bedNo || "-"}</div>
                          {tenant.category && (
                            <div className="text-muted small">{tenant.category}</div>
                          )}
                        </td>
                        <td>
                          <div>
                            Joining:{" "}
                            {joiningDate && !isNaN(joiningDate)
                              ? joiningDate.toLocaleDateString("en-IN")
                              : "-"}
                          </div>
                          <div className="text-danger">
                            Leave:{" "}
                            {leaveDate && !isNaN(leaveDate)
                              ? leaveDate.toLocaleDateString("en-IN")
                              : "-"}
                          </div>
                        </td>
                        <td>
                          <div>{tenant.phoneNo || "-"}</div>
                          {tenant.relative1Phone && (
                            <div className="text-muted small">
                              Relative: {tenant.relative1Phone}
                            </div>
                          )}
                        </td>
                        <td>
                          Rs. {Number(tenant.depositAmount || 0).toLocaleString("en-IN")}
                          {tenant.leaveSettlement?.refundableDeposit != null && (
                            <div className="text-muted small">
                              Refund: Rs.{" "}
                              {Number(tenant.leaveSettlement.refundableDeposit || 0).toLocaleString("en-IN")}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="fw-semibold">
                            Total Paid: Rs. {totalPaid.toLocaleString("en-IN")}
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary mt-2"
                            onClick={() => showRentHistory(tenant)}
                            disabled={sortedRents.length === 0}
                          >
                            View Rents
                          </button>
                          {sortedRents.length === 0 && (
                            <div className="text-muted small mt-1">No rent payments saved.</div>
                          )}
                        </td>
                        <td>
                          <div>{docs.length} documents</div>
                          {docs.length > 0 && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary mt-1"
                              onClick={() => setHistoryDocsTenant(tenant)}
                            >
                              View Documents
                            </button>
                          )}
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-2">
                            {isUndoAllowed && (
                              <button
                                type="button"
                                className="btn btn-sm text-white d-inline-flex align-items-center justify-content-center"
                                style={{ backgroundColor: "#198754", width: 32, height: 32 }}
                                onClick={() => handleUndoClick(tenant._id)}
                                title="Undo leave"
                              >
                                <FaUndo />
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-sm text-white d-inline-flex align-items-center justify-content-center"
                              style={{ backgroundColor: "#2d6eef", width: 32, height: 32 }}
                              onClick={() => handleDownloadForm(tenant)}
                              title="Download Excel"
                            >
                              <FaDownload />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
        </div>
      ) : (
        <div className="text-muted">No leaved tenant history found.</div>
      )}
    </div>
  )}

  </div>

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
  className="btn-close p-0"
  onClick={() => setShowFormModal(false)}
>
  x
</button>


          </div>

          <div className="modal-body">
            {formTenant ? <FormDownload formData={formTenant} /> : null}
          </div>
        </div>
      </div>
    </div>
  </>
)}

{historyDocsTenant && (
  <div
    className="modal d-block"
    tabIndex="-1"
    style={{ backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1060 }}
  >
    <div className="modal-dialog modal-lg modal-dialog-scrollable">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">
            Documents - {historyDocsTenant.name || "Tenant"}
          </h5>
          <button
            type="button"
            className="btn-close p-0"
            onClick={() => setHistoryDocsTenant(null)}
          >
            x
          </button>
        </div>
        <div className="modal-body">
          {Array.isArray(historyDocsTenant.documents) && historyDocsTenant.documents.length > 0 ? (
            <div className="d-grid gap-2">
              {historyDocsTenant.documents.map((doc, index) => {
                const href = docHrefSafe(doc);
                const label = doc.relation || doc.fileName || `Document ${index + 1}`;
                return (
                  <div
                    key={`${historyDocsTenant._id}-history-doc-${index}`}
                    className="border rounded p-2"
                  >
                    <div className="fw-semibold">{index + 1}. {label}</div>
                    <div className="text-muted small">
                      {doc.fileName || doc.contentType || "Uploaded document"}
                    </div>
                    {href ? (
                      <div className="mt-2 d-flex flex-wrap gap-2">
                        <a
                          className="btn btn-sm btn-outline-primary"
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Document
                        </a>
                        {/* <a
                          className="small align-self-center"
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {href}
                        </a> */}
                      </div>
                    ) : (
                      <div className="text-muted small mt-2">No document link available.</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-muted">No documents uploaded for this tenant.</div>
          )}
        </div>
      </div>
    </div>
  </div>
)}
 {/* add tenant modal */}
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
            // onClick={() => setShowAddModal(false)}
           onClick={closeAddTenantModal}

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

              {/* Phone */}
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

              {/* Address Section */}
              <div className="col-12 col-md-6">
                <label className="form-label">Pincode</label>
                <input
                  type="text"
                  className="form-control"
                  value={newTenant.pincode || ""}
                  onChange={(e) =>
                    setNewTenant({
                      ...newTenant,
                      pincode: e.target.value,
                    })
                  }
                  placeholder="6-digit pincode"
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-control"
                  value={newTenant.city || ""}
                  onChange={(e) =>
                    setNewTenant({
                      ...newTenant,
                      city: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="form-control"
                  value={newTenant.state || ""}
                  onChange={(e) =>
                    setNewTenant({
                      ...newTenant,
                      state: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Local Address</label>
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
                  placeholder="House, Street, Area"
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">House No</label>
                <input
                  type="text"
                  className="form-control"
                  value={newTenant.houseNo || ""}
                  onChange={(e) =>
                    setNewTenant({
                      ...newTenant,
                      houseNo: e.target.value,
                    })
                  }
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Nearby Place</label>
                <input
                  type="text"
                  className="form-control"
                  value={newTenant.nearbyPlace || ""}
                  onChange={(e) =>
                    setNewTenant({
                      ...newTenant,
                      nearbyPlace: e.target.value,
                    })
                  }
                />
              </div>

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

{/* Bed No */}
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

      // OTHER (add new bed...)
      if (bedNo === "__other__") {
        setNewTenant((prev) => ({
          ...prev,
          bedNo: "__other__",
          bedPrice: "",           // ✅ NEW
          baseRent: "",
          rentAmount: "",
          __priceMode: "current", // ✅ NEW
          __newBedPriceEdit: "",  // ✅ NEW
          __priceMsg: "",         // ✅ NEW
          __savingPrice: false,   // ✅ NEW

          newBedNo: prev.newBedNo || "",
          newBedPrice: prev.newBedPrice || "",
          newBedCategory: prev.newBedCategory || "",
          __bedMsg: "",
          __savingBed: false,
        }));
        return;
      }

      const selectedRoom = roomsData.find(
        (r) => String(r._id) === String(newTenant.roomId)
      );
      const selectedBed = selectedRoom?.beds?.find(
        (b) => String(b.bedNo) === String(bedNo)
      );

      const price = selectedBed?.price ?? "";

      setNewTenant((prev) => ({
        ...prev,
        bedNo,

        bedPrice: price,         // ✅ NEW (store separately)
        baseRent: price,
        rentAmount: price,       // tenant rent defaults to bed price

        __priceMode: "current",  // ✅ NEW
        __newBedPriceEdit: "",   // ✅ NEW
        __priceMsg: "",          // ✅ NEW
        __savingPrice: false,    // ✅ NEW

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
        const selectedRoom = roomsData.find(
          (r) => String(r._id) === String(newTenant.roomId)
        );
        return !occupiedBeds.has(occKey(selectedRoom?.roomNo, bed.bedNo));
      })
      .map((bed) => (
        <option
          key={`bed-${newTenant.roomId}-${bed.bedNo}`}
          value={bed.bedNo}
        >
          {/* ✅ NO PRICE HERE */}
          {bed.bedNo} - {bed.bedCategory || "—"}
        </option>
      ))}

    {!!newTenant.roomId && (
      <option value="__other__">Other (add new bed…)</option>
    )}
  </select>
</div>

{/* ✅ NEW: Bed Price field (separate + update option) */}
<div className="col-12 col-md-12">
  <label className="form-label">
    Bed Price (Monthly Rent) <span className="text-danger">*</span>
  </label>

  {/* ✅ make select + input in same row */}
  <div className="row g-2 align-items-start">
    {/* LEFT: select */}
    <div className="col-12 col-md-6">
      <select
        className="form-select"
        value={newTenant.__priceMode || "current"}
        disabled={
          !newTenant.roomId ||
          !newTenant.bedNo ||
          newTenant.bedNo === "__other__"
        }
        onChange={(e) => {
          const mode = e.target.value;
          setNewTenant((prev) => ({
            ...prev,
            __priceMode: mode,
            __priceMsg: "",
            __newBedPriceEdit:
              mode === "update"
                ? String(prev.bedPrice ?? prev.rentAmount ?? "")
                : "",
          }));
        }}
      >
        <option value="current">
          ₹{Number(newTenant.bedPrice || 0).toLocaleString("en-IN")} (current)
        </option>
        <option value="update">Update bed price…</option>
      </select>
    </div>

    {/* RIGHT: input */}
    <div className="col-12 col-md-6">
      {(newTenant.__priceMode || "current") === "current" ? (
        <input
          type="number"
          className="form-control mt-0"
          value={newTenant.bedPrice ?? ""}
          readOnly 
        />
      ) : (
        <input
          type="number"
          className="form-control mt-0"
          value={newTenant.__newBedPriceEdit ?? ""}
          onChange={(e) =>
            setNewTenant((prev) => ({
              ...prev,
              __newBedPriceEdit: e.target.value,
              __priceMsg: "",
            }))
          }
          min="0"
          placeholder="Enter new bed price"
        />
      )}
    </div>

    {/* Buttons + message BELOW (full width) only in update mode */}
    {newTenant.__priceMode === "update" && (
      <div className="col-12">
        <div className="d-flex gap-2 mt-2 flex-wrap">
          <button
            type="button"
            className="btn btn-primary"
            disabled={
              newTenant.__savingPrice ||
              !newTenant.roomId ||
              !newTenant.bedNo ||
              newTenant.bedNo === "__other__" ||
              Number(newTenant.__newBedPriceEdit) < 0 ||
              Number.isNaN(Number(newTenant.__newBedPriceEdit))
            }
            onClick={async () => {
              try {
                const roomId = newTenant.roomId;
                const bedNo = newTenant.bedNo;
                const priceNum = Number(newTenant.__newBedPriceEdit);

                setNewTenant((prev) => ({
                  ...prev,
                  __savingPrice: true,
                  __priceMsg: "",
                }));

                await axios.patch(`${ROOMS_API}/${roomId}/bed/${bedNo}`, {
                  price: priceNum,
                });

                setRoomsData((prev) =>
                  prev.map((r) => {
                    if (String(r._id) !== String(roomId)) return r;
                    return {
                      ...r,
                      beds: (r.beds || []).map((b) =>
                        String(b.bedNo) === String(bedNo)
                          ? { ...b, price: priceNum }
                          : b
                      ),
                    };
                  })
                );

                setNewTenant((prev) => ({
                  ...prev,
                  bedPrice: priceNum,
                  baseRent: priceNum,
                  rentAmount: priceNum,
                  __priceMode: "current",
                  __savingPrice: false,
                  __priceMsg: "✔ Bed price updated",
                }));
              } catch (err) {
                console.error(err);
                setNewTenant((prev) => ({
                  ...prev,
                  __savingPrice: false,
                  __priceMsg:
                    err.response?.data?.message || "Could not update bed price.",
                }));
              }
            }}
          >
            {newTenant.__savingPrice ? "Saving…" : "Save Price"}
          </button>

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() =>
              setNewTenant((prev) => ({
                ...prev,
                __priceMode: "current",
                __newBedPriceEdit: "",
                __priceMsg: "",
                __savingPrice: false,
              }))
            }
          >
            Cancel
          </button>
        </div>

        {newTenant.__priceMsg ? (
          <small
            className={`d-block mt-2 ${
              newTenant.__priceMsg.startsWith("✔")
                ? "text-success"
                : "text-danger"
            }`}
          >
            {newTenant.__priceMsg}
          </small>
        ) : null}
      </div>
    )}
  </div>
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
            (Number(newTenant.newBedPrice) < 0 ||
              Number.isNaN(Number(newTenant.newBedPrice))) && (
              <small className="text-danger">Enter a non-negative number</small>
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
                Number.isNaN(Number(newTenant.newBedPrice))))
          }
          onClick={async () => {
            const roomId = newTenant.roomId;
            const bedNoToAdd = (newTenant.newBedNo || "").trim();
            const bedCategoryToAdd = (newTenant.newBedCategory || "").trim();
            const priceStr = newTenant.newBedPrice;

            const priceProvided = priceStr !== "" && priceStr != null;
            const priceNum = priceProvided ? Number(priceStr) : null;

            const roomIdx = roomsData.findIndex(
              (r) => String(r._id) === String(roomId)
            );
            if (roomIdx === -1) {
              setNewTenant((prev) => ({ ...prev, __bedMsg: "Room not found." }));
              return;
            }

            const exists = roomsData[roomIdx].beds?.some(
              (b) =>
                String(b.bedNo).trim().toLowerCase() === bedNoToAdd.toLowerCase()
            );
            if (exists) {
              setNewTenant((prev) => ({
                ...prev,
                __bedMsg: "A bed with this number already exists in this room.",
              }));
              return;
            }

            try {
              setNewTenant((prev) => ({
                ...prev,
                __savingBed: true,
                __bedMsg: "",
              }));

              const payload = { bedNo: bedNoToAdd, bedCategory: bedCategoryToAdd };
              if (priceProvided) payload.price = priceNum;

              await axios.post(`${ROOMS_API}/${roomId}/bed`, payload);

              setRoomsData((prev) => {
                const copy = [...prev];
                const r = { ...copy[roomIdx] };
                r.beds = [
                  ...(r.beds || []),
                  {
                    bedNo: bedNoToAdd,
                    bedCategory: bedCategoryToAdd,
                    ...(priceProvided ? { price: priceNum } : {}),
                  },
                ];
                copy[roomIdx] = r;
                return copy;
              });

              setNewTenant((prev) => ({
                ...prev,
                bedNo: bedNoToAdd,
                bedPrice: priceProvided ? priceNum : "", // ✅ NEW
                baseRent: priceProvided ? priceNum : "",
                rentAmount: priceProvided ? priceNum : "",
                __priceMode: "current",                  // ✅ NEW
                __newBedPriceEdit: "",                   // ✅ NEW
                __priceMsg: "",                          // ✅ NEW
                __savingPrice: false,                    // ✅ NEW

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
              bedPrice: "",          // ✅ NEW
              __priceMode: "current",// ✅ NEW
              __newBedPriceEdit: "", // ✅ NEW
              __priceMsg: "",        // ✅ NEW
              __savingPrice: false,  // ✅ NEW

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
<div className="col-12 col-md-6">
  <label className="form-label fw-semibold">
    Rent at Joining
  </label>

  <div className="btn-group w-100" role="radiogroup" aria-label="Rent at Joining">
    <input
      type="radio"
      className="btn-check"
      name="firstRentStatus"
      id="firstRentStatusAdvance"
      checked={firstRentStatusSelection === "ADVANCE_PAID"}
      onChange={() => syncFirstRentStatusForAdd("ADVANCE_PAID")}
    />
    <label
      className={`btn flex-fill py-2 text-center ${
        firstRentStatusSelection === "ADVANCE_PAID"
          ? "btn-primary text-white"
          : "btn-outline-primary"
      }`}
      htmlFor="firstRentStatusAdvance"
    >
      <span className="d-block">Paid at Joining</span>
      <span className="d-block small">(Advance)</span>
    </label>

    <input
      type="radio"
      className="btn-check"
      name="firstRentStatus"
      id="firstRentStatusNormal"
      checked={firstRentStatusSelection === "NOT_PAID"}
      onChange={() => syncFirstRentStatusForAdd("NOT_PAID")}
    />
    <label
      className={`btn flex-fill py-2 text-center ${
        firstRentStatusSelection === "NOT_PAID"
          ? "btn-primary text-white"
          : "btn-outline-primary"
      }`}
      htmlFor="firstRentStatusNormal"
    >
      <span className="d-block">Not Paid</span>
      <span className="d-block small">(Normal cycle)</span>
    </label>
  </div>

  <small className="text-muted mt-1 d-block">
    • Normal cycle → rent appears in next month<br />
    • Paid at joining → rent recorded in joining month
  </small>
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
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          handleStrictImageSelection(file, setSelfAadharFile, setDocMsg, "Self Aadhaar Card");
                        }}
                      />
                      <small className="text-muted d-block mt-1">
                        JPG, JPEG, or PNG only.
                      </small>
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
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          handleStrictImageSelection(file, setParentAadharFile, setDocMsg, "Parent Aadhaar Card");
                        }}
                      />
                      <small className="text-muted d-block mt-1">
                        JPG, JPEG, or PNG only.
                      </small>
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
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        capture="user" // 📷 On mobile this opens camera
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          handleStrictImageSelection(file, setPhotoFile, setDocMsg, "Tenant Photograph");
                        }}
                      />
                      <small className="text-muted d-block mt-1">
                        JPG, JPEG, or PNG only.
                      </small>
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
  disabled={creatingInvite || submittingAdd}   // ✅ lock
  onClick={async () => {
    if (creatingInvite || submittingAdd) return; // ✅ guard

    try {
      setCreatingInvite(true);

      const INVITES_URL = `${String(apiUrl).replace(/\/+$/, "")}/invites`;

      const roomFromId = roomsData.find(
        (r) => String(r._id) === String(newTenant.roomId)
      );
      const roomFromNo = roomsData.find(
        (r) => String(r.roomNo) === String(newTenant.roomNo)
      );
      const pickedRoom = roomFromId || roomFromNo;

      const category = String(
        newTenant.category || pickedRoom?.category || ""
      ).trim();
      const roomNo = String(newTenant.roomNo || pickedRoom?.roomNo || "").trim();
      const bedNo = String(newTenant.bedNo || "").trim();

      const phone10 = String(newTenant.phoneNo || "")
        .replace(/\D/g, "")
        .slice(0, 10);

      const joinDate = newTenant.joiningDate ? new Date(newTenant.joiningDate) : null;
      const firstRentStatus =
        firstRentStatusSelection || newTenant.firstRentStatus || "ADVANCE_PAID";
      const firstRentMonth =
        joinDate
          ? (firstRentStatus === "ADVANCE_PAID"
              ? fmtMonthKey(joinDate.getFullYear(), joinDate.getMonth())
              : fmtMonthKey(joinDate.getFullYear(), joinDate.getMonth() + 1))
          : undefined;

      const invitePayload = {
        category,
        roomNo,
        bedNo,
        name: String(newTenant.name || "").trim() || undefined,
        phoneNo: phone10 || undefined,
        address: String(newTenant.address || "").trim() || undefined,
        pincode: String(newTenant.pincode || "").trim() || undefined,
        city: String(newTenant.city || "").trim() || undefined,
        state: String(newTenant.state || "").trim() || undefined,
        houseNo: String(newTenant.houseNo || "").trim() || undefined,
        nearbyPlace: String(newTenant.nearbyPlace || "").trim() || undefined,
        relativeAddress: String(newTenant.relativeAddress || "").trim() || undefined,
        relative1Relation: newTenant.relative1Relation || undefined,
        relative1Name: String(newTenant.relative1Name || "").trim() || undefined,
        relative1Phone: String(newTenant.relative1Phone || "").trim() || undefined,
        relative2Relation: newTenant.relative2Relation || undefined,
        relative2Name: String(newTenant.relative2Name || "").trim() || undefined,
        relative2Phone: String(newTenant.relative2Phone || "").trim() || undefined,
        companyAddress: String(newTenant.companyAddress || "").trim() || undefined,
        dateOfJoiningCollege: newTenant.dateOfJoiningCollege || undefined,
        dob: newTenant.dob || undefined,
        joiningDate: newTenant.joiningDate || undefined,
        rentAmount: toNum(
          newTenant.baseRent !== "" && newTenant.baseRent != null
            ? newTenant.baseRent
            : newTenant.rentAmount
        ),
        depositAmount: toNum(newTenant.depositAmount),
        firstRentStatus,
        firstRentMonth,
        firstRentPaidDate:
          firstRentStatus === "ADVANCE_PAID"
            ? newTenant.firstRentPaidDate || getTodayISODate()
            : "",
      };

      // ✅ validations
      if (!invitePayload.category) { alert("Category missing. Select Room again."); setCreatingInvite(false); return; }
      if (!invitePayload.roomNo) { alert("Room No missing. Please select a Room."); setCreatingInvite(false); return; }
      if (!invitePayload.bedNo || invitePayload.bedNo === "__other__") { alert("Select valid Bed."); setCreatingInvite(false); return; }
      if (invitePayload.phoneNo && invitePayload.phoneNo.length !== 10) { alert("Phone number must be 10 digits."); setCreatingInvite(false); return; }

      // ✅ IMPORTANT: idempotency key (prevents duplicates)
      const idempotencyKey = `${invitePayload.roomNo}-${invitePayload.bedNo}-${invitePayload.phoneNo || "noPhone"}-${invitePayload.joiningDate || "noDate"}`;

      const res = await axios.post(INVITES_URL, invitePayload, {
        headers: {
          "X-Origin": window.location.origin,
          "X-Idempotency-Key": idempotencyKey, // ✅ backend should use this
        },
      });

      const url = res.data?.url;
      if (!url) {
        alert("Invite created but URL missing.");
        console.log("INVITE RESPONSE =>", res.data);
        setCreatingInvite(false);
        return;
      }

      const shareData = { title: "Tenant Form (One-Time)", text: "Please fill this form:", url };

      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        alert("One-time link copied to clipboard.");
      }

      // ✅ close modal after successful share/copy
      closeAddTenantModal();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        (typeof e?.response?.data === "string" ? e.response.data : "") ||
        e.message;

      console.error("INVITE ERROR =>", e?.response?.data || e);
      alert(`Could not create invite link.\n\n${msg}`);
      setCreatingInvite(false); // ✅ unlock on error only
    }
  }}
>
  {creatingInvite ? "Creating…" : "Share Link"}
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
  onClick={async () => {
    if (submittingAdd || creatingInvite) return; // ✅ block
    try {
      setSubmittingAdd(true);
      await handleAddTenantWithDocs();
      // If save succeeded, keep locked OR close modal.
      // If you close modal, lock reset happens anyway.
    } catch (e) {
      setSubmittingAdd(false); // ✅ unlock on error only
      throw e;
    }
  }}
  disabled={submittingAdd || creatingInvite || invLoading || (invToken && !formId) || !!invError}
  style={{ backgroundColor: "rgb(94, 182, 92)", color: "white" }}
>
  {submittingAdd ? "Saving…" : "Save"}
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
                          (bed) => !occupiedBeds.has(occKey(newTenant.roomNo, bed.bedNo))
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
          <div className="modal-dialog modal-lg">
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
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Month</th>
                          <th>Cycle</th>
                          <th className="text-end">Due</th>
                          <th className="text-end">Paid</th>
                          <th className="text-end">Balance</th>
                          <th className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dueMonths.map((month, idx) => {
                          const item =
                            typeof month === "string"
                              ? {
                                  label: month,
                                  cycle: "",
                                  expected: 0,
                                  paid: 0,
                                  outstanding: 0,
                                }
                              : month;

                          return (
                            <tr key={item.key || `${item.label}-${idx}`}>
                              <td>
                                <div className="fw-semibold">{item.label}</div>
                                {item.dueDate ? (
                                  <div className="small text-muted">
                                    Due {item.dueDate}
                                  </div>
                                ) : null}
                              </td>
                              <td>{item.cycle || "-"}</td>
                              <td className="text-end">
                                ₹{Number(item.expected || 0).toLocaleString("en-IN")}
                              </td>
                              <td className="text-end">
                                ₹{Number(item.paid || 0).toLocaleString("en-IN")}
                              </td>
                              <td className="text-end fw-semibold text-danger">
                                ₹{Number(item.outstanding || 0).toLocaleString("en-IN")}
                              </td>
                              <td className="text-center">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  disabled={!selectedTenant?._id || item.y == null || item.m == null}
                                  onClick={() => {
                                    setShowDueModal(false);
                                    openEditForTenantMonth(
                                      selectedTenant._id,
                                      item.m,
                                      item.y
                                    );
                                  }}
                                >
                                  Add Rent
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
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
  
        {/* ===== Header ===== */}
        <div className="modal-header">


          
          <h5 className="modal-title">
            Edit Tenant – {editTenantData.name}
          </h5>
          <button className="btn-close p-0" onClick={closeEditTenantModal}>
            x
          </button>
        </div>


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

    {/* Share Link */}
    <button
      className="btn btn-outline-dark btn-sm"
      disabled={creatingEditInvite}
      onClick={handleShareEditTenantLink}
    >
      {creatingEditInvite ? "Creating…" : "Share Link"}
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


<hr/>
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
                <label className="form-label">Pincode</label>
                <input
                  className="form-control"
                  value={editTenantData.pincode || ""}
                  onChange={(e) =>
                    setEditTenantData({ ...editTenantData, pincode: e.target.value })
                  }
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">City</label>
                <input
                  className="form-control"
                  value={editTenantData.city || ""}
                  onChange={(e) =>
                    setEditTenantData({ ...editTenantData, city: e.target.value })
                  }
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">State</label>
                <input
                  className="form-control"
                  value={editTenantData.state || ""}
                  onChange={(e) =>
                    setEditTenantData({ ...editTenantData, state: e.target.value })
                  }
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Local Address</label>
                <input
                  className="form-control"
                  value={editTenantData.address || ""}
                  onChange={(e) =>
                    setEditTenantData({ ...editTenantData, address: e.target.value })
                  }
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">House No</label>
                <input
                  className="form-control"
                  value={editTenantData.houseNo || ""}
                  onChange={(e) =>
                    setEditTenantData({ ...editTenantData, houseNo: e.target.value })
                  }
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Nearby Place</label>
                <input
                  className="form-control"
                  value={editTenantData.nearbyPlace || ""}
                  onChange={(e) =>
                    setEditTenantData({ ...editTenantData, nearbyPlace: e.target.value })
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
                    setEditTenantData((prev) => {
                      const nextStatus = String(prev?.firstRentStatus || "NOT_PAID").trim();
                      return {
                        ...prev,
                        joiningDate: e.target.value,
                        firstRentMonth: getFirstRentMonthForStatus(
                          e.target.value,
                          nextStatus
                        ),
                      };
                    })
                  }
                />
              </div>

              {isEditRentAtJoiningVisible && (
                <div className="col-12 col-md-6">
                
                  <label className="form-label fw-semibold d-block">
                    Rent at Joining
                  </label>
                  <small className="text-muted mt-1 d-block">
                    Current payment cycle:{" "}
                    <strong>
                      {(editTenantData.firstRentStatus || "ADVANCE_PAID") ===
                      "ADVANCE_PAID"
                        ? "Paid at Joining (Advance)"
                        : "Not Paid (Normal cycle)"}
                    </strong>
                    .
                  </small>
                  <div className="btn-group w-100" role="group" aria-label="Rent at Joining">
                    <label className={`btn btn-outline-primary ${
                      (editTenantData.firstRentStatus || "ADVANCE_PAID") ===
                      "ADVANCE_PAID"
                        ? "active"
                        : ""
                    }`}>
                    
                      <input
                        type="radio"
                        name="rentAtJoining"
                        value="ADVANCE_PAID"
                        checked={
                          (editTenantData.firstRentStatus || "ADVANCE_PAID") ===
                          "ADVANCE_PAID"
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditTenantData((prev) => ({
                            ...prev,
                            firstRentStatus: value,
                            firstRentMonth: getFirstRentMonthForStatus(
                              prev?.joiningDate,
                              value
                            ),
                            firstRentPaidDate:
                              value === "ADVANCE_PAID"
                                ? new Date().toISOString().slice(0, 10)
                                : "",
                          }));
                        }}
                        className="btn-check"
                      />
                      Paid at Joining (Advance)
                    </label>
                    <label className={`btn btn-outline-primary ${
                      (editTenantData.firstRentStatus || "ADVANCE_PAID") ===
                      "NOT_PAID"
                        ? "active"
                        : ""
                    }`}>
                      <input
                        type="radio"
                        name="rentAtJoining"
                        value="NOT_PAID"
                        checked={
                          (editTenantData.firstRentStatus || "ADVANCE_PAID") ===
                          "NOT_PAID"
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          setEditTenantData((prev) => ({
                            ...prev,
                            firstRentStatus: value,
                            firstRentMonth: getFirstRentMonthForStatus(
                              prev?.joiningDate,
                              value
                            ),
                            firstRentPaidDate: "",
                          }));
                        }}
                        className="btn-check"
                      />
                      Not Paid (Normal cycle)
                    </label>
                 
                  </div>
                
                </div>
              )}

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

              {/* RELATIVE 1 + RELATIVE 2 */}
              <div className="col-12">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="p-3 border rounded h-100">
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

                  <div className="col-12 col-md-6">
                    <div className="p-3 border rounded h-100">
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

              {/* Upload Documents (Edit) */}
              <div className="col-12 col-md-12">
                <label className="form-label d-block mb-2">
                  Upload Documents (Add More)
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
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          handleStrictImageSelection(file, setEditSelfAadharFile, setEditDocMsg, "Self Aadhaar Card");
                        }}
                      />
                      <small className="text-muted d-block mt-1">
                        JPG, JPEG, or PNG only.
                      </small>
                      {editSelfAadharFile && (
                        <small className="text-muted d-block mt-1">
                          Selected: {editSelfAadharFile.name}
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
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          handleStrictImageSelection(file, setEditParentAadharFile, setEditDocMsg, "Parent Aadhaar Card");
                        }}
                      />
                      <small className="text-muted d-block mt-1">
                        JPG, JPEG, or PNG only.
                      </small>
                      {editParentAadharFile && (
                        <small className="text-muted d-block mt-1">
                          Selected: {editParentAadharFile.name}
                        </small>
                      )}
                    </div>
                  </div>

                  {/* Tenant Photo */}
                  <div className="col-12 col-md-4">
                    <div className="border rounded p-3 h-100">
                      <label className="form-label fw-semibold small">
                        Tenant Photograph (Selfie)
                      </label>
                      <input
                        type="file"
                        className="form-control form-control-sm"
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        capture="user"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          handleStrictImageSelection(file, setEditPhotoFile, setEditDocMsg, "Tenant Photograph");
                        }}
                      />
                      <small className="text-muted d-block mt-1">
                        JPG, JPEG, or PNG only.
                      </small>
                      {editPhotoFile && (
                        <small className="text-muted d-block mt-1">
                          Selected: {editPhotoFile.name}
                        </small>
                      )}
                      <small className="text-muted d-block mt-1">
                        On mobile, this will open the camera.
                      </small>
                    </div>
                  </div>
                </div>

                {editDocMsg && (
                  <small className="d-block mt-2 text-danger">
                    {editDocMsg}
                  </small>
                )}
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
                    setShiftEffectiveDate("");
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

                <div className="mb-3">
                  <label className="form-label">Shift effective date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={shiftEffectiveDate}
                    onChange={(e) => setShiftEffectiveDate(e.target.value)}
                  />
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
                    setShiftEffectiveDate("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={!shiftTargetKey || !shiftEffectiveDate}
                  onClick={handleShiftSave}
                >
                  Shift
                </button>
              </div>
            </div>
          </div>
        </div>
      )}




{showPendingModal && (
  <div
    className="modal d-block"
    tabIndex="-1"
    style={{
      background: "rgba(0,0,0,0.5)",
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      overflowY: "auto",
    }}
  >
    <div className="modal-dialog modal-lg modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Pending Rents ({pendingTenants.length})</h5>
         <button
  type="button"
  className="modal-x-btn"
  onClick={() => setShowPendingModal(false)}
  aria-label="Close"
>
  ×
</button>

        </div>

        <div className="modal-body">
          {pendingTenants.length === 0 ? (
            <div className="text-success">No pending rents 🎉</div>
          ) : (
            <div className="table-responsive ">
              <table className="table table-bordered align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Room/Bed</th>
                    <th>Month</th>
                    <th>Due</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTenants.map((p) => (
                    <tr key={p.tenant?._id}>
                      <td>{p.tenant?.name}</td>
                      <td>
                        {p.tenant?.roomNo} / {p.tenant?.bedNo}
                      </td>
                      <td>{p.reason}</td>
                      <td className="fw-bold text-danger">
                        {p.dueAmount != null
                          ? `₹${Number(p.dueAmount).toLocaleString("en-IN")}`
                          : "-"}
                      </td>
                      <td>
                       <button
  className="btn btn-sm btn-outline-primary"
  onClick={() => {
    setShowPendingModal(false);

    // ✅ Open Edit Rent modal for that tenant & billing month
    openEditForTenantMonth(p.tenant?._id, p.billMonth, p.billYear);
  }}
>
  Edit Rent
</button>

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* <div style={{ fontSize: 12, opacity: 0.7 }}>
                Note: If Due shows “-”, it means rent is not paid for the billing month, but no explicit rentDue amount is stored.
              </div> */}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowPendingModal(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}




{showUpcomingModal && (
  <div
    className="modal d-block"
    tabIndex="-1"
    style={{
      background: "rgba(0,0,0,0.5)",
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      overflowY: "auto",
    }}
  >
    <div className="modal-dialog modal-lg modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Upcoming Rents ({upcomingRentEntries.length})</h5>
          <button
            type="button"
            className="modal-x-btn"
            onClick={() => setShowUpcomingModal(false)}
            aria-label="Close"
          >
          x
          </button>
        </div>

        <div className="modal-body">
          {upcomingRentEntries.length === 0 ? (
            <div className="text-success">No upcoming rents found 🎉</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Room/Bed</th>
                    <th>Month</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingRentEntries.map((item) => (
                    <tr key={item.key}>
                      <td>{item.tenant?.name}</td>
                      <td>
                        {item.tenant?.roomNo} / {item.tenant?.bedNo}
                      </td>
                      <td>{item.monthText}</td>
                      <td className="fw-semibold text-primary">{item.dateStr}</td>
                      <td className="fw-bold">
                        ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            setShowUpcomingModal(false);
                            openEditForTenantMonth(
                              item.tenant?._id,
                              item.billMonth,
                              item.billYear
                            );
                          }}
                        >
                          Edit Rent
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowUpcomingModal(false)}>
            Close
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
                          : "â€”"}
                      </li>
                      <li className="list-group-item">
                        Joining Payment:{" "}
                        <span
                          className={`badge ${
                            selectedTenant.firstRentStatus === "ADVANCE_PAID"
                              ? "bg-success"
                              : "bg-secondary"
                          }`}
                        >
                          {getJoiningPaymentLabel(selectedTenant)}
                        </span>
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
                alert("No file URL available for this document.");
                return;
              }
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          >
            View
          </button>

          {/* ✅ Download Button (ImageKit-safe) */}
          <button
            type="button"
            className="btn btn-sm btn-outline-success"
            onClick={(e) => {
              e.stopPropagation();
              const url = getDocHref(doc);
              if (!url || url === "#") {
                alert("No file URL available for download.");
                return;
              }

              // ✅ ImageKit download (works on localhost + live)
              window.open(
                `${url}${url.includes("?") ? "&" : "?"}ik-attachment=true`,
                "_blank",
                "noopener,noreferrer"
              );
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
                            <th>Payment Type</th>
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
          {monthDate.getFullYear() * 12 + monthDate.getMonth() ===
            getFirstBillYM(selectedTenant) && (
            <div className="mt-1 d-md-none">
              <span
                className={`badge ${
                  selectedTenant.firstRentStatus === "ADVANCE_PAID"
                    ? "bg-info text-dark"
                    : "bg-secondary"
                }`}
              >
                {selectedTenant.firstRentStatus === "ADVANCE_PAID"
                  ? "Advance paid"
                  : "Not advance"}
              </span>
            </div>
          )}
        </td>

        {/* Date */}
        <td>
          {rent
            ? new Date(rent.date || new Date(rent.y || 2000, rent.m || 0, 1))
                .toLocaleDateString()
            : "—"}
          {monthDate.getFullYear() * 12 + monthDate.getMonth() ===
            getFirstBillYM(selectedTenant) && (
            <div className="mt-1">
              <span
                className={`badge ${
                  selectedTenant.firstRentStatus === "ADVANCE_PAID"
                    ? "bg-info text-dark"
                    : "bg-secondary"
                }`}
              >
                {selectedTenant.firstRentStatus === "ADVANCE_PAID"
                  ? "Advance paid"
                  : "Not advance"}
              </span>
            </div>
          )}
        </td>

        {/* Payment Type */}
        <td>
          {monthDate.getFullYear() * 12 + monthDate.getMonth() ===
          getFirstBillYM(selectedTenant)
            ? getJoiningPaymentLabel(selectedTenant)
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
                  <label className="form-label">Update Type</label>
                  <div className="d-flex gap-3 flex-wrap">
                    <label className="form-check-label">
                      <input
                        type="radio"
                        className="form-check-input me-2 form-check-input1"
                        name="rentUpdateMode"
                        value="add"
                        checked={rentUpdateMode === "add"}
                        onChange={(e) => setRentUpdateMode(e.target.value)}
                      />
                      Add to existing
                    </label>
                    <label className="form-check-label">
                      <input
                        type="radio"
                        className="form-check-input me-2 form-check-input1"
                        name="rentUpdateMode"
                        value="replace"
                        checked={rentUpdateMode === "replace"}
                        onChange={(e) => setRentUpdateMode(e.target.value)}
                      />
                      Replace final value
                    </label>
                  </div>
                  <small className="text-muted">
                    Use replace when duplicate rent was added and this amount should be the final paid value for the month.
                  </small>
                </div>
                {/* <div className="mb-3">
  <label className="form-label">Note (optional)</label>
  <input
    type="text"
    className="form-control"
    placeholder="Eg: Rent: 8000, Advance: 2000"
    value={editNote}
    onChange={(e) => setEditNote(e.target.value)}
  />
</div> */}

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

      {undoBedModal.show && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Select Vacant Bed</h5>
                <button
                  type="button"
                  className="btn-close p-0"
                  disabled={undoBedModal.busy}
                  onClick={() =>
                    setUndoBedModal({
                      show: false,
                      tenantId: "",
                      message: "",
                      vacantBeds: [],
                      selectedIndex: "",
                      busy: false,
                    })
                  }
                >
                  x
                </button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning mb-3">
                  {undoBedModal.message}
                </div>
                <label className="form-label fw-semibold">
                  Choose another vacant bed
                </label>
                <select
                  className="form-select"
                  value={undoBedModal.selectedIndex}
                  disabled={undoBedModal.busy}
                  onChange={(e) =>
                    setUndoBedModal((prev) => ({
                      ...prev,
                      selectedIndex: e.target.value,
                    }))
                  }
                >
                  <option value="">Select vacant bed</option>
                  {undoBedModal.vacantBeds.map((bed, index) => (
                    <option
                      key={`${bed.roomNo}-${bed.bedNo}-${index}`}
                      value={String(index)}
                    >
                      {formatVacantBedOption(bed)}
                    </option>
                  ))}
                </select>
                <div className="small text-muted mt-2">
                  The tenant will be restored to the Rent & Deposit Tracker only after this vacant bed is assigned.
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={undoBedModal.busy}
                  onClick={() =>
                    setUndoBedModal({
                      show: false,
                      tenantId: "",
                      message: "",
                      vacantBeds: [],
                      selectedIndex: "",
                      busy: false,
                    })
                  }
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={undoBedModal.busy || undoBedModal.selectedIndex === ""}
                  onClick={handleConfirmUndoWithSelectedBed}
                >
                  {undoBedModal.busy ? "Assigning..." : "Assign Bed & Undo"}
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
                  onClick={closeLeaveModal}
                >x</button>
              </div>
              <div className="modal-body">
                <input
                  type="date"
                  className="form-control"
                  value={selectedLeaveDate}
                  onChange={(e) => {
                    const nextDate = e.target.value;
                    setSelectedLeaveDate(nextDate);
                    if (leaveDeductFromDeposit) {
                      const nextMonths = getLeaveSettlementMonths(
                        currentLeaveTenant,
                        nextDate
                      );
                      setLeaveSelectedMonths(nextMonths.map((month) => month.key));
                    }
                  }}
                />
                <p className="mt-3">
                  Are you sure you want <strong>{currentLeaveName}</strong> to
                  leave on <strong>{selectedLeaveDate || "..."}</strong>?
                </p>
                <div className="border rounded p-3 mt-3">
                  <label className="form-label fw-semibold d-block mb-2">
                    Will you cut pending rent from deposit?
                  </label>
                  <div className="btn-group w-100" role="group" aria-label="Deposit deduction">
                    <button
                      type="button"
                      className={`btn ${leaveDeductFromDeposit ? "btn-outline-secondary" : "btn-primary"}`}
                      onClick={() => {
                        setLeaveDeductFromDeposit(false);
                        setLeaveSelectedMonths([]);
                      }}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      className={`btn ${leaveDeductFromDeposit ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => {
                        setLeaveDeductFromDeposit(true);
                        setLeaveSelectedMonths(
                          leaveSettlementMonths.map((month) => month.key)
                        );
                      }}
                    >
                      Yes
                    </button>
                  </div>
                  <div className="mt-2 small text-muted">
                    If the deductions are higher than the deposit, the
                    remaining balance will be shown as an additional amount to
                    receive from the tenant.
                  </div>

                  {leaveDeductFromDeposit && (
                    <div className="mt-3">
                      <div className="small text-muted mb-2">
                        Select the pending months to deduct from the deposit.
                      </div>
                      {leaveSettlementMonths.length > 0 ? (
                        <div className="d-grid gap-2">
                          {leaveSettlementMonths.map((month) => {
                            const checked = leaveSelectedMonths.includes(month.key);
                            return (
                              <label
                                key={month.key}
                                className="d-flex align-items-center justify-content-between border rounded p-2"
                              >
                                <span>
                                  <input
                                    type="checkbox"
                                    className="form-check-input me-2"
                                    checked={checked}
                                    onChange={(e) => {
                                      const next = e.target.checked
                                        ? [...leaveSelectedMonths, month.key]
                                        : leaveSelectedMonths.filter((k) => k !== month.key);
                                      setLeaveSelectedMonths(next);
                                    }}
                                  />
                                  {month.label}
                                </span>
                                <strong>
                                  ₹{Number(month.amount || 0).toLocaleString("en-IN")}
                                </strong>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-success small">
                          No pending months found for deduction.
                        </div>
                      )}

                      {leaveExtraDaysDeduction && (
                        <div className="border rounded p-2 mt-3">
                          <div className="d-flex align-items-center justify-content-between">
                            <div>
                              <div className="fw-semibold">
                                {leaveExtraDaysDeduction.label}
                              </div>
                              <div className="small text-muted">
                                {leaveExtraDaysDeduction.cycleRange} | Rs.{" "}
                                {Math.round(
                                  Number(leaveExtraDaysDeduction.dailyRent || 0)
                                ).toLocaleString("en-IN")}{" "}
                                per day
                              </div>
                            </div>
                            <strong>
                              Rs.{" "}
                              {Number(
                                leaveExtraDaysDeduction.amount || 0
                              ).toLocaleString("en-IN")}
                            </strong>
                          </div>
                        </div>
                      )}

                      <div className="mt-3 small">
                        <div>
                          Gross Deposit: ₹{Number(leaveSettlementSummary.grossDeposit || 0).toLocaleString("en-IN")}
                        </div>
                        <div>
                          Deduction: ₹
                          {Number(leaveSettlementSummary.totalDeduction || 0).toLocaleString("en-IN")}
                        </div>
                        <div className="text-muted">
                          Full Month Deduction: Rs.{" "}
                          {Number(leaveSettlementSummary.monthDeduction || 0).toLocaleString("en-IN")}
                        </div>
                        {leaveSettlementSummary.extraDaysDeduction > 0 && (
                          <div className="text-muted">
                            Extra Days Deduction: Rs.{" "}
                            {Number(leaveSettlementSummary.extraDaysDeduction || 0).toLocaleString("en-IN")}
                          </div>
                        )}
                        {leaveSettlementSummary.amountDueFromTenant > 0 ? (
                          <>
                            <div className="fw-semibold text-danger">
                              Additional Amount to Receive: ₹
                              {Number(
                                leaveSettlementSummary.amountDueFromTenant || 0
                              ).toLocaleString("en-IN")}
                            </div>
                            <div>Refundable Deposit: ₹0</div>
                          </>
                        ) : (
                          <div className="fw-semibold">
                            Refundable Deposit: ₹
                            {Number(
                              leaveSettlementSummary.refundableDeposit || 0
                            ).toLocaleString("en-IN")}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
                  All Rents / Status - {selectedTenantName}
                </h5>
                <button
                  type="button"
                  className="btn-close p-0"
                  onClick={() => setShowRentModal(false)}
                >x</button>
              </div>
              <div className="modal-body">
                {selectedRentDetails.length > 0 ? (
                  <>
                    <div className="fw-semibold mb-3">
                      Total Paid: Rs.{" "}
                      {selectedRentDetails
                        .reduce((sum, rent) => sum + Number(rent?.rentAmount || 0), 0)
                        .toLocaleString("en-IN")}
                    </div>
                    <div className="d-grid gap-2">
                      {selectedRentDetails.map((rent, index) => {
                        const amount = Number(rent?.rentAmount || 0);
                        const paidDate = rent?.date ? new Date(rent.date) : null;
                        return (
                          <div
                            className="border rounded px-2 py-2 small"
                            key={`${amount}-${rent?.month || ""}-${rent?.date || index}`}
                          >
                            <span
                              className={
                                amount > 0
                                  ? "text-success fw-semibold"
                                  : "text-danger fw-semibold"
                              }
                            >
                              {amount > 0 ? "Paid" : "Due"}
                            </span>
                            {" | "}
                            {rent?.month || "Month -"}
                            {" | Rs. "}
                            {amount.toLocaleString("en-IN")}
                            {" | "}
                            {paidDate && !isNaN(paidDate)
                              ? paidDate.toLocaleDateString("en-IN")
                              : "No date"}
                            {rent?.paymentMode ? ` | ${rent.paymentMode}` : ""}
                          </div>
                        );
                      })}
                    </div>
                  {/* legacy hidden list */}
                  <div className="d-none">
                 {false && selectedRentDetails.map((rent, index) => (
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

                  </div>
                  </>
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

      {photoEditTenant && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Edit Photo - {photoEditTenant.name}
                </h5>
                <button
                  className="btn-close p-0"
                  onClick={() => setPhotoEditTenant(null)}
                >x</button>
              </div>
              <div className="modal-body">
                {(() => {
                  const latestTenant =
                    formData.find((t) => t._id === photoEditTenant._id) ||
                    photoEditTenant;
                  const doc = getTenantPhotoDoc(latestTenant);
                  const t = normalizePhotoTransform(doc);
                  const rotate = clampRotate(t.rotate || 0);
                  const scaleX = t.flipX ? -1 : 1;
                  const scaleY = t.flipY ? -1 : 1;
                  const photoUrl = getTenantPhotoUrl(latestTenant);
                  return (
                    <>
                      <div className="photo-edit-preview">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt="photo"
                            crossOrigin="anonymous"
                            className="photo-edit-img"
                            style={{
                              transform: `rotate(${rotate}deg) scale(${scaleX}, ${scaleY})`,
                            }}
                          />
                        ) : (
                          <div className="photo-edit-empty">No Photo</div>
                        )}
                      </div>
                      <div className="photo-edit-actions">
                        <button
                          type="button"
                          className="photo-action-btn"
                          onClick={() =>
                            updateTenantPhotoTransform(
                              latestTenant,
                              (cur) => ({ ...cur, rotate: (cur.rotate || 0) - 90 }),
                              setFormData,
                              setTenants,
                              apiUrl
                            )
                          }
                        >
                          Rotate L
                        </button>
                        <button
                          type="button"
                          className="photo-action-btn"
                          onClick={() =>
                            updateTenantPhotoTransform(
                              latestTenant,
                              (cur) => ({ ...cur, rotate: (cur.rotate || 0) + 90 }),
                              setFormData,
                              setTenants,
                              apiUrl
                            )
                          }
                        >
                          Rotate R
                        </button>
                        <button
                          type="button"
                          className="photo-action-btn"
                          onClick={() =>
                            updateTenantPhotoTransform(
                              latestTenant,
                              (cur) => ({ ...cur, flipX: !cur.flipX }),
                              setFormData,
                              setTenants,
                              apiUrl
                            )
                          }
                        >
                          Flip H
                        </button>
                        <button
                          type="button"
                          className="photo-action-btn"
                          onClick={() =>
                            updateTenantPhotoTransform(
                              latestTenant,
                              () => ({ rotate: 0, flipX: false, flipY: false }),
                              setFormData,
                              setTenants,
                              apiUrl
                            )
                          }
                        >
                          Reset
                        </button>
                      </div>
                    </>
                  );
                })()}
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
         onOpenEditRent={openEditForTenantMonth}  // <--- NEW
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

