import React from "react";
import { FaSignOutAlt } from "react-icons/fa";
import "./MobileSectionSidebar.css";

function MobileSectionSidebar({
  open = false,
  activeKey = "",
  items = [],
  title = "Sections",
  brand = "Hostel Manager",
  subtitle = "Switch screen",
  footerVersion = "v1.0.0",
  footerText = "© Hostel Manager",
  theme = "blue",
  onSelect,
  onClose,
  onLogout,
}) {
  return (
    <>
      <div
        className={`mobile-section-overlay ${open ? "open" : ""}`}
        onClick={onClose}
      />

      <aside
        className={`mobile-section-sidebar mobile-section-sidebar--${theme} ${open ? "open" : ""}`}
      >
        <div className="mobile-section-sidebar-header">
          <div>
            {/* {title ? <div className="mobile-section-sidebar-eyebrow">{title}</div> : null} */}
            <h4 className="mobile-section-sidebar-title">{brand}</h4>
            {/* <div className="mobile-section-sidebar-subtitle">{subtitle}</div> */}
          </div>

          <button
            type="button"
            className="mobile-section-close"
            onClick={onClose}
            aria-label="Close sections menu"
          >
            ×
          </button>
        </div>

        <div className="mobile-section-list">
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`mobile-section-item ${activeKey === item.key ? "active" : ""}`}
              onClick={() => {
                onSelect?.(item.key);
                onClose?.();
              }}
            >
              <span className="mobile-section-item-icon">{item.icon}</span>
              <span className="mobile-section-item-label">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mobile-section-sidebar-footer">
          {onLogout ? (
            <button
              type="button"
              className="mobile-section-logout-btn"
              onClick={() => {
                onClose?.();
                onLogout?.();
              }}
            >
              <span className="mobile-section-item-icon">
                <FaSignOutAlt />
              </span>
              <span className="mobile-section-item-label">Logout</span>
            </button>
          ) : null}
          <div className="mobile-section-version">{footerVersion}</div>
          <div className="mobile-section-copyright">{footerText}</div>
        </div>
      </aside>
    </>
  );
}

export default MobileSectionSidebar;
