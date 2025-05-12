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
  const isConfirm = type === "confirm";

  const getIcon = () => {
    if (isError) return "⛔";
    if (isSuccess) return "✅";
    if (isConfirm) return "📝";
    return "ℹ️";
  };

  const getBgColor = () => {
    if (isError) return "bg-red-50";
    if (isSuccess) return "bg-green-50";
    if (isConfirm) return "bg-gray-50";
    return "bg-blue-50";
  };

  const getBorderColor = () => {
    if (isError) return "border-red-400";
    if (isSuccess) return "border-green-400";
    if (isConfirm) return "border-gray-400";
    return "border-blue-400";
  };

  const getHeaderColor = () => {
    if (isError) return "bg-red-500 text-white";
    if (isSuccess) return "bg-green-500 text-white";
    if (isConfirm) return "bg-gray-600 text-white";
    return "bg-blue-500 text-white";
  };

  const getButtonClass = () => {
    if (isError) return "bg-red-500 hover:bg-red-600";
    if (isSuccess) return "bg-green-500 hover:bg-green-600";
    if (isConfirm) return "bg-gray-600 hover:bg-gray-700";
    return "bg-blue-500 hover:bg-blue-600";
  };

  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
      <div className="absolute inset-0 bg-black bg-opacity-25 backdrop-blur-sm pointer-events-auto"></div>

      <div
        className={`relative bg-white rounded-2xl shadow-2xl transform transition-all duration-300 ease-out overflow-hidden pointer-events-auto
        ${show ? "opacity-100 scale-100" : "opacity-0 scale-90"} 
        border-2 ${getBorderColor()}`}
        style={{
          width: wide ? "90vw" : "min(85vw, 550px)",
          maxWidth: wide ? "900px" : "550px",
          minWidth: "280px",
          maxHeight: "85vh",
        }}
      >
        <div
          className={`px-6 py-4 ${getHeaderColor()} flex justify-between items-center`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getIcon()}</span>
            <h3 className="text-xl font-bold">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-xl focus:outline-none transition-transform hover:scale-110"
            aria-label="סגור"
          >
            ✖
          </button>
        </div>

        <div className={`p-6 ${getBgColor()}`}>
          <div
            className="text-gray-700 leading-relaxed overflow-y-auto"
            style={{ maxHeight: "60vh", fontSize: "1.05rem" }}
          >
            {description}
          </div>

          <div className="mt-8 flex justify-end gap-3">
            {onConfirm ? (
              <>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  ביטול
                </button>
                <button
                  onClick={onConfirm}
                  className={`px-5 py-2.5 text-white rounded-lg transition font-medium ${getButtonClass()} shadow-md`}
                >
                  אישור
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className={`px-5 py-2.5 text-white rounded-lg transition font-medium ${getButtonClass()} shadow-md`}
              >
                אישור
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Popup;
