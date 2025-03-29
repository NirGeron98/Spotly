import React, { useState } from "react";
import Navbar from "../../shared/Navbar/Navbar";
import Footer from "../../shared/Footer/Footer";

const Profile = ({ loggedIn, setLoggedIn }) => {
  const [fullName, setFullName] = useState("ניר המלך");
  const [email, setEmail] = useState("test@test.com");
  const [password, setPassword] = useState("123456");
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsEditing(false); 
    setMessage("הפרטים עודכנו בהצלחה ✅");
  };

  const handleEditClick = () => {
    setMessage("");        
    setIsEditing(true);    
  };

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} />

      <main className="flex-1 bg-gradient-to-b from-blue-50 via-white to-blue-50 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                ניהול פרופיל
              </h2>

              {message && (
                <div
                  className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4"
                  role="alert"
                >
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="fullName" className="block text-gray-700 text-sm font-bold mb-2">
                    שם מלא
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none 
                      ${isEditing ? "focus:ring-2 focus:ring-blue-500" : "bg-gray-100 cursor-not-allowed"}`}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                    אימייל
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none 
                      ${isEditing ? "focus:ring-2 focus:ring-blue-500" : "bg-gray-100 cursor-not-allowed"}`}
                    required
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                    סיסמה
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none 
                      ${isEditing ? "focus:ring-2 focus:ring-blue-500" : "bg-gray-100 cursor-not-allowed"}`}
                    required
                  />
                </div>

                {isEditing && (
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  >
                    שמירה
                  </button>
                )}
              </form>

              {!isEditing && (
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="w-full mt-4 bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none transition duration-200"
                >
                  עריכה
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
