import React from "react";
import RouteCard from "./RouteCard";
import { FaKey, FaCar, FaChargingStation, FaBuilding } from "react-icons/fa";

const routes = [
  {
    title: "השכרת חניות פרטיות",
    Icon: FaKey,
    description: "בעלי בתים פרטיים יכולים להשכיר את החניה כשהם לא בבית, ולהרוויח ממנה כסף.",
    color: "border-blue-400",
    bgGradient: "from-blue-50 to-blue-100",
    iconColor: "text-blue-600",
  },
  {
    title: "חיפוש חניות פרטיות בתשלום",
    Icon: FaCar,
    description: "חיפוש והזמנת חניה פרטית בתשלום לפי קריטריונים.",
    color: "border-green-400",
    bgGradient: "from-green-50 to-green-100",
    iconColor: "text-green-600",
  },
  {
    title: "חיפוש עמדות טעינה פרטיות",
    Icon: FaChargingStation,
    description: "חיפוש והזמנת עמדת טעינה לרכב חשמלי לפי קריטריונים.",
    color: "border-purple-400",
    bgGradient: "from-purple-50 to-purple-100",
    iconColor: "text-purple-600",
  },
  {
    title: "שיתוף חניות בבנייני מגורים",
    Icon: FaBuilding,
    description: "תושבי בניין יכולים להציע חניה פנויה לדיירים אחרים או לאורחים בתיאום מראש.",
    color: "border-orange-400",
    bgGradient: "from-orange-50 to-orange-100",
    iconColor: "text-orange-600",
  },
];

const RoutesSection = () => {
  return (
    <div className="container mx-auto px-6 mb-20">
      {/* Enhanced Section Title */}
      <div className="text-center mb-16">
        <h2 
          className="text-4xl font-bold text-gray-800 mb-4 relative inline-block"
          style={{
            animation: 'fadeInUp 0.8s ease-out'
          }}
        >
          המסלולים שלנו
          <div 
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-blue-400 to-sky-400 rounded-full"
            style={{
              animation: 'pulse 2s ease-in-out infinite'
            }}
          ></div>
        </h2>
        <p 
          className="text-gray-600 text-lg max-w-2xl mx-auto"
          style={{
            animation: 'fadeInUp 0.8s ease-out 0.2s both'
          }}
        >
          גלה את כל האפשרויות שהמערכת שלנו מציעה עבורך
        </p>
      </div>

      {/* Enhanced Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-center">
        {routes.map((route, idx) => (
          <RouteCard key={idx} {...route} index={idx} />
        ))}
      </div>

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
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .7; }
        }
      `}</style>
    </div>
  );
};

export default RoutesSection;