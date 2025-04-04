import React, { useState } from "react";
import Navbar from "../shared/Navbar";
import Footer from "../shared/Footer";
import Sidebar from "../shared/Sidebar";
import AddressMapSelector from "../shared/AddressMapSelector";
import { geocodeAddress } from "../utils/geocoding";

const SearchParking = ({ loggedIn, setLoggedIn }) => {
  document.title = "חיפוש חנייה | Spotly";

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const role = user?.role;

  const [currentTab, setCurrentTab] = useState("search");

  const [address, setAddress] = useState({ city: "", street: "", number: "" });
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [needsCharging, setNeedsCharging] = useState(false);
  const [chargerType, setChargerType] = useState("");
  const [feedback, setFeedback] = useState("");
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!address.city || !address.street || !address.number) {
      setFeedback("❌ יש להזין/לבחור כתובת");
      return;
    }

    setSearching(true);
    setFeedback("מחפש כתובת...");

    const result = await geocodeAddress(address);

    if (result.success) {
      console.log("🔍 מבצע חיפוש עם מיקום:", result.lat, result.lon);
      setFeedback("✅ כתובת נמצאה");
    } else {
      setFeedback(result.message);
    }

    setSearching(false);
  };

  const renderContent = () => {
    if (currentTab !== "search") return null;

    return (
      <>
        <h1 className="pt-[68px] text-3xl font-extrabold text-blue-700 mb-4 text-center">חיפוש חנייה</h1>
        <p className="text-gray-600 text-lg mb-8 text-center">בחר מיקום, טווח מחירים וזמן זמינות</p>
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <AddressMapSelector
            address={address}
            setAddress={setAddress}
            feedback={feedback}
            setFeedback={setFeedback}
            searching={searching}
            setSearching={setSearching}
          />

          {/* טווח מחירים */}
          <div>
            <label className="block mb-2 text-sm font-bold text-gray-700">טווח מחירים (₪)</label>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="מחיר מינימלי"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                placeholder="מחיר מקסימלי"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* טווח זמן */}
          <div>
            <label className="block mb-2 text-sm font-bold text-gray-700">טווח זמן</label>
            <div className="flex gap-4">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* טעינה חשמלית */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={needsCharging}
                onChange={() => setNeedsCharging((prev) => !prev)}
                className="w-5 h-5"
              />
              <span className="text-gray-800 font-semibold text-base">אני צריך עמדת טעינה לרכב חשמלי</span>
            </label>
            {needsCharging && (
              <div className="mt-2">
                <select
                  value={chargerType}
                  onChange={(e) => setChargerType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">בחר סוג מטען</option>
                  <option value="type2">Type 2</option>
                  <option value="ccs">Combo (CCS)</option>
                  <option value="chademo">CHAdeMO</option>
                </select>
              </div>
            )}
          </div>

          {/* כפתור חיפוש */}
          <div className="text-center pt-4">
            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md text-lg transition"
            >
              חפש חנייה
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50" dir="rtl">
      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
      <div className="flex flex-1">
        <main className="flex-1 py-16 px-6 max-w-4xl mx-auto">{renderContent()}</main>
        <Sidebar current={currentTab} setCurrent={setCurrentTab} role={role} />
      </div>
      <Footer />
    </div>
  );
};

export default SearchParking;
