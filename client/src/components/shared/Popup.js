import React from "react";

const Popup = ({ onClose, description, title }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-xl w-full text-right">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="text-gray-700 mb-4">
          {description}
        </p>
        <div className="text-left">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;