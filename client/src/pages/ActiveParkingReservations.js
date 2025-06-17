import { useState, useEffect, useCallback } from "react";
import axios from "../axios";
import Navbar from "../components/shared/Navbar";
import Sidebar from "../components/shared/Sidebar";
import PageHeader from "../components/shared/PageHeader";
import Footer from "../components/shared/Footer";
import {
  FaClock,
  FaCheck,
  FaCarSide,
  FaMoneyBillWave,
  FaMapMarkerAlt,
  FaParking,
  FaTimes,
  FaStop,
} from "react-icons/fa";
import { parseISO } from "date-fns";
import { format, toZonedTime } from "date-fns-tz";
import Popup from "../components/shared/Popup";

const ActiveParkingTimer = ({
  activeBooking,
  timeRemaining,
  handleEndParking,
}) => {
  if (!activeBooking || !timeRemaining || !timeRemaining.isActive) return null;

  const { hours, minutes, percentage } = timeRemaining;

  return (
    <div className="mb-8 w-full">
      <div
        className="rounded-xl shadow-lg p-6 mx-auto max-w-4xl transform hover:scale-105 transition-all duration-500 border border-blue-200"
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          backgroundSize: "200% 200%",
          animation: "15s ease infinite",
          animationName: "gradientShift",
        }}
      >
        <style>{`
          @keyframes gradientShift {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
          @keyframes pulseRing {
            0% {
              transform: scale(0.95);
              opacity: 0.7;
            }
            50% {
              transform: scale(1);
              opacity: 0.3;
            }
            100% {
              transform: scale(0.95);
              opacity: 0.7;
            }
          }
          @keyframes rotate {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          @keyframes float {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-10px);
            }
          }
        `}</style>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Left side: Booking info */}
          <div className="text-white lg:w-1/3 text-center lg:text-right">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
              <h3 className="text-lg font-bold mb-3 flex items-center justify-center lg:justify-start">
                <FaParking className="ml-2 text-white" />
                חנייה פעילה כעת
              </h3>
              {localStorage.getItem("mode") !== "building" && (
                <p className="mb-2 text-blue-100 flex items-center justify-center lg:justify-start text-sm">
                  <FaMoneyBillWave className="ml-2" />
                  <span className="font-semibold">תעריף:</span>&nbsp;
                  {activeBooking.base_rate !== undefined &&
                  activeBooking.base_rate !== null &&
                  activeBooking.base_rate > 0
                    ? `${activeBooking.base_rate} ₪/שעה`
                    : activeBooking.spot &&
                      activeBooking.spot.hourly_price &&
                      activeBooking.spot.hourly_price > 0
                    ? `${activeBooking.spot.hourly_price} ₪/שעה`
                    : "0 ₪/שעה"}
                </p>
              )}

              <p className="mb-2 text-blue-100 flex items-center justify-center lg:justify-start text-sm">
                <FaMapMarkerAlt className="ml-2" />
                <span className="font-semibold">מיקום:</span>&nbsp;
                {activeBooking.spot?.spot_number
                  ? `חנייה מספר ${activeBooking.spot.spot_number}`
                  : "חנייה פרטית"}
              </p>
            </div>
          </div>

          {/* Center: Compact Timer */}
          <div className="relative lg:w-1/3 flex flex-col items-center">
            {/* Pulsing ring effect */}
            <div
              className="absolute w-32 h-32 rounded-full bg-blue-400 opacity-20"
              style={{
                animation: "3s infinite",
                animationName: "pulseRing",
              }}
            ></div>

            {/* Second pulse ring with delay */}
            <div
              className="absolute w-36 h-36 rounded-full bg-indigo-400 opacity-10"
              style={{
                animation: "3s infinite",
                animationName: "pulseRing",
                animationDelay: "1.5s",
              }}
            ></div>

            <div className="relative w-28 h-28 mx-auto">
              {/* Rotating outer ring */}
              <div
                className="absolute inset-0 w-full h-full border-2 border-white opacity-20 rounded-full"
                style={{
                  animation: "10s linear infinite",
                  animationName: "rotate",
                }}
              ></div>

              {/* Base circle */}
              <svg className="w-28 h-28" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${percentage}, 100`}
                  className="drop-shadow-lg"
                />
              </svg>

              {/* Central time display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <FaClock className="text-white mb-1 text-lg" />
                <div className="text-3xl font-bold text-white drop-shadow-lg">
                  {hours}:{minutes.toString().padStart(2, "0")}
                </div>
                <div className="text-xs text-blue-100 mt-1 font-medium">
                  זמן נותר
                </div>
              </div>
            </div>

            {/* Animation elements */}
            <div className="absolute w-full h-full pointer-events-none">
              <div className="absolute w-2 h-2 bg-blue-300 rounded-full top-6 left-6 animate-ping"></div>
              <div
                className="absolute w-3 h-3 bg-purple-300 rounded-full bottom-6 right-12 animate-ping"
                style={{ animationDelay: "0.5s" }}
              ></div>
              <div
                className="absolute w-2 h-2 bg-indigo-300 rounded-full bottom-12 left-12 animate-ping"
                style={{ animationDelay: "0.8s" }}
              ></div>
            </div>
          </div>

          {/* Right side: Action button */}
          <div className="lg:w-1/3 flex justify-center">
            <button
              onClick={() => handleEndParking(activeBooking)}
              className="group relative overflow-hidden px-6 py-3 rounded-xl bg-white/90 backdrop-blur-sm text-indigo-600 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-white/50"
            >
              <span className="relative z-10 group-hover:text-sky transition-colors duration-300 flex items-center gap-2">
                <FaStop />
                סיים חניה
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-x-0 group-hover:scale-x-100 origin-left rounded-xl"></span>
              <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 animate-pulse rounded-xl"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActiveParkingReservations = ({ loggedIn, setLoggedIn }) => {
  document.title = "הזמנות חנייה פעילות | Spotly";

  const storedMode = localStorage.getItem("mode") || "regular";

  const [current, setCurrent] = useState("activeReservations");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [showEndParkingModal, setShowEndParkingModal] = useState(false);
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  const [endingParkingBooking, setEndingParkingBooking] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState({});
  const [now, setNow] = useState(new Date());
  const [activeTimerBooking, setActiveTimerBooking] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 5; // Updated to show up to 5 bookings per page

  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = bookings.slice(
    indexOfFirstBooking,
    indexOfLastBooking
  );

  const totalPages = Math.ceil(bookings.length / bookingsPerPage);

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role || "user";

  // Find active booking with timer
  const findActiveBookingWithTimer = useCallback(() => {
    // Find bookings that are currently active (started but not ended)
    const activeBookings = bookings.filter((booking) => {
      const startTime = new Date(booking.start_datetime);
      const endTime = new Date(booking.end_datetime);
      return now >= startTime && now < endTime;
    });

    if (activeBookings.length === 0) {
      setActiveTimerBooking(null);
      return;
    }

    // Sort by end time (ascending) to find the one ending soonest
    activeBookings.sort(
      (a, b) => new Date(a.end_datetime) - new Date(b.end_datetime)
    );

    // Set the first one (ending soonest) as the active booking
    setActiveTimerBooking(activeBookings[0]);
  }, [bookings, now]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Find active booking whenever bookings or time changes
  useEffect(() => {
    findActiveBookingWithTimer();
  }, [findActiveBookingWithTimer, bookings, now]);

  // Calculate time remaining for all active bookings
  useEffect(() => {
    const timers = {};

    bookings.forEach((booking) => {
      const endTime = new Date(booking.end_datetime);
      const diffMs = endTime - now;

      if (diffMs > 0) {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        timers[booking._id] = {
          hours,
          minutes,
          percentage:
            100 - (diffMs / (endTime - new Date(booking.start_datetime))) * 100,
          isActive: now >= new Date(booking.start_datetime) && now < endTime,
        };
      } else {
        timers[booking._id] = {
          hours: 0,
          minutes: 0,
          percentage: 100,
          isActive: false,
        };
      }
    });

    setTimeRemaining(timers);
  }, [bookings, now]);

  useEffect(() => {
    fetchActiveBookings();
  }, []);

  const fetchActiveBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const storedMode = localStorage.getItem("mode");

      const response = await axios.get("/api/v1/bookings/user/my-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const activeBookings = response.data.data.bookings
        .filter((booking) => {
          const now = new Date();
          const startTime = new Date(booking.start_datetime);
          const endTime = new Date(booking.end_datetime);

          const isActive =
            booking.status === "active" &&
            (now < endTime || (now >= startTime && now < endTime));

          const isBuildingMode = storedMode === "building";
          const isBuildingBooking =
            booking.spot?.spot_type === "building" ||
            booking.spot?.spot_type === "regular";
          const isPrivateBooking = booking.spot?.spot_type === "private";

          return (
            isActive &&
            ((isBuildingMode && isBuildingBooking) ||
              (!isBuildingMode && isPrivateBooking))
          );
        })
        .map((booking) => {
          return booking;
        });

      setBookings(activeBookings);
      setError(null);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("אירעה שגיאה בטעינת ההזמנות. נסה שוב מאוחר יותר.");
    } finally {
      setLoading(false);
    }
  };

  const deleteBookingRequest = async (bookingId, token) => {
    try {
      await axios.delete(`/api/v1/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      throw new Error("Error canceling booking");
    }
  };

  const handleEndParking = async (booking) => {
    if (!booking) return;
    const token = localStorage.getItem("token");

    try {
      await deleteBookingRequest(booking._id, token);

      setBookings((prevBookings) =>
        prevBookings.filter((item) => item._id !== booking._id)
      );
      setCancelSuccess(true);

      setTimeout(() => {
        fetchActiveBookings();
        setCancelSuccess(false);
      }, 2000);

      setShowCancelModal(false);
    } catch (err) {
      console.error("Error canceling booking:", err);
      setError("אירעה שגיאה בביטול ההזמנה. נסה שוב מאוחר יותר.");
    }
  };

  const confirmEndParking = async () => {
    if (!endingParkingBooking) return;

    try {
      const token = localStorage.getItem("token");

      // Update booking status to "completed"
      await axios.patch(
        `/api/v1/bookings/${endingParkingBooking._id}`,
        {
          status: "completed",
          end_datetime: new Date().toISOString(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Close the end parking modal
      setShowEndParkingModal(false);

      // Dispatch custom event to trigger payment popup
      const parkingEndedEvent = new CustomEvent("parkingEnded", {
        detail: { bookingId: endingParkingBooking._id },
      });
      window.dispatchEvent(parkingEndedEvent);

      // Refresh the bookings list
      fetchActiveBookings();
    } catch (err) {
      console.error("Error ending parking:", err);
      setError("אירעה שגיאה בסיום החניה. נסה שוב מאוחר יותר.");
      setShowEndParkingModal(false);
    }
  };

  const userTimezone = "Asia/Jerusalem"; // Define userTimezone

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    try {
      const date = parseISO(dateTimeString); // Assuming dateTimeString is UTC ISO from backend
      const zonedDate = toZonedTime(date, userTimezone);
      return format(zonedDate, "dd/MM/yyyy HH:mm", { timeZone: userTimezone });
    } catch (e) {
      console.error("Error formatting date-time:", e, dateTimeString);
      return "Invalid Date";
    }
  };

  const formatDisplayDate = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    try {
      const date = parseISO(dateTimeString);
      const zonedDate = toZonedTime(date, userTimezone);
      return format(zonedDate, "dd/MM/yyyy", { timeZone: userTimezone });
    } catch (e) {
      console.error("Error formatting date:", e, dateTimeString);
      return "Invalid Date";
    }
  };

  const formatDisplayTime = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    try {
      const date = parseISO(dateTimeString);
      const zonedDate = toZonedTime(date, userTimezone);
      return format(zonedDate, "HH:mm", { timeZone: userTimezone });
    } catch (e) {
      console.error("Error formatting time:", e, dateTimeString);
      return "Invalid Date";
    }
  };

  // Calculate if a booking can be canceled (more than 1 hour before start time)
  const canBeCanceled = (startDatetime) => {
    const now = new Date();
    const bookingStart = new Date(startDatetime);
    const hourDifference = (bookingStart - now) / (1000 * 60 * 60);

    return hourDifference > 1;
  };

  // Calculate the final amount based on the actual duration
  const calculateFinalAmount = (booking) => {
    const startTime = new Date(booking.start_datetime);
    const endTime = new Date(); // Now
    const durationHours = (endTime - startTime) / (1000 * 60 * 60);

    // Round up to the nearest quarter hour
    const roundedDuration = Math.ceil(durationHours * 4) / 4;

    return (roundedDuration * booking.base_rate).toFixed(2);
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const maxButtons = 2;

    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
      return [...Array(4).keys()].map((i) => i + 1).concat(["...", totalPages]);
    }

    if (currentPage >= totalPages - 2) {
      return [
        1,
        "...",
        ...Array.from({ length: 3 }, (_, i) => totalPages - 3 + i),
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const getPaymentStatusDisplay = (status) => {
    switch (status) {
      case "completed":
        return {
          text: "שולם",
          class:
            "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200",
        };
      case "pending":
        return {
          text: "ממתין לתשלום",
          class:
            "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200",
        };
      case "refunded":
        return {
          text: "הוחזר",
          class:
            "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200",
        };
      default:
        return {
          text: status,
          class:
            "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border border-gray-300",
        };
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50"
      dir="rtl"
    >
      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} />

      <div className="flex flex-grow">
        <Sidebar current={current} setCurrent={setCurrent} role={role} />

        <main className="flex-1 p-4 md:p-10 mt-16 w-full mr-64 lg:mr-80 transition-all duration-300 min-w-0">
          {/* Header Section */}
          <PageHeader
            icon={FaParking}
            title="הזמנות חנייה פעילות"
            subtitle="כאן תוכל לראות ולנהל את ההזמנות הפעילות שלך"
          />

          {cancelSuccess && (
            <Popup
              title="הצלחה"
              description="ההזמנה בוטלה בהצלחה!"
              type="success"
              onClose={() => setCancelSuccess(false)}
            />
          )}

          {activeTimerBooking &&
            timeRemaining[activeTimerBooking._id] &&
            timeRemaining[activeTimerBooking._id].isActive && (
              <ActiveParkingTimer
                activeBooking={activeTimerBooking}
                timeRemaining={timeRemaining[activeTimerBooking._id]}
                handleEndParking={handleEndParking}
              />
            )}

          {loading ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center max-w-md mx-auto border border-blue-100">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-blue-600"></div>
              </div>
              <p className="text-gray-600 text-lg font-medium">
                טוען הזמנות...
              </p>
            </div>
          ) : error ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center text-red-600 max-w-md mx-auto border border-red-200">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTimes className="text-red-600 text-2xl" />
              </div>
              <p className="mb-6 text-lg">{error}</p>
              <button
                onClick={fetchActiveBookings}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                נסה שוב
              </button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center max-w-2xl mx-auto border border-blue-100">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaParking className="text-blue-600 text-4xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-4">
                אין הזמנות פעילות
              </h3>
              <p className="text-gray-600 text-lg">
                אין כרגע הזמנות פעילות להצגה.
              </p>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl w-full max-w-[95rem] mx-auto border border-blue-100 overflow-hidden">
              {/* Table Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <FaParking className="text-2xl" />
                  רשימת הזמנות פעילות ({bookings.length})
                </h2>
              </div>

              {/* Compact Card-based List */}
              <div className="p-6">
                <div className="space-y-3">
                  {currentBookings.map((booking, index) => {
                    const timer = timeRemaining[booking._id] || {
                      hours: 0,
                      minutes: 0,
                      percentage: 0,
                      isActive: false,
                    };
                    const paymentStatus = getPaymentStatusDisplay(
                      booking.payment_status
                    );

                    return (
                      <div
                        key={booking._id}
                        className="group bg-gradient-to-r from-white to-blue-50/50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-blue-100 p-4"
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Type & Address - 4 columns */}
                          <div className="col-span-4 flex items-center gap-3">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                              {booking.booking_type === "parking" ? (
                                <FaParking className="text-white text-sm" />
                              ) : (
                                <FaCarSide className="text-white text-sm" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium mb-1 inline-block">
                                {booking.booking_type === "parking"
                                  ? "חנייה"
                                  : "טעינה"}
                              </div>
                              <div className="text-gray-800 font-medium text-sm truncate">
                                {booking.spot?.address?.street &&
                                booking.spot?.address?.city
                                  ? `${booking.spot.address.city}, ${
                                      booking.spot.address.street
                                    } ${booking.spot.address.number || ""}`
                                  : booking.spot?.spot_number
                                  ? `חנייה מספר ${booking.spot.spot_number}`
                                  : "כתובת לא זמינה"}
                              </div>
                            </div>
                          </div>

                          {/* Start Time - 2 columns */}
                          <div className="col-span-2 text-center">
                            <div className="flex items-center justify-center gap-1 text-green-600 text-xs font-medium mb-1">
                              <span>שעת התחלה</span>
                            </div>
                            <div className="text-gray-800 font-bold text-sm">
                              {formatDisplayTime(booking.start_datetime)}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {formatDisplayDate(booking.start_datetime)}
                            </div>
                          </div>

                          {/* End Time - 2 columns */}
                          <div className="col-span-2 text-center">
                            <div className="flex items-center justify-center gap-1 text-red-600 text-xs font-medium mb-1">
                              <FaStop className="text-xs" />
                              <span>שעת סיום</span>
                            </div>
                            <div className="text-gray-800 font-bold text-sm">
                              {formatDisplayTime(booking.end_datetime)}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {formatDisplayDate(booking.end_datetime)}
                            </div>
                          </div>

                          {/* Timer & Status - 2 columns */}
                          <div className="col-span-2 text-center">
                            {timer.isActive ? (
                              <div className="flex flex-col items-center">
                                <div className="relative w-12 h-12 mb-1">
                                  <svg
                                    className="w-12 h-12 transform -rotate-90"
                                    viewBox="0 0 36 36"
                                  >
                                    <path
                                      d="M18 2.0845
                                        a 15.9155 15.9155 0 0 1 0 31.831
                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                      fill="none"
                                      stroke="#e5e7eb"
                                      strokeWidth="3"
                                      strokeDasharray="100, 100"
                                    />
                                    <path
                                      d="M18 2.0845
                                        a 15.9155 15.9155 0 0 1 0 31.831
                                        a 15.9155 15.9155 0 0 1 0 -31.831"
                                      fill="none"
                                      stroke="#3b82f6"
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                      strokeDasharray={`${timer.percentage}, 100`}
                                    />
                                  </svg>
                                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <FaClock className="text-blue-600 text-xs" />
                                  </div>
                                </div>
                                <div className="text-sm font-bold text-gray-800">
                                  {timer.hours}:
                                  {timer.minutes.toString().padStart(2, "0")}
                                </div>
                                <div className="text-xs text-gray-500">
                                  נותר
                                </div>
                                {storedMode !== "building" && (
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full mt-1 ${paymentStatus.class}`}
                                  >
                                    {paymentStatus.text}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                {new Date(booking.start_datetime) > now ? (
                                  <>
                                    <FaClock className="text-yellow-500 text-lg mb-1" />
                                    <span className="text-xs text-gray-500">
                                      ממתין
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <FaCheck className="text-green-500 text-lg mb-1" />
                                    <span className="text-xs text-gray-500">
                                      הסתיים
                                    </span>
                                  </>
                                )}
                                {storedMode !== "building" && (
                                  <>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {booking.base_rate !== undefined &&
                                      booking.base_rate !== null &&
                                      booking.base_rate > 0
                                        ? `${booking.base_rate} ₪/שעה`
                                        : booking.spot &&
                                          booking.spot.hourly_price &&
                                          booking.spot.hourly_price > 0
                                        ? `${booking.spot.hourly_price} ₪/שעה`
                                        : "0 ₪/שעה"}
                                    </div>
                                    <span
                                      className={`px-2 py-1 text-xs font-medium rounded-full mt-1 ${paymentStatus.class}`}
                                    >
                                      {paymentStatus.text}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions - 2 columns */}
                          <div className="col-span-2 flex flex-col gap-2">
                            {timer.isActive && (
                              <button
                                onClick={() => handleEndParking(booking)}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-1"
                              >
                                <FaStop className="text-xs" />
                                סיים
                              </button>
                            )}

                            {canBeCanceled(booking.start_datetime) && (
                              <button
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setShowCancelModal(true);
                                }}
                                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-1"
                              >
                                <FaTimes className="text-xs" />
                                ביטול
                              </button>
                            )}

                            {!canBeCanceled(booking.start_datetime) &&
                              !timer.isActive && (
                                <span className="text-gray-400 text-xs font-medium bg-gray-100 px-2 py-1 rounded-lg text-center">
                                  לא ניתן
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Enhanced Pagination */}
              {bookings.length > 0 && totalPages > 1 && (
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-t border-blue-100 p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                      מציג {indexOfFirstBooking + 1}-
                      {Math.min(indexOfLastBooking, bookings.length)} מתוך{" "}
                      {bookings.length}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                          currentPage === 1
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105"
                        }`}
                      >
                        הקודם
                      </button>

                      <div className="flex gap-1">
                        {getPageNumbers().map((pageNumber, i) => (
                          <button
                            key={i}
                            onClick={() =>
                              typeof pageNumber === "number" &&
                              handlePageChange(pageNumber)
                            }
                            disabled={pageNumber === "..."}
                            className={`w-10 h-10 rounded-xl font-bold transition-all duration-300 ${
                              pageNumber === currentPage
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-110"
                                : pageNumber === "..."
                                ? "bg-transparent text-gray-400 cursor-default"
                                : "bg-white text-gray-700 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 shadow-sm hover:shadow-md border border-gray-200"
                            }`}
                          >
                            {pageNumber}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                          currentPage === totalPages
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105"
                        }`}
                      >
                        הבא
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer />

      {/* Enhanced Cancel Confirmation Modal */}
      {showCancelModal && (
        <Popup
          title="אישור ביטול הזמנה"
          description="האם אתה בטוח שברצונך לבטל את ההזמנה?"
          type="error"
          onClose={() => setShowCancelModal(false)}
          onConfirm={async () => {
            if (!selectedBooking) return;

            try {
              const token = localStorage.getItem("token");

              await axios.delete(
                `/api/v1/bookings/${selectedBooking._id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              setBookings(
                bookings.filter((item) => item._id !== selectedBooking._id)
              );
              setCancelSuccess(true);

              setTimeout(() => {
                fetchActiveBookings();
                setCancelSuccess(false);
              }, 2000);

              setShowCancelModal(false);
              setSelectedBooking(null);
            } catch (err) {
              console.error("Error canceling booking:", err);
              setError("אירעה שגיאה בביטול ההזמנה. נסה שוב מאוחר יותר.");
            }
          }}
        />
      )}

      {/* Enhanced End Parking Confirmation Modal */}
      {showEndParkingModal && endingParkingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl border border-blue-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCarSide className="text-blue-600 text-3xl" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">סיום חניה</h3>
            <p className="mb-6 text-gray-600 leading-relaxed">
              האם אתה בטוח שברצונך לסיים את החניה כעת?
              <br />
              זמן החניה שהוזמן יסתיים והחניה תסומן כמושלמת.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowEndParkingModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-xl transition-all duration-300"
              >
                ביטול
              </button>
              <button
                onClick={confirmEndParking}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                סיים חניה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Payment Summary Modal */}
      {showPaymentSummary && endingParkingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div
            className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl border border-blue-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaMoneyBillWave className="text-green-600 text-3xl" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              סיכום חניה
            </h3>

            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 mb-6 border border-gray-200">
              <div className="space-y-4 text-right">
                <div className="flex justify-between items-center">
                  <div className="text-gray-500 font-medium">כתובת:</div>
                  <div className="font-semibold">
                    {endingParkingBooking.spot?.address
                      ? `${endingParkingBooking.spot.address.street} ${endingParkingBooking.spot.address.number}, ${endingParkingBooking.spot.address.city}`
                      : "כתובת לא זמינה"}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-gray-500 font-medium">זמן התחלה:</div>
                  <div className="font-semibold">
                    {formatDateTime(endingParkingBooking.start_datetime)}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-gray-500 font-medium">זמן סיום:</div>
                  <div className="font-semibold">
                    {formatDateTime(new Date())}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-gray-500 font-medium">תעריף:</div>
                  <div className="font-semibold">
                    {endingParkingBooking.base_rate} ₪/שעה
                  </div>
                </div>

                <div className="border-t pt-4 flex justify-between items-center text-xl">
                  <div className="font-bold text-gray-800">סה"כ לתשלום:</div>
                  <div className="font-bold text-blue-700">
                    {calculateFinalAmount(endingParkingBooking)} ₪
                  </div>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-6 leading-relaxed">
              החניה הסתיימה בהצלחה. התשלום יחויב בהתאם לשעות החניה בפועל.
            </p>

            <button
              onClick={() => {
                setShowPaymentSummary(false);
                setEndingParkingBooking(null);
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              אישור
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveParkingReservations;
