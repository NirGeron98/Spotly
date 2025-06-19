import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/shared/Footer";
import Navbar from "../components/shared/Navbar";
import { authService } from "../services/authService";
import axios from "../axios";

const Login = ({ loggedIn, setLoggedIn, isRegistering, setUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "התחברות | Spotly";
    const checkBackend = async () => {
      try {
        await axios.get("/api/v1/ping");
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
      const user =
        response?.data?.user ||
        response?.data?.data?.user ||
        response?.data?.data;

      if (!user) {
        throw new Error("Invalid response format from server");
      }

      if (user.role === "building_resident") {
        localStorage.setItem("mode", "building");
      } else {
        localStorage.setItem("mode", "regular");
      }

      setLoggedIn(true);
      const latestUser = authService.getCurrentUser();
      setUser(latestUser);

      setTimeout(() => {
        if (
          user.role === "building_resident" ||
          user.role === "building_manager"
        ) {
          navigate("/dashboard", { replace: true });
        } else if (user.role === "user" || user.role === "private_prop_owner") {
          navigate("/search-parking", { replace: true });
        } else {
          navigate("/search-parking", { replace: true });
        }
      }, 100);
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
    <div className="pt-[68px] min-h-screen flex flex-col relative bg-gradient-to-br from-blue-50 to-sky-100" dir="rtl">
      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} isRegistering={isRegistering} />
      <main className="flex-1 relative z-10 py-8">
        <div className="container mx-auto px-6">
          <div className="max-w-md mx-auto w-full">
            <div className="bg-white/70 backdrop-blur-lg border border-blue-100 rounded-3xl shadow-2xl px-6 py-8 transition-all duration-500">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-extrabold text-blue-800 mb-2 tracking-tight">ברוך שובך!</h1>
                <p className="text-blue-700 font-medium text-sm">התחבר למערכת כדי לנהל ולמצוא חניות</p>
              </div>

              {error && (
                <div className="mb-4 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-xl">
                  <div className="flex items-center">
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-blue-800 mb-1">אימייל</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-3 bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 placeholder-gray-400 text-gray-800"
                    placeholder="אימייל"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-800 mb-1">סיסמה</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-3 bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 placeholder-gray-400 text-gray-800"
                    placeholder="סיסמה"
                    required
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-semibold py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin ml-2"></div>
                      מתחבר...
                    </div>
                  ) : (
                    "התחברות"
                  )}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                  className="text-blue-600 hover:text-sky-600 font-medium transition-all duration-300 hover:underline disabled:opacity-50"
                >
                  שכחת את הסיסמה?
                </button>
              </div>

              <div className="mt-5 flex items-center">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
                <span className="px-4 text-sm text-blue-600 font-medium">או</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-blue-700 mb-2 text-sm">אין לך עדיין חשבון?</p>
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-blue-300 text-blue-700 font-semibold rounded-xl hover:bg-blue-100 transition-all duration-300 disabled:opacity-50 text-sm"
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