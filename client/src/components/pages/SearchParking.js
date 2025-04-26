import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Navbar from "../shared/Navbar";
import Footer from "../shared/Footer";
import Sidebar from "../shared/Sidebar";
import AddressMapSelector from "../shared/AddressMapSelector";
import { geocodeAddress } from "../utils/geocoding";
import parkingSpotService from "../../services/parkingSpotService";
import AdvancedPreferencesPopup from "../shared/AdvancedPreferences";

const SearchParking = ({ loggedIn, setLoggedIn }) => {
  document.title = "חיפוש חנייה | Spotly";

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const role = user?.role;
  const location = useLocation();
  const [popupData, setPopupData] = useState(null);

  const mode =
    location?.state?.mode || localStorage.getItem("mode") || "regular";
  const isBuildingMode = mode === "building";

  const [currentTab, setCurrentTab] = useState("search");
  const [address, setAddress] = useState({ city: "", street: "", number: "" });
  const [maxPrice, setMaxPrice] = useState("100");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [needsCharging, setNeedsCharging] = useState(false);
  const [chargerType, setChargerType] = useState("");
  const [feedback, setFeedback] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [distancePreference, setDistancePreference] = useState(3);
  const [pricePreference, setPricePreference] = useState(3);

  const renderStars = (value, setValue) => (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((v) => (
          <div key={v} className="flex flex-col items-center">
            <button
              onClick={() => setValue(v)}
              className={`text-3xl ${
                v <= value ? "text-yellow-400" : "text-gray-300"
              } transition`}
            >
              ★
            </button>
            <span className="text-xs text-gray-500">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const savePreferences = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        "/api/v1/users/preferences",
        {
          distance_importance: distancePreference,
          price_importance: pricePreference,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPopupData({
        title: "הצלחה",
        description: "העדפותייך נשמרו במערכת ✅",
        type: "success",
      });
      setShowPreferences(false);
    } catch (error) {
      console.error("שגיאה בשמירת העדפות:", error);
      setPopupData({
        title: "שגיאה",
        description: "שגיאה בשמירת ההעדפות  ❌",
        type: "error",
      });
    }
  };

  const handleSearch = async () => {
    if (
      !isBuildingMode &&
      (!address.city || !address.street || !address.number)
    ) {
      setFeedback("❌ יש להזין/לבחור כתובת");
      return;
    }

    if (!date) {
      setFeedback("❌ יש לבחור תאריך");
      return;
    }

    if (!startTime || !endTime) {
      setFeedback("❌ יש לבחור שעות");
      return;
    }

    // Validate that end time is after start time
    const startHour = parseInt(startTime.split(":")[0]);
    const startMinute = parseInt(startTime.split(":")[1]);
    const endHour = parseInt(endTime.split(":")[0]);
    const endMinute = parseInt(endTime.split(":")[1]);

    if (
      startHour > endHour ||
      (startHour === endHour && startMinute >= endMinute)
    ) {
      setFeedback("❌ שעת הסיום חייבת להיות מאוחרת משעת ההתחלה");
      return;
    }

    setSearching(true);
    setFeedback("מחפש...");

    try {
      let locationCoords = null;

      if (!isBuildingMode) {
        console.log("Geocoding address:", address);
        const result = await geocodeAddress(address);
        console.log("Geocoding result:", result);

        if (!result.success) {
          setFeedback("❌ " + result.message);
          setSearching(false);
          return;
        }

        if (!result.latitude || !result.longitude) {
          setFeedback("❌ לא ניתן לאתר את המיקום המבוקש. אנא נסה כתובת אחרת.");
          setSearching(false);
          return;
        }

        locationCoords = {
          latitude: result.latitude,
          longitude: result.longitude,
        };
      } else {
        // Use building coordinates if in building mode
        if (user?.building?.location?.coordinates) {
          locationCoords = {
            latitude: user.building.location.coordinates[1],
            longitude: user.building.location.coordinates[0],
          };
        }
      }

      // Fallback to user's address coordinates if available
      if (
        !locationCoords &&
        user?.address?.latitude &&
        user?.address?.longitude
      ) {
        locationCoords = {
          latitude: user.address.latitude,
          longitude: user.address.longitude,
        };
      }

      if (!locationCoords) {
        setFeedback("❌ לא ניתן להשיג את מיקום החיפוש");
        setSearching(false);
        return;
      }

      console.log("Search coordinates:", locationCoords);

      // Prepare search parameters for optimized finder
      const searchParams = {
        latitude: locationCoords.latitude,
        longitude: locationCoords.longitude,
        date,
        startTime,
        endTime,
        maxPrice: maxPrice ? parseFloat(maxPrice) : 1000,
        userId: user?._id,
      };

      if (needsCharging) {
        searchParams.is_charging_station = true;
        if (chargerType) {
          searchParams.charger_type = chargerType;
        }
      }

      console.log("Search parameters:", searchParams);

      // Use the optimized parking spot finder
      const response = await parkingSpotService.findOptimalParkingSpots(
        searchParams
      );
      console.log("Search response:", response);

      if (response.data?.results === 0) {
        setFeedback("לא נמצאו חניות זמינות התואמות את החיפוש");
        setResults([]);
      } else {
        setResults(response.data?.data?.parkingSpots || []);
        const filteredSpots = (response.data?.data?.parkingSpots || []).filter(
          (spot) => spot.owner !== user._id
        );
        setResults(filteredSpots);

        setShowPopup(true);
        setFeedback("");
      }
    } catch (err) {
      console.error("Search failed:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "שגיאה לא ידועה";
      setFeedback(`❌ חלה שגיאה בחיפוש: ${errorMessage}`);
    } finally {
      setSearching(false);
    }
  };

  const handleBooking = async (spot) => {
    const scheduleId = spot.availability?.[0]?.id;

    if (!scheduleId) {
      alert("❌ לא ניתן לבצע הזמנה – אין פינוי זמין");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/v1/bookings",
        {
          spot: spot._id,
          schedule: scheduleId,
          start_datetime: `${date}T${startTime}`,
          end_datetime: `${date}T${endTime}`,
          base_rate: spot.hourly_price,
          booking_type: needsCharging ? "charging" : "parking",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPopupData({
        title: "הצלחה",
        description: "ההזמנה בוצעה בהצלחה ✅",
        type: "success",
      });
      setShowPopup(false);
    } catch (err) {
      console.error("Booking error:", err);
      setPopupData({
        title: "שגיאה",
        description: "פעולת ההזמנה נכשלה בשרת",
        type: "error",
      });
    }
  };

  const renderContent = () => (
    <>
      <div className="relative mb-6 flex flex-col items-center">
        <h1 className="text-3xl font-extrabold text-blue-700 text-center w-full">
          חיפוש חנייה
        </h1>

        <p className="text-gray-600 text-lg mb-4 text-center">
          בחר מיקום, טווח מחירים וזמן זמינות
        </p>

        <div className="mt-4 mb-6 flex items-center justify-center">
          <button
            onClick={() => setShowPreferences(true)}
            className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition shadow w-auto justify-center"
          >
            <i className="fas fa-cog text-lg"></i>
            <span className="inline">העדפות חיפוש מתקדמות</span>
          </button>
        </div>
      </div>

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

        <div>
          <label className="block mb-2 text-sm font-bold text-gray-700">
            תאריך
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-bold text-gray-700">
            טווח זמן
          </label>
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

        {!isBuildingMode && (
          <div>
            <label className="block mb-2 text-sm font-bold text-gray-700">
              מחיר מקסימלי (₪)
            </label>
            <input
              type="number"
              placeholder="מחיר מקסימלי לשעה"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              min="0"
            />
          </div>
        )}

        <div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={needsCharging}
              onChange={() => setNeedsCharging((prev) => !prev)}
              className="w-5 h-5"
            />
            <span className="text-gray-800 font-semibold text-base">
              אני צריך עמדת טעינה לרכב חשמלי
            </span>
          </label>
          {needsCharging && (
            <div className="mt-2">
              <select
                value={chargerType}
                onChange={(e) => setChargerType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              >
                <option value="">כל סוגי המטענים</option>
                <option value="Type 1">Type 1</option>
                <option value="Type 2">Type 2</option>
                <option value="CCS">Combo (CCS)</option>
                <option value="CHAdeMO">CHAdeMO</option>
                <option value="Other">אחר</option>
              </select>
            </div>
          )}
        </div>

        <div className="text-center pt-4">
          <button
            onClick={handleSearch}
            disabled={searching}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md text-lg transition disabled:opacity-70"
          >
            {searching ? "מחפש..." : "חפש חנייה"}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50"
      dir="rtl"
    >
      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
      <div className="flex flex-1">
        <Sidebar current={currentTab} setCurrent={setCurrentTab} role={role} />
        <main className="flex-1 py-16 px-6 max-w-4xl mx-auto mt-4">
          {renderContent()}
        </main>
      </div>
      <Footer />

      {showPopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="bg-white p-6 rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
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
              <p className="text-center text-gray-600 py-8">
                לא נמצאו חניות תואמות.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right border">
                  <thead className="bg-blue-50 text-blue-800">
                    <tr>
                      <th className="px-4 py-2">דירוג</th>
                      <th className="px-4 py-2">כתובת</th>
                      <th className="px-4 py-2">מרחק</th>
                      <th className="px-4 py-2">מחיר</th>
                      <th className="px-4 py-2">סוג</th>
                      <th className="px-4 py-2">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((spot, index) => (
                      <tr
                        key={spot._id}
                        className={`border-b hover:bg-blue-50 ${
                          index === 0 ? "bg-blue-50" : ""
                        }`}
                      >
                        <td className="px-4 py-2">
                          {index === 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              מומלץ
                            </span>
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {spot.address.city}, {spot.address.street}{" "}
                          {spot.address.number}
                        </td>
                        <td className="px-4 py-2">{spot.distance_km} ק"מ</td>
                        <td className="px-4 py-2">{spot.hourly_price} ₪/שעה</td>
                        <td className="px-4 py-2">
                          {spot.is_charging_station
                            ? `טעינה לרכב חשמלי (${spot.charger_type})`
                            : "חנייה רגילה"}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                            onClick={() => handleBooking(spot)}
                          >
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

      {showPreferences && (
        <AdvancedPreferencesPopup
          distancePreference={distancePreference}
          pricePreference={pricePreference}
          setDistancePreference={setDistancePreference}
          setPricePreference={setPricePreference}
          savePreferences={savePreferences}
          onClose={() => setShowPreferences(false)}
        />
      )}

      {popupData && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-70 flex items-center justify-center"
          onClick={() => setPopupData(null)}
        >
          <div
            className={`bg-white p-6 rounded-xl shadow-xl w-full max-w-md m-4 ${
              popupData.type === "success"
                ? "border-l-4 border-green-500"
                : "border-l-4 border-red-500"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2
                className={`text-xl font-bold ${
                  popupData.type === "success"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {popupData.title}
              </h2>
              <button
                onClick={() => setPopupData(null)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-700">{popupData.description}</p>
            <div className="text-center mt-6">
              <button
                onClick={() => setPopupData(null)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium px-5 py-2 rounded"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchParking;
