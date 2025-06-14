// ResidentialParkingSearch.jsx
import { useState } from "react";
import axios from "axios";
import Navbar from "../shared/Navbar";
import Footer from "../shared/Footer";
import Popup from "../shared/Popup";
import Sidebar from "../shared/Sidebar";
import { format } from "date-fns";
import { FaSearch } from "react-icons/fa";

const ResidentialParkingSearch = ({ loggedIn, setLoggedIn }) => {
  document.title = "חיפוש חניה בבניין מגורים | Spotly";

  const messages = {
    successTitle: "נמצאה חניה והוזמנה בהצלחה",
    successDescription: "החנייה הוזמנה בהצלחה לטווח הזמן שבחרת.",
    acceptedTitle: "אין חניה זמינה כעת",
    acceptedDescription:
      "הבקשה שלך נקלטה ותיבחן אוטומטית. תקבל עדכון כשתוקצה לך חניה.",
    unexpectedTitle: "שגיאה",
    unexpectedDescription: "התגובה מהשרת לא הייתה צפויה.",
    errorTitle: "שגיאה",
    errorDescription: "אירעה שגיאה בלתי צפויה בעת שליחת הבקשה.",
    bookingError: "אירעה שגיאה בעת ניסיון להזמין את החנייה.",
  };

  const getRoundedTime = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;

    if (roundedMinutes === 60) {
      now.setHours(now.getHours() + 1, 0);
    } else {
      now.setMinutes(roundedMinutes);
    }

    if (now.getHours() < 6) {
      now.setHours(6, 0, 0, 0);
    }

    return now;
  };

  const getEndTime = (startDate) => {
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const maxEnd = new Date(startDate);
    maxEnd.setHours(23, 59, 0, 0);
    return endDate > maxEnd ? maxEnd : endDate;
  };

  const [searchParams, setSearchParams] = useState(() => {
    const start = getRoundedTime();
    const end = getEndTime(start);
    return {
      date: new Date().toISOString().split("T")[0],
      startTime: format(start, "HH:mm"),
      endTime: format(end, "HH:mm"),
      is_charging_station: false,
      charger_type: "",
    };
  });

  const [popupData, setPopupData] = useState(null);
  const [foundSpot, setFoundSpot] = useState(null);

  const chargerTypes = [
    { id: "Type 1", label: "סוג 1" },
    { id: "Type 2", label: "סוג 2" },
    { id: "CCS", label: "CCS" },
    { id: "CHAdeMO", label: "CHAdeMO" },
    { id: "Other", label: "אחר" },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "startTime") {
      const [hours, minutes] = value.split(":").map(Number);
      const startDateTime = new Date();
      startDateTime.setHours(hours, minutes, 0, 0);
      const newEndTime = getEndTime(startDateTime);
      return setSearchParams((prev) => ({
        ...prev,
        startTime: value,
        endTime: format(newEndTime, "HH:mm"),
      }));
    }
  };

  const searchParkingSpots = async (e) => {
    e.preventDefault();
    setPopupData(null);
    setFoundSpot(null);

    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));

      const response = await axios.post(
        "/api/v1/parking-spots/building/find-available",
        {
          building_id: user.resident_building,
          start_datetime: `${searchParams.date}T${searchParams.startTime}:00`,
          end_datetime: `${searchParams.date}T${searchParams.endTime}:00`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const status = response.data?.status;
      const spot = response.data?.data?.spot;

      if (status === "success" && spot) {
        // Immediate booking success – spot allocated now
        setFoundSpot(spot);
        setPopupData({
          title: messages.successTitle,
          type: "success",
          description: (
            <div className="text-right text-gray-800 space-y-3 text-sm leading-relaxed">
              <div className="flex justify-between items-center">
                <span className="font-medium">📍 מספר חנייה:</span>
                <span>{spot.spot_number || "לא ידוע"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">📅 תאריך ההזמנה:</span>
                <span>{searchParams.date}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">🕒 שעת התחלה:</span>
                <span>{searchParams.startTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">🕓 שעת סיום:</span>
                <span>{searchParams.endTime}</span>
              </div>
            </div>
          ),
        });
      } else if (status === "accepted") {
        setFoundSpot(null); // clean up just in case
        // User was added to batch or waiting queue
        setPopupData({
          title: messages.acceptedTitle,
          description: messages.acceptedDescription,
          type: "info",
        });
      } else {
        // Unexpected format
        setPopupData({
          title: messages.unexpectedTitle,
          description: messages.unexpectedDescription,
          type: "error",
        });
      }
    } catch (err) {
      console.error("Parking request error:", err);
      setPopupData({
        title: messages.errorTitle,
        description: err.response?.data?.message || messages.errorDescription,
        type: "error",
      });
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50"
      dir="rtl"
    >
      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
      <div className="flex flex-grow">
        <Sidebar
          current="residential-parking"
          setCurrent={() => {}}
          role="building_resident"
        />
        <main className="flex-grow p-4 md:p-6 md:mr-5 mt-12">
          <h1 className="pt-[68px] text-3xl font-extrabold text-blue-700 mb-4 text-center">
            חיפוש חניה בבניין מגורים
          </h1>
          <p className="text-gray-600 text-lg mb-8 text-center">
            מצא חניה בבניין מגורים בתאריך ובשעות הרצויות
          </p>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8 max-w-4xl mx-auto">
            <form
              onSubmit={searchParkingSpots}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {/* Date selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  תאריך
                </label>
                <input
                  type="date"
                  name="date"
                  value={searchParams.date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 text-right"
                />
              </div>

              {/* Start time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שעת התחלה
                </label>
                <select
                  name="startTime"
                  value={searchParams.startTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 text-right"
                >
                  {Array.from({ length: 72 }).map((_, i) => {
                    const hours = Math.floor(i / 4) + 6;
                    const minutes = (i % 4) * 15;
                    const timeString = `${hours
                      .toString()
                      .padStart(2, "0")}:${minutes
                      .toString()
                      .padStart(2, "0")}`;
                    return (
                      <option key={i} value={timeString}>
                        {timeString}
                      </option>
                    );
                  })}
                  <option value="23:59">23:59</option>
                </select>
              </div>

              {/* End time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שעת סיום
                </label>
                <select
                  name="endTime"
                  value={searchParams.endTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-md border border-gray-300 text-right"
                >
                  {Array.from({ length: 72 }).map((_, i) => {
                    const hours = Math.floor(i / 4) + 6;
                    const minutes = (i % 4) * 15;
                    const timeString = `${hours
                      .toString()
                      .padStart(2, "0")}:${minutes
                      .toString()
                      .padStart(2, "0")}`;
                    return (
                      <option key={i} value={timeString}>
                        {timeString}
                      </option>
                    );
                  })}
                  <option value="23:59">23:59</option>
                </select>
              </div>

              {/* EV charging filter */}
              <div className="md:col-span-3">
                <h3 className="font-semibold mb-2">עמדת טעינה לרכב חשמלי</h3>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="is_charging_station"
                    name="is_charging_station"
                    checked={searchParams.is_charging_station}
                    onChange={handleInputChange}
                    className="ml-2"
                  />
                  <label htmlFor="is_charging_station" className="text-sm">
                    חפש חניות עם עמדת טעינה
                  </label>
                </div>

                {searchParams.is_charging_station && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      סוג מטען
                    </label>
                    <select
                      name="charger_type"
                      value={searchParams.charger_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-md border border-gray-300"
                    >
                      <option value="">כל סוגי המטענים</option>
                      {chargerTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Search button */}
              <div className="md:col-span-3 flex justify-center mt-4">
                <button
                  type="submit"
                  className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                >
                  <FaSearch /> חפש חניה
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
      <Footer />

      {popupData && (
        <Popup
          title={popupData.title}
          description={popupData.description}
          type={popupData.type || "info"}
          onClose={() => {
            setPopupData(null);
            setFoundSpot(null);
          }}
          onConfirm={
            popupData.type === "confirm" ? popupData.onConfirm : undefined
          }
        />
      )}
    </div>
  );
};

export default ResidentialParkingSearch;
