import React, { useEffect, useState } from "react";

const Popup = ({
  title,
  description,
  onClose,
  onConfirm,
  type = "info",
  wide = false,
}) => {
  const isError = type === "error";
  const isSuccess = type === "success";
  const isAlert = isError || isSuccess;

  const icon = isError ? "❌" : isSuccess ? "✅" : "ℹ️";
  const borderColor = isError
    ? "border-red-500"
    : isSuccess
    ? "border-green-500"
    : "border-blue-500";

  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center px-4">
      <div
        className={`bg-white rounded-xl shadow-xl relative transform transition-all duration-300 ease-out 
        ${show ? "opacity-100 scale-100" : "opacity-0 scale-90"} 
        ${isAlert ? `border ${borderColor}` : "border border-gray-300"} 
        p-6 pointer-events-auto inline-block`}
        style={{ maxWidth: wide ? "900px" : "700px",
          minwidth: "280px",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 text-gray-400 hover:text-gray-700 text-xl"
        >
          ✖
        </button>

        {/* Title */}
        <h3 className="text-xl font-bold text-center text-gray-800 mb-4">
          {title}
        </h3>

        {/* Content */}
        <div className="flex items-start gap-4">
          {isAlert && <div className="text-2xl mt-1">{icon}</div>}

          <div className="text-sm text-gray-700 leading-relaxed max-h-[60vh] overflow-y-auto">
            {description}
          </div>
        </div>

        {/* Confirm Button (optional) */}
        {onConfirm && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={onConfirm}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              אישור
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Popup;
