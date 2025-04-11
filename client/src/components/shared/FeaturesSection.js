import React from "react";
import FeatureCard from "./FeatureCard";
import { FaMobileAlt , FaClock, FaCompass , FaSearch, FaRoute, FaCheckCircle  } from "react-icons/fa";

const features = [
  {
    title: "נוחה לשימוש",
    Icon: FaCheckCircle ,
    description: "ממשק משתמש אינטואיטיבי שקל להבין ולהשתמש בו ללא צורך בהדרכה מיוחדת.",
    borderColor: "border-blue-500",
    iconColor: "text-blue-600",
  },
  {
    title: "זמינות",
    Icon: FaMobileAlt ,
    description: "המערכת פעילה 24/7 לשירותך בכל עת ומכל מקום דרך המחשב או הנייד.",
    borderColor: "border-teal-500",
    iconColor: "text-teal-600",
  },
  {
    title: "התאמה אישית לפי מסלול",
    Icon: FaRoute,
    description: "ממשק מותאם לכל סוג משתמש.",
    borderColor: "border-purple-500",
    iconColor: "text-purple-600",
  },
  {
    title: "חיפוש חכם וממוקד",
    Icon: FaSearch,
    description: "אפשרויות סינון מתקדמות לפי מיקום, מחיר, שעות זמינות וסוג חנייה.",
    borderColor: "border-orange-500",
    iconColor: "text-orange-600",
  },
];

const FeaturesSection = () => {
  return (
    <div className="container mx-auto px-6 mt-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-blue-800 mb-12 text-center">
          למה לבחור במערכת שלנו?
        </h2>
        <div className="grid justify-center md:grid-cols-4 gap-8">
        {features.map((feature, idx) => (
            <FeatureCard key={idx} {...feature} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
