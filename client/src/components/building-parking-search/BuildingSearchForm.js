import React from "react";
import { FaSearch, FaCalendarAlt, FaClock, FaBolt } from "react-icons/fa";

const BuildingSearchForm = ({
  searchParams,
  handleInputChange,
  chargerTypes,
  searchParkingSpots,
}) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-12 max-w-5xl mx-auto border border-blue-100">
    <div className="flex items-center justify-center mb-8">
      <FaSearch className="text-blue-600 text-2xl ml-6" />
      <h2 className="text-2xl font-bold text-gray-800">פרטי החיפוש</h2>
    </div>
    <form onSubmit={searchParkingSpots} className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-2">
        <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
          <FaCalendarAlt className="ml-2 text-blue-600" /> תאריך
        </label>
        <input
          type="date"
          name="date"
          value={searchParams.date}
          onChange={handleInputChange}
          min={new Date().toISOString().split("T")[0]}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
        />
      </div>
      <div className="space-y-2">
        <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
          <FaClock className="ml-2 text-green-600" /> שעת התחלה
        </label>
        <select
          name="startTime"
          value={searchParams.startTime}
          onChange={handleInputChange}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
        >
          {Array.from({ length: 72 }).map((_, i) => {
            const hours = Math.floor(i / 4) + 6;
            const minutes = (i % 4) * 15;
            const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
            return <option key={i} value={timeString}>{timeString}</option>;
          })}
          <option value="23:59">23:59</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
          <FaClock className="ml-2 text-red-600" /> שעת סיום
        </label>
        <select
          name="endTime"
          value={searchParams.endTime}
          onChange={handleInputChange}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
        >
          {Array.from({ length: 72 }).map((_, i) => {
            const hours = Math.floor(i / 4) + 6;
            const minutes = (i % 4) * 15;
            const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
            return <option key={i} value={timeString}>{timeString}</option>;
          })}
          <option value="23:59">23:59</option>
        </select>
      </div>
      <div className="md:col-span-3 bg-green-50 p-6 rounded-xl border border-green-200">
        <div className="flex items-center mb-4">
          <FaBolt className="text-green-600 text-xl ml-3" />
          <h3 className="font-bold text-green-800 text-lg">עמדת טעינה לרכב חשמלי</h3>
        </div>
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="is_charging_station"
            name="is_charging_station"
            checked={searchParams.is_charging_station}
            onChange={handleInputChange}
            className="ml-3 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <label htmlFor="is_charging_station" className="text-sm font-medium text-green-700">
            חפש חניות עם עמדת טעינה
          </label>
        </div>
        {searchParams.is_charging_station && (
          <div className="mt-4">
            <label className="block text-sm font-semibold text-green-700 mb-2">סוג מטען</label>
            <select
              name="charger_type"
              value={searchParams.charger_type}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
            >
              <option value="">כל סוגי המטענים</option>
              {chargerTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="md:col-span-3 flex justify-center mt-6">
        <button
          type="submit"
          className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
        >
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <FaSearch className="text-xl" />
          <span>חפש חניה בבניין</span>
        </button>
      </div>
    </form>
  </div>
);

export default BuildingSearchForm;