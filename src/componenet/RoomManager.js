// src/pages/RoomManager.js
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaBed,
  FaChevronDown,
  FaChevronUp,
  FaEdit,
  FaFilter,
  FaPlus,
  FaSearch,
  FaSlidersH,
  FaTags,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import "../Pages/RoomManager.css";
const ROOM_COLORS = [
  "#eef5ff",
  "#e8f8f5",
  "#fff4e6",
  "#f3e8ff",
  "#eafaf1",
  "#fdecec",
  "#e1f5fe",
  "#f0f4c3",
];

const getRoomColor = (room) => {
  const key = String(room.roomNo || room._id || "");
  let hash = 0;

  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }

  return ROOM_COLORS[Math.abs(hash) % ROOM_COLORS.length];
};
const apiUrl = "   http://localhost:8000/api/rooms"; // change to your prod URL when needed

/* Editable default categories – used only for filter dropdown & optional limits */
const DEFAULT_CATEGORIES = ["Category 1", "Category 2", "Category 3", "Other"];

const CATEGORY_LIMITS_BY_INDEX = [
  { floors: { "0": 10, "1": 10, "2": 10, "3": 10 } },
  { floors: { "0": 10, "1": 10, "2": 10, "3": 10 } },
  { floors: { "0": 10, "1": 10, "2": 10, "3": 10 } },
  { floors: {} }, // other => no strict limit
];

function normalizeFloorKey(value) {
  const s = String(value ?? "").toLowerCase();
  if (/\bground\b|^g$/.test(s)) return "0";
  if (/\b(first|1st)\b/.test(s) || /^\s*1(\D|$)/.test(s)) return "1";
  if (/\b(second|2nd)\b/.test(s) || /^\s*2(\D|$)/.test(s)) return "2";
  if (/\b(third|3rd)\b/.test(s) || /^\s*3(\D|$)/.test(s)) return "3";
  const m = s.match(/\d+/);
  return m ? String(Number(m[0])) : "";
}

function floorLabelFromKey(k) {
  if (k === "0") return "Ground";
  if (k === "1") return "1st";
  if (k === "2") return "2nd";
  if (k === "3") return "3rd";
  return k || "Unknown";
}


// 🔵 Room color helper (safe – no side effects)



