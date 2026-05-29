import React from "react";
import { FaPlus, FaDownload, FaSearch, FaHistory } from "react-icons/fa";
import "./RentTracker.css";

function RentHeaderBar({
  title = "Rent & Deposit Tracker",
  eyebrow = "Bed-wise Rent and Deposit Tracker",
  notificationSlot,
  selectedYear,
  years = [],
  searchText,
  searchPlaceholder = "Search room, bed, name, mobile...",
  onYearChange,
  onSearchChange,
  onManageRooms,
  manageRoomsLabel = "Manage Rooms",
  onAddTenant,
  addTenantLabel = "Add Tenant",
  onDownloadExcel,
  onOpenHistory,
  isHistoryView = false,
}) {
  return (
    <div className="rent-header-card">
      <div className="rent-header-top">
        <div>
          <div className="rent-header-eyebrow">{eyebrow}</div>
          <h3 className="rent-header-title">{title}</h3>
        </div>

        <div>{notificationSlot}</div>
      </div>

      <div className="rent-toolbar">
        <select
          className="form-select me-2"
          style={{ width: "150px" }}
          value={selectedYear}
          onChange={onYearChange}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <div style={{ position: "relative", maxWidth: "300px" }} className="me-2">
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
            placeholder={`  ${searchPlaceholder}`}
            className="form-control ps-4"
            value={searchText}
            onChange={onSearchChange}
          />
        </div>

        <button
          type="button"
          className="btn me-2 rent-toolbar-action"
          style={{ backgroundColor: "#5f7dfc", color: "white" }}
          onClick={onManageRooms}
        >
          <FaPlus className="me-1" /> {manageRoomsLabel}
        </button>

        <button
          type="button"
          className="btn me-2 rent-toolbar-action"
          style={{ backgroundColor: "#5f7dfc", color: "white" }}
          onClick={onAddTenant}
        >
          <FaPlus className="me-1" /> {addTenantLabel}
        </button>

        <button
          type="button"
          className="btn me-2 rent-toolbar-action"
          style={{ backgroundColor: "#5f7dfc", color: "white" }}
          onClick={onDownloadExcel}
        >
          <FaDownload className="me-1" />
          Download Excel
        </button>

        <button
          type="button"
          className="btn me-2 rent-toolbar-action"
          style={{ backgroundColor: "#5f7dfc", color: "white" }}
          onClick={onOpenHistory}
        >
          <FaHistory className="me-1" />
          {isHistoryView ? "Active Tenants" : "History"}
        </button>

      </div>

    </div>
  );
}

export default RentHeaderBar;
