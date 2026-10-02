import React from "react";
import Navbar from "../components/Navbar";
import TelemedicineCapacity from "../components/TelemedicineCapacity";

export default function CapacityDashboard() {
  return (
    <div
      className="home-page"
      style={{
        minHeight: "100vh",
        margin: 0,
        padding: 0,
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        backgroundColor: "#fbf7f0",
        backgroundImage: `
          radial-gradient(circle at 5% 95%, #e1eee8 0%, transparent 42%),
          radial-gradient(circle at 95% 15%, #fae6d7 0%, transparent 48%),
          radial-gradient(circle at 50% 50%, #fbf7f0 0%, transparent 100%)
        `,
        backgroundAttachment: "fixed",
        color: "#1a1a1e",
      }}
    >
      <Navbar />
      <div style={{ maxWidth: "1360px", margin: "0 auto", padding: "32px 24px" }}>
        <TelemedicineCapacity />
      </div>
    </div>
  );
}
