import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
    localStorage.removeItem("token");
    localStorage.removeItem("mode");
    setLoggedIn(false);
    navigate("/login", { replace: true });
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    
    if (!loggedIn) {
      navigate("/");
      return;
    }

    const storedUser = localStorage.getItem("user");
    
    if (!storedUser) {
      navigate("/");
      return;
    }

    let user;
    try {
      user = JSON.parse(storedUser);
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      navigate("/");
      return;
    }

    console.log("Navbar - Logo click, user role:", user.role); // Debug log

    // Navigate based on user role
    if (user.role === "building_resident") {
      console.log("Navbar - Navigating to dashboard"); // Debug log
      navigate("/dashboard");
    } else if (user.role === "private_prop_owner" || user.role === "user") {
      console.log("Navbar - Navigating to search-parking"); // Debug log
      navigate("/search-parking");
    } else {
      console.log("Navbar - Unknown role, navigating to home"); // Debug log
      navigate("/");
    }
  };

  const isActive = (path) => {
    if (path === "/") {
      // For home button, check if we're on the user's default page
      if (!loggedIn) {
        return location.pathname === "/";
      }
      
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return location.pathname === "/";
      
      let user;
      try {
        user = JSON.parse(storedUser);
      } catch (error) {
        return location.pathname === "/";
      }

      // Check if building resident is on dashboard
      if (user.role === "building_resident" && location.pathname === "/dashboard") {
        return true;
      }
      
      // Check if regular users are on search-parking
      if (
        (user.role === "private_prop_owner" || user.role === "user") &&
        location.pathname === "/search-parking"
      ) {
        return true;
      }
      
      // For non-logged in users on actual home page
      return location.pathname === "/";
    }
    
    if (path === "/signup" || path === "/signup-details") {
      return (
        location.pathname === "/signup" ||
        location.pathname === "/signup-details"
      );
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
        {/* Logo */}
        <button onClick={handleLogoClick} className="flex items-center gap-2">
          <img
            src="/assets/spotlyLogo.jpeg"
            alt="Spotly Logo"
            className="h-10 sm:h-12 w-auto"
          />
        </button>

        {/* Buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          {loggedIn ? (
            <>
              <button onClick={handleLogoClick} className={linkStyle("/")}>
                <FaHome className="ml-1.5 text-lg" />
                <span className="hidden sm:inline">דף הבית</span>
              </button>

              <button
                onClick={() => navigate("/profile")}
                className={linkStyle("/profile")}
              >
                <FaUser className="ml-1.5 text-lg" />
                <span className="hidden sm:inline">ניהול פרופיל</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 rounded-full text-sm sm:text-base font-medium text-red-600 border border-gray-300 hover:bg-red-50 hover:border-red-400 transition-all duration-300"
              >
                <FaSignOutAlt className="ml-1.5 text-lg" />
                <span className="hidden sm:inline">התנתקות</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={handleLogoClick} className={linkStyle("/")}>
                <FaHome className="ml-1.5 text-lg" />
                <span className="hidden sm:inline">דף הבית</span>
              </button>

              <button
                onClick={() => navigate("/login")}
                className={linkStyle("/login")}
              >
                <FaSignInAlt className="ml-1.5 text-lg" />
                <span className="hidden sm:inline">התחברות</span>
              </button>

              <button
                onClick={() => navigate("/signup")}
                className={linkStyle("/signup")}
              >
                <FaUserPlus className="ml-1.5 text-lg" />
                <span className="hidden sm:inline">הרשמה</span>
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;