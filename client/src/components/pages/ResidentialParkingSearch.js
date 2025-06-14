import { useState } from "react";
import axios from "axios";
import Navbar from "../shared/Navbar";
import Footer from "../shared/Footer";
import Popup from "../shared/Popup";
import Sidebar from "../shared/Sidebar";
import { format } from "date-fns";
import { geocodeAddress } from "../utils/geocoding";
import { FaSearch, FaParking } from "react-icons/fa";

const ResidentialParkingSearch = ({ loggedIn, setLoggedIn }) => {
  document.title = "חיפוש חניה בבניין מגורים | Spotly";

  const generateBookingSummary = (spot, searchParams) => (
    <div className="text-right text-gray-800 space-y-3 text-sm leading-relaxed">
      <div className="flex justify-between items-center">
        <span className="font-medium">📍 כתובת החנייה:</span>
        <span>
          {`${spot.address?.street} ${spot.address?.number}, ${spot.address?.city}` ||
            "לא ידוע"}
        </span>
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
  );

  const calculateHours = () => {
    const [startH, startM] = searchParams.startTime.split(":").map(Number);
    const [endH, endM] = searchParams.endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const diff = endMinutes - startMinutes;
    return Math.max(1, Math.ceil(diff / 60));
  };

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

  const [fallbackResults, setFallbackResults] = useState([]);
  const [, setLoading] = useState(false);

  //   const runPrivateParkingFallback = async () => {
  //     console.log("🚀 Starting fallback for private parking");

  //     try {
  //       const token = localStorage.getItem("token");
  //       const user = JSON.parse(localStorage.getItem("user"));

  //       console.log("👤 User from localStorage:", user);

  //       // Step 1: Determining building ID
  //       let buildingId = user?.resident_building;
  //       if (!buildingId && user?.managed_buildings?.length > 0) {
  //         buildingId = user.managed_buildings[0];
  //         console.log("🏢 Using managed building:", buildingId);
  //       }

  //       if (!buildingId) {
  //         console.error("❌ Building ID not found");
  //         setPopupData({
  //           title: "מיקום לא זמין",
  //           description: "לא נמצא בניין רשום עבור המשתמש.",
  //           type: "error",
  //         });
  //         return;
  //       }

  //       console.log("🏢 Selected building ID:", buildingId);

  //       // Step 2: Fetching building information
  //       const buildingResponse = await axios.get(
  //         `/api/v1/buildings/${buildingId}`,
  //         { headers: { Authorization: `Bearer ${token}` } }
  //       );
  //       console.log(
  //         "✅ Response from server for building:",
  //         buildingResponse.data
  //       );

  //       const building = buildingResponse.data?.data?.data;
  //       if (!building?.address) {
  //         console.error("❌ No address exists for building");
  //         setPopupData({
  //           title: "מיקום לא זמין",
  //           description: "לא קיימת כתובת לבניין.",
  //           type: "error",
  //         });
  //         return;
  //       }

  //       console.log("📍 Building address:", building.address);

  //       // Step 3: Converting address to coordinates
  //       const geoResult = await geocodeAddress(building.address);
  //       console.log("🗺️ Result from geocodeAddress:", geoResult);

  //       if (!geoResult.success) {
  //         setPopupData({
  //           title: "כתובת לא תקינה",
  //           description: geoResult.message || "שגיאה בהמרת כתובת לקואורדינטות.",
  //           type: "error",
  //         });
  //         return;
  //       }

  //       const { latitude, longitude } = geoResult;

  //       // Step 4: Preparing the request
  //       const requestBody = {
  //         latitude,
  //         longitude,
  //         date: searchParams.date,
  //         startTime: searchParams.startTime,
  //         endTime: searchParams.endTime,
  //         maxPrice: 1000,
  //         maxDistanceKm: 5, // Increased to 5
  //         is_charging_station: searchParams.is_charging_station,
  //         timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  //         ...(searchParams.charger_type
  //           ? { charger_type: searchParams.charger_type }
  //           : {}),
  //       };

  //       console.log("📤 Request to /private/find-optimal:", requestBody);

  //       // Step 5: Sending the request
  //       const response = await axios.post(
  //         "/api/v1/parking-spots/private/find-optimal",
  //         requestBody,
  //         { headers: { Authorization: `Bearer ${token}` } }
  //       );

  //       console.log("📥 Response from /private/find-optimal:", response.data);

  //       const data = response.data?.data;
  //       console.log("📬 Full content of data:", data);

  //       const spots = data?.parkingSpots ?? (data?.spot ? [data.spot] : []);

  //       console.log("📦 All parking spots received:", spots);

  //       if (spots?.length > 0) {
  //         setFallbackResults(spots);
  //         setPopupData({
  //           title: "נמצאו חניות פרטיות זמינות",
  //           description: `מצאנו ${spots.length} חניות פרטיות זמינות.`,
  //           type: "success",
  //           onConfirm: handleConfirmReservation,
  //         });
  //       } else {
  //         setPopupData({
  //           title: "לא נמצאה חניה פרטית זמינה",
  //           description: "ניסינו לחפש חניה פרטית בסביבה אך לא נמצאה זמינות כרגע.",
  //           type: "info",
  //         });
  //       }
  //     } catch (error) {
  //       console.error("❌ Error during fallback:", error);

  //       if (error.response) {
  //         console.log("🔴 error.response.data:", error.response.data);
  //       }

  //       setPopupData({
  //         title: "שגיאה",
  //         description: "אירעה שגיאה בעת ניסיון לחפש חניה פרטית.",
  //         type: "error",
  //       });
  //     }
  //   };

  const runPrivateParkingFallback = async () => {
    console.log("🚀 Starting fallback for private parking");

    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));

      console.log("👤 User from localStorage:", user);

      // Step 1: Fetch private parking spots
      const response = await axios.post(
        "/api/v1/parking-spots/private/find-optimal",
        {
          latitude: 32.0517958,
          longitude: 34.8585438,
          date: searchParams.date,
          startTime: searchParams.startTime,
          endTime: searchParams.endTime,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("📥 Response from /private/find-optimal:", response.data);

      const spots = response.data?.data?.parkingSpots ?? [];

      if (spots.length > 0) {
        spots.forEach((spot, index) => {
          console.log(`Spot ${index + 1} details:`, spot); // Print spot details
        });

        setFallbackResults(spots); // Save private parking spots
        setPopupData({
          title: "נמצאו חניות פרטיות זמינות",
          description: `מצאנו ${spots.length} חניות פרטיות זמינות. בחר חניה להזמנה.`,
          type: "success",
          onConfirm: handleConfirmReservation, // Call handleConfirmReservation to process the booking
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
        description: "אירעה שגיאה בעת ניסיון לחפש חניה פרטית.",
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

  //   const handleConfirmReservation = async (selectedSpot = null) => {
  //     const spotToBook = selectedSpot || foundSpot; // אם לא הועבר spot ספציפי, נשתמש ב-foundSpot

  //     if (!spotToBook) {
  //       console.error("❌ No spot selected for booking");
  //       setPopupData({
  //         title: "שגיאה",
  //         description: "לא נבחרה חנייה להזמנה.",
  //         type: "error",
  //       });
  //       return;
  //     }

  //     const bookingType =
  //       spotToBook.type === "building" ? "building_parking" : "private_parking"; // ודא שזו חניון פרטי

  //     const bookingData = {
  //       spot: spotToBook._id,
  //       booking_type: bookingType, // סוג ההזמנה
  //       start_datetime: `${searchParams.date}T${searchParams.startTime}:00`,
  //       end_datetime: `${searchParams.date}T${searchParams.endTime}:00`,
  //       timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  //     };

  //     console.log("📤 Booking request:", bookingData);

  //     try {
  //       const token = localStorage.getItem("token");

  //       await axios.post("/api/v1/bookings", bookingData, {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       });

  //       setPopupData({
  //         title: "הזמנה בוצעה בהצלחה",
  //         type: "success",
  //         description: generateBookingSummary(spotToBook, searchParams),
  //       });

  //       setFoundSpot(null);
  //       setFallbackResults([]); // נקה את התוצאות לאחר ההזמנה
  //     } catch (error) {
  //       console.error("Failed to confirm booking", error);
  //       setPopupData({
  //         title: "שגיאת הזמנה",
  //         type: "error",
  //         description:
  //           error.response?.data?.message ||
  //           "אירעה שגיאה בעת ניסיון להזמין את החניה.",
  //       });
  //     }
  //   };

  const handleConfirmReservation = async (selectedSpot = null) => {
    const spotToBook = selectedSpot || foundSpot;

    if (!spotToBook) {
      console.error("❌ No spot selected for booking");
      setPopupData({
        title: "שגיאה",
        description: "לא נבחרה חנייה להזמנה.",
        type: "error",
      });
      return;
    }

    const bookingType =
      spotToBook.type === "private" ? "private_parking" : "parking"; // אם זה פרטי, אז זה private_parking אחרת parking

    const bookingData = {
      spot: spotToBook._id,
      booking_type: bookingType, // השתמש בתנאים כדי להבדיל בין חניון פרטי לחניון רגיל
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
      console.error("Failed to confirm booking", error);
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
    setPopupData(null); // Reset popup data
    setFoundSpot(null); // Reset found spot
    setLoading(true); // Start loading

    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));

      // Send the request to the backend
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

      console.log("Response data:", response.data); // Log the response for debugging

      const rawData = response.data?.data;
      const status = response.data?.status;

      console.log("Status:", status);
      console.log("Raw data:", rawData);

      let spots = [];

      if (rawData?.parkingSpots && Array.isArray(rawData.parkingSpots)) {
        spots = rawData.parkingSpots;
        console.log("✅ Found spots in rawData.parkingSpots:", spots);
      } else if (rawData?.spots && Array.isArray(rawData.spots)) {
        spots = rawData.spots;
        console.log("✅ Found spots in rawData.spots:", spots);
      } else if (rawData?.options && Array.isArray(rawData.options)) {
        spots = rawData.options;
        console.log("✅ Found spots in rawData.options:", spots);
      } else if (rawData?.spot) {
        spots = [rawData.spot];
        console.log("✅ Found single spot in rawData.spot:", spots);
      } else if (Array.isArray(rawData)) {
        spots = rawData;
        console.log("✅ rawData is array:", spots);
      } else {
        console.log("❌ No spots found in expected locations");
        console.log(
          "🔍 Full rawData structure:",
          JSON.stringify(rawData, null, 2)
        );
      }

      console.log("📦 Final spots array:", spots);
      console.log("🔢 Number of spots found:", spots.length);

      if (spots && spots.length > 0) {
        setFallbackResults(spots);
        setPopupData({
          title: "נמצאו חניות פרטיות זמינות",
          description: "מצאנו חניות פרטיות זמינות. האם ברצונך להזמין?",
          type: "confirm",
          onConfirm: handleConfirmReservation,
        });
      } else {
        setPopupData({
          title: "לא נמצאה חניה פרטית זמינה",
          description: "ניסינו לחפש חניה פרטית בסביבה אך לא נמצאה זמינות כרגע.",
          type: "info",
        });
      }

      // If no spots found, offer private parking search
      if (status !== "success" || !spots || spots.length === 0) {
        setPopupData({
          title: "לא נמצאה חניה",
          description:
            "לא נמצאה חניה זמינה בבניין שלך לטווח הזמנים שבחרת. האם תרצה לחפש חניה פרטית בתשלום?",
          type: "confirm",
          onConfirm: runPrivateParkingFallback,
        });
        return;
      }

      // If spots are found, show success message and display spot
      const spot = spots[0];
      console.log("✅ Found spot:", spot);
      setFoundSpot(spot);
      setPopupData({
        title: "החניות נמצאו בהצלחה",
        type: "success",
        description: generateBookingSummary(spot, searchParams),
      });
    } catch (err) {
      console.error("Parking request error:", err);
      setPopupData({
        title: "שגיאה",
        description: err.response?.data?.message || "אירעה שגיאה בלתי צפויה",
        type: "error",
      });
    } finally {
      setLoading(false); // Stop loading
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

          {fallbackResults.length > 0 && (
            <div className="mt-10 max-w-6xl mx-auto">
              <h2 className="text-xl font-bold text-blue-800 mb-4 text-center">
                נמצאו {fallbackResults.length} חניות פרטיות זמינות
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fallbackResults.map((spot) => (
                  <div
                    key={spot._id}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow max-w-md"
                  >
                    <div className="h-40 bg-gray-100 flex items-center justify-center relative">
                      <FaParking className="text-blue-400 text-5xl" />
                      <div className="absolute bottom-2 left-2 bg-gray-800 text-white px-3 py-1 rounded-lg text-sm shadow-sm">
                        סה"כ: {calculateHours()} שעות
                      </div>
                    </div>
                    <div className="p-4 text-right">
                      <h3 className="text-md font-bold text-gray-800 mb-1">
                        {spot.address?.street} {spot.address?.number},{" "}
                        {spot.address?.city}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        {searchParams.startTime} - {searchParams.endTime}
                      </p>
                      {spot.distance_km && (
                        <p className="text-sm text-gray-500 mb-2">
                          מרחק: {spot.distance_km.toFixed(1)} ק"מ
                        </p>
                      )}
                      <button
                        onClick={() => {
                          setFoundSpot(spot); // Update foundSpot with selected spot
                          setPopupData({
                            title: "אישור הזמנה",
                            type: "confirm",
                            description: generateBookingSummary(
                              spot,
                              searchParams
                            ),
                            onConfirm: () => handleConfirmReservation(spot), // Pass the selected spot
                          });
                        }}
                        className="mt-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded w-full flex justify-center items-center gap-2"
                      >
                        <FaParking /> הזמן חניה
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
