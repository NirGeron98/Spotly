import React, { useState } from "react";
import { FaComments } from "react-icons/fa";

const ChatBot = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const faqList = [
    { question: "איזה מסלולים יש?", answer: "המערכת כוללת השכרת חניות פרטיות, חיפוש חניות בתשלום, חיפוש עמדות טעינה, ושיתוף חניות בבנייני מגורים." },
    { question: "כמה זה עולה?", answer: "השימוש במערכת חינמי. המחירים של החניות והעמדות נקבעים ע״י בעלי הנכסים." },
    { question: "באילו שעות אתם עובדים?", answer: "המערכת זמינה 24/7." },
    { question: "איך נרשמים למערכת?", answer: "ניתן להירשם בלחיצה על כפתור ההרשמה בתפריט ולמלא את פרטיך האישיים." },
    { question: "האם אפשר להציע את החניה שלי להשכרה?", answer: "בהחלט! במסלול המתאים ניתן להוסיף חניה פרטית ולהגדיר שעות זמינות ותמחור." },
  ];

  return (
    <>
      <button
        className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg"
        onClick={() => setChatOpen((prev) => !prev)}
        aria-label="צ'אט תמיכה"
      >
        <FaComments size={34} />
      </button>

      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-full bg-white rounded-xl shadow-xl p-4 z-50 border border-gray-300 max-h-[420px] overflow-auto transition-all duration-300">
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
                  onClick={() => setSelectedQuestion((prev) => (prev === index ? null : index))}
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
    </>
  );
};

export default ChatBot;
