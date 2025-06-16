import React from "react";

const PageHeader = ({ icon: Icon, title, subtitle }) => {
  return (
    <div className="text-center mb-12">
      <div className="flex items-center justify-center mb-6">
        {Icon && <Icon className="text-blue-600 text-5xl ml-4 pt-[20px]" />}
        <h1 className="pt-[20px] text-4xl font-extrabold text-blue-700">
          {title}
        </h1>
      </div>
      {subtitle && (
        <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default PageHeader;
