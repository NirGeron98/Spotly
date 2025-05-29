import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../shared/Footer";
import Navbar from "../shared/Navbar";
import { authService } from "../../services/authService";
import axios from "axios";

const Login = ({ loggedIn, setLoggedIn, isRegistering }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "התחברות | Spotly";
    axios.get("/api/v1/ping")
      .then((res) => console.log("✅ Connected to backend:", res.data))
      .catch((err) => console.error("❌ Failed to connect to backend:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await authService.login({ email, password });
      const user = res?.data?.user || res?.data?.data?.user || res?.data?.data;

      localStorage.setItem("user", JSON.stringify(user));
      setLoggedIn(true);

      if (user.role === "user" || user.role === "private_prop_owner") {
        navigate("/search-parking");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("אימייל או סיסמה שגויים");
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <div className="pt-[68px] min-h-screen flex flex-col relative overflow-hidden" dir="rtl">
      {/* Animated Background Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50">
        {/* Large Floating Orbs with Blur Effect */}
        <div 
          className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          style={{
            animation: 'float 6s ease-in-out infinite'
          }}
        ></div>
        <div 
          className="absolute top-40 right-10 w-72 h-72 bg-sky-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          style={{
            animation: 'float 6s ease-in-out infinite',
            animationDelay: '2s'
          }}
        ></div>
        <div 
          className="absolute -bottom-32 left-20 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          style={{
            animation: 'float 6s ease-in-out infinite',
            animationDelay: '4s'
          }}
        ></div>
        
        {/* Moving Background Waves */}
        <div className="absolute inset-0 opacity-30">
          <div 
            className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-blue-100 to-transparent transform rotate-12"
            style={{
              animation: 'slide 10s linear infinite'
            }}
          ></div>
          <div 
            className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-sky-100 to-transparent transform -rotate-12"
            style={{
              animation: 'slide 12s linear infinite reverse',
              animationDelay: '2s'
            }}
          ></div>
        </div>
      </div>

      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} isRegistering={isRegistering} />
      
      <main className="flex-1 relative z-10 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-xl mx-auto relative">
            {/* Main Login Card with Glassmorphism */}
            <div 
              className="backdrop-blur-md bg-white/80 rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform transition-all duration-500 hover:shadow-3xl"
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
              
              <div className="p-10">
                {/* Enhanced Title Section */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2 relative">
                    התחברות
                    <div 
                      className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-blue-400 to-sky-400 rounded-full"
                      style={{
                        animation: 'pulse 2s ease-in-out infinite'
                      }}
                    ></div>
                  </h2>
                  <p className="text-gray-600 mt-4 font-medium">ברוכים השווים לSpotly</p>
                </div>

                {/* Enhanced Error Message */}
                {error && (
                  <div 
                    className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6 relative overflow-hidden"
                    role="alert"
                    style={{
                      animation: 'slideInDown 0.5s ease-out'
                    }}
                  >
                    <div className="flex items-center relative z-10">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <span className="font-medium">{error}</span>
                      </div>
                    </div>
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      style={{
                        animation: 'shimmerError 2s ease-in-out infinite'
                      }}
                    ></div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Enhanced Email Field */}
                  <div className="group">
                    <label 
                      htmlFor="email" 
                      className="block text-gray-700 text-sm font-semibold mb-2 transition-all duration-300 group-focus-within:text-blue-600 group-focus-within:translate-x-1"
                    >
                      אימייל
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-400/30 focus:border-blue-400 transition-all duration-300 bg-white/90 backdrop-blur-sm placeholder-gray-400 text-gray-800 hover:shadow-md"
                        placeholder="example@email.com"
                        required
                        style={{
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                      />
                      <div 
                        className="absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-200/50 pointer-events-none transition-all duration-300 group-focus-within:ring-2 group-focus-within:ring-blue-400/50"
                      ></div>
                    </div>
                  </div>

                  {/* Enhanced Password Field */}
                  <div className="group">
                    <label 
                      htmlFor="password" 
                      className="block text-gray-700 text-sm font-semibold mb-2 transition-all duration-300 group-focus-within:text-blue-600 group-focus-within:translate-x-1"
                    >
                      סיסמה
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-400/30 focus:border-blue-400 transition-all duration-300 bg-white/90 backdrop-blur-sm placeholder-gray-400 text-gray-800 hover:shadow-md"
                        placeholder="••••••••"
                        required
                        style={{
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                      />
                      <div 
                        className="absolute inset-0 rounded-xl ring-1 ring-inset ring-gray-200/50 pointer-events-none transition-all duration-300 group-focus-within:ring-2 group-focus-within:ring-blue-400/50"
                      ></div>
                    </div>
                  </div>

                  {/* Enhanced Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-sky-600 text-white font-semibold py-4 px-6 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-400/50 transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group shadow-lg hover:shadow-xl"
                    style={{
                      boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.1)'
                    }}
                  >
                    <span className="relative z-10 text-lg">התחברות</span>
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] skew-x-12 transition-transform duration-1000 group-hover:translate-x-[100%]"
                    ></div>
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-blue-600 to-sky-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    ></div>
                  </button>
                </form>

                {/* Enhanced Forgot Password Link */}
                <div className="mt-8 text-center">
                  <button 
                    type="button" 
                    onClick={handleForgotPassword} 
                    className="text-blue-600 hover:text-sky-600 font-medium transition-all duration-300 relative group px-4 py-2 rounded-lg hover:bg-blue-50"
                  >
                    <span className="relative z-10">שכחת סיסמה?</span>
                    <span 
                      className="absolute bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-sky-600 transition-all duration-300 group-hover:w-full"
                    ></span>
                  </button>
                </div>
              </div>
            </div>

            {/* Floating Decorative Elements */}
            <div 
              className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-blue-400 to-sky-500 rounded-full opacity-60 shadow-lg"
              style={{
                animation: 'bounce 2s ease-in-out infinite',
                animationDelay: '1s'
              }}
            ></div>
            <div 
              className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-br from-sky-400 to-cyan-500 rounded-full opacity-60 shadow-lg"
              style={{
                animation: 'bounce 2s ease-in-out infinite',
                animationDelay: '2s'
              }}
            ></div>
            <div 
              className="absolute top-1/2 -right-8 w-4 h-4 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-full opacity-40 shadow-md"
              style={{
                animation: 'float 4s ease-in-out infinite',
                animationDelay: '0.5s'
              }}
            ></div>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Additional Ambient Floating Elements */}
      <div 
        className="fixed top-1/4 left-4 w-2 h-2 bg-blue-300 rounded-full opacity-50"
        style={{
          animation: 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
          animationDelay: '3s'
        }}
      ></div>
      <div 
        className="fixed top-1/3 right-8 w-3 h-3 bg-sky-300 rounded-full opacity-50"
        style={{
          animation: 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
          animationDelay: '5s'
        }}
      ></div>
      <div 
        className="fixed bottom-1/4 left-8 w-2 h-2 bg-cyan-300 rounded-full opacity-50"
        style={{
          animation: 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
          animationDelay: '7s'
        }}
      ></div>

      {/* Inline Keyframe Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes slide {
          0% { transform: translateX(-100%) rotate(12deg); }
          100% { transform: translateX(100%) rotate(12deg); }
        }
        
        @keyframes shimmer {
          0%, 100% { background-position: -200% center; }
          50% { background-position: 200% center; }
        }
        
        @keyframes shimmerError {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
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
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;