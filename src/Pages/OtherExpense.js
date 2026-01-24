import React, { useEffect, useState } from "react";
import { FaPlus, FaDownload, FaEdit } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import { HiHome } from "react-icons/hi";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../Pages/lightbill.css";

const OtherExpense = ({ embedded = false }) => {
  const navigate = useNavigate();

  const [otherExpenses, setOtherExpenses] = useState([]);

  // Filters
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(0);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // New entry
  const [newEntry, setNewEntry] = useState({
    mainAmount: "",
    expenses: [""],
    date: "",
    status: "pending",
  });

  // Edit fields
  const [updatedMainAmount, setUpdatedMainAmount] = useState("");
  const [updatedExpenses, setUpdatedExpenses] = useState("");
  const [updatedDate, setUpdatedDate] = useState("");
  const [updatedStatus, setUpdatedStatus] = useState("");

  // Month + Year list
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

  // Load data
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await fetch(" http://localhost:8000/api/other-expense/all");
      const data = await res.json();
      setOtherExpenses(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered list
  const filteredExpenses = otherExpenses.filter((item) => {
    const dt = new Date(item.date);
    const matchesYear = dt.getFullYear() === selectedYear;
    const matchesMonth =
      selectedMonth === 0 || dt.getMonth() + 1 === selectedMonth;

    return matchesYear && matchesMonth;
  });

  // Add new expense
  const handleAddExpense = async () => {
    try {
      const payload = {
        mainAmount: newEntry.mainAmount,
        expenses: newEntry.expenses.filter((e) => e.trim() !== ""),
        date: newEntry.date,
        status: newEntry.status,
      };

      const res = await fetch(" http://localhost:8000/api/other-expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed");

      alert("Expense Added!");
      setShowAddModal(false);

      setNewEntry({
        mainAmount: "",
        expenses: [""],
        date: "",
        status: "pending",
      });

      fetchExpenses();
    } catch (err) {
      alert(err.message);
    }
  };

  // Edit
  const handleEdit = (exp) => {
    setSelectedExpense(exp);

    setUpdatedMainAmount(exp.mainAmount);
    setUpdatedExpenses(exp.expenses?.join(", ") || "");
    setUpdatedDate(exp.date?.slice(0, 10));
    setUpdatedStatus(exp.status);

    setShowEditModal(true);
  };

  const handleUpdateSubmit = async () => {
    try {
      const payload = {
        ...selectedExpense,
        mainAmount: updatedMainAmount,
        expenses: updatedExpenses.split(",").map((e) => e.trim()),
        date: updatedDate,
        status: updatedStatus,
      };

      const res = await fetch(
        ` http://localhost:8000/api/other-expense/${selectedExpense._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Update failed");

      alert("Updated Successfully!");
      setShowEditModal(false);
      fetchExpenses();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (exp) => {
    if (!window.confirm("Delete this expense?")) return;

    try {
      const res = await fetch(
        ` http://localhost:8000/api/other-expense/${exp._id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) throw new Error("Delete failed");

      alert("Deleted!");
      fetchExpenses();
    } catch (err) {
      alert(err.message);
    }
  };

  // Excel export
  const downloadExcel = () => {
    const formatted = filteredExpenses.map((item, idx) => ({
      "Sr No.": idx + 1,
      "Main Amount": item.mainAmount,
      Expenses: item.expenses?.join(", ") || "",
      Date: new Date(item.date).toLocaleDateString(),
      Status: item.status,
    }));

    const sheet = XLSX.utils.json_to_sheet(formatted);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "OtherExpenses");
    XLSX.writeFile(book, `OtherExpense-${selectedYear}.xlsx`);
  };

  return (
    <div className={`p-2 ${embedded ? "" : "container-fluid"}`}>

<div className="d-flex justify-content-center align-items-center gap-2 mb-3">
  <div className="section-icon">
    <FaEdit />
  </div>
  <div className="section-text">
    Maintenance & Other Expenses
  </div>
</div>


      {/* Only show title when full page */}
      {!embedded && <h3 className="fw-bold mb-3">Other Expense</h3>}




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

        {/* Add Expense Button */}
        <button
          className="btn"
         style={{
    backgroundColor: "rgb(85, 114, 241)",
    color: "white",
  }}
          onClick={() => setShowAddModal(true)}
        >
          <FaPlus className="me-1" />
          Add Expense
        </button>

        {/* Excel Download */}
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

        {/* Rent & Deposit (Hide when embedded) */}
        {!embedded && (
          <>
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
          </>
        )}
      </div>

      {/* TABLE */}
    <div className="table-responsive mt-3">
  <div className="light-table-wrapper">
    <table className="table light-bill-table align-middle">

          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Expenses</th>
              <th>Main Amount</th>
              <th>Status</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  No data found
                </td>
              </tr>
            ) : (
              filteredExpenses.map((item, idx) => (
                <tr key={item._id}>
                  <td>{idx + 1}</td>
                  <td>{new Date(item.date).toLocaleDateString()}</td>
                  <td>{item.expenses?.join(", ") || "-"}</td>
                  <td>₹{item.mainAmount?.toLocaleString()}</td>
                  <td>
                    {item.status === "paid" ? (
                      <span className="badge bg-success">Paid</span>
                    ) : (
                      <span className="badge bg-warning text-dark">
                        Pending
                      </span>
                    )}
                  </td>

                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => handleEdit(item)}
                    >
                      <FaEdit />
                    </button>

                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(item)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
  </div>
</div>


      {/* ADD MODAL */}
      {showAddModal && (
        <div className="modal d-block" style={{ background: "#00000055" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5>Add Other Expense</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                />
              </div>

              <div className="modal-body">
                {/* Main Amount */}
                <label>Main Amount</label>
                <input
                  type="number"
                  className="form-control mb-2"
                  value={newEntry.mainAmount}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, mainAmount: e.target.value })
                  }
                />

                {/* Expenses array input */}
                <label>Expenses</label>
                {newEntry.expenses.map((exp, idx) => (
                  <div key={idx} className="d-flex mb-2">
                    <input
                      type="text"
                      className="form-control"
                      value={exp}
                      placeholder={`Expense ${idx + 1}`}
                      onChange={(e) => {
                        const arr = [...newEntry.expenses];
                        arr[idx] = e.target.value;
                        setNewEntry({ ...newEntry, expenses: arr });
                      }}
                    />

                    <button
                      className="btn btn-danger ms-2"
                      onClick={() => {
                        const arr = newEntry.expenses.filter(
                          (_, i) => i !== idx
                        );
                        setNewEntry({ ...newEntry, expenses: arr });
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}

                <button
                  className="btn btn-secondary mb-3"
                  onClick={() =>
                    setNewEntry({
                      ...newEntry,
                      expenses: [...newEntry.expenses, ""],
                    })
                  }
                >
                  Add Expense
                </button>

                {/* Date */}
                <label>Date</label>
                <input
                  type="date"
                  className="form-control mb-2"
                  value={newEntry.date}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, date: e.target.value })
                  }
                />

                {/* Status */}
                <label>Status</label>
                <select
                  className="form-select"
                  value={newEntry.status}
                  onChange={(e) =>
                    setNewEntry({
                      ...newEntry,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-success" onClick={handleAddExpense}>
                  Save Entry
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
                <h5>Edit Expense</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                />
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

                <label>Main Amount</label>
                <input
                  type="number"
                  className="form-control mb-2"
                  value={updatedMainAmount}
                  onChange={(e) => setUpdatedMainAmount(e.target.value)}
                />

                <label>Expenses (comma separated)</label>
                <input
                  type="text"
                  className="form-control mb-2"
                  value={updatedExpenses}
                  onChange={(e) => setUpdatedExpenses(e.target.value)}
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
                <button
                  className="btn btn-success"
                  onClick={handleUpdateSubmit}
                >
                  Save Changes
                </button>

                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(selectedExpense)}
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

export default OtherExpense;
