import React, { useState } from "react";
import Popup from "./Popup";
import TermsContent from "./TermsContent";
import PrivacyPolicyContent from "./PrivicyPolicyContent";
import ContactContent from "./ContactContent";

const Footer = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupContent, setPopupContent] = useState(null);

  const handleOpenPopup = (type) => {
    switch (type) {
      case "terms":
        setPopupTitle("תנאי שימוש");
        setPopupContent(<TermsContent />);
        break;
      case "privacy":
        setPopupTitle("מדיניות פרטיות");
        setPopupContent(<PrivacyPolicyContent />);
        break;
      case "contact":
        setPopupTitle("צור קשר");
        setPopupContent(<ContactContent />);
        break;
      default:
        return;
    }
    setShowPopup(true);
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-blue-900 text-blue-100 py-4">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <p className="text-lg font-bold">© 2025 כל הזכויות שמורות</p>
          </div>
          <div className="flex space-x-6 rtl:space-x-reverse">
            <button
              onClick={() => handleOpenPopup("terms")}
              className="hover:text-white transition"
              aria-label="תנאי שימוש"
            >
              תנאי שימוש
            </button>
            <button
              onClick={() => handleOpenPopup("privacy")}
              className="hover:text-white transition"
              aria-label="מדיניות פרטיות"
            >
              מדיניות פרטיות
            </button>
            <button
              onClick={() => handleOpenPopup("contact")}
              className="hover:text-white transition"
              aria-label="צור קשר"
            >
              צור קשר
            </button>
          </div>
        </div>
      </div>

      {showPopup && (
        <Popup
          title={popupTitle}
          description={popupContent}
          onClose={() => setShowPopup(false)}
        />
      )}
    </footer>
  );
};

export default Footer;