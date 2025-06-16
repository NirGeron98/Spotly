import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Navbar from "../shared/Navbar";
import Sidebar from "../shared/Sidebar";
import Footer from "../shared/Footer";
import Popup from "../shared/Popup";
import AddressMapSelector from "../shared/AddressMapSelector";
import AdvancedPreferencesPopup from "../shared/AdvancedPreferences";
import { USER_TIMEZONE } from "../utils/constants";
import { format } from "date-fns";
import {
  FaSearch,
  FaHome,
  FaSync,
  FaParking,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaArrowUp,
  FaArrowDown,
  FaBolt,
  FaCarSide,
  FaCog,
} from "react-icons/fa";

const SearchParking = ({ loggedIn, setLoggedIn }) => {
  document.title = "חיפוש חניה | Spotly";

  const [current, setCurrent] = useState("search");
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role || "user";

  const [parkingSpots, setParkingSpots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupData, setPopupData] = useState(null);

  // Preferences state
  const [showPreferences, setShowPreferences] = useState(false);
  const [distancePreference, setDistancePreference] = useState(3);
  const [pricePreference, setPricePreference] = useState(3);

  // Get user's current location
  const [userLocation, setUserLocation] = useState({
    latitude: 31.7683, // Default to Israel center
    longitude: 35.2137,
  });

  // Address state for map selector
  const [address, setAddress] = useState({
    city: "",
    street: "",
    number: "",
  });

  const [feedback, setFeedback] = useState("");
  const [searching, setSearching] = useState(false);

  const getRoundedTime = (date = new Date()) => {
    date.setSeconds(0, 0);
    const minutes = date.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    if (roundedMinutes === 60) {
      date.setHours(date.getHours() + 1, 0);
    } else {
      date.setMinutes(roundedMinutes);
    }

    if (date.getHours() < 6) {
      date.setHours(6, 0, 0, 0);
    }

    return date;
  };

  const getEndTime = (startDate) => {
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const maxEnd = new Date(startDate);
    maxEnd.setHours(23, 59, 0, 0);
    return endDate > maxEnd ? maxEnd : endDate;
  };

  const [searchParams, setSearchParams] = useState(() => {
    const now = getRoundedTime();
    const end = getEndTime(now);

    return {
      address: "",
      latitude: null,
      longitude: null,
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: format(now, "HH:mm"),
      endTime: format(end, "HH:mm"),
      maxPrice: 50,
      is_charging_station: false,
      charger_type: "",
    };
  });

  // Charger types from your model
  const chargerTypes = [
    { id: "Type 1", label: "סוג 1" },
    { id: "Type 2", label: "סוג 2" },
    { id: "CCS", label: "CCS" },
    { id: "CHAdeMO", label: "CHAdeMO" },
    { id: "Other", label: "אחר" },
  ];

  const sortParkingSpots = useCallback(
    (spots) => {
      return [...spots].sort((a, b) => {
        let valueA, valueB;

        switch (searchParams.sortBy) {
          case "price":
            valueA = a.hourly_price || 0;
            valueB = b.hourly_price || 0;
            break;
          case "distance":
          default:
            valueA = a.distance || 0;
            valueB = b.distance || 0;
            break;
        }

        return searchParams.sortOrder === "asc"
          ? valueA - valueB
          : valueB - valueA;
      });
    },
    [searchParams.sortBy, searchParams.sortOrder]
  );

  useEffect(() => {
    // Try to get user location when component mounts
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Error getting location:", error);
        }
      );
    }

    // Fetch user preferences when component mounts
    fetchUserPreferences();
  }, []);

  // Update search params when address changes
  useEffect(() => {
    if (address.city && address.street && address.number) {
      const locationString = `${address.street} ${address.number}, ${address.city}`;
      setSearchParams((prev) => ({
        ...prev,
        location: locationString,
      }));
    }
  }, [address]);

  // Fetch user preferences from the server
  const fetchUserPreferences = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/v1/users/preferences", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.data?.preferences) {
        const { distance_importance, price_importance } =
          response.data.data.preferences;
        if (distance_importance) setDistancePreference(distance_importance);
        if (price_importance) setPricePreference(price_importance);
      }
    } catch (error) {
      console.error("שגיאה בטעינת העדפות משתמש:", error);
      // No need to show error to user for preferences loading
    }
  };

  // Save user preferences to the server
  const savePreferences = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        "/api/v1/users/preferences",
        {
          distance_importance: distancePreference,
          price_importance: pricePreference,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPopupData({
        title: "הצלחה",
        description: "העדפותייך נשמרו במערכת ✅",
        type: "success",
      });
      setShowPreferences(false);
    } catch (error) {
      console.error("שגיאה בשמירת העדפות:", error);
      setPopupData({
        title: "שגיאה",
        description: "שגיאה בשמירת ההעדפות  ❌",
        type: "error",
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "startTime") {
      const [hours, minutes] = value.split(":").map(Number);
      const startDateTime = new Date();
      startDateTime.setHours(hours, minutes, 0, 0);
      const endTime = getEndTime(startDateTime);

      setSearchParams((prev) => ({
        ...prev,
        startTime: value,
        endTime: format(endTime, "HH:mm"),
      }));
    } else {
      setSearchParams((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const searchParkingSpots = async (e) => {
    if (e) e.preventDefault();

    try {
      setLoading(true);

      const latitude = searchParams.latitude || userLocation.latitude;
      const longitude = searchParams.longitude || userLocation.longitude;

      if (!latitude || !longitude) {
        setPopupData({
          title: "מיקום חסר",
          description: "אנא הזן כתובת או אפשר גישה למיקום שלך",
          type: "error",
          show: true, // Ensure popup shows
        });
        setLoading(false);
        return;
      }

      const searchPayload = {
        latitude,
        longitude,
        date: searchParams.date,
        startTime: searchParams.startTime,
        endTime: searchParams.endTime,
        maxPrice: searchParams.maxPrice || 1000,
        timezone: USER_TIMEZONE, // Add USER_TIMEZONE to the payload
      };

      if (searchParams.is_charging_station) {
        searchPayload.is_charging_station = true;
        if (searchParams.charger_type) {
          searchPayload.charger_type = searchParams.charger_type;
        }
      }

      const token = localStorage.getItem("token");
      const response = await axios.post(
        "/api/v1/parking-spots/private/find-optimal",
        searchPayload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let spots = response.data?.data?.parkingSpots || [];
      spots = sortParkingSpots(spots);
      setParkingSpots(spots);

      if (spots.length === 0) {
        setPopupData({
          title: "לא נמצאו חניות",
          description:
            "לא נמצאו חניות פנויות העונות על הקריטריונים שלך. אנא נסה לשנות את פרמטרי החיפוש.",
          type: "info",
          show: true, // Ensure popup shows
        });
      }
    } catch (err) {
      console.error("שגיאה בחיפוש חניות:", err);
      setPopupData({
        title: "שגיאה בחיפוש",
        description:
          err?.response?.data?.message ||
          "אירעה שגיאה בעת חיפוש חניות. אנא נסה שנית.",
        type: "error",
        show: true, // Ensure popup shows
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (sortField) => {
    setSearchParams((prev) => {
      if (prev.sortBy === sortField) {
        return {
          ...prev,
          sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
        };
      } else {
        return { ...prev, sortBy: sortField, sortOrder: "asc" };
      }
    });
  };

  const handleBookParking = async (spotId) => {
    try {
      const token = localStorage.getItem("token");
      const selectedSpot = parkingSpots.find((spot) => spot._id === spotId);

      // Debug the spot's hourly price
      console.log("Selected spot details:", {
        id: selectedSpot?._id,
        hourly_price: selectedSpot?.hourly_price,
        type: typeof selectedSpot?.hourly_price,
        spot_type: selectedSpot?.spot_type,
      });

      // Format the booking data according to your API
      const bookingData = {
        spot: spotId,
        booking_type: searchParams.is_charging_station ? "charging" : "parking",
        start_datetime: `${searchParams.date}T${searchParams.startTime}:00`,
        end_datetime: `${searchParams.date}T${searchParams.endTime}:00`,
        base_rate_override: selectedSpot?.hourly_price || 0,
        base_rate: selectedSpot?.hourly_price || 0, // Send both parameters
        timezone: USER_TIMEZONE,
      };

      // Show confirmation popup
      setPopupData({
        title: "אישור הזמנה",
        description: "האם אתה בטוח שברצונך להזמין חניה זו?",
        type: "confirm",
        onConfirm: async () => {
          try {
            console.log("Sending booking data:", bookingData);

            // Create booking
            const response = await axios.post("/api/v1/bookings", bookingData, {
              headers: { Authorization: `Bearer ${token}` },
            });

            console.log("Booking response:", response.data);

            if (response.data?.status === "success") {
              setPopupData({
                title: "הזמנה בוצעה בהצלחה",
                description:
                  "ההזמנה שלך בוצעה בהצלחה! פרטים נשלחו לאימייל שלך.",
                type: "success",
              });

              // Refresh search results to reflect the new booking
              setTimeout(() => {
                searchParkingSpots();
              }, 2000);
            }
          } catch (err) {
            console.error("שגיאה בביצוע הזמנה:", err);

            let errorMessage = "אירעה שגיאה בעת ביצוע ההזמנה. אנא נסה שנית.";
            if (err.response?.data?.message) {
              errorMessage = err.response.data.message;
            }

            setPopupData({
              title: "שגיאה בהזמנה",
              description: errorMessage,
              type: "error",
            });
          }
        },
      });
    } catch (err) {
      console.error("שגיאה בהכנת ההזמנה:", err);
      setPopupData({
        title: "שגיאה בהזמנה",
        description: "אירעה שגיאה בעת הכנת ההזמנה. אנא נסה שנית.",
        type: "error",
      });
    }
  };

  // Format address function
  const formatAddress = (address) => {
    if (!address) return "כתובת לא זמינה";
    return `${address.street || ""} ${address.number || ""}, ${
      address.city || ""
    }`;
  };

  // Calculate time difference in hours (for price calculation)
  const calculateHours = () => {
    if (!searchParams.startTime || !searchParams.endTime) return 0;

    const [startHour, startMinute] = searchParams.startTime
      .split(":")
      .map(Number);
    const [endHour, endMinute] = searchParams.endTime.split(":").map(Number);

    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;

    // Handle case where end time is on the next day
    const diffMinutes =
      endTotalMinutes >= startTotalMinutes
        ? endTotalMinutes - startTotalMinutes
        : 24 * 60 - startTotalMinutes + endTotalMinutes;

    return Math.max(Math.ceil(diffMinutes / 60), 1); // Minimum of 1 hour
  };

  useEffect(() => {
    setParkingSpots((prevSpots) => sortParkingSpots(prevSpots));
  }, [searchParams.sortBy, searchParams.sortOrder, sortParkingSpots]);

  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50"
      dir="rtl"
    >
      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
      <div className="flex flex-grow">
        <Sidebar current={current} setCurrent={setCurrent} role={role} />

        <main className="flex-1 p-4 md:p-10 mt-16 w-full mr-64 lg:mr-80 transition-all duration-300 min-w-0">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <FaHome className="text-blue-600 text-5xl ml-4 pt-[20px]" />
              <h1 className="pt-[20px] text-4xl font-extrabold text-blue-700">
                חיפוש חניה פרטית
              </h1>
            </div>
            <p className="text-gray-600 text-xl max-w-2xl mx-auto leading-relaxed">
              מצא את החניה הפרטית המושלמת בדיוק במקום ובזמן שאתה צריך
            </p>
          </div>

          {/* Search Form Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-12 max-w-6xl mx-auto border border-blue-100">
            <div className="flex items-center justify-center mb-8">
              <FaSearch className="text-blue-600 text-2xl ml-6" />
              <h2 className="text-2xl font-bold text-gray-800">פרטי החיפוש</h2>
            </div>

            <form
              onSubmit={searchParkingSpots}
              className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
              {/* Location with Map Selector */}
              <div className="md:col-span-4 mb-6">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <FaMapMarkerAlt className="ml-2 text-blue-600" />
                  מיקום
                </label>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <AddressMapSelector
                    address={address}
                    setAddress={setAddress}
                    feedback={feedback}
                    setFeedback={setFeedback}
                    searching={searching}
                    setSearching={setSearching}
                    disableSearchButton={true}
                    mode="search"
                  />
                </div>
              </div>

              {/* Date Input */}
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

              {/* Start Time */}
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

              {/* End Time */}
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

              {/* Price Input */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <span className="text-green-600 text-lg font-bold ml-2">
                    ₪
                  </span>
                  מחיר מקסימלי לשעה
                </label>
                <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all duration-200">
                  <input
                    type="number"
                    name="maxPrice"
                    placeholder="ללא הגבלה"
                    value={searchParams.maxPrice}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-0 outline-none bg-white"
                    min="0"
                  />
                  <span className="px-4 bg-gradient-to-r from-green-50 to-blue-50 py-3 text-green-600 font-semibold">
                    ₪
                  </span>
                </div>
              </div>

              {/* EV charging filter */}
              <div className="md:col-span-4 bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 shadow-sm">
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
                    חפש רק חניות עם עמדת טעינה
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
                      className="w-full px-4 py-3 rounded-xl border border-green-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
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

              {/* Filter Button and Search Button */}
              <div className="md:col-span-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mt-6">
                {/* Left buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowPreferences(true)}
                    className="group bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-6 py-3 rounded-xl hover:from-blue-100 hover:to-indigo-100 flex items-center justify-center gap-3 w-full sm:w-auto border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105"
                  >
                    <FaCog className="group-hover:rotate-90 transition-transform duration-300" />
                    <span className="font-medium">העדפות חיפוש</span>
                  </button>
                </div>

                {/* Search button */}
                <button
                  type="submit"
                  disabled={!address.city || !address.street || !address.number}
                  className={`px-8 py-4 rounded-xl flex items-center justify-center gap-3 w-full md:w-auto font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${
                    !address.city || !address.street || !address.number
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  }`}
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <FaSearch className="text-xl" />
                  <span>חפש חניה</span>
                </button>
              </div>
            </form>
          </div>

          {/* Results Header */}
          {parkingSpots.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8 max-w-6xl mx-auto border border-blue-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-gray-700 flex items-center gap-4">
                <span className="font-bold text-xl text-blue-700">
                  נמצאו {parkingSpots.length} תוצאות
                </span>
                {distancePreference !== 3 || pricePreference !== 3 ? (
                  <div className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-4 py-2 rounded-full flex items-center border border-blue-200 shadow-sm">
                    <FaCog className="ml-2" />
                    <span>
                      {distancePreference > 3
                        ? "מרחק חשוב מאוד"
                        : distancePreference < 3
                        ? "מרחק פחות חשוב"
                        : ""}
                      {distancePreference !== 3 && pricePreference !== 3
                        ? " • "
                        : ""}
                      {pricePreference > 3
                        ? "מחיר חשוב מאוד"
                        : pricePreference < 3
                        ? "מחיר פחות חשוב"
                        : ""}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button
                  onClick={() => handleSortChange("price")}
                  className={`flex items-center px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    searchParams.sortBy === "price"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                      : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`${
                        searchParams.sortBy === "price"
                          ? "text-white"
                          : "text-blue-500"
                      } text-lg font-bold`}
                    >
                      ₪
                    </span>
                    <span>מיון לפי מחיר</span>
                    {searchParams.sortBy === "price" && (
                      <div
                        className={`ml-2 flex items-center justify-center h-6 w-6 rounded-full bg-white bg-opacity-25`}
                      >
                        {searchParams.sortOrder === "asc" ? (
                          <FaArrowUp className="text-white text-xs" />
                        ) : (
                          <FaArrowDown className="text-white text-xs" />
                        )}
                      </div>
                    )}
                  </div>
                </button>

                {searchParams.sortBy === "price" && (
                  <div className="absolute top-0 left-0 right-0 mt-16 text-center">
                    <span className="inline-block bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs px-4 py-2 rounded-full shadow-lg border border-blue-200">
                      {searchParams.sortOrder === "asc"
                        ? "מוצג מהזול ליקר"
                        : "מוצג מהיקר לזול"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results List */}
          {!loading && parkingSpots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {parkingSpots.map((spot) => (
                <div
                  key={spot._id}
                  className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
                >
                  {/* Parking Image or Placeholder */}
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 relative overflow-hidden">
                    {spot.photos && spot.photos.length > 0 ? (
                      <img
                        src={spot.photos[0]}
                        alt={`חניה ב-${spot.address?.city || ""}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-black opacity-10"></div>
                        {spot.is_charging_station ? (
                          <FaBolt className="text-white text-6xl z-10 group-hover:scale-110 transition-transform duration-300" />
                        ) : (
                          <FaParking className="text-white text-6xl z-10 group-hover:scale-110 transition-transform duration-300" />
                        )}
                      </div>
                    )}

                    {/* Price Tag */}
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg backdrop-blur-sm">
                      ₪{spot.hourly_price}/שעה
                    </div>

                    {/* Total cost badge */}
                    <div className="absolute bottom-4 left-4 bg-gray-900/80 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm shadow-lg">
                      <div className="flex items-center gap-2">
                        <FaClock className="text-white" />
                        <span>
                          סה״כ: ₪
                          {(spot.hourly_price * calculateHours()).toFixed(0)} ל-
                          {calculateHours()} שעות
                        </span>
                      </div>
                    </div>

                    {/* Charging Station Badge */}
                    {spot.is_charging_station && (
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl text-sm shadow-lg flex items-center backdrop-blur-sm">
                        <FaBolt className="ml-1" /> עמדת טעינה
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors duration-200">
                      {formatAddress(spot.address)}
                    </h3>

                    {/* Distance */}
                    {spot.distance && (
                      <p className="text-sm text-gray-600 mb-3 flex items-center">
                        <FaMapMarkerAlt className="ml-2 text-gray-400" />
                        {typeof spot.distance === "number"
                          ? `${
                              spot.distance < 1
                                ? (spot.distance * 1000).toFixed(0) + " מטר"
                                : spot.distance.toFixed(1) + ' ק"מ'
                            }`
                          : spot.distance}
                      </p>
                    )}

                    {/* Charger Type */}
                    {spot.is_charging_station && spot.charger_type && (
                      <p className="text-sm text-gray-600 mb-3 flex items-center">
                        <FaCarSide className="ml-2 text-gray-400" />
                        סוג מטען: {spot.charger_type}
                      </p>
                    )}

                    {/* Availability */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center">
                          <FaCalendarAlt className="ml-2" />
                          זמין ב-
                          {new Date(searchParams.date).toLocaleDateString(
                            "he-IL"
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-gray-600 flex items-center">
                          <FaClock className="ml-2" />
                          זמן חנייה
                        </span>
                        <span className="font-semibold text-gray-800">
                          {searchParams.startTime} - {searchParams.endTime}
                        </span>
                      </div>
                    </div>

                    {/* Book Button */}
                    <button
                      onClick={() => handleBookParking(spot._id)}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl flex justify-center items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <FaParking className="text-lg" />
                      <span>הזמן חניה</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !loading ? (
            <div className="text-center py-16 max-w-6xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaSearch className="text-blue-600 text-4xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-4">
                התחל לחפש חניה
              </h3>
              <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
                הזן מיקום, תאריך ושעות כדי למצוא חניות פרטיות זמינות.
              </p>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-block bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaSync className="animate-spin text-blue-600 text-3xl" />
                </div>
                <p className="text-gray-600 text-lg font-medium">
                  טוען חניות זמינות...
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />

      {/* Popup for various actions */}
      {popupData && (
        <Popup
          title={popupData.title}
          description={popupData.description}
          type={popupData.type || "info"}
          onClose={() => setPopupData(null)}
          onConfirm={popupData.type === "confirm" ? popupData.onConfirm : null}
        />
      )}

      {/* Advanced Preferences Popup */}
      {showPreferences && (
        <AdvancedPreferencesPopup
          distancePreference={distancePreference}
          pricePreference={pricePreference}
          setDistancePreference={setDistancePreference}
          setPricePreference={setPricePreference}
          savePreferences={savePreferences}
          onClose={() => setShowPreferences(false)}
        />
      )}
    </div>
  );
};

export default SearchParking;
