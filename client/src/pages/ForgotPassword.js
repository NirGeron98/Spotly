import React, { useState } from "react";
import Footer from "../components/shared/Footer";
import Navbar from "../components/shared/Navbar";
import { authService } from "../services/authService";

const ForgotPassword = ({ loggedIn, setLoggedIn, isRegistering }) => {
  document.title = "שחזור סיסמה | Spotly";

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      await authService.forgotPassword(email);
      setMessage("קישור לאיפוס הסיסמה נשלח בהצלחה. אנא בדוק את תיבת הדואר האלקטרוני שלך.");
    } catch (err) {
      console.error("Password reset error:", err);
      setError(err.response?.data?.message || "אירעה שגיאה בשליחת הקישור לאיפוס הסיסמה");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="pt-[68px] min-h-screen flex flex-col relative bg-gradient-to-br from-blue-50 to-sky-100"
      dir="rtl"
    >
      <Navbar
        loggedIn={loggedIn}
        setLoggedIn={setLoggedIn}
        isRegistering={isRegistering}
      />
      <main className="flex-1 relative z-10 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto w-full">
            <div className="bg-white/70 backdrop-blur-lg border border-blue-100 rounded-3xl shadow-2xl px-10 py-14 transition-all duration-500">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-blue-800 mb-3 tracking-tight">
                  שחזור סיסמה
                </h1>
                <p className="text-blue-700 font-medium text-base sm:text-lg">
                  הזן את כתובת האימייל שלך כדי לקבל קישור לאיפוס הסיסמה
                </p>
              </div>

              {message && (
                <div className="mb-6 bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-lg ml-2">✅</span>
                    <span className="text-sm font-medium">{message}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-lg ml-2">❌</span>
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-blue-800 mb-2">
                    כתובת אימייל
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-4 bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 placeholder-gray-400 text-gray-800"
                    placeholder="הזן את כתובת האימייל שלך"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-semibold py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin ml-2"></div>
                      שולח...
                    </div>
                  ) : (
                    "שלח קישור לאיפוס סיסמה"
                  )}
                </button>
              </form>

              <div className="mt-8 flex items-center">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
                <span className="px-4 text-sm text-blue-600 font-medium">
                  או
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-blue-700 mb-3">נזכרת בסיסמה שלך?</p>
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="inline-flex items-center px-6 py-3 border border-blue-300 text-blue-700 font-semibold rounded-xl hover:bg-blue-100 transition-all duration-300"
                >
                  חזור להתחברות
                </button>
              </div>

              {/* Info Box */}
              <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-start">
                  <span className="text-blue-600 text-lg ml-3 mt-0.5">💡</span>
                  <div className="text-blue-700">
                    <p className="text-sm font-medium mb-1">
                      טיפ: בדוק גם את תיקיית הספאם
                    </p>
                    <p className="text-xs">
                      לפעמים הודעות אימייל עלולות להגיע לתיקיית הספאם או הפרסומות
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ForgotPassword;