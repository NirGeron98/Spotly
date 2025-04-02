import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./components/pages/Home";
import Login from "./components/pages/Login";
import Signup from "./components/pages/Signup/Signup"; // ← איחוד
import ForgotPassword from "./components/pages/ForgotPassword";
import Dashboard from "./components/pages/Dashboard";
import Profile from "./components/pages/Profile";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  // const [, setIsRegistering] = useState(false);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            loggedIn ? (
              <Dashboard loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
            ) : (
              <Home />
            )
          }
        />
        <Route path="/login" element={<Login setLoggedIn={setLoggedIn} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
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
              <Dashboard loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
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
      </Routes>
    </Router>
  );
}

export default App;
