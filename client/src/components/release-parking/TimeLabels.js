import React from "react";

const TimeLabels = () => {
  return (
    <div className="absolute top-0 right-0 h-full w-16 border-l border-gray-200 bg-white z-10">
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          className="h-[60px] border-b border-gray-200 text-xs text-gray-500 flex items-center justify-center"
        >
          {String(i + 6).padStart(2, "0")}:00
        </div>
      ))}
    </div>
  );
};

export default TimeLabels;
