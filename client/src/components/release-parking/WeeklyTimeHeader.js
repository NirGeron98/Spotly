import React from "react";

const WeeklyTimeHeader = ({ getWeekDates, getDayName, getDay, isDayInPast, formatDateForDisplay }) => {
  return (
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
  );
};

export default WeeklyTimeHeader;
