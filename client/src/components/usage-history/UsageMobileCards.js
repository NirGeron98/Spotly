import React from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaEye,
} from "react-icons/fa";

const UsageMobileCards = ({
  items,
  getActivityIcon,
  getActivityTypeDisplay,
  getStatusDisplay,
  getBookingDetails,
  formatDisplayDate,
  formatDisplayTime,
}) => {
  return (
    <div className="lg:hidden space-y-4 p-4">
      {items.map((item, index) => {
        const status = getStatusDisplay(item.status);
        const actionDateTime = item.rawActionDate || item.actionDate;

        return (
          <div
            key={index}
            className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-4 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                  {getActivityIcon(item.icon)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm">
                    {getActivityTypeDisplay(item.activityType)}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {formatDisplayDate(actionDateTime)} • {formatDisplayTime(actionDateTime)}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              {item.status === "booked" ? (
                <button
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-200 ${status.class}`}
                  onClick={() => getBookingDetails(item)}
                >
                  <span>{status.icon}</span>
                  <span>{status.text}</span>
                  <FaEye className="text-xs" />
                </button>
              ) : (
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${status.class}`}
                >
                  <span>{status.icon}</span>
                  <span>{status.text}</span>
                </span>
              )}
            </div>

            {/* Card Content */}
            {item.activityType !== "publication" && (
              <div className="space-y-2">
                {(item.activityType === "booking" ||
                  item.activityType === "availability") && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <FaCalendarAlt className="text-blue-500 text-xs flex-shrink-0" />
                      <span>תאריך: {item.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <FaClock className="text-green-500 text-xs flex-shrink-0" />
                      <span>
                        שעות: {item.startTime}
                        {item.endTime !== "-" && ` - ${item.endTime}`}
                      </span>
                    </div>
                  </>
                )}
                {item.activityType === "booking" && (
                  <div className="flex items-start gap-2 text-sm text-gray-700">
                    <FaMapMarkerAlt className="text-red-500 text-xs flex-shrink-0 mt-0.5" />
                    <span className="break-words">כתובת: {item.address}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default UsageMobileCards;
