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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow h-14 sm:h-16">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* לוגו */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/assets/spotlyLogo.jpeg"
            alt="Spotly Logo"
            className="h-10 sm:h-12 w-auto"
          />
        </Link>

        {/* כפתורים */}
        <div className="flex items-center gap-1 sm:gap-3">
          {loggedIn ? (
            <>
              <Link
                to="/dashboard"
                className={`flex items-center px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-300
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
                className={`flex items-center px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-300
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
                className="flex items-center px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-sm sm:text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-all duration-300"
              >
                <FaSignOutAlt className="ml-1.5 text-lg" />
                התנתקות
              </button>
            </>
          ) : (
            <>
              <Link
                to="/"
                className={`flex items-center px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-300
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
                className={`flex items-center px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-300
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
                className={`flex items-center px-2 py-1 sm:px-3 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-300
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
