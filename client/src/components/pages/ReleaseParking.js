import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../shared/Navbar";
import Sidebar from "../shared/Sidebar";
import Footer from "../shared/Footer";

const chargerTypes = ["AC רגיל", "AC מהיר", "DC מהיר", "שקע כוח תעשייתי"];

const ReleaseParking = ({ loggedIn, setLoggedIn }) => {
  document.title = "פינוי החנייה שלי | Spotly";

  const navigate = useNavigate();
  const location = useLocation();
  const isBuildingMode = location?.state?.mode === "building";

  const [current, setCurrent] = useState("release");
  const [parkingSlots, setParkingSlots] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    price: "",
    type: "השכרה רגילה",
    charger: "",
  });

  const user = useMemo(() => {
    return JSON.parse(localStorage.getItem("user")) || {};
  }, []);
  const role = user?.role || "user";

  useEffect(() => {
    if (!user || !user._id) {
      navigate("/login");
    }
  }, [navigate, user]);

  useEffect(() => {
    if (role !== "private_prop_owner" && !isBuildingMode) {
      navigate("/search-parking");
    }
  }, [navigate, role, isBuildingMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSlot = () => {
    const { date, startTime, endTime, price, type, charger } = formData;
    if (
      !date ||
      !startTime ||
      !endTime ||
      (!isBuildingMode && !price) ||
      (type === "טעינה לרכב חשמלי" && !charger)
    )
      return;

    setParkingSlots((prev) => [...prev, { ...formData }]);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      startTime: "",
      endTime: "",
      price: "",
      type: "השכרה רגילה",
      charger: "",
    });
  };

  const handleDelete = (index) => {
    setParkingSlots((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50"
      dir="rtl"
    >
      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
      <div className="flex flex-grow">
        <Sidebar
          current={current}
          setCurrent={setCurrent}
          role={role}
        />
        <main className="flex-1 p-10 mt-16 max-w-[1600px] mx-auto">
          <h1 className="text-3xl font-extrabold text-blue-700 mb-6 text-center">
            פינוי החנייה שלי
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-[3fr_4fr] gap-8">
            {/* Form */}
            <div className="bg-white rounded-xl shadow-md p-6 flex-grow h-full overflow-auto">
              <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">
                הוסף זמינות חדשה
              </h2>
              <p className="text-center text-gray-600 mb-4">
                כתובת החנייה:{" "}
                <span className="font-semibold text-blue-700">
                  {user?.address?.street
                    ? `${user.address.street} ${user.address.number}, ${user.address.city}`
                    : "לא ידועה"}
                </span>
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-semibold text-gray-700">
                    תאריך
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block mb-1 font-semibold text-gray-700">
                      שעת התחלה
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="block mb-1 font-semibold text-gray-700">
                      שעת סיום
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                {/* 🧾 מחיר – לא רלוונטי במסלול בניין */}
                {!isBuildingMode && (
                  <div>
                    <label className="block mb-1 font-semibold text-gray-700">
                      מחיר (₪)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                )}

                <div>
                  <label className="block mb-1 font-semibold text-gray-700">
                    סוג פינוי
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option>השכרה רגילה</option>
                    <option>טעינה לרכב חשמלי</option>
                  </select>
                </div>

                {formData.type === "טעינה לרכב חשמלי" && (
                  <div>
                    <label className="block mb-1 font-semibold text-gray-700">
                      סוג טעינה
                    </label>
                    <select
                      name="charger"
                      value={formData.charger}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">בחר סוג טעינה</option>
                      {chargerTypes.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={handleAddSlot}
                  className="w-full bg-blue-600 text-white font-bold py-2 rounded-md hover:bg-blue-700 transition"
                >
                  הוסף פינוי
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-md p-6 flex-grow h-full overflow-auto">
              <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
                החניות שפירסמת
              </h2>
              {parkingSlots.length === 0 ? (
                <p className="text-gray-600 text-center">אין חניות כרגע.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right table-auto">
                    <thead className="bg-blue-50 text-blue-800">
                      <tr>
                        <th className="px-6 py-2 border-b w-32">תאריך</th>
                        <th className="px-6 py-2 border-b w-40">שעות</th>
                        {!isBuildingMode && (
                          <th className="px-6 py-2 border-b w-24">מחיר</th>
                        )}
                        <th className="px-6 py-2 border-b w-52">סוג</th>
                        <th className="px-6 py-2 border-b w-24">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parkingSlots.map((slot, index) => (
                        <tr key={index} className="hover:bg-blue-50">
                          <td className="px-6 py-2 border-b">{slot.date}</td>
                          <td className="px-6 py-2 border-b">
                            {slot.startTime} - {slot.endTime}
                          </td>
                          {!isBuildingMode && (
                            <td className="px-6 py-2 border-b">
                              {slot.price} ₪
                            </td>
                          )}
                          <td className="px-6 py-2 border-b">
                            {slot.type === "טעינה לרכב חשמלי"
                              ? `${slot.type} (${slot.charger})`
                              : slot.type}
                          </td>
                          <td className="px-6 py-2 border-b space-x-2 rtl:space-x-reverse">
                            <button
                              onClick={() => handleDelete(index)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                            >
                              מחק
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default ReleaseParking;
