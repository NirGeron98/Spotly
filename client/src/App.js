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
        setUser(parsedUser);
        setLoggedIn(true);
      } catch (error) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("mode");
        setUser(null);
        setLoggedIn(false);
      }
    } else {
      setUser(null);
      setLoggedIn(false);
    }

    setIsLoading(false);
  }, []);

  const getDefaultRoute = () => {
    if (!user) return "/";
    switch (user.role) {
      case "building_resident":
      case "building_manager":
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
        <Route
          path="/"
          element={
            loggedIn ? (
              <Navigate to={getDefaultRoute()} replace />
            ) : (
              <Home loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
            )
          }
        />

        <Route
          path="/login"
          element={
            loggedIn ? (
              <Navigate to={getDefaultRoute()} replace />
            ) : (
              <Login
                loggedIn={loggedIn}
                setLoggedIn={setLoggedIn}
                setUser={setUser}
              />
            )
          }
        />

        <Route
          path="/forgot-password"
          element={
            loggedIn ? (
              <Navigate to={getDefaultRoute()} replace />
            ) : (
              <ForgotPassword loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
            )
          }
        />

        <Route
          path="/reset-password/:token"
          element={
            loggedIn ? (
              <Navigate to={getDefaultRoute()} replace />
            ) : (
              <ResetPassword loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
            )
          }
        />

        <Route
          path="/signup"
          element={
            loggedIn ? (
              <Navigate to={getDefaultRoute()} replace />
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
              user?.role === "building_resident" ||
              user?.role === "building_manager" ? (
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
