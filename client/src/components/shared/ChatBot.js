import React, { useState } from "react";
import { FaComments, FaTimes } from "react-icons/fa";

const ChatBot = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

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
      answer:
        "ניתן להירשם בלחיצה על כפתור ההרשמה בתפריט ולמלא את פרטיך האישיים.",
    },
    {
      question: "האם אפשר להציע את החניה שלי להשכרה?",
      answer:
        "בהחלט! במסלול המתאים ניתן להוסיף חניה פרטית ולהגדיר שעות זמינות ותמחור.",
    },
  ];

  return (
    <>
      {/* בועת פתיחה – בצד ימין רספונסיבית */}
      {!chatOpen && (
        <button
          className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center"
          style={{
            width: "clamp(48px, 9vw, 64px)",
            height: "clamp(48px, 9vw, 64px)",
          }}
          onClick={() => setChatOpen(true)}
          aria-label="פתח צ'אט"
        >
          <FaComments className="text-xl" />
        </button>
      )}

      {/* חלון צ'אט רספונסיבי – בצד ימין */}
      {chatOpen && (
        <div
          className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 shadow-xl rounded-xl flex flex-col overflow-hidden transition-all duration-300"
          style={{
            width: "clamp(280px, 30vw, 360px)",
            height: "clamp(360px, 60vh, 480px)",
          }}
        >
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
            <h3 className="text-base font-semibold">שאלות נפוצות</h3>
            <button
              onClick={() => {
                setChatOpen(false);
                setSelectedQuestion(null);
              }}
              className="hover:text-gray-100 transition"
              aria-label="סגור צ'אט"
            >
              <FaTimes />
            </button>
          </div>

          {/* תוכן הצ'אט */}
          <div className="flex-1 overflow-y-auto p-4 text-sm space-y-3 text-right">
            {faqList.map((item, index) => (
              <div key={index} className="space-y-1">
                <button
                  onClick={() =>
                    setSelectedQuestion((prev) =>
                      prev === index ? null : index
                    )
                  }
                  className="w-full text-right bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg transition text-sm"
                >
                  {item.question}
                </button>

                {selectedQuestion === index && (
                  <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg text-sm">
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
