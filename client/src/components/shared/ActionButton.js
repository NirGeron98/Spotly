import React from 'react';

const ActionButton = ({ text, primary = true }) => {
  const baseClasses = "py-4 px-6 rounded-lg text-lg font-bold shadow-lg transition duration-300 transform hover:scale-105 hover:shadow-xl w-full max-w-xs text-center";
  const primaryClasses = "bg-blue-600 text-white hover:bg-blue-700";
  const secondaryClasses = "bg-green-600 text-white hover:bg-green-700";
  
  return (
    <button className={`${baseClasses} ${primary ? primaryClasses : secondaryClasses}`}>
      {text}
    </button>
  );
};

export default ActionButton;