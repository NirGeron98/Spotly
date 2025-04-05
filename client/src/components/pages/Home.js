import React, { useEffect } from "react";
import Footer from "../shared/Footer";
import Navbar from "../shared/Navbar";
import WelcomeSection from "../shared/WelcomeSection";
import RoutesSection from "../routes/RoutesSection";
import FeaturesSection from "../shared/FeaturesSection";
import ChatBot from "../shared/ChatBot";
import Popup from "../shared/Popup";
import TermsContent from "../shared/TermsContent";
import ContactContent from "../shared/ContactContent";
import PrivacyPolicyContent from "../shared/PrivicyPolicyContent";
import { useState } from "react";

const Home = ({ loggedIn, setLoggedIn, isRegistering }) => {

  const [showPopup, setShowPopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupDescription, setPopupDescription] = useState(null);


  useEffect(() => {
    document.title = "דף הבית | Spotly";
  }, []);

const onTermsClick = ()=>{
  setShowPopup(true);
  setPopupTitle("תנאי שימוש");
  setPopupDescription(<TermsContent />);
}
const onPrivicyPolicyClick = ()=>{
  setShowPopup(true);
  setPopupTitle("מדיניות פרטיות");
  setPopupDescription(<PrivacyPolicyContent />);
}
const onContactClick = ()=>{
  setShowPopup(true);
  setPopupTitle("צור קשר");
  setPopupDescription(<ContactContent />);
}

  return (
  <div className={`min-h-screen flex flex-col relative ${showPopup ? 'overflow-hidden' : ''}`} dir="rtl">
    {showPopup && <Popup onClose={() => setShowPopup(false)} description={popupDescription} title={popupTitle}/>}
      <Navbar
        loggedIn={loggedIn}
        setLoggedIn={setLoggedIn}
        isRegistering={isRegistering}
      />

      <main className="pt-[68px] flex-1 bg-gradient-to-b from-blue-50 via-white to-blue-50 pb-[100px]">
        <WelcomeSection />
        <RoutesSection />
        <FeaturesSection />
      </main>

      <Footer onTermsClick={onTermsClick} onPrivicyPolicy={onPrivicyPolicyClick} onContact={onContactClick} />
      <ChatBot />
    </div>
  );
};

//
export default Home;
