import React from "react";
import { useNavigate } from "react-router-dom";

const WelcomeSection = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/Signup");
  };
  return (
    <div className="relative py-20 mb-16 overflow-hidden">
      {/* Enhanced Background with Multiple Layers */}
      <div className="absolute inset-0">
        {/* Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-800 via-sky-900 to-cyan-800"></div>
        
        {/* Animated Overlay Patterns */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          style={{
            animation: 'shimmer 6s ease-in-out infinite'
          }}
        ></div>
        
        {/* Floating Geometric Shapes */}
        <div 
          className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full"
          style={{
            animation: 'float 3s ease-in-out infinite'
          }}
        ></div>
        <div 
          className="absolute top-20 right-20 w-24 h-24 bg-sky-300/20 rounded-full"
          style={{
            animation: 'float 8s ease-in-out infinite',
            animationDelay: '2s'
          }}
        ></div>
        <div 
          className="absolute bottom-10 left-1/3 w-20 h-20 bg-cyan-300/20 rounded-full"
          style={{
            animation: 'float 10s ease-in-out infinite',
            animationDelay: '4s'
          }}
        ></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Enhanced Title with Animation */}
          <h1 
            className="text-5xl md:text-6xl font-bold mb-6 text-white relative"
            style={{
              animation: 'fadeInUp 1s ease-out',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            ברוכים הבאים ל-Spotly!
            <div 
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-blue-300 to-sky-300 rounded-full"
              style={{
                animation: 'pulse 2s ease-in-out infinite'
              }}
            ></div>
          </h1>

          {/* Enhanced Description */}
          <p 
            className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed font-medium"
            style={{
              animation: 'fadeInUp 1s ease-out 0.3s both',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}
          >
            ניהול ושיתוף חניות בבנייני מגורים, השכרת חניות פרטיות וחיפוש עמדות טעינה – 
            
            <span className="text-white font-semibold"> הכל במקום אחד!</span>
          </p>

          {/* Call-to-Action Button */}
          <div 
            className="mt-12 flex justify-center"
            style={{
              animation: 'fadeInUp 1s ease-out 0.6s both'
            }}
          >
            <button 
              onClick={handleGetStarted}
              className="px-8 py-4 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 relative overflow-hidden group cursor-pointer"
            >
              <span className="relative z-10">התחל עכשיו</span>
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100 to-transparent transform translate-x-[-100%] skew-x-12 transition-transform duration-1000 group-hover:translate-x-[100%]"
              ></div>
            </button>
          </div>
        </div>
      </div>

      {/* Keyframes for this component */}
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
        
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .7; }
        }
      `}</style>
    </div>
  );
};

export default WelcomeSection;