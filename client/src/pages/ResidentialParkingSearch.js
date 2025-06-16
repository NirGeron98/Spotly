import { useState } from "react";
import axios from "axios";
import Navbar from "../components/shared/Navbar";
import Footer from "../components/shared/Footer";
import Popup from "../components/shared/Popup";
import Sidebar from "../components/shared/Sidebar";
import { format } from "date-fns";
import {
  FaSearch,
  FaParking,
  FaBolt,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaBuilding,
  FaLayerGroup,
  FaUser,
  FaPhoneAlt,
} from "react-icons/fa";

const ResidentialParkingSearch = ({ loggedIn, setLoggedIn }) => {
  document.title = "חיפוש חניה בבניין מגורים | Spotly";

  const generateBookingSummary = (spot, searchParams) => (
    <div className="text-right text-gray-800 space-y-4 text-sm leading-relaxed bg-gray-50 p-4 rounded-lg">
      {/* Booking date */}
      <div className="flex justify-between items-center border-b pb-2">
        <span className="font-semibold text-blue-700 flex items-center gap-2">
          <FaCalendarAlt /> תאריך ההזמנה:
        </span>
        <span className="font-medium">{searchParams.date}</span>
      </div>

      {/* Start time */}
      <div className="flex justify-between items-center border-b pb-2">
        <span className="font-semibold text-blue-700 flex items-center gap-2">
          <FaClock /> שעת התחלה:
        </span>
        <span className="font-medium">{searchParams.startTime}</span>
      </div>

      {/* End time */}
      <div className="flex justify-between items-center border-b pb-2">
        <span className="font-semibold text-blue-700 flex items-center gap-2">
          <FaClock /> שעת סיום:
        </span>
        <span className="font-medium">{searchParams.endTime}</span>
      </div>

      {/* Spot number */}
      {spot.spot_number && (
        <div className="flex justify-between items-center border-b pb-2">
          <span className="font-semibold text-blue-700 flex items-center gap-2">
            <FaParking /> מספר חניה:
          </span>
          <span className="font-medium">{spot.spot_number}</span>
        </div>
      )}

      {/* Floor */}
      {spot.floor && (
        <div className="flex justify-between items-center border-b pb-2">
          <span className="font-semibold text-blue-700 flex items-center gap-2">
            <FaLayerGroup /> קומה:
          </span>
          <span className="font-medium">{spot.floor}</span>
        </div>
      )}

      {/* Owner name */}
      {spot.owner?.first_name && (
        <div className="flex justify-between items-center border-b pb-2">
          <span className="font-semibold text-blue-700 flex items-center gap-2">
            <FaUser /> שם בעל החניה:
          </span>
          <span className="font-medium">
            {spot.owner.first_name} {spot.owner.last_name}
          </span>
        </div>
      )}

      {/* Phone number */}
      {spot.owner?.phone_number && (
        <div className="flex justify-between items-center">
          <span className="font-semibold text-blue-700 flex items-center gap-2">
            <FaPhoneAlt /> מספר טלפון:
          </span>
          <span className="font-medium">{spot.owner.phone_number}</span>
        </div>
      )}
    </div>
  );

  const calculateHours = () => {
    const [startH, startM] = searchParams.startTime.split(":").map(Number);
    const [endH, endM] = searchParams.endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const diff = endMinutes - startMinutes;
    return Math.max(1, Math.ceil(diff / 60));
  };

  const fetchOwnerDetails = async (ownerId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/v1/users/${ownerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data.user;
    } catch (error) {
      console.error("שגיאה בשליפת בעל החניה:", error);
      return null;
    }
  };

  const [fallbackResults, setFallbackResults] = useState([]);
  const [, setLoading] = useState(false);

  const runPrivateParkingFallback = async () => {
    console.log("🚀 Starting fallback for private parking");

    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));

      // ✅ שימוש בכתובת של המשתמש, אם קיימת
      const { latitude = 32.0517958, longitude = 34.8585438 } =
        user?.address || {};

      const requestBody = {
        latitude,
        longitude,
        date: searchParams.date,
        startTime: searchParams.startTime,
        endTime: searchParams.endTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      // ✅ הוספת פילטרים אם רלוונטיים
      if (searchParams.is_charging_station) {
        requestBody.is_charging_station = true;
        if (searchParams.charger_type) {
          requestBody.charger_type = searchParams.charger_type;
        }
      }

      console.log("📤 Sending fallback request with:", requestBody);

      const response = await axios.post(
        "/api/v1/parking-spots/private/find-optimal",
        requestBody,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const spots = response.data?.data?.parkingSpots ?? [];

      if (spots.length > 0) {
        spots.forEach((spot, index) => {
          console.log(`✅ Found private spot ${index + 1}:`, spot);
        });

        setFallbackResults(spots);
        setPopupData({
          title: "נמצאו חניות פרטיות זמינות",
          description: `מצאנו ${spots.length} חניות פרטיות זמינות. בחר חניה להזמנה.`,
          type: "success",
          onConfirm: handleConfirmReservation,
        });
      } else {
        setPopupData({
          title: "לא נמצאה חניה פרטית זמינה",
          description: "לא נמצאה חנייה פרטית בתנאים שנבחרו.",
          type: "info",
        });
      }
    } catch (error) {
      console.error("❌ Error during fallback:", error);
      setPopupData({
        title: "שגיאה",
        description:
          error.response?.data?.message ||
          "אירעה שגיאה בעת ניסיון לחפש חניה פרטית.",
        type: "error",
      });
    }
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

  const handleJoinWaitlist = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));

      await axios.post(
        "/api/v1/parking-spots/building/find-available",
        {
          building_id: user.resident_building,
          start_datetime: `${searchParams.date}T${searchParams.startTime}:00`,
          end_datetime: `${searchParams.date}T${searchParams.endTime}:00`,
          confirm_waitlist: true,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPopupData({
        title: "נכנסת לרשימת המתנה",
        description: "הבקשה שלך נשמרה. נעדכן אותך אם תתפנה חניה.",
        type: "success",
      });
    } catch (error) {
      console.error("❌ Failed to join waitlist:", error);
      setPopupData({
        title: "שגיאה בהצטרפות לרשימת המתנה",
        description:
          error.response?.data?.message ||
          "אירעה שגיאה בעת ניסיון להצטרף לרשימת ההמתנה.",
        type: "error",
      });
    }
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

  const handleConfirmReservation = async (selectedSpot = null) => {
    const spotToBook = selectedSpot || foundSpot;

    if (!spotToBook) {
      setPopupData({
        title: "שגיאה",
        description: "לא נבחרה חנייה להזמנה.",
        type: "error",
      });
      return;
    }

    // ✅ תיקון: קביעת סוג החנייה על סמך spot_type
    const spotType = spotToBook.spot_type || spotToBook.type; // תמיכה בשני פורמטים
    const bookingType = spotToBook.is_charging_station ? "charging" : "parking";

    const bookingData = {
      spot: spotToBook._id,
      booking_type: bookingType,
      start_datetime: `${searchParams.date}T${searchParams.startTime}:00`,
      end_datetime: `${searchParams.date}T${searchParams.endTime}:00`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    console.log("📤 Booking request:", bookingData);

    try {
      const token = localStorage.getItem("token");

      await axios.post("/api/v1/bookings", bookingData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPopupData({
        title: "הזמנה בוצעה בהצלחה",
        type: "success",
        description: generateBookingSummary(spotToBook, searchParams),
      });

      setFoundSpot(null);
      setFallbackResults([]);
    } catch (error) {
      console.error("❌ Failed to confirm booking:", error);

      setPopupData({
        title: "שגיאת הזמנה",
        type: "error",
        description:
          error.response?.data?.message ||
          "אירעה שגיאה בעת ניסיון להזמין את החניה.",
      });
    }
  };

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
    setLoading(true);

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

      const rawData = response.data?.data;
      const status = response.data?.status;

      const todayDateString = new Date().toISOString().split("T")[0];
      const isToday = searchParams.date === todayDateString;

      let spots = [];

      if (rawData?.parkingSpots && Array.isArray(rawData.parkingSpots)) {
        spots = rawData.parkingSpots;
      } else if (rawData?.spots && Array.isArray(rawData.spots)) {
        spots = rawData.spots;
      } else if (rawData?.options && Array.isArray(rawData.options)) {
        spots = rawData.options;
      } else if (rawData?.spot) {
        spots = [rawData.spot];
      } else if (Array.isArray(rawData)) {
        spots = rawData;
      }

      if (status === "success" && spots.length > 0) {
        const spot = spots[0];
        const ownerDetails = await fetchOwnerDetails(spot.owner);
        spot.owner = ownerDetails;
        setFoundSpot(spot);

        setPopupData({
          title: "חניה נמצאה בהצלחה",
          type: "confirm",
          description: generateBookingSummary(spot, searchParams),
          onConfirm: () => handleConfirmReservation(spot),
        });
        return;
      }

      if (status === "no_spot_today") {
        setPopupData({
          title: "לא נמצאה חניה זמינה להיום",
          description:
            "האם תרצה להיכנס לרשימת ההמתנה ולהיות מוקצה אוטומטית במקרה של ביטול?",
          type: "confirm",
          onConfirm: () => handleJoinWaitlist(),
        });
        return;
      }

      if (status === "no_spot_future") {
        setPopupData({
          title: "לא נמצאה חניה בזמן שביקשת",
          description:
            "האם תרצה להצטרף לרשימת ההמתנה? הבקשה תיבחן במהלך הלילה ותקבל תשובה אם תתפנה חניה.",
          type: "confirm",
          onConfirm: () => handleJoinWaitlist(),
        });
        return;
      }

      if (status === "accepted") {
        if (isToday) {
          setPopupData({
            title: "לא נמצאה חניה זמינה בבניין",
            description:
              "לא נמצאה חניה בזמנים שביקשת. האם תרצה לחפש חניה פרטית באזורך?",
            type: "confirm",
            onConfirm: runPrivateParkingFallback,
          });
        } else {
          setPopupData({
            title: "לא נמצאה חניה זמינה בבניין",
            description:
              "לא נמצאה חניה בזמנים שביקשת. האם תרצה להיכנס לרשימת ההמתנה?",
            type: "confirm",
            onConfirm: () => {
              setPopupData({
                title: "האם לחפש חניה פרטית בתשלום?",
                description:
                  "נוכל לנסות לחפש עבורך חניה פרטית באזורך לפי קריטריונים שתבחר.",
                type: "confirm",
                onConfirm: runPrivateParkingFallback,
              });
            },
          });
        }
        return;
      }

      setPopupData({
        title: "שגיאה לא צפויה",
        description:
          "השרת לא החזיר חניה זמינה או לא ניתן היה להבין את התשובה. מומלץ לנסות שוב מאוחר יותר.",
        type: "error",
      });
    } catch (err) {
      console.error("Parking request error:", err);
      setPopupData({
        title: "שגיאת חיפוש",
        description:
          err.response?.data?.message || "אירעה שגיאה בלתי צפויה בעת החיפוש.",
        type: "error",
      });
    } finally {
      setLoading(false);
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
        <main className="flex-1 p-4 md:p-10 mt-16 w-full mr-64 lg:mr-80 transition-all duration-300 min-w-0">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <FaBuilding className="text-blue-600 text-5xl ml-4 pt-[20px]" />
              <h1 className="pt-[20px] text-4xl font-extrabold text-blue-700">
                חיפוש חניה בבניין מגורים
              </h1>
            </div>

            <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
              מצא חניה בבניין מגורים בתאריך ובשעות הרצויות
            </p>
          </div>

          {/* Search Form Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-12 max-w-5xl mx-auto border border-blue-100">
            <div className="flex items-center justify-center mb-8">
              <FaSearch className="text-blue-600 text-2xl ml-6" />
              <h2 className="text-2xl font-bold text-gray-800">פרטי החיפוש</h2>
            </div>

            <form
              onSubmit={searchParkingSpots}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Date selection */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FaCalendarAlt className="ml-2 text-blue-600" />
                  תאריך
                </label>
                <input
                  type="date"
                  name="date"
                  value={searchParams.date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                />
              </div>

              {/* Start time */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FaClock className="ml-2 text-green-600" />
                  שעת התחלה
                </label>
                <select
                  name="startTime"
                  value={searchParams.startTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
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
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FaClock className="ml-2 text-red-600" />
                  שעת סיום
                </label>
                <select
                  name="endTime"
                  value={searchParams.endTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
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
              <div className="md:col-span-3 bg-green-50 p-6 rounded-xl border border-green-200">
                <div className="flex items-center mb-4">
                  <FaBolt className="text-green-600 text-xl ml-3" />
                  <h3 className="font-bold text-green-800 text-lg">
                    עמדת טעינה לרכב חשמלי
                  </h3>
                </div>

                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="is_charging_station"
                    name="is_charging_station"
                    checked={searchParams.is_charging_station}
                    onChange={handleInputChange}
                    className="ml-3 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label
                    htmlFor="is_charging_station"
                    className="text-sm font-medium text-green-700"
                  >
                    חפש חניות עם עמדת טעינה
                  </label>
                </div>

                {searchParams.is_charging_station && (
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-green-700 mb-2">
                      סוג מטען
                    </label>
                    <select
                      name="charger_type"
                      value={searchParams.charger_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white"
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
              <div className="md:col-span-3 flex justify-center mt-6">
                <button
                  type="submit"
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <FaSearch className="text-xl" />
                  <span>חפש חניה בבניין</span>
                </button>
              </div>
            </form>
          </div>

          {/* Results Section */}
          {fallbackResults.length > 0 && (
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  נמצאו {fallbackResults.length} חניות פרטיות זמינות
                </h2>
                <p className="text-gray-600">בחר את החנייה המתאימה לך</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fallbackResults.map((spot, index) => (
                  <div
                    key={spot._id}
                    className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                  >
                    {/* Card Header */}
                    <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-black opacity-10"></div>
                      <FaParking className="text-white text-6xl z-10 group-hover:scale-110 transition-transform duration-300" />

                      {/* Duration Badge */}
                      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                        <FaClock className="inline ml-1" />
                        {calculateHours()} שעות
                      </div>

                      {/* Spot Number */}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-xs font-bold">
                        מספר {index + 1}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                            {spot.address?.street} {spot.address?.number}
                          </h3>
                          <p className="text-gray-600 text-sm mb-1 flex items-center">
                            <FaMapMarkerAlt className="ml-2 text-gray-400" />
                            {spot.address?.city}
                          </p>
                        </div>
                      </div>

                      {/* Time Info */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center">
                            <FaClock className="ml-1" />
                            זמן חנייה
                          </span>
                          <span className="font-semibold text-gray-800">
                            {searchParams.startTime} - {searchParams.endTime}
                          </span>
                        </div>
                      </div>

                      {/* Distance */}
                      {spot.distance_km && (
                        <div className="mb-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <FaMapMarkerAlt className="ml-1" />
                            מרחק: {spot.distance_km.toFixed(1)} ק"מ
                          </span>
                        </div>
                      )}

                      {/* Book Button */}
                      <button
                        onClick={() => {
                          setFoundSpot(spot);
                          setPopupData({
                            title: "אישור הזמנה",
                            type: "confirm",
                            description: generateBookingSummary(
                              spot,
                              searchParams
                            ),
                            onConfirm: () => handleConfirmReservation(spot),
                          });
                        }}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl flex justify-center items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        <FaParking className="text-lg" />
                        <span>הזמן חניה זו</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
