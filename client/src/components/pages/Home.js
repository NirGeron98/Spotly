import React, { useEffect } from "react";
import Footer from "../shared/Footer";
import Navbar from "../shared/Navbar";
import WelcomeSection from "../shared/WelcomeSection";
import RoutesSection from "../routes/RoutesSection";
import FeaturesSection from "../shared/FeaturesSection";
import ChatBot from "../shared/ChatBot";

const Home = ({ loggedIn, setLoggedIn, isRegistering }) => {
  useEffect(() => {
    document.title = "דף הבית | Spotly";
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" dir="rtl">
      {/* Animated Background System */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 -z-10">
        {/* Large Floating Orbs */}
        <div 
          className="absolute top-10 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-60"
          style={{
            animation: 'float 8s ease-in-out infinite'
          }}
        ></div>
        <div 
          className="absolute top-1/3 right-10 w-80 h-80 bg-sky-200 rounded-full mix-blend-multiply filter blur-2xl opacity-60"
          style={{
            animation: 'float 10s ease-in-out infinite',
            animationDelay: '2s'
          }}
        ></div>
        <div 
          className="absolute bottom-10 left-1/3 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-2xl opacity-60"
          style={{
            animation: 'float 12s ease-in-out infinite',
            animationDelay: '4s'
          }}
        ></div>
        
        {/* Moving Gradient Waves */}
        <div className="absolute inset-0 opacity-20">
          <div 
            className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-blue-200 to-transparent transform rotate-12"
            style={{
              animation: 'slide 15s linear infinite'
            }}
          ></div>
          <div 
            className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-sky-200 to-transparent transform -rotate-12"
            style={{
              animation: 'slide 18s linear infinite reverse',
              animationDelay: '3s'
            }}
          ></div>
        </div>
      </div>

      <Navbar
        loggedIn={loggedIn}
        setLoggedIn={setLoggedIn}
        isRegistering={isRegistering}
      />

      <main className="pt-[68px] flex-1 relative z-10 pb-[100px]">
        <WelcomeSection />
        <RoutesSection />
        <FeaturesSection />
      </main>

      <Footer />
      <ChatBot />

      {/* Floating Ambient Elements */}
      <div 
        className="fixed top-1/4 left-8 w-3 h-3 bg-blue-300 rounded-full opacity-40"
        style={{
          animation: 'ping 4s cubic-bezier(0, 0, 0.2, 1) infinite',
          animationDelay: '2s'
        }}
      ></div>
      <div 
        className="fixed top-1/2 right-12 w-2 h-2 bg-indigo-300 rounded-full opacity-40"
        style={{
          animation: 'ping 4s cubic-bezier(0, 0, 0.2, 1) infinite',
          animationDelay: '4s'
        }}
      ></div>
      <div 
        className="fixed bottom-1/3 left-12 w-4 h-4 bg-purple-300 rounded-full opacity-40"
        style={{
          animation: 'ping 4s cubic-bezier(0, 0, 0.2, 1) infinite',
          animationDelay: '6s'
        }}
      ></div>

      {/* Global Keyframes */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          33% { transform: translateY(-30px) translateX(20px) rotate(120deg); }
          66% { transform: translateY(20px) translateX(-20px) rotate(240deg); }
        }
        
        @keyframes slide {
          0% { transform: translateX(-100%) rotate(12deg); }
          100% { transform: translateX(100%) rotate(12deg); }
        }
        
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(50px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .7; }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
      `}</style>
    </div>
  );
};

export default Home;