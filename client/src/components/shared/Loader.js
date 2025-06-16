import React from "react";

const Loader = ({ message = "מחפש תוצאות..." }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white px-8 py-6 rounded-xl shadow-2xl flex flex-col items-center space-y-4 border border-blue-200">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
        <p className="text-gray-700 font-semibold">{message}</p>
      </div>
    </div>
  );
};

export default Loader;
