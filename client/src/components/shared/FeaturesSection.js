import React from "react";
import FeatureCard from "./FeatureCard";
import { FaMobileAlt, FaSearch, FaRoute, FaCheckCircle } from "react-icons/fa";

const features = [
  {
    title: "נוחה לשימוש",
    Icon: FaCheckCircle,
    description: "ממשק משתמש אינטואיטיבי שקל להבין ולהשתמש בו ללא צורך בהדרכה מיוחדת.",
    borderColor: "border-blue-500",
    iconColor: "text-blue-600",
    bgGradient: "from-blue-50 to-blue-100",
  },
  {
    title: "זמינות",
    Icon: FaMobileAlt,
    description: "המערכת פעילה 24/7 לשירותך בכל עת ומכל מקום דרך המחשב או הנייד.",
    borderColor: "border-teal-500",
    iconColor: "text-teal-600",
    bgGradient: "from-teal-50 to-teal-100",
  },
  {
    title: "התאמה אישית לפי מסלול",
    Icon: FaRoute,
    description: "ממשק מותאם לכל סוג משתמש.",
    borderColor: "border-purple-500",
    iconColor: "text-purple-600",
    bgGradient: "from-purple-50 to-purple-100",
  },
  {
    title: "חיפוש חכם וממוקד",
    Icon: FaSearch,
    description: "אפשרויות סינון מתקדמות לפי מיקום, מחיר, שעות זמינות וסוג חנייה.",
    borderColor: "border-orange-500",
    iconColor: "text-orange-600",
    bgGradient: "from-orange-50 to-orange-100",
  },
];

const FeaturesSection = () => {
  return (
    <div className="container mx-auto px-6 relative">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-10 left-10 w-40 h-40 bg-blue-100 rounded-full opacity-30 filter blur-xl"
          style={{
            animation: 'float 12s ease-in-out infinite'
          }}
        ></div>
        <div 
          className="absolute bottom-10 right-10 w-32 h-32 bg-sky-100 rounded-full opacity-30 filter blur-xl"
          style={{
            animation: 'float 10s ease-in-out infinite',
            animationDelay: '3s'
          }}
        ></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Enhanced Section Header */}
        <div className="text-center mb-16">
          <h2 
            className="text-4xl md:text-4xl font-bold text-black-800 mb-6 relative inline-block"
            style={{
              animation: 'fadeInUp 0.8s ease-out'
            }}
          >
            למה לבחור במערכת שלנו?
            <div 
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-400 to-sky-400 rounded-full"
              style={{
                animation: 'pulse 2s ease-in-out infinite'
              }}
            ></div>
          </h2>
          <p 
            className="text-gray-600 text-xl max-w-3xl mx-auto leading-relaxed"
            style={{
              animation: 'fadeInUp 0.8s ease-out 0.2s both'
            }}
          >
            המערכת שלנו מציעה פתרון מקיף ומתקדם לכל צרכי החנייה שלך
          </p>
        </div>

        {/* Enhanced Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-center">
          {features.map((feature, idx) => (
            <FeatureCard key={idx} {...feature} index={idx} />
          ))}
        </div>
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

export default FeaturesSection;