import React from "react";

const QuickAddPopup = ({ quickAddData, handleQuickAddChange, handleAddSlot, setShowQuickAddPopup, isBuildingMode }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
        <h3 className="text-xl font-bold mb-4 text-center">הוסף פינוי חנייה מהיר</h3>
        <div className="space-y-4">
          <div>
            <label className="font-semibold">תאריך</label>
            <input
              type="date"
              name="date"
              value={quickAddData.date}
              onChange={handleQuickAddChange}
              min={quickAddData.date}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex gap-4">
            {['startTime', 'endTime'].map((timeKey) => (
              <div key={timeKey} className="w-1/2">
                <label className="font-semibold">{timeKey === 'startTime' ? 'שעת התחלה' : 'שעת סיום'}</label>
                <select
                  name={timeKey}
                  value={quickAddData[timeKey]}
                  onChange={handleQuickAddChange}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 text-right"
                >
                  {Array.from({ length: 72 }).map((_, i) => {
                    const hours = Math.floor(i / 4) + 6;
                    const minutes = (i % 4) * 15;
                    const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
                    return (
                      <option key={i} value={timeString}>{timeString}</option>
                    );
                  })}
                  <option value="23:59">23:59</option>
                </select>
              </div>
            ))}
          </div>
          {!isBuildingMode && (
            <div>
              <label className="font-semibold">סוג פינוי</label>
              <select
                name="type"
                value={quickAddData.type}
                onChange={handleQuickAddChange}
                className="w-full border rounded px-3 py-2"
              >
                <option>השכרה רגילה</option>
                <option>טעינה לרכב חשמלי</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowQuickAddPopup(false)}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            >
              ביטול
            </button>
            <button
              onClick={() => handleAddSlot(quickAddData)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              הוסף
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickAddPopup;