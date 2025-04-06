import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaUserPlus,
} from "react-icons/fa";

const Navbar = ({ loggedIn, setLoggedIn }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("user");
    setLoggedIn(false);
    navigate("/login", { replace: true });
  };

  const isActive = (path) => {
    if (path === "/signup" || path === "/signup-details") {
      return (
        location.pathname === "/signup" ||
        location.pathname === "/signup-details"
      );
    }
    if (loggedIn && path === "/") {
      return (
        location.pathname === "/dashboard" ||
        location.pathname === "/search-parking"
      );
    }
    return location.pathname === path;
  };

  return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white h-16 flex items-center">
      <div className="container mx-auto px-6 flex justify-between items-center">
    
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/assets/spotlyLogo.jpeg"
            alt="Spotly Logo"
            className="h-16 w-auto"
          />
        </Link>

        <div className="flex items-center gap-2">
          {loggedIn ? (
            <>
              <Link
                to="/dashboard"
                className={`flex items-center px-3 py-2 rounded-lg transition-all duration-300 text-sm font-medium
                  ${
                    isActive("/")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                  }`}
              >
                <FaHome className="ml-1.5 text-lg" />
                דף הבית
              </Link>

              <Link
                to="/profile"
                className={`flex items-center px-3 py-2 rounded-lg transition-all duration-300 text-sm font-medium
                  ${
                    isActive("/profile")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                  }`}
              >
                <FaUser className="ml-1.5 text-lg" />
                ניהול פרופיל
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 rounded-lg transition-all duration-300 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-600"
              >
                <FaSignOutAlt className="ml-1.5 text-lg" />
                התנתקות
              </button>
            </>
          ) : (
            <>
              <Link
                to="/"
                className={`flex items-center px-3 py-2 rounded-lg transition-all duration-300 text-sm font-medium
                  ${
                    isActive("/")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                  }`}
              >
                <FaHome className="ml-1.5 text-lg" />
                דף הבית
              </Link>

              <Link
                to="/login"
                className={`flex items-center px-3 py-2 rounded-lg transition-all duration-300 text-sm font-medium
                  ${
                    isActive("/login")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                  }`}
              >
                <FaSignInAlt className="ml-1.5 text-lg" />
                התחברות
              </Link>

              <Link
                to="/signup"
                className={`flex items-center px-3 py-2 rounded-lg transition-all duration-300 text-sm font-medium
                  ${
                    isActive("/signup")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                  }`}
              >
                <FaUserPlus className="ml-1.5 text-lg" />
                הרשמה
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;