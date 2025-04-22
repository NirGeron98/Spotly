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

  const handleLogoClick = (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      navigate("/");
    } else if (user.role === "building_resident") {
      navigate("/dashboard");
    } else if (["private_prop_owner", "user"].includes(user.role)) {
      navigate("/search-parking");
    } else {
      navigate("/");
    }
  };

  const isActive = (path) => {
    if (path === "/signup" || path === "/signup-details") {
      return (
        location.pathname === "/signup" ||
        location.pathname === "/signup-details"
      );
    }
    if (loggedIn && path === "/") {
      return location.pathname === "/dashboard";
    }
    return location.pathname === path;
  };

  const linkStyle = (path) =>
    `flex items-center px-3 py-2 rounded-full text-sm sm:text-base font-medium transition-all duration-300 border 
     ${
       isActive(path)
         ? "bg-blue-100 text-blue-700 border-blue-400 shadow-sm"
         : "text-gray-700 border-gray-300 hover:bg-gray-100 hover:text-blue-600"
     }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md h-14 sm:h-16">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        {/* לוגו */}
        <Link
          to="#"
          onClick={handleLogoClick}
          className="flex items-center gap-2"
        >
          <img
            src="/assets/spotlyLogo.jpeg"
            alt="Spotly Logo"
            className="h-10 sm:h-12 w-auto"
          />
        </Link>

        {/* כפתורים */}
        <div className="flex items-center gap-2 sm:gap-4">
          {loggedIn ? (
            <>
              <Link to="/dashboard" className={linkStyle("/")}>
                <FaHome className="ml-1.5 text-lg" />
                דף הבית
              </Link>

              <Link to="/profile" className={linkStyle("/profile")}>
                <FaUser className="ml-1.5 text-lg" />
                ניהול פרופיל
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 rounded-full text-sm sm:text-base font-medium text-red-600 border border-gray-300 hover:bg-red-50 hover:border-red-400 transition-all duration-300"
              >
                <FaSignOutAlt className="ml-1.5 text-lg" />
                התנתקות
              </button>
            </>
          ) : (
            <>
              <Link to="/" className={linkStyle("/")}>
                <FaHome className="ml-1.5 text-lg" />
                דף הבית
              </Link>

              <Link to="/login" className={linkStyle("/login")}>
                <FaSignInAlt className="ml-1.5 text-lg" />
                התחברות
              </Link>

              <Link to="/signup" className={linkStyle("/signup")}>
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
