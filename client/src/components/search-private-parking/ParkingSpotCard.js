import React from "react";
import {
  FaClock,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaBolt,
  FaParking,
  FaCarSide,
} from "react-icons/fa";

const ParkingSpotCard = ({
  spot,
  searchParams,
  calculateHours,
  handleBookParking,
  formatAddress,
}) => {
  const hours = calculateHours();
  // Check if this is a building spot (usually free for residents)
  const isBuildingSpot = spot.spot_type === 'building' || spot.hourly_price === 0;

  return (
    <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
      {/* Image / Icon */}
      <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 relative overflow-hidden">
        {spot.photos?.length > 0 ? (
          <img
            src={spot.photos[0]}
            alt={`חניה ב-${spot.address?.city || ""}`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            {spot.is_charging_station ? (
              <FaBolt className="text-white text-6xl z-10 group-hover:scale-110 transition-transform duration-300" />
            ) : (
              <FaParking className="text-white text-6xl z-10 group-hover:scale-110 transition-transform duration-300" />
            )}
          </div>
        )}

        {/* Price and charging station labels - only show for paid spots */}
        {!isBuildingSpot && spot.hourly_price > 0 && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg backdrop-blur-sm">
            ₪{spot.hourly_price}/שעה
          </div>
        )}

        {!isBuildingSpot && spot.hourly_price > 0 && (
          <div className="absolute bottom-4 left-4 bg-gray-900/80 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm shadow-lg">
            <div className="flex items-center gap-2">
              <FaClock className="text-white" />
              <span>
                סה״כ: ₪{(spot.hourly_price * hours).toFixed(0)} ל-{hours} שעות
              </span>
            </div>
          </div>
        )}

        {/* Show "Free for residents" label for building spots */}
        {isBuildingSpot && (
          <div className="absolute bottom-4 left-4 bg-green-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm shadow-lg">
            <div className="flex items-center gap-2">
              <FaParking className="text-white" />
              <span>חינם לדיירים</span>
            </div>
          </div>
        )}

        {spot.is_charging_station && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl text-sm shadow-lg flex items-center backdrop-blur-sm">
            <FaBolt className="ml-1" /> עמדת טעינה
          </div>
        )}
      </div>

      {/* Card content */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors duration-200">
          {formatAddress(spot.address)}
        </h3>

        {spot.distance && (
          <p className="text-sm text-gray-600 mb-3 flex items-center">
            <FaMapMarkerAlt className="ml-2 text-gray-400" />
            {typeof spot.distance === "number"
              ? spot.distance < 1
                ? `${(spot.distance * 1000).toFixed(0)} מטר`
                : `${spot.distance.toFixed(1)} ק"מ`
              : spot.distance}
          </p>
        )}

        {spot.is_charging_station && spot.charger_type && (
          <p className="text-sm text-gray-600 mb-3 flex items-center">
            <FaCarSide className="ml-2 text-gray-400" />
            סוג מטען: {spot.charger_type}
          </p>
        )}

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 flex items-center">
              <FaCalendarAlt className="ml-2" />
              זמין ב-
              {new Date(searchParams.date).toLocaleDateString("he-IL")}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600 flex items-center">
              <FaClock className="ml-2" />
              זמן חנייה
            </span>
            <span className="font-semibold text-gray-800">
              {searchParams.startTime} - {searchParams.endTime}
            </span>
          </div>
        </div>

        <button
          onClick={() => handleBookParking(spot._id)}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl flex justify-center items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          <FaParking className="text-lg" />
          <span>הזמן חניה</span>
        </button>
      </div>
    </div>
  );
};

export default ParkingSpotCard;