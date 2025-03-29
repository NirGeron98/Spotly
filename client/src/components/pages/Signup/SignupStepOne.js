import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../shared/Navbar/Navbar';
import Footer from '../../shared/Footer/Footer';

const SignupStepOne = ({ loggedIn, setLoggedIn, isRegistering }) => {
  const navigate = useNavigate();

  const handleNext = () => {
    navigate('/signup-details');
  };

    const buttonStyle =
    'w-32 bg-blue-200 text-blue-800 font-bold py-2 px-4 rounded-md hover:bg-blue-300 transition duration-200';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50">
            <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} isRegistering={isRegistering} />

      <main className="flex-1 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">הרשמה</h2>

              <form>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    שם מלא
                  </label>
                  <input
                    type="text"
                    placeholder='שם מלא'
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    אימייל
                  </label>
                  <input
                    type="email"
                    placeholder='אימייל'
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    סיסמה
                  </label>
                  <input
                    type="password"
                    placeholder='סיסמה'
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    אימות סיסמה
                  </label>
                  <input
                    type="password"
                    placeholder='אימות סיסמה'
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button type="button" onClick={handleNext} className={buttonStyle}>
                    המשך
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />

    </div>
  );
};

export default SignupStepOne;
