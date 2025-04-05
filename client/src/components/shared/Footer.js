import React from "react";

const Footer = ({ onTermsClick ,onPrivicyPolicy ,onContact}) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-blue-900 text-blue-100 py-4">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <p className="text-lg font-bold">© 2025 כל הזכויות שמורות</p>
          </div>
          <div className="flex space-x-6 rtl:space-x-reverse">
            <button
              onClick={onTermsClick}
              className="hover:text-white transition"
              aria-label="תנאי שימוש"
            >
              תנאי שימוש
            </button>

            <button
            onClick={onPrivicyPolicy}
              className="hover:text-white transition"
              aria-label="מדיניות פרטיות"
            >
              מדיניות פרטיות
            </button>

            <button
            onClick={onContact}
              className="hover:text-white transition"
              aria-label="צור קשר"
            >
              צור קשר
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
