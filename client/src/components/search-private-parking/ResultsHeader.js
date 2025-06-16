import React from "react";
import { FaCog, FaArrowUp, FaArrowDown } from "react-icons/fa";

const ResultsHeader = ({
  count,
  distancePreference,
  pricePreference,
  sortBy,
  sortOrder,
  handleSortChange,
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8 max-w-6xl mx-auto border border-blue-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="text-gray-700 flex items-center gap-4">
        <span className="font-bold text-xl text-blue-700">
          נמצאו {count} תוצאות
        </span>

        {/* Preferences badge */}
        {distancePreference !== 3 || pricePreference !== 3 ? (
          <div className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-4 py-2 rounded-full flex items-center border border-blue-200 shadow-sm">
            <FaCog className="ml-2" />
            <span>
              {distancePreference > 3
                ? "מרחק חשוב מאוד"
                : distancePreference < 3
                ? "מרחק פחות חשוב"
                : ""}
              {distancePreference !== 3 && pricePreference !== 3 ? " • " : ""}
              {pricePreference > 3
                ? "מחיר חשוב מאוד"
                : pricePreference < 3
                ? "מחיר פחות חשוב"
                : ""}
            </span>
          </div>
        ) : null}
      </div>

      {/* Sort by price button */}
      <div className="relative">
        <button
          onClick={() => handleSortChange("price")}
          className={`flex items-center px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
            sortBy === "price"
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
              : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`${
                sortBy === "price" ? "text-white" : "text-blue-500"
              } text-lg font-bold`}
            >
              ₪
            </span>
            <span>מיון לפי מחיר</span>
            {sortBy === "price" && (
              <div className="ml-2 flex items-center justify-center h-6 w-6 rounded-full bg-white bg-opacity-25">
                {sortOrder === "asc" ? (
                  <FaArrowUp className="text-white text-xs" />
                ) : (
                  <FaArrowDown className="text-white text-xs" />
                )}
              </div>
            )}
          </div>
        </button>

        {/* Sort description */}
        {sortBy === "price" && (
          <div className="absolute top-0 left-0 right-0 mt-16 text-center">
            <span className="inline-block bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs px-4 py-2 rounded-full shadow-lg border border-blue-200">
              {sortOrder === "asc" ? "מוצג מהזול ליקר" : "מוצג מהיקר לזול"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsHeader;