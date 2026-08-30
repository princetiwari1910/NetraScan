import React from "react";
import { Link } from "react-router-dom";
import ScanningEyeIcon from "./ScanningEyeIcon";

/**
 * NetraScanLogo - Standardized Brand Header Logo Component
 * Combines the AI Retinal Scanning Eye icon with the NetraScan wordmark.
 */
export function NetraScanLogo({
  to = "/home",
  size = 24,
  iconContainerClass = "logo-icon",
  className = "logo",
  showWordmark = true,
  animated = true,
}) {
  const content = (
    <>
      <div className={iconContainerClass} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ScanningEyeIcon size={size} animated={animated} />
      </div>
      {showWordmark && (
        <span>
          Netra<span className="logo-highlight" style={{ color: "#2563EB" }}>Scan</span>
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className} style={{ textDecoration: "none" }}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

export default NetraScanLogo;
