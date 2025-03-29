import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../shared/Footer/Footer";
import Navbar from "../../shared/Navbar/Navbar";

const SignupStepTwo = ({ loggedIn, setLoggedIn, isRegistering }) => {
  const navigate = useNavigate();
  const [residenceType, setResidenceType] = useState("");

  const handleRegister = () => {
    console.log("Registering...");
  };

  const backButtonStyle =
    "w-32 bg-blue-200 text-blue-800 font-bold py-2 px-4 rounded-md hover:bg-blue-300 transition duration-200";

  const registerButtonStyle =
    "w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50">
      <Navbar
        loggedIn={loggedIn}
        setLoggedIn={setLoggedIn}
        isRegistering={isRegistering}
      />

      <main className="flex-1 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-8">
              {/* כפתור "הקודם" */}
              <div className="flex justify-start mb-6">
                <button
                  onClick={() => navigate("/signup")}
                  className={backButtonStyle}
                >
                  הקודם
                </button>
              </div>

              <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                בחירת מסלול
              </h2>

              <p className="text-gray-700 text-center mb-4 font-bold">
                בחר אפשרות מבין המסלולים האחרים
              </p>
              <div className="flex gap-4 justify-center mb-6">
                <button
                  onClick={() => setResidenceType("apartment")}
                  className={`py-2 px-4 rounded-md ${
                    residenceType === "apartment"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  בניין מגורים
                </button>
                <button
                  onClick={() => setResidenceType("house")}
                  className={`py-2 px-4 rounded-md ${
                    residenceType === "house"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  בית פרטי
                </button>
                <button
                  onClick={() => setResidenceType("rental")}
                  className={`py-2 px-4 rounded-md ${
                    residenceType === "rental"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  השכרת חניות פרטיות
                </button>
              </div>

              {/* שדות לפי סוג מגורים */}
              {(residenceType === "apartment" || residenceType === "house") && (
                <>
                  {residenceType === "apartment" && (
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        קוד בניין
                      </label>
                      <input
                        type="text"
                        placeholder="קוד בניין"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  )}
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      עיר
                    </label>
                    <input
                      type="text"
                      placeholder="עיר"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      רחוב
                    </label>
                    <input
                      type="text"
                      placeholder="רחוב"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      מספר בית
                    </label>
                    <input
                      type="text"
                      placeholder="מספר בית"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  {residenceType === "apartment" && (
                    <>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          מספר דירה
                        </label>
                        <input
                          type="text"
                          placeholder="מספר דירה"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          מספר חנייה
                        </label>
                        <input
                          type="text"
                          placeholder="מספר חנייה"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          קומת חנייה
                        </label>
                        <input
                          type="text"
                          placeholder="קומת חנייה"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
              <p>* ניתן להשכיר חניה פרטית (כולל חניה עם עמדת טעינה לרכב חשמלי) בכל אחד מהמסלולים.</p>

              {/* כפתור "הרשמה" */}
              <div className="mt-8">
                <button
                  onClick={handleRegister}
                  className={registerButtonStyle}
                >
                  הרשמה
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SignupStepTwo;
