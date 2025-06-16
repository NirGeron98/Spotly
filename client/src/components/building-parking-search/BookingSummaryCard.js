// components/building-parking-search/BookingSummaryCard.jsx
import React from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaParking,
  FaLayerGroup,
  FaUser,
  FaPhoneAlt,
} from "react-icons/fa";

const BookingSummaryCard = ({ spot, searchParams }) => {
  if (!spot || !searchParams) return null;

  return (
    <div className="text-right text-gray-800 space-y-4 text-sm leading-relaxed bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-center border-b pb-2">
        <span className="font-semibold text-blue-700 flex items-center gap-2">
          <FaCalendarAlt /> תאריך ההזמנה:
        </span>
        <span className="font-medium">{searchParams.date}</span>
      </div>
      <div className="flex justify-between items-center border-b pb-2">
        <span className="font-semibold text-blue-700 flex items-center gap-2">
          <FaClock /> שעת התחלה:
        </span>
        <span className="font-medium">{searchParams.startTime}</span>
      </div>
      <div className="flex justify-between items-center border-b pb-2">
        <span className="font-semibold text-blue-700 flex items-center gap-2">
          <FaClock /> שעת סיום:
        </span>
        <span className="font-medium">{searchParams.endTime}</span>
      </div>
      {spot.spot_number && (
        <div className="flex justify-between items-center border-b pb-2">
          <span className="font-semibold text-blue-700 flex items-center gap-2">
            <FaParking /> מספר חניה:
          </span>
          <span className="font-medium">{spot.spot_number}</span>
        </div>
      )}
      {spot.floor && (
        <div className="flex justify-between items-center border-b pb-2">
          <span className="font-semibold text-blue-700 flex items-center gap-2">
            <FaLayerGroup /> קומה:
          </span>
          <span className="font-medium">{spot.floor}</span>
        </div>
      )}
      {spot.owner?.first_name && (
        <div className="flex justify-between items-center border-b pb-2">
          <span className="font-semibold text-blue-700 flex items-center gap-2">
            <FaUser /> שם בעל החניה:
          </span>
          <span className="font-medium">
            {spot.owner.first_name} {spot.owner.last_name}
          </span>
        </div>
      )}
      {spot.owner?.phone_number && (
        <div className="flex justify-between items-center">
          <span className="font-semibold text-blue-700 flex items-center gap-2">
            <FaPhoneAlt /> מספר טלפון:
          </span>
          <span className="font-medium">{spot.owner.phone_number}</span>
        </div>
      )}
    </div>
  );
};

export default BookingSummaryCard;
