import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCar, FaBuilding } from 'react-icons/fa';
import ActionButton from '../../shared/ActionButton/ActionButton';
import Navbar from "../../shared/Navbar/Navbar";
import Footer from '../../shared/Footer/Footer';
import { userService } from '../../../services/userService';

const Dashboard = ({ loggedIn, setLoggedIn }) => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("משתמש");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await userService.getMe();
        const user = res?.data?.user || res?.data?.data?.user || res?.data?.data;

        if (user && user.first_name) {
          // const full = `${user.first_name} ${user.last_name || ""}`.trim();
          setFirstName(user.first_name);
        }
      } catch (error) {
        console.error("❌ Failed to fetch user for dashboard:", error);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50" dir="rtl">
      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} />

      <main className="flex-1 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-blue-700 mb-4">איזה כיף שחזרת {firstName}!</h1>
            <p className="text-gray-600 text-lg">בחר פעולה מתוך האפשרויות הבאות:</p>
          </div>

          <div className="flex justify-center gap-6">
            <div className="w-72">
              <ActionButton
                text={
                  <div className="flex items-center justify-center gap-2">
                    <FaCar className="text-xl" />
                    חיפוש חנייה/עמדת טעינה בתשלום
                  </div>
                }
                primary={true}
                onClick={() => navigate('/search-parking')}
              />
            </div>

            <div className="w-72">
              <ActionButton
                text={
                  <div className="flex items-center justify-center gap-2">
                    <FaBuilding className="text-xl" />
                    מערכת ניהול חניות בבניין מגורים
                  </div>
                }
                primary={false}
                onClick={() => navigate('/building-management')}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
