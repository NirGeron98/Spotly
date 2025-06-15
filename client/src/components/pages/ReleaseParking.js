import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import Navbar from "../shared/Navbar";
import Sidebar from "../shared/Sidebar";
import Footer from "../shared/Footer";
import Popup from "../shared/Popup";
import { FaCog, FaTrash, FaUser } from "react-icons/fa";
import { format, fromZonedTime, toZonedTime } from "date-fns-tz";
import {
  startOfDay,
  addDays,
  getDay,
  parseISO,
  isValid,
  isBefore,
} from "date-fns";
import { USER_TIMEZONE } from "../utils/constants";

const ReleaseParking = ({ loggedIn, setLoggedIn }) => {
  document.title = "ניהול החנייה שלי | Spotly";
  const [current, setCurrent] = useState("releaseParking");
  const [user] = useState(null);
  const [parkingSlots, setParkingSlots] = useState([]);
  const [loadingSpots, setLoadingSpots] = useState(true);
  const [popupData, setPopupData] = useState({
    title: "",
    description: "",
    type: "info",
    show: false,
  });
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [showQuickAddPopup, setShowQuickAddPopup] = useState(false);
  const [newPrice, setNewPrice] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isBuildingMode, setIsBuildingMode] = useState(false);
  const [priceError, setPriceError] = useState("");
  const [priceSuccess, setPriceSuccess] = useState("");
  const [startOfWeekDate, setStartOfWeekDate] = useState(
    startOfDay(new Date())
  );
  const [weekViewSchedules, setWeekViewSchedules] = useState([]);
  const [expandedSchedule, setExpandedSchedule] = useState(null);
  const timeGridRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  console.log(
    "ReleaseParking Component: USER_TIMEZONE defined as:",
    USER_TIMEZONE
  );

  const getRoundedTime = (date = new Date()) => {
    date.setSeconds(0, 0);
    const minutes = date.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;

    if (roundedMinutes === 60) {
      date.setHours(date.getHours() + 1, 0);
    } else {
      date.setMinutes(roundedMinutes);
    }

    if (date.getHours() < 6) {
      date.setHours(6, 0, 0, 0);
    }

    return date;
  };

  const getEndTime = (startDate) => {
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // +2h
    const maxEnd = new Date(startDate);
    maxEnd.setHours(23, 59, 0, 0);
    return endDate > maxEnd ? maxEnd : endDate;
  };

  const now = getRoundedTime();
  const twoHoursLater = getEndTime(now);

  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: format(now, "HH:mm"),
    endTime: format(twoHoursLater, "HH:mm"),
    type: "השכרה רגילה",
  });

  const [quickAddData, setQuickAddData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: format(now, "HH:mm"),
    endTime: format(twoHoursLater, "HH:mm"),
    type: "השכרה רגילה",
  });

  const getStartOfWeek = (date) => {
    const zonedDate = toZonedTime(date, USER_TIMEZONE);
    const day = getDay(zonedDate);
    const diff = zonedDate.getDate() - day;
    const startOfWeekDay = new Date(zonedDate.setDate(diff));
    return startOfDay(startOfWeekDay);
  };

  useEffect(() => {
    setStartOfWeekDate(getStartOfWeek(new Date()));
  }, []);

  const isDateInPast = (dateInput) => {
    try {
      const todayUtcStart = startOfDay(new Date());

      let inputDateStartUtc;

      if (typeof dateInput === "string") {
        const localDateAtStartOfDay = `${dateInput}T00:00:00`;
        inputDateStartUtc = fromZonedTime(localDateAtStartOfDay, USER_TIMEZONE);
      } else if (dateInput instanceof Date) {
        const zonedInputDate = toZonedTime(dateInput, USER_TIMEZONE);
        const localStartOfInputDay = startOfDay(zonedInputDate);
        inputDateStartUtc = fromZonedTime(localStartOfInputDay, USER_TIMEZONE);
      } else {
        console.warn("isDateInPast: Invalid dateInput type", dateInput);
        return false;
      }

      return isBefore(inputDateStartUtc, todayUtcStart);
    } catch (e) {
      console.error("Error in isDateInPast:", e, "Input:", dateInput);
      return false;
    }
  };

  const isDayInPast = (dayIndex) => {
    const dayDate = addDays(startOfWeekDate, dayIndex);
    return isDateInPast(dayDate);
  };

  const formatDateForDisplay = (date) => {
    try {
      const zonedDate = toZonedTime(date, USER_TIMEZONE);
      return format(zonedDate, "dd/MM", { timeZone: USER_TIMEZONE });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const getDayName = (dayOfWeek) => {
    const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    return days[dayOfWeek];
  };

  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(startOfWeekDate, i));
    }
    return dates;
  };

  const pixelToTime = (pixel) => {
    const startHour = 6;
    const heightPerHour = 60;
    const totalMinutes = (pixel / heightPerHour) * 60;

    const roundedMinutes = Math.round(totalMinutes / 15) * 15;
    let hour = Math.floor(roundedMinutes / 60) + startHour;
    let minute = roundedMinutes % 60;

    if (hour >= 24) {
      hour = 23;
      minute = 59;
    }

    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  };

  const getTimePosition = (time) => {
    try {
      if (!time || typeof time !== "string" || !time.includes(":")) return 0;

      const [hours, minutes] = time.split(":").map(Number);
      const startHour = 6;
      const heightPerHour = 60;

      const totalMinutesFromStart = (hours - startHour) * 60 + minutes;
      const position = (totalMinutesFromStart / 60) * heightPerHour;

      return Math.max(0, Math.min(position, 18 * heightPerHour));
    } catch (e) {
      console.error("Error calculating time position:", time, e);
      return 0;
    }
  };

  const getTimeSlotHeight = (startTime, endTime) => {
    try {
      if (
        !startTime ||
        !endTime ||
        typeof startTime !== "string" ||
        typeof endTime !== "string" ||
        !startTime.includes(":") ||
        !endTime.includes(":")
      )
        return 20;
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);
      const startTotalMinutes = startH * 60 + startM;
      const endTotalMinutes = endH * 60 + endM;
      const durationMinutes = endTotalMinutes - startTotalMinutes;
      const heightPerHour = 60;
      const height = (durationMinutes / 60) * heightPerHour;
      return Math.max(height, 15);
    } catch (e) {
      console.error("Error calculating slot height:", startTime, endTime, e);
      return 20;
    }
  };

  const fetchMySpots = useCallback(async () => {
    setLoadingSpots(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/v1/parking-spots/my-spots", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const spots = res.data?.data?.parkingSpots || [];
      const processedSpots = spots.map((spot) => ({
        ...spot,
        availability_schedule: (spot.availability_schedule || [])
          .map((schedule) => {
            try {
              const startUtc = parseISO(schedule.start_datetime);
              const endUtc = parseISO(schedule.end_datetime);
              const zonedStart = toZonedTime(startUtc, USER_TIMEZONE);
              const zonedEnd = toZonedTime(endUtc, USER_TIMEZONE);
              return {
                ...schedule,
                display_date: format(zonedStart, "yyyy-MM-dd", {
                  timeZone: USER_TIMEZONE,
                }),
                display_start_time: format(zonedStart, "HH:mm", {
                  timeZone: USER_TIMEZONE,
                }),
                display_end_time: format(zonedEnd, "HH:mm", {
                  timeZone: USER_TIMEZONE,
                }),
              };
            } catch (e) {
              console.error("Error processing schedule dates:", schedule, e);
              return {
                ...schedule,
                display_date: "Invalid",
                display_start_time: "Invalid",
                display_end_time: "Invalid",
              };
            }
          })
          .sort((a, b) => {
            try {
              return parseISO(a.start_datetime) - parseISO(b.start_datetime);
            } catch {
              return 0;
            }
          }),
      }));
      setParkingSlots(processedSpots);
      const hasPrivate = processedSpots.some((s) => s.spot_type === "private");
      const hasBuilding = processedSpots.some(
        (s) => s.spot_type === "building"
      );
      if (hasBuilding && !hasPrivate) {
        setIsBuildingMode(true);
      } else {
        setIsBuildingMode(false);
      }
    } catch (err) {
      console.error("Error fetching parking spots:", err);
      setPopupData({
        title: "שגיאה",
        description: "לא ניתן לטעון את החניות שלך",
        type: "error",
        show: true,
      });
    } finally {
      setLoadingSpots(false);
    }
  }, []);

  useEffect(() => {
    fetchMySpots();
  }, [fetchMySpots]);

  const generateWeekViewData = useCallback(() => {
    const schedules = [];
    const weekStart = startOfWeekDate;
    const weekEnd = addDays(weekStart, 6);
    parkingSlots.forEach((slot) => {
      if (slot.availability_schedule) {
        slot.availability_schedule.forEach((schedule) => {
          try {
            const scheduleStartUtc = parseISO(schedule.start_datetime);
            if (!isValid(scheduleStartUtc)) return;
            const scheduleStartLocal = toZonedTime(
              scheduleStartUtc,
              USER_TIMEZONE
            );
            const scheduleDayStart = startOfDay(scheduleStartLocal);
            if (
              !isBefore(scheduleDayStart, weekStart) &&
              !isBefore(addDays(weekEnd, 1), scheduleDayStart)
            ) {
              const dayOfWeek = getDay(scheduleStartLocal);
              schedules.push({
                ...schedule,
                slot,
                dayOfWeek: dayOfWeek,
              });
            }
          } catch (e) {
            console.error(
              "Error processing schedule for week view:",
              schedule,
              e
            );
          }
        });
      }
    });
    setWeekViewSchedules(schedules);
  }, [parkingSlots, startOfWeekDate, USER_TIMEZONE]);

  useEffect(() => {
    generateWeekViewData();
  }, [generateWeekViewData]);

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
          show: true,
        });
        return;
      }
      const user = booking.user;
      const startLocal = toZonedTime(
        parseISO(booking.start_datetime),
        USER_TIMEZONE
      );
      const endLocal = toZonedTime(
        parseISO(booking.end_datetime),
        USER_TIMEZONE
      );
      const start = format(startLocal, "HH:mm", { timeZone: USER_TIMEZONE });
      const end = format(endLocal, "HH:mm", { timeZone: USER_TIMEZONE });
      const date = format(startLocal, "dd/MM/yyyy", {
        timeZone: USER_TIMEZONE,
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
            <strong>תאריך:</strong> {date}
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
        show: true,
      });
    } catch (err) {
      setPopupData({
        title: "שגיאה",
        description: "לא ניתן לשלוף את פרטי המזמין",
        type: "error",
        show: true,
      });
    }
  };

  const isOverlap = (existingSchedules, date, newStartTime, newEndTime) => {
    try {
      const newStartLocalString = `${date}T${newStartTime}:00`;
      const newEndLocalString = `${date}T${newEndTime}:00`;
      const newStartUtc = fromZonedTime(newStartLocalString, USER_TIMEZONE);
      const newEndUtc = fromZonedTime(newEndLocalString, USER_TIMEZONE);
      return existingSchedules.some((existing) => {
        try {
          const existingStartUtc = parseISO(existing.start_datetime);
          const existingEndUtc = parseISO(existing.end_datetime);
          return (
            isBefore(newStartUtc, existingEndUtc) &&
            isBefore(existingStartUtc, newEndUtc)
          );
        } catch (e) {
          console.error(
            "Error comparing overlap with existing schedule:",
            existing,
            e
          );
          return false;
        }
      });
    } catch (e) {
      console.error("Error creating new date range for overlap check:", e);
      return true;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "startTime") {
      const [hours, minutes] = value.split(":").map(Number);
      const newStart = new Date();
      newStart.setHours(hours, minutes, 0, 0);
      const newEnd = getEndTime(newStart);

      setFormData((prev) => ({
        ...prev,
        startTime: value,
        endTime: format(newEnd, "HH:mm"),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleQuickAddChange = (e) => {
    const { name, value } = e.target;
    setQuickAddData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSlot = async (dataToAdd = formData) => {
    const { date, startTime, endTime, type } = dataToAdd;
    if (!date || !startTime || !endTime) {
      console.log("handleAddSlot: Validation failed - Missing date/time");
      setPopupData({
        title: "שגיאה",
        description: "יש למלא תאריך, שעת התחלה ושעת סיום",
        type: "error",
        show: true,
      });
      return;
    }

    console.log("handleAddSlot: Checking if date is in past:", date);
    if (isDateInPast(date)) {
      console.log("handleAddSlot: Validation failed - Date is in past");
      setPopupData({
        title: "שגיאה",
        description: "לא ניתן להוסיף זמינות לתאריכים שכבר עברו",
        type: "error",
        show: true,
      });
      return;
    }

    let startUtc, endUtc;
    try {
      const localStartString = `${date}T${startTime}:00`;
      const localEndString = `${date}T${endTime}:00`;
      startUtc = fromZonedTime(localStartString, USER_TIMEZONE);
      endUtc = fromZonedTime(localEndString, USER_TIMEZONE);
      console.log(
        `handleAddSlot: Converted UTC times. Start: ${startUtc.toISOString()}, End: ${endUtc.toISOString()}`
      );

      if (!isBefore(startUtc, endUtc)) {
        console.log(
          "handleAddSlot: Validation failed - End time is not after start time"
        );
        setPopupData({
          title: "שגיאה",
          description: "שעת סיום חייבת להיות אחרי שעת התחלה",
          type: "error",
          show: true,
        });
        return;
      }
    } catch (e) {
      console.error("handleAddSlot: Error parsing date/time:", e);
      setPopupData({
        title: "שגיאה",
        description: "פורמט תאריך או שעה שגוי",
        type: "error",
        show: true,
      });
      return;
    }

    const token = localStorage.getItem("token");
    let targetSpot = null;

    console.log(
      "handleAddSlot: Determining target spot. isBuildingMode:",
      isBuildingMode
    );
    console.log("handleAddSlot: Available parkingSlots:", parkingSlots);

    if (isBuildingMode) {
      targetSpot = parkingSlots.find((s) => s.spot_type === "building");
      if (!targetSpot) {
        console.log(
          "handleAddSlot: Validation failed - No building spot found"
        );
        setPopupData({
          title: "שגיאה",
          description: "לא נמצאה חנייה משויכת בבניין שלך",
          type: "error",
          show: true,
        });
        return;
      }
    } else {
      targetSpot = parkingSlots.find((s) => s.spot_type === "private");
      if (!targetSpot) {
        console.log("handleAddSlot: Validation failed - No private spot found");
        setPopupData({
          title: "שגיאה",
          description: "לא נמצאה חנייה פרטית עבור המשתמש",
          type: "error",
          show: true,
        });
        return;
      }

      // Check if hourly price is 0 or not set
      if (
        targetSpot.hourly_price === undefined ||
        targetSpot.hourly_price === null ||
        targetSpot.hourly_price === 0
      ) {
        console.log(
          "handleAddSlot: Validation failed - Private spot price is zero or not set"
        );

        setPopupData({
          title: "נדרש לעדכן את המחיר לשעה",
          description:
            "לפני שתוכל להוסיף זמינות חנייה, עליך להגדיר מחיר לשעה בהגדרות החנייה.",
          type: "warning",
          show: true,
        });
        return;
      }
    }
    console.log("handleAddSlot: Target spot found:", targetSpot?._id);

    console.log(
      "handleAddSlot: Checking for overlap with existing schedules:",
      targetSpot.availability_schedule || []
    );
    const hasOverlap = isOverlap(
      targetSpot.availability_schedule || [],
      date,
      startTime,
      endTime
    );

    if (hasOverlap) {
      console.log("handleAddSlot: Validation failed - Overlap detected");
      setPopupData({
        title: "שגיאה",
        description: `יש חפיפה עם פינוי קיים בתאריך ${date}`,
        type: "error",
        show: true,
      });
      return;
    }

    try {
      const scheduleData = {
        start_datetime: startUtc.toISOString(),
        end_datetime: endUtc.toISOString(),
        is_available: true,
        type,
        timezone: USER_TIMEZONE,
      };

      console.log(
        "handleAddSlot: Making API call to add schedule:",
        scheduleData
      );

      await axios.post(
        `/api/v1/parking-spots/${targetSpot._id}/availability-schedule`,
        scheduleData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(
        "handleAddSlot: API call successful. Fetching spots and showing success popup."
      );

      await fetchMySpots();
      setPopupData({
        title: "הצלחה",
        description: "החנייה נוספה בהצלחה ✅",
        type: "success",
        show: true,
      });
      const resetDate = format(new Date(), "yyyy-MM-dd");
      setFormData({
        date: resetDate,
        startTime: "",
        endTime: "",
        type: "השכרה רגילה",
      });
      setQuickAddData({
        date: resetDate,
        startTime: "",
        endTime: "",
        type: "השכרה רגילה",
      });
      setShowQuickAddPopup(false);
    } catch (err) {
      console.error("handleAddSlot: Error during API call:", err);
      console.error("handleAddSlot: Error response data:", err?.response?.data);
      setPopupData({
        title: "שגיאה",
        description: err?.response?.data?.message || "לא ניתן להוסיף חנייה",
        type: "error",
        show: true,
      });
    }
  };

  const handleDeleteSlot = async () => {
    if (!confirmDeleteId) return;
    const { spotId, scheduleId } = confirmDeleteId;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `/api/v1/parking-spots/${spotId}/availability-schedule/${scheduleId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchMySpots();
      setPopupData({
        title: "הצלחה",
        description: "הפינוי נמחק בהצלחה",
        type: "success",
        show: true,
      });
    } catch (err) {
      console.error("Error deleting schedule:", err);
      setPopupData({
        title: "שגיאה",
        description: err?.response?.data?.message || "שגיאה במחיקת הפינוי",
        type: "error",
        show: true,
      });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const goToPrevWeek = () => {
    setStartOfWeekDate((prev) => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setStartOfWeekDate((prev) => addDays(prev, 7));
  };

  const goToCurrentWeek = () => {
    setStartOfWeekDate(getStartOfWeek(new Date()));
  };

  const handleMouseDown = (e, dayIndex) => {
    if (loadingSpots || isDayInPast(dayIndex)) return;

    const gridRect = timeGridRef.current.getBoundingClientRect();

    const headerHeight =
      document.querySelector(".your-header-class")?.offsetHeight || 60;
    const relativeY =
      e.clientY - gridRect.top - headerHeight + timeGridRef.current.scrollTop;

    const exactHour = 6 + relativeY / 60;

    const roundedHour = Math.floor(exactHour * 4) / 4;

    const snappedPosition = (roundedHour - 6) * 60;

    const boundedY = Math.max(0, Math.min(snappedPosition, 18 * 60));

    setSelectedDay(dayIndex);
    setDragStart(boundedY);
    setDragEnd(boundedY);
    setIsDragging(true);

    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const gridRect = timeGridRef.current.getBoundingClientRect();

    const relativeY = e.clientY - gridRect.top + timeGridRef.current.scrollTop;

    const exactHour = 6 + relativeY / 60;

    const roundedHour = Math.floor(exactHour * 4) / 4;

    const snappedPosition = (roundedHour - 6) * 60;

    const boundedY = Math.max(0, Math.min(snappedPosition, 18 * 60));

    setDragEnd(boundedY);
    e.preventDefault();
  };

  const handleMouseUp = () => {
    if (isDragging) {
      const startY = Math.min(dragStart, dragEnd);
      const endY = Math.max(dragStart, dragEnd);
      if (Math.abs(dragEnd - dragStart) >= 15) {
        const selectedDate = addDays(startOfWeekDate, selectedDay);
        const startTime = pixelToTime(startY);
        const endTime = pixelToTime(endY);
        if (startTime && endTime && startTime < endTime) {
          // Check if hourly price is set before showing quick add popup
          const privateSpot = parkingSlots.find(
            (s) => s.spot_type === "private"
          );
          if (
            !isBuildingMode &&
            (!privateSpot?.hourly_price || privateSpot.hourly_price === 0)
          ) {
            setPopupData({
              title: "נדרש לעדכן את המחיר לשעה",
              description:
                "לפני שתוכל להוסיף זמינות חנייה, עליך להגדיר מחיר לשעה בהגדרות החנייה.",
              type: "warning",
              show: true,
            });
          } else {
            setQuickAddData({
              date: format(selectedDate, "yyyy-MM-dd"),
              startTime,
              endTime,
              type: "השכרה רגילה",
            });
            setShowQuickAddPopup(true);
          }
        } else {
          console.warn(
            "Drag resulted in invalid time range:",
            startTime,
            endTime
          );
        }
      }
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setSelectedDay(null);
  };

  const handlePriceUpdate = async () => {
    const privateSpot = parkingSlots.find((s) => s.spot_type === "private");
    if (!privateSpot) {
      setPriceError("לא נמצאה חנייה פרטית.");
      return;
    }
    if (
      newPrice === "" ||
      isNaN(parseFloat(newPrice)) ||
      parseFloat(newPrice) < 0
    ) {
      setPriceError("אנא הזן מחיר חוקי (מספר חיובי).");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `/api/v1/parking-spots/${privateSpot._id}`,
        { hourly_price: parseFloat(newPrice) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPriceSuccess("המחיר עודכן בהצלחה!");
      setPriceError("");
      await fetchMySpots();
    } catch (err) {
      console.error("Error updating price:", err);
      setPriceError(err?.response?.data?.message || "שגיאה בעדכון המחיר.");
      setPriceSuccess("");
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

        <main className="flex-1 p-4 md:p-10 mt-16 w-full mr-64 lg:mr-80 transition-all duration-300 min-w-0">
          <div className="max-w-[1200px] mx-auto">
            <h1 className="pt-[68px] text-3xl font-extrabold text-blue-700 text-center w-full">
              ניהול החנייה שלי
            </h1>
            {!isBuildingMode && (
              <button
                onClick={() => {
                  const privateSpot = parkingSlots.find(
                    (s) => s.spot_type === "private"
                  );
                  setNewPrice(privateSpot?.hourly_price?.toString() || "");
                  setPriceError("");
                  setPriceSuccess("");
                  setShowSettingsPopup(true);
                }}
                className="absolute top-2 left-2 flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 shadow-md"
                title="הגדרות חנייה"
              >
                <span className="ml-2">הגדרות חנייה</span>
                <FaCog />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md space-y-4 h-fit">
              <h2 className="text-xl font-bold text-center mb-4">
                הוסף פינוי חנייה
              </h2>
              <div>
                <label className="font-semibold">תאריך</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  min={format(new Date(), "yyyy-MM-dd")}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שעת התחלה
                  </label>
                  <select
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 text-right"
                  >
                    {Array.from({ length: 72 }).map((_, i) => {
                      const hours = Math.floor(i / 4) + 6;
                      const minutes = (i % 4) * 15;
                      const timeString = `${hours
                        .toString()
                        .padStart(2, "0")}:${minutes
                        .toString()
                        .padStart(2, "0")}`;
                      return (
                        <option key={i} value={timeString}>
                          {timeString}
                        </option>
                      );
                    })}
                    <option value="23:59">23:59</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    שעת סיום
                  </label>
                  <select
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 text-right"
                  >
                    {Array.from({ length: 72 }).map((_, i) => {
                      const hours = Math.floor(i / 4) + 6;
                      const minutes = (i % 4) * 15;
                      const timeString = `${hours
                        .toString()
                        .padStart(2, "0")}:${minutes
                        .toString()
                        .padStart(2, "0")}`;
                      return (
                        <option key={i} value={timeString}>
                          {timeString}
                        </option>
                      );
                    })}
                    <option value="23:59">23:59</option>
                  </select>
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
            <div className="lg:col-span-2 bg-white p-3 md:p-6 rounded-xl shadow-md flex flex-col h-[500px] md:h-[600px] lg:h-[700px]">
              <h2 className="text-lg md:text-xl font-bold text-center mb-4">
                לוח פינויי החניות
              </h2>

              <div className="mb-4 p-2 bg-blue-50 text-blue-700 rounded text-xs md:text-sm text-center">
                <strong>טיפ:</strong>
                <span className="hidden md:inline">
                  {" "}
                  לחץ וגרור על הלוח כדי ליצור פינוי חנייה חדש
                </span>
                <span className="md:hidden"> גע על הלוח כדי ליצור פינוי</span>
              </div>

              <div className="flex justify-between items-center mb-4 gap-2">
                <button
                  onClick={goToPrevWeek}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 md:px-4 py-1 rounded text-xs md:text-sm"
                >
                  <i className="fas fa-chevron-right ml-1"></i>
                  <span className="hidden sm:inline">שבוע קודם</span>
                  <span className="sm:hidden">קודם</span>
                </button>

                <button
                  onClick={goToCurrentWeek}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 md:px-4 py-1 rounded text-xs md:text-sm"
                >
                  <span className="hidden sm:inline">השבוע הנוכחי</span>
                  <span className="sm:hidden">השבוע</span>
                </button>

                <button
                  onClick={goToNextWeek}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 md:px-4 py-1 rounded text-xs md:text-sm"
                >
                  <span className="hidden sm:inline">שבוע הבא</span>
                  <span className="sm:hidden">הבא</span>
                  <i className="fas fa-chevron-left mr-1"></i>
                </button>
              </div>

              {loadingSpots ? (
                <div className="flex-grow flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-blue-700 mx-auto"></div>
                </div>
              ) : (
                <div
                  className="flex-grow overflow-auto relative"
                  ref={timeGridRef}
                >
                  <div className="flex sticky top-0 bg-white z-20 border-b border-gray-200 min-w-[700px] md:min-w-[900px] lg:min-w-[1000px]">
                    <div className="w-12 md:w-16 shrink-0 border-l border-gray-200 bg-gray-50"></div>
                    {getWeekDates().map((date, i) => (
                      <div
                        key={i}
                        className={`flex-1 text-center py-2 px-1 border-l border-gray-200 ${
                          isDayInPast(i) ? "bg-gray-100" : "bg-gray-50"
                        }`}
                      >
                        <div className="font-bold text-blue-800 text-xs md:text-sm lg:text-base">
                          <span className="md:hidden">
                            {getDayName(getDay(date)).slice(0, 2)}
                          </span>
                          <span className="hidden md:inline">
                            {getDayName(getDay(date))}
                          </span>
                        </div>

                        <div className="text-xs md:text-sm text-gray-600">
                          {formatDateForDisplay(date)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="relative min-w-[700px] md:min-w-[900px] lg:min-w-[1000px]">
                    <div className="absolute top-0 right-0 h-full w-12 md:w-16 border-l border-gray-200 bg-white z-10">
                      {Array.from({ length: 18 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-[40px] md:h-[50px] lg:h-[60px] border-b border-gray-200 text-xs text-gray-500 flex items-center justify-center"
                        >
                          <span className="hidden md:inline">
                            {String(i + 6).padStart(2, "0")}:00
                          </span>
                          <span className="md:hidden">{i + 6}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mr-12 md:mr-16 flex">
                      {Array.from({ length: 7 }).map((_, dayIndex) => {
                        const isPast = isDayInPast(dayIndex);
                        const dayHeight = 40; 
                        const mdDayHeight = 50; 
                        const lgDayHeight = 60; 

                        return (
                          <div
                            key={dayIndex}
                            className={`flex-1 relative border-l border-gray-200 ${
                              isPast
                                ? "bg-gray-100 cursor-not-allowed"
                                : "bg-white"
                            }`}
                            style={{
                              minHeight: `${dayHeight * 18}px`,
                              "@media (min-width: 768px)": {
                                minHeight: `${mdDayHeight * 18}px`,
                              },
                              "@media (min-width: 1024px)": {
                                minHeight: `${lgDayHeight * 18}px`,
                              },
                            }}
                            onMouseDown={(e) =>
                              !isPast && handleMouseDown(e, dayIndex)
                            }
                            onMouseMove={!isPast ? handleMouseMove : undefined}
                            onMouseUp={!isPast ? handleMouseUp : undefined}
                            onMouseLeave={!isPast ? handleMouseUp : undefined}
                            onTouchStart={(e) =>
                              !isPast && handleMouseDown(e.touches[0], dayIndex)
                            }
                            onTouchMove={
                              !isPast
                                ? (e) => handleMouseMove(e.touches[0])
                                : undefined
                            }
                            onTouchEnd={!isPast ? handleMouseUp : undefined}
                          >
                            {Array.from({ length: 18 }).map((_, i) => (
                              <div
                                key={i}
                                className={`absolute w-full h-[1px] ${
                                  isPast ? "bg-gray-200" : "bg-gray-100"
                                }`}
                                style={{
                                  top: `${i * dayHeight}px`,
                                  "@media (min-width: 768px)": {
                                    top: `${i * mdDayHeight}px`,
                                  },
                                  "@media (min-width: 1024px)": {
                                    top: `${i * lgDayHeight}px`,
                                  },
                                }}
                              ></div>
                            ))}

                            {isDragging && selectedDay === dayIndex && (
                              <div
                                className="absolute right-0 w-[calc(100%-4px)] md:w-[calc(100%-8px)] mx-1 rounded-md bg-blue-200 border border-blue-400 opacity-70 z-10"
                                style={{
                                  top: `${Math.min(dragStart, dragEnd)}px`,
                                  height: `${Math.abs(dragEnd - dragStart)}px`,
                                  minHeight: "15px",
                                }}
                              ></div>
                            )}

                            {weekViewSchedules
                              .filter(
                                (schedule) => schedule.dayOfWeek === dayIndex
                              )
                              .map((schedule, idx) => {
                                const top = getTimePosition(
                                  schedule.display_start_time
                                );
                                const height = getTimeSlotHeight(
                                  schedule.display_start_time,
                                  schedule.display_end_time
                                );
                                const isBooked = !schedule.is_available;
                                const isExpanded =
                                  expandedSchedule &&
                                  expandedSchedule._id === schedule._id;

                                return (
                                  <div
                                    key={idx}
                                    onClick={() =>
                                      setExpandedSchedule(
                                        isExpanded ? null : schedule
                                      )
                                    }
                                    className={`absolute right-0 w-[calc(100%-4px)] md:w-[calc(100%-8px)] mx-1 rounded-md p-1 md:p-2 cursor-pointer transition-all duration-200 overflow-hidden text-right ${
                                      isBooked
                                        ? "bg-red-100 border border-red-300 text-red-800"
                                        : schedule.type === "טעינה לרכב חשמלי"
                                        ? "bg-green-100 border border-green-300 text-green-800"
                                        : "bg-blue-100 border border-blue-300 text-blue-800"
                                    } ${
                                      isExpanded ? "shadow-lg z-20" : "z-10"
                                    }`}
                                    style={{
                                      top: `${top}px`,
                                      height: `${
                                        isExpanded
                                          ? "auto"
                                          : Math.max(height, 25)
                                      }px`,
                                      minHeight: "25px",
                                    }}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex gap-1 md:gap-2 flex-shrink-0">
                                        {!isBooked && !isPast && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setConfirmDeleteId({
                                                spotId: schedule.slot._id,
                                                scheduleId: schedule._id,
                                              });
                                            }}
                                            className="text-red-500 hover:text-red-700 text-xs md:text-sm"
                                            title="מחק פינוי"
                                          >
                                            <FaTrash />
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
                                            className="text-blue-500 hover:text-blue-700 text-xs md:text-sm"
                                            title="פרטי המזמין"
                                          >
                                            <FaUser />
                                          </button>
                                        )}
                                      </div>
                                      <div className="font-semibold text-xs md:text-sm">
                                        {schedule.display_start_time} -{" "}
                                        {schedule.display_end_time}
                                      </div>
                                    </div>

                                    {isExpanded && (
                                      <div className="mt-1 md:mt-2 text-xs md:text-sm space-y-1">
                                        <div>
                                          סטטוס:{" "}
                                          {isBooked ? "הוזמן" : "זמין להזמנה"}
                                        </div>
                                        <div className="truncate">
                                          חנייה:{" "}
                                          {schedule.slot?.spot_number
                                            ? `מספר ${schedule.slot.spot_number}`
                                            : schedule.slot?.address?.street ||
                                              "פרטית"}
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
                      value={quickAddData.date}
                      onChange={handleQuickAddChange}
                      min={format(new Date(), "yyyy-MM-dd")}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className="font-semibold">שעת התחלה</label>
                      <select
                        name="startTime"
                        value={quickAddData.startTime}
                        onChange={handleQuickAddChange}
                        className="w-full px-4 py-2 rounded-md border border-gray-300 text-right"
                      >
                        {Array.from({ length: 72 }).map((_, i) => {
                          const hours = Math.floor(i / 4) + 6;
                          const minutes = (i % 4) * 15;
                          const timeString = `${hours
                            .toString()
                            .padStart(2, "0")}:${minutes
                            .toString()
                            .padStart(2, "0")}`;
                          return (
                            <option key={i} value={timeString}>
                              {timeString}
                            </option>
                          );
                        })}
                        <option value="23:59">23:59</option>
                      </select>
                    </div>
                    <div className="w-1/2">
                      <label className="font-semibold">שעת סיום</label>
                      <select
                        name="endTime"
                        value={quickAddData.endTime}
                        onChange={handleQuickAddChange}
                        className="w-full px-4 py-2 rounded-md border border-gray-300 text-right"
                      >
                        {Array.from({ length: 72 }).map((_, i) => {
                          const hours = Math.floor(i / 4) + 6;
                          const minutes = (i % 4) * 15;
                          const timeString = `${hours
                            .toString()
                            .padStart(2, "0")}:${minutes
                            .toString()
                            .padStart(2, "0")}`;
                          return (
                            <option key={i} value={timeString}>
                              {timeString}
                            </option>
                          );
                        })}
                        <option value="23:59">23:59</option>
                      </select>
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
                    </>
                  )}
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowQuickAddPopup(false)}
                      className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                    >
                      ביטול
                    </button>
                    <button
                      onClick={() => handleAddSlot(quickAddData)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      הוסף
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showSettingsPopup && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg">
                {/* Updated header with centered title */}
                <div className="flex flex-col items-center relative mb-6">
                  <h3 className="text-2xl font-bold text-blue-700 mb-2 text-center">
                    הגדרות חנייה
                  </h3>
                  {/* Close button positioned absolutely in the corner */}
                  <button
                    onClick={() => setShowSettingsPopup(false)}
                    className="absolute top-0 left-0 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Price Setting Section */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <label className="font-semibold text-blue-800 block mb-2">
                      מחיר לשעה (₪)
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={newPrice}
                        onChange={(e) => {
                          setPriceError("");
                          setPriceSuccess("");
                          setNewPrice(e.target.value);
                        }}
                        placeholder={
                          parkingSlots
                            .find((s) => s.spot_type === "private")
                            ?.hourly_price?.toString() || "לא הוגדר מחיר"
                        }
                        className="w-full border border-blue-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.5"
                      />
                      <span className="mr-2 text-blue-800 font-bold">₪</span>
                    </div>
                    {priceError && (
                      <div className="text-red-500 text-sm mt-2 bg-red-50 p-2 rounded border border-red-100">
                        <span className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          {priceError}
                        </span>
                      </div>
                    )}
                    {priceSuccess && (
                      <div className="text-green-500 text-sm mt-2 bg-green-50 p-2 rounded border border-green-100">
                        <span className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {priceSuccess}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Address Section - Redesigned to look better for non-editable fields */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2 border-gray-300">
                      פרטי כתובת החנייה
                    </h4>

                    <div className="space-y-3 mt-2">
                      <div className="flex items-center">
                        <div className="w-1/4 text-gray-600 font-medium">
                          עיר:
                        </div>
                        <div className="w-3/4 text-gray-800 bg-gray-100 p-2 rounded">
                          {parkingSlots.find((s) => s.spot_type === "private")
                            ?.address?.city || "-"}
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className="w-1/4 text-gray-600 font-medium">
                          רחוב:
                        </div>
                        <div className="w-3/4 text-gray-800 bg-gray-100 p-2 rounded">
                          {parkingSlots.find((s) => s.spot_type === "private")
                            ?.address?.street || "-"}
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className="w-1/4 text-gray-600 font-medium">
                          מספר בית:
                        </div>
                        <div className="w-3/4 text-gray-800 bg-gray-100 p-2 rounded">
                          {parkingSlots.find((s) => s.spot_type === "private")
                            ?.address?.number || "-"}
                        </div>
                      </div>

                      {parkingSlots.find((s) => s.spot_type === "private")
                        ?.spot_number && (
                        <div className="flex items-center">
                          <div className="w-1/4 text-gray-600 font-medium">
                            מספר חנייה:
                          </div>
                          <div className="w-3/4 text-gray-800 bg-gray-100 p-2 rounded">
                            {parkingSlots.find((s) => s.spot_type === "private")
                              ?.spot_number || "-"}
                          </div>
                        </div>
                      )}

                      {parkingSlots.find((s) => s.spot_type === "private")
                        ?.floor && (
                        <div className="flex items-center">
                          <div className="w-1/4 text-gray-600 font-medium">
                            קומה:
                          </div>
                          <div className="w-3/4 text-gray-800 bg-gray-100 p-2 rounded">
                            {parkingSlots.find((s) => s.spot_type === "private")
                              ?.floor || "-"}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-100 flex items-start gap-2 text-sm text-blue-700">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>
                        פרטי הכתובת מוצגים לצפייה בלבד. לשינוי כתובת יש לפנות
                        לשירות לקוחות.
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowSettingsPopup(false)}
                      className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
                    >
                      סגור
                    </button>
                    <button
                      onClick={handlePriceUpdate}
                      className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700"
                    >
                      שמור שינויים
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {confirmDeleteId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
              <div
                className="bg-white rounded-lg p-6 max-w-md mx-4 text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  אישור מחיקת פינוי
                </h3>
                <p className="mb-6 text-gray-600">
                  האם אתה בטוח שברצונך למחוק את הפינוי? לא ניתן לשחזר פעולה זו.
                </p>
                <div className="flex justify-center space-x-4 space-x-reverse">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={handleDeleteSlot}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
                  >
                    מחק פינוי
                  </button>
                </div>
              </div>
            </div>
          )}
          {popupData.show && (
            <Popup
              title={popupData.title}
              description={popupData.description}
              type={popupData.type}
              onClose={() => setPopupData({ ...popupData, show: false })}
            />
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default ReleaseParking;
