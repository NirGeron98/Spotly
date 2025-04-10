import React from 'react';

const RouteCard = ({ title, Icon, description, color }) => {
  return (
    <div className={`w-full md:w-80 h-72 bg-white rounded-xl p-6 shadow-md border-t-4 ${color} flex flex-col`}>
      {/* כותרת ואייקון */}
      <div className="flex flex-col items-center mb-4">
        <h2 className="text-xl font-bold text-center text-gray-800 h-[48px] leading-tight flex items-center justify-center">
          {title}
        </h2>
        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gray-100 shadow-md mt-2">
          <Icon className="text-4xl text-gray-700" />
        </div>
      </div>

      {/* תיאור */}
      <div className="h-[60px] px-2">
        <p className="text-base text-gray-600 text-center leading-snug">
          {description}
        </p>
      </div>
    </div>
  );
};

export default RouteCard;
