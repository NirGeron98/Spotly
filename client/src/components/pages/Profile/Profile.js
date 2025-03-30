import React, { useState, useEffect } from "react";
import Navbar from "../../shared/Navbar/Navbar";
import Footer from "../../shared/Footer/Footer";
import { userService } from "../../../services/userService";

const Profile = ({ loggedIn, setLoggedIn }) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userService.getMe();
        const user = res?.data?.user || res?.data?.data?.user || res?.data?.data;

        if (!user) throw new Error("User not found");

        setFullName(`${user.first_name} ${user.last_name}`);
        setEmail(user.email);
      } catch (err) {
        console.error("❌ Failed to fetch user:", err);
        setMessage({ type: "error", text: "שגיאה בטעינת פרטי המשתמש" });
      }
    };

    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      const [first_name, ...rest] = fullName.split(" ");
      const last_name = rest.join(" ");

      await userService.updateMe({ first_name, last_name, email });

      setIsEditing(false);
      setMessage({ type: "success", text: "הפרטים עודכנו בהצלחה ✅" });
    } catch (err) {
      console.error("❌ Update error:", err);
      setMessage({ type: "error", text: "שגיאה בעדכון הפרטים" });
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return setMessage({ type: "error", text: "יש למלא את כל השדות" });
    }

    if (newPassword !== confirmNewPassword) {
      return setMessage({ type: "error", text: "הסיסמאות אינן תואמות" });
    }

    try {
      await userService.updatePassword({
        passwordCurrent: currentPassword,
        password: newPassword,
        passwordConfirm: confirmNewPassword,
      });

      setMessage({ type: "success", text: "הסיסמה עודכנה בהצלחה ✅" });
      setIsChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      console.error("Password change error:", err);
      setMessage({ type: "error", text: "סיסמה נוכחית שגויה או שגיאה בעדכון" });
    }
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
                  className={`border px-4 py-3 rounded mb-4 ${
                    message.type === "error"
                      ? "bg-red-100 border-red-400 text-red-700"
                      : "bg-green-100 border-green-400 text-green-700"
                  }`}
                  role="alert"
                >
                  <span>{message.text}</span>
                </div>
              )}

              {!isChangingPassword ? (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      שם מלא
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none ${
                        isEditing
                          ? "focus:ring-2 focus:ring-blue-500"
                          : "bg-gray-100 cursor-not-allowed"
                      }`}
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      אימייל
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none ${
                        isEditing
                          ? "focus:ring-2 focus:ring-blue-500"
                          : "bg-gray-100 cursor-not-allowed"
                      }`}
                    />
                  </div>

                  <div className="flex gap-4">
                    {isEditing ? (
                      <button
                        onClick={handleSaveProfile}
                        className="w-full bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300"
                      >
                        שמירה
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setMessage("");
                          setIsEditing(true);
                        }}
                        className="w-full bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300"
                      >
                        עריכה
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setMessage("");
                        setIsChangingPassword(true);
                      }}
                      className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700"
                    >
                      שינוי סיסמה
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      סיסמה נוכחית
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      סיסמה חדשה
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      אימות סיסמה חדשה
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleUpdatePassword}
                      className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700"
                    >
                      שמירת סיסמה
                    </button>

                    <button
                      onClick={() => {
                        setIsChangingPassword(false);
                        setMessage("");
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmNewPassword("");
                      }}
                      className="w-full bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-400"
                    >
                      חזרה
                    </button>
                  </div>
                </>
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
