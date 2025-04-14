import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Navbar from "../shared/Navbar";
import Sidebar from "../shared/Sidebar";
import Footer from "../shared/Footer";
import Popup from "../shared/Popup";

const chargerTypes = ["Type 1", "Type 2", "CCS", "CHAdeMO", "Tesla", "Other"];

const ReleaseParking = ({ loggedIn, setLoggedIn }) => {
  document.title = "פינוי החנייה שלי | Spotly";
  const navigate = useNavigate();
  const location = useLocation();
  const isBuildingMode = location?.state?.mode === "building";

  const [user, setUser] = useState(null);
  const [, setLoadingUser] = useState(true);
  const [loadingSpots, setLoadingSpots] = useState(true);
  const [current, setCurrent] = useState("release");
  const [parkingSlots, setParkingSlots] = useState([]);
  const [popupData, setPopupData] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [priceError, setPriceError] = useState("");
  const [priceSuccess, setPriceSuccess] = useState("");



  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    type: "השכרה רגילה",
    charger: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      setLoadingUser(false);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (user && user._id) fetchMySpots();
  }, [user]);

  useEffect(() => {
    if (user && user.role !== "private_prop_owner" && !isBuildingMode) {
      navigate("/search-parking");
    }
  }, [navigate, user, isBuildingMode]);

  const fetchMySpots = async () => {
    setLoadingSpots(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/v1/parking-spots/my-spots", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setParkingSlots(res.data?.data?.parkingSpots || []);
    } catch (error) {
      console.error("Error loading spots:", error);
    } finally {
      setLoadingSpots(false);
    }
  };

  const isOverlap = (existing, date, newStart, newEnd) => {
    const [newStartH, newStartM] = newStart.split(":").map(Number);
    const [newEndH, newEndM] = newEnd.split(":").map(Number);
    const newStartMin = newStartH * 60 + newStartM;
    const newEndMin = newEndH * 60 + newEndM;

    return existing.some(({ date: d, start_time, end_time }) => {
      if (new Date(d).toISOString().split("T")[0] !== date) return false;
      const [startH, startM] = start_time.split(":").map(Number);
      const [endH, endM] = end_time.split(":").map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;
      return newStartMin < endMin && newEndMin > startMin;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSlot = async () => {
    const { date, startTime, endTime, type, charger } = formData;
    if (!date || !startTime || !endTime) return;
    if (type === "טעינה לרכב חשמלי" && !charger) {
      setPopupData({ title: "שגיאה", description: "יש לבחור סוג טעינה" });
      return;
    }

    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    if (startMin >= endMin) {
      setPopupData({
        title: "שגיאה",
        description: "שעת התחלה חייבת להיות לפני שעת סיום",
      });
      return;
    }

    const token = localStorage.getItem("token");

    if (isBuildingMode) {
      try {
        await axios.post(
          "/api/v1/parking-spots",
          {
            spot_type: "building",
            is_available: true,
            available_date: date,
            start_time: startTime,
            end_time: endTime,
            owner: user._id,
            is_charging_station: type === "טעינה לרכב חשמלי",
            charger_type: type === "טעינה לרכב חשמלי" ? charger : null,
            building: user.resident_building,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        setPopupData({ title: "שגיאה", description: "לא ניתן להוסיף חנייה" });
        return;
      }
    } else {
      const privateSpot = parkingSlots.find((s) => s.spot_type === "private");
      if (!privateSpot) {
        setPopupData({
          title: "שגיאה",
          description: "לא נמצאה חנייה פרטית עבור המשתמש",
        });
        return;
      }

      if (!privateSpot.hourly_price && privateSpot.hourly_price !== 0) {
        setPopupData({
          title: "שגיאה",
          description: "לא הוגדר מחיר קבוע לשעת חנייה בפרופיל שלך",
        });
        return;
      }

      const hasOverlap = isOverlap(
        privateSpot.availability_schedule || [],
        date,
        startTime,
        endTime
      );
      if (hasOverlap) {
        setPopupData({ title: "שגיאה", description: "יש חפיפה עם פינוי קיים" });
        return;
      }

      try {
        await axios.post(
          "/api/v1/parking-spots/release",
          {
            date,
            startTime,
            endTime,
            price: privateSpot.hourly_price,
            type,
            charger,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        setPopupData({
          title: "שגיאה",
          description: "פעולת ההוספה נכשלה בשרת",
        });
        return;
      }
    }

    await fetchMySpots();
    setPopupData({ title: "בוצע בהצלחה", description: "החנייה נוספה ✅" });
    setFormData({
      date: new Date().toISOString().split("T")[0],
      startTime: "",
      endTime: "",
      type: "השכרה רגילה",
      charger: "",
    });
  };

  const handleDelete = async (spotId, scheduleId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `/api/v1/parking-spots/${spotId}/availability-schedule/${scheduleId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchMySpots();
    } catch (err) {
      setPopupData({ title: "שגיאה", description: "שגיאה במחיקת הפינוי" });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50"
      dir="rtl"
    >
      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
      <div className="flex flex-grow">
        <Sidebar
          current={current}
          setCurrent={setCurrent}
          role={user?.role || "user"}
        />
        <main className="flex-1 p-10 mt-16 max-w-[1600px] mx-auto">
          <h1 className="text-3xl font-extrabold text-blue-700 mb-6 text-center">
            ניהול החנייה שלי
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-[3fr_4fr] gap-8">
            {/* טופס הוספת פינוי */}
            <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
              <h2 className="text-xl font-bold text-center">הוסף זמינות חדשה</h2>
              <div>
                <label className="font-semibold">תאריך</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="font-semibold">שעת התחלה</label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="w-1/2">
                  <label className="font-semibold">שעת סיום</label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold">סוג פינוי</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                >
                  <option>השכרה רגילה</option>
                  <option>טעינה לרכב חשמלי</option>
                </select>
              </div>
              {formData.type === "טעינה לרכב חשמלי" && (
                <div>
                  <label className="font-semibold">סוג טעינה</label>
                  <select
                    name="charger"
                    value={formData.charger}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">בחר סוג</option>
                    {chargerTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </div>
              )}
              <button
                onClick={handleAddSlot}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                הוסף פינוי
              </button>
            </div>

            {/* טבלת פינויים */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-bold text-center mb-4">החניות שפירסמת</h2>
              {loadingSpots ? (
                <p className="text-center text-gray-500">טוען...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border text-sm">
                    <thead className="bg-blue-50 text-blue-800 text-center">
                      <tr>
                        <th className="border px-4 py-2">תאריך</th>
                        <th className="border px-4 py-2">שעות</th>
                        <th className="border px-4 py-2">מחיר</th>
                        <th className="border px-4 py-2">סוג</th>
                        <th className="border px-4 py-2">פעולה</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parkingSlots.flatMap((slot) =>
                        (slot.availability_schedule || [])
                          .sort((a, b) => new Date(a.date) - new Date(b.date))
                          .map((s, i) => (
                            <tr
                              key={`${slot._id}-${i}`}
                              className="hover:bg-gray-100"
                            >
                              <td className="border px-4 py-2">
                                {new Date(s.date).toLocaleDateString()}
                              </td>
                              <td className="border px-4 py-2">
                                {s.start_time} - {s.end_time}
                              </td>
                              <td className="border px-4 py-2">
                                {slot.hourly_price
                                  ? `${slot.hourly_price} ₪`
                                  : "-"}
                              </td>
                              <td className="border px-4 py-2">
                                {s.type === "טעינה לרכב חשמלי"
                                  ? `טעינה לרכב חשמלי (${s.charger || "לא צויין"})`
                                  : "השכרה רגילה"}
                              </td>
                              <td className="border px-4 py-2 text-center">
                                <button
                                  onClick={() =>
                                    setConfirmDeleteId({
                                      spotId: slot._id,
                                      scheduleId: s._id,
                                    })
                                  }
                                  className="border border-red-500 text-red-500 px-3 py-1 rounded hover:bg-red-50 transition"
                                >
                                  מחק
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <div className="mt-12 mb-10 flex justify-center">
            <button
              onClick={() => setShowSettings(true)}
              className="bg-blue-700 text-white px-6 py-2 rounded hover:bg-blue-800 transition shadow-lg"
            >
              הגדרות חנייה
            </button>
          </div>
        </main>

      </div>
      <Footer />

      {/* פופאפים כלליים */}
      {popupData && (
        <Popup
          title={popupData.title}
          description={popupData.description}
          onClose={() => setPopupData(null)}
        />
      )}

      {/* אישור מחיקה */}
      {confirmDeleteId && (
        <Popup
          title="אישור מחיקה"
          description="האם אתה בטוח שברצונך למחוק את הפינוי הזה?"
          onClose={() => setConfirmDeleteId(null)}
          onConfirm={() =>
            handleDelete(confirmDeleteId.spotId, confirmDeleteId.scheduleId)
          }
        />
      )}
      {showSettings && (
        <Popup
          title="עדכון מחיר קבוע"
          description={
            <div className="space-y-4">
              <label className="block text-sm font-semibold">מחיר לשעה (בש"ח):</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={newPrice}
                onChange={(e) => {
                  setNewPrice(e.target.value);
                  setPriceError("");
                  setPriceSuccess("");
                }}
                placeholder="לדוגמה: 15"
              />
              {priceError && (
                <div className="text-red-600 text-sm text-center">{priceError}</div>
              )}
              {priceSuccess && (
                <div className="text-green-600 text-sm text-center">{priceSuccess}</div>
              )}
            </div>
          }
          onClose={() => setShowSettings(false)}
          onConfirm={async () => {
            try {
              const token = localStorage.getItem("token");
              const privateSpot = parkingSlots.find((s) => s.spot_type === "private");
              if (!privateSpot) {
                setPopupData({ title: "שגיאה", description: "לא נמצאה חנייה פרטית" });
                return;
              }

              await axios.patch(
                `/api/v1/parking-spots/${privateSpot._id}`,
                { hourly_price: Number(newPrice) },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              await fetchMySpots();
              setShowSettings(false);
              setPriceSuccess("המחיר עודכן בהצלחה ✅");
            } catch (err) {
              setPriceError("עדכון המחיר נכשל. נסה שוב.");

            }
          }}
        />
      )}
    </div>
  );
};




export default ReleaseParking;
