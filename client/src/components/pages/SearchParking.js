import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
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
  const location = useLocation();

  const mode = location?.state?.mode || "regular";
  const isBuildingMode = mode === "building";

  const [currentTab, setCurrentTab] = useState("search");

  const [address, setAddress] = useState({ city: "", street: "", number: "" });
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [needsCharging, setNeedsCharging] = useState(false);
  const [chargerType, setChargerType] = useState("");
  const [feedback, setFeedback] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

  const handleSearch = async () => {
    if (!isBuildingMode && (!address.city || !address.street || !address.number)) {
      setFeedback("❌ יש להזין/לבחור כתובת");
      return;
    }

    setSearching(true);
    setFeedback("מחפש...");

    try {
      if (!isBuildingMode) {
        const geocodeResult = await geocodeAddress(address);
        if (!geocodeResult.success) {
          setFeedback(geocodeResult.message);
          setSearching(false);
          return;
        }
      }
      
      const token = localStorage.getItem("token");
      const payload = {
        start_time: startTime,
        end_time: endTime,
      };
      
      if (!isBuildingMode) {
        payload.city = address.city;
        payload.street = address.street;
        payload.number = address.number;
        if (minPrice) payload.min_price = parseFloat(minPrice);
        if (maxPrice) payload.max_price = parseFloat(maxPrice);
      } else {
        payload.building_id = user?.resident_building;
        payload.date = date;
      }
      
      if (needsCharging) {
        payload.needs_charging = true;
        if (chargerType) payload.charger_type = chargerType;
      }
      
      const res = await axios.post("/api/v1/parking-spots/search", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setResults(res.data?.data?.parkingSpots || []);
      setShowPopup(true);
      setFeedback("");
    } catch (err) {
      console.error("Search failed:", err);
      setFeedback("❌ חלה שגיאה בחיפוש");
    } finally {
      setSearching(false);
    }
  };

  const renderContent = () => {
    if (currentTab !== "search") return null;

    return (
      <>
        <h1 className="pt-[68px] text-3xl font-extrabold text-blue-700 mb-4 text-center">חיפוש חנייה</h1>
        <p className="text-gray-600 text-lg mb-8 text-center">
          {isBuildingMode
            ? "בחר תאריך, שעות זמינות וסוג טעינה (אם נדרש)"
            : "בחר מיקום, טווח מחירים וזמן זמינות"}
        </p>

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          {!isBuildingMode && (
            <AddressMapSelector
              address={address}
              setAddress={setAddress}
              feedback={feedback}
              setFeedback={setFeedback}
              searching={searching}
              setSearching={setSearching}
            />
          )}

          {!isBuildingMode && (
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
          )}

          {isBuildingMode && (
            <div>
              <label className="block mb-2 text-sm font-bold text-gray-700">תאריך</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>
          )}

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

          <div className="text-center pt-4">
            <button
              onClick={handleSearch}
              disabled={searching}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md text-lg transition"
            >
              {searching ? "מחפש..." : "חפש חנייה"}
            </button>
          </div>

          {feedback && (
            <div className="text-center mt-2 text-sm font-medium" 
                 style={{ color: feedback.includes("❌") ? "#e53e3e" : feedback.includes("✅") ? "#38a169" : "#2b6cb0" }}>
              {feedback}
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50" dir="rtl">
      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
      <div className="flex flex-1">
        <Sidebar current={currentTab} setCurrent={setCurrentTab} role={role} />
        <main className="flex-1 py-16 px-6 max-w-4xl mx-auto">
          {renderContent()}
        </main>
      </div>
      <Footer />

      {/* Results Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={() => setShowPopup(false)}>
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-700">תוצאות חיפוש</h2>
              <button 
                onClick={() => setShowPopup(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            
            {results.length === 0 ? (
              <p className="text-center text-gray-600 py-8">לא נמצאו חניות תואמות.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right border">
                  <thead className="bg-blue-50 text-blue-800">
                    <tr>
                      <th className="px-4 py-2">תאריך</th>
                      <th className="px-4 py-2">שעות</th>
                      {!isBuildingMode && <th className="px-4 py-2">מחיר</th>}
                      <th className="px-4 py-2">סוג</th>
                      <th className="px-4 py-2">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((spot) => (
                      <tr key={spot._id} className="border-b hover:bg-blue-50">
                        <td className="px-4 py-2">{spot.available_date?.split("T")[0]}</td>
                        <td className="px-4 py-2">{spot.start_time} - {spot.end_time}</td>
                        {!isBuildingMode && (
                          <td className="px-4 py-2">{spot.hourly_price} ₪</td>
                        )}
                        <td className="px-4 py-2">
                          {spot.is_charging_station
                            ? `טעינה לרכב חשמלי (${spot.charger_type})`
                            : "השכרה רגילה"}
                        </td>
                        <td className="px-4 py-2">
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">
                            הזמן
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="text-center mt-6">
              <button
                onClick={() => setShowPopup(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-5 py-2 rounded"
              >
                יציאה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchParking;