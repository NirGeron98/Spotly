import React from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaEye,
} from "react-icons/fa";

const UsageDesktopTable = ({
  items,
  getStatusDisplay,
  getActivityIcon,
  getActivityTypeDisplay,
  formatDisplayDate,
  formatDisplayTime,
  getBookingDetails,
}) => {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <th className="px-6 py-4 text-right font-semibold">תאריך ביצוע</th>
            <th className="px-6 py-4 text-right font-semibold">שעת ביצוע</th>
            <th className="px-6 py-4 text-right font-semibold">פרטים נוספים</th>
            <th className="px-6 py-4 text-right font-semibold">סוג פעילות</th>
            <th className="px-6 py-4 text-right font-semibold">סטטוס</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item, index) => {
            const status = getStatusDisplay(item.status);
            const actionDateTime = item.rawActionDate || item.actionDate;

            return (
              <tr
                key={index}
                className="hover:bg-blue-50 transition-all duration-200 group"
              >
                <td className="px-6 py-4 text-gray-900 font-medium">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-blue-600 text-sm" />
                    {formatDisplayDate(actionDateTime)}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700">
                  <div className="flex items-center gap-2">
                    <FaClock className="text-green-600 text-sm" />
                    {formatDisplayTime(actionDateTime)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {item.activityType !== "publication" ? (
                    <div className="text-sm leading-relaxed space-y-1">
                      {(item.activityType === "booking" ||
                        item.activityType === "availability") && (
                        <>
                          <div className="flex items-center gap-2 text-gray-700">
                            <FaCalendarAlt className="text-blue-500 text-xs" />
                            <span>תאריך: {item.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-700">
                            <FaClock className="text-green-500 text-xs" />
                            <span>
                              שעות: {item.startTime}
                              {item.endTime !== "-" && ` - ${item.endTime}`}
                            </span>
                          </div>
                        </>
                      )}
                      {item.activityType === "booking" && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <FaMapMarkerAlt className="text-red-500 text-xs" />
                          <span className="truncate max-w-xs">
                            כתובת: {item.address}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      פרטים נוספים לא זמינים
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      {getActivityIcon(item.icon)}
                    </div>
                    <span className="font-medium text-gray-800">
                      {getActivityTypeDisplay(item.activityType)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {item.status === "booked" ? (
                    <button
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 transform hover:scale-105 ${status.class}`}
                      onClick={() => getBookingDetails(item)}
                    >
                      <span>{status.icon}</span>
                      <span>{status.text}</span>
                      <FaEye className="text-xs" />
                    </button>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${status.class}`}
                    >
                      <span>{status.icon}</span>
                      <span>{status.text}</span>
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UsageDesktopTable;
