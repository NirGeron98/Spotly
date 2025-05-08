import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../shared/Navbar";
import Sidebar from "../shared/Sidebar";
import Footer from "../shared/Footer";
import Popup from "../shared/Popup";
import AddressMapSelector from "../shared/AddressMapSelector";
import AdvancedPreferencesPopup from "../shared/AdvancedPreferences";
import { USER_TIMEZONE } from "../utils/constants";
import { format, parseISO, isValid } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import {
  FaSearch,
  FaSync,
  FaParking,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaFilter,
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

  const [searchParams, setSearchParams] = useState({
    address: "",
    latitude: null,
    longitude: null,
    date: format(new Date(), "yyyy-MM-dd"), // Initialize date to current local date using format
    startTime: "08:00",
    endTime: "10:00",
    maxPrice: 50,
    is_charging_station: false,
    charger_type: "",
  });

  // Filter panel state
  const [showFilters, setShowFilters] = useState(false);

  // Charger types from your model
  const chargerTypes = [
    { id: "Type 1", label: "סוג 1" },
    { id: "Type 2", label: "סוג 2" },
    { id: "CCS", label: "CCS" },
    { id: "CHAdeMO", label: "CHAdeMO" },
    { id: "Other", label: "אחר" },
  ];

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
    setSearchParams((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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

  const sortParkingSpots = (spots) => {
    return [...spots].sort((a, b) => {
      let valueA, valueB;

      switch (searchParams.sortBy) {
        case "price":
          valueA = a.hourly_price || 0;
          valueB = b.hourly_price || 0;
          break;
        case "rating":
          valueA = a.rating || 0;
          valueB = b.rating || 0;
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

  const resetFilters = () => {
    setSearchParams({
      ...searchParams,
      maxPrice: "",
      is_charging_station: false,
      charger_type: "",
    });
  };

  const handleBookParking = async (spotId) => {
    try {
      const token = localStorage.getItem("token");

      // Format the booking data according to your API
      const bookingData = {
        spot: spotId,
        user: user._id,
        booking_type: searchParams.is_charging_station ? "charging" : "parking",
        start_datetime: `${searchParams.date}T${searchParams.startTime}:00`,
        end_datetime: `${searchParams.date}T${searchParams.endTime}:00`,
        booking_source: "private_spot_rental",
        timezone: USER_TIMEZONE,
        base_rate:
          parkingSpots.find((spot) => spot._id === spotId)?.hourly_price || 0,
      };

      // Show confirmation popup
      setPopupData({
        title: "אישור הזמנה",
        description: "האם אתה בטוח שברצונך להזמין חניה זו?",
        type: "confirm",
        onConfirm: async () => {
          try {
            // Create booking
            const response = await axios.post("/api/v1/bookings", bookingData, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data?.status === "success") {
              setPopupData({
                title: "הזמנה בוצעה בהצלחה",
                description:
                  "ההזמנה שלך בוצעה בהצלחה! פרטים נשלחו לאימייל שלך.",
                type: "success",
              });

              // Refresh search results to reflect the new booking
              searchParkingSpots();
            }
          } catch (err) {
            console.error("שגיאה בביצוע הזמנה:", err);
            setPopupData({
              title: "שגיאה בהזמנה",
              description: "אירעה שגיאה בעת ביצוע ההזמנה. אנא נסה שנית.",
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

  const getSortIcon = (field) => {
    if (searchParams.sortBy === field) {
      return searchParams.sortOrder === "asc" ? (
        <FaArrowUp className="text-blue-600 ml-1" />
      ) : (
        <FaArrowDown className="text-blue-600 ml-1" />
      );
    }
    return null;
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

  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50"
      dir="rtl"
    >
      <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} />
      <div className="flex flex-grow">
        <Sidebar current={current} setCurrent={setCurrent} role={role} />

        <main className="flex-grow p-4 md:p-6 md:mr-5 mt-12">
          <h1 className="pt-[68px] text-3xl font-extrabold text-blue-700 mb-4 text-center">
            חיפוש חניה פרטית
          </h1>
          <p className="text-gray-600 text-lg mb-8 text-center">
            מצא את החניה הפרטית המושלמת בדיוק במקום ובזמן שאתה צריך
          </p>

          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 max-w-6xl mx-auto">
            <form
              onSubmit={searchParkingSpots}
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              {/* Selected Location Display */}
              {searchParams.location && (
                <div className="md:col-span-4 bg-blue-50 p-3 rounded-md mb-2 flex justify-between items-center">
                  <div className="flex items-center text-blue-700">
                    <FaMapMarkerAlt className="mr-2" />
                    <span className="font-medium">{searchParams.location}</span>
                  </div>
                  {searchParams.latitude && searchParams.longitude && (
                    <div className="text-xs text-gray-500">
                      {searchParams.latitude.toFixed(6)},{" "}
                      {searchParams.longitude.toFixed(6)}
                    </div>
                  )}
                </div>
              )}
              {/* Location with Map Selector */}
              <div className="md:col-span-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  מיקום
                </label>
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

              {/* Date Input */}
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

              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שעת התחלה
                </label>
                <select
                  name="startTime"
                  value={searchParams.startTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-md border border-gray-300"
                >
                  {Array.from({ length: 96 }).map((_, i) => {
                    const hours = Math.floor(i / 4);
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
                </select>
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שעת סיום
                </label>
                <select
                  name="endTime"
                  value={searchParams.endTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-md border border-gray-300"
                >
                  {Array.from({ length: 96 }).map((_, i) => {
                    const hours = Math.floor(i / 4);
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
                </select>
              </div>

              {/* Price Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  מחיר מקסימלי לשעה
                </label>
                <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                  <input
                    type="number"
                    name="maxPrice"
                    placeholder="ללא הגבלה"
                    value={searchParams.maxPrice}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border-0 outline-none"
                    min="0"
                  />
                  <span className="px-3 bg-gray-100 py-2 text-gray-500">₪</span>
                </div>
              </div>

              {/* Filter Button and Search Button */}
              <div className="md:col-span-4 flex justify-between items-center mt-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 flex items-center gap-2"
                  >
                    <FaFilter /> סינון מתקדם
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreferences(true)}
                    className="bg-blue-50 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-100 flex items-center gap-2"
                  >
                    <FaCog /> העדפות חיפוש
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!address.city || !address.street || !address.number}
                  className={`px-6 py-2 rounded-md flex items-center gap-2 ${
                    !address.city || !address.street || !address.number
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  <FaSearch /> חפש חניה
                </button>
              </div>

              {/* Advanced Filters Panel */}
              {showFilters && (
                <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg mt-2">
                  {/* Parking Preferences */}
                  <div className="flex flex-col">
                    <h3 className="font-semibold mb-2">העדפות חניה</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <label className="flex items-center text-sm">
                        <input type="checkbox" name="indoor" className="mr-2" />
                        חניה מקורה
                      </label>

                      {/* Rating Filter */}
                      <div className="mt-4">
                        <h3 className="font-semibold mb-2">דירוג מינימלי</h3>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() =>
                                  setSearchParams((prev) => ({
                                    ...prev,
                                    minRating: star,
                                  }))
                                }
                                className="text-xl focus:outline-none"
                              >
                                <span
                                  className={`${
                                    star <= (searchParams.minRating || 0)
                                      ? "text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                >
                                  ★
                                </span>
                              </button>
                            ))}
                          </div>
                          <span className="text-sm text-gray-500 mr-2">
                            {searchParams.minRating
                              ? `${searchParams.minRating} כוכבים ומעלה`
                              : "כל הדירוגים"}
                          </span>
                          {searchParams.minRating > 0 && (
                            <button
                              onClick={() =>
                                setSearchParams((prev) => ({
                                  ...prev,
                                  minRating: 0,
                                }))
                              }
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              (נקה)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charging Station */}
                  <div>
                    <h3 className="font-semibold mb-2">
                      עמדת טעינה לרכב חשמלי
                    </h3>
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
                        חפש רק חניות עם עמדת טעינה
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

                  {/* Reset Filters Button */}
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        resetFilters();
                        setSearchParams((prev) => ({ ...prev, minRating: 0 }));
                      }}
                      className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 text-sm flex items-center gap-2"
                    >
                      <FaSync /> איפוס מסננים
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Results Sorting Bar */}
          {parkingSpots.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4 max-w-6xl mx-auto flex justify-between items-center">
              <div className="text-gray-700 flex items-center gap-2">
                <span>נמצאו {parkingSpots.length} תוצאות</span>
                {distancePreference !== 3 || pricePreference !== 3 ? (
                  <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full flex items-center">
                    <FaCog className="ml-1" />
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
              <div className="flex gap-4">
                <button
                  onClick={() => handleSortChange("distance")}
                  className={`flex items-center ${
                    searchParams.sortBy === "distance"
                      ? "text-blue-600 font-medium"
                      : "text-gray-600"
                  }`}
                >
                  מרחק {getSortIcon("distance")}
                </button>
                <button
                  onClick={() => handleSortChange("price")}
                  className={`flex items-center ${
                    searchParams.sortBy === "price"
                      ? "text-blue-600 font-medium"
                      : "text-gray-600"
                  }`}
                >
                  מחיר {getSortIcon("price")}
                </button>
                <button
                  onClick={() => handleSortChange("rating")}
                  className={`flex items-center ${
                    searchParams.sortBy === "rating"
                      ? "text-blue-600 font-medium"
                      : "text-gray-600"
                  }`}
                >
                  דירוג {getSortIcon("rating")}
                </button>
              </div>
            </div>
          )}

          {/* Results List */}
          {!loading && parkingSpots.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {parkingSpots.map((spot) => (
                <div
                  key={spot._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Parking Image or Placeholder */}
                  <div className="h-48 bg-gray-200 relative">
                    {spot.photos && spot.photos.length > 0 ? (
                      <img
                        src={spot.photos[0]}
                        alt={`חניה ב-${spot.address?.city || ""}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-100 to-indigo-100">
                        {spot.is_charging_station ? (
                          <FaBolt className="text-blue-400 text-5xl" />
                        ) : (
                          <FaParking className="text-blue-400 text-5xl" />
                        )}
                      </div>
                    )}

                    {/* Price Tag */}
                    <div className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-lg font-bold shadow-sm">
                      ₪{spot.hourly_price}/שעה
                    </div>

                    {/* Total cost badge */}
                    <div className="absolute bottom-2 left-2 bg-gray-800 text-white px-3 py-1 rounded-lg text-sm shadow-sm">
                      סה״כ: ₪{(spot.hourly_price * calculateHours()).toFixed(0)}{" "}
                      ל-{calculateHours()} שעות
                    </div>

                    {/* Charging Station Badge */}
                    {spot.is_charging_station && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-lg text-sm shadow-sm flex items-center">
                        <FaBolt className="mr-1" /> עמדת טעינה
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {formatAddress(spot.address)}
                    </h3>

                    {/* Distance */}
                    {spot.distance && (
                      <p className="text-sm text-gray-600 mb-2">
                        <FaMapMarkerAlt className="inline mr-1" />
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
                      <p className="text-sm text-gray-600 mb-2">
                        <FaCarSide className="inline mr-1" />
                        סוג מטען: {spot.charger_type}
                      </p>
                    )}

                    {/* Availability */}
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <FaCalendarAlt className="ml-2" /> זמין בתאריך{" "}
                      {new Date(searchParams.date).toLocaleDateString("he-IL")}
                      <FaClock className="mr-3 ml-2" /> {searchParams.startTime}{" "}
                      - {searchParams.endTime}
                    </div>

                    {/* Book Button */}
                    <button
                      onClick={() => handleBookParking(spot._id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md flex items-center justify-center gap-2 mt-2"
                    >
                      <FaParking /> הזמן חניה
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !loading ? (
            <div className="text-center py-12 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
              <FaSearch className="text-gray-300 text-6xl mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                התחל לחפש חניה
              </h3>
              <p className="text-gray-600">
                הזן מיקום, תאריך ושעות כדי למצוא חניות פרטיות זמינות.
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-block">
                <FaSync className="animate-spin text-blue-600 text-4xl mb-4" />
              </div>
              <p className="text-gray-600">טוען חניות זמינות...</p>
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
