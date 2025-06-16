import React from "react";

const AddScheduleForm = ({ formData, handleChange, handleAddSlot, isBuildingMode }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md space-y-4 h-fit">
      <h2 className="text-xl font-bold text-center mb-4">הוסף פינוי חנייה</h2>
      <div>
        <label className="font-semibold">תאריך</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          min={formData.date}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">שעת התחלה</label>
          <select
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-md border border-gray-300 text-right"
          >
            {[...Array(72)].map((_, i) => {
              const hours = Math.floor(i / 4) + 6;
              const minutes = (i % 4) * 15;
              const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
              return <option key={i} value={timeString}>{timeString}</option>;
            })}
            <option value="23:59">23:59</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">שעת סיום</label>
          <select
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-md border border-gray-300 text-right"
          >
            {[...Array(72)].map((_, i) => {
              const hours = Math.floor(i / 4) + 6;
              const minutes = (i % 4) * 15;
              const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
              return <option key={i} value={timeString}>{timeString}</option>;
            })}
            <option value="23:59">23:59</option>
          </select>
        </div>
      </div>
      {!isBuildingMode && (
        <div>
          <label className="font-semibold">סוג פינוי</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option>השכרה רגילה</option>
            <option>טעינה לרכב חשמלי</option>
          </select>
        </div>
      )}
      <button
        onClick={() => handleAddSlot()}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        הוסף פינוי
      </button>
    </div>
  );
};

export default AddScheduleForm;
