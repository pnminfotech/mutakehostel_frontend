import React, { useEffect, useState } from "react";
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
const LightBill = ({ embedded }) => {
  const navigate = useNavigate();

  const hideNav = embedded === true;

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
      const res = await fetch("https://mutakegirlshostel-0ko7.onrender.com/api/light-bill/all");
      const data = await res.json();
      setLightBills(data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLightBills = lightBills.filter((item) => {
    const dt = new Date(item.date);
    const matchesYear = dt.getFullYear() === selectedYear;
    const matchesMonth =
      selectedMonth === 0 || dt.getMonth() + 1 === selectedMonth;

    return matchesYear && matchesMonth;
  });

  const groupData = (dataList) => {
    const matrix = {};
    const monthMap = new Map();

    dataList.forEach((item) => {
      const name = item.meterNo;
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
      const monthNumber = months.find((m) => m.label === newEntry.month)?.value;
      if (!monthNumber) return alert("Select valid month");

      const formattedDate = `${newEntry.year}-${String(monthNumber).padStart(
        2,
        "0"
      )}-01`;

      const bodyData = {
        type: "meter",
        name: newEntry.meterNo,
        meterNo: newEntry.meterNo,
        totalReading: newEntry.totalReading,
        amount: newEntry.amount,
        status: newEntry.status,
        date: formattedDate,
      };

      const res = await fetch("https://mutakegirlshostel-0ko7.onrender.com/api/light-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) throw new Error("Failed");

      alert("Light Bill Added!");
      setShowAddModal(false);
      setNewEntry({
        type: "meter",
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
        totalReading: updatedTotalReading,
        amount: updatedAmount,
        date: updatedDate,
        status: updatedStatus,
      };

      const res = await fetch(
        `https://mutakegirlshostel-0ko7.onrender.com/api/light-bill/${selectedBill._id}`,
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
      const res = await fetch(`https://mutakegirlshostel-0ko7.onrender.com/api/light-bill/${bill._id}`, {
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
          <div className="section-text">Monthly Expense – Light Bill</div>
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

        <div className="table-responsive mt-3">
          <div className="light-table-wrapper">
            <table className="table light-bill-table align-middle">
              <thead>
                <tr>
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
                    <td>
                      <b>{meter}</b>
                    </td>

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
                  <h2 className="lb-mobile-title">Light Bill</h2>
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
                          <div className="rent-mobile-tenant-name">{meter}</div>
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
                <label>Meter No</label>
                <input
                  className="form-control mb-2"
                  value={newEntry.meterNo}
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
