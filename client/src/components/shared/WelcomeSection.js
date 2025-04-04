import React from "react";

const WelcomeSection = () => {
  return (
    <div className="relative py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white mb-10">
      <div className="container mx-auto px-2 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-3">ברוכים הבאים ל-Spotly!</h1>
          <p className="text-lg text-blue-100 max-w-3xl mx-auto">
            ניהול ושיתוף חניות בבנייני מגורים, השכרת חניות פרטיות וחיפוש עמדות טעינה – הכל במקום אחד!
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;
