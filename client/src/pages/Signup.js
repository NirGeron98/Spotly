import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/shared/Footer";
import Navbar from "../components/shared/Navbar";
import { authService } from "../services/authService";
import { buildingService } from "../services/buildingService";
import AddressMapSelector from "../components/shared/AddressMapSelector";
import TermsContent from "../components/shared/TermsContent";

const Signup = ({ loggedIn, setLoggedIn }) => {
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
  const [showMapPopup, setShowMapPopup] = useState(false);

  // Loading animation state
  const [isRegistering, setIsRegistering] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");

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
      if (formData.residenceType === "apartment" && formData.buildingCode) {
        fetchBuildingInfo(formData.buildingCode);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.buildingCode, formData.residenceType]);

  // Progress bar animation effect
  useEffect(() => {
    let interval;
    if (isRegistering) {
      const messages = [
        "יוצר את החשבון שלך...",
        "מאמת פרטים...",
        "מגדיר את הפרופיל שלך...",
        "כמעט סיימנו...",
        "מכין את הדף הבית שלך...",
      ];

      let messageIndex = 0;
      let progress = 0;

      interval = setInterval(() => {
        progress += Math.random() * 15 + 5; // Random progress increment
        if (progress > 100) progress = 100;

        setLoadingProgress(progress);

        // Change message every 20% progress
        const newMessageIndex = Math.floor(progress / 20);
        if (
          newMessageIndex !== messageIndex &&
          newMessageIndex < messages.length
        ) {
          messageIndex = newMessageIndex;
          setLoadingMessage(messages[messageIndex]);
        }
      }, 300);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRegistering]);

  const handleNext = () => {
    setError("");
    const { fullName, email, password, passwordConfirm, phone_number } =
      formData;
    if (!fullName || !email || !password || !passwordConfirm || !phone_number) {
      setError("יש למלא את כל השדות");
      return;
    }

    if (password.length < 8) {
      setError("הסיסמה חייבת להכיל לפחות 8 תווים");
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
    setIsRegistering(true); // Start loading animation
    setLoadingProgress(0);
    setLoadingMessage("יוצר את החשבון שלך...");

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
      setIsRegistering(false);
      return;
    }

    if (
      (residenceType === "apartment" || residenceType === "house") &&
      (!city || !street || !buildingNumber)
    ) {
      setError("יש למלא את פרטי הכתובת");
      setIsRegistering(false);
      return;
    }

    if (
      residenceType === "apartment" &&
      (!buildingCode || !apartmentNumber || !parkingNumber || !parkingFloor)
    ) {
      setError("יש למלא את כל הפרטים הקשורים לדירה ולחנייה בבניין");
      setIsRegistering(false);
      return;
    }

    if (residenceType === "apartment" && !buildingInfo) {
      setError("יש להזין קוד בניין תקין");
      setIsRegistering(false);
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
          residenceType === "apartment" ? Number(apartmentNumber) : null,
        spot_number:
          residenceType === "apartment" ? Number(parkingNumber) : null,
        spot_floor:
          residenceType === "apartment" && parkingFloor
            ? Number(parkingFloor)
            : 1,
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

      await authService.register(registrationData);

      // Update loading message after successful registration
      setLoadingMessage("נרשמת בהצלחה! מתחבר לחשבון...");
      setLoadingProgress(80);

      const response = await authService.login({ email, password });
      const user =
        response?.data?.user ||
        response?.data?.data?.user ||
        response?.data?.data;

      localStorage.setItem("user", JSON.stringify(user));
      // Set mode based on role
      if (user.role === "building_resident") {
        localStorage.setItem("mode", "building");
      } else {
        localStorage.setItem("mode", "regular");
      }

      setLoggedIn(true);

      // Final update before redirect
      setLoadingMessage("מכין את הדף הבית שלך...");
      setLoadingProgress(100);
      setSuccess("נרשמת בהצלחה! מעביר אותך לדף הבית...");

      // Brief wait before redirect to show complete animation
      setTimeout(() => {
        console.log("Signup - Navigating based on role:", user.role); // Debug log

        // Navigate to the appropriate home page
        if (user.role === "building_resident") {
          console.log("Signup - Redirecting to dashboard"); // Debug log
          navigate("/dashboard");
        } else if (user.role === "user" || user.role === "private_prop_owner") {
          console.log("Signup - Redirecting to search-parking"); // Debug log
          navigate("/search-parking");
        } else {
          console.log("Signup - Unknown role, redirecting to dashboard"); // Debug log
          navigate("/dashboard");
        }
      }, 1000);
    } catch (err) {
      console.error("Registration error:", err);
      setIsRegistering(false); // Stop loading animation on error

      if (err.response) {
        console.log("");
      }

      let message = "אירעה שגיאה. ודא שכל השדות מולאו כראוי ונסה שוב.";

      if (err.response?.data?.error?.code === 11000) {
        const { keyPattern } = err.response.data.error;

        if (keyPattern?.email) {
          message = "האימייל כבר קיים במערכת.";
        } else if (keyPattern?.phone_number) {
          message = "מספר הטלפון כבר קיים במערכת.";
        } else if (
          keyPattern?.building &&
          keyPattern?.spot_number &&
          keyPattern?.floor
        ) {
          message = "נראה שכבר קיימת חניה עם הפרטים שסיפקת. אנא בדוק ונסה שוב.";
        } else {
          message = "שדה מסוים כבר קיים במערכת ואינו יכול להיות כפול.";
        }
      }

      setError(message);
    }
  };

  // Compact loading popup component
  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-gray-100">
        {/* Header with icon */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full flex items-center justify-center text-xl animate-pulse">
            🎉
          </div>
        </div>

        {/* Loading message */}
        <h3 className="text-lg font-bold text-gray-800 text-center mb-4">
          {loadingMessage}
        </h3>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-sky-500 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
            style={{ width: `${loadingProgress}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
          </div>
        </div>

        {/* Progress percentage and dots */}
        <div className="flex items-center justify-between">
          <p className="text-gray-600 text-sm font-medium">
            {Math.round(loadingProgress)}%
          </p>

          {/* Bouncing dots animation */}
          <div className="flex space-x-1" dir="ltr">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="pt-[68px] min-h-screen flex flex-col relative bg-gradient-to-br from-blue-50 to-sky-100"
      dir="rtl"
    >
      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} />

      <main className="flex-1 relative z-10 py-4">
        <div className="container mx-auto px-6">
          <div className="max-w-xl mx-auto w-full">
            <div className="bg-white/70 backdrop-blur-lg border border-blue-100 rounded-2xl shadow-xl px-6 py-6 transition-all duration-500">
              {/* Step Progress Indicator */}
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center justify-center w-full max-w-xs">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      step >= 1
                        ? "bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-lg"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    1
                  </div>
                  <div
                    className={`w-12 h-1 transition-all duration-300 ${
                      step >= 2
                        ? "bg-gradient-to-r from-blue-600 to-sky-600"
                        : "bg-gray-200"
                    }`}
                  ></div>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      step >= 2
                        ? "bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-lg"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    2
                  </div>
                </div>
              </div>

              {step === 1 && (
                <div>
                  {/* Title */}
                  <div className="text-center mb-6">
                    <h1 className="text-3xl font-extrabold text-blue-800 mb-2 tracking-tight">
                      הרשמה
                    </h1>
                    <p className="text-blue-700 font-medium text-sm">
                      צור את החשבון שלך
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="mb-4 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-sm font-medium">{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-blue-800 mb-1">
                        שם מלא
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        placeholder="שם מלא"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full px-3 py-3 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 placeholder-gray-400 text-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-blue-800 mb-1">
                        אימייל
                      </label>
                      <input
                        type="email"
                        name="email"
                        placeholder="אימייל"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-3 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 placeholder-gray-400 text-gray-800"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-blue-800 mb-1">
                        מספר טלפון
                      </label>
                      <input
                        type="tel"
                        name="phone_number"
                        placeholder="מספר טלפון"
                        value={formData.phone_number}
                        onChange={handleChange}
                        className="w-full px-3 py-3 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 placeholder-gray-400 text-gray-800"
                        dir="rtl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-blue-800 mb-1">
                          סיסמה
                        </label>
                        <input
                          type="password"
                          name="password"
                          placeholder="סיסמה"
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full px-3 py-3 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 placeholder-gray-400 text-gray-800"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-blue-800 mb-1">
                          אימות סיסמה
                        </label>
                        <input
                          type="password"
                          name="passwordConfirm"
                          placeholder="אימות סיסמה"
                          value={formData.passwordConfirm}
                          onChange={handleChange}
                          className="w-full px-3 py-3 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 placeholder-gray-400 text-gray-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Next Button */}
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={handleNext}
                      className="bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-semibold py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                    >
                      המשך
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  {/* Back Button */}
                  <div className="flex justify-start mb-4">
                    <button
                      onClick={() => setStep(1)}
                      className="px-4 py-2 border border-blue-300 text-blue-700 font-semibold rounded-lg hover:bg-blue-100 transition-all duration-300"
                      disabled={isRegistering}
                    >
                      ← הקודם
                    </button>
                  </div>

                  {/* Title */}
                  <div className="text-center mb-6">
                    <h1 className="text-3xl font-extrabold text-blue-800 mb-2 tracking-tight">
                      בחירת מסלול
                    </h1>
                    <p className="text-blue-700 font-medium text-sm">
                      בחר אפשרות מבין המסלולים השונים
                    </p>
                  </div>

                  {/* Route Selection */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      {
                        key: "apartment",
                        label: "בניין מגורים",
                        icon: "🏢",
                        color: "blue",
                      },
                      {
                        key: "house",
                        label: "בית פרטי",
                        icon: "🏠",
                        color: "blue",
                      },
                      {
                        key: "rental",
                        label: "השכרת חניות",
                        icon: "🚗",
                        color: "blue",
                      },
                    ].map((type) => (
                      <button
                        key={type.key}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            residenceType: type.key,
                          }))
                        }
                        disabled={isRegistering}
                        className={`p-3 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 text-center ${
                          formData.residenceType === type.key
                            ? "border-blue-400 bg-blue-50 shadow-lg"
                            : "border-blue-200 bg-white hover:border-blue-300 hover:shadow-md"
                        } ${
                          isRegistering ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <div className="text-2xl mb-1">{type.icon}</div>
                        <div
                          className={`font-semibold text-xs ${
                            formData.residenceType === type.key
                              ? "text-blue-700"
                              : "text-blue-600"
                          }`}
                        >
                          {type.label}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Form Fields Based on Selection */}
                  {(formData.residenceType === "apartment" ||
                    formData.residenceType === "house") && (
                    <div className="space-y-4 mb-4">
                      {formData.residenceType === "apartment" && (
                        <>
                          <div>
                            <label className="block text-sm font-semibold text-blue-800 mb-1">
                              קוד בניין
                            </label>
                            <input
                              type="text"
                              name="buildingCode"
                              placeholder="קוד בניין"
                              value={formData.buildingCode}
                              onChange={handleChange}
                              disabled={isRegistering}
                              className="w-full px-3 py-3 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 placeholder-gray-400 text-gray-800 disabled:opacity-50"
                            />
                            {loadingBuilding && (
                              <div className="flex items-center text-sm text-blue-600 mt-2">
                                <div className="mr-2 w-4 h-4 border-t-2 border-blue-600 rounded-full animate-spin"></div>
                                טוען פרטי בניין...
                              </div>
                            )}
                            {buildingInfo && (
                              <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="font-bold text-blue-800 mb-1 text-sm">
                                  פרטי הבניין:
                                </h4>
                                <p className="text-xs text-blue-700">
                                  כתובת:{" "}
                                  {buildingService.formatBuildingAddress(
                                    buildingInfo
                                  )}
                                </p>
                                {buildingInfo.building_number && (
                                  <p className="text-xs text-blue-700">
                                    קוד בניין: {buildingInfo.building_number}
                                  </p>
                                )}
                              </div>
                            )}
                            {feedback && !buildingInfo && (
                              <p className="text-sm text-red-500 mt-1 font-medium">
                                {feedback}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-semibold text-blue-800 mb-1">
                                מספר דירה
                              </label>
                              <input
                                type="text"
                                name="apartmentNumber"
                                placeholder="מספר דירה"
                                value={formData.apartmentNumber}
                                onChange={handleChange}
                                disabled={isRegistering}
                                className="w-full px-3 py-3 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 placeholder-gray-400 text-gray-800 disabled:opacity-50"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-blue-800 mb-1">
                                מספר חנייה
                              </label>
                              <input
                                type="text"
                                name="parkingNumber"
                                placeholder="מספר חנייה"
                                value={formData.parkingNumber}
                                onChange={handleChange}
                                disabled={isRegistering}
                                className="w-full px-3 py-3 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 placeholder-gray-400 text-gray-800 disabled:opacity-50"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-blue-800 mb-1">
                                קומת חנייה
                              </label>
                              <input
                                type="text"
                                name="parkingFloor"
                                placeholder="קומת חנייה"
                                value={formData.parkingFloor}
                                onChange={handleChange}
                                disabled={isRegistering}
                                className="w-full px-3 py-3 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 placeholder-gray-400 text-gray-800 disabled:opacity-50"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {formData.residenceType === "house" && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
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
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                    <p className="text-xs text-blue-700 text-center font-medium">
                      💡 ניתן להשכיר חניה פרטית (כולל חניה עם עמדת טעינה לרכב
                      חשמלי) בכל אחד מהמסלולים.
                    </p>
                  </div>

                  {/* Error/Success Messages */}
                  {error && (
                    <div className="mb-4 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-sm font-medium">{error}</span>
                      </div>
                    </div>
                  )}

                  {success && (
                    <div className="mb-4 bg-green-100 border border-green-300 text-green-700 px-3 py-2 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-sm font-medium">{success}</span>
                      </div>
                    </div>
                  )}

                  {/* Terms and Register Section */}
                  <div className="space-y-4">
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        disabled={isRegistering}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ml-2 disabled:opacity-50"
                      />
                      <label
                        htmlFor="terms"
                        className="text-sm text-blue-700 flex-1 font-medium"
                      >
                        קראתי ואני מסכים ל
                        <button
                          type="button"
                          onClick={() => setShowTermsPopup(true)}
                          disabled={isRegistering}
                          className="text-blue-600 underline hover:text-blue-800 mx-1 font-semibold transition-colors disabled:opacity-50"
                        >
                          תנאי השימוש
                        </button>
                      </label>
                    </div>

                    {/* Register Button */}
                    <button
                      onClick={handleRegister}
                      disabled={!termsAccepted || isRegistering}
                      className={`w-full py-3 px-6 rounded-lg font-semibold text-base transition-all duration-300 active:scale-95 shadow-lg hover:shadow-xl relative overflow-hidden ${
                        termsAccepted && !isRegistering
                          ? "bg-gradient-to-r from-blue-600 to-sky-600 text-white hover:from-blue-700 hover:to-sky-700 hover:scale-105"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {isRegistering ? (
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin ml-2"></div>
                          רושם...
                        </div>
                      ) : (
                        "🎉 הרשמה"
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

      {/* Loading Overlay */}
      {isRegistering && <LoadingOverlay />}

      {/* Terms Popup */}
      {showTermsPopup && !isRegistering && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div
            className="bg-white/95 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-full max-w-4xl mx-4 relative border border-blue-100"
            style={{ maxHeight: "80vh" }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-blue-800">
                📋 תנאי השימוש
              </h3>
              <button
                onClick={() => setShowTermsPopup(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            <div
              className="overflow-y-auto pr-2"
              style={{ maxHeight: "calc(80vh - 120px)" }}
            >
              <TermsContent />
            </div>
            <div className="mt-6 flex justify-end">
              <button
                className="bg-gradient-to-r from-blue-600 to-sky-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-sky-700 transition-all duration-300 transform hover:scale-105 active:scale-95 font-semibold"
                onClick={() => setShowTermsPopup(false)}
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Selection Popup */}
      {showMapPopup && !isRegistering && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div
            className="bg-white/95 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-full max-w-4xl mx-4 relative border border-blue-100"
            style={{ maxHeight: "80vh" }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-blue-800">
                📍 בחר מיקום מהמפה
              </h3>
              <button
                onClick={() => setShowMapPopup(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            <div
              className="overflow-y-auto pr-2"
              style={{ maxHeight: "calc(80vh - 120px)" }}
            >
              <AddressMapSelector
                address={address}
                setAddress={setAddress}
                feedback={feedback}
                setFeedback={setFeedback}
                searching={searching}
                setSearching={setSearching}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;