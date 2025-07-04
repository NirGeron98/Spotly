import React, { useEffect } from "react";
import Footer from "../components/shared/Footer";
import Navbar from "../components/shared/Navbar";
import WelcomeSection from "../components/shared/WelcomeSection";
import RoutesSection from "../components/routes/RoutesSection";
import FeaturesSection from "../components/shared/FeaturesSection";
import ChatBot from "../components/shared/ChatBot";

const Home = ({ loggedIn, setLoggedIn, isRegistering }) => {
  useEffect(() => {
    document.title = "דף הבית | Spotly";
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative" dir="rtl">
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

      <Footer />
      <ChatBot />
    </div>
  );
};

export default Home;