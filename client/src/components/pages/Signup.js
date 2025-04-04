import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../shared/Footer";
import Navbar from "../shared/Navbar";
import { authService } from "../../services/authService";
import AddressMapSelector from "../shared/AddressMapSelector";

const Signup = ({ loggedIn, setLoggedIn, isRegistering }) => {
  document.title = "הרשמה | Spotly";
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [address, setAddress] = useState({ city: "", street: "", number: "" });
  const [feedback, setFeedback] = useState("");
  const [searching, setSearching] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    passwordConfirm: "",
    residenceType: "",
    apartmentNumber: "",
    parkingNumber: "",
    parkingFloor: "",
    buildingCode: "",
  });

  const handleNext = () => {
    setError("");
    const { fullName, email, password, passwordConfirm } = formData;
    if (!fullName || !email || !password || !passwordConfirm) {
      setError("יש למלא את כל השדות");
      return;
    }
    if (password !== passwordConfirm) {
      setError("הסיסמאות אינן תואמות");
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
      residenceType,
      apartmentNumber,
      parkingNumber,
      parkingFloor,
      buildingCode,
    } = formData;

    const city = address.city;
    const street = address.street;
    const buildingNumber = address.number;

    if (!fullName || !email || !password || !passwordConfirm || !residenceType) {
      setError("יש למלא את כל השדות חובה");
      return;
    }

    if ((residenceType === "apartment" || residenceType === "house") && (!city || !street || !buildingNumber)) {
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

    const [first_name, last_name] = fullName.trim().split(" ");

    let role = "user";
    if (residenceType === "apartment") role = "building_resident";
    else if (residenceType === "house") role = "private_prop_owner";

    try {
      await authService.register({
        first_name,
        last_name,
        email,
        password,
        passwordConfirm,
        role,
      });

      const response = await authService.login({ email, password });
      const user = response?.data?.user || response?.data?.data?.user || response?.data?.data;

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

  const buttonStyle =
    "w-32 bg-blue-200 text-blue-800 font-bold py-2 px-4 rounded-md hover:bg-blue-300 transition duration-200";
  const registerButtonStyle =
    "w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200";

  return (
    <div className="pt-[68px] min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50">
      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} isRegistering={isRegistering} />
      <main className="flex-1 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-8">
              {step === 1 && (
                <>
                  <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">הרשמה</h2>

                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">{error}</div>
                  )}

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">שם מלא</label>
                    <input type="text" name="fullName" placeholder="שם מלא" value={formData.fullName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">אימייל</label>
                    <input type="email" name="email" placeholder="אימייל" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">סיסמה</label>
                    <input type="password" name="password" placeholder="סיסמה" value={formData.password} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">אימות סיסמה</label>
                    <input type="password" name="passwordConfirm" placeholder="אימות סיסמה" value={formData.passwordConfirm} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>

                  <div className="flex justify-end">
                    <button onClick={handleNext} className={buttonStyle}>המשך</button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="flex justify-start mb-6">
                    <button onClick={() => setStep(1)} className={buttonStyle}>הקודם</button>
                  </div>

                  <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">בחירת מסלול</h2>
                  <p className="text-gray-700 text-center mb-4 font-bold">בחר אפשרות מבין המסלולים השונים</p>

                  <div className="flex gap-4 justify-center mb-6">
                    {["apartment", "house", "rental"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFormData((prev) => ({ ...prev, residenceType: type }))} 
                        className={`py-2 px-4 rounded-md ${formData.residenceType === type ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                      >
                        {type === "apartment" ? "בניין מגורים" : type === "house" ? "בית פרטי" : "השכרת חניות פרטיות"}
                      </button>
                    ))}
                  </div>

                  {(formData.residenceType === "apartment" || formData.residenceType === "house") && (
                    <>
                      {formData.residenceType === "apartment" && (
                        <div className="mb-4">
                          <label className="block text-gray-700 text-sm font-bold mb-2">קוד בניין</label>
                          <input type="text" name="buildingCode" placeholder="קוד בניין" value={formData.buildingCode} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                        </div>
                      )}
                      {formData.residenceType === "house" && (
                        <div className="mb-6">
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
                      {formData.residenceType === "apartment" && (
                        <>
                          <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">מספר דירה</label>
                            <input type="text" name="apartmentNumber" placeholder="מספר דירה" value={formData.apartmentNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                          </div>
                          <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">מספר חנייה</label>
                            <input type="text" name="parkingNumber" placeholder="מספר חנייה" value={formData.parkingNumber} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                          </div>
                          <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">קומת חנייה</label>
                            <input type="text" name="parkingFloor" placeholder="קומת חנייה" value={formData.parkingFloor} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                          </div>
                        </>
                      )}
                    </>
                  )}

                  <p className="text-sm text-gray-500 mt-2">* ניתן להשכיר חניה פרטית (כולל חניה עם עמדת טעינה לרכב חשמלי) בכל אחד מהמסלולים.</p>

                  {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 mt-4 text-center">{error}</div>}
                  {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 mt-4 text-center">{success}</div>}

                  <div className="mt-6">
                    <button onClick={handleRegister} className={registerButtonStyle}>הרשמה</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;
