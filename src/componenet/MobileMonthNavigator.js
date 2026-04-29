import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./MobileMonthNavigator.css";

function getMonthLabel(month) {
  if (!month) return "";
  if (month.label) return month.label;
  if (typeof month.y === "number" && typeof month.m === "number") {
    return new Date(month.y, month.m, 1).toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
  }
  return "";
}

function getRangeLabel(visibleMonths = []) {
  const months = (Array.isArray(visibleMonths) ? visibleMonths : []).filter(Boolean);
  if (!months.length) return "No months";
  if (months.length === 1) return getMonthLabel(months[0]);
  return `${getMonthLabel(months[0])} - ${getMonthLabel(months[months.length - 1])}`;
}

function MobileMonthNavigator({
  visibleMonths = [],
  title = "Rent Months",
  onPrev,
  onNext,
  canPrev = true,
  canNext = true,
  rightActionLabel = "",
  rightActionIcon = null,
  onRightAction,
}) {
  const rangeLabel = getRangeLabel(visibleMonths);

  return (
    <div className="mobile-month-nav">
      <button
        type="button"
        className="mobile-month-nav-btn"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label="Previous months"
        title="Previous months"
      >
        <FaChevronLeft />
      </button>

      <div className="mobile-month-nav-center">
        <div className="mobile-month-nav-eyebrow">{title}</div>
        <div className="mobile-month-nav-label">{rangeLabel}</div>
      </div>

      <div className="mobile-month-nav-actions">
        {canNext ? (
          <button
            type="button"
            className="mobile-month-nav-btn"
            onClick={onNext}
            disabled={!canNext}
            aria-label="Next months"
            title="Next months"
          >
            <FaChevronRight />
          </button>
        ) : null}

        {rightActionLabel ? (
          <button
            type="button"
            className="mobile-month-nav-pill"
            onClick={onRightAction}
            title={rightActionLabel}
          >
            {rightActionIcon}
            <span>{rightActionLabel}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default MobileMonthNavigator;
