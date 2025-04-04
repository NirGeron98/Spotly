import React from "react";
import RouteCard from "./RouteCard";
import { FaKey, FaCar, FaChargingStation, FaBuilding } from "react-icons/fa";

const routes = [
  {
    title: "השכרת חניות פרטיות",
    Icon: FaKey,
    description: "משתמשים יכולים להשכיר חניה פרטית לפי שעה/יום מבעלי חניות פרטיות.",
    color: "border-blue-400",
  },
  {
    title: "חיפוש חניות בתשלום",
    Icon: FaCar,
    description: "המערכת מציגה למשתמש חניות ציבוריות או פרטיות בתשלום באזור הרצוי.",
    color: "border-green-400",
  },
  {
    title: "חיפוש עמדות טעינה פרטיות",
    Icon: FaChargingStation,
    description: "המשתמש יכול לחפש ולהזמין עמדת טעינה לרכב חשמלי לפי מיקום וזמינות.",
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 justify-center">
        {routes.map((route, idx) => (
          <RouteCard key={idx} {...route} />
        ))}
      </div>
    </div>
  );
};

export default RoutesSection;
