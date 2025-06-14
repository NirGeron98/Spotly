import React, { useState, useEffect } from "react";
import Navbar from "../shared/Navbar";
import Footer from "../shared/Footer";
import { userService } from "../../services/userService";

const Profile = ({ loggedIn, setLoggedIn }) => {
  document.title = "ניהול פרופיל | Spotly";

  // State for the user data from the server/storage
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  // New state to hold form data only during editing
  const [formData, setFormData] = useState(null);

  const [loading, setLoading] = useState(!user);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // State for password change form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    if (!user) {
      userService
        .getMe()
        .then((res) => {
          const fetchedUser =
            res?.data?.user || res?.data?.data?.user || res?.data?.data;
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
  }, [user]); // Run only once on component mount

  const handleStartEditing = () => {
    setMessage("");
    setIsEditing(true);
    // Initialize formData with current user details when editing starts
    setFormData({
      fullName: `${user.first_name} ${user.last_name}`,
      email: user.email,
      phone_number: user.phone_number,
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setMessage("");
    setFormData(null); // Discard changes by clearing formData
  };

  const handleSaveProfile = async () => {
    // Logic now uses data from the 'formData' state
    try {
      const [first_name, ...rest] = formData.fullName.trim().split(" ");
      const last_name = rest.join(" ");

      if (!first_name) {
        return setMessage({ type: "error", text: "שם מלא הוא שדה חובה" });
      }

      if (!/^\d{10}$/.test(formData.phone_number)) {
        return setMessage({
          type: "error",
          text: "מספר טלפון חייב להכיל בדיוק 10 ספרות",
        });
      }

      // Prepare data for API call from formData
      const updatedData = {
        first_name,
        last_name,
        email: formData.email,
        phone_number: formData.phone_number,
        ...(user.role === "private_prop_owner" && {
          default_parking_price: user.default_parking_price,
        }),
      };

      await userService.updateMe(updatedData);

      if (user.role === "private_prop_owner") {
        const spotsRes = await userService.getMySpots();
        const privateSpot = spotsRes?.data?.parkingSpots?.find(
          (s) => s.spot_type === "private"
        );

        if (privateSpot) {
          await userService.updateParkingSpot(privateSpot._id, {
            hourly_price: user.default_parking_price,
          });
        }
      }

      // Prepare the new user object for the main state
      const updatedUser = {
        ...user,
        first_name,
        last_name,
        email: formData.email,
        phone_number: formData.phone_number,
      };

      // Update main state and localStorage
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setIsEditing(false);
      setMessage({ type: "success", text: "הפרטים עודכנו בהצלחה ✅" });
      setFormData(null); // Clear temporary form data
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

  const handleFormInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        טוען פרופיל...
      </div>
    );

  return (
    <div className="pt-[68px] min-h-screen flex flex-col bg-gray-50" dir="rtl">
      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} />

      <main className="flex-1 py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 sm:p-8">
              {!isChangingPassword ? (
                <>
                  <div className="flex flex-col items-center text-center mb-8">
                    <div className="flex items-center justify-center h-24 w-24 mb-4 rounded-full bg-blue-100 text-blue-500">
                      <span className="text-4xl font-bold">
                        {user?.first_name?.charAt(0)}
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      {`${user.first_name} ${user.last_name}`}
                    </h2>
                    <p className="text-md text-gray-500 mt-1">{user.email}</p>
                  </div>
                </>
              ) : (
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900">
                    שינוי סיסמה
                  </h2>
                  <p className="text-md text-gray-500 mt-1">
                    שמור על חשבונך מאובטח
                  </p>
                </div>
              )}

              {message && (
                <div
                  className={`border text-center px-4 py-3 rounded-lg mb-6 ${
                    message.type === "error"
                      ? "bg-red-50 border-red-300 text-red-800"
                      : "bg-green-50 border-green-300 text-green-800"
                  }`}
                  role="alert"
                >
                  <span>{message.text}</span>
                </div>
              )}

              {!isChangingPassword ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      שם מלא
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={
                        isEditing
                          ? formData.fullName
                          : `${user.first_name} ${user.last_name}`
                      }
                      onChange={handleFormInputChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border rounded-lg transition-colors duration-300 ${
                        isEditing
                          ? "bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          : "bg-gray-50 border-transparent text-gray-800 font-medium cursor-not-allowed"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      אימייל
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={isEditing ? formData.email : user.email}
                      onChange={handleFormInputChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border rounded-lg transition-colors duration-300 ${
                        isEditing
                          ? "bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          : "bg-gray-50 border-transparent text-gray-800 font-medium cursor-not-allowed"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      מספר טלפון
                    </label>
                    <input
                      dir="rtl"
                      type="tel"
                      name="phone_number"
                      value={
                        isEditing ? formData.phone_number : user.phone_number
                      }
                      onChange={handleFormInputChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border rounded-lg transition-colors duration-300 ${
                        isEditing
                          ? "bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          : "bg-gray-50 border-transparent text-gray-800 font-medium cursor-not-allowed"
                      }`}
                    />
                  </div>

                  <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleSaveProfile}
                          className="w-full flex-1 bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 order-1 sm:order-2"
                        >
                          שמירת שינויים
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="w-full flex-1 bg-gray-200 text-gray-800 font-bold py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-300 order-2 sm:order-1"
                        >
                          ביטול
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleStartEditing}
                          className="w-full sm:w-auto flex-1 bg-blue-50 text-blue-700 font-bold py-2.5 px-4 rounded-lg hover:bg-blue-100 transition-colors duration-300"
                        >
                          עריכת פרטים
                        </button>
                        <button
                          onClick={() => {
                            setMessage("");
                            setIsEditing(false);
                            setIsChangingPassword(true);
                          }}
                          className="w-full sm:w-auto flex-1 text-gray-700 font-bold py-2.5 px-4 rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors duration-300"
                        >
                          שינוי סיסמה
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      סיסמה נוכחית
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      סיסמה חדשה
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      אימות סיסמה חדשה
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleUpdatePassword}
                      className="w-full flex-1 bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300"
                    >
                      עדכון סיסמה
                    </button>
                    <button
                      onClick={() => {
                        setIsChangingPassword(false);
                        setMessage("");
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmNewPassword("");
                      }}
                      className="w-full flex-1 bg-gray-200 text-gray-800 font-bold py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                    >
                      חזרה
                    </button>
                  </div>
                </div>
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