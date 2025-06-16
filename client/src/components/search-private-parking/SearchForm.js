import React from "react";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaBolt, FaCog, FaSearch } from "react-icons/fa";
import AddressMapSelector from "../shared/AddressMapSelector";

const SearchForm = ({
  searchParams,
  handleInputChange,
  address,
  setAddress,
  feedback,
  setFeedback,
  searching,
  setSearching,
  setShowPreferences,
  chargerTypes,
  searchParkingSpots,
}) => {
  return (
    <form onSubmit={searchParkingSpots} className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Location selector with embedded map */}
      <div className="md:col-span-4 mb-6">
        <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
          <FaMapMarkerAlt className="ml-2 text-blue-600" />
          מיקום
        </label>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <AddressMapSelector
            address={address}
            setAddress={setAddress}
            feedback={feedback}
            setFeedback={setFeedback}
            searching={searching}
            setSearching={setSearching}
            disableSearchButton={true}
            mode="search"
          />
        </div>
      </div>

      {/* Date input */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
          <FaCalendarAlt className="ml-2 text-blue-600" />
          תאריך
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

      {/* Start time selector */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
          <FaClock className="ml-2 text-green-600" />
          שעת התחלה
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
            return (
              <option key={i} value={timeString}>
                {timeString}
              </option>
            );
          })}
          <option value="23:59">23:59</option>
        </select>
      </div>

      {/* End time selector */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
          <FaClock className="ml-2 text-red-600" />
          שעת סיום
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
            return (
              <option key={i} value={timeString}>
                {timeString}
              </option>
            );
          })}
          <option value="23:59">23:59</option>
        </select>
      </div>

      {/* Maximum hourly price input */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
          <span className="text-green-600 text-lg font-bold ml-2">₪</span>
          מחיר מקסימלי לשעה
        </label>
        <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all duration-200">
          <input
            type="number"
            name="maxPrice"
            placeholder="ללא הגבלה"
            value={searchParams.maxPrice}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-0 outline-none bg-white"
            min="0"
          />
          <span className="px-4 bg-gradient-to-r from-green-50 to-blue-50 py-3 text-green-600 font-semibold">₪</span>
        </div>
      </div>

      {/* EV charging station filter */}
      <div className="md:col-span-4 bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 shadow-sm">
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
            הצג רק חניות עם עמדת טעינה
          </label>
        </div>

        {searchParams.is_charging_station && (
          <div className="mt-4">
            <label className="block text-sm font-semibold text-green-700 mb-2">
              סוג מטען
            </label>
            <select
              name="charger_type"
              value={searchParams.charger_type}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
            >
              <option value="">כל הסוגים</option>
              {chargerTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="md:col-span-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mt-6">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setShowPreferences(true)}
            className="group bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-6 py-3 rounded-xl hover:from-blue-100 hover:to-indigo-100 flex items-center justify-center gap-3 w-full sm:w-auto border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105"
          >
            <FaCog className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-medium">העדפות</span>
          </button>
        </div>

        <button
          type="submit"
          disabled={!address.city || !address.street || !address.number}
          className={`px-8 py-4 rounded-xl flex items-center justify-center gap-3 w-full md:w-auto font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${
            !address.city || !address.street || !address.number
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          }`}
        >
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
          <FaSearch className="text-xl" />
          <span>חפש חניה</span>
        </button>
      </div>
    </form>
  );
};

export default SearchForm;