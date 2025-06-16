import React from "react";

const WeeklyToolbar = ({ goToPrevWeek, goToCurrentWeek, goToNextWeek }) => {
  return (
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
  );
};

export default WeeklyToolbar;
