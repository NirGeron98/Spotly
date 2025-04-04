import React from "react";
import FeatureCard from "./FeatureCard";
import { FaMousePointer, FaClock, FaShieldAlt } from "react-icons/fa";

const features = [
  {
    title: "פשוט לשימוש",
    Icon: FaMousePointer,
    description: "ממשק משתמש אינטואיטיבי שקל להבין ולהשתמש בו ללא צורך בהדרכה מיוחדת.",
    borderColor: "border-blue-500",
    iconColor: "text-blue-600",
  },
  {
    title: "זמין תמיד",
    Icon: FaClock,
    description: "המערכת פעילה 24/7 לשירותך בכל עת ומכל מקום דרך המחשב או הנייד.",
    borderColor: "border-teal-500",
    iconColor: "text-teal-600",
  },
  {
    title: "אבטחה מתקדמת",
    Icon: FaShieldAlt,
    description: "הגנה על המידע שלך עם מערכות אבטחה מתקדמות ותקני אבטחה בינלאומיים.",
    borderColor: "border-purple-500",
    iconColor: "text-purple-600",
  },
];

const FeaturesSection = () => {
  return (
    <div className="container mx-auto px-6 mt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-blue-800 mb-12 text-center">
          למה לבחור במערכת שלנו?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <FeatureCard key={idx} {...feature} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturesSection;
