import { FiBarChart2 } from "react-icons/fi";
import {
  MdOutlineBedroomParent,
  MdLightbulbOutline,
  MdOutlineReceiptLong,
} from "react-icons/md";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

const COLORS = [
  "#1e3a8a",
  "#FBBF24",
  "#3B82F6",
  "#10B981",
  "#EF4444",
  "#6366F1",
];

const MainDashboard = () => {
  const navigate = useNavigate();
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const [summary, setSummary] = useState({
    rent: {},
    beds: {},
    light: {},
    maintenance: {},
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  const menuItems = [
    { label: "Dashboard", icon: <FiBarChart2 />, path: "/maindashboard" },
    {
      label: "Rent Tracker",
      icon: <MdOutlineBedroomParent />,
      children: [
        {
          label: "Hostel Tracker",
          path: "/tracker/bed",
          state: { tab: "rent", trackerType: "bed" },
        },
        {
          label: "Residential Rooms Tracker",
          path: "/tracker/room",
          state: { tab: "rent", trackerType: "room" },
        },
        {
          label: "Commercial Shop Tracker",
          path: "/tracker/shop",
          state: { tab: "rent", trackerType: "shop" },
        },
      ],
    },
    {
      label: "Light Bill",
      icon: <MdLightbulbOutline />,
      children: [
        {
          label: "Hostel",
          path: "/tracker/bed",
          state: { tab: "light-hostel", trackerType: "bed" },
        },
        {
          label: "Residential Rooms",
          path: "/tracker/room",
          state: { tab: "light-room", trackerType: "room" },
        },
        {
          label: "Commercial Shop",
          path: "/tracker/shop",
          state: { tab: "light-shop", trackerType: "shop" },
        },
      ],
    },
    {
      label: "Expenses",
      icon: <MdOutlineReceiptLong />,
      children: [
        {
          label: "Hostel",
          path: "/tracker/bed",
          state: { tab: "expenses-hostel", trackerType: "bed" },
        },
        {
          label: "Residential Rooms",
          path: "/tracker/room",
          state: { tab: "expenses-room", trackerType: "room" },
        },
        {
          label: "Commercial Shop",
          path: "/tracker/shop",
          state: { tab: "expenses-shop", trackerType: "shop" },
        },
      ],
    },
    {
      label: "Staff",
      icon: <MdOutlineReceiptLong />,
      path: "/tracker/bed",
      state: { tab: "staff", trackerType: "bed" },
    },
  ];

  const handleNavigation = (path, state) => navigate(path, state ? { state } : undefined);
  const toggleSubmenu = (label) => {
    setOpenSubmenu((current) => (current === label ? null : label));
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/");
  };

  const [showVacantModal, setShowVacantModal] = useState(false);
  const [vacantBedsList, setVacantBedsList] = useState([]);
  const [showFutureLeaveModal, setShowFutureLeaveModal] = useState(false);

  const [rooms, setRooms] = useState([]);
  const [tenantsState, setTenantsState] = useState([]);

  const [showPendingRentModal, setShowPendingRentModal] = useState(false);
  const [pendingRentList, setPendingRentList] = useState([]);

  // ------------------------ helpers ------------------------
  const toNum = (v) => {
    if (v === null || v === undefined) return 0;
    const n = Number(String(v).replace(/[,₹\s]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const norm = (s) => String(s ?? "").trim().toLowerCase();

  const hasBed = (t) =>
    t?.bedNo !== null &&
    t?.bedNo !== undefined &&
    String(t.bedNo).trim() !== "";

  const hasRoom = (t) =>
    t?.roomNo !== null &&
    t?.roomNo !== undefined &&
    String(t.roomNo).trim() !== "";

  const isActiveTenant = (t) => {
    if (!t?.leaveDate) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const leave = new Date(t.leaveDate);
    leave.setHours(0, 0, 0, 0);
    return leave > today;
  };

  /**
   * ✅ Paid amount resolver (kept; useful if you add paidAmount later)
   * Your rent object doesn't have paidAmount; it only has rentAmount + paymentMode + date.
   */
  const getPaidAmt = (r, monthlyRent = 0) => {
    const explicit = toNum(
      r?.paidAmount ?? r?.amountPaid ?? r?.paid ?? r?.amount ?? 0
    );
    if (explicit > 0) return explicit;

    const status = norm(r?.status || r?.paymentStatus || r?.label || "");
    const hasPaymentProof =
      !!String(r?.paymentMode || "").trim() || status === "paid";

    if (hasPaymentProof) {
      return toNum(r?.rentAmount ?? monthlyRent ?? 0);
    }

    return 0;
  };

  const monthIdx = (mon) => {
    const key = String(mon || "").trim().slice(0, 3).toLowerCase();
    const arr = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    const i = arr.indexOf(key);
    return i >= 0 ? i : null;
  };

  const getRentYM = (r) => {
    if (!r) return null;

    if (r.month) {
      const s = String(r.month).trim();

      if (/^\d{4}-\d{1,2}$/.test(s)) {
        const [yy, mm] = s.split("-").map(Number);
        return { y: yy, m: mm - 1 };
      }

      const parts = s.split("-");
      if (parts.length === 2) {
        const m = monthIdx(parts[0]);
        if (m !== null) {
          const yRaw = String(parts[1]).trim();
          const y = yRaw.length === 2 ? Number("20" + yRaw) : Number(yRaw);
          if (Number.isFinite(y)) return { y, m };
        }
      }
    }

    if (r.date) {
      const d = new Date(r.date);
      if (!isNaN(d)) return { y: d.getFullYear(), m: d.getMonth() };
    }

    return null;
  };

  // ✅ Monthly rent getter (baseRent -> rentAmount -> bed.price from rooms)
  const getMonthlyRent = (t, roomsArr = rooms) => {
    const direct = toNum(t?.baseRent || t?.rentAmount || 0);
    if (direct > 0) return direct;

    const room = (roomsArr || []).find(
      (rm) =>
        String(rm?.roomNo || "").trim() === String(t?.roomNo || "").trim() &&
        norm(rm?.category) === norm(t?.category)
    );

    const bed = (room?.beds || []).find(
      (b) =>
        String(b?.bedNo || "").trim().toLowerCase() ===
        String(t?.bedNo || "").trim().toLowerCase()
    );

    return toNum(bed?.price || 0);
  };

  // ✅ Vacant matching KEY = roomNo + bedNo ONLY
  const bedKey = (roomNo, bedNo) => `${norm(roomNo)}|${norm(bedNo)}`;

  // ✅ Month record helpers
  const getMonthRecords = (t, Y, M) =>
    (t?.rents || []).filter((r) => {
      const ym = getRentYM(r);
      return ym && ym.y === Y && ym.m === M;
    });

  const getMonthPaidTotal = (t, Y, M, monthlyRent) =>
    getMonthRecords(t, Y, M).reduce(
      (sum, r) => sum + getPaidAmt(r, monthlyRent),
      0
    );

  const isMonthPaid = (t, Y, M, monthlyRent) => {
    const recs = getMonthRecords(t, Y, M);

    const anyPaidStatus = recs.some((r) => {
      const status = norm(r?.status || r?.paymentStatus || r?.label || "");
      return status === "paid";
    });
    if (anyPaidStatus) return true;

    const paidTotal = recs.reduce(
      (s, r) => s + getPaidAmt(r, monthlyRent),
      0
    );
    return paidTotal >= toNum(monthlyRent);
  };

  // ---------------------------------------------------------
  // ✅ COMPLETED-MONTH PENDING RENT (WHAT YOU WANT)
  // Show ONLY tenants whose completed months are unpaid.
  // ---------------------------------------------------------
  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

  const formatMonYY = (y, m) => {
    const arr = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const yy = String(y).slice(-2);
    return `${arr[m]}-${yy}`;
  };

  const ymToKey = (y, m) => `${y}-${String(m + 1).padStart(2, "0")}`;

  const addMonths = (y, m, delta) => {
    const d = new Date(y, m, 1);
    d.setMonth(d.getMonth() + delta);
    return { y: d.getFullYear(), m: d.getMonth() };
  };

  const cmpYM = (a, b) => (a.y !== b.y ? a.y - b.y : a.m - b.m);

  const getStartYM = (t) => {
    if (t?.firstRentMonth) {
      const ym = getRentYM({ month: t.firstRentMonth });
      if (ym) return ym;
    }
    if (t?.joiningDate) {
      const d = new Date(t.joiningDate);
      if (!isNaN(d)) return { y: d.getFullYear(), m: d.getMonth() };
    }
    const rs = t?.rents || [];
    for (const r of rs) {
      const ym = getRentYM(r);
      if (ym) return ym;
    }
    return null;
  };

  const getLastCompletedYM = (t) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (t?.leaveDate) {
      const leave = new Date(t.leaveDate);
      if (!isNaN(leave)) {
        leave.setHours(0, 0, 0, 0);
        if (leave <= today) {
          const y = leave.getFullYear();
          const m = leave.getMonth();
          const isMonthEnd = leave.getDate() === daysInMonth(y, m);
          return isMonthEnd ? { y, m } : addMonths(y, m, -1);
        }
      }
    }

    // active tenant -> previous month is last completed
    const d = new Date();
    return addMonths(d.getFullYear(), d.getMonth(), -1);
  };

  const getPaidMonthSet = (t) => {
    const set = new Set();
    (t?.rents || []).forEach((r) => {
      const ym = getRentYM(r);
      if (!ym) return;

      const status = norm(r?.status || r?.paymentStatus || r?.label || "");
      const hasProof =
        !!String(r?.paymentMode || "").trim() || status === "paid" || !!r?.date;

      if (hasProof) set.add(ymToKey(ym.y, ym.m));
    });
    return set;
  };

  const getPendingMonths = (t) => {
    const start = getStartYM(t);
    const end = getLastCompletedYM(t);
    if (!start || !end) return [];

    if (cmpYM(end, start) < 0) return [];

    const paidSet = getPaidMonthSet(t);
    const pending = [];

    let cur = { ...start };
    while (cmpYM(cur, end) <= 0) {
      const key = ymToKey(cur.y, cur.m);
      if (!paidSet.has(key)) pending.push({ ...cur });
      cur = addMonths(cur.y, cur.m, +1);
    }

    return pending;
  };

  // ---------------------------------------------------------
  // FUTURE LEAVES
  // ---------------------------------------------------------
  const futureLeaveTenants = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (tenantsState || []).filter((t) => {
      if (!t.leaveDate) return false;

      const leaveDate = new Date(t.leaveDate);
      leaveDate.setHours(0, 0, 0, 0);

      return leaveDate > today;
    });
  }, [tenantsState]);

  const futureLeaveCount = futureLeaveTenants.length;

  const calculateRefund = (t) => {
    const deposit = Number(t.depositAmount || 0);
    const monthlyRent = Number(t.baseRent || t.rentAmount || 0);

    if (!t.leaveDate || !monthlyRent) {
      return { deposit, refundable: deposit, isNegative: false };
    }

    const leaveDate = new Date(t.leaveDate);
    const year = leaveDate.getFullYear();
    const month = leaveDate.getMonth();

    const totalDays = new Date(year, month + 1, 0).getDate();
    const occupiedDays = leaveDate.getDate();

    const perDayRent = monthlyRent / totalDays;
    const usedRent = perDayRent * occupiedDays;

    let pendingDue = 0;

    (t.rents || []).forEach((r) => {
      if (!r) return;

      let rentDate = null;

      if (r.month) {
        try {
          const [mon, yy] = r.month.split("-");
          rentDate = new Date(`${mon} 01, 20${yy}`);
        } catch {}
      }

      if (!rentDate && r.date) {
        rentDate = new Date(r.date);
      }

      if (!rentDate) return;

      if (
        rentDate.getFullYear() < year ||
        (rentDate.getFullYear() === year && rentDate.getMonth() < month)
      ) {
        pendingDue += Number(r.rentAmount || 0);
      }
    });

    const refundable = deposit - usedRent - pendingDue;

    return {
      deposit,
      refundable: Math.round(refundable * 100) / 100,
      isNegative: refundable < 0,
    };
  };

  // ---------------------------------------------------------
  // Category Report
  // ---------------------------------------------------------
  const handleDownloadCategoryReport = () => {
    const capMap = new Map();
    (rooms || []).forEach((room) => {
      const cat = String(room?.category || "").trim();
      const beds = Array.isArray(room?.beds) ? room.beds.length : 0;
      if (!cat) return;
      capMap.set(cat, (capMap.get(cat) || 0) + beds);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isActive = (t) => {
      if (!t?.leaveDate) return true;
      const leave = new Date(t.leaveDate);
      leave.setHours(0, 0, 0, 0);
      return leave > today;
    };

    const getTenantMonthlyRent = (t) => {
      const r = Number(t?.baseRent || t?.rentAmount || 0);
      if (r > 0) return r;

      const room = (rooms || []).find(
        (rm) =>
          String(rm?.roomNo || "").trim() === String(t?.roomNo || "").trim() &&
          norm(rm?.category) === norm(t?.category)
      );

      const bed = (room?.beds || []).find(
        (b) =>
          String(b?.bedNo || "").trim().toLowerCase() ===
          String(t?.bedNo || "").trim().toLowerCase()
      );

      return Number(bed?.price || 0);
    };

    const occMap = new Map();
    const depMap = new Map();
    const rentMap = new Map();

    (tenantsState || []).forEach((t) => {
      if (!isActive(t)) return;

      const cat = String(t?.category || "").trim();
      if (!cat) return;

      occMap.set(cat, (occMap.get(cat) || 0) + 1);
      depMap.set(cat, (depMap.get(cat) || 0) + toNum(t?.depositAmount));

      const tenantMonthlyRent = getTenantMonthlyRent(t);
      rentMap.set(cat, (rentMap.get(cat) || 0) + toNum(tenantMonthlyRent));
    });

    const cats = Array.from(
      new Set([...capMap.keys(), ...occMap.keys(), ...rentMap.keys()])
    ).sort((a, b) => a.localeCompare(b));

    const rows = cats.map((cat, i) => {
      const totalCapacity = capMap.get(cat) || 0;
      const totalOccupied = occMap.get(cat) || 0;
      const vacantBed = Math.max(0, totalCapacity - totalOccupied);

      return {
        "SR NO": i + 1,
        LOCATION: cat,
        "TOTAL CAPACITY": totalCapacity,
        "TOTAL Occupied": totalOccupied,
        "VACANT BED": vacantBed,
        "DEPOSITE AMT": depMap.get(cat) || 0,
        "BALANCE AMT (Deposit)": "",
        "RENT AMT": rentMap.get(cat) || 0,
        "BALANCE AMT (Rent)": "",
        REMARK: "",
      };
    });

    const totals = rows.reduce(
      (a, r) => {
        a["TOTAL CAPACITY"] += Number(r["TOTAL CAPACITY"]) || 0;
        a["TOTAL Occupied"] += Number(r["TOTAL Occupied"]) || 0;
        a["VACANT BED"] += Number(r["VACANT BED"]) || 0;
        a["DEPOSITE AMT"] += Number(r["DEPOSITE AMT"]) || 0;
        a["RENT AMT"] += Number(r["RENT AMT"]) || 0;
        return a;
      },
      {
        "SR NO": "",
        LOCATION: "TOTAL",
        "TOTAL CAPACITY": 0,
        "TOTAL Occupied": 0,
        "VACANT BED": 0,
        "DEPOSITE AMT": 0,
        "BALANCE AMT (Deposit)": "",
        "RENT AMT": 0,
        "BALANCE AMT (Rent)": "",
        REMARK: "",
      }
    );

    rows.push(totals);

    const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
    ws["!cols"] = [
      { wch: 7 },
      { wch: 28 },
      { wch: 16 },
      { wch: 16 },
      { wch: 12 },
      { wch: 14 },
      { wch: 20 },
      { wch: 14 },
      { wch: 18 },
      { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Category Report");

    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Category_Report_${stamp}.xlsx`);
  };

  // ---------------------------------------------------------
  // TIME ticker
  // ---------------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ---------------------------------------------------------
  // ✅ Vacant finder
  // ---------------------------------------------------------
  const findVacantBeds = () => {
    if (!rooms?.length) return;

    const occupiedKeys = new Set(
      (tenantsState || [])
        .filter(isActiveTenant)
        .filter(hasRoom)
        .filter(hasBed)
        .map((t) => bedKey(t.roomNo, t.bedNo))
    );

    const vacants = [];

    (rooms || []).forEach((room) => {
      const roomNo = room?.roomNo;
      const seenBedsInRoom = new Set();

      (room?.beds || []).forEach((bed) => {
        const bno = bed?.bedNo;

        const local = norm(bno);
        if (seenBedsInRoom.has(local)) return;
        seenBedsInRoom.add(local);

        const key = bedKey(roomNo, bno);

        if (!occupiedKeys.has(key)) {
          vacants.push({
            roomNo,
            bedNo: bno,
            price: Number(bed?.price || 0),
            floorNo: room?.floorNo,
            category: room?.category,
          });
        }
      });
    });

    vacants.sort((a, b) => {
      const r = String(a.roomNo).localeCompare(String(b.roomNo), undefined, {
        numeric: true,
      });
      if (r !== 0) return r;
      return String(a.bedNo).localeCompare(String(b.bedNo), undefined, {
        numeric: true,
      });
    });

    setVacantBedsList(vacants);
    setShowVacantModal(true);
  };

  // ---------------------------------------------------------
  // FETCH + SUMMARY (✅ Completed-month pending rent logic)
  // ---------------------------------------------------------
  useEffect(() => {
    Promise.all([
      fetch("https://mutakehostel-api.pnminfotech.com/api/").then((res) =>
        res.json()
      ),
      fetch("https://mutakehostel-api.pnminfotech.com/api/light-bill/all").then(
        (res) => res.json()
      ),
      fetch("https://mutakehostel-api.pnminfotech.com/api/other-expense/all").then(
        (res) => res.json()
      ),
      fetch("https://mutakehostel-api.pnminfotech.com/api/rooms").then((res) =>
        res.json()
      ),
    ]).then(([tenants, lightBills, otherExpenses, rooms]) => {
      setRooms(rooms);
      setTenantsState(tenants);

      const totalBeds = (rooms || []).reduce(
        (sum, room) => sum + (room.beds?.length || 0),
        0
      );

      const occKeys = new Set(
        (tenants || [])
          .filter(isActiveTenant)
          .filter(hasRoom)
          .filter(hasBed)
          .map((t) => bedKey(t.roomNo, t.bedNo))
      );
      const occupied = occKeys.size;

      const vacant = Math.max(0, totalBeds - occupied);

      const deposits = (tenants || []).filter((t) => Number(t.depositAmount) > 0)
        .length;

      // ✅ Pending tenants ONLY if they have COMPLETED months unpaid
      const pendingList = (tenants || [])
        .map((t) => {
          const pendingMonths = getPendingMonths(t);
          const monthlyRent = getMonthlyRent(t, rooms);
          const dueTotal = toNum(monthlyRent) * pendingMonths.length;

          return {
            ...t,
            _pendingMonths: pendingMonths,
            _dueTotal: dueTotal,
          };
        })
        .filter((t) => (t._pendingMonths || []).length > 0);

      setPendingRentList(pendingList);
      const pendingRents = pendingList.length;

      // LIGHT BILL & MAINTENANCE
      const totalLight = (lightBills || []).reduce(
        (s, b) => s + Number(b.amount || 0),
        0
      );
      const paidLight = (lightBills || [])
        .filter((b) => b.status === "paid")
        .reduce((s, b) => s + Number(b.amount), 0);
      const pendingLight = totalLight - paidLight;

      const totalMaint = (otherExpenses || []).reduce(
        (s, x) => s + Number(x.mainAmount || 0),
        0
      );
      const paidMaint = (otherExpenses || [])
        .filter((x) => x.status === "paid")
        .reduce((s, x) => s + Number(x.mainAmount), 0);
      const pendingMaint = totalMaint - paidMaint;

      setSummary({
        beds: { total: totalBeds, occupied, vacant },
        rent: { pending: pendingRents, deposits },
        light: { paid: paidLight, pending: pendingLight },
        maintenance: { paid: paidMaint, pending: pendingMaint },
      });
    });
  }, []);

  // ==== Mobile drawer (UNCHANGED) ====
  const [open, setOpen] = useState(false);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target))
        setOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const dayName = currentTime.toLocaleDateString(undefined, { weekday: "long" });
  const dateString = currentTime.toLocaleDateString();
  const timeString = currentTime.toLocaleTimeString();

  const renderCard = (label, value, bgColor, icon, onClick) => (
    <div className="col-6 col-md-4 col-lg-3 mb-2">
      <div
        className="card border-0 shadow-sm h-100"
        style={{
          backgroundColor: bgColor,
          borderRadius: "12px",
          padding: "10px 8px",
          cursor: onClick ? "pointer" : "default",
        }}
        onClick={onClick}
      >
        <div className="card-body text-center p-2">
          <div className="fs-5 mb-1">{icon}</div>
          <div
            className="small text-uppercase text-muted"
            style={{ fontSize: "0.75rem" }}
          >
            {label}
          </div>
          <div className="fw-semibold" style={{ fontSize: "1rem" }}>
            {value}
          </div>
        </div>
      </div>
    </div>
  );

  const renderBarChart = () => {
    const totalLight = (summary.light.paid || 0) + (summary.light.pending || 0);
    const totalMaintenance =
      (summary.maintenance.paid || 0) + (summary.maintenance.pending || 0);
    const totalRent = (summary.rent.deposits || 0) + (summary.rent.pending || 0);

    const getPercent = (value, total) => (total ? (value / total) * 100 : 0);

    const data = [
      {
        name: "Light Bill",
        paid: getPercent(summary.light.paid, totalLight),
        pending: getPercent(summary.light.pending, totalLight),
      },
      {
        name: "Maintenance",
        paid: getPercent(summary.maintenance.paid, totalMaintenance),
        pending: getPercent(summary.maintenance.pending, totalMaintenance),
      },
      {
        name: "Rent",
        paid: getPercent(summary.rent.deposits, totalRent),
        pending: getPercent(summary.rent.pending, totalRent),
      },
    ];

    return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value.toFixed(0)}%`}
          />
          <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
          <Legend verticalAlign="top" height={36} />
          <Bar
            dataKey="paid"
            name="Paid"
            fill="#3db7b1"
            radius={[10, 10, 0, 0]}
          />
          <Bar
            dataKey="pending"
            name="Pending"
            fill="#1e3a8a"
            radius={[10, 10, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderPieCharts = () => {
    const pieData = [
      {
        title: "Rent Status",
        data: [
          { name: "Deposits", value: summary.rent.deposits || 0 },
          { name: "Pending", value: summary.rent.pending || 0 },
        ],
      },
      {
        title: "Light Bill Status",
        data: [
          { name: "Paid", value: summary.light.paid || 0 },
          { name: "Pending", value: summary.light.pending || 0 },
        ],
      },
      {
        title: "Maintenance Status",
        data: [
          { name: "Paid", value: summary.maintenance.paid || 0 },
          { name: "Pending", value: summary.maintenance.pending || 0 },
        ],
      },
      {
        title: "Bed Occupancy",
        data: [
          { name: "Occupied", value: summary.beds.occupied || 0 },
          { name: "Vacant", value: summary.beds.vacant || 0 },
        ],
      },
    ];

    return (
      <div className="row g-3 mt-2 px-2">
        {pieData.map((chart, idx) => (
          <div className="col-12 col-md-6 col-lg-3" key={idx}>
            <div className="bg-white p-2 rounded shadow-sm h-100 text-center">
              <h6 className="text-primary mb-2">{chart.title}</h6>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={chart.data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    label
                  >
                    {chart.data.map((entry, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={COLORS[i % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className="d-flex"
      style={{
        minHeight: "100vh",
        fontFamily: "Inter, sans-serif",
        backgroundColor: "#f8f9fa",
      }}
    >
      {/* Topbar */}
      <style>{`
        .md-topbar { display:none; }
        @media (max-width: 991.98px){
          .md-topbar{
            display:flex;
            position: fixed; top:0; left:0; right:0; height:56px; z-index: 1040;
            align-items:center; justify-content:space-between;
            padding:12px 16px; background:#1e3a8a; color:#fff;
            box-shadow:0 2px 10px rgba(0,0,0,0.2);
          }
          .md-iconbtn{
            display:inline-flex; align-items:center; justify-content:center;
            padding:8px; border:0; border-radius:8px; background:transparent; color:#fff; cursor:pointer;
          }
          .md-backdrop{
            position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:1035;
          }
          nav.md-drawer{
            transform: translateX(-100%);
            transition: transform .3s ease-in-out;
            top:56px;
            height: calc(100vh - 56px) !important;
          }
          nav.md-drawer.open{ transform: translateX(0); }
          nav.md-drawer .md-desktop-heading{ display:none !important; }
          main.md-shell{
            margin-left: 0 !important;
            padding-top: 72px !important;
          }
        }
      `}</style>

      <div className="md-topbar">
        <button
          className="md-iconbtn"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeWidth="2"
              strokeLinecap="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>
          Hostel Manager
        </div>
        <span style={{ width: 24 }} />
      </div>

      {open && <div className="md-backdrop" onClick={() => setOpen(false)} />}

      {/* SIDEBAR */}
      <nav
        ref={drawerRef}
        className={`position-fixed text-white p-3 md-drawer ${
          open ? "open" : ""
        }`}
        style={{
          width: 250,
          height: "100vh",
          backgroundColor: "#1e3a8a",
          zIndex: 1045,
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div>
          <h2 className="text-center fw-bold mb-4 mt-2 md-desktop-heading">
            Hostel Manager
          </h2>

          <ul className="list-unstyled mt-3" style={{ textAlign: "left" }}>
            {menuItems.map((item, idx) => {
              const hasChildren = Array.isArray(item.children) && item.children.length > 0;
              const isOpen = openSubmenu === item.label;

              if (!hasChildren) {
                return (
                  <li
                    key={idx}
                    onClick={() => {
                      handleNavigation(item.path, item.state);
                      setOpen(false);
                      setOpenSubmenu(null);
                    }}
                    className="mb-2 px-3 py-2 rounded"
                    style={{ cursor: "pointer" }}
                  >
                    {item.icon} <span className="ms-2">{item.label}</span>
                  </li>
                );
              }

              return (
                <li
                  key={idx}
                  className="mb-2 rounded"
                  onMouseEnter={() => setOpenSubmenu(item.label)}
                  onMouseLeave={() => setOpenSubmenu((current) => (current === item.label ? null : current))}
                >
                  <div
                    onClick={() => toggleSubmenu(item.label)}
                    className="px-3 py-2 rounded d-flex align-items-center justify-content-between"
                    style={{ cursor: "pointer" }}
                  >
                    <span>
                      {item.icon} <span className="ms-2">{item.label}</span>
                    </span>
                    <span style={{ fontSize: "0.85rem" }}>{isOpen ? "v" : ">"}</span>
                  </div>

                  <ul
                    className="list-unstyled ms-4 mt-1"
                    style={{ display: isOpen ? "block" : "none" }}
                  >
                    {item.children.map((child) => (
                      <li
                        key={child.label}
                        onClick={() => {
                          handleNavigation(child.path, child.state);
                          setOpen(false);
                          setOpenSubmenu(null);
                        }}
                        className="px-3 py-2 rounded mb-1"
                        style={{
                          cursor: "pointer",
                          fontSize: "0.95rem",
                          backgroundColor: "rgba(255,255,255,0.08)",
                        }}
                      >
                        {child.label}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
            <li
              onClick={() => {
                handleLogout();
                setOpen(false);
              }}
              className="px-3 py-2 rounded"
              style={{ cursor: "pointer" }}
            >
              <FontAwesomeIcon icon={faSignOutAlt} className="me-2" /> Logout
            </li>
          </ul>
        </div>
        <div className="text-center text-white-50 small mt-4">
          <p>v1.0.0</p>
          <p>© Hostel Manager</p>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main
        className="container-fluid md-shell"
        style={{ marginLeft: 250, paddingTop: 24 }}
      >
        {/* Summary Cards */}
        <section className="row g-2 mb-3 px-2">
          {renderCard(
            "Total Beds",
            summary.beds.total || 0,
            "#76b1d9",
            <MdOutlineBedroomParent />
          )}
          {renderCard(
            "Vacant Beds",
            summary.beds.vacant || 0,
            "#efe89e",
            <MdOutlineBedroomParent />,
            () => findVacantBeds()
          )}

          {renderCard(
            "Pending Rents",
            summary.rent.pending || 0,
            "#ffe0e0",
            <FiBarChart2 />,
            () => setShowPendingRentModal(true)
          )}

          {renderCard(
            "Upcoming Leaves",
            futureLeaveCount,
            "#fde68a",
            <FiBarChart2 />,
            () => setShowFutureLeaveModal(true)
          )}

          {renderCard(
            "Light Bill Paid",
            `₹${summary.light.paid || 0}`,
            "#7897af",
            <MdLightbulbOutline />
          )}
          {renderCard(
            "Light Bill Pending",
            `₹${summary.light.pending || 0}`,
            "#f5d4a0",
            <MdLightbulbOutline />
          )}

          {renderCard(
            "Category Report",
            "Download",
            "#cebaed",
            <MdOutlineReceiptLong />,
            handleDownloadCategoryReport
          )}

          {renderCard(
            "Maintenance Pending",
            `₹${summary.maintenance.pending || 0}`,
            "#afe6f3",
            <MdOutlineReceiptLong />
          )}
        </section>

        {/* WELCOME & BAR CHART */}
        <section className="row g-3 mt-2 px-2">
          <div className="col-12 col-lg-6">
            <div className="bg-white p-3 rounded shadow-sm h-100 text-center">
              <h1 className="text-primary pt-3">Welcome Admin 👋</h1>
              <p>
                Today is <strong>{dayName}</strong>, {dateString},{" "}
                <strong>{timeString}</strong>
              </p>
              <p className="text-muted">
                This dashboard provides a complete overview of the hostel
                management system including bed occupancy, rent collection, light
                bill, and maintenance expenses.
              </p>
            </div>
          </div>
          <div className="col-12 col-lg-6">
            <div className="bg-white p-3 rounded shadow-sm h-100">
              <h5 className="text-primary mb-3 text-center">
                Overall Payment Status (%)
              </h5>
              {renderBarChart()}
            </div>
          </div>
        </section>

        {/* PIE CHARTS */}
        {renderPieCharts()}

        {/* VACANT MODAL */}
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
                              ₹{Number(b.price || 0).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowVacantModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FUTURE LEAVE MODAL */}
        {showFutureLeaveModal && (
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
                  <h5 className="modal-title">Upcoming Leave Tenants</h5>
                  <button
                    type="button"
                    className="modal-x-btn"
                    onClick={() => setShowFutureLeaveModal(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <div className="modal-body">
                  {futureLeaveTenants.length === 0 ? (
                    <p>No upcoming leave tenants.</p>
                  ) : (
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Room</th>
                          <th>Bed</th>
                          <th>Leave Date</th>
                          <th>Deposit (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {futureLeaveTenants.map((t, i) => {
                          const { deposit } = calculateRefund(t);
                          return (
                            <tr key={t._id || i}>
                              <td>{t.name}</td>
                              <td>{t.roomNo}</td>
                              <td>{t.bedNo}</td>
                              <td>
                                {new Date(t.leaveDate).toLocaleDateString()}
                              </td>
                              <td className="fw-semibold text-primary">
                                ₹{deposit.toLocaleString("en-IN")}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowFutureLeaveModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PENDING RENT MODAL (✅ Completed Months Pending Only) */}
        {/* {showPendingRentModal && (
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
                  <h5 className="modal-title">
                    Pending Rents (Completed Months)
                  </h5>

                  <button
                    type="button"
                    className="modal-x-btn"
                    onClick={() => setShowPendingRentModal(false)}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <div className="modal-body">
                  {pendingRentList.length === 0 ? (
                    <p>No pending rents for completed months.</p>
                  ) : (
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Room</th>
                          <th>Bed</th>
                          <th>Phone</th>
                          <th>Monthly Rent (₹)</th>
                          <th>Pending Months</th>
                          <th>Total Due (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingRentList.map((t, i) => {
                          const monthlyRent = getMonthlyRent(t);
                          const pendingMonths = t._pendingMonths || [];
                          const pendingMonthsStr = pendingMonths
                            .map((x) => formatMonYY(x.y, x.m))
                            .join(", ");
                          const dueTotal = t._dueTotal || 0;

                          return (
                            <tr key={t._id || i}>
                              <td>{t.name}</td>
                              <td>{t.roomNo}</td>
                              <td>{t.bedNo}</td>
                              <td>{t.phoneNo || "-"}</td>

                              <td className="fw-semibold">
                                ₹
                                {Number(monthlyRent || 0).toLocaleString(
                                  "en-IN"
                                )}
                              </td>

                              <td>{pendingMonthsStr || "-"}</td>

                              <td className="fw-semibold text-danger">
                                ₹{Number(dueTotal || 0).toLocaleString("en-IN")}
                                <div
                                  className="small text-muted"
                                  style={{ lineHeight: 1 }}
                                >
                                  Rent: ₹
                                  {Number(monthlyRent || 0).toLocaleString(
                                    "en-IN"
                                  )}{" "}
                                  × {pendingMonths.length} month(s)
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowPendingRentModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )} */}
      </main>
    </div>
  );
};

export default MainDashboard;
