import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import SearchParking from "./pages/SearchParking";
import UsageHistory from "./pages/UsageHistory";
import ReleaseParking from "./pages/ReleaseParking";
import ActiveParkingReservations from "./pages/ActiveParkingReservations";
import ResidentialParkingSearch from "./pages/ResidentialParkingSearch";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("App.js - Stored user role:", parsedUser.role); // Debug log
        setUser(parsedUser);
        setLoggedIn(true);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  // Function to get the correct home route based on user role
  const getHomeRoute = () => {
    if (!loggedIn || !user) {
      return <Home loggedIn={loggedIn} setLoggedIn={setLoggedIn} />;
    }

    console.log("App.jsx - User role for routing:", user.role); // Debug log

    switch (user.role) {
      case "building_resident":
        console.log("App.jsx - Rendering Dashboard for building_resident"); // Debug log
        return <Dashboard loggedIn={loggedIn} setLoggedIn={setLoggedIn} />;
      case "user":
      case "private_prop_owner":
        console.log("App.jsx - Rendering SearchParking for user/private_prop_owner"); // Debug log
        return <SearchParking loggedIn={loggedIn} setLoggedIn={setLoggedIn} />;
      default:
        console.log("App.jsx - Unknown role, rendering Home"); // Debug log
        return <Home loggedIn={loggedIn} setLoggedIn={setLoggedIn} />;
    }
  };

  // Function to get the default redirect route for logged in users
  const getDefaultRedirect = () => {
    if (!user) return "/";
    
    console.log("App.jsx - Getting default redirect for role:", user.role); // Debug log
    
    switch (user.role) {
      case "building_resident":
        return "/dashboard";
      case "user":
      case "private_prop_owner":
        return "/search-parking";
      default:
        return "/";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-100">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={getHomeRoute()} />
        
        <Route 
          path="/login" 
          element={
            loggedIn ? (
              <Navigate to={getDefaultRedirect()} replace />
            ) : (
              <Login loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
            )
          } 
        />
        
        <Route
          path="/forgot-password"
          element={
            <ForgotPassword loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
          }
        />
        
        <Route
          path="/reset-password/:token"
          element={
            <ResetPassword loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
          }
        />

        <Route
          path="/signup"
          element={
            loggedIn ? (
              <Navigate to={getDefaultRedirect()} replace />
            ) : (
              <Signup
                loggedIn={loggedIn}
                setLoggedIn={setLoggedIn}
                isRegistering={true}
              />
            )
          }
        />
        
        <Route
          path="/dashboard"
          element={
            loggedIn ? (
              user?.role === "building_resident" ? (
                <Dashboard loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
              ) : (
                <Navigate to="/search-parking" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/active-reservations"
          element={
            loggedIn ? (
              <ActiveParkingReservations
                loggedIn={loggedIn}
                setLoggedIn={setLoggedIn}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/profile"
          element={
            loggedIn ? (
              <Profile loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/search-parking"
          element={
            loggedIn ? (
              <SearchParking loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/release"
          element={
            loggedIn ? (
              <ReleaseParking loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/usage-history"
          element={
            loggedIn ? (
              <UsageHistory loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/residential-parking-search"
          element={
            loggedIn ? (
              <ResidentialParkingSearch
                loggedIn={loggedIn}
                setLoggedIn={setLoggedIn}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
      
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
      />
    </Router>
  );
}

export default App;