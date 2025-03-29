import React from 'react';

const FeatureCard = ({ Icon, title, description, borderColor, iconColor }) => {
  return (
    <div className={`bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 border-t-4 ${borderColor}`}>
      <Icon className={`text-4xl ${iconColor} mx-auto mb-3`} />
      <h3 className="text-xl font-bold mb-3 text-center">{title}</h3>
      <p className="text-gray-600 text-center">
        {description}
      </p>
    </div>
  );
};

export default FeatureCard;
