import React from "react";
import { FaCog } from "react-icons/fa";

const SettingsButton = ({ parkingSlots, setNewPrice, setPriceError, setPriceSuccess, setShowSettingsPopup }) => {
  const privateSpot = parkingSlots.find((s) => s.spot_type === "private");

  return (
    <div className="flex justify-center">
      <button
        onClick={() => {
          setNewPrice(privateSpot?.hourly_price?.toString() || "");
          setPriceError("");
          setPriceSuccess("");
          setShowSettingsPopup(true);
        }}
        className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-md transition-colors duration-200 shadow-md text-sm sm:text-base"
        title="הגדרות חנייה"
      >
        <span className="hidden sm:inline ml-2">הגדרות חנייה</span>
        <FaCog className="sm:mr-0" />
      </button>
    </div>
  );
};

export default SettingsButton;