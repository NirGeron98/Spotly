import React from "react";
import Footer from "../../shared/Footer/Footer";
import RouteCard from "../../routes/RouteCard/RouteCard";
import FeatureCard from "../../shared/FeatureCard/FeatureCard";
import Navbar from "../../shared/Navbar/Navbar";

import {
  FaCar,
  FaKey,
  FaChargingStation,
  FaBuilding,
  FaMousePointer,
  FaClock,
  FaShieldAlt,
} from "react-icons/fa";

const Home = ({ loggedIn, setLoggedIn, isRegistering }) => {
  console.log("Rendering Home component");

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <Navbar
        loggedIn={loggedIn}
        setLoggedIn={setLoggedIn}
        isRegistering={isRegistering}
      />

      <main className="flex-1 bg-gradient-to-b from-blue-50 via-white to-blue-50 pb-16">
        {/* Hero Section */}
        <div className="relative py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white mb-10">
          <div className="container mx-auto px-2 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl font-bold mb-3">
                ברוכים הבאים ל-Spotly!
              </h1>
              <p className="text-lg text-blue-100 max-w-3xl mx-auto">
                ניהול ושיתוף חניות בבנייני מגורים, השכרת חניות פרטיות וחיפוש
                עמדות טעינה – הכל במקום אחד!
              </p>
            </div>
          </div>
        </div>

        {/* המסלולים */}
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            המסלולים שלנו הם:
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 justify-center">
            <RouteCard
              title="השכרת חניות פרטיות"
              Icon={FaKey}
              description="משתמשים יכולים להשכיר חניה פרטית לפי שעה/יום מבעלי חניות פרטיות."
              color="border-blue-400"
            />
            <RouteCard
              title="חיפוש חניות בתשלום"
              Icon={FaCar}
              description="המערכת מציגה למשתמש חניות ציבוריות או פרטיות בתשלום באזור הרצוי."
              color="border-green-400"
            />
            <RouteCard
              title="חיפוש עמדות טעינה פרטיות"
              Icon={FaChargingStation}
              description="המשתמש יכול לחפש ולהזמין עמדת טעינה לרכב חשמלי לפי מיקום וזמינות."
              color="border-purple-400"
            />
            <RouteCard
              title="שיתוף חניות בבנייני מגורים"
              Icon={FaBuilding}
              description="תושבי בניין יכולים להציע חניה פנויה לדיירים אחרים או לאורחים בתיאום מראש."
              color="border-orange-400"
            />
          </div>
        </div>

        {/* למה לבחור במערכת שלנו */}
        <div className="container mx-auto px-6 mt-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-blue-800 mb-12 text-center">
              למה לבחור במערכת שלנו?
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                Icon={FaMousePointer}
                title="פשוט לשימוש"
                description="ממשק משתמש אינטואיטיבי שקל להבין ולהשתמש בו ללא צורך בהדרכה מיוחדת."
                borderColor="border-blue-500"
                iconColor="text-blue-600"
              />

              <FeatureCard
                Icon={FaClock}
                title="זמין תמיד"
                description="המערכת פעילה 24/7 לשירותך בכל עת ומכל מקום דרך המחשב או הנייד."
                borderColor="border-teal-500"
                iconColor="text-teal-600"
              />

              <FeatureCard
                Icon={FaShieldAlt}
                title="אבטחה מתקדמת"
                description="הגנה על המידע שלך עם מערכות אבטחה מתקדמות ותקני אבטחה בינלאומיים."
                borderColor="border-purple-500"
                iconColor="text-purple-600"
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
