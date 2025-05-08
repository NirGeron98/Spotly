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
    <footer className="w-full bg-blue-900 text-blue-100 px-4 py-4 mt-auto z-30 relative">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
        <p className="text-sm sm:text-base font-semibold text-center sm:text-right">
          © 2025 כל הזכויות שמורות
        </p>
        <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm sm:text-base">
          <button
            onClick={() => handleOpenPopup("terms")}
            className="hover:text-white transition"
          >
            תנאי שימוש
          </button>
          <button
            onClick={() => handleOpenPopup("privacy")}
            className="hover:text-white transition"
          >
            מדיניות פרטיות
          </button>
          <button
            onClick={() => handleOpenPopup("contact")}
            className="hover:text-white transition"
          >
            צור קשר
          </button>
        </div>
      </div>

      {showPopup && (
        <Popup
          title={popupTitle}
          description={popupContent}
          onClose={() => setShowPopup(false)}
          type="info"
        />
      )}
    </footer>
  );
};

export default Footer;
