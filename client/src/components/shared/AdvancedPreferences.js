import React from "react";

const AdvancedPreferencesPopup = ({
  distancePreference,
  pricePreference,
  setDistancePreference,
  setPricePreference,
  savePreferences,
  onClose,
}) => {
  const renderStars = (value, setValue) => (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((v) => (
          <div key={v} className="flex flex-col items-center">
            <button
              onClick={() => setValue(v)}
              className={`text-3xl ${
                v <= value ? "text-yellow-400" : "text-gray-300"
              } transition`}
            >
              ★
            </button>
            <span className="text-xs text-gray-500">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-10 backdrop-blur-sm z-60 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-blue-700 mb-4 text-center">
          העדפות חיפוש מתקדמות
        </h2>

        <div className="space-y-4 text-right">
          <div>
            <label className="block font-semibold mb-1">
              עד כמה חשוב לך שמרחק החנייה יהיה קרוב? (1-5)
            </label>
            {renderStars(distancePreference, setDistancePreference)}
          </div>

          <div>
            <label className="block font-semibold mb-1">
              עד כמה חשוב לך שמחיר החנייה יהיה נמוך? (1-5)
            </label>
            {renderStars(pricePreference, setPricePreference)}
          </div>
        </div>

        <div className="text-center mt-6 flex gap-4 justify-center">
          <button
            onClick={savePreferences}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow"
          >
            שמור
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded shadow"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedPreferencesPopup;
