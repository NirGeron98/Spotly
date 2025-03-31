import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./components/pages/Home";
import Login from "./components/pages/Login";
import SignupStepOne from "./components/pages/Signup/SignupStepOne";
import SignupStepTwo from "./components/pages/Signup/SignupStepTwo";
import ForgotPassword from "./components/pages/ForgotPassword";
import Dashboard from "./components/pages/Dashboard";
import Profile from "./components/pages/Profile";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [, setIsRegistering] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: "",
    street: "",
    houseNumber: "",
    apartmentNumber: "",
    parkingNumber: "",
    residenceType: "",
  });

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
            <SignupStepOne
              formData={formData}
              setFormData={setFormData}
              setIsRegistering={setIsRegistering}
            />
          }
        />
        <Route
          path="/signup-details"
          element={
            <SignupStepTwo
              formData={formData}
              setFormData={setFormData}
              setIsRegistering={setIsRegistering}
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
