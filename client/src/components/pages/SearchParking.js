import React, { useState } from "react";
import Navbar from "../shared/Navbar";
import Footer from "../shared/Footer";
import Sidebar from "../shared/Sidebar";
import AddressMapSelector from "../shared/AddressMapSelector";

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

  const handleSearch = () => {
    console.log("🔍 מבצע חיפוש ", {
      address,
      minPrice,
      maxPrice,
      startTime,
      endTime,
      needsCharging,
      chargerType,
    });
  };

  const renderContent = () => {
    switch (currentTab) {
      case "search":
        return (
          <>
            <h1 className="text-3xl flex justify-content-center font-extrabold text-blue-700 mb-4">חיפוש חנייה או עמדת טעינה בתשלום</h1>
            <p className="text-gray-600 flex justify-content-center text-lg mb-8">בחר מיקום, טווח מחירים וזמן זמינות</p>
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
              <AddressMapSelector address={address} setAddress={setAddress} />
              {/* טווח מחירים */}
              <div>
                <label className="block mb-2 text-sm font-bold text-gray-700">טווח מחירים (₪)</label>
                <div className="flex gap-4">
                  <input type="text" placeholder="מחיר מינימלי" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                  <input type="text" placeholder="מחיר מקסימלי" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
              {/* טווח זמן */}
              <div>
                <label className="block mb-2 text-sm font-bold text-gray-700">טווח זמן</label>
                <div className="flex gap-4">
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>
              {/* עמדת טעינה */}
              <div>
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={needsCharging} onChange={() => setNeedsCharging((prev) => !prev)} className="w-5 h-5" />
                  <span className="text-gray-800 font-semibold text-base">אני צריך עמדת טעינה לרכב חשמלי</span>
                </label>
                {needsCharging && (
                  <div className="mt-2">
                    <select value={chargerType} onChange={(e) => setChargerType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md">
                      <option value="">בחר סוג מטען</option>
                      <option value="type2">Type 2</option>
                      <option value="ccs">Combo (CCS)</option>
                      <option value="chademo">CHAdeMO</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="text-center pt-4">
                <button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md text-lg transition">
                  חפש חנייה
                </button>
              </div>
            </div>
          </>
        );
      case "release":
        return <div className="text-center text-xl font-semibold text-blue-700">✨ בקרוב: פינוי החנייה שלי</div>;
      case "history":
        return <div className="text-center text-xl font-semibold text-blue-700">📜 בקרוב: היסטוריית שימוש</div>;
      default:
        return null;
    }
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
