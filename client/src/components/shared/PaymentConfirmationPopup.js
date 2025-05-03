import React, { useState, useEffect } from "react";
import api from "../../services/api";
import Popup from "./Popup";
import { FaCheckCircle } from "react-icons/fa";

const PaymentConfirmationPopup = () => {
  const [unpaidBookings, setUnpaidBookings] = useState([]);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [currentBookingIndex, setCurrentBookingIndex] = useState(0);

  // Check for unpaid bookings on mount and set up polling
  useEffect(() => {
    const checkUnpaidBookings = async () => {
      try {
        const token = localStorage.getItem("token");
        const user = localStorage.getItem("user");
        
        if (!token || !user) {
          setLoading(false);
          return;
        }

        const response = await api.get("/bookings/user/unpaid-completed", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.data.bookings.length > 0) {
          setUnpaidBookings(response.data.data.bookings);
          setShowPaymentPopup(true);
          setCurrentBookingIndex(0);
        } else {
          setShowPaymentPopup(false);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error checking unpaid bookings:", error);
        setLoading(false);
      }
    };

    // Initial check
    checkUnpaidBookings();
    
    // Poll every 30 seconds for new unpaid bookings
    const interval = setInterval(checkUnpaidBookings, 30000);
    
    // Listen for custom event when parking ends
    const handleParkingEnded = (event) => {
      checkUnpaidBookings();
    };
    
    window.addEventListener('parkingEnded', handleParkingEnded);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('parkingEnded', handleParkingEnded);
    };
  }, []);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const calculateParkingDuration = (start, end) => {
    const diffMs = new Date(end) - new Date(start);
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
  };

  const handleConfirmPayment = async () => {
    const currentBooking = unpaidBookings[currentBookingIndex];
    if (!currentBooking) return;

    try {
      setProcessingPayment(true);
      const token = localStorage.getItem("token");

      // Call API to confirm payment
      await api.post(
        `/bookings/${currentBooking._id}/confirm-payment`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove the current booking from unpaid list
      const remainingBookings = unpaidBookings.filter(
        (_, index) => index !== currentBookingIndex
      );
      
      setUnpaidBookings(remainingBookings);
      
      if (remainingBookings.length > 0) {
        // Move to next unpaid booking
        setCurrentBookingIndex(0);
      } else {
        // All bookings paid
        setShowPaymentPopup(false);
      }
    } catch (error) {
      console.error("Payment confirmation failed:", error);
      alert("אירעה שגיאה באישור התשלום. נסה שוב.");
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading || !showPaymentPopup || unpaidBookings.length === 0) return null;

  const currentBooking = unpaidBookings[currentBookingIndex];
  const duration = calculateParkingDuration(
    currentBooking.start_datetime,
    currentBooking.end_datetime
  );

  // Format the popup description with booking details
  const renderDescription = () => {
    return (
      <div dir="rtl" className="text-right">
        <div className="mb-4">
          <p className="text-lg font-semibold mb-2">החניה הסתיימה</p>
          <p className="text-gray-600">אנא אשר את פרטי התשלום להמשך השימוש במערכת.</p>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h3 className="font-bold text-lg mb-3 text-blue-800">פרטי החניה:</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">כתובת:</span>
              <span className="font-medium">
                {currentBooking.spot?.address
                  ? `${currentBooking.spot.address.street} ${currentBooking.spot.address.number}, ${currentBooking.spot.address.city}`
                  : "כתובת לא זמינה"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">זמן התחלה:</span>
              <span className="font-medium">
                {formatDateTime(currentBooking.start_datetime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">זמן סיום:</span>
              <span className="font-medium">
                {formatDateTime(currentBooking.end_datetime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">משך זמן:</span>
              <span className="font-medium">
                {duration.hours} שעות ו-{duration.minutes} דקות
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">תעריף לשעה:</span>
              <span className="font-medium">
                {currentBooking.base_rate} ₪
              </span>
            </div>
            <div className="flex justify-between pt-3 mt-3 border-t border-blue-200">
              <span className="font-bold text-lg">סה"כ לתשלום:</span>
              <span className="font-bold text-xl text-blue-700">
                {currentBooking.total_amount} ₪
              </span>
            </div>
          </div>
        </div>

        {unpaidBookings.length > 1 && (
          <div className="mb-4 text-sm text-orange-600 bg-orange-50 p-2 rounded">
            שים לב: יש לך {unpaidBookings.length} חניות לא משולמות. 
            זהו תשלום {currentBookingIndex + 1} מתוך {unpaidBookings.length}.
          </div>
        )}

        <div className="text-sm text-gray-600 mb-4 text-center">
          התשלום יבוצע באמצעות אמצעי התשלום השמור במערכת
        </div>

        <button
          onClick={handleConfirmPayment}
          disabled={processingPayment}
          className={`w-full flex items-center justify-center py-3 px-4 rounded-lg text-white font-medium ${
            processingPayment
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {processingPayment ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white ml-2"></div>
              מאשר תשלום...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <FaCheckCircle className="ml-2" />
              אשר תשלום
            </div>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          * לא ניתן להמשיך להשתמש במערכת ללא אישור התשלום
        </p>
      </div>
    );
  };

  return (
    <Popup
      title="סיכום חניה ותשלום"
      description={renderDescription()}
      onClose={() => {}} // Empty function to prevent closing
      type="info"
      wide={false}
    />
  );
};

export default PaymentConfirmationPopup;