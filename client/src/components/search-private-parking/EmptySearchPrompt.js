import React from "react";
import { FaSearch } from "react-icons/fa";

const EmptySearchPrompt = ({
  title = "התחל לחפש חניה",
  description = "הזן מיקום, תאריך ושעות כדי למצוא חניות פרטיות זמינות.",
}) => {
  return (
    <div className="text-center py-16 max-w-6xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100">
      <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
        <FaSearch className="text-blue-600 text-4xl" />
      </div>
      <h3 className="text-2xl font-bold text-gray-700 mb-4">{title}</h3>
      <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">{description}</p>
    </div>
  );
};

export default EmptySearchPrompt;
