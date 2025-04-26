import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./components/pages/Home";
import Login from "./components/pages/Login";
import Signup from "./components/pages/Signup";
import ForgotPassword from "./components/pages/ForgotPassword";
import ResetPassword from "./components/pages/ResetPassword";
import Dashboard from "./components/pages/Dashboard";
import Profile from "./components/pages/Profile";
import SearchParking from "./components/pages/SearchParking";
import UsageHistory from "./components/pages/UsageHistory";
import ReleaseParking from "./components/pages/ReleaseParking";
import ActiveParkingReservations from "./components/pages/ActiveParkingReservations";


function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) return null;

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            loggedIn ? (
              user?.role === "user" || user?.role === "private_prop_owner" ? (
                <SearchParking loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
              ) : user?.role === "building_resident" ? (
                <Dashboard loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
              ) : (
                <Home />
              )
            ) : (
              <Home />
            )
          }
        />
        <Route path="/login" element={<Login setLoggedIn={setLoggedIn} />} />
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
            <Signup
              loggedIn={loggedIn}
              setLoggedIn={setLoggedIn}
              isRegistering={true}
            />
          }
        />
        <Route
          path="/dashboard"
          element={
            loggedIn ? (
              user?.role !== "user" && user?.role !== "private_prop_owner" ? (
                <Dashboard loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
              ) : (
                <Navigate to="/search-parking" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/active-reservations"
          element={<ActiveParkingReservations loggedIn={loggedIn} setLoggedIn={setLoggedIn} />}
        />
        <Route
          path="/profile"
          element={
            loggedIn ? (
              <Profile loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/search-parking"
          element={
            loggedIn ? (
              <SearchParking loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/release"
          element={
            loggedIn ? (
              <ReleaseParking loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/usage-history"
          element={
            loggedIn ? (
              <UsageHistory loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
