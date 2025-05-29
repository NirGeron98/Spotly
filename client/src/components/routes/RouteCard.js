import React from "react";

const RouteCard = ({ title, Icon, description, color, bgGradient, iconColor, index }) => {
  return (
    <div 
      className={`relative backdrop-blur-md bg-white/80 rounded-2xl shadow-lg border-2 ${color} p-6 transition-all duration-500 hover:shadow-2xl hover:scale-105 transform group overflow-hidden`}
      style={{
        animation: `fadeInUp 0.8s ease-out ${index * 0.2}s both`,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}
    >
      {/* Animated Background Gradient */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-0 transition-opacity duration-300 group-hover:opacity-20`}
      ></div>
      
      {/* Shimmer Effect on Hover */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform translate-x-[-100%] skew-x-12 transition-transform duration-1000 group-hover:translate-x-[100%]"
      ></div>

      <div className="relative z-10">
        {/* Enhanced Icon */}
        <div className="flex justify-center mb-4">
          <div className={`p-4 bg-gradient-to-br ${bgGradient} rounded-xl shadow-md transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
            <Icon className={`text-3xl ${iconColor}`} />
          </div>
        </div>

        {/* Enhanced Title */}
        <h3 className="text-xl font-bold text-gray-800 mb-3 text-center transition-colors duration-300 group-hover:text-gray-900">
          {title}
        </h3>

        {/* Enhanced Description */}
        <p className="text-gray-600 text-center leading-relaxed transition-colors duration-300 group-hover:text-gray-700">
          {description}
        </p>
      </div>

      {/* Decorative Corner Elements */}
      <div className="absolute top-2 right-2 w-2 h-2 bg-gradient-to-br from-blue-400 to-sky-400 rounded-full opacity-60"></div>
      <div className="absolute bottom-2 left-2 w-1 h-1 bg-gradient-to-br from-sky-400 to-cyan-400 rounded-full opacity-60"></div>

      {/* Component Keyframes */}
      <style jsx>{`
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(50px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default RouteCard;