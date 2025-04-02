import React, { useEffect, useState } from "react";
import Footer from "../shared/Footer";
import RouteCard from "../routes/RouteCard";
import FeatureCard from "../shared/FeatureCard";
import Navbar from "../shared/Navbar";
import {
  FaCar,
  FaKey,
  FaChargingStation,
  FaBuilding,
  FaMousePointer,
  FaClock,
  FaShieldAlt,
  FaComments,
} from "react-icons/fa";

const Home = ({ loggedIn, setLoggedIn, isRegistering }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  useEffect(() => {
    document.title = "דף הבית | Spotly";
  }, []);

  const faqList = [
    {
      question: "איזה מסלולים יש?",
      answer:
        "המערכת כוללת השכרת חניות פרטיות, חיפוש חניות בתשלום, חיפוש עמדות טעינה, ושיתוף חניות בבנייני מגורים.",
    },
    {
      question: "כמה זה עולה?",
      answer:
        "השימוש במערכת חינמי. המחירים של החניות והעמדות נקבעים ע״י בעלי הנכסים.",
    },
    {
      question: "באילו שעות אתם עובדים?",
      answer: "המערכת זמינה 24/7.",
    },
    {
      question: "איך נרשמים למערכת?",
      answer: "ניתן להירשם בלחיצה על כפתור ההרשמה בתפריט ולמלא את פרטיך האישיים.",
    },
    {
      question: "האם אפשר להציע את החניה שלי להשכרה?",
      answer:
        "בהחלט! במסלול המתאים ניתן להוסיף חניה פרטית ולהגדיר שעות זמינות ותמחור.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <Navbar
        loggedIn={loggedIn}
        setLoggedIn={setLoggedIn}
        isRegistering={isRegistering}
      />

      <main className="flex-1 bg-gradient-to-b from-blue-50 via-white to-blue-50 pb-16">
        <div className="relative py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white mb-10">
          <div className="container mx-auto px-2 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl font-bold mb-3">ברוכים הבאים ל-Spotly!</h1>
              <p className="text-lg text-blue-100 max-w-3xl mx-auto">
                ניהול ושיתוף חניות בבנייני מגורים, השכרת חניות פרטיות וחיפוש
                עמדות טעינה – הכל במקום אחד!
              </p>
            </div>
          </div>
        </div>

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

      <button
        className="fixed bottom-6 left-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg"
        onClick={() => setChatOpen((prev) => !prev)}
        aria-label="צ'אט תמיכה"
      >
        <FaComments size={34} />
      </button>

      {chatOpen && (
        <div className="fixed bottom-24 left-6 w-96 max-w-full bg-white rounded-xl shadow-xl p-4 z-50 border border-gray-300 max-h-[420px] overflow-auto transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-blue-800">שאלות נפוצות</h3>
            <button
              className="text-gray-500 hover:text-red-500 text-xl font-bold"
              onClick={() => {
                setChatOpen(false);
                setSelectedQuestion(null);
              }}
              aria-label="סגור צ'אט"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {faqList.map((item, index) => (
              <div key={index} className="space-y-1">
                <div
                  onClick={() =>
                    setSelectedQuestion((prev) =>
                      prev === index ? null : index
                    )
                  }
                  className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg cursor-pointer text-sm text-right hover:bg-blue-200 transition"
                >
                  {item.question}
                </div>

                {selectedQuestion === index && (
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg text-sm text-right animate-fade-in">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
