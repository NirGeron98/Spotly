import React from "react";

const FeatureCard = ({ title, Icon, description, borderColor, iconColor, bgGradient, index }) => {
  return (
    <div 
      className={`relative backdrop-blur-md bg-white/90 rounded-2xl shadow-xl border-2 ${borderColor} p-8 transition-all duration-500 hover:shadow-2xl hover:scale-105 transform group overflow-hidden`}
      style={{
        animation: `fadeInUp 0.8s ease-out ${index * 0.15}s both`,
        boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.1), 0 10px 15px -5px rgba(0, 0, 0, 0.05)'
      }}
    >
      {/* Animated Background Gradient */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-0 transition-opacity duration-300 group-hover:opacity-10`}
      ></div>
      
      {/* Shimmer Effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform translate-x-[-100%] skew-x-12 transition-transform duration-1000 group-hover:translate-x-[100%]"
      ></div>

      <div className="relative z-10 text-center">
        {/* Enhanced Icon Container */}
        <div className="flex justify-center mb-6">
          <div 
            className={`p-5 bg-gradient-to-br ${bgGradient} rounded-2xl shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-12`}
          >
            <Icon className={`text-4xl ${iconColor}`} />
          </div>
        </div>

        {/* Enhanced Title */}
        <h3 className="text-2xl font-bold text-gray-800 mb-4 transition-colors duration-300 group-hover:text-gray-900">
          {title}
        </h3>

        {/* Enhanced Description */}
        <p className="text-gray-600 leading-relaxed transition-colors duration-300 group-hover:text-gray-700">
          {description}
        </p>
      </div>

      {/* Floating Decorative Elements */}
      <div 
        className="absolute top-3 right-3 w-3 h-3 bg-gradient-to-br from-blue-400 to-sky-400 rounded-full opacity-50"
        style={{
          animation: 'bounce 3s ease-in-out infinite',
          animationDelay: `${index * 0.5}s`
        }}
      ></div>
      <div 
        className="absolute bottom-3 left-3 w-2 h-2 bg-gradient-to-br from-sky-400 to-cyan-400 rounded-full opacity-50"
        style={{
          animation: 'bounce 3s ease-in-out infinite',
          animationDelay: `${index * 0.5 + 1}s`
        }}
      ></div>

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
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
      `}</style>
    </div>
  );
};

export default FeatureCard;