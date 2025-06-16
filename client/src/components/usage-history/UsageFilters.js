import React from "react";
import {
  FaSearch,
  FaSync,
  FaFilter,
} from "react-icons/fa";

const UsageFilters = ({
  filters,
  handleFilterChange,
  resetFilters,
  setFilters
}) => {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 px-4 py-3 mb-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-center mb-6 gap-3">
        <FaFilter className="text-blue-600 text-xl" />
        <h2 className="text-xl font-bold text-gray-800">סינון וחיפוש</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Search Input */}
        <div className="lg:col-span-5">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            מונח חיפוש:
          </label>
          <div className="relative">
            <input
              type="text"
              name="searchTerm"
              placeholder="הקלד כאן לחיפוש..."
              value={filters.searchTerm}
              onChange={handleFilterChange}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Activity Type Filter */}
        <div className="lg:col-span-3">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            סוג פעילות:
          </label>
          <select
            name="activityType"
            value={filters.activityType}
            onChange={handleFilterChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200"
          >
            <option value="all">הכל</option>
            <option value="booking">הזמנת חניה</option>
            <option value="rental">השכרת חניה</option>
            <option value="publication">התחלת פעילות</option>
            <option value="availability">שינוי/הוספת זמינות</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            סטטוס:
          </label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all duration-200"
          >
            <option value="all">הכל</option>
            <option value="active">פעיל</option>
            <option value="completed">הושלם</option>
            <option value="cancelled">בוטל</option>
            <option value="available">זמין</option>
            <option value="booked">מוזמן</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="lg:col-span-2 flex flex-col justify-end">
          <div className="flex flex-col gap-3">
            <button
              onClick={() =>
                setFilters((prev) => ({ ...prev, triggerSearch: true }))
              }
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <FaSearch className="w-4 h-4" />
              חפש
            </button>

            <button
              onClick={resetFilters}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 border border-gray-300 hover:border-gray-400"
            >
              <FaSync className="w-4 h-4" />
              איפוס
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageFilters;
