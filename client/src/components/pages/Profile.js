import React, { useState, useEffect } from "react";
import Navbar from "../shared/Navbar";
import Footer from "../shared/Footer";
import { userService } from "../../services/userService";

const Profile = ({ loggedIn, setLoggedIn }) => {
  document.title = "ניהול פרופיל | Spotly";

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [loading, setLoading] = useState(!user);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    if (!user) {
      userService.getMe()
        .then((res) => {
          const fetchedUser = res?.data?.user || res?.data?.data?.user || res?.data?.data;
          if (!fetchedUser) throw new Error("User not found");
          localStorage.setItem("user", JSON.stringify(fetchedUser));
          setUser(fetchedUser);
        })
        .catch((err) => {
          console.error("❌ Failed to fetch user:", err);
          setMessage({ type: "error", text: "שגיאה בטעינת פרטי המשתמש" });
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      const [first_name, ...rest] = `${user.first_name} ${user.last_name}`.split(" ");
      const last_name = rest.join(" ");
      const email = user.email;
      const phone_number = user.phone_number;

      if (!/^\d{10}$/.test(phone_number)) {
        return setMessage({ type: "error", text: "מספר טלפון חייב להכיל בדיוק 10 ספרות" });
      }

      await userService.updateMe({ first_name, last_name, email, phone_number, });

      setIsEditing(false);
      setMessage({ type: "success", text: "הפרטים עודכנו בהצלחה ✅" });

      const updatedUser = { ...user, first_name, last_name,email, phone_number,};
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
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

  if (loading) return <div className="text-center py-10">טוען פרופיל...</div>;

  return (
    <div className="pt-[68px] min-h-screen flex flex-col" dir="rtl">
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
                    <label className="block text-gray-700 text-sm font-bold mb-2">שם מלא</label>
                    <input
                      type="text"
                      value={`${user.first_name} ${user.last_name}`}
                      onChange={(e) => {
                        const [first_name, ...rest] = e.target.value.split(" ");
                        const last_name = rest.join(" ");
                        setUser((prev) => ({ ...prev, first_name, last_name }));
                      }}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none ${
                        isEditing ? "focus:ring-2 focus:ring-blue-500" : "bg-gray-100 cursor-not-allowed"
                      }`}
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">אימייל</label>
                    <input
                      type="email"
                      value={user.email}
                      onChange={(e) => setUser((prev) => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none ${
                        isEditing ? "focus:ring-2 focus:ring-blue-500" : "bg-gray-100 cursor-not-allowed"
                      }`}
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">מספר טלפון</label>
                    <input
                      type="tel"
                      value={user.phone_number}
                      dir="rtl"
                      onChange={(e) => setUser((prev) => ({ ...prev, phone_number: e.target.value }))}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none ${
                        isEditing ? "focus:ring-2 focus:ring-blue-500" : "bg-gray-100 cursor-not-allowed"
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
                    <label className="block text-gray-700 text-sm font-bold mb-2">סיסמה נוכחית</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">סיסמה חדשה</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">אימות סיסמה חדשה</label>
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
