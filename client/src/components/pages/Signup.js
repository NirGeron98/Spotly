import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../shared/Footer";
import Navbar from "../shared/Navbar";
import { authService } from "../../services/authService";
import { buildingService } from "../../services/buildingService";
import AddressMapSelector from "../shared/AddressMapSelector";
import TermsContent from "../shared/TermsContent";

const Signup = ({ loggedIn, setLoggedIn, isRegistering }) => {
  document.title = "הרשמה | Spotly";
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [address, setAddress] = useState({ city: "", street: "", number: "" });
  const [feedback, setFeedback] = useState("");
  const [searching, setSearching] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsPopup, setShowTermsPopup] = useState(false);
  const [buildingInfo, setBuildingInfo] = useState(null);
  const [loadingBuilding, setLoadingBuilding] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone_number: "",
    password: "",
    passwordConfirm: "",
    residenceType: "",
    apartmentNumber: "",
    parkingNumber: "",
    parkingFloor: "",
    buildingCode: "",
  });

  // Fetch building information when code is entered
  const fetchBuildingInfo = async (code) => {
    if (!code || code.trim() === "") {
      setBuildingInfo(null);
      return;
    }

    setLoadingBuilding(true);
    try {
      const response = await buildingService.getBuildingByCode(code);
      if (response && response.data && response.data.building) {
        const building = response.data.building;
        setBuildingInfo(building);

        const addressComponents =
          buildingService.getBuildingAddressComponents(building);
        setAddress(addressComponents);

        setFeedback("✅ פרטי הבניין נטענו בהצלחה");
      }
    } catch (err) {
      console.error("Error fetching building:", err);
      setBuildingInfo(null);
      setFeedback("❌ לא נמצא בניין עם הקוד שהוזן");
    } finally {
      setLoadingBuilding(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.buildingCode) {
        fetchBuildingInfo(formData.buildingCode);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.buildingCode]);

  const handleNext = () => {
    setError("");
    const { fullName, email, password, passwordConfirm, phone_number } = formData;
    if (!fullName || !email || !password || !passwordConfirm || !phone_number) {
      setError("יש למלא את כל השדות");
      return;
    }
    if (password !== passwordConfirm) {
      setError("הסיסמאות אינן תואמות");
      return;
    }

    if (!/^\d{10}$/.test(formData.phone_number)) {
      setError("מספר הטלפון חייב להכיל 10 ספרות בדיוק");
      return;
    }
    setStep(2);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async () => {
    setError("");
    const {
      fullName,
      email,
      password,
      passwordConfirm,
      phone_number,
      residenceType,
      apartmentNumber,
      parkingNumber,
      parkingFloor,
      buildingCode,
    } = formData;

    const city = address.city;
    const street = address.street;
    const buildingNumber = address.number;

    if (
      !fullName ||
      !email ||
      !password ||
      !passwordConfirm ||
      !residenceType
    ) {
      setError("יש למלא את כל השדות חובה");
      return;
    }

    if (
      (residenceType === "apartment" || residenceType === "house") &&
      (!city || !street || !buildingNumber)
    ) {
      setError("יש למלא את פרטי הכתובת");
      return;
    }

    if (
      residenceType === "apartment" &&
      (!buildingCode || !apartmentNumber || !parkingNumber || !parkingFloor)
    ) {
      setError("יש למלא את כל הפרטים הקשורים לדירה ולחנייה בבניין");
      return;
    }

    if (residenceType === "apartment" && !buildingInfo) {
      setError("יש להזין קוד בניין תקין");
      return;
    }

    const [first_name, last_name] = fullName.trim().split(" ");

    let role = "user";
    if (residenceType === "apartment") role = "building_resident";
    else if (residenceType === "house") role = "private_prop_owner";

    try {
      const registrationData = {
        first_name,
        last_name,
        email,
        password,
        passwordConfirm,
        phone_number,
        role,
        spot_type: residenceType === "apartment" ? "building" : "private",
        apartment_number:
          residenceType === "apartment" ? apartmentNumber : null,
        spot_number: residenceType === "apartment" ? parkingNumber : null,
        spot_floor: residenceType === "apartment" ? parkingFloor : null,
      };

      if (residenceType === "apartment" || residenceType === "house") {
        registrationData.address = {
          city,
          street,
          number: parseInt(buildingNumber, 10),
        };
      }

      if (residenceType === "apartment" && buildingInfo) {
        registrationData.resident_building = buildingInfo._id;
      }

      console.log("Registration data:", registrationData);

      await authService.register(registrationData);

      const response = await authService.login({ email, password });
      const user =
        response?.data?.user ||
        response?.data?.data?.user ||
        response?.data?.data;

      localStorage.setItem("user", JSON.stringify(user));
      setLoggedIn(true);
      setSuccess("נרשמת בהצלחה! מעביר אותך לדף הבית...");

      if (user.role === "building_resident") {
        navigate("/dashboard");
      } else {
        navigate("/search-parking");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("אירעה שגיאה. ייתכן שהאימייל כבר קיים או שהסיסמה לא תקינה.");
    }
  };

  return (
    <div className="pt-[68px] min-h-screen max-h-screen flex flex-col relative overflow-hidden" dir="rtl">
      {/* Animated Background System - Matching Home/Login */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
        {/* Large Floating Orbs */}
        <div 
          className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-60"
          style={{
            animation: 'float 8s ease-in-out infinite'
          }}
        ></div>
        <div 
          className="absolute top-1/3 right-10 w-80 h-80 bg-sky-200 rounded-full mix-blend-multiply filter blur-2xl opacity-60"
          style={{
            animation: 'float 10s ease-in-out infinite',
            animationDelay: '2s'
          }}
        ></div>
        <div 
          className="absolute bottom-10 left-1/3 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-2xl opacity-60"
          style={{
            animation: 'float 12s ease-in-out infinite',
            animationDelay: '4s'
          }}
        ></div>
        
        {/* Moving Gradient Waves */}
        <div className="absolute inset-0 opacity-20">
          <div 
            className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-blue-200 to-transparent transform rotate-12"
            style={{
              animation: 'slide 15s linear infinite'
            }}
          ></div>
          <div 
            className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-sky-200 to-transparent transform -rotate-12"
            style={{
              animation: 'slide 18s linear infinite reverse',
              animationDelay: '7s'
            }}
          ></div>
        </div>
      </div>

      <Navbar
        loggedIn={loggedIn}
        setLoggedIn={setLoggedIn}
        isRegistering={isRegistering}
      />

      <main className="flex-1 py-4 relative z-10 overflow-hidden">
        <div className="container mx-auto px-6 h-full">
          <div 
            className="max-w-2xl mx-auto backdrop-blur-md bg-white/80 rounded-3xl shadow-2xl border border-white/20 overflow-hidden h-full max-h-[calc(100vh-200px)] flex flex-col"
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              animation: 'fadeInUp 0.8s ease-out'
            }}
          >
            {/* Animated Gradient Header */}
            <div 
              className="h-2 bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-500"
              style={{
                animation: 'shimmer 3s ease-in-out infinite'
              }}
            ></div>

            {/* Step Progress Indicator */}
            <div className="px-8 pt-4">
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center space-x-4">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      step >= 1 
                        ? 'bg-gradient-to-r from-blue-500 to-sky-600 text-white shadow-lg' 
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    1
                  </div>
                  <div 
                    className={`w-16 h-1 transition-all duration-300 ${
                      step >= 2 ? 'bg-gradient-to-r from-blue-400 to-sky-400' : 'bg-gray-200'
                    }`}
                  ></div>
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      step >= 2 
                        ? 'bg-gradient-to-r from-blue-500 to-sky-600 text-white shadow-lg' 
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    2
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 pb-4 flex-1 overflow-y-auto">
              {step === 1 && (
                <div 
                  style={{
                    animation: 'fadeInUp 0.6s ease-out'
                  }}
                >
                  {/* Enhanced Title */}
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2 relative">
                      הרשמה
                      <div 
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-blue-400 to-sky-400 rounded-full"
                        style={{
                          animation: 'pulse 2s ease-in-out infinite'
                        }}
                      ></div>
                    </h2>
                    <p className="text-gray-600 mt-3">צור את החשבון שלך</p>
                  </div>

                  {/* Enhanced Error Message */}
                  {error && (
                    <div 
                      className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 relative overflow-hidden"
                      style={{
                        animation: 'slideInDown 0.5s ease-out'
                      }}
                    >
                      <div className="flex items-center relative z-10">
                        <div className="flex-shrink-0">
                          <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <span className="font-medium">{error}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Form Fields */}
                  <div className="space-y-4">
                    <div className="group">
                      <label className="block text-gray-700 text-sm font-semibold mb-2 transition-colors group-focus-within:text-blue-600">
                        שם מלא
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        placeholder="שם מלא"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-400/50 focus:border-blue-400 transition-all duration-300 bg-white/90 backdrop-blur-sm placeholder-gray-400 hover:shadow-md"
                      />
                    </div>

                    <div className="group">
                      <label className="block text-gray-700 text-sm font-semibold mb-2 transition-colors group-focus-within:text-blue-600">
                        אימייל
                      </label>
                      <input
                        type="email"
                        name="email"
                        placeholder="example@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-400/50 focus:border-blue-400 transition-all duration-300 bg-white/90 backdrop-blur-sm placeholder-gray-400 hover:shadow-md"
                      />
                    </div>

                    <div className="group">
                      <label className="block text-gray-700 text-sm font-semibold mb-2 transition-colors group-focus-within:text-blue-600">
                        מספר טלפון
                      </label>
                      <input
                        type="tel"
                        name="phone_number"
                        placeholder="0501234567"
                        value={formData.phone_number}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-400/50 focus:border-blue-400 transition-all duration-300 bg-white/90 backdrop-blur-sm placeholder-gray-400 hover:shadow-md"
                        dir="rtl"
                      />
                    </div>

                    <div className="group">
                      <label className="block text-gray-700 text-sm font-semibold mb-2 transition-colors group-focus-within:text-blue-600">
                        סיסמה
                      </label>
                      <input
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-400/50 focus:border-blue-400 transition-all duration-300 bg-white/90 backdrop-blur-sm placeholder-gray-400 hover:shadow-md"
                      />
                    </div>

                    <div className="group">
                      <label className="block text-gray-700 text-sm font-semibold mb-2 transition-colors group-focus-within:text-blue-600">
                        אימות סיסמה
                      </label>
                      <input
                        type="password"
                        name="passwordConfirm"
                        placeholder="••••••••"
                        value={formData.passwordConfirm}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-400/50 focus:border-blue-400 transition-all duration-300 bg-white/90 backdrop-blur-sm placeholder-gray-400 hover:shadow-md"
                      />
                    </div>
                  </div>

                  {/* Enhanced Next Button */}
                  <div className="flex justify-end mt-6">
                    <button 
                      onClick={handleNext} 
                      className="px-8 py-2.5 bg-gradient-to-r from-blue-500 to-sky-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-sky-700 focus:outline-none focus:ring-4 focus:ring-blue-400/50 transform transition-all duration-300 hover:scale-105 active:scale-95 relative overflow-hidden group shadow-lg"
                    >
                      <span className="relative z-10">המשך</span>
                      <div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] skew-x-12 transition-transform duration-1000 group-hover:translate-x-[100%]"
                      ></div>
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div 
                  style={{
                    animation: 'fadeInUp 0.6s ease-out'
                  }}
                >
                  {/* Back Button */}
                  <div className="flex justify-start mb-6">
                    <button 
                      onClick={() => setStep(1)} 
                      className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                      ← הקודם
                    </button>
                  </div>

                  {/* Enhanced Title */}
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2 relative">
                      בחירת מסלול
                      <div 
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-blue-400 to-sky-400 rounded-full"
                        style={{
                          animation: 'pulse 2s ease-in-out infinite'
                        }}
                      ></div>
                    </h2>
                    <p className="text-gray-600 mt-4 font-medium">בחר אפשרות מבין המסלולים השונים</p>
                  </div>

                  {/* Enhanced Route Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {[
                      { key: "apartment", label: "בניין מגורים", icon: "🏢", color: "blue" },
                      { key: "house", label: "בית פרטי", icon: "🏠", color: "green" },
                      { key: "rental", label: "השכרת חניות פרטיות", icon: "🚗", color: "purple" }
                    ].map((type) => (
                      <button
                        key={type.key}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            residenceType: type.key,
                          }))
                        }
                        className={`p-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 text-center relative overflow-hidden group ${
                          formData.residenceType === type.key
                            ? `border-${type.color}-400 bg-gradient-to-br from-${type.color}-50 to-${type.color}-100 shadow-lg`
                            : "border-gray-200 bg-white/80 hover:border-gray-300 hover:shadow-md"
                        }`}
                      >
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform translate-x-[-100%] skew-x-12 transition-transform duration-1000 group-hover:translate-x-[100%]"
                        ></div>
                        <div className="relative z-10">
                          <div className="text-3xl mb-2">{type.icon}</div>
                          <div className={`font-semibold text-sm ${
                            formData.residenceType === type.key ? `text-${type.color}-700` : "text-gray-700"
                          }`}>
                            {type.label}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Form Fields Based on Selection */}
                  {(formData.residenceType === "apartment" || formData.residenceType === "house") && (
                    <div className="space-y-4 mb-4">
                      {formData.residenceType === "apartment" && (
                        <>
                          <div className="group">
                            <label className="block text-gray-700 text-sm font-semibold mb-2 transition-colors group-focus-within:text-blue-600">
                              קוד בניין
                            </label>
                            <input
                              type="text"
                              name="buildingCode"
                              placeholder="קוד בניין"
                              value={formData.buildingCode}
                              onChange={handleChange}
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-400/50 focus:border-blue-400 transition-all duration-300 bg-white/90 backdrop-blur-sm placeholder-gray-400 hover:shadow-md"
                            />
                            {loadingBuilding && (
                              <div className="flex items-center text-sm text-blue-600 mt-2">
                                <div className="mr-2 w-4 h-4 border-t-2 border-blue-600 rounded-full animate-spin"></div>
                                טוען פרטי בניין...
                              </div>
                            )}
                            {buildingInfo && (
                              <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl border border-blue-200 shadow-sm">
                                <h4 className="font-bold text-blue-800 mb-2">פרטי הבניין:</h4>
                                <p className="text-sm text-blue-700">
                                  כתובת: {buildingService.formatBuildingAddress(buildingInfo)}
                                </p>
                                {buildingInfo.building_number && (
                                  <p className="text-sm text-blue-700">
                                    קוד בניין: {buildingInfo.building_number}
                                  </p>
                                )}
                              </div>
                            )}
                            {feedback && !buildingInfo && (
                              <p className="text-sm text-red-500 mt-2 font-medium">{feedback}</p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="group">
                              <label className="block text-gray-700 text-sm font-semibold mb-2">
                                מספר דירה
                              </label>
                              <input
                                type="text"
                                name="apartmentNumber"
                                placeholder="מספר דירה"
                                value={formData.apartmentNumber}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-400/50 focus:border-blue-400 transition-all duration-300 bg-white/90 backdrop-blur-sm placeholder-gray-400 hover:shadow-md"
                              />
                            </div>
                            <div className="group">
                              <label className="block text-gray-700 text-sm font-semibold mb-2">
                                מספר חנייה
                              </label>
                              <input
                                type="text"
                                name="parkingNumber"
                                placeholder="מספר חנייה"
                                value={formData.parkingNumber}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-400/50 focus:border-blue-400 transition-all duration-300 bg-white/90 backdrop-blur-sm placeholder-gray-400 hover:shadow-md"
                              />
                            </div>
                            <div className="group">
                              <label className="block text-gray-700 text-sm font-semibold mb-2">
                                קומת חנייה
                              </label>
                              <input
                                type="text"
                                name="parkingFloor"
                                placeholder="קומת חנייה"
                                value={formData.parkingFloor}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-400/50 focus:border-blue-400 transition-all duration-300 bg-white/90 backdrop-blur-sm placeholder-gray-400 hover:shadow-md"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {formData.residenceType === "house" && (
                        <div className="p-4 bg-white/60 rounded-xl border border-gray-200 backdrop-blur-sm">
                          <AddressMapSelector
                            address={address}
                            setAddress={setAddress}
                            feedback={feedback}
                            setFeedback={setFeedback}
                            searching={searching}
                            setSearching={setSearching}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Info Note */}
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-sky-50 rounded-xl border border-blue-200 mb-4">
                    <p className="text-sm text-blue-700 text-center">
                      💡 ניתן להשכיר חניה פרטית (כולל חניה עם עמדת טעינה לרכב חשמלי) בכל אחד מהמסלולים.
                    </p>
                  </div>

                  {/* Enhanced Error/Success Messages */}
                  {error && (
                    <div 
                      className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4"
                      style={{
                        animation: 'slideInDown 0.5s ease-out'
                      }}
                    >
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-red-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{error}</span>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div 
                      className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4"
                      style={{
                        animation: 'slideInDown 0.5s ease-out'
                      }}
                    >
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{success}</span>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Terms and Register Section */}
                  <div className="space-y-4">
                    <div className="flex items-center p-3 bg-white/60 rounded-xl border border-gray-200 backdrop-blur-sm">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ml-3"
                      />
                      <label htmlFor="terms" className="text-sm text-gray-700 flex-1">
                        קראתי ואני מסכים ל
                        <button
                          type="button"
                          onClick={() => setShowTermsPopup(true)}
                          className="text-blue-600 underline hover:text-blue-800 mx-1 font-medium transition-colors"
                        >
                          תנאי השימוש
                        </button>
                      </label>
                    </div>

                    {/* Enhanced Register Button */}
                    <button
                      onClick={handleRegister}
                      disabled={!termsAccepted}
                      className={`w-full py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform active:scale-95 relative overflow-hidden group ${
                        termsAccepted
                          ? "bg-gradient-to-r from-blue-500 to-sky-600 text-white hover:from-blue-600 hover:to-sky-700 hover:scale-105 shadow-lg hover:shadow-xl"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <span className="relative z-10">🎉 הרשמה</span>
                      {termsAccepted && (
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] skew-x-12 transition-transform duration-1000 group-hover:translate-x-[100%]"
                        ></div>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Enhanced Terms Popup */}
      {showTermsPopup && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm"
          style={{
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <div 
            className="bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-4xl mx-4 relative border border-white/20"
            style={{
              animation: 'slideInUp 0.4s ease-out',
              maxHeight: '80vh'
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-blue-800">📋 תנאי השימוש</h3>
              <button
                onClick={() => setShowTermsPopup(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            <div 
              className="overflow-y-auto pr-2"
              style={{ maxHeight: 'calc(80vh - 120px)' }}
            >
              <TermsContent />
            </div>
            <div className="mt-6 flex justify-end">
              <button
                className="bg-gradient-to-r from-blue-500 to-sky-600 text-white px-8 py-3 rounded-xl hover:from-blue-600 hover:to-sky-700 transition-all duration-300 transform hover:scale-105 active:scale-95 font-semibold"
                onClick={() => setShowTermsPopup(false)}
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Ambient Elements */}
      <div 
        className="fixed top-1/4 left-8 w-3 h-3 bg-blue-300 rounded-full opacity-40"
        style={{
          animation: 'ping 4s cubic-bezier(0, 0, 0.2, 1) infinite',
          animationDelay: '2s'
        }}
      ></div>
      <div 
        className="fixed top-1/2 right-12 w-2 h-2 bg-sky-300 rounded-full opacity-40"
        style={{
          animation: 'ping 4s cubic-bezier(0, 0, 0.2, 1) infinite',
          animationDelay: '4s'
        }}
      ></div>
      <div 
        className="fixed bottom-1/3 left-12 w-4 h-4 bg-cyan-300 rounded-full opacity-40"
        style={{
          animation: 'ping 4s cubic-bezier(0, 0, 0.2, 1) infinite',
          animationDelay: '6s'
        }}
      ></div>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          33% { transform: translateY(-30px) translateX(20px) rotate(120deg); }
          66% { transform: translateY(20px) translateX(-20px) rotate(240deg); }
        }
        
        @keyframes slide {
          0% { transform: translateX(-100%) rotate(12deg); }
          100% { transform: translateX(100%) rotate(12deg); }
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(50px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .7; }
        }
        
        @keyframes slideInDown {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes slideInUp {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default Signup;