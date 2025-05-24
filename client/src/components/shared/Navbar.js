import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaUserPlus,
} from "react-icons/fa";

const Navbar = ({ loggedIn, setLoggedIn, activePage }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("user");
    setLoggedIn(false);
    navigate("/login", { replace: true });
  };  const handleHomeClick = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    
    if (!user) {
      navigate("/");
      return;
    }
    
    if (user.role === "building_resident") {
      navigate("/dashboard");
    } else {
      navigate("/search-parking");
    }
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
  };  const isActive = (path) => {
    try {
      // If the component specifies an active page directly, use that
      if (path === "/" && activePage) {
        if (activePage === "dashboard" && location.pathname === "/dashboard") {
          return true;
        }
        if (activePage === "search-parking" && location.pathname === "/search-parking") {
          return true;
        }
      }
      
      // Otherwise use the default logic
      if (path === "/") {
        const user = JSON.parse(localStorage.getItem("user"));
        
        if (user?.role === "building_resident" && location.pathname === "/dashboard") {
          return true;
        }
        
        if (["private_prop_owner", "user"].includes(user?.role) && location.pathname === "/search-parking") {
          return true;
        }
      }
      
      if (path === "/signup" || path === "/signup-details") {
        return (
          location.pathname === "/signup" ||
          location.pathname === "/signup-details"
        );
      }
      
      return location.pathname === path;
    } catch (error) {
      return false;
    }
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
        <a href="#" onClick={handleLogoClick} className="flex items-center gap-2">
          <img
            src="/assets/spotlyLogo.jpeg"
            alt="Spotly Logo"
            className="h-10 sm:h-12 w-auto"
          />
        </a>

        {/* כפתורים */}
        <div className="flex items-center gap-2 sm:gap-4">          {loggedIn ? (
            <>              <button
                onClick={handleHomeClick}
                className={linkStyle("/")}
              >
                <FaHome className="ml-1.5 text-lg" />
                דף הבית
              </button>

              <button
                onClick={() => navigate("/profile")}
                className={linkStyle("/profile")}
              >
                <FaUser className="ml-1.5 text-lg" />
                ניהול פרופיל
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 rounded-full text-sm sm:text-base font-medium text-red-600 border border-gray-300 hover:bg-red-50 hover:border-red-400 transition-all duration-300"
              >
                <FaSignOutAlt className="ml-1.5 text-lg" />
                התנתקות
              </button>
            </>          ) : (
            <>
              <button
                onClick={handleHomeClick}
                className={linkStyle("/")}
              >
                <FaHome className="ml-1.5 text-lg" />
                דף הבית
              </button>

              <button
                onClick={() => navigate("/login")}
                className={linkStyle("/login")}
              >
                <FaSignInAlt className="ml-1.5 text-lg" />
                התחברות
              </button>

              <button
                onClick={() => navigate("/signup")}
                className={linkStyle("/signup")}
              >
                <FaUserPlus className="ml-1.5 text-lg" />
                הרשמה
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
