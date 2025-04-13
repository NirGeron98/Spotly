import React from "react";

const Popup = ({ onClose, onConfirm, description, title }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-xl w-full text-right">
        <h2 className="text-gray-700 text-xl font-bold mb-4">{title}</h2>
        <p className="text-gray-700 mb-4">{description}</p>

        <div className="text-left flex justify-end gap-3">
          {onConfirm ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
              >
                ביטול
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                אישור
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition"
            >
              סגור
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Popup;
