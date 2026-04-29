import React, { useEffect, useState } from "react";
import {
  FaBed,
  FaDownload,
  FaEdit,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaPhoneAlt,
  FaPlus,
  FaSearch,
  FaSignOutAlt,
} from "react-icons/fa";
import { FaThLarge } from "react-icons/fa";
import MobileMonthNavigator from "./MobileMonthNavigator";
import "./RentTracker.css";

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function getStatusTone(label = "") {
  const normalized = String(label).toLowerCase();
  if (normalized.startsWith("paid")) return "paid";
  if (normalized.startsWith("due")) return "due";
  if (normalized.startsWith("pend")) return "pend";
  if (normalized.startsWith("upcoming")) return "upcoming";
  return "pend";
}

function getInitials(name = "") {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "T";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getMonthWindow(visibleMonths = []) {
  return Array.isArray(visibleMonths) ? [...visibleMonths].slice(-3) : [];
}

function flattenVisibleTenants(visibleTenants = [], groupedRooms = []) {
  if (Array.isArray(visibleTenants) && visibleTenants.length) {
    return visibleTenants;
  }

  return (groupedRooms || [])
    .flatMap((room) => room?.occupied || [])
    .filter(Boolean);
}

function getAmountText(cell) {
  if (!cell) return "-";

  const label = String(cell.label || "").toLowerCase();
  const paid = toNum(cell.amountPaid);
  const expected = toNum(cell.expected);
  const outstanding = toNum(cell.outstanding);

  if (!label || label === "-" || label === "N/A") return "-";
  if (label.startsWith("paid")) {
    return `${paid.toLocaleString("en-IN")} / ${expected.toLocaleString("en-IN")}`;
  }
  if (label.startsWith("due")) return `${(outstanding || expected).toLocaleString("en-IN")}`;
  if (label.startsWith("pend")) {
    if (paid > 0 && expected > 0) {
      return `${paid.toLocaleString("en-IN")} / ${expected.toLocaleString("en-IN")}`;
    }
    return `${(outstanding || expected).toLocaleString("en-IN")}`;
  }
  if (label.startsWith("upcoming")) return `${expected.toLocaleString("en-IN")}`;
  return `${(paid || expected || outstanding).toLocaleString("en-IN")}`;
}

function getDateText(cell) {
  if (!cell) return "";

  const label = String(cell.label || "").toLowerCase();
  if (
    !label.startsWith("paid") &&
    !label.startsWith("due") &&
    !label.startsWith("upcoming")
  ) {
    return "";
  }

  return cell.dateStr || "";
}

function RentMobileViewCardFeed({
  visibleTenants = [],
  groupedRooms = [],
  getTenantPhotoMeta,
  photoTransformStyle,
  roomColorStyleMap = {},
  selectedYear = "All Records",
  years = [],
  searchText = "",
  onYearChange,
  onSearchChange,
  visibleMonths = [],
  getMonthCell,
  getRentStatusLabelForSort,
  onOpenTenant,
  onOpenAdmissionForm,
  onEditPhoto,
  onEditMonth,
  onOpenLeavedTenants,
  onOpenVacantBeds,
  onManageRooms,
  onAddTenant,
  onDownloadExcel,
  onPrevMonths,
  onNextMonths,
  canPrevMonths = true,
  canNextMonths = true,
}) {
  const monthWindow = getMonthWindow(visibleMonths);
  const tenantList = flattenVisibleTenants(visibleTenants, groupedRooms);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterMode, setFilterMode] = useState(
    selectedYear !== "All Records" ? "year" : "name"
  );

  useEffect(() => {
    if (selectedYear !== "All Records") {
      setFilterMode("year");
      return;
    }

    if (searchText) {
      setFilterMode("name");
    }
  }, [selectedYear, searchText]);

  const filterModeLabel = filterMode === "year" ? "Year" : "Name";

  const syncFilterMode = (nextMode) => {
    setFilterMode(nextMode);

    if (nextMode === "year") {
      onSearchChange?.("");
      return;
    }

    onYearChange?.("All Records");
  };

  const handleClearFilters = () => {
    onSearchChange?.("");
    onYearChange?.("All Records");
    setFilterMode("name");
  };

  return (
    <div className="rent-mobile-view">
      <div className="rent-mobile-shell">
        <div className="rent-mobile-launch-row rent-mobile-launch-row--main">
          <button
            type="button"
            className="rent-mobile-leaved-btn"
            onClick={onOpenLeavedTenants}
          >
            <FaSignOutAlt />
            <span>Leaved Tenants</span>
          </button>

          <button
            type="button"
            className="rent-mobile-vacant-btn"
            onClick={onOpenVacantBeds}
          >
            <FaBed />
            <span>Vacant Beds</span>
          </button>
        </div>

        <div className="rent-mobile-filter-wrap" aria-label="Mobile tenant filters">
          <button
            type="button"
            className="rent-mobile-filter-toggle"
            onClick={() => setShowFilterPanel((prev) => !prev)}
            aria-expanded={showFilterPanel}
          >
            <span className="rent-mobile-filter-toggle-left">
              <FaFilter />
              <span>Filter</span>
            </span>
            <span className="rent-mobile-filter-toggle-right">
              <span className="rent-mobile-filter-toggle-label">{filterModeLabel}</span>
              {showFilterPanel ? <FaChevronUp /> : <FaChevronDown />}
            </span>
          </button>

          {showFilterPanel ? (
            <div className="rent-mobile-filter-panel">
              <div className="rent-mobile-filter-mode-row">
                <button
                  type="button"
                  className={`rent-mobile-mode-chip ${filterMode === "name" ? "active" : ""}`}
                  onClick={() => syncFilterMode("name")}
                >
                  Search by name
                </button>
                <button
                  type="button"
                  className={`rent-mobile-mode-chip ${filterMode === "year" ? "active" : ""}`}
                  onClick={() => syncFilterMode("year")}
                >
                  Search by year
                </button>
              </div>

              {filterMode === "name" ? (
                <div className="rent-mobile-filter-chip rent-mobile-filter-chip--field rent-mobile-filter-chip--search rent-mobile-filter-chip--stacked">
                  <FaSearch />
                  <input
                    id="rent-mobile-search"
                    type="search"
                    className="rent-mobile-filter-input"
                    value={searchText}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    placeholder="Type tenant name"
                  />
                </div>
              ) : (
                <div className="rent-mobile-filter-chip rent-mobile-filter-chip--field rent-mobile-filter-chip--select rent-mobile-filter-chip--stacked">
                  <span className="rent-mobile-filter-chip-text">Year</span>
                  <select
                    id="rent-mobile-year"
                    className="rent-mobile-filter-select"
                    value={selectedYear}
                    onChange={(e) => onYearChange?.(e.target.value)}
                  >
                    {(years || []).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="rent-mobile-filter-actions">
                <button
                  type="button"
                  className="rent-mobile-filter-clear"
                  onClick={handleClearFilters}
                >
                  Clear filters
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <MobileMonthNavigator
          visibleMonths={monthWindow}
          title="Rent Months"
          onPrev={onPrevMonths}
          onNext={onNextMonths}
          canPrev={canPrevMonths}
          canNext={canNextMonths}
        />

        <section className="rent-mobile-section">
          <div className="rent-mobile-section-title">
            <div>
              <h5>All Tenants</h5>
              <div className="rent-mobile-badge">Tap a status to edit rent</div>
            </div>
            <div className="rent-mobile-tenant-count">{tenantList.length} tenants</div>
          </div>

          {tenantList.length ? (
            <div className="rent-mobile-tenant-list">
              {tenantList.map((tenant) => {
                const currentMonth = monthWindow[monthWindow.length - 1];
                const currentCell = currentMonth
                  ? getMonthCell?.(tenant, currentMonth.y, currentMonth.m)
                  : null;
                const isAdvancePaid = tenant?.firstRentStatus === "ADVANCE_PAID";
                const statusLabel =
                  currentCell?.label ||
                  (getRentStatusLabelForSort ? getRentStatusLabelForSort(tenant) : "") ||
                  "Pending";
                const tone = getStatusTone(statusLabel);
                const photoMeta = getTenantPhotoMeta ? getTenantPhotoMeta(tenant) : null;
                const roomStyle =
                  roomColorStyleMap[String(tenant.roomNo ?? "").trim()] || {
                    backgroundColor: "#5f7dfc",
                    border: "1px solid #4c66d8",
                    color: "#ffffff",
                  };

                return (
                  <div
                    key={tenant._id}
                    className={`rent-mobile-tenant-card rent-mobile-tenant-card--${tone}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpenTenant?.(tenant)}
                    onKeyDown={(e) => e.key === "Enter" && onOpenTenant?.(tenant)}
                  >
                    <div className="rent-mobile-tenant-head">
                      <div className="rent-mobile-tenant-avatar-wrap">
                        <div
                          className="rent-mobile-tenant-avatar rent-mobile-tenant-avatar-btn"
                          role={onOpenAdmissionForm ? "button" : undefined}
                          tabIndex={onOpenAdmissionForm ? 0 : undefined}
                          onClick={(e) => {
                            if (!onOpenAdmissionForm) return;
                            e.stopPropagation();
                            onOpenAdmissionForm?.(tenant);
                          }}
                          onKeyDown={(e) => {
                            if ((e.key === "Enter" || e.key === " ") && onOpenAdmissionForm) {
                              e.preventDefault();
                              e.stopPropagation();
                              onOpenAdmissionForm?.(tenant);
                            }
                          }}
                          title="Open admission form"
                          aria-label="Open admission form"
                          style={{ cursor: onOpenAdmissionForm ? "pointer" : "default" }}
                        >
                          {photoMeta?.photoUrl ? (
                            <img
                              src={photoMeta.photoUrl}
                              alt=""
                              style={
                                photoMeta.photoTransform
                                  ? photoTransformStyle?.(photoMeta.photoTransform)
                                  : undefined
                              }
                            />
                          ) : (
                            getInitials(tenant.name)
                          )}
                        </div>

                        {photoMeta?.photoUrl && onEditPhoto ? (
                          <button
                            type="button"
                            className="rent-mobile-tenant-photo-edit-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditPhoto?.(tenant);
                            }}
                            title="Edit photo position"
                            aria-label="Edit photo position"
                          >
                            <FaEdit />
                          </button>
                        ) : null}
                      </div>

                      <div className="rent-mobile-tenant-main">
                        <div className="rent-mobile-tenant-name">{tenant.name || "Tenant"}</div>
                        <div className="rent-mobile-tenant-meta">
                        {isAdvancePaid ? (
                          <div className="rent-mobile-advance-row">
                            <span className="rent-mobile-advance-pill">Advance paid</span>
                          </div>
                        ) : null}
                         
                    <div className="">
                      <span className="room-pill" style={roomStyle}>
                        Room {tenant.roomNo || "-"}
                        {tenant.bedNo ? ` - Bed ${tenant.bedNo}` : ""}
                      </span>
                    </div>
                        </div>
                        <div className="rent-mobile-tenant-meta">
                       
 Deposit: Rs. {toNum(tenant.depositAmount).toLocaleString("en-IN")}
                          {tenant.phoneNo ? (
                            <>
                              <span className="rent-mobile-tenant-dot">|</span> <br /> 
                              <span ><FaPhoneAlt className="me-1" />
                              {tenant.phoneNo}</span>
                            </>
                          ) : null}

                         
                        </div>
                      </div>
                    </div>


                    <div className="rent-mobile-month-strip">
                      {monthWindow.map((month) => {
                        const cell = month ? getMonthCell?.(tenant, month.y, month.m) : null;
                        const monthTone = getStatusTone(cell?.label || "Pending");

                        return (
                          <div
                            key={`${tenant._id}-${month?.y}-${month?.m}`}
                            className={`rent-month-card ${monthTone}`}
                          >
                            <div className="rent-month-title">{month?.label || ""}</div>
                            <div
                              className={`rent-month-status-btn ${monthTone}`}
                              role={cell ? "button" : undefined}
                              tabIndex={cell ? 0 : undefined}
                              onClick={(e) => {
                                if (!cell || !onEditMonth) return;
                                e.stopPropagation();
                                onEditMonth(tenant, month);
                              }}
                              onKeyDown={(e) => {
                                if ((e.key === "Enter" || e.key === " ") && cell && onEditMonth) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  onEditMonth(tenant, month);
                                }
                              }}
                              style={{ cursor: cell && onEditMonth ? "pointer" : "default" }}
                            >
                              <div className="rent-month-status-row">
                                <span className="rent-month-status-label">{cell?.label || "-"}</span>
                                {getDateText(cell) ? (
                                  <span className="rent-month-status-date">{getDateText(cell)}</span>
                                ) : null}
                              </div>
                             
                            </div>
                            <div className="rent-month-range">{cell?.rangeText || "-"}</div>
                            <div className="rent-month-amount">{getAmountText(cell)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rent-mobile-empty">No occupied tenants found.</div>
          )}
        </section>

        <div className="rent-mobile-bottom-bar">
          <button
            type="button"
            className="rent-mobile-bottom-action"
            onClick={onManageRooms}
          >
            <span className="rent-mobile-bottom-icon">
              <FaThLarge />
            </span>
            <span>Add Room</span>
          </button>

          <button
            type="button"
            className="rent-mobile-bottom-action"
            onClick={onAddTenant}
          >
            <span className="rent-mobile-bottom-icon">
              <FaPlus />
            </span>
            <span>Add Tenant</span>
          </button>

          <button
            type="button"
            className="rent-mobile-bottom-action"
            onClick={onDownloadExcel}
          >
            <span className="rent-mobile-bottom-icon">
              <FaDownload />
            </span>
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default RentMobileViewCardFeed;
