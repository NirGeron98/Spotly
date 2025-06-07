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
import {
  FaSearch,
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
  FaBuilding,
  FaClipboardList,
  FaExchangeAlt,
  FaUser,
  FaHashtag,
} from "react-icons/fa";

const SearchParking = ({ loggedIn, setLoggedIn }) => {
  // Get the mode from localStorage
  const mode = localStorage.getItem("mode");
  const isBuildingMode = mode === "building";
  // Set the document title based on mode
  document.title = isBuildingMode
    ? "ניהול חניות בבניין | Spotly"
    : "חיפוש חניה | Spotly";

  const [current, setCurrent] = useState(isBuildingMode ? "building" : "search");
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role || "user";

  const [parkingSpots, setParkingSpots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupData, setPopupData] = useState(null);

  // New state for building mode automatic reservation
  const [reservationDetails, setReservationDetails] = useState(null);
  const [showReservationConfirm, setShowReservationConfirm] = useState(false);

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

  // Building specific state
  const [userBuilding, setUserBuilding] = useState(null);
  const [buildingResidents, setBuildingResidents] = useState([]);

  const [feedback, setFeedback] = useState("");
  const [searching, setSearching] = useState(false);

  const getRoundedTime = (date = new Date()) => {
    const minutes = date.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    if (roundedMinutes === 60) {
      date.setHours(date.getHours() + 1);
      date.setMinutes(0);
    } else {
      date.setMinutes(roundedMinutes);
    }
    return date;
  };

  const now = getRoundedTime(new Date());
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const [searchParams, setSearchParams] = useState({
    address: "",
    latitude: null,
    longitude: null,
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: format(now, "HH:mm"),
    endTime: format(twoHoursLater, "HH:mm"),
    maxPrice: isBuildingMode ? 0 : 50, // No price in building mode
    is_charging_station: false,
    charger_type: "",
    buildingId: "", // For building mode
    sortBy: "distance",
    sortOrder: "asc"
  });

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

    // Fetch user preferences when component mounts (only in regular mode)
    if (!isBuildingMode) {
      fetchUserPreferences();
    }

    // Fetch user buildings in building mode
    if (isBuildingMode) {
      fetchUserBuilding();
    }
  }, [isBuildingMode]);

  // Fetch user building from API
  const fetchUserBuilding = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));

      // If we have the building ID in the user object from localStorage
      if (user && user.resident_building) {
        const buildingId = user.resident_building;

        // Fetch building details using the existing endpoint
        const buildingResponse = await axios.get(`/api/v1/buildings/${buildingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (buildingResponse.data?.data?.building) {
          const building = buildingResponse.data.data.building;
          setUserBuilding(building);

          // Set the building ID in search params
          setSearchParams(prev => ({
            ...prev,
            buildingId: buildingId
          }));

          // Fetch building residents
          fetchBuildingResidents(buildingId);
        }
      }
      // If we don't have the building ID in localStorage, try to get user details first
      else {
        const userResponse = await axios.get("/api/v1/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (userResponse.data?.data?.user?.resident_building) {
          const buildingId = userResponse.data.data.user.resident_building;

          // Fetch building details
          const buildingResponse = await axios.get(`/api/v1/buildings/${buildingId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (buildingResponse.data?.data?.building) {
            const building = buildingResponse.data.data.building;
            setUserBuilding(building);

            // Set the building ID in search params
            setSearchParams(prev => ({
              ...prev,
              buildingId: buildingId
            }));

            // Fetch building residents
            fetchBuildingResidents(buildingId);
          }
        } else {
          throw new Error("User is not associated with any building");
        }
      }
    } catch (error) {
      console.error("שגיאה בטעינת פרטי הבניין:", error);
      setPopupData({
        title: "שגיאה",
        description: "לא ניתן לטעון את פרטי הבניין",
        type: "error",
      });
    }
  };

  // Fetch building residents
  const fetchBuildingResidents = async (buildingId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/v1/buildings/${buildingId}/residents`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.data?.residents) {
        setBuildingResidents(response.data.data.residents);
      }
    } catch (error) {
      console.error("שגיאה בטעינת דיירים:", error);
    }
  };

  // Update search params when address changes (regular mode only)
  useEffect(() => {
    if (!isBuildingMode && address.city && address.street && address.number) {
      const locationString = `${address.street} ${address.number}, ${address.city}`;
      setSearchParams((prev) => ({
        ...prev,
        location: locationString,
      }));
    }
  }, [address, isBuildingMode]);

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
      if (isBuildingMode) {
        // Building mode search - automatically find and reserve optimal parking spot
        if (user == null || !user.resident_building) {
          setPopupData({
            title: "שגיאה",
            description: "לא נמצא זיהוי בניין",
            type: "error",
          });
          setLoading(false);
          return;
        }

        // API call for finding the optimal parking spot in the building
        const token = localStorage.getItem("token");
        const response = await axios.post(
          "/api/v1/parking-spots/building/find-available",
          {
            building_id: user.resident_building,
            start_datetime: `${searchParams.date}T${searchParams.startTime}:00`,
            end_datetime: `${searchParams.date}T${searchParams.endTime}:00`,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Debug: Log the response to see its actual structure
        console.log("API Response:", response.data);

        // Check for success and correctly access the data
        if (response.data?.status === "success") {
          const responseData = response.data.date || response.data.data;

          if (responseData?.spot) {
            // Found an optimal spot - show reservation confirmation popup
            const optimalSpot = responseData.spot;
            const booking = responseData.booking;
            const ownerName = getResidentName(optimalSpot.owner_id);

            // Format time for display
            const startTime = searchParams.startTime;
            const endTime = searchParams.endTime;
            const date = new Date(searchParams.date).toLocaleDateString("he-IL");

            setReservationDetails({
              spot: optimalSpot,
              booking: booking,
              ownerName: ownerName,
              date: date,
              startTime: startTime,
              endTime: endTime
            });

            setShowReservationConfirm(true);

            // Don't set parkingSpots to avoid showing the grid
            setParkingSpots([]);
          } else {
            // Success but no spot found
            setParkingSpots([]);
            setPopupData({
              title: "לא נמצאו חניות",
              description: "לא נמצאו חניות פנויות בבניין בזמן המבוקש",
              type: "info",
            });
          }
        } else {
          // Not success
          setParkingSpots([]);
          setPopupData({
            title: "שגיאה בחיפוש",
            description: response.data?.message || "אירעה שגיאה בעת חיפוש חניות. אנא נסה שנית.",
            type: "error",
          });
        }
      } else {
        // Regular mode search - use location and other criteria
        const latitude = searchParams.latitude || userLocation.latitude;
        const longitude = searchParams.longitude || userLocation.longitude;

        if (!latitude || !longitude) {
          setPopupData({
            title: "מיקום חסר",
            description: "אנא הזן כתובת או אפשר גישה למיקום שלך",
            type: "error",
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
          timezone: USER_TIMEZONE,
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
          });
        }
      }
    } catch (err) {
      console.error("שגיאה בחיפוש חניות:", err);
      setPopupData({
        title: "שגיאה בחיפוש",
        description:
          err?.response?.data?.message ||
          "אירעה שגיאה בעת חיפוש חניות. אנא נסה שנית.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle confirmation of automatic reservation in building mode
  const handleConfirmReservation = async () => {
    try {
      // The reservation was already made by the API, just close the popup and show success
      setShowReservationConfirm(false);
      setPopupData({
        title: "הזמנה אושרה בהצלחה",
        description: `החניה הוזמנה בהצלחה! פרטי ההזמנה נשלחו למייל שלך.`,
        type: "success",
      });

      // Clear reservation details
      setReservationDetails(null);
    } catch (error) {
      console.error("שגיאה באישור הזמנה:", error);
      setPopupData({
        title: "שגיאה באישור הזמנה",
        description: "אירעה שגיאה באישור ההזמנה. אנא נסה שנית.",
        type: "error",
      });
    }
  };

  // Handle cancellation of automatic reservation in building mode
  const handleCancelReservation = async () => {
    try {
      if (reservationDetails?.booking?._id) {
        // Cancel the booking that was automatically created
        const token = localStorage.getItem("token");
        await axios.delete(`/api/v1/bookings/${reservationDetails.booking._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setShowReservationConfirm(false);
      setReservationDetails(null);
      setPopupData({
        title: "הזמנה בוטלה",
        description: "ההזמנה בוטלה בהצלחה.",
        type: "info",
      });
    } catch (error) {
      console.error("שגיאה בביטול הזמנה:", error);
      setPopupData({
        title: "שגיאה בביטול הזמנה",
        description: "אירעה שגיאה בביטול ההזמנה. אנא פנה לתמיכה.",
        type: "error",
      });
    }
  };

  const sortParkingSpots = (spots) => {
    // In building mode, just return spots as is
    if (isBuildingMode) return spots;

    // In regular mode, sort by price or distance
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

      // Regular mode booking
      const bookingData = {
        spot: spotId,
        booking_type: searchParams.is_charging_station ? "charging" : "parking",
        start_datetime: `${searchParams.date}T${searchParams.startTime}:00`,
        end_datetime: `${searchParams.date}T${searchParams.endTime}:00`,
        base_rate_override: selectedSpot?.hourly_price || 0,
        base_rate: selectedSpot?.hourly_price || 0,
        timezone: USER_TIMEZONE,
      };

      setPopupData({
        title: "אישור הזמנה",
        description: "האם אתה בטוח שברצונך להזמין חניה זו?",
        type: "confirm",
        onConfirm: async () => {
          try {
            const response = await axios.post("/api/v1/bookings", bookingData, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data?.status === "success") {
              // Remove the booked spot from the current results
              setParkingSpots(prevSpots =>
                prevSpots.filter(spot => spot._id !== spotId)
              );

              setPopupData({
                title: "הזמנה בוצעה בהצלחה",
                description: "ההזמנה שלך בוצעה בהצלחה! פרטים נשלחו לאימייל שלך.",
                type: "success",
              });

              // Removed the automatic search refresh to prevent "no results" error
              // The user has successfully booked and doesn't need to see refreshed results immediately
            }
          } catch (err) {
            console.error("שגיאה בביצוע הזמנה:", err);
            setPopupData({
              title: "שגיאה בהזמנה",
              description: err.response?.data?.message || "אירעה שגיאה בעת ביצוע ההזמנה",
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
    return `${address.street || ""} ${address.number || ""}, ${address.city || ""
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

  // Find resident name by ID
  const getResidentName = (userId) => {
    if (!userId) return "שטח אורחים";
    const resident = buildingResidents.find(r => r._id === userId);
    return resident
      ? `${resident.first_name} ${resident.last_name}`
      : "דייר לא ידוע";
  };

  useEffect(() => {
    // Re-sort parking spots whenever sortBy or sortOrder changes
    setParkingSpots((prevSpots) => sortParkingSpots(prevSpots));
  }, [searchParams.sortBy, searchParams.sortOrder]);

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
            {isBuildingMode ? "חיפוש חניה פנויה בבניין" : "חיפוש חניה פרטית"}
          </h1>
          <p className="text-gray-600 text-lg mb-8 text-center">
            {isBuildingMode
              ? "מצא חניה פנויה בבניין המגורים שלך"
              : "מצא את החניה הפרטית המושלמת בדיוק במקום ובזמן שאתה צריך"}
          </p>

          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 max-w-6xl mx-auto">
            <form
              onSubmit={searchParkingSpots}
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              {/* Building Mode - Building Display */}
              {isBuildingMode && (
                <div className="md:col-span-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded-md flex items-center">
                    <FaBuilding className="ml-2 text-blue-600" />
                    <span className="text-gray-700 ">
                      חיפוש חניה ב{user?.address?.street || ""} {user?.address?.number || ""}{user?.address?.city ? `, ${user?.address?.city}` : ''}                    </span>
                  </div>
                </div>
              )}

              {/* Regular Mode - Location with Map Selector */}
              {!isBuildingMode && (
                <>
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
                </>
              )}

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

              {/* Price Input - Only for Regular Mode */}
              {!isBuildingMode && (
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
              )}

              {/* Charging Station - Only for Regular Mode */}
              {!isBuildingMode && (
                <div className="md:col-span-4 mb-4">
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
              )}

              {/* Filter Button and Search Button */}
              <div className={`md:col-span-4 flex flex-row justify-between items-center gap-3 mt-2`}>
                {/* Left buttons - Only show preferences in regular mode */}
                <div className="flex flex-row gap-2 w-full md:w-auto">
                  {!isBuildingMode && (
                    <button
                      type="button"
                      onClick={() => setShowPreferences(true)}
                      className="bg-blue-50 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-100 flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <FaCog /> העדפות חיפוש
                    </button>
                  )}
                </div>

                {/* Search button */}
                <button
                  type="submit"
                  disabled={!isBuildingMode && (!address.city || !address.street || !address.number)}
                  className={`px-6 py-2 rounded-md flex items-center justify-center gap-2 w-full md:w-auto ${(!isBuildingMode && (!address.city || !address.street || !address.number))
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                  <FaSearch />
                  {isBuildingMode ? "חפש והזמן חניה" : "חפש חניה"}
                </button>
              </div>
            </form>
          </div>

          {/* Results section - Only show in regular mode */}
          {!isBuildingMode && (
            <>
              {parkingSpots.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-4 mb-4 max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="text-gray-700 flex items-center gap-2">
                    <span className="font-medium">
                      נמצאו {parkingSpots.length} תוצאות
                    </span>
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

                  <div className="relative">
                    <button
                      onClick={() => handleSortChange("price")}
                      className={`flex items-center px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${searchParams.sortBy === "price"
                        ? "bg-blue-600 text-white shadow"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`${searchParams.sortBy === "price"
                            ? "text-white"
                            : "text-blue-500"
                            } text-lg font-semibold`}
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
                      <div className="absolute top-0 left-0 right-0 mt-14 text-center">
                        <span className="inline-block bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full shadow-sm">
                          {searchParams.sortOrder === "asc"
                            ? "מוצג מהזול ליקר"
                            : "מוצג מהיקר לזול"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Results List - Only for Regular Mode */}
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

                        {spot.distance && (
                          <p className="text-sm text-gray-600 mb-2">
                            <FaMapMarkerAlt className="inline mr-1" />
                            {typeof spot.distance === "number"
                              ? `${spot.distance < 1
                                ? (spot.distance * 1000).toFixed(0) + " מטר"
                                : spot.distance.toFixed(1) + ' ק"מ'
                              }`
                              : spot.distance}
                          </p>
                        )}

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
            </>
          )}

          {/* Building Mode - Only show loading indicator */}
          {isBuildingMode && loading && (
            <div className="text-center py-12">
              <div className="inline-block">
                <FaSync className="animate-spin text-blue-600 text-4xl mb-4" />
              </div>
              <p className="text-gray-600">מחפש חניה מתאימה...</p>
            </div>
          )}

          {/* Building Mode - Show instruction when not loading and no reservation */}
          {isBuildingMode && !loading && !showReservationConfirm && (
            <div className="text-center py-12 max-w-6xl mx-auto bg-white rounded-lg shadow-md">
              <FaBuilding className="text-gray-300 text-6xl mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                התחל לחפש חניה בבניין
              </h3>
              <p className="text-gray-600">
                בחר תאריך ושעות כדי למצוא חניה פנויה בבניין המגורים שלך. המערכת תמצא ותזמין עבורך חניה באופן אוטומטי.
              </p>
            </div>
          )}
        </main>
      </div>

      <Footer />

      {/* Building Mode - Reservation Confirmation Popup */}
      {showReservationConfirm && reservationDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <FaParking className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                נמצאה חניה מתאימה!
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                המערכת מצאה עבורך חניה פנויה בבניין
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    <FaHashtag className="inline mr-1" />
                    מספר חניה:
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {reservationDetails.spot.spot_number || "לא ידוע"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    <FaUser className="inline mr-1" />
                    בעלים:
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {reservationDetails.spot.is_guest_spot ? "חניית אורחים" : reservationDetails.ownerName}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    <FaCalendarAlt className="inline mr-1" />
                    תאריך:
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {reservationDetails.date}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    <FaClock className="inline mr-1" />
                    שעות:
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {reservationDetails.startTime} - {reservationDetails.endTime}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center text-sm text-gray-600 mb-6">
              {!reservationDetails.spot.is_guest_spot && (
                <p>
                  תצטרך לקבל אישור מהדייר {reservationDetails.ownerName} לפני השימוש בחניה
                </p>
              )}
            </div>

            <div className="flex space-x-3 rtl:space-x-reverse">
              <button
                onClick={handleCancelReservation}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleConfirmReservation}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                אשר הזמנה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regular Popup for other actions */}
      {popupData && (
        <Popup
          title={popupData.title}
          description={popupData.description}
          type={popupData.type || "info"}
          onClose={() => setPopupData(null)}
          onConfirm={popupData.type === "confirm" ? popupData.onConfirm : null}
        />
      )}

      {/* Advanced Preferences Popup - Only for Regular Mode */}
      {showPreferences && !isBuildingMode && (
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