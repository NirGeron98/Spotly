import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/shared/Footer";
import Navbar from "../components/shared/Navbar";
import { authService } from "../services/authService";
import axios from "../axios";

const Login = ({ loggedIn, setLoggedIn, isRegistering }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "התחברות | Spotly";
    // Check backend connectivity
    const checkBackend = async () => {
      try {
        const res = await axios.get("/api/v1/ping");
        console.log("✅ Connected to backend:", res.data);
      } catch (err) {
        console.error("❌ Failed to connect to backend:", err);
      }
    };
    checkBackend();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });
      const user = response.data?.user;

      if (!user) {
        throw new Error("Invalid response format from server");
      }

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem(
        "mode",
        user.role === "building_resident" ? "building" : "regular"
      );
      setLoggedIn(true);

      if (user.role === "user" || user.role === "private_prop_owner") {
        navigate("/search-parking");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.response?.data?.message || "אימייל או סיסמה שגויים");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
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
                  ברוך שובך!
                </h1>
                <p className="text-blue-700 font-medium text-base sm:text-lg">
                  התחבר למערכת כדי לנהל ולמצוא חניות
                </p>
              </div>

              {error && (
                <div className="mb-6 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-blue-800 mb-2">
                    אימייל
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-4 bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 placeholder-gray-400 text-gray-800"
                    placeholder="אימייל"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-800 mb-2">
                    סיסמה
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-4 bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 placeholder-gray-400 text-gray-800"
                    placeholder="סיסמה"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-semibold py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? "מתחבר..." : "התחברות"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-blue-600 hover:text-sky-600 font-medium transition-all duration-300 hover:underline"
                >
                  שכחת את הסיסמה?
                </button>
              </div>

              <div className="mt-8 flex items-center">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
                <span className="px-4 text-sm text-blue-600 font-medium">
                  או
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-blue-700 mb-3">אין לך עדיין חשבון?</p>
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="inline-flex items-center px-6 py-3 border border-blue-300 text-blue-700 font-semibold rounded-xl hover:bg-blue-100 transition-all duration-300"
                >
                  הרשמה חדשה
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

export default Login;
