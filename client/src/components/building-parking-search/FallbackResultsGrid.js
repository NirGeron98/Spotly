import React from "react";
import { FaClock, FaMapMarkerAlt, FaParking } from "react-icons/fa";

const FallbackResultsGrid = ({ fallbackResults, searchParams, setPopupData, handleConfirmReservation, generateBookingSummary, setFoundSpot, calculateHours }) => {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          נמצאו {fallbackResults.length} חניות פרטיות זמינות
        </h2>
        <p className="text-gray-600">בחר את החנייה המתאימה לך</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fallbackResults.map((spot, index) => (
          <div
            key={spot._id}
            className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
          >
            <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <FaParking className="text-white text-6xl z-10 group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                <FaClock className="inline ml-1" />
                {calculateHours()} שעות
              </div>
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-xs font-bold">
                מספר {index + 1}
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                    {spot.address?.street} {spot.address?.number}
                  </h3>
                  <p className="text-gray-600 text-sm mb-1 flex items-center">
                    <FaMapMarkerAlt className="ml-2 text-gray-400" />
                    {spot.address?.city}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <FaClock className="ml-1" />
                    זמן חנייה
                  </span>
                  <span className="font-semibold text-gray-800">
                    {searchParams.startTime} - {searchParams.endTime}
                  </span>
                </div>
              </div>
              {spot.distance_km && (
                <div className="mb-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <FaMapMarkerAlt className="ml-1" />
                    מרחק: {spot.distance_km.toFixed(1)} ק"מ
                  </span>
                </div>
              )}
              <button
                onClick={() => {
                  setFoundSpot(spot);
                  setPopupData({
                    title: "אישור הזמנה",
                    type: "confirm",
                    description: generateBookingSummary(spot, searchParams),
                    onConfirm: () => handleConfirmReservation(spot),
                  });
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl flex justify-center items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <FaParking className="text-lg" />
                <span>הזמן חניה זו</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FallbackResultsGrid;
