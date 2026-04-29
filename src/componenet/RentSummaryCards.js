import React from "react";
import "./RentTracker.css";

function RentSummaryCards({
  totalBeds,
  occupiedBeds,
  vacantBeds,
  pendingRents,
  depositCount,
  onVacantClick,
  onPendingClick,
}) {
  return (
    <div className="row g-3 mb-2 summary-row rent-summary-row">
      <div className="col-md-3 col-sm-6">
        <div className="summary-card blue">
          <div className="summary-left">
            <div className="summary-icon">🛏️</div>
            <div className="summary-text">
              <div className="summary-title">Total Beds</div>
            </div>
          </div>
          <div className="summary-number">{totalBeds}</div>
        </div>
      </div>

      <div className="col-md-3 col-sm-6">
        <div className="summary-card green">
          <div className="summary-left">
            <div className="summary-icon">🛌</div>
            <div className="summary-text">
              <div className="summary-title">Occupied</div>
            </div>
          </div>
          <div className="summary-number">{occupiedBeds}</div>
        </div>
      </div>

      <div className="col-md-3 col-sm-6">
        <div
          className="summary-card orange"
          role={onVacantClick ? "button" : undefined}
          style={onVacantClick ? { cursor: "pointer" } : undefined}
          onClick={onVacantClick}
          title={onVacantClick ? "Click to view vacant beds" : undefined}
        >
          <div className="summary-left">
            <div className="summary-icon">🛌</div>
            <div className="summary-text">
              <div className="summary-title">Vacant Beds</div>
            </div>
          </div>
          <div className="summary-number">{vacantBeds}</div>
        </div>
      </div>

      <div className="col-md-3 col-sm-6">
        <div
          className="summary-card red"
          role={onPendingClick ? "button" : undefined}
          style={onPendingClick ? { cursor: "pointer" } : undefined}
          onClick={onPendingClick}
          title={onPendingClick ? "Click to view pending tenants" : undefined}
        >
          <div className="summary-left">
            <div className="summary-icon">⏳</div>
            <div className="summary-text">
              <div className="summary-title">Pending Rents</div>
            </div>
          </div>
          <div className="summary-number">{pendingRents}</div>
        </div>
      </div>

      <div className="col-md-3 col-sm-6">
        <div className="summary-card purple">
          <div className="summary-left">
            <div className="summary-icon">💰</div>
            <div className="summary-text">
              <div className="summary-title">Deposits</div>
            </div>
          </div>
          <div className="summary-number">{depositCount}</div>
        </div>
      </div>
    </div>
  );
}

export default RentSummaryCards;