// ✅ deterministic hash -> hue
function hashStr(s) {
  const str = String(s ?? "");
  let h = 2166136261; // FNV-1a
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function roomKey(room) {
  // use _id if available (best), else composite key
  return (
    room?._id ||
    room?.id ||
    `${String(room?.category ?? "").trim()}|${String(room?.floorNo ?? "").trim()}|${String(
      room?.roomNo ?? ""
    ).trim()}`
  );
}

function roomColors(room) {
  const key = roomKey(room);
  const h = hashStr(key);

  // deterministic RGB from hash (more unique than hue-only)
  const r = (h & 255);
  const g = ((h >> 8) & 255);
  const b = ((h >> 16) & 255);

  // darker foreground for text/border
  const fr = Math.floor(r * 0.55);
  const fg = Math.floor(g * 0.55);
  const fb = Math.floor(b * 0.55);

  return {
    bg: `rgba(${r}, ${g}, ${b}, 0.18)`,
    fg: `rgb(${fr}, ${fg}, ${fb})`,
  };
}



export default function RoomManager() {
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  // ✅ all typeable, including bedCategory
  const [roomForm, setRoomForm] = useState({
    category: "",
    floorNo: "",
    roomNo: "",
    bedNo: "",
    bedCategory: "",
    bedPrice: "",
  });

  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bedForm, setBedForm] = useState({
    bedNo: "",
    bedCategory: "",
    price: "",
  });

  const [showEditModal, setShowEditModal] = useState(false);
const [editTarget, setEditTarget] = useState({
  roomId: "",
  roomNo: "",
  bedNo: "",
   bedCategory: "",
  price: "",
});


  // 🔴 NEW: Delete bed modal state
  const [showDeleteBedModal, setShowDeleteBedModal] = useState(false);
  const [deleteBedState, setDeleteBedState] = useState({
    roomNo: "",
    beds: [],
    selectedBedNo: "",
    password: "",
  });

  const [showCatEditor, setShowCatEditor] = useState(false);
  const [catDrafts, setCatDrafts] = useState([]);

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [mobileSection, setMobileSection] = useState("room");
  const [showQuickAddForm, setShowQuickAddForm] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const roomSectionRef = React.useRef(null);
  const filterSectionRef = React.useRef(null);
  const categorySectionRef = React.useRef(null);

  const navigate = useNavigate();
  const handleNavigation = (path) => navigate(path);
  const scrollToSection = (ref) => {
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* -------- Load data -------- */

  useEffect(() => {
    const saved = localStorage.getItem("room_categories");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_CATEGORIES.length) {
          setCategories(parsed);
        }
      } catch (_) {}
    }
    fetchRooms();
  }, []);

  useEffect(() => {
    if (search || catFilter) {
      setShowMobileFilters(true);
    }
  }, [search, catFilter]);

  const fetchRooms = async () => {
    try {
      const res = await axios.get(apiUrl);
      setRooms(res.data || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  /* -------- Derived values & limits (optional) -------- */

  const selectedCategoryIndex = useMemo(() => {
    const current = (roomForm.category || "").trim().toLowerCase();
    if (!current) return -1;
    return categories.findIndex(
      (c) => (c || "").trim().toLowerCase() === current
    );
  }, [categories, roomForm.category]);

  const floorKey = useMemo(
    () => normalizeFloorKey(roomForm.floorNo),
    [roomForm.floorNo]
  );

  const currentCountOnFloor = useMemo(() => {
    if (!roomForm.category || !floorKey || selectedCategoryIndex < 0) return 0;
    const catName = categories[selectedCategoryIndex];
    return rooms.filter(
      (r) =>
        (r.category || "").trim().toLowerCase() ===
          (catName || "").trim().toLowerCase() &&
        normalizeFloorKey(r.floorNo) === floorKey
    ).length;
  }, [rooms, roomForm.category, floorKey, categories, selectedCategoryIndex]);

  const limitForFloor = useMemo(() => {
    if (selectedCategoryIndex < 0) return undefined;
    const def = CATEGORY_LIMITS_BY_INDEX[selectedCategoryIndex] || { floors: {} };
    return def.floors[floorKey];
  }, [selectedCategoryIndex, floorKey]);

  const remainingOnFloor = useMemo(() => {
    if (limitForFloor === undefined) return Infinity;
    return Math.max(0, limitForFloor - currentCountOnFloor);
  }, [limitForFloor, currentCountOnFloor]);

  /* -------- Add Room (with optional first bed) -------- */

 const addRoom = async () => {
  const category = roomForm.category.trim();
  const floorNo = roomForm.floorNo.trim();
  const roomNo = roomForm.roomNo.trim();
  const firstBedNo = roomForm.bedNo.trim();
  const firstBedCategory = roomForm.bedCategory.trim();
  const firstBedPrice = roomForm.bedPrice ? Number(roomForm.bedPrice) : null; // ✅ NEW

  if (!category) {
    alert("Please enter a Category.");
    return;
  }
  if (!roomNo) {
    alert("Room No is required.");
    return;
  }
  if (!floorNo) {
    alert("Please enter a Floor.");
    return;
  }

  const normalized = normalizeFloorKey(floorNo);
  const catIndex = categories.findIndex(
    (c) => (c || "").trim().toLowerCase() === category.toLowerCase()
  );

  if (catIndex !== -1 && normalized) {
    const limitConfig = CATEGORY_LIMITS_BY_INDEX[catIndex] || { floors: {} };
    const floorLimit = limitConfig.floors[normalized];
    if (floorLimit !== undefined) {
      const usedOnFloor = rooms.filter(
        (r) =>
          (r.category || "").trim().toLowerCase() ===
            category.trim().toLowerCase() &&
          normalizeFloorKey(r.floorNo) === normalized
      ).length;
      if (usedOnFloor >= floorLimit) {
        alert(
          `Limit reached: ${category} ${floorLabelFromKey(
            normalized
          )} floor allows max ${floorLimit} rooms.`
        );
        return;
      }
    }
  }














const dup = rooms.some(
  (r) =>
    String(r.roomNo).trim().toLowerCase() === roomNo.toLowerCase() &&
    String(r.category || "").trim().toLowerCase() === category.toLowerCase()
);
if (dup) {
  alert("Room already exists in this category.");
  return;
}


  try {
    // 1) Create room
  const created = await axios.post(apiUrl, { category, floorNo, roomNo });
const createdRoom = created.data; // must include _id

if (firstBedNo) {
  await axios.post(`${apiUrl}/${createdRoom._id}/bed`, {
    bedNo: firstBedNo,
    bedCategory: firstBedCategory || "",
    price: firstBedPrice,
  });
}


    // reset form
    setRoomForm({
      category: "",
      floorNo: "",
      roomNo: "",
      bedNo: "",
      bedCategory: "",
      bedPrice: "", // ✅ reset
    });

    fetchRooms();
  } catch (error) {
    console.error("Error adding room:", error);
    alert(
      error.response?.data?.message ||
        "Failed to add room (check console for details)."
    );
  }
};


  /* -------- Bed operations -------- */

  const openAddBedModal = (room) => {
    setSelectedRoom(room);
    setBedForm({ bedNo: "", bedCategory: "", price: "" });
    setShowAddBedModal(true);
  };

  const addBedToRoom = async () => {
    if (!selectedRoom || !bedForm.bedNo.trim()) {
      alert("Bed No is required.");
      return;
    }
    try {
   await axios.post(`${apiUrl}/${selectedRoom._id}/bed`, {
  bedNo: bedForm.bedNo.trim(),
  bedCategory: bedForm.bedCategory.trim(),
  price: bedForm.price ? Number(bedForm.price) : null,
});


      fetchRooms();
      setShowAddBedModal(false);
      setBedForm({ bedNo: "", bedCategory: "", price: "" });
    } catch (err) {
      console.error("Failed to add bed:", err.response?.data || err.message);
      alert("Failed to add bed: " + (err.response?.data?.message || err.message));
    }
  };

const openEditModal = (roomId, roomNo, bedNo, bedCategory, currentPrice) => {
  setEditTarget({
    roomId,
    roomNo,
    bedNo: String(bedNo ?? ""),                 // ✅ correct identifier
    bedCategory: bedCategory ?? "",             // ✅ Upper/Lower
    price: currentPrice ?? "",
  });
  setShowEditModal(true);
};


const updateBedPrice = async () => {
  const bedCategory = (editTarget.bedCategory || "").trim();

  // ✅ price can be blank => clear (backend will set null)
  let priceToSend = undefined;

  if (editTarget.price === "") {
    priceToSend = ""; // tells backend to clear price
  } else {
    const num = Number(editTarget.price);
    if (Number.isNaN(num)) {
      alert("Invalid price.");
      return;
    }
    priceToSend = num;
  }
console.log("PUT URL =>", `${apiUrl}/${editTarget.roomId}/bed/${editTarget.bedNo}`);
console.log("Payload =>", { price: priceToSend, bedCategory });

  try {
    await axios.put(`${apiUrl}/${editTarget.roomId}/bed/${editTarget.bedNo}`, {
      price: priceToSend,
      bedCategory, // ✅ NEW
    });

    setShowEditModal(false);
    fetchRooms();
  } catch (error) {
    console.error("Error updating bed:", error);
    alert(error?.response?.data?.message || "Failed to update bed.");

    console.log("STATUS:", error?.response?.status);
    console.log("DATA:", error?.response?.data);
    console.log("MSG:", error?.message);
  }
};


  /* -------- NEW: Delete bed operations -------- */

  const openDeleteBedModal = (room) => {
    const beds = room.beds || [];
    setDeleteBedState({
      roomNo: room.roomNo,
      beds,
      selectedBedNo: beds[0]?.bedNo || "",
      password: "",
    });
    setShowDeleteBedModal(true);
  };

  const handleDeleteBed = async () => {
    const { roomNo, selectedBedNo, password } = deleteBedState;

    if (!selectedBedNo) {
      alert("Please select a bed to delete.");
      return;
    }

    if (password !== "987654") {
      alert("Invalid password. Bed not deleted.");
      return;
    }

    try {
      await axios.delete(`${apiUrl}/${roomNo}/bed/${selectedBedNo}`);
      setShowDeleteBedModal(false);
      setDeleteBedState({
        roomNo: "",
        beds: [],
        selectedBedNo: "",
        password: "",
      });
      fetchRooms();
    } catch (err) {
      console.error("Failed to delete bed:", err.response?.data || err.message);
      alert(
        "Failed to delete bed: " +
          (err.response?.data?.message || err.message || "")
      );
    }
  };

  /* -------- Category editor -------- */

  const openCategoryEditor = () => {
    setCatDrafts([...categories]);
    setShowCatEditor(true);
  };

  const saveCategoryNames = () => {
    const cleaned = catDrafts.map((c) => (c || "").trim());
    if (cleaned.length !== DEFAULT_CATEGORIES.length || cleaned.some((c) => !c)) {
      alert(`Please provide ${DEFAULT_CATEGORIES.length} non-empty category names.`);
      return;
    }
    setCategories(cleaned);
    localStorage.setItem("room_categories", JSON.stringify(cleaned));
    setShowCatEditor(false);
  };

  const resetDefaultCategories = () => {
    setCatDrafts([...DEFAULT_CATEGORIES]);
  };

  /* -------- UI helpers -------- */

  const modalBackdropStyle = {
    backgroundColor: "rgba(0,0,0,0.5)",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    overflowY: "auto",
    padding: "12px",
    boxSizing: "border-box",
    zIndex: 9999,
  };

  const remainingHint =
    roomForm.category && floorKey
      ? limitForFloor === undefined
        ? "No limit configured for this floor."
        : `Allowed: ${limitForFloor} • Used: ${currentCountOnFloor} • Remaining: ${remainingOnFloor}`
      : "";

  const totalRooms = rooms.length;
  const totalBeds = rooms.reduce((sum, r) => sum + (r.beds?.length || 0), 0);

  const baseFiltered = useMemo(() => {
    const q = (search || "").toLowerCase();
    let list = rooms;

    if (catFilter) {
      list = list.filter((r) => (r.category || "") === catFilter);
    }

    if (!q) return list;
    return list.filter((r) => {
      const inRoom = String(r.roomNo).toLowerCase().includes(q);
      const inFloor =
        (r.floorNo || "").toLowerCase().includes(q) ||
        floorLabelFromKey(normalizeFloorKey(r.floorNo)).toLowerCase().includes(q);
      const inCat = (r.category || "").toLowerCase().includes(q);
      const inBeds = (r.beds || []).some(
        (b) =>
          String(b.bedNo).toLowerCase().includes(q) ||
          String(b.bedCategory || "").toLowerCase().includes(q) ||
          String(b.price ?? "").toLowerCase().includes(q)
      );
      return inRoom || inFloor || inCat || inBeds;
    });
  }, [rooms, search, catFilter]);

  const displayedRooms = baseFiltered;
  const clearFilters = () => {
    setSearch("");
    setCatFilter("");
  };
  const renderModal = (node) =>
    typeof document !== "undefined" ? createPortal(node, document.body) : node;

  /* -------- JSX -------- */
  const editRoomCategoryQuick = async (room) => {
  const current = (room.category || "").trim();
  const next = window.prompt(
    `Edit Category for Room ${room.roomNo}`,
    current
  );

  // user pressed Cancel
  if (next === null) return;

  const category = next.trim();
  if (!category) {
    alert("Category cannot be empty.");
    return;
  }

  try {
    // ✅ IMPORTANT: use room._id (not roomNo)
    await axios.put(`${apiUrl}/${room._id}`, { category });

    // optional: keep dropdown categories updated
    setCategories((prev) =>
      prev.some((c) => (c || "").trim().toLowerCase() === category.toLowerCase())
        ? prev
        : [...prev, category]
    );

    fetchRooms();
  } catch (err) {
    console.error("Failed to update room category:", err.response?.data || err.message);
    alert(err.response?.data?.message || "Failed to update room category.");
  }
  };
  return (
    <div
      className="container-fluid px-3 px-md-4 py-3"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      <div className="room-manager-mobile d-md-none">
        <div className="room-manager-mobile-topbar">
          <button
            type="button"
            className="room-manager-mobile-back"
            onClick={() => handleNavigation("/newcomponant")}
          >
            <FaArrowLeft />
            <span>Back</span>
          </button>

          <div className="room-manager-mobile-topbadge">Rooms &amp; Beds</div>
        </div>

        <div className="room-manager-mobile-hero">
          <div className="room-manager-mobile-hero-copy">
            <div className="room-manager-mobile-kicker">Room Manager</div>
            <h4>Manage rooms and beds</h4>
            <p>
              Add rooms, beds, prices, and categories in a clean mobile app style.
            </p>
          </div>
          <div className="room-manager-mobile-hero-stat">
            <span>Rooms</span>
            <strong>{totalRooms}</strong>
            <small>{totalBeds} beds total</small>
          </div>
        </div>

        <div className="room-manager-mobile-stats">
          <div className="room-manager-mobile-stat-card">
            <span>Total Rooms</span>
            <strong>{totalRooms}</strong>
            <small>Managed rooms</small>
          </div>
          <div className="room-manager-mobile-stat-card">
            <span>Total Beds</span>
            <strong>{totalBeds}</strong>
            <small>Across all floors</small>
          </div>
        </div>

        {/* <div className="room-manager-mobile-actions">
          <button
            type="button"
            className={`room-manager-mobile-action is-primary ${mobileSection === "room" ? "is-active" : ""}`}
            onClick={() => {
              setMobileSection("room");
              setShowQuickAddForm(true);
              scrollToSection(roomSectionRef);
            }}
          >
            <FaPlus />
            <span>Add Room</span>
          </button>
          <button
            type="button"
            className={`room-manager-mobile-action ${mobileSection === "filters" ? "is-active" : ""}`}
            onClick={() => {
              setMobileSection("filters");
              scrollToSection(filterSectionRef);
            }}
          >
            <FaSlidersH />
            <span>Filters</span>
          </button>
          <button
            type="button"
            className={`room-manager-mobile-action ${mobileSection === "categories" ? "is-active" : ""}`}
            onClick={() => {
              setMobileSection("categories");
              openCategoryEditor();
              scrollToSection(categorySectionRef);
            }}
          >
            <FaTags />
            <span>Categories</span>
          </button>
        </div> */}

        <section ref={filterSectionRef} className="room-manager-mobile-filter-wrap">
          <button
            type="button"
            className="room-manager-mobile-filter-toggle"
            onClick={() => setShowMobileFilters((prev) => !prev)}
            aria-expanded={showMobileFilters}
          >
            <span className="room-manager-mobile-filter-toggle-left">
              <FaFilter />
              <span>Filter</span>
            </span>
            <span className="room-manager-mobile-filter-toggle-right">
              <span className="room-manager-mobile-filter-toggle-label">
                {displayedRooms.length} rooms
              </span>
              {showMobileFilters ? <FaChevronUp /> : <FaChevronDown />}
            </span>
          </button>

          {showMobileFilters ? (
            <div className="room-manager-mobile-filter-panel">
              <div className="room-manager-mobile-filter-panel-title">
                <div>
                  <h5>Search &amp; Filter</h5>
                  <span>{displayedRooms.length} rooms shown</span>
                </div>
                <div className="room-manager-mobile-filter-panel-badge">
                  <FaFilter />
                  <span>Filter</span>
                </div>
              </div>

              <label className="room-manager-mobile-filter-chip room-manager-mobile-filter-chip--search">
                <FaSearch className="room-manager-mobile-search-icon" />
                <input
                  type="search"
                  name="room-manager-mobile-search"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  placeholder="Search room"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>

              <label className="room-manager-mobile-filter-chip room-manager-mobile-filter-chip--select">
                <span>Category</span>
                <select
                  className="form-select"
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value)}
                >
                  <option value="">All</option>
                  {categories.map((c, idx) => (
                    <option key={idx} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <div className="room-manager-mobile-filter-actions">
                <button
                  type="button"
                  className="room-manager-mobile-filter-chip room-manager-mobile-filter-chip--ghost"
                  onClick={clearFilters}
                  disabled={!search && !catFilter}
                >
                  <FaTimes />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {showQuickAddForm ? (
          <section ref={roomSectionRef} className="room-manager-mobile-panel">
          <div className="room-manager-mobile-panel-title">
            <div>
              <h5>Quick Add Room</h5>
              <span>Fast entry</span>
            </div>
            <div className="room-manager-mobile-panel-actions">
              <div className="room-manager-mobile-panel-badge room-manager-mobile-panel-badge--soft">
                <FaBed />
                <span>{displayedRooms.length} rooms</span>
              </div>
              <button
                type="button"
                className="room-manager-mobile-close-btn"
                onClick={() => setShowQuickAddForm(false)}
                aria-label="Close quick add form"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          <div className="room-manager-mobile-form-grid">
            <input
              type="text"
              className="form-control"
              placeholder="Category (e.g., Deluxe, Standard)"
              value={roomForm.category}
              onChange={(e) =>
                setRoomForm((prev) => ({ ...prev, category: e.target.value }))
              }
            />

            <input
              type="text"
              className="form-control"
              placeholder="Floor No (e.g., Ground, 1, 2, 3, Basement)"
              value={roomForm.floorNo}
              onChange={(e) =>
                setRoomForm((prev) => ({ ...prev, floorNo: e.target.value }))
              }
            />

            <input
              type="text"
              className="form-control"
              placeholder="Room No (e.g., 203)"
              value={roomForm.roomNo}
              onChange={(e) =>
                setRoomForm((prev) => ({ ...prev, roomNo: e.target.value }))
              }
            />

            <input
              type="text"
              className="form-control"
              placeholder="Bed No (e.g., B1)"
              value={roomForm.bedNo}
              onChange={(e) =>
                setRoomForm((prev) => ({ ...prev, bedNo: e.target.value }))
              }
            />

            <input
              type="text"
              className="form-control"
              placeholder="Bed Category (e.g., Upper, Lower)"
              value={roomForm.bedCategory}
              onChange={(e) =>
                setRoomForm((prev) => ({ ...prev, bedCategory: e.target.value }))
              }
            />

            <input
              type="number"
              className="form-control"
              placeholder="Bed Price (Rs.)"
              value={roomForm.bedPrice}
              onChange={(e) =>
                setRoomForm((prev) => ({ ...prev, bedPrice: e.target.value }))
              }
            />

            <button
              type="button"
              className="room-manager-mobile-submit"
              onClick={addRoom}
            >
              <FaPlus />
              <span>Room</span>
            </button>
          </div>
          </section>
        ) : null}

        <section className="room-manager-mobile-section">
          <div className="room-manager-mobile-section-title">
            <div>
              <h5>Rooms &amp; Beds</h5>
              <span>{displayedRooms.length} rooms</span>
            </div>
          </div>

          <div className="room-manager-mobile-room-list">
            {displayedRooms.map((room) => {
              const norm = normalizeFloorKey(room.floorNo);
              const displayFloor = norm ? floorLabelFromKey(norm) : room.floorNo || "-";
              const bedCount = room.beds?.length || 0;
              const { bg, fg } = roomColors(room);
              const roomStyle = { "--bg": bg, "--fg": fg };

              return (
                <article
                  key={`mobile-${room.category}-${room.floorNo}-${room.roomNo}`}
                  className="room-manager-mobile-room-card"
                >
                  <div className="room-manager-mobile-room-head">
                    <div>
                      <span className="roomNoPill room-manager-mobile-room-pill" style={roomStyle}>
                        Room {room.roomNo}
                      </span>
                      <div className="room-manager-mobile-room-meta">
                        Floor: {displayFloor} {bedCount} bed(s)
                      </div>
                    </div>

                    <button
                      type="button"
                      className="room-manager-mobile-category-pill"
                      onClick={() => editRoomCategoryQuick(room)}
                    >
                      {room.category || "Category"}
                    </button>
                  </div>

                  <div className="room-manager-mobile-bed-list">
                    {(room.beds?.length ? room.beds : []).map((bed, idx) => (
                      <div key={`mobile-${room.roomNo}-${bed.bedNo}-${idx}`} className="room-manager-mobile-bed-row">
                        <div className="room-manager-mobile-bed-copy">
                          <div className="room-manager-mobile-bed-pill-row">
                            <span className="room-manager-mobile-bed-pill">Bed {bed.bedNo}</span>
                            {bed.bedCategory ? (
                              <span className="room-manager-mobile-bed-pill room-manager-mobile-bed-pill--alt">
                                {bed.bedCategory}
                              </span>
                            ) : null}
                          </div>
                          <div className="room-manager-mobile-bed-price">
                            Price:{" "}
                            {bed.price != null ? `Rs. ${Number(bed.price).toLocaleString("en-IN")}` : "—"}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="room-manager-mobile-edit-btn"
                          onClick={() =>
                            openEditModal(
                              room._id,
                              room.roomNo,
                              bed.bedNo,
                              bed.bedCategory ?? "",
                              bed.price ?? ""
                            )
                          }
                        >
                          <FaEdit />
                         
                        </button>
                      </div>
                    ))}

                    {!room.beds?.length && (
                      <div className="room-manager-mobile-empty-bed">No beds yet</div>
                    )}
                  </div>

                  <div className="room-manager-mobile-room-actions">
                    <button
                      type="button"
                      className="room-manager-mobile-room-action room-manager-mobile-room-action--primary"
                      onClick={() => openAddBedModal(room)}
                    >
                      {/* <FaBed /> */}
                      <span>Add Bed</span>
                    </button>

                    {room.beds?.length > 0 ? (
                      <button
                        type="button"
                        className="room-manager-mobile-room-action room-manager-mobile-room-action--danger"
                        onClick={() => openDeleteBedModal(room)}
                      >
                        {/* <FaTrash /> */}
                        <span>Delete Bed</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="room-manager-mobile-room-action room-manager-mobile-room-action--ghost"
                        onClick={() => openAddBedModal(room)}
                      >
                        <FaPlus />
                        <span>Add First Bed</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}

            {!displayedRooms.length && (
              <div className="room-manager-mobile-empty">No rooms match your filters.</div>
            )}
          </div>
        </section>

        <div className="room-manager-mobile-bottom-nav">
          <button
            type="button"
            className={`room-manager-mobile-bottom-action ${mobileSection === "room" ? "is-active" : ""}`}
            onClick={() => {
              setMobileSection("room");
              setShowQuickAddForm(true);
              scrollToSection(roomSectionRef);
            }}
          >
            <span className="room-manager-mobile-bottom-icon">
              <FaPlus />
            </span>
            <span>Add Room</span>
          </button>
          <button
            type="button"
            className={`room-manager-mobile-bottom-action ${mobileSection === "filters" ? "is-active" : ""}`}
            onClick={() => {
              setMobileSection("filters");
              scrollToSection(filterSectionRef);
            }}
          >
            <span className="room-manager-mobile-bottom-icon">
              <FaSlidersH />
            </span>
            <span>Filters</span>
          </button>
          <button
            type="button"
            className={`room-manager-mobile-bottom-action ${mobileSection === "categories" ? "is-active" : ""}`}
            onClick={() => {
              setMobileSection("categories");
              openCategoryEditor();
              scrollToSection(categorySectionRef);
            }}
          >
            <span className="room-manager-mobile-bottom-icon">
              <FaTags />
            </span>
            <span>Categories</span>
          </button>
        </div>
      </div>

      <div className="d-none d-md-block">
        <h3 className="fw-bold mb-3 mb-md-4">Room &amp; Bed Management</h3>

        {/* Toolbar */}
        <div className="card border-0 mb-3" style={{ background: "transparent" }}>
          <div className="card-body p-0">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn me-2"
                  style={{ backgroundColor: "#5f7dfc", color: "white" }}
                  onClick={() => handleNavigation("/newcomponant")}
                >
                  <FaArrowLeft className="me-1" />
                  Back
                </button>
              </div>

              <div className="me-md-auto d-flex align-items-center gap-2">
                <h4 className="fw-bold mb-0 d-none d-md-block">Manage Rooms</h4>
                <span className="badge bg-light text-dark border d-none d-md-inline">
                  Rooms &amp; Beds
                </span>
              </div>

              <div className="w-100 d-md-none">
                <div className="d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Manage Rooms</h5>
                  <span className="badge bg-light text-dark border">
                    Rooms &amp; Beds
                  </span>
                </div>
              </div>

              <div className="ms-md-auto flex-grow-1" style={{ maxWidth: 420 }}>
                <input
                  type="text"
                  name="room-manager-desktop-search"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  className="form-control"
                  placeholder="Search room / bed / floor / category"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button
                className="btn btn-sm btn-outline-secondary ms-auto ms-md-0"
                onClick={openCategoryEditor}
                title="Edit category names"
              >
                ✏️ Edit Categories
              </button>
            </div>
          </div>
        </div>

        {/* Quick Add + KPIs */}
        <div className="row g-3 mb-4">
        {/* Quick Add */}
      <div className="col-12 col-lg-6">
  <div className="bg-white border rounded-3 shadow-sm p-3 h-100">
    <h6 className="text-muted mb-2">Quick Add Room</h6>

    <div className="d-grid" style={{ gap: "8px" }}>

      <input
        type="text"
        className="form-control form-control-sm"
        placeholder="Category (e.g., Deluxe, Standard)"
        value={roomForm.category}
        onChange={(e) =>
          setRoomForm((prev) => ({ ...prev, category: e.target.value }))
        }
      />

      <div>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Floor No (e.g., Ground, 1, 2, 3, Basement)"
          value={roomForm.floorNo}
          onChange={(e) =>
            setRoomForm((prev) => ({ ...prev, floorNo: e.target.value }))
          }
        />
        {remainingHint && floorKey && (
          <small className="text-muted d-block mt-1 text-wrap">
            {roomForm.category && (
              <>
                {roomForm.category} • {floorLabelFromKey(floorKey)}:{" "}
              </>
            )}
            {remainingHint}
          </small>
        )}
      </div>

      <input
        className="form-control form-control-sm"
        placeholder="Room No (e.g., 203)"
        value={roomForm.roomNo}
        onChange={(e) =>
          setRoomForm((prev) => ({ ...prev, roomNo: e.target.value }))
        }
      />

      <input
        className="form-control form-control-sm"
        placeholder="Bed No (e.g., B1)"
        value={roomForm.bedNo}
        onChange={(e) =>
          setRoomForm((prev) => ({ ...prev, bedNo: e.target.value }))
        }
      />

      <input
        className="form-control form-control-sm"
        placeholder="Bed Category (e.g., Upper, Lower)"
        value={roomForm.bedCategory}
        onChange={(e) =>
          setRoomForm((prev) => ({ ...prev, bedCategory: e.target.value }))
        }
      />

      {/* ✅ NEW FIELD: BED PRICE */}
      <input
        type="number"
        className="form-control form-control-sm"
        placeholder="Bed Price (₹)"
        value={roomForm.bedPrice}
        onChange={(e) =>
          setRoomForm((prev) => ({
            ...prev,
            bedPrice: e.target.value,
          }))
        }
      />

    <button
  className="btn btn-sm px-3 text-white"
  style={{ backgroundColor: "#5f7dfc" }}
  onClick={addRoom}
>
  Add
</button>

    </div>
  </div>
</div>


        {/* KPI – Total Rooms */}
        <div className="col-6 col-md-6 col-lg-3">
          <div className="bg-white border rounded-3 shadow-sm p-3 h-100 d-flex align-items-center">
            <div
              className="rounded-circle d-inline-flex justify-content-center align-items-center me-3"
              style={{ width: 42, height: 42, background: "#eef5ff" }}
            >
              <i className="bi bi-door-open" />
            </div>
            <div>
              <div className="text-muted small">Total Rooms</div>
              <div className="fw-bold fs-4">{totalRooms}</div>
            </div>
          </div>
        </div>

        {/* KPI – Total Beds */}
        <div className="col-6 col-md-6 col-lg-3">
          <div className="bg-white border rounded-3 shadow-sm p-3 h-100 d-flex align-items-center">
            <div
              className="rounded-circle d-inline-flex justify-content-center align-items-center me-3"
              style={{ width: 42, height: 42, background: "#eefaf4" }}
            >
              <i className="bi bi-people" />
            </div>
            <div>
              <div className="text-muted small">Total Beds</div>
              <div className="fw-bold fs-4">{totalBeds}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms & Beds Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 w-100">
            <div
              className="d-flex flex-wrap align-items-center gap-2 flex-shrink-0"
              style={{ minWidth: 260 }}
            >
              <label className="form-label mb-0 me-2">Category</label>
              <select
                className="form-select form-select-sm"
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
              >
                <option value="">All</option>
                {categories.map((c, idx) => (
                  <option key={idx} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <h5 className="fw-bold mb-0 text-center flex-grow-1 d-none d-md-block">
              Rooms &amp; Beds
            </h5>

            <div
              className="d-none d-md-block flex-shrink-0"
              style={{ minWidth: 260, visibility: "hidden" }}
            >
              spacer
            </div>

            <h6 className="fw-bold mb-0 d-md-none mt-2 w-100">
              Rooms &amp; Beds
            </h6>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-sm align-middle">
              <thead>
                <tr className="fw-semibold text-secondary">
                  <th style={{ whiteSpace: "nowrap" }}>Room No</th>
                  <th style={{ whiteSpace: "nowrap" }}>Floor</th>
                  <th style={{ whiteSpace: "nowrap" }}>Category</th>
                  <th style={{ minWidth: 320 }}>Beds</th>
                  <th style={{ whiteSpace: "nowrap" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedRooms.map((room) => {
                  const norm = normalizeFloorKey(room.floorNo);
                  const displayFloor = norm
                    ? floorLabelFromKey(norm)
                    : room.floorNo || "-";

                  return (
                 <tr
  key={`${room.category}-${room.floorNo}-${room.roomNo}`}
  style={{ backgroundColor: getRoomColor(room) }}
>
<td className="fw-semibold">
  {(() => {
    const { bg, fg } = roomColors(room); // ✅ PASS room here
    return (
      <span className="roomNoPill" style={{ "--bg": bg, "--fg": fg }}>
        {room.roomNo}
      </span>
    );
  })()}
</td>

                      <td>{displayFloor}</td>
                     <td>
  <span
    className="badge bg-light text-dark border"
    role="button"
    title="Click to edit category"
    style={{ cursor: "pointer" }}
    onClick={() => editRoomCategoryQuick(room)}
  >
    {room.category || "-"}
  </span>
</td>

                      <td>
                        {(room.beds?.length ? room.beds : []).map(
                          (bed, idx, arr) => {
                            const isLast = idx === arr.length - 1;
                            return (
                              <div
                                key={`${room.roomNo}-${bed.bedNo}-${idx}`}
                                className="d-flex justify-content-between align-items-center py-1 flex-wrap"
                                style={
                                  !isLast
                                    ? { borderBottom: "1px solid #9aa0a6" }
                                    : {}
                                }
                              >
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                  <span className="badge rounded-pill bg-secondary">
                                    Bed {bed.bedNo}
                                  </span>
                                  {bed.bedCategory && (
                                    <span className="badge rounded-pill bg-light text-dark border">
                                      {bed.bedCategory}
                                    </span>
                                  )}
                                  <small className="text-muted">
                                    Price:{" "}
                                    {bed.price != null
                                      ? `₹${Number(bed.price).toLocaleString(
                                          "en-IN"
                                        )}`
                                      : "—"}
                                  </small>
                                </div>
                                <button
                                  className="btn btn-sm btn-outline-primary ms-2"
                                 onClick={() =>
  openEditModal(
    room._id,
    room.roomNo,
    bed.bedNo,
     bed.bedCategory ?? "",
    bed.price ?? ""
  )
}

                                >
                                  Edit Price
                                </button>
                              </div>
                            );
                          }
                        )}
                        {!room.beds?.length && (
                          <span className="text-muted">No beds yet</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm"
                          style={{ backgroundColor: "#5f7dfc", color: "white" }}
                          onClick={() => openAddBedModal(room)}
                        >
                          + Add Bed
                        </button>

                        {/* 🔴 NEW: one Delete Bed button per room */}
                        {room.beds?.length > 0 && (
 <button
  className="btn btn-sm btn-outline-primary ms-2"
  style={{ color: "#2ea3f2", borderColor: "#2ea3f2" }}
  onClick={() => openDeleteBedModal(room)}
>
  Delete Bed
</button>


                        )}
                      </td>
                    </tr>
                  );
                })}
                {!displayedRooms.length && (
                  <tr>
                    <td colSpan={5} className="text-center text-muted py-4">
                      No rooms match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Bed Modal */}
      {showAddBedModal && selectedRoom && renderModal(
        <div
          style={modalBackdropStyle}
          onClick={() => setShowAddBedModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{
              width: "100%",
              maxWidth: "560px",
              margin: "0 12px",
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
              <div
                className="modal-content"
                style={{
                  maxHeight: "calc(100vh - 24px)",
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  maxWidth: "520px",
                }}
              >
              <div
                className="modal-header bg-white sticky-top py-2"
                style={{ zIndex: 1 }}
              >
                <h6 className="modal-title mb-0">
                  Add Bed — Room {selectedRoom.roomNo}
                </h6>
               <button
  type="button"
  className="btn-close p-0"
  onClick={() => setShowAddBedModal(false)}
>
  x
</button>

              </div>

              <div className="modal-body py-2" style={{ overflowY: "auto" }}>
                <div className="mb-2">
                  <label className="form-label mb-1">Bed No</label>
                  <input
                    className="form-control form-control-sm"
                    value={bedForm.bedNo}
                    onChange={(e) =>
                      setBedForm((prev) => ({
                        ...prev,
                        bedNo: e.target.value,
                      }))
                    }
                    placeholder="e.g., B3"
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label mb-1">Bed Category</label>
                  <input
                    className="form-control form-control-sm"
                    value={bedForm.bedCategory}
                    onChange={(e) =>
                      setBedForm((prev) => ({
                        ...prev,
                        bedCategory: e.target.value,
                      }))
                    }
                    placeholder="e.g., Upper, Lower"
                  />
                </div>

                <div className="mb-1">
                  <label className="form-label mb-1">
                    Price <span className="text-muted">(optional)</span>
                  </label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text">₹</span>
                    <input
                      type="number"
                      className="form-control"
                      value={bedForm.price}
                      onChange={(e) =>
                        setBedForm((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      placeholder="e.g., 3500"
                      min="0"
                      inputMode="decimal"
                    />
                  </div>
                  <small className="text-muted d-block mt-1">
                    Enter amount in INR
                  </small>
                </div>
              </div>

              <div className="modal-footer py-2 flex-wrap gap-2">
                <button
                  className="btn btn-secondary w-100 w-sm-auto"
                  onClick={() => setShowAddBedModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-success w-100 w-sm-auto"
                  onClick={addBedToRoom}
                >
                  Save Bed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Price Modal */}
      {showEditModal &&
        renderModal(
        <div
          style={modalBackdropStyle}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered "
            style={{
              width: "100%",
              maxWidth: "520px",
              margin: "0 12px",
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="modal-content roommodal"
              style={{
                maxHeight: "calc(100vh - 24px)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                className="modal-header bg-white sticky-top py-2 "
                style={{ zIndex: 1 }}
              >
                <h6 className="modal-title mb-0">
                 Edit Bed — Room {editTarget.roomNo} • Category {editTarget.bedCategory || "-"}

                </h6>
             <button
  type="button"
  className="btn-close btn-close1 p-1"
  onClick={() => setShowEditModal(false)}
>
  x
</button>

              </div>

             <div className="modal-body py-2" style={{ overflowY: "auto" }}>
<div className="mb-2">
  <label className="form-label mb-1">Bed Category</label>
  <input
    type="text"
    className="form-control form-control-sm"
    value={editTarget.bedCategory}
    onChange={(e) =>
      setEditTarget((t) => ({ ...t, bedCategory: e.target.value }))
    }
    placeholder="Upper / Lower"
  />
</div>



  {/* ✅ Price */}
  <label className="form-label mb-1">Price</label>
  <div className="input-group input-group-sm">
    <span className="input-group-text">₹</span>
    <input
      type="number"
      className="form-control"
      value={editTarget.price}
      onChange={(e) =>
        setEditTarget((t) => ({ ...t, price: e.target.value }))
      }
      min="0"
      inputMode="decimal"
      placeholder="e.g., 3500"
    />
  </div>
</div>


              <div className="modal-footer py-2 flex-wrap gap-2">
                <button
                  className="btn btn-secondary w-100 w-sm-auto"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary w-100 w-sm-auto"
                  onClick={updateBedPrice}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 NEW: Delete Bed Modal */}
      {showDeleteBedModal && renderModal(
        <div
          style={modalBackdropStyle}
          onClick={() => setShowDeleteBedModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{
              width: "100%",
              maxWidth: "520px",
              margin: "0 12px",
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="modal-content"
              style={{
                maxHeight: "calc(100vh - 24px)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                className="modal-header bg-white sticky-top py-2"
                style={{ zIndex: 1 }}
              >
                <h6 className="modal-title mb-0">
                  Delete Bed — Room {deleteBedState.roomNo}
                </h6>
               <button
  type="button"
  className="btn-close p-0"
  onClick={() => setShowDeleteBedModal(false)}
>
  x
</button>

              </div>

              <div className="modal-body py-2" style={{ overflowY: "auto" }}>
                <div className="mb-2">
                  <label className="form-label mb-1">Select Bed</label>
                  <select
                    className="form-select form-select-sm"
                    value={deleteBedState.selectedBedNo}
                    onChange={(e) =>
                      setDeleteBedState((prev) => ({
                        ...prev,
                        selectedBedNo: e.target.value,
                      }))
                    }
                  >
                    <option value="">-- Select Bed --</option>
                    {deleteBedState.beds.map((b) => (
                      <option key={b.bedNo} value={b.bedNo}>
                        Bed {b.bedNo}
                        {b.bedCategory ? ` (${b.bedCategory})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="form-label mb-1">
                    Password (required to delete)
                  </label>
                  <input
                    type="password"
                    name="delete-bed-password"
                    autoComplete="new-password"
                    className="form-control form-control-sm"
                    value={deleteBedState.password}
                    onChange={(e) =>
                      setDeleteBedState((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Enter password"
                  />
               
                </div>

                <div className="alert alert-warning small mt-2">
                  This will permanently remove the selected bed from this room.
                </div>
              </div>

              <div className="modal-footer py-2 flex-wrap gap-2">
                <button
                  className="btn btn-secondary w-100 w-sm-auto"
                  onClick={() => setShowDeleteBedModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger w-100 w-sm-auto"
                  onClick={handleDeleteBed}
                >
                  Delete Bed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Editor Modal */}
      {showCatEditor &&
        renderModal(
        <div style={modalBackdropStyle} onClick={() => setShowCatEditor(false)}>
          <div
            className="modal-dialog modal-dialog-centered modal-fullscreen-sm-down"
            style={{ maxWidth: "720px", margin: "1rem" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-content" style={{ width: "100%", maxWidth: "720px" }}>
              <div
                className="modal-header sticky-top bg-white"
                style={{ zIndex: 1 }}
              >
                <h5 className="modal-title">Edit Category Names</h5>
                <button
  type="button"
  className="btn-close p-0"
  onClick={() => setShowCatEditor(false)}
>
  x
</button>

              </div>

              <div
                className="modal-body p-3"
                style={{ maxHeight: "70vh", overflow: "auto" }}
              >
                <div className="alert alert-info small">
                  Order matters: limits are tied to index (0–
                  {DEFAULT_CATEGORIES.length - 1}).
                </div>

                <div className="row g-2">
                  {catDrafts.map((val, idx) => (
                    <div className="col-12 col-md-6" key={idx}>
                      <label className="form-label small">
                        Category {idx + 1}
                      </label>
                      <input
                        className="form-control form-control-sm"
                        value={val}
                        onChange={(e) =>
                          setCatDrafts((prev) => {
                            const copy = [...prev];
                            copy[idx] = e.target.value;
                            return copy;
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer flex-wrap gap-2">
                <button
                  className="btn btn-outline-secondary"
                  onClick={resetDefaultCategories}
                >
                  Reset Defaults
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowCatEditor(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-success"
                  onClick={saveCategoryNames}
                >
                  Save Categories
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
