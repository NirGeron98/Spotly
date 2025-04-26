import React, { useEffect, useState, useRef } from "react";
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

  // Calendar interaction states
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showQuickAddPopup, setShowQuickAddPopup] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    type: "השכרה רגילה",
    charger: "",
  });
  const timeGridRef = useRef(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [priceError, setPriceError] = useState("");
  const [priceSuccess, setPriceSuccess] = useState("");

  // Week view states
  const [startOfWeek, setStartOfWeek] = useState(getStartOfWeek(new Date()));
  const [weekViewSchedules, setWeekViewSchedules] = useState([]);
  const [expandedSchedule, setExpandedSchedule] = useState(null);

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
    if (parkingSlots.length > 0) {
      generateWeekViewData();
    }
  }, [parkingSlots, startOfWeek]);

  function getStartOfWeek(date) {
    const newDate = new Date(date);
    const day = newDate.getDay();
    // In Israel, Sunday is the first day (0), so we adjust accordingly
    const diff = newDate.getDate() - day;
    return new Date(newDate.setDate(diff));
  }

  const generateWeekViewData = () => {
    const schedules = [];
    parkingSlots.forEach((slot) => {
      if (slot.availability_schedule) {
        slot.availability_schedule.forEach((schedule) => {
          const scheduleDate = new Date(schedule.date);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);

          if (scheduleDate >= startOfWeek && scheduleDate <= endOfWeek) {
            schedules.push({
              ...schedule,
              slot,
              dayOfWeek: scheduleDate.getDay(), // 0 for Sunday, 1 for Monday, etc.
            });
          }
        });
      }
    });
    setWeekViewSchedules(schedules);
  };

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

  const handleQuickAddChange = (e) => {
    const { name, value } = e.target;
    setQuickAddData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSlot = async (dataToAdd = formData) => {
    const { date, startTime, endTime, type, charger } = dataToAdd;
    if (!date || !startTime || !endTime) return;

    if (isDateInPast(date)) {
      setPopupData({
        title: "שגיאה",
        description: "לא ניתן להוסיף זמינות לתאריכים שכבר עברו",
        type: "error",
      });
      return;
    }

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
          ...(type === "טעינה לרכב חשמלי" ? { charger } : {}),
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
        setShowQuickAddPopup(false);
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
      const releaseData = {
        date,
        startTime,
        endTime,
        price: privateSpot.hourly_price,
        type,
        ...(type === "טעינה לרכב חשמלי" && charger ? { charger } : {}),
      };

      await axios.post("/api/v1/parking-spots/release", releaseData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchMySpots();
      setPopupData({
        title: "הצלחה",
        description: "החנייה נוספה בהצלחה ✅",
        type: "success",
      });
      setShowQuickAddPopup(false);
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

  // Helper to get the position of a time slot
  const getTimePosition = (time) => {
    // Assuming times are in 24 hour format like "14:30"
    const [hours, minutes] = time.split(":").map(Number);
    // Assuming the grid starts at 6:00 AM (6 hours)
    const startHour = 6;
    const heightPerHour = 60; // pixels per hour
    return (hours - startHour + minutes / 60) * heightPerHour;
  };

  // Helper to calculate the height of a time slot
  const getTimeSlotHeight = (startTime, endTime) => {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const durationHours = endH - startH + (endM - startM) / 60;
    return durationHours * 60; // 60px per hour
  };

  // Navigation to previous week
  const goToPrevWeek = () => {
    const newStart = new Date(startOfWeek);
    newStart.setDate(newStart.getDate() - 7);
    setStartOfWeek(newStart);
  };

  // Navigation to next week
  const goToNextWeek = () => {
    const newStart = new Date(startOfWeek);
    newStart.setDate(newStart.getDate() + 7);
    setStartOfWeek(newStart);
  };

  // Go to current week
  const goToCurrentWeek = () => {
    setStartOfWeek(getStartOfWeek(new Date()));
  };

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("he-IL", {
      day: "numeric",
      month: "numeric",
    });
  };

  // Get day names in Hebrew
  const getDayName = (dayOfWeek) => {
    const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    return days[dayOfWeek];
  };

  // Generate dates for the week
  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Convert pixel position to time
  const pixelToTime = (pixel) => {
    const startHour = 6; // 6:00 AM start
    const heightPerHour = 60; // 60px per hour
    const hour = Math.floor(pixel / heightPerHour) + startHour;
    const minute = Math.round(((pixel % heightPerHour) / heightPerHour) * 60);
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle mouse down on time grid
  const handleMouseDown = (e, dayIndex) => {
    if (loadingSpots) return;

    // Check if the day is in the past
    if (isDayInPast(dayIndex)) {
      return; // Prevent interaction with past days
    }

    const gridRect = timeGridRef.current.getBoundingClientRect();
    const headerHeight = 60;
    const relativeY =
      e.clientY - gridRect.top - headerHeight + timeGridRef.current.scrollTop;

    const selectedDate = new Date(startOfWeek);
    selectedDate.setDate(selectedDate.getDate() + dayIndex);

    setSelectedDay(dayIndex);
    setDragStart(relativeY);
    setDragEnd(relativeY);
    setIsDragging(true);
  };

  // Handle mouse move during drag
  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const gridRect = timeGridRef.current.getBoundingClientRect();
    const relativeY = e.clientY - gridRect.top + timeGridRef.current.scrollTop;

    // Keep within grid bounds
    const boundedY = Math.max(0, Math.min(relativeY, 18 * 60)); // 18 hours * 60px/hour

    setDragEnd(boundedY);
  };

  // Handle mouse up after drag
  const handleMouseUp = () => {
    if (isDragging) {
      // Calculate the start and end times based on drag positions
      const startY = Math.min(dragStart, dragEnd);
      const endY = Math.max(dragStart, dragEnd);

      // Only show popup if drag distance is at least 15 pixels (15 minutes)
      if (Math.abs(dragEnd - dragStart) >= 15) {
        const selectedDate = new Date(startOfWeek);
        selectedDate.setDate(selectedDate.getDate() + selectedDay);

        const startTime = pixelToTime(startY);
        const endTime = pixelToTime(endY);

        // Set quick add form data
        setQuickAddData({
          date: selectedDate.toISOString().split("T")[0],
          startTime,
          endTime,
          type: "השכרה רגילה",
          charger: "",
        });

        // Show quick add popup
        setShowQuickAddPopup(true);
      }
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setSelectedDay(null);
  };

  const isDateInPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const isDayInPast = (dayIndex) => {
    const dayDate = new Date(startOfWeek);
    dayDate.setDate(dayDate.getDate() + dayIndex);
    return isDateInPast(dayDate);
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
          <div className="relative mb-6 flex flex-col items-center">
            <h1 className="text-3xl font-extrabold text-blue-700 text-center w-full">
              ניהול החנייה שלי
            </h1>

            {!isBuildingMode && (
              <div className="mt-4 flex items-center justify-center">
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition shadow sm:w-auto sm:flex sm:gap-2 sm:px-4 sm:py-2 w-auto justify-center"
                >
                  <i className="fas fa-cog text-lg"></i>
                  <span className="inline">הגדרות חנייה</span>
                </button>
              </div>
            )}
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
                onClick={() => handleAddSlot()}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                הוסף פינוי
              </button>
            </div>

            {/* לוח פינוי חניות  */}
            <div className="bg-white p-6 rounded-xl shadow-md flex flex-col h-[650px]">
              <h2 className="text-xl font-bold text-center mb-4">
                לוח פינויי החניות
              </h2>

              {/* Help text */}
              <div className="mb-4 p-2 bg-blue-50 text-blue-700 rounded text-sm text-center">
                <strong>טיפ:</strong> לחץ וגרור על הלוח כדי ליצור פינוי חנייה
                חדש
              </div>

              {/* Calendar Navigation */}
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={goToPrevWeek}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-1 rounded"
                >
                  <i className="fas fa-chevron-right ml-1"></i>
                  שבוע קודם
                </button>
                <button
                  onClick={goToCurrentWeek}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded"
                >
                  השבוע הנוכחי
                </button>
                <button
                  onClick={goToNextWeek}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-1 rounded"
                >
                  שבוע הבא
                  <i className="fas fa-chevron-left mr-1"></i>
                </button>
              </div>

              {loadingSpots ? (
                <div className="flex-grow flex items-center justify-center">
                  <p className="text-gray-500">טוען...</p>
                </div>
              ) : (
                <div className="flex-grow overflow-auto" ref={timeGridRef}>
                  {/* Days Header */}
                  <div className="flex border-b border-gray-200 min-w-[1000px]">
                    <div className="w-16 shrink-0 border-r border-gray-200 bg-gray-50"></div>
                    {getWeekDates().map((date, i) => (
                      <div
                        key={i}
                        className="flex-1 text-center py-2 px-1 border-r border-gray-200 bg-gray-50"
                      >
                        <div className="font-bold text-blue-800">
                          {getDayName(i)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(date)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Time Grid */}
                  <div className="relative min-w-[1000px]">
                    {/* Time Labels */}
                    <div className="absolute top-0 right-0 h-full w-16 border-r border-gray-200">
                      {Array.from({ length: 19 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-[60px] border-b border-gray-200 text-xs text-gray-500 flex items-center justify-center"
                        >
                          {String(i + 6).padStart(2, "0")}:00
                        </div>
                      ))}
                    </div>

                    {/* Days Grid with Events */}
                    <div className="mr-16 flex">
                      {Array.from({ length: 7 }).map((_, dayIndex) => {
                        const isPastDay = isDayInPast(dayIndex);
                        return (
                          <div
                            key={dayIndex}
                            className={`flex-1 relative border-r border-gray-200 min-h-[1140px] ${isPastDay ? "bg-gray-100 cursor-not-allowed" : ""
                              }`}
                            onMouseDown={(e) => handleMouseDown(e, dayIndex)}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                          >
                            {/* Horizontal hour lines */}
                            {Array.from({ length: 19 }).map((_, i) => (
                              <div
                                key={i}
                                className={`absolute w-full h-[1px] ${isPastDay ? "bg-gray-200" : "bg-gray-100"
                                  }`}
                                style={{ top: i * 60 }}
                              ></div>
                            ))}

                            {/* Drag selection display */}
                            {isDragging && selectedDay === dayIndex && (
                              <div
                                className="absolute right-0 w-[calc(100%-8px)] mx-1 rounded-md bg-blue-200 border border-blue-400 opacity-70"
                                style={{
                                  top: `${Math.min(dragStart, dragEnd)}px`,
                                  height: `${Math.abs(dragEnd - dragStart)}px`,
                                  minHeight: "15px",
                                }}
                              ></div>
                            )}

                            {/* Parking Schedule Blocks */}
                            {weekViewSchedules
                              .filter((schedule) => schedule.dayOfWeek === dayIndex)
                              .map((schedule, idx) => {
                                const top = getTimePosition(schedule.start_time);
                                const height = getTimeSlotHeight(
                                  schedule.start_time,
                                  schedule.end_time
                                );
                                const isBooked = !schedule.is_available;
                                const isExpanded =
                                  expandedSchedule && expandedSchedule._id === schedule._id;

                                return (
                                  <div
                                    key={idx}
                                    onClick={() => setExpandedSchedule(isExpanded ? null : schedule)}
                                    className={`absolute right-0 w-[calc(100%-8px)] mx-1 rounded-md p-2 cursor-pointer transition-all duration-200 overflow-hidden text-right ${isBooked
                                      ? "bg-red-100 border border-red-300 text-red-800"
                                      : schedule.type === "טעינה לרכב חשמלי"
                                        ? "bg-green-100 border border-green-300 text-green-800"
                                        : "bg-blue-100 border border-blue-300 text-blue-800"
                                      } ${isExpanded ? "shadow-lg z-10" : ""}`}
                                    style={{
                                      top: `${top}px`,
                                      height: `${Math.max(height, 20)}px`,
                                    }}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex gap-2">
                                        {!isBooked && !isPastDay && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setConfirmDeleteId({
                                                spotId: schedule.slot._id,
                                                scheduleId: schedule._id,
                                              });
                                            }}
                                            className="text-red-500 hover:text-red-700 text-sm"
                                            title="מחק פינוי"
                                          >
                                            <i className="fas fa-trash"></i>
                                          </button>
                                        )}
                                        {isBooked && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              fetchBookingDetails(
                                                schedule.slot._id,
                                                schedule._id
                                              );
                                            }}
                                            className="text-blue-500 hover:text-blue-700 text-sm"
                                            title="פרטי המזמין"
                                          >
                                            <i className="fas fa-user"></i>
                                          </button>
                                        )}
                                      </div>
                                      <div
                                        className={`font-semibold ${isExpanded ? "text-base" : "text-xs"}`}
                                      >
                                        {schedule.start_time} - {schedule.end_time}
                                      </div>
                                    </div>
                                    {isExpanded && (
                                      <div className="mt-2 text-sm">
                                        <div>
                                          {schedule.type === "טעינה לרכב חשמלי" &&
                                            `סוג טעינה: ${schedule.charger || "לא צוין"}`}
                                        </div>
                                        <div className="mt-1">
                                          סטטוס: {isBooked ? "הוזמן" : "זמין להזמנה"}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Add Popup */}
          {showQuickAddPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
                <h3 className="text-xl font-bold mb-4 text-center">
                  הוסף פינוי חנייה מהיר
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="font-semibold">תאריך</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]} // Prevent selecting past dates
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className="font-semibold">שעת התחלה</label>
                      <input
                        type="time"
                        name="startTime"
                        value={quickAddData.startTime}
                        onChange={handleQuickAddChange}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="font-semibold">שעת סיום</label>
                      <input
                        type="time"
                        name="endTime"
                        value={quickAddData.endTime}
                        onChange={handleQuickAddChange}
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
                          value={quickAddData.type}
                          onChange={handleQuickAddChange}
                          className="w-full border rounded px-3 py-2"
                        >
                          <option>השכרה רגילה</option>
                          <option>טעינה לרכב חשמלי</option>
                        </select>
                      </div>

                      {quickAddData.type === "טעינה לרכב חשמלי" && (
                        <div>
                          <label className="font-semibold">סוג טעינה</label>
                          <select
                            name="charger"
                            value={quickAddData.charger}
                            onChange={handleQuickAddChange}
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

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => handleAddSlot(quickAddData)}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                    >
                      הוסף
                    </button>
                    <button
                      onClick={() => setShowQuickAddPopup(false)}
                      className="flex-1 bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Popup */}
          {showSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
                <h3 className="text-xl font-bold mb-5 text-center">
                <h3 className="text-xl font-bold mb-5 text-center">
                  הגדרות חנייה
                </h3>

                <div className="space-y-4">
                  {/* Price setting - editable */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <label className="font-semibold text-blue-800">מחיר לשעה (₪)</label>
                    <input
                      type="number"
                      value={newPrice}
                      onChange={(e) => {
                        setPriceError("");
                        setPriceSuccess("");
                        setNewPrice(e.target.value);
                      }}
                      placeholder={
                        parkingSlots.find((s) => s.spot_type === "private")
                          ?.hourly_price || "לא הוגדר מחיר"
                      }
                      className="w-full border border-blue-200 rounded px-3 py-2 mt-1 bg-white"
                      className="w-full border border-blue-200 rounded px-3 py-2 mt-1 bg-white"
                    />
                  </div>

                  {/* Address section - styled without dividing line */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">פרטי כתובת החנייה</h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="text-sm text-gray-600">עיר</label>
                        <input
                          type="text"
                          value={parkingSlots.find((s) => s.spot_type === "private")?.address?.city || ""}
                          disabled
                          className="w-full border border-gray-200 rounded px-3 py-2 mt-1 bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-sm text-gray-600">רחוב</label>
                        <input
                          type="text"
                          value={parkingSlots.find((s) => s.spot_type === "private")?.address?.street || ""}
                          disabled
                          className="w-full border border-gray-200 rounded px-3 py-2 mt-1 bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-gray-600">מספר בית</label>
                        <input
                          type="text"
                          value={parkingSlots.find((s) => s.spot_type === "private")?.address?.number || ""}
                          disabled
                          className="w-full border border-gray-200 rounded px-3 py-2 mt-1 bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-gray-600">מיקוד</label>
                        <input
                          type="text"
                          value={parkingSlots.find((s) => s.spot_type === "private")?.address?.postal_code || ""}
                          disabled
                          className="w-full border border-gray-200 rounded px-3 py-2 mt-1 bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mt-2 flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>פרטי הכתובת מוצגים לצפייה בלבד. לשינוי כתובת יש לפנות לשירות לקוחות.</span>
                    </div>
                  </div>

                  {priceError && (
                    <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{priceError}</div>
                  )}

                  {priceSuccess && (
                    <div className="text-green-500 text-sm bg-green-50 p-2 rounded">{priceSuccess}</div>
                  )}

                  <div className="flex gap-3 mt-4">
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={async () => {
                        if (!newPrice) {
                          setPriceError("יש להזין מחיר");
                          return;
                        }

                        if (isNaN(newPrice) || Number(newPrice) < 0) {
                          setPriceError("יש להזין מחיר תקין");
                          return;
                        }

                        try {
                          const token = localStorage.getItem("token");
                          const privateSpot = parkingSlots.find(
                            (s) => s.spot_type === "private"
                          );

                          if (!privateSpot) {
                            setPriceError("לא נמצאה חניה פרטית");
                            return;
                          }

                          await axios.patch(
                            `/api/v1/parking-spots/${privateSpot._id}`,
                            { hourly_price: Number(newPrice) },
                            { headers: { Authorization: `Bearer ${token}` } }
                          );

                          setPriceSuccess("המחיר עודכן בהצלחה");
                          await fetchMySpots();
                        } catch (err) {
                          setPriceError("שגיאה בעדכון המחיר");
                        }
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      שמור שינויים
                      שמור שינויים
                    </button>
                    <button
                      onClick={() => {
                        setShowSettings(false);
                        setNewPrice("");
                        setPriceError("");
                        setPriceSuccess("");
                      }}
                      className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                      className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                    >
                      סגור
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Dialog */}
          {confirmDeleteId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-sm">
                <h3 className="text-xl font-bold mb-4 text-center">
                  אישור מחיקה
                </h3>
                <p className="text-center mb-6">
                  האם אתה בטוח שברצונך למחוק את פינוי החנייה הזה?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      handleDelete(
                        confirmDeleteId.spotId,
                        confirmDeleteId.scheduleId
                      )
                    }
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                  >
                    מחק
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            </div>
          )}

          {popupData && (
            <Popup
              title={popupData.title}
              description={popupData.description}
              type={popupData.type || "info"}
              onClose={() => setPopupData(null)}
            />
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default ReleaseParking;