import React, { useState } from 'react';
import Footer from '../shared/Footer';
import Navbar from "../shared/Navbar";

const ForgotPassword = ({ loggedIn, setLoggedIn, isRegistering }) => {

  document.title = "שחזור סיסמה | Spotly";

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Sending reset link to:', email);
    setMessage('קישור לאיפוס הסיסמה נשלח בהצלחה');
  };

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
       <Navbar
        loggedIn={loggedIn}
        setLoggedIn={setLoggedIn}
        isRegistering={isRegistering}
      />
      <main className="flex-1 bg-gradient-to-b from-blue-50 via-white to-blue-50 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">שחזור סיסמא</h2>
              
              {message && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" role="alert">
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                    אימייל
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
                >
                  שלח קישור לאיפוס סיסמה
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ForgotPassword;
