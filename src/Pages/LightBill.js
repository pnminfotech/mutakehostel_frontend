import React, { useEffect, useState } from "react";
import { FaPlus, FaDownload, FaEdit, FaBolt } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import { HiHome } from "react-icons/hi";
import { FaArrowLeft } from "react-icons/fa";
import { FaTachometerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../Pages/lightbill.css";
const LightBill = ({ embedded }) => {
  const navigate = useNavigate();

  // hide top Rent/Deposit + Back buttons when shown inside NewComponant
  const hideNav = embedded === true;

  const [lightBills, setLightBills] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(0);

  const [selectedBill, setSelectedBill] = useState(null);

  // ADD ENTRY DATA
  const [newEntry, setNewEntry] = useState({
    type: "meter",
    meterNo: "",
    totalReading: "",
    amount: "",
    month: "",
    year: new Date().getFullYear(),
    status: "pending",
  });

  // EDIT ENTRY DATA
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
      const res = await fetch(" http://localhost:8000/api/light-bill/all");
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

      const res = await fetch(" http://localhost:8000/api/light-bill", {
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
        ` http://localhost:8000/api/light-bill/${selectedBill._id}`,
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
      const res = await fetch(
        ` http://localhost:8000/api/light-bill/${bill._id}`,
        {
          method: "DELETE",
        }
      );

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
    }));

    const sheet = XLSX.utils.json_to_sheet(formatted);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "LightBills");
    XLSX.writeFile(book, `LightBill-${selectedYear}.xlsx`);
  };

  const grouped = groupData(filteredLightBills);

  return (
    <div className="container-fluid p-3">

      {/* ---- TOP BUTTONS (HIDE IN EMBEDDED MODE) ---- */}
      {!hideNav && (
        <>
          <div className="d-flex gap-2 mb-3">

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
              onClick={() => navigate("/maindashboard")}
            >
              <FaArrowLeft className="me-1" />
              Back
            </button>
          </div>
        </>
      )}

<div className="d-flex justify-content-center align-items-center gap-2 mb-3">
  <div className="section-icon">
    ⚡
  </div>
  <div className="section-text">
    Monthly Expense – Light Bill
  </div>
</div>



      {/* FILTERS */}
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
         style={{
    backgroundColor: "rgb(85, 114, 241)",
    color: "white",
  }}
          onClick={downloadExcel}
        >
          <FaDownload className="me-1" />
          Download Excel
        </button>
      </div>

      {/* TABLE */}
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

      {/* --- ADD MODAL --- */}
      {showAddModal && (
        <div className="modal d-block" style={{ background: "#00000055" }}>
          <div className="modal-dialog">
            <div className="modal-content">

              <div className="modal-header">
                <h5>Add Light Bill</h5>
                <button className="btn-close" onClick={() => setShowAddModal(false)} />
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
                </select>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
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

      {/* --- EDIT MODAL --- */}
      {showEditModal && (
        <div className="modal d-block" style={{ background: "#00000055" }}>
          <div className="modal-dialog">
            <div className="modal-content">

              <div className="modal-header">
                <h5>Edit Light Bill</h5>
                <button className="btn-close" onClick={() => setShowEditModal(false)} />
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
                <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-success" onClick={handleUpdateSubmit}>
                  Save Changes
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(selectedBill)}>
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
