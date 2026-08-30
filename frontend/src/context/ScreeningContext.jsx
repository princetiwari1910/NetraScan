import { createContext, useContext, useState, useEffect } from "react";
import { checkHealth, fetchCurrentUser } from "../services/api";

const ScreeningContext = createContext(null);

export function ScreeningProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("netrascan_user");
    return savedUser
      ? JSON.parse(savedUser)
      : {
          id: 3,
          name: "Suresh Shinde",
          role: "STAFF",
          phc_id: 1,
          phc_code: "PUNE",
          phc_name: "Primary Health Centre Pune",
        };
  });

  const [patient, setPatient] = useState({
    id: 1,
    patient_uid: "NS-PUN-000001",
    full_name: "Rahul Sharma",
    name: "Rahul Sharma",
    age: "58",
    gender: "Male",
    phone: "+91-9823112233",
    diabetes_status: "Type 2",
    diabetes_duration: "8 years",
    medical_notes: "History of moderate hypertension. Regular metformin.",
    location: "Primary Health Centre Pune",
    examined_eye: "OD - Right Eye",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [screeningRecord, setScreeningRecord] = useState(null);
  const [healthData, setHealthData] = useState(null);

  // Fetch live system health from FastAPI on mount
  useEffect(() => {
    const fetchStatus = async () => {
      const data = await checkHealth();
      setHealthData(data);
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync current user profile if token exists
  useEffect(() => {
    const token = localStorage.getItem("netrascan_token");
    if (token) {
      fetchCurrentUser()
        .then((u) => {
          setUser(u);
          localStorage.setItem("netrascan_user", JSON.stringify(u));
        })
        .catch(() => {
          // Keep current user state
        });
    }
  }, []);

  // Backwards compatible PHC object
  const phc = {
    id: user?.phc_code ? `PHC-${user.phc_code}-001` : "PHC-PUNE-001",
    name: user?.phc_name || "Primary Health Centre Pune",
    location: user?.phc_name || "Pune, Maharashtra",
    code: user?.phc_code || "PUNE",
  };

  const loginUserContext = (authResponse) => {
    const u = authResponse.user;
    setUser(u);
    localStorage.setItem("netrascan_user", JSON.stringify(u));
    localStorage.setItem("netrascan_token", authResponse.access_token);
  };

  const logoutPhc = () => {
    setUser(null);
    localStorage.removeItem("netrascan_user");
    localStorage.removeItem("netrascan_token");
  };

  const startNewScreening = (selectedPatient = null) => {
    if (selectedPatient) {
      setPatient({
        ...selectedPatient,
        name: selectedPatient.full_name,
        examined_eye: "OD - Right Eye",
      });
    } else {
      setPatient({
        id: null,
        patient_uid: `NS-${user?.phc_code || "PUN"}-NEW`,
        full_name: "",
        name: "",
        age: "",
        gender: "Male",
        phone: "",
        diabetes_status: "Type 2",
        diabetes_duration: "",
        medical_notes: "",
        location: user?.phc_name || "Primary Health Centre",
        examined_eye: "OD - Right Eye",
      });
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setImage(null);
    setPreview(null);
    setAnalysisResult(null);
    setScreeningRecord(null);
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
    setScreeningRecord(null);
  };

  const value = {
    user,
    setUser,
    loginUserContext,
    patient,
    setPatient,
    image,
    preview,
    saveImage,
    clearImage,
    analysisResult,
    setAnalysisResult,
    screeningRecord,
    setScreeningRecord,
    healthData,
    startNewScreening,
    phc,
    loginPhc: loginUserContext,
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