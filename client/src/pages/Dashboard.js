import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCar, FaBuilding } from "react-icons/fa";
import ActionButton from "../components/common/ActionButton";
import Navbar from "../components/shared/Navbar";
import Footer from "../components/shared/Footer";

const Dashboard = ({ loggedIn, setLoggedIn }) => {
  document.title = "דף הבית | Spotly";
  const navigate = useNavigate();

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const firstName = user?.first_name || "משתמש";
  const role = user?.role;

  useEffect(() => {
    if (role === "user" || role === "private_prop_owner") {
      localStorage.removeItem("mode");
      navigate("/search-parking", { state: { fromDashboard: true } });
    } else if (!role) {
      navigate("/search-parking");
    }
  }, [role, navigate]);

  if (role === "user" || role === "private_prop_owner") {
    return null;
  }

  const today = new Date();
  const date = today.toLocaleDateString("he-IL");
  const time = today.toLocaleTimeString("he-IL");

  return (
    <div className="pt-[68px] min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50" dir="rtl">
      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} activePage="dashboard" />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-blue-700 mb-2">
              שלום {firstName}!
            </h1>
            <p className="text-gray-600 text-lg">נא לבחור מערכת מתוך האפשרויות הבאות:</p>
            <p className="text-sm text-gray-500 mt-1">
              היום: {date} | השעה: {time}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap justify-center gap-6">
            <div className="w-72 h-40 flex items-stretch transform hover:scale-105 transition duration-300">
              <ActionButton
                text={
                  <div className="flex items-center justify-center gap-2 h-full">
                    <FaCar className="text-xl" />
                    חיפוש חנייה/עמדת טעינה בתשלום
                  </div>
                }
                primary={true}
                className="h-full"
                onClick={() => {
                  localStorage.removeItem("mode");
                  navigate("/search-parking");
                }}
              />
            </div>

            <div className="w-72 h-40 flex items-stretch transform hover:scale-105 transition duration-300">
              <ActionButton
                text={
                  <div className="flex items-center justify-center gap-2 h-full">
                    <FaBuilding className="text-xl" />
                    מערכת ניהול חניות בבניין מגורים
                  </div>
                }
                primary={false}
                className="h-full"
                onClick={() => {
                  localStorage.setItem("mode", "building");
                  navigate("/residential-parking-search");
                }}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
