import React from "react";
import { FaCog } from "react-icons/fa";

const SettingsButton = ({ parkingSlots, setNewPrice, setPriceError, setPriceSuccess, setShowSettingsPopup }) => {
  const privateSpot = parkingSlots.find((s) => s.spot_type === "private");

  return (
    <button
      onClick={() => {
        setNewPrice(privateSpot?.hourly_price?.toString() || "");
        setPriceError("");
        setPriceSuccess("");
        setShowSettingsPopup(true);
      }}
      className="absolute ml-4 mt-4 top-20 left-2 flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 shadow-md"
      title="הגדרות חנייה"
    >
      <span className="ml-2">הגדרות חנייה</span>
      <FaCog />
    </button>
  );
};

export default SettingsButton;