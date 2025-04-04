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


function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null); 

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setLoggedIn(true); 
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            loggedIn ? (
              user?.role === "user" || user?.role === "private_prop_owner" ? (
                <SearchParking loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
              ) : (
                <Dashboard loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
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
          path="/usage-history"
          element={loggedIn ? <UsageHistory /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
