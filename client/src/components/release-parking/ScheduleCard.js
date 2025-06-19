import React from "react";
import { FaTrash, FaUser } from "react-icons/fa";

const ScheduleCard = ({
  schedule,
  isExpanded,
  onExpand,
  getTimePosition,
  getTimeSlotHeight,
  onDeleteClick,
  onBookingDetailsClick
}) => {
  const top = getTimePosition(schedule.display_start_time);
  const height = getTimeSlotHeight(schedule.display_start_time, schedule.display_end_time);
  const isBooked = !schedule.is_available;

  const bgColor = isBooked
    ? "bg-red-100 border border-red-300 text-red-800"
    : schedule.type === "טעינה לרכב חשמלי"
    ? "bg-green-100 border border-green-300 text-green-800"
    : "bg-blue-100 border border-blue-300 text-blue-800";

  return (
    <div
      onClick={onExpand}
      className={`absolute right-0 w-[calc(100%-8px)] mx-1 rounded-md p-2 cursor-pointer transition-all duration-200 overflow-hidden text-right ${bgColor} ${
        isExpanded ? "shadow-lg z-20" : "z-10"
      }`}
      style={{
        top: `${top}px`,
        height: isExpanded ? "auto" : Math.max(height, 30),
        minHeight: "30px"
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-2 flex-shrink-0">
          {!isBooked && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick({
                  spotId: schedule.slot._id,
                  scheduleId: schedule._id
                });
              }}
              className="text-red-500 hover:text-red-700 text-sm"
              title="מחק פינוי"
            >
              <FaTrash />
            </button>
          )}
          {isBooked && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBookingDetailsClick(schedule.slot._id, schedule._id);
              }}
              className="text-blue-500 hover:text-blue-700 text-sm"
              title="פרטי המזמין"
            >
              <FaUser />
            </button>
          )}
        </div>
        <div className={`font-semibold ${isExpanded ? "text-base" : "text-xs"}`}>
          {schedule.display_start_time} - {schedule.display_end_time}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2 text-sm space-y-1">
          <div>סטטוס: {isBooked ? "הוזמן" : "זמין להזמנה"}</div>
          <div>
            חנייה:{" "}
            {schedule.slot?.spot_number
              ? `מספר ${schedule.slot.spot_number}`
              : schedule.slot?.address?.street || "פרטית"}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleCard;