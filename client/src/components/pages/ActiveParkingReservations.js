import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Navbar from "../shared/Navbar";
import Sidebar from "../shared/Sidebar";
import Footer from "../shared/Footer";
import {
  FaClock,
  FaCheck,
  FaCarSide,
  FaMoneyBillWave,
  FaTrash,
} from "react-icons/fa";
import { parseISO } from "date-fns";
import { format, toZonedTime } from "date-fns-tz";
import Popup from "../shared/Popup"; // Import the Popup component

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
        className="rounded-xl shadow-xl p-6 mx-auto max-w-4xl transform hover:scale-105 transition-transform duration-300"
        style={{
          background: "linear-gradient(to right, #3b82f6, #6366f1, #8b5cf6)",
          backgroundSize: "200% 200%",
          animation: "15s ease infinite",
          animationName: "gradientShift",
        }}
      >
        <style jsx>{`
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
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Left side: Booking info */}
          <div className="text-white mb-6 md:mb-0 md:w-1/2 text-center md:text-right">
            <h3 className="text-xl font-bold mb-2">חנייה פעילה כעת</h3>
            <p className="mb-1 text-blue-100">
              <span className="font-semibold">כתובת:</span>{" "}
              {activeBooking.spot && activeBooking.spot.address
                ? `${activeBooking.spot.address.city}, ${activeBooking.spot.address.street} ${activeBooking.spot.address.number}`
                : "כתובת לא זמינה"}
            </p>
            <p className="mb-1 text-blue-100">
              <span className="font-semibold">תעריף:</span>{" "}
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
            <p className="mb-1 text-blue-100">
              <span className="font-semibold">מיקום חנייה:</span>{" "}
              {activeBooking.spot?.spot_number
                ? `חנייה מספר ${activeBooking.spot.spot_number}`
                : "חנייה פרטית"}
            </p>
          </div>

          {/* Center: Large Timer */}
          <div className="relative md:w-1/3 flex flex-col items-center">
            {/* Pulsing ring effect */}
            <div
              className="absolute w-48 h-48 rounded-full bg-blue-400 opacity-30 mx-auto"
              style={{
                animation: "3s infinite",
                animationName: "pulseRing",
              }}
            ></div>

            {/* Second pulse ring with delay */}
            <div
              className="absolute w-52 h-52 rounded-full bg-indigo-400 opacity-20 mx-auto"
              style={{
                animation: "3s infinite",
                animationName: "pulseRing",
                animationDelay: "1.5s",
              }}
            ></div>

            <div className="relative w-44 h-44 mx-auto">
              {/* Rotating outer ring */}
              <div
                className="absolute inset-0 w-full h-full border-4 border-white opacity-10 rounded-full"
                style={{
                  animation: "10s linear infinite",
                  animationName: "rotate",
                }}
              ></div>

              {/* Base circle */}
              <svg className="w-44 h-44" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${percentage}, 100`}
                  className="drop-shadow-lg"
                />
              </svg>

              {/* Central time display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <FaClock className="text-white mb-2 text-xl" />
                <div className="text-4xl font-bold text-white drop-shadow-md">
                  {hours}:{minutes.toString().padStart(2, "0")}
                </div>
                <div className="text-xs text-blue-100 mt-1">זמן נותר</div>
              </div>
            </div>

            {/* Animation elements */}
            <div className="absolute w-full h-full pointer-events-none">
              <div className="absolute w-2 h-2 bg-blue-300 rounded-full top-10 left-10 animate-ping"></div>
              <div
                className="absolute w-3 h-3 bg-purple-300 rounded-full bottom-10 right-20 animate-ping"
                style={{ animationDelay: "0.5s" }}
              ></div>
              <div
                className="absolute w-2 h-2 bg-indigo-300 rounded-full bottom-20 left-20 animate-ping"
                style={{ animationDelay: "0.8s" }}
              ></div>
            </div>
          </div>

          {/* Right side: Action button */}
          <div className="md:w-1/6 flex justify-center">
            <button
              onClick={() => handleEndParking(activeBooking)}
              className="group relative overflow-hidden px-6 py-3 rounded-full bg-white text-indigo-600 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                סיים חניה
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-x-0 group-hover:scale-x-100 origin-left"></span>
              <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 animate-pulse"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActiveParkingReservations = ({ loggedIn, setLoggedIn }) => {
  document.title = "הזמנות חנייה פעילות | Spotly";

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

      const response = await axios.get("/api/v1/bookings/user/my-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Debug the response data
      console.log("Bookings response:", response.data.data.bookings);

      // Filter bookings to include only those that are upcoming or in progress
      const activeBookings = response.data.data.bookings
        .filter((booking) => {
          const now = new Date();
          const startTime = new Date(booking.start_datetime);
          const endTime = new Date(booking.end_datetime);

          return (
            booking.status === "active" &&
            (now < endTime || (now >= startTime && now < endTime))
          );
        })
        .map((booking) => {
          console.log(`Booking ${booking._id} rate details:`, {
            base_rate: booking.base_rate,
            spot_hourly_price: booking.spot?.hourly_price,
            payment_status: booking.payment_status,
          });
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

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    try {
      const token = localStorage.getItem("token");

      // Changed from DELETE with body to PATCH with body
      await axios.patch(
        `/api/v1/bookings/${selectedBooking._id}`,
        { status: "canceled" }, // Changed from "cancelled" to "canceled" to match the enum in your model
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove the cancelled booking from the local state immediately
      setBookings(
        bookings.filter((booking) => booking._id !== selectedBooking._id)
      );
      setCancelSuccess(true);

      // Refresh bookings after cancellation to ensure everything is up to date
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
  };

  const handleEndParking = (booking) => {
    setEndingParkingBooking(booking);
    setShowEndParkingModal(true);
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
    const pageNumbers = [];
    const maxButtons = 5; // Maximum number of page buttons to show

    if (totalPages <= maxButtons) {
      // Show all pages if less than maxButtons
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show limited page numbers with ellipsis
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case "active":
        return { text: "פעיל", class: "bg-green-100 text-green-800" };
      case "completed":
        return { text: "הושלם", class: "bg-blue-100 text-blue-800" };
      case "cancelled":
        return { text: "בוטל", class: "bg-red-100 text-red-800" };
      default:
        return { text: status, class: "bg-gray-100 text-gray-800" };
    }
  };

  const getPaymentStatusDisplay = (status) => {
    switch (status) {
      case "completed":
        return { text: "שולם", class: "bg-green-100 text-green-800" };
      case "pending":
        return { text: "ממתין לתשלום", class: "bg-yellow-100 text-yellow-800" };
      case "refunded":
        return { text: "הוחזר", class: "bg-blue-100 text-blue-800" };
      default:
        return { text: status, class: "bg-gray-100 text-gray-800" };
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

        <main className="flex-grow flex flex-col justify-start p-4 md:p-6 md:mr-5 mt-4 min-h-[75vh]">
          <h1 className="pt-[68px] text-3xl font-extrabold text-blue-700 mb-4 text-center">
            הזמנות חנייה פעילות
          </h1>
          <p className="text-gray-600 text-lg mb-8 text-center">
            כאן תוכל לראות את ההזמנות הפעילות שלך
          </p>

          {cancelSuccess && (
            <Popup
              title="הצלחה"
              description="ההזמנה בוטלה בהצלחה!"
              type="success"
              onClose={() => setCancelSuccess(false)}
            />
          )}

          {/* Add the ActiveParkingTimer component here */}
          {activeTimerBooking && timeRemaining[activeTimerBooking._id] && (
            <ActiveParkingTimer
              activeBooking={activeTimerBooking}
              timeRemaining={timeRemaining[activeTimerBooking._id]}
              handleEndParking={handleEndParking}
            />
          )}

          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
              <p className="text-gray-600 mt-4">טוען הזמנות...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-red-500">
              <p>{error}</p>
              <button
                onClick={fetchActiveBookings}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                נסה שוב
              </button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500 max-w-4xl mx-auto">
              אין כרגע הזמנות פעילות להצגה.
            </div>
          ) : (
            <div
              className="overflow-x-auto bg-white rounded-lg shadow-md w-full max-w-[90rem] mx-auto flex flex-col"
              style={{ minHeight: "500px" }}
            >
              {/* Table container */}
              <div className="w-full text-base text-right">
                {/* Header row */}
                <div className="flex bg-indigo-50 text-indigo-800 border-b">
                  <div className="px-3 py-3 w-[10%] font-semibold text-center">
                    סוג הזמנה
                  </div>
                  <div className="px-3 py-3 w-[25%] font-semibold text-center">
                    כתובת החניה
                  </div>
                  <div className="px-3 py-3 w-[15%] font-semibold text-center">
                    זמן התחלה
                  </div>
                  <div className="px-3 py-3 w-[15%] font-semibold text-center">
                    זמן סיום
                  </div>
                  <div className="px-3 py-3 w-[10%] font-semibold text-center">
                    תעריף
                  </div>
                  <div className="px-3 py-3 w-[10%] font-semibold text-center">
                    סטטוס תשלום
                  </div>
                  <div className="px-3 py-3 w-[10%] font-semibold text-center">
                    זמן נותר
                  </div>
                  <div className="px-3 py-3 w-[10%] font-semibold text-center">
                    פעולות
                  </div>
                </div>

                {/* Table body */}
                <div className="divide-y">
                  {currentBookings.map((booking) => {
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
                        className="flex hover:bg-indigo-50 transition-colors duration-150"
                      >
                        <div className="px-3 py-3 w-[10%] text-center">
                          {booking.booking_type === "parking"
                            ? "חנייה"
                            : "טעינה"}
                        </div>
                        <div className="px-3 py-3 w-[25%] text-center">
                          {booking.spot && booking.spot.address
                            ? `${booking.spot.address.city}, ${booking.spot.address.street} ${booking.spot.address.number}`
                            : "כתובת לא זמינה"}
                        </div>
                        <div className="px-3 py-3 w-[15%] text-center">
                          {formatDisplayDate(booking.start_datetime)}
                          <div className="text-xs text-gray-500">
                            {formatDisplayTime(booking.start_datetime)}
                          </div>
                        </div>
                        <div className="px-3 py-3 w-[15%] text-center">
                          {formatDisplayDate(booking.end_datetime)}
                          <div className="text-xs text-gray-500">
                            {formatDisplayTime(booking.end_datetime)}
                          </div>
                        </div>
                        <div className="px-3 py-3 w-[10%] text-center">
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
                        <div className="px-3 py-3 w-[10%] text-center">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${paymentStatus.class}`}
                          >
                            {paymentStatus.text}
                          </span>
                        </div>
                        <div className="px-3 py-3 w-[10%] text-center">
                          {timer.isActive ? (
                            <div className="flex flex-col items-center">
                              <div className="relative w-12 h-12 mx-auto">
                                <svg className="w-12 h-12" viewBox="0 0 36 36">
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
                                    strokeDasharray={`${timer.percentage}, 100`}
                                  />
                                </svg>
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm font-medium">
                                  <FaClock className="mx-auto text-blue-600" />
                                </div>
                              </div>
                              <div className="text-sm font-medium mt-1">
                                {timer.hours}:
                                {timer.minutes.toString().padStart(2, "0")}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">
                              {new Date(booking.start_datetime) > now
                                ? "לא התחיל"
                                : "הסתיים"}
                            </div>
                          )}
                        </div>
                        <div className="px-3 py-3 w-[10%] flex justify-center">
                          <div className="flex flex-col space-y-2">
                            {timer.isActive && (
                              <button
                                onClick={() => handleEndParking(booking)}
                                className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs flex items-center justify-center"
                              >
                                <FaCheck className="ml-1" /> סיים חניה
                              </button>
                            )}

                            {canBeCanceled(booking.start_datetime) && (
                              <button
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setShowCancelModal(true);
                                }}
                                className="flex items-center justify-center bg-red-600 text-white px-3 py-1.5 rounded text-xs hover:bg-red-700 transition-all duration-300"
                              >
                                ביטול
                              </button>
                            )}

                            {!canBeCanceled(booking.start_datetime) &&
                              !timer.isActive && (
                                <span className="text-gray-400">
                                  לא ניתן לביטול
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pagination */}
              {bookings.length > 0 && (
                <div className="flex justify-between items-center px-6 py-4 border-t bg-white mt-auto">
                  <div className="text-sm text-gray-600">
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
                      className={`px-3 py-1 rounded-full transition ${
                        currentPage === 1
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      הקודם
                    </button>

                    {getPageNumbers().map((pageNumber, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          typeof pageNumber === "number" &&
                          handlePageChange(pageNumber)
                        }
                        disabled={pageNumber === "..."}
                        className={`px-4 py-1.5 rounded-full font-medium transition ${
                          pageNumber === currentPage
                            ? "bg-blue-700 text-white"
                            : pageNumber === "..."
                            ? "bg-transparent text-gray-400 cursor-default"
                            : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-full transition ${
                        currentPage === totalPages
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      הבא
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <Footer />

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <Popup
          title="אישור ביטול הזמנה"
          description="האם אתה בטוח שברצונך לבטל את ההזמנה?"
          type="error"
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleCancelBooking}
        />
      )}

      {/* End Parking Confirmation Modal */}
      {showEndParkingModal && endingParkingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div
            className="bg-white rounded-lg p-6 max-w-md mx-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <FaCarSide className="mx-auto text-blue-600 text-4xl mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-4">סיום חניה</h3>
            <p className="mb-6 text-gray-600">
              האם אתה בטוח שברצונך לסיים את החניה כעת?
              <br />
              זמן החניה שהוזמן יסתיים והחניה תסומן כמושלמת.
            </p>
            <div className="flex justify-center space-x-4 space-x-reverse">
              <button
                onClick={() => setShowEndParkingModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded text-lg"
              >
                ביטול
              </button>
              <button
                onClick={confirmEndParking}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
              >
                סיים חניה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Summary Modal */}
      {showPaymentSummary && endingParkingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div
            className="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <FaMoneyBillWave className="mx-auto text-green-600 text-4xl mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              סיכום חניה
            </h3>
            <div className="border-t border-b border-gray-200 py-4 my-4">
              <div className="grid grid-cols-2 gap-4 text-right mb-3">
                <div className="text-gray-500">כתובת:</div>
                <div className="font-medium">
                  {endingParkingBooking.spot?.address
                    ? `${endingParkingBooking.spot.address.street} ${endingParkingBooking.spot.address.number}, ${endingParkingBooking.spot.address.city}`
                    : "כתובת לא זמינה"}
                </div>

                <div className="text-gray-500">זמן התחלה:</div>
                <div className="font-medium">
                  {formatDateTime(endingParkingBooking.start_datetime)}
                </div>

                <div className="text-gray-500">זמן סיום:</div>
                <div className="font-medium">{formatDateTime(new Date())}</div>

                <div className="text-gray-500">תעריף:</div>
                <div className="font-medium">
                  {endingParkingBooking.base_rate} ₪/שעה
                </div>
              </div>

              <div className="flex justify-between items-center text-lg font-bold border-t pt-4">
                <div>סה"כ לתשלום:</div>
                <div className="text-xl text-blue-700">
                  {calculateFinalAmount(endingParkingBooking)} ₪
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              החניה הסתיימה בהצלחה. התשלום יחויב בהתאם לשעות החניה בפועל.
            </p>

            <button
              onClick={() => {
                setShowPaymentSummary(false);
                setEndingParkingBooking(null);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-8 rounded-full"
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
