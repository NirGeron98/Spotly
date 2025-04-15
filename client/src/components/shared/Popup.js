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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
      <div
        className={`bg-white rounded-xl shadow-xl relative transform transition-all duration-300 ease-out 
        ${show ? "opacity-100 scale-100" : "opacity-0 scale-90"} 
        ${isAlert ? `border ${borderColor}` : "border border-gray-300"} 
        p-8 w-auto pointer-events-auto`}
        style={{
          minWidth: "380px",
          maxWidth: wide ? "900px" : "700px",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 left-3 text-gray-400 hover:text-gray-700 text-xl"
        >
          ✖
        </button>

        <div className="flex items-start gap-4">
          {isAlert && <div className="text-2xl mt-1">{icon}</div>}

          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2 text-gray-800">{title}</h3>
            <div className="text-sm text-gray-700 max-h-[60vh] overflow-y-auto">
              {description}
            </div>
          </div>
        </div>

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
