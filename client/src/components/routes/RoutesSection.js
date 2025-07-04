import React from "react";
import RouteCard from "./RouteCard";
import { FaKey, FaCar, FaChargingStation, FaBuilding } from "react-icons/fa";

const routes = [
  {
    title: "השכרת חניות פרטיות",
    Icon: FaKey,
    description: "בעלי בתים פרטיים יכולים להשכיר את החניה כשהם לא בבית, ולהרוויח ממנה כסף.",
    color: "border-blue-400",
  },
  {
    title: "חיפוש חניות פרטיות בתשלום",
    Icon: FaCar,
    description: "חיפוש והזמנת חניה פרטית בתשלום לפי קריטריונים.",
    color: "border-green-400",
  },
  {
    title: "חיפוש עמדות טעינה פרטיות",
    Icon: FaChargingStation,
    description: "חיפוש והזמנת עמדת טעינה לרכב חשמלי לפי קריטריונים.",
    color: "border-purple-400",
  },
  {
    title: "שיתוף חניות בבנייני מגורים",
    Icon: FaBuilding,
    description: "תושבי בניין יכולים להציע חניה פנויה לדיירים אחרים או לאורחים בתיאום מראש.",
    color: "border-orange-400",
  },
];

const RoutesSection = () => {
  return (
    <div className="container mx-auto px-6">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
        המסלולים שלנו הם:
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 sm:gap-8 xl:gap-6 justify-center min-h-0">
        {routes.map((route, idx) => (
          <RouteCard key={idx} {...route} />
        ))}
      </div>
    </div>
  );
};

export default RoutesSection;