import React from 'react';

const RouteCard = ({ title, Icon, description, color }) => {
  return (
    <div className={`w-full md:w-80 h-80 bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition transform hover:-translate-y-1 border-t-4 ${color}`}>
      {/* כותרת */}
      <h2 className="text-xl font-bold text-center mb-4 text-gray-800">
        {title}
      </h2>

      {/* אייקון */}
      <div className="h-24 flex items-center justify-center mb-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gray-100 shadow-md">
          <Icon className="text-4xl text-gray-700" />
        </div>
      </div>

      {/* תיאור */}
      <div className="h-20 flex items-center justify-center overflow-hidden">
        <p className="text-center text-gray-600">
          {description}
        </p>
      </div>
    </div>
  );
};

export default RouteCard;
