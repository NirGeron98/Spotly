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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Number of items to display per page

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

  const fetchBookingDetails = async (spotId, scheduleId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `/api/v1/bookings/spot/${spotId}/schedule/${scheduleId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const booking = res.data?.data?.booking;

      if (!booking || !booking.user) {
        setPopupData({
          title: "אין הזמנה",
          description: "לא נמצאה הזמנה תואמת לפינוי הזה",
          type: "info",
        });
        return;
      }

      const user = booking.user;
      const start = new Date(booking.start_datetime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const end = new Date(booking.end_datetime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const content = (
        <div className="text-right text-gray-800 space-y-2 leading-relaxed">
          <p>
            <strong>שם מלא:</strong> {user.first_name} {user.last_name}
          </p>
          <p>
            <strong>אימייל:</strong> {user.email}
          </p>
          <p>
            <strong>טלפון:</strong> {user.phone_number}
          </p>
          <p>
            <strong>שעות ההזמנה:</strong> {start} - {end}
          </p>
        </div>
      );

      setPopupData({
        title: "פרטי המזמין",
        description: content,
        type: "info",
      });
    } catch (err) {
      setPopupData({
        title: "שגיאה",
        description: "לא ניתן לשלוף את פרטי המזמין",
        type: "error",
      });
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
        const buildingSpot = parkingSlots.find(
          (s) => s.spot_type === "building"
        );
        if (!buildingSpot) {
          setPopupData({
            title: "שגיאה",
            description: "לא נמצאה חנייה משויכת בבניין שלך",
          });
          return;
        }

        const hasOverlap = isOverlap(
          buildingSpot.availability_schedule || [],
          date,
          startTime,
          endTime
        );

        if (hasOverlap) {
          setPopupData({
            title: "שגיאה",
            description: `יש חפיפה עם פינוי קיים בתאריך ${date}`,
          });
          return;
        }

        const scheduleData = {
          date,
          start_time: startTime,
          end_time: endTime,
          is_available: true,
          type,
          charger,
        };

        await axios.post(
          `/api/v1/parking-spots/${buildingSpot._id}/availability-schedule`,
          scheduleData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        await fetchMySpots();
        setPopupData({ title: "הצלחה", description: "החנייה נוספה בהצלחה ✅" });
        setFormData({
          date: new Date().toISOString().split("T")[0],
          startTime: "",
          endTime: "",
          type: "השכרה רגילה",
          charger: "",
        });
      } catch (err) {
        console.error("שגיאה:", err);
        setPopupData({
          title: "שגיאה",
          description: err?.response?.data?.message || "לא ניתן להוסיף חנייה",
        });
      }
      return;
    }

    const privateSpot = parkingSlots.find((s) => s.spot_type === "private");
    if (!privateSpot) {
      setPopupData({
        title: "שגיאה",
        description: "לא נמצאה חנייה פרטית עבור המשתמש",
        type: "error",
      });
      return;
    }

    if (!privateSpot.hourly_price && privateSpot.hourly_price !== 0) {
      setPopupData({
        title: "שגיאה",
        description: "לא הוגדר מחיר קבוע לשעת חנייה בפרופיל שלך",
        type: "error",
      });
      return;
    }

    if (privateSpot.hourly_price === 0) {
      setPopupData({
        title: "שים לב",
        description: "מחיר השעה הוא 0₪ – יש לעדכן את המחיר בהגדרות החנייה.",
        type: "warning",
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
      setPopupData({
        title: "שגיאה",
        description: "יש חפיפה עם פינוי קיים",
        type: "error",
      });
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
      await fetchMySpots();
      setPopupData({
        title: "הצלחה",
        description: "החנייה נוספה בהצלחה ✅",
        type: "success",
      });
    } catch (err) {
      setPopupData({
        title: "שגיאה",
        description: "פעולת ההוספה נכשלה בשרת",
        type: "error",
      });
    }
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
      setPopupData({
        title: "שגיאה",
        description: "שגיאה במחיקת הפינוי",
        type: "error",
      });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  // Prepare data for pagination
  const getAllSchedules = () => {
    return parkingSlots.flatMap((slot) =>
      (slot.availability_schedule || [])
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((s) => ({ ...s, slot }))
    );
  };

  const allSchedules = getAllSchedules();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = allSchedules.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(allSchedules.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
          <div className="relative mb-6 flex items-center justify-center">
            {!isBuildingMode && (
              <div className="absolute left-0">
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition shadow"
                >
                  <i className="fas fa-cog"></i>
                  הגדרות חנייה
                </button>
              </div>
            )}

            <h1 className="text-3xl font-extrabold text-blue-700 text-center">
              ניהול החנייה שלי
            </h1>

            <div className="invisible w-[160px]"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
              <h2 className="text-xl font-bold text-center">
                הוסף זמינות חדשה
              </h2>
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

              {!isBuildingMode && (
                <>
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
                </>
              )}

              <div className="mt-4"></div>

              <button
                onClick={handleAddSlot}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                הוסף פינוי
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md flex flex-col h-[550px]">
              <h2 className="text-xl font-bold text-center mb-4">
                החניות שפירסמת
              </h2>
              {loadingSpots ? (
                <p className="text-center text-gray-500">טוען...</p>
              ) : (
                <div className="flex flex-col flex-grow">
                  <div className="overflow-x-auto flex-grow">
                    <table className="w-full text-right border text-sm">
                      <thead className="bg-blue-50 text-blue-800 text-center">
                        <tr>
                          <th className="border px-4 py-2">תאריך</th>
                          <th className="border px-4 py-2">שעות</th>
                          {!isBuildingMode && (
                            <th className="border px-4 py-2">מחיר</th>
                          )}
                          {!isBuildingMode && (
                            <th className="border px-4 py-2">סוג</th>
                          )}
                          <th className="border px-4 py-2">פעולה</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.map((schedule, i) => (
                          <tr
                            key={`schedule-${i}`}
                            className="hover:bg-gray-100"
                          >
                            <td className="border px-4 py-2">
                              {new Date(schedule.date).toLocaleDateString()}
                            </td>
                            <td className="border px-4 py-2">
                              {schedule.start_time} - {schedule.end_time}
                            </td>
                            {!isBuildingMode && (
                              <td className="border px-4 py-2">
                                {schedule.slot.hourly_price
                                  ? `${schedule.slot.hourly_price} ₪`
                                  : "-"}
                              </td>
                            )}
                            {!isBuildingMode && (
                              <td className="border px-4 py-2">
                                {schedule.type === "טעינה לרכב חשמלי"
                                  ? `טעינה לרכב חשמלי (${
                                      schedule.charger || "לא צויין"
                                    })`
                                  : "השכרה רגילה"}
                              </td>
                            )}
                            <td className="border px-4 py-2 text-center flex gap-2 justify-center">
                              <button
                                onClick={() =>
                                  setConfirmDeleteId({
                                    spotId: schedule.slot._id,
                                    scheduleId: schedule._id,
                                  })
                                }
                                className="border border-red-500 text-red-500 px-3 py-1 rounded hover:bg-red-50 transition"
                              >
                                מחק
                              </button>
                              {!schedule.is_available && (
                                <button
                                  onClick={() =>
                                    fetchBookingDetails(
                                      schedule.slot._id,
                                      schedule._id
                                    )
                                  }
                                  className="border border-blue-500 text-blue-500 px-3 py-1 rounded hover:bg-blue-50 transition"
                                >
                                  פרטי מזמין
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {allSchedules.length === 0 && (
                      <p className="text-center text-gray-500 mt-4">
                        לא נמצאו פינויי חניה
                      </p>
                    )}
                  </div>

                  <div className="mt-auto pt-4">
                    <div className="flex justify-center">
                      <div className="flex space-x-2 rtl:space-x-reverse">
                        <button
                          onClick={() =>
                            setCurrentPage(Math.max(1, currentPage - 1))
                          }
                          disabled={
                            currentPage === 1 || allSchedules.length === 0
                          }
                          className={`px-4 py-2 rounded ${
                            currentPage === 1 || allSchedules.length === 0
                              ? "bg-gray-100 text-gray-400"
                              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                          }`}
                        >
                          הקודם
                        </button>

                        {/* Show page numbers */}
                        {Array.from(
                          { length: Math.max(1, totalPages) },
                          (_, i) => i + 1
                        ).map((pageNumber) => (
                          <button
                            key={pageNumber}
                            onClick={() => paginate(pageNumber)}
                            disabled={allSchedules.length === 0}
                            className={`px-4 py-2 rounded ${
                              pageNumber === currentPage
                                ? "bg-blue-600 text-white"
                                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                            }`}
                          >
                            {pageNumber}
                          </button>
                        ))}

                        <button
                          onClick={() =>
                            setCurrentPage(
                              Math.min(totalPages, currentPage + 1)
                            )
                          }
                          disabled={
                            currentPage === totalPages ||
                            totalPages === 0 ||
                            allSchedules.length === 0
                          }
                          className={`px-4 py-2 rounded ${
                            currentPage === totalPages ||
                            totalPages === 0 ||
                            allSchedules.length === 0
                              ? "bg-gray-100 text-gray-400"
                              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                          }`}
                        >
                          הבא
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />

      {popupData && (
        <Popup
          title={popupData.title}
          description={popupData.description}
          type={popupData.type || "info"}
          onClose={() => setPopupData(null)}
        />
      )}

      {confirmDeleteId && (
        <Popup
          title="אישור מחיקה"
          description="האם אתה בטוח שברצונך למחוק את הפינוי הזה?"
          type="delete"
          onClose={() => setConfirmDeleteId(null)}
          onConfirm={() =>
            handleDelete(confirmDeleteId.spotId, confirmDeleteId.scheduleId)
          }
        />
      )}

      {showSettings && (
        <Popup
          title="עדכון תעריף קבוע"
          description={
            <div className="space-y-4">
              <label className="block text-sm font-semibold">
                תעריף לשעה (בש"ח):
              </label>
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
                <div className="text-red-600 text-sm text-center">
                  {priceError}
                </div>
              )}
              {priceSuccess && (
                <div className="text-green-600 text-sm text-center">
                  {priceSuccess}
                </div>
              )}
            </div>
          }
          onClose={() => setShowSettings(false)}
          onConfirm={async () => {
            try {
              const token = localStorage.getItem("token");
              const privateSpot = parkingSlots.find(
                (s) => s.spot_type === "private"
              );
              if (!privateSpot) {
                setPopupData({
                  title: "שגיאה",
                  description: "לא נמצאה חנייה פרטית",
                  type: "error",
                });
                return;
              }

              await axios.patch(
                `/api/v1/parking-spots/${privateSpot._id}`,
                { hourly_price: Number(newPrice) },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              await fetchMySpots();
              setShowSettings(false);
              setPopupData({
                title: "הצלחה",
                description: "המחיר עודכן בהצלחה ✅",
                type: "success",
              });
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
