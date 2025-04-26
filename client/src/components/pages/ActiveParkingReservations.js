import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../shared/Navbar";
import Sidebar from "../shared/Sidebar";
import Footer from "../shared/Footer";
import { FaClock, FaCheck, FaCarSide, FaMoneyBillWave } from "react-icons/fa";

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

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role || "user";

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Calculate time remaining for all active bookings
  useEffect(() => {
    const timers = {};
    
    bookings.forEach(booking => {
      const endTime = new Date(booking.end_datetime);
      const diffMs = endTime - now;
      
      if (diffMs > 0) {
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        timers[booking._id] = {
          hours,
          minutes,
          percentage: 100 - (diffMs / (endTime - new Date(booking.start_datetime)) * 100),
          isActive: now >= new Date(booking.start_datetime) && now < endTime
        };
      } else {
        timers[booking._id] = {
          hours: 0,
          minutes: 0,
          percentage: 100,
          isActive: false
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
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // The API already filters out cancelled bookings, so we just need the active ones
      const activeBookings = response.data.data.bookings.filter(
        booking => booking.status === "active"
      );
      
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
      
      await axios.patch(
        `/api/v1/bookings/${selectedBooking._id}`,
        { status: "cancelled" },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Remove the cancelled booking from the local state immediately
      setBookings(bookings.filter(booking => booking._id !== selectedBooking._id));
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
          end_datetime: new Date().toISOString() // End time is now
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Show payment summary
      setShowEndParkingModal(false);
      setShowPaymentSummary(true);
      
      // After payment summary is closed, refresh the list
      setTimeout(() => {
        fetchActiveBookings();
      }, 500);
      
    } catch (err) {
      console.error("Error ending parking:", err);
      setError("אירעה שגיאה בסיום החניה. נסה שוב מאוחר יותר.");
      setShowEndParkingModal(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    
    // Format date
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    // Format time
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Calculate if a booking can be canceled (more than 1 hour before start time)
  const canBeCanceled = (startDatetime) => {
    const now = new Date();
    const bookingStart = new Date(startDatetime);
    const hourDifference = (bookingStart - now) / (1000 * 60 * 60);
    
    return hourDifference > 1;
  };

  // Calculate if a booking is currently active (between start and end times)
  const isBookingActive = (startDatetime, endDatetime) => {
    const now = new Date();
    const bookingStart = new Date(startDatetime);
    const bookingEnd = new Date(endDatetime);
    
    return now >= bookingStart && now < bookingEnd;
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50" dir="rtl">
      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} />

      <div className="flex flex-grow">
        <Sidebar current={current} setCurrent={setCurrent} role={role} />

        <main className="flex-grow p-4 md:p-6 md:mr-5 mt-12">
          <h1 className="pt-[68px] text-3xl font-extrabold text-blue-700 mb-4 text-center">
            הזמנות חנייה פעילות
          </h1>
          <p className="text-gray-600 text-lg mb-8 text-center">
            כאן תוכל לראות את ההזמנות הפעילות שלך
          </p>

          {cancelSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative text-center">
              <span className="block sm:inline">ההזמנה בוטלה בהצלחה!</span>
            </div>
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
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
              אין כרגע הזמנות פעילות להצגה.
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        מספר הזמנה
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        סוג הזמנה
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        כתובת החנייה
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        זמן התחלה
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        זמן סיום
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        תעריף
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        סטטוס תשלום
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        זמן נותר
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        פעולות
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((booking) => {
                      const timer = timeRemaining[booking._id] || { hours: 0, minutes: 0, percentage: 0, isActive: false };
                      return (
                        <tr key={booking._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking._id.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.booking_type === "parking" ? "חנייה" : "טעינה"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.spot && booking.spot.address ? 
                              `${booking.spot.address.city}, ${booking.spot.address.street} ${booking.spot.address.number}` : 
                              "כתובת לא זמינה"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateTime(booking.start_datetime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateTime(booking.end_datetime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.base_rate} ₪/שעה
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${booking.payment_status === "completed" ? "bg-green-100 text-green-800" : 
                                booking.payment_status === "pending" ? "bg-yellow-100 text-yellow-800" : 
                                "bg-red-100 text-red-800"}`}>
                              {booking.payment_status === "completed" ? "שולם" : 
                               booking.payment_status === "pending" ? "ממתין לתשלום" : 
                               booking.payment_status === "refunded" ? "הוחזר" : "נכשל"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {timer.isActive ? (
                              <div className="flex flex-col items-center">
                                <div className="relative w-14 h-14">
                                  <svg className="w-14 h-14" viewBox="0 0 36 36">
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
                                  {timer.hours}:{timer.minutes.toString().padStart(2, '0')}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 text-center">
                                {new Date(booking.start_datetime) > now ? "לא התחיל" : "הסתיים"}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                                  className="text-red-600 hover:text-red-900"
                                >
                                  בטל הזמנה
                                </button>
                              )}

                              {!canBeCanceled(booking.start_datetime) && !timer.isActive && (
                                <span className="text-gray-400">
                                  לא ניתן לביטול
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">אישור ביטול הזמנה</h3>
            <p className="mb-6 text-gray-600">
              האם אתה בטוח שברצונך לבטל את ההזמנה?
            </p>
            <div className="flex justify-center space-x-4 space-x-reverse">
              <button
                onClick={() => setShowCancelModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
              >
                חזור
              </button>
              <button
                onClick={handleCancelBooking}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
              >
                בטל הזמנה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Parking Confirmation Modal */}
      {showEndParkingModal && endingParkingBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center" onClick={e => e.stopPropagation()}>
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
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded"
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
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-xl" onClick={e => e.stopPropagation()}>
            <FaMoneyBillWave className="mx-auto text-green-600 text-4xl mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">סיכום חניה</h3>
            <div className="border-t border-b border-gray-200 py-4 my-4">
              <div className="grid grid-cols-2 gap-4 text-right mb-3">
                <div className="text-gray-500">כתובת:</div>
                <div className="font-medium">
                  {endingParkingBooking.spot?.address 
                    ? `${endingParkingBooking.spot.address.street} ${endingParkingBooking.spot.address.number}, ${endingParkingBooking.spot.address.city}`
                    : "כתובת לא זמינה"}
                </div>
                
                <div className="text-gray-500">זמן התחלה:</div>
                <div className="font-medium">{formatDateTime(endingParkingBooking.start_datetime)}</div>
                
                <div className="text-gray-500">זמן סיום:</div>
                <div className="font-medium">{formatDateTime(new Date())}</div>
                
                <div className="text-gray-500">תעריף:</div>
                <div className="font-medium">{endingParkingBooking.base_rate} ₪/שעה</div>
              </div>
              
              <div className="flex justify-between items-center text-lg font-bold border-t pt-4">
                <div>סה"כ לתשלום:</div>
                <div className="text-xl text-blue-700">{calculateFinalAmount(endingParkingBooking)} ₪</div>
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