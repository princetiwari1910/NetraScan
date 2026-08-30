import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Building2,
  UserCheck,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Stethoscope,
  Users,
  KeyRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const DEMO_PRESETS = [
  {
    role: "SUPER_ADMIN",
    label: "Super Admin",
    badge: "Platform Wide",
    email: "admin@netrascan.demo",
    password: "Demo@Admin123",
    icon: Sparkles,
    color: "#8B5CF6",
  },
  {
    role: "DOCTOR",
    label: "Dr. Aarav Joshi",
    badge: "PHC Pune • Doctor",
    email: "doctor.pune@netrascan.demo",
    password: "Demo@Pune123",
    icon: Stethoscope,
    color: "#2563EB",
  },
  {
    role: "STAFF",
    label: "Sunil Shinde",
    badge: "PHC Pune • Staff",
    email: "staff.pune@netrascan.demo",
    password: "Demo@Pune123",
    icon: Users,
    color: "#10B981",
  },
  {
    role: "DOCTOR",
    label: "Dr. Meera Kulkarni",
    badge: "PHC Mumbai • Doctor",
    email: "doctor.mumbai@netrascan.demo",
    password: "Demo@Mumbai123",
    icon: Stethoscope,
    color: "#0284C7",
  },
  {
    role: "STAFF",
    label: "Anjali Sawant",
    badge: "PHC Mumbai • Staff",
    email: "staff.mumbai@netrascan.demo",
    password: "Demo@Mumbai123",
    icon: Users,
    color: "#10B981",
  },
  {
    role: "DOCTOR",
    label: "Dr. Rajesh Sharma",
    badge: "PHC Delhi • Doctor",
    email: "doctor.delhi@netrascan.demo",
    password: "Demo@Delhi123",
    icon: Stethoscope,
    color: "#F59E0B",
  },
  {
    role: "DOCTOR",
    label: "Dr. Swathi Reddy",
    badge: "PHC Hyderabad • Doctor",
    email: "doctor.hyderabad@netrascan.demo",
    password: "Demo@Hyderabad123",
    icon: Stethoscope,
    color: "#EC4899",
  },
];

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("doctor.pune@netrascan.demo");
  const [password, setPassword] = useState("Demo@Pune123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAutofill = (preset) => {
    setEmail(preset.email);
    setPassword(preset.password);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate("/home");
      } else {
        setError(res.error || "Invalid login credentials.");
      }
    } catch (err) {
      setError("Network or server connection error. Please ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #070D18 0%, #0F172A 100%)",
        color: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Header */}
      <header
        style={{
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #2563EB, #38BDF8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(56, 189, 248, 0.4)",
            }}
          >
            <Eye size={22} color="#FFFFFF" />
          </div>
          <span style={{ fontSize: "20px", fontWeight: "700", letterSpacing: "-0.5px" }}>
            Netra<span style={{ color: "#38BDF8" }}>Scan</span>
          </span>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(56, 189, 248, 0.1)",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            color: "#38BDF8",
            fontWeight: "600",
          }}
        >
          <ShieldCheck size={14} />
          Multi-Tenant Clinical Authentication
        </div>
      </header>

      {/* Main Grid */}
      <main
        style={{
          flex: 1,
          maxWidth: "1160px",
          width: "100%",
          margin: "40px auto",
          padding: "0 24px",
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr",
          gap: "40px",
          alignItems: "center",
        }}
      >
        {/* Left: Login Form */}
        <div
          style={{
            background: "#0E1829",
            border: "1px solid #1E2E48",
            borderRadius: "20px",
            padding: "36px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div style={{ marginBottom: "28px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#38BDF8",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              CLINICAL PORTAL ACCESS
            </span>
            <h1 style={{ fontSize: "26px", fontWeight: "700", marginTop: "4px", color: "#FFFFFF" }}>
              Sign in to NetraScan
            </h1>
            <p style={{ fontSize: "14px", color: "#94A3B8", marginTop: "6px" }}>
              Authenticate with your credentials. Your role and assigned PHC tenant will be automatically verified.
            </p>
          </div>

          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                padding: "12px 16px",
                borderRadius: "10px",
                color: "#FCA5A5",
                fontSize: "13px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "18px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#CBD5E1",
                  marginBottom: "6px",
                }}
              >
                Email / User ID
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#070F1C",
                  border: "1px solid #1E2E48",
                  borderRadius: "10px",
                  padding: "0 14px",
                }}
              >
                <Mail size={17} color="#64748B" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor.pune@netrascan.demo"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 10px",
                    background: "transparent",
                    border: "none",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "26px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#CBD5E1",
                  marginBottom: "6px",
                }}
              >
                Password
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#070F1C",
                  border: "1px solid #1E2E48",
                  borderRadius: "10px",
                  padding: "0 14px",
                }}
              >
                <Lock size={17} color="#64748B" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 10px",
                    background: "transparent",
                    border: "none",
                    color: "#FFFFFF",
                    fontSize: "14px",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                border: "none",
                color: "#FFFFFF",
                fontSize: "15px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 10px 20px -5px rgba(37, 99, 235, 0.4)",
              }}
            >
              {loading ? "Verifying Credentials..." : "Sign In to Clinic Workspace"}
              <ArrowRight size={18} />
            </button>
          </form>

          <p style={{ marginTop: "22px", fontSize: "12px", color: "#64748B", textAlign: "center" }}>
            🔒 Role-based multi-tenancy enforced. Data strictly isolated per Primary Health Centre.
          </p>
        </div>

        {/* Right: Quick Demo Persona Selector */}
        <div>
          <div style={{ marginBottom: "16px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#38BDF8",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              TEST PERSONAS & DEMO SEED DATA
            </span>
            <h2 style={{ fontSize: "20px", fontWeight: "700", marginTop: "4px", color: "#FFFFFF" }}>
              Select Account to Test
            </h2>
            <p style={{ fontSize: "13px", color: "#94A3B8" }}>
              Click any role to autofill development credentials and test multi-PHC data isolation.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "420px", overflowY: "auto", paddingRight: "4px" }}>
            {DEMO_PRESETS.map((preset, index) => {
              const Icon = preset.icon;
              const isSelected = email === preset.email;

              return (
                <div
                  key={index}
                  onClick={() => handleAutofill(preset)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: isSelected ? "rgba(37, 99, 235, 0.15)" : "#0E1829",
                    border: isSelected
                      ? "1px solid #38BDF8"
                      : "1px solid #1E2E48",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "8px",
                        background: `${preset.color}20`,
                        color: preset.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong style={{ fontSize: "14px", color: "#FFFFFF" }}>
                          {preset.label}
                        </strong>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            background: `${preset.color}25`,
                            color: preset.color,
                            fontWeight: "700",
                          }}
                        >
                          {preset.badge}
                        </span>
                      </div>
                      <span style={{ fontSize: "12px", color: "#64748B", fontFamily: "monospace" }}>
                        {preset.email}
                      </span>
                    </div>
                  </div>

                  <ChevronRight size={16} color={isSelected ? "#38BDF8" : "#475569"} />
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: "16px",
              padding: "12px 14px",
              background: "#0B1424",
              borderRadius: "10px",
              border: "1px solid #1E2E48",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "11px",
              color: "#94A3B8",
            }}
          >
            <KeyRound size={14} color="#38BDF8" />
            <span>
              <strong>Notice:</strong> These are demonstration credentials. In clinical production, credentials are provisioned by hospital administrators.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;