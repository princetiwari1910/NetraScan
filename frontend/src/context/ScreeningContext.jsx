import { createContext, useContext, useState, useEffect } from "react";
import { checkHealth } from "../services/api";

const ScreeningContext = createContext(null);

export function ScreeningProvider({ children }) {
  const [patient, setPatient] = useState({
    id: "NS-2026-001",
    age: "58",
    gender: "Male",
    location: "PHC Tele-Screening Unit #01",
    examined_eye: "OD - Right Eye",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [healthData, setHealthData] = useState(null);

  // Fetch live system health from FastAPI on mount
  useEffect(() => {
    const fetchStatus = async () => {
      const data = await checkHealth();
      setHealthData(data);
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 20000);
    return () => clearInterval(interval);
  }, []);

  // ================= PHC LOGIN =================
  const [phc, setPhc] = useState(() => {
    const savedPhc = localStorage.getItem("netrascan_phc");
    return savedPhc
      ? JSON.parse(savedPhc)
      : {
          id: "PHC-PUNE-001",
          name: "Primary Health Centre",
          location: "Pune, Maharashtra",
        };
  });

  const loginPhc = (phcData) => {
    setPhc(phcData);
    localStorage.setItem("netrascan_phc", JSON.stringify(phcData));
  };

  const logoutPhc = () => {
    setPhc(null);
    localStorage.removeItem("netrascan_phc");
  };

  // ================= SCREENING =================
  const startNewScreening = () => {
    setPatient({
      id: `NS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      age: "",
      gender: "",
      location: phc?.location || "Primary Health Centre",
      examined_eye: "OD - Right Eye",
    });

    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setImage(null);
    setPreview(null);
    setAnalysisResult(null);
  };

  const saveImage = (file) => {
    if (!file) return;
    setImage(file);
    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
  };

  const clearImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setImage(null);
    setPreview(null);
    setAnalysisResult(null);
  };

  const value = {
    patient,
    setPatient,
    image,
    preview,
    saveImage,
    clearImage,
    analysisResult,
    setAnalysisResult,
    healthData,
    startNewScreening,
    phc,
    loginPhc,
    logoutPhc,
  };

  return (
    <ScreeningContext.Provider value={value}>
      {children}
    </ScreeningContext.Provider>
  );
}

export function useScreening() {
  const context = useContext(ScreeningContext);
  if (!context) {
    throw new Error("useScreening must be used inside ScreeningProvider");
  }
  return context;
}