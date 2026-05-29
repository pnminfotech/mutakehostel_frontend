import React, { useEffect, useMemo, useState } from "react";
import { FaDownload, FaBolt,  FaPlus, FaRedoAlt  } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import { HiHome } from "react-icons/hi";
import { FaArrowLeft } from "react-icons/fa";
import { FaTachometerAlt } from "react-icons/fa";
import { MdOutlineElectricBolt } from "react-icons/md";
import { FiBell, FiDownload, FiChevronRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import MobileMonthNavigator from "../componenet/MobileMonthNavigator";
import "../Pages/lightbill.css";
import "../componenet/RentTracker.css";
const LightBill = ({ embedded, propertyScope = null }) => {
  const navigate = useNavigate();

  const hideNav = embedded === true;
  const scopedRoomNos = (propertyScope?.roomNos || []).map((roomNo) => String(roomNo));
  const scopedOptionLabels = propertyScope?.optionLabels || {};
  const scopedRoomTypeMap = propertyScope?.roomTypeMap || {};
  const scopedRoomCategoryMap = propertyScope?.roomCategoryMap || {};
  const scopedCategories = propertyScope?.categories || [];
  const scopedRoomNosByType = {
    bed: new Set((propertyScope?.roomNosByType?.bed || []).map((roomNo) => String(roomNo).trim())),
    room: new Set((propertyScope?.roomNosByType?.room || []).map((roomNo) => String(roomNo).trim())),
    shop: new Set((propertyScope?.roomNosByType?.shop || []).map((roomNo) => String(roomNo).trim())),
  };
  const hasRoomScope = scopedRoomNos.length > 0;
  const scopeLabel = propertyScope?.label || "Bed-wise";
  const scopeType = String(propertyScope?.type || "").toLowerCase();
  const showRoomSelector = hasRoomScope && scopeType !== "bed";
  const showCategorySelector = showRoomSelector && scopedCategories.length > 0;
  const scopeUnitLabel =
    scopeType === "shop" ? "Shop" : scopeType === "mixed" ? "Room / Shop" : "Room";
  const getScopedDisplayLabel = (roomNo) => {
    const key = String(roomNo || "").trim();
    if (!key) return "-";
    return scopedOptionLabels[key] || key;
  };
  const normalizeBillPropertyType = (bill = {}) => {
    const explicitType = String(bill?.propertyType || "").trim().toLowerCase();
    if (explicitType === "bed" || explicitType === "room" || explicitType === "shop") {
      return explicitType;
    }

    const roomNo = String(bill?.roomNo || "").trim();
    if (!roomNo) return "bed";

    const isBed = scopedRoomNosByType.bed.has(roomNo);
    const isRoom = scopedRoomNosByType.room.has(roomNo);
    const isShop = scopedRoomNosByType.shop.has(roomNo);

    if (isBed && !isRoom && !isShop) return "bed";
    if (isRoom && !isBed && !isShop) return "room";
    if (isShop && !isBed && !isRoom) return "shop";
    if (isBed && (isRoom || isShop)) return "bed";

    return String(scopedRoomTypeMap[roomNo] || "").trim().toLowerCase() || "bed";
  };

  const [lightBills, setLightBills] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(0);
  const currentMonthIndex = new Date().getMonth();
  const [mobileMonthStart, setMobileMonthStart] = useState(
    Math.max(Math.min(currentMonthIndex - 1, 9), 0)
  );

  const [selectedBill, setSelectedBill] = useState(null);

  const [newEntry, setNewEntry] = useState({
    type: "meter",
    category: "",
    roomNo: "",
    meterNo: "",
    totalReading: "",
    amount: "",
    month: "",
    year: new Date().getFullYear(),
    status: "pending",
  });

  const [updatedTotalReading, setUpdatedTotalReading] = useState("");
  const [updatedAmount, setUpdatedAmount] = useState("");
  const [updatedDate, setUpdatedDate] = useState("");
  const [updatedStatus, setUpdatedStatus] = useState("");

  const months = [
    { value: 0, label: "All Months" },
    { value: 1, label: "Jan" },
    { value: 2, label: "Feb" },
    { value: 3, label: "Mar" },
    { value: 4, label: "Apr" },
    { value: 5, label: "May" },
    { value: 6, label: "Jun" },
    { value: 7, label: "Jul" },
    { value: 8, label: "Aug" },
    { value: 9, label: "Sep" },
    { value: 10, label: "Oct" },
    { value: 11, label: "Nov" },
    { value: 12, label: "Dec" },
  ];

  const years = [];
  for (let y = selectedYear - 2; y <= selectedYear + 2; y++) years.push(y);

  useEffect(() => {
    fetchLightBills();
  }, []);

  const fetchLightBills = async () => {
    try {
      const res = await fetch("https://hosteldemo-api.pnminfotech.com//api/light-bill/all");
      const data = await res.json();
      setLightBills(
        Array.isArray(data)
          ? data.map((item) => ({
              ...item,
              propertyType: normalizeBillPropertyType(item),
            }))
          : []
      );
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLightBills = lightBills.filter((item) => {
    const propertyType = normalizeBillPropertyType(item);
    const matchesScope =
      scopeType === "mixed"
        ? propertyType === "room" || propertyType === "shop"
        : propertyType === scopeType;
    const dt = new Date(item.date);
    const matchesYear = dt.getFullYear() === selectedYear;
    const matchesMonth =
      selectedMonth === 0 || dt.getMonth() + 1 === selectedMonth;

    return matchesScope && matchesYear && matchesMonth;
  });

  const existingMetersByRoom = useMemo(() => {
    const map = new Map();

    (lightBills || []).forEach((item) => {
      const roomKey = String(item.roomNo || "").trim();
      const meterKey = String(item.meterNo || item.name || "").trim();
      const itemDate = new Date(item.date || 0).getTime();

      if (!roomKey || !meterKey) return;

      if (!map.has(roomKey)) {
        map.set(roomKey, []);
      }

      const existing = map.get(roomKey);
      if (!existing.some((entry) => entry.meterNo === meterKey)) {
        existing.push({ meterNo: meterKey, dateValue: itemDate });
      }
    });

    map.forEach((entries, key) => {
      entries.sort((a, b) => b.dateValue - a.dateValue);
      map.set(
        key,
        entries.map((entry) => entry.meterNo)
      );
    });

    return map;
  }, [lightBills]);

  const existingMeterOptions = useMemo(() => {
    const roomKey = String(newEntry.roomNo || "").trim();
    return roomKey ? existingMetersByRoom.get(roomKey) || [] : [];
  }, [existingMetersByRoom, newEntry.roomNo]);

  const scopedExistingMeters = useMemo(() => {
    const map = new Map();

    (lightBills || []).forEach((item) => {
      const roomNo = String(item.roomNo || "").trim();
      const meterNo = String(item.meterNo || item.name || "").trim();
      const category = String(item.category || "").trim();
      const itemDate = new Date(item.date || 0).getTime();
      const matchesScope =
        scopeType === "bed"
          ? !roomNo || scopedRoomNos.includes(roomNo)
          : !hasRoomScope || scopedRoomNos.includes(roomNo);

      if (!matchesScope || !meterNo) return;

      const mapKey = `${roomNo}__${meterNo}`.toLowerCase();
      const current = map.get(mapKey);
      if (!current || itemDate > current.dateValue) {
        map.set(mapKey, {
          roomNo,
          meterNo,
          category,
          dateValue: itemDate,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.dateValue - a.dateValue);
  }, [hasRoomScope, lightBills, scopeType, scopedRoomNos]);

  const globalExistingMeterOptions = useMemo(
    () =>
      scopedExistingMeters.map((entry) => ({
        ...entry,
        key: `${entry.roomNo}__${entry.meterNo}`,
        label: entry.roomNo ? `${entry.roomNo} | ${entry.meterNo}` : entry.meterNo,
      })),
    [scopedExistingMeters]
  );

  const filteredScopedRoomNos = useMemo(() => {
    const baseList = showCategorySelector
      ? (() => {
          const selectedCategory = String(newEntry.category || "").trim().toLowerCase();
          if (!selectedCategory) return [];
          return scopedRoomNos.filter(
            (roomNo) =>
              String(scopedRoomCategoryMap[roomNo] || "").trim().toLowerCase() === selectedCategory
          );
        })()
      : scopedRoomNos;

    const seen = new Set();
    return baseList.filter((roomNo) => {
      const key = String(roomNo || "").trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [newEntry.category, scopedRoomCategoryMap, scopedRoomNos, showCategorySelector]);

  useEffect(() => {
    if (!showAddModal) return;
    if (String(newEntry.meterNo || "").trim()) return;
    if (!existingMeterOptions.length) return;

    setNewEntry((prev) => {
      if (String(prev.meterNo || "").trim()) return prev;
      return { ...prev, meterNo: existingMeterOptions[0] };
    });
  }, [existingMeterOptions, newEntry.meterNo, showAddModal]);

  useEffect(() => {
    if (!showAddModal) return;
    if (showRoomSelector) return;
    if (String(newEntry.meterNo || "").trim()) return;
    if (!globalExistingMeterOptions.length) return;

    const firstOption = globalExistingMeterOptions[0];
    setNewEntry((prev) => {
      if (String(prev.meterNo || "").trim()) return prev;
      return {
        ...prev,
        category: prev.category || firstOption.category || "",
        roomNo: prev.roomNo || firstOption.roomNo || "",
        meterNo: firstOption.meterNo,
      };
    });
  }, [globalExistingMeterOptions, newEntry.meterNo, showAddModal, showRoomSelector]);

  const groupData = (dataList) => {
    const matrix = {};
    const monthMap = new Map();

    dataList.forEach((item) => {
      const roomKey = String(item.roomNo || "").trim();
      const meterKey = String(item.meterNo || item.name || "No Meter").trim();
      const name = roomKey ? `${roomKey} | ${meterKey}` : meterKey;
      const date = new Date(item.date);
      const monthIndex = date.getMonth() + 1;
      const monthLabel = months[monthIndex]?.label;

      const key = `${name}_${monthLabel}`;
      if (
        !monthMap.has(key) ||
        new Date(item.date) > new Date(monthMap.get(key).date)
      ) {
        monthMap.set(key, item);
      }
    });

    monthMap.forEach((item) => {
      const name = item.meterNo;
      const monthIndex = new Date(item.date).getMonth() + 1;
      const monthLabel = months[monthIndex]?.label;

      if (!matrix[name]) matrix[name] = {};
      matrix[name][monthLabel] = item;
    });

    return matrix;
  };

  const handleAddEntry = async () => {
    try {
      if (showCategorySelector && !String(newEntry.category || "").trim()) {
        return alert("Select Category");
      }
      if (showRoomSelector && !String(newEntry.roomNo || "").trim()) {
        return alert(`Select ${scopeUnitLabel}`);
      }
      const resolvedMeterNo =
        String(newEntry.meterNo || "").trim() ||
        String(existingMeterOptions[0] || "").trim();
      if (!resolvedMeterNo) return alert("Enter Meter No");
      const monthNumber = months.find((m) => m.label === newEntry.month)?.value;
      if (!monthNumber) return alert("Select valid month");

      const formattedDate = `${newEntry.year}-${String(monthNumber).padStart(
        2,
        "0"
      )}-01`;

      const bodyData = {
        type: "meter",
        propertyType:
          scopeType === "mixed"
            ? String(scopedRoomTypeMap[String(newEntry.roomNo || "").trim()] || "").trim().toLowerCase()
            : scopeType,
        name: resolvedMeterNo,
        category:
          String(newEntry.category || scopedRoomCategoryMap[newEntry.roomNo] || "").trim() || undefined,
        roomNo: showRoomSelector ? newEntry.roomNo : "",
        meterNo: resolvedMeterNo,
        totalReading: newEntry.totalReading,
        amount: newEntry.amount,
        status: newEntry.status,
        date: formattedDate,
      };

      const res = await fetch("https://hosteldemo-api.pnminfotech.com//api/light-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) throw new Error("Failed");

      alert("Light Bill Added!");
      setShowAddModal(false);
      setNewEntry({
        type: "meter",
        category: "",
        roomNo: "",
        meterNo: "",
        totalReading: "",
        amount: "",
        month: "",
        year: new Date().getFullYear(),
        status: "pending",
      });

      fetchLightBills();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (bill) => {
    setSelectedBill(bill);
    setUpdatedTotalReading(bill.totalReading);
    setUpdatedAmount(bill.amount);
    setUpdatedDate(bill.date?.slice(0, 10));
    setUpdatedStatus(bill.status);
    setShowEditModal(true);
  };

  const handleUpdateSubmit = async () => {
    try {
      const bodyData = {
        ...selectedBill,
        propertyType: normalizeBillPropertyType(selectedBill),
        totalReading: updatedTotalReading,
        amount: updatedAmount,
        date: updatedDate,
        status: updatedStatus,
      };

      const res = await fetch(
        `https://hosteldemo-api.pnminfotech.com//api/light-bill/${selectedBill._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyData),
        }
      );

      if (!res.ok) throw new Error("Update failed");

      alert("Updated Successfully!");
      setShowEditModal(false);
      fetchLightBills();
    } catch (err) {
      alert("Update failed");
    }
  };

  const handleDelete = async (bill) => {
    if (!window.confirm("Delete this bill?")) return;

    try {
      const res = await fetch(`https://hosteldemo-api.pnminfotech.com//api/light-bill/${bill._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      alert("Deleted!");
      fetchLightBills();
    } catch (err) {
      alert(err.message);
    }
  };

  const downloadExcel = () => {
    const formatted = filteredLightBills.map((item, idx) => ({
      "Sr No.": idx + 1,
      [scopeUnitLabel]: getScopedDisplayLabel(item.roomNo),
      "Meter No": item.meterNo,
      "Total Reading": item.totalReading,
      Amount: item.amount,
      Date: new Date(item.date).toLocaleDateString(),
      Status: item.status,
    }));

    const sheet = XLSX.utils.json_to_sheet(formatted);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "LightBills");
    XLSX.writeFile(book, `LightBill-${selectedYear}.xlsx`);
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/maindashboard");
  };

  const grouped = groupData(filteredLightBills);

  const getStatusText = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "paid") return "Paid";
    if (s === "pending") return "Pending";
    if (s === "upcoming") return "Upcoming";
    return "Due";
  };

  const getStatusTone = (status = "") => {
    const normalized = String(status).toLowerCase();
    if (normalized.startsWith("paid")) return "paid";
    if (normalized.startsWith("due")) return "due";
    if (normalized.startsWith("pend")) return "pend";
    if (normalized.startsWith("upcoming")) return "upcoming";
    return "pend";
  };

  const monthOptions = months.filter((m) => m.value !== 0);
  const mobileMonthLimit = Math.max(monthOptions.length - 3, 0);
  const mobileVisibleMonths = monthOptions.slice(mobileMonthStart, mobileMonthStart + 3);

  useEffect(() => {
    const nextStart =
      selectedMonth === 0
        ? Math.max(Math.min(currentMonthIndex - 1, mobileMonthLimit), 0)
        : Math.max(Math.min(selectedMonth - 2, mobileMonthLimit), 0);

    setMobileMonthStart(nextStart);
  }, [selectedMonth, selectedYear, currentMonthIndex, mobileMonthLimit]);

  const handleMobilePrevMonth = () => {
    setMobileMonthStart((prev) => Math.max(prev - 1, 0));
  };

  const handleMobileNextMonth = () => {
    setMobileMonthStart((prev) => Math.min(prev + 1, mobileMonthLimit));
  };

  const mobileFilteredLightBills = filteredLightBills;

  const mobileGrouped = groupData(mobileFilteredLightBills);
  const mobileGroupedEntries = Object.entries(mobileGrouped);
  const roomShopLightSummary = useMemo(() => {
    return filteredLightBills.reduce(
      (acc, item) => {
        if (String(item?.type || "").toLowerCase() !== "meter") return acc;

        const unitType = normalizeBillPropertyType(item);
        if (unitType !== "room" && unitType !== "shop") return acc;

        const amount = Number(item?.amount || 0);
        if (!Number.isFinite(amount)) return acc;

        if (unitType === "room") {
          acc.totalRoom += amount;
          if (String(item?.status || "").toLowerCase() !== "paid") {
            acc.pendingRoom += amount;
          }
        }

        if (unitType === "shop") {
          acc.totalShop += amount;
          if (String(item?.status || "").toLowerCase() !== "paid") {
            acc.pendingShop += amount;
          }
        }

        return acc;
      },
      {
        totalRoom: 0,
        totalShop: 0,
        pendingRoom: 0,
        pendingShop: 0,
      }
    );
  }, [filteredLightBills, scopedRoomTypeMap]);
  const hostelLightSummary = useMemo(() => {
    return filteredLightBills.reduce(
      (acc, item) => {
        if (String(item?.type || "").toLowerCase() !== "meter") return acc;

        const amount = Number(item?.amount || 0);
        if (!Number.isFinite(amount)) return acc;

        acc.total += amount;
        if (String(item?.status || "").toLowerCase() !== "paid") {
          acc.pending += amount;
        }

        return acc;
      },
      { total: 0, pending: 0 }
    );
  }, [filteredLightBills]);

  return (
    <div className="container-fluid  light-bill-page">
      {!hideNav && (
        <div className="d-flex gap-2 mb-3 light-bill-top-nav">
          <button
            className="btn"
            style={{ backgroundColor: "#3db7b1", color: "white" }}
            onClick={() => navigate("/NewComponant")}
          >
            <HiHome className="me-1" />
            Rent & Deposit
          </button>

          <button
            className="btn btn-dark"
            onClick={handleGoBack}
          >
            <FaArrowLeft className="me-1" />
            Back
          </button>
        </div>
      )}

      {/* DESKTOP / TABLE HEADER */}
      <div className="light-bill-desktop-view">
        <div className="d-flex  align-items-center gap-2 mb-3">
          <div className="section-icon">⚡</div>
          <div className="section-text">{scopeLabel} Monthly Expense – Light Bill</div>
        </div>

        <div className="filter-bar mb-3">
          <select
            className="form-select"
            style={{ width: "120px" }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: "120px" }}
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn"
            style={{ backgroundColor: "rgb(85, 114, 241)", color: "white" }}
            onClick={() => setShowAddModal(true)}
          >
            Add Light Bill
          </button>

          <button
            className="btn"
            style={{ backgroundColor: "rgb(85, 114, 241)", color: "white" }}
            onClick={downloadExcel}
          >
            <FaDownload className="me-1" />
            Download Excel
          </button>
        </div>

        {scopeType === "bed" && (
          <div className="row g-3 mb-4 justify-content-start">
            <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
              <div className="bg-white border rounded shadow-sm p-3 text-center">
                <h6 className="text-muted mb-1">Total Hostel Light Bill</h6>
                <h4 className="fw-bold mb-0">
                  ₹{Number(hostelLightSummary.total || 0).toLocaleString("en-IN")}
                </h4>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
              <div className="bg-white border rounded shadow-sm p-3 text-center">
                <h6 className="text-muted mb-1">Pending Hostel Light Bill</h6>
                <h4 className="fw-bold text-danger mb-0">
                  ₹{Number(hostelLightSummary.pending || 0).toLocaleString("en-IN")}
                </h4>
              </div>
            </div>
          </div>
        )}

        {scopeType === "mixed" && (
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6 col-xl-3">
              <div className="bg-white border rounded shadow-sm p-3 text-center">
                <h6 className="text-muted mb-1">Total Room Light Bill</h6>
                <h4 className="fw-bold mb-0">
                  ₹{Number(roomShopLightSummary.totalRoom || 0).toLocaleString("en-IN")}
                </h4>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <div className="bg-white border rounded shadow-sm p-3 text-center">
                <h6 className="text-muted mb-1">Total Shop Light Bill</h6>
                <h4 className="fw-bold mb-0">
                  ₹{Number(roomShopLightSummary.totalShop || 0).toLocaleString("en-IN")}
                </h4>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <div className="bg-white border rounded shadow-sm p-3 text-center">
                <h6 className="text-muted mb-1">Pending Room Light Bill</h6>
                <h4 className="fw-bold text-danger mb-0">
                  ₹{Number(roomShopLightSummary.pendingRoom || 0).toLocaleString("en-IN")}
                </h4>
              </div>
            </div>
            <div className="col-12 col-md-6 col-xl-3">
              <div className="bg-white border rounded shadow-sm p-3 text-center">
                <h6 className="text-muted mb-1">Pending Shop Light Bill</h6>
                <h4 className="fw-bold text-danger mb-0">
                  ₹{Number(roomShopLightSummary.pendingShop || 0).toLocaleString("en-IN")}
                </h4>
              </div>
            </div>
          </div>
        )}

        <div className="table-responsive mt-3">
          <div className="light-table-wrapper">
            <table className="table light-bill-table align-middle">
              <thead>
                <tr>
                  {hasRoomScope && <th>{scopeUnitLabel}</th>}
                  <th>Meter No</th>
                  {months
                    .filter((m) => m.value !== 0)
                    .map((m) => (
                      <th key={m.value}>{m.label}</th>
                    ))}
                </tr>
              </thead>

              <tbody>
                {Object.entries(grouped).map(([meter, monthData]) => (
                  <tr key={meter}>
                    {(() => {
                      const sampleItem = Object.values(monthData).find(Boolean);
                      return (
                        <>
                          {hasRoomScope && (
                            <td>
                              <b>{getScopedDisplayLabel(sampleItem?.roomNo)}</b>
                            </td>
                          )}
                          <td>
                            <b>{sampleItem?.meterNo || meter}</b>
                          </td>
                        </>
                      );
                    })()}

                    {months
                      .filter((m) => m.value !== 0)
                      .map((monthObj) => {
                        const item = monthData[monthObj.label];
                        return (
                          <td
                            key={monthObj.label}
                            style={{ cursor: item ? "pointer" : "default" }}
                            onClick={() => item && handleEdit(item)}
                          >
                            {item ? (
                              <>
                                <FaBolt style={{ color: "#e37727" }} /> ₹
                                {item.amount}
                                <br />
                                <small className="text-muted">
                                  <FaTachometerAlt className="me-1 text-success" />
                                  {item.totalReading}
                                </small>
                                <br />
                                <span
                                  className={`badge ${
                                    item.status === "paid"
                                      ? "bg-success"
                                      : "bg-warning text-dark"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </>
                            ) : (
                              "-"
                            )}
                          </td>
                        );
                      })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MOBILE VIEW */}
      <div className="light-bill-mobile-view rent-mobile-view">
        <div className="lb-mobile-shell rent-mobile-shell">
          <div className=" rent-mobile-section">
            <div className="rent-mobile-topbar section-text1">
             
               <div className="rent-mobile-topbar">
                           <button
                             type="button"
                             className="rent-mobile-leaved-btn"
                             onClick={handleGoBack}
                           >
                             <FaArrowLeft />
                             <span>Back</span>
                           </button>
             
                           <button type="button" className="rent-mobile-leaved-btn" onClick={fetchLightBills}>
                             <FaRedoAlt />
                             <span>Refresh</span>
                           </button>
                         </div>
             
           

             
            </div>
  <div className="lb-mobile-title-wrap section-text1">
                
                <div>
                  <h2 className="lb-mobile-title">{scopeLabel} Light Bill</h2>
                </div>
              </div>
            <div className="rent-mobile-actions">
              <select
                className="form-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <select
                className="form-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              {/* <button
                className="lb-mobile-download-btn"
                onClick={downloadExcel}
                type="button"
              >
                <FiDownload />
                <span>Download Excel</span>
              </button> */}
            </div>

            <MobileMonthNavigator
              visibleMonths={mobileVisibleMonths}
              title="Bill Months"
              onPrev={handleMobilePrevMonth}
              onNext={handleMobileNextMonth}
              canPrev={mobileMonthStart > 0}
              canNext={mobileMonthStart < mobileMonthLimit}
            />
          </div>

          <div className="rent-mobile-section-title">
            <div>
              <h5>All Meters</h5>
              <div className="rent-mobile-badge">Tap a meter to view details</div>
            </div>
            <div className="rent-mobile-badge">
              {mobileGroupedEntries.length} {mobileGroupedEntries.length === 1 ? "meter" : "meters"}
            </div>
          </div>

          <div className="rent-mobile-tenant-list">
            {mobileGroupedEntries.length === 0 ? (
              <div className="rent-mobile-empty">No light bill data found.</div>
            ) : (
              mobileGroupedEntries.map(([meter, monthData], index) => {
                const allMonthItems = mobileVisibleMonths
                  .map((m) => monthData[m.label])
                  .filter(Boolean)
                  .sort((a, b) => new Date(a.date) - new Date(b.date));

                const latestItem =
                  allMonthItems.length > 0
                    ? allMonthItems[allMonthItems.length - 1]
                    : null;

                return (
                  <article
                    className={`rent-mobile-tenant-card rent-mobile-tenant-card--${
                      getStatusTone(latestItem?.status || "pending")
                    }`}
                    key={meter}
                    role="button"
                    tabIndex={0}
                    onClick={() => latestItem && handleEdit(latestItem)}
                    onKeyDown={(e) => e.key === "Enter" && latestItem && handleEdit(latestItem)}
                  >
                    <div className="rent-mobile-tenant-core">
                      <div className="rent-mobile-tenant-head">
                        <div className="rent-mobile-tenant-avatar">
                          {meter?.charAt(0)?.toUpperCase() || "M"}
                        </div>

                        <div className="rent-mobile-tenant-main text-justify">
                          <div className="rent-mobile-tenant-name">{latestItem?.meterNo || meter}</div>
                          {latestItem?.roomNo && (
                            <div className="rent-mobile-tenant-meta">
                              {scopeUnitLabel}: {getScopedDisplayLabel(latestItem.roomNo)}
                            </div>
                          )}
                          <div className="rent-mobile-tenant-meta">
                            <FaBolt className="me-1" />
                            Customer ID: {latestItem?._id?.slice(-4) || `10${index + 1}`}
                          </div>
                          <div className="rent-mobile-tenant-meta">
                            Last Updated:{" "}
                            <span className="lb-highlight-date">
                              {latestItem
                                ? new Date(latestItem.date).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "-"}
                            </span>
                          </div>
                        </div>

                        {/* <button
                          type="button"
                          className="lb-meter-chevron"
                          onClick={(e) => {
                            e.stopPropagation();
                            latestItem && handleEdit(latestItem);
                          }}
                        >
                          <FiChevronRight />
                        </button> */}
                      </div>
                    </div>

                    <div className="rent-mobile-month-strip">
                      {mobileVisibleMonths.map((monthObj) => {
                        const item = monthData[monthObj.label];
                        return (
                          <div
                            key={monthObj.label}
                            className={`rent-month-card ${item ? getStatusTone(item.status) : "empty"}`}
                            onClick={() => item && handleEdit(item)}
                            style={{ cursor: item ? "pointer" : "default" }}
                          >
                            <div className="rent-month-title">
                              {monthObj.label} {selectedYear}
                            </div>

                            <div className={`rent-month-status-btn ${item ? getStatusTone(item.status) : "empty"}`}>
                              {item ? getStatusText(item.status) : "No Bill"}
                            </div>

                            <div className="rent-month-range">
                              {item
                                ? new Date(item.date).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                  })
                                : "--"}
                            </div>

                            <div className="rent-month-note">
                              {item ? `Reading: ${item.totalReading || "-"}` : "-"}
                            </div>

                            <div className="rent-month-amount">
                              {item ? `₹${item.amount}` : "-"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {/* <div className="lb-mobile-legend-row">
            <div className="lb-legend-pill">
              <span className="lb-dot due"></span> Due
            </div>
            <div className="lb-legend-pill">
              <span className="lb-dot pending"></span> Pending
            </div>
            <div className="lb-legend-pill">
              <span className="lb-dot upcoming"></span> Upcoming
            </div>
            <div className="lb-legend-pill">
              <span className="lb-dot paid"></span> Paid
            </div>
          </div> */}

          <div className="rent-mobile-actionbar" aria-label="Light bill quick actions">
            <button type="button" className="rent-mobile-actionbar-btn" onClick={() => setShowAddModal(true)}>
              <span className="rent-mobile-actionbar-icon">
              <FaPlus />
              </span>
              <span>Add Bill</span>
            </button>

            <button type="button" className="rent-mobile-actionbar-btn" onClick={downloadExcel}>
              <span className="rent-mobile-actionbar-icon">
                <FaDownload />
              </span>
              <span>Download</span>
            </button>

            <button type="button" className="rent-mobile-actionbar-btn" onClick={handleGoBack}>
              <span className="rent-mobile-actionbar-icon">
                <FaArrowLeft />
              </span>
              <span>Back</span>
            </button>
          </div>
        </div>
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="modal d-block" style={{ background: "#00000055" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Add Light Bill</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "0px", margin: "0px" }}
                >
                  x
                </button>
              </div>

              <div className="modal-body">
                {showRoomSelector && (
                  <>
                    {showCategorySelector && (
                      <>
                        <label>Category</label>
                        <select
                          className="form-select mb-2"
                          value={newEntry.category}
                          onChange={(e) => {
                            const nextCategory = e.target.value;
                            setNewEntry({
                              ...newEntry,
                              category: nextCategory,
                              roomNo: "",
                              meterNo: "",
                            });
                          }}
                        >
                          <option value="">Select Category</option>
                          {scopedCategories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </>
                    )}

                    <label>{scopeUnitLabel} No</label>
                    <select
                      className="form-select mb-2"
                      value={newEntry.roomNo}
                      disabled={showCategorySelector && !newEntry.category}
                      onChange={(e) => {
                        const nextRoomNo = e.target.value;
                        const nextMeters =
                          existingMetersByRoom.get(String(nextRoomNo || "").trim()) || [];
                        setNewEntry({
                          ...newEntry,
                          roomNo: nextRoomNo,
                          meterNo: nextMeters[0] || "",
                        });
                      }}
                    >
                      <option value="">Select {scopeUnitLabel}</option>
                      {filteredScopedRoomNos.map((roomNo) => (
                        <option key={roomNo} value={roomNo}>
                          {scopedOptionLabels[roomNo] || roomNo}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                {!showRoomSelector && globalExistingMeterOptions.length > 0 && (
                  <>
                    <label>Existing Meter No</label>
                    <select
                      className="form-select mb-2"
                      value={
                        String(newEntry.meterNo || "").trim()
                          ? `${String(newEntry.roomNo || "").trim()}__${String(newEntry.meterNo || "").trim()}`
                          : ""
                      }
                      onChange={(e) => {
                        const nextKey = e.target.value;
                        const selectedOption = globalExistingMeterOptions.find(
                          (option) => option.key === nextKey
                        );

                        if (!selectedOption) {
                          setNewEntry({
                            ...newEntry,
                            meterNo: "",
                          });
                          return;
                        }

                        setNewEntry({
                          ...newEntry,
                          category: newEntry.category || selectedOption.category || "",
                          roomNo: selectedOption.roomNo || newEntry.roomNo,
                          meterNo: selectedOption.meterNo,
                        });
                      }}
                    >
                      <option value="">Select existing meter</option>
                      {globalExistingMeterOptions.map((option) => (
                        <option key={option.key} value={option.key}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                {showRoomSelector && existingMeterOptions.length > 0 && (
                  <>
                    <label>Existing Meter No</label>
                    <select
                      className="form-select mb-2"
                      value={newEntry.meterNo}
                      onChange={(e) =>
                        setNewEntry({ ...newEntry, meterNo: e.target.value })
                      }
                    >
                      <option value="">Select existing meter</option>
                      {existingMeterOptions.map((meterNo) => (
                        <option key={meterNo} value={meterNo}>
                          {meterNo}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                <label>Meter No</label>
                <input
                  className="form-control mb-2"
                  value={newEntry.meterNo}
                  placeholder={
                    (!showRoomSelector && globalExistingMeterOptions.length > 0) ||
                    existingMeterOptions.length > 0
                      ? "Select existing meter or enter new meter number"
                      : "Enter meter number"
                  }
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, meterNo: e.target.value })
                  }
                />

                <label>Total Reading</label>
                <input
                  type="number"
                  className="form-control mb-2"
                  value={newEntry.totalReading}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, totalReading: e.target.value })
                  }
                />

                <label>Amount</label>
                <input
                  type="number"
                  className="form-control mb-2"
                  value={newEntry.amount}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, amount: e.target.value })
                  }
                />

                <label>Month</label>
                <select
                  className="form-select mb-2"
                  value={newEntry.month}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, month: e.target.value })
                  }
                >
                  <option value="">Select Month</option>
                  {months
                    .filter((m) => m.value !== 0)
                    .map((m) => (
                      <option key={m.label}>{m.label}</option>
                    ))}
                </select>

                <label>Year</label>
                <input
                  type="number"
                  className="form-control mb-2"
                  value={newEntry.year}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, year: e.target.value })
                  }
                />

                <label>Status</label>
                <select
                  className="form-select"
                  value={newEntry.status}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, status: e.target.value })
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="due">Due</option>
                </select>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-success" onClick={handleAddEntry}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal d-block" style={{ background: "#00000055" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Edit Light Bill</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                > X </button>
              </div>

              <div className="modal-body">
                <label>Status</label>
                <select
                  className="form-select mb-2"
                  value={updatedStatus}
                  onChange={(e) => setUpdatedStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="due">Due</option>
                </select>

                <label>Total Reading</label>
                <input
                  type="number"
                  className="form-control mb-2"
                  value={updatedTotalReading}
                  onChange={(e) => setUpdatedTotalReading(e.target.value)}
                />

                <label>Amount</label>
                <input
                  type="number"
                  className="form-control mb-2"
                  value={updatedAmount}
                  onChange={(e) => setUpdatedAmount(e.target.value)}
                />

                <label>Date</label>
                <input
                  type="date"
                  className="form-control mb-2"
                  value={updatedDate}
                  onChange={(e) => setUpdatedDate(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-success" onClick={handleUpdateSubmit}>
                  Save Changes
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(selectedBill)}
                >
                  <FontAwesomeIcon icon={faTrash} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LightBill;
