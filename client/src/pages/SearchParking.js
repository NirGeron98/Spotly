import React, { useState, useEffect, useCallback } from "react";
import axios from "../axios";
import Navbar from "../components/shared/Navbar";
import Sidebar from "../components/shared/Sidebar";
import Footer from "../components/shared/Footer";
import Popup from "../components/shared/Popup";
import AdvancedPreferencesPopup from "../components/shared/AdvancedPreferences";
import { USER_TIMEZONE } from "../utils/constants";
import SearchForm from "../components/search-private-parking/SearchForm";
import ResultsHeader from "../components/search-private-parking/ResultsHeader";
import PageHeader from "../components/shared/PageHeader";
import ParkingResultsGrid from "../components/search-private-parking/ParkingResultsGrid";
import EmptySearchPrompt from "../components/search-private-parking/EmptySearchPrompt";
import { notifySuccess, notifyError, notifyInfo } from "../utils/toasts";
import { fromZonedTime } from "date-fns-tz";
import Loader from "../components/shared/Loader";
import { format } from "date-fns";
import { FaSearch, FaHome, FaSync } from "react-icons/fa";

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
  const [suppressEmptyMessage, setSuppressEmptyMessage] = useState(false);

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
          console.log("");
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
        if (distance_importance !== undefined)
          setDistancePreference(distance_importance + 1);

        if (price_importance !== undefined)
          setPricePreference(price_importance + 1);
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

      notifySuccess("העדפות נשמרו בהצלחה ✅");
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
        notifyInfo("אנא הזן כתובת או אפשר גישה למיקום שלך");

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

      if (spots.length === 0 && !suppressEmptyMessage) {
        notifyInfo("לא נמצאו חניות העונות על הקריטריונים שלך");
      }
    } catch (err) {
      console.error("שגיאה בחיפוש חניות:", err);
      notifyError(
        err?.response?.data?.message || "אירעה שגיאה בעת חיפוש חניות. נסה שוב"
      );
    } finally {
      setLoading(false);
      setSuppressEmptyMessage(false);
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

      // Construct local datetime strings
      const localStartString = `${searchParams.date}T${searchParams.startTime}:00`;
      const localEndString = `${searchParams.date}T${searchParams.endTime}:00`;

      // Convert local datetime strings to UTC
      const startUtc = fromZonedTime(localStartString, USER_TIMEZONE);
      const endUtc = fromZonedTime(localEndString, USER_TIMEZONE);

      // Prepare booking payload for the API
      const bookingData = {
        spot: spotId,
        booking_type: searchParams.is_charging_station ? "charging" : "parking",
        start_datetime: startUtc.toISOString(),
        end_datetime: endUtc.toISOString(),
        base_rate_override: selectedSpot?.hourly_price || 0,
        base_rate: selectedSpot?.hourly_price || 0,
        timezone: USER_TIMEZONE,
      };

      console.log("Booking data being sent:", bookingData);

      // Show confirmation popup (without date and time)
      setPopupData({
        title: "אישור הזמנה",
        description: `האם אתה בטוח שברצונך להזמין חניה זו?\nמחיר: ₪${(
          selectedSpot?.hourly_price * calculateHours()
        ).toFixed(0)}`,
        type: "confirm",
        onConfirm: async () => {
          try {
            // Send booking request
            const response = await axios.post("/api/v1/bookings", bookingData, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data?.status === "success") {
              // Show success popup
              setPopupData({
                title: "הזמנה בוצעה בהצלחה",
                description:
                  "ההזמנה שלך בוצעה בהצלחה! פרטים נשלחו לאימייל שלך.",
                type: "success",
              });

              // Refresh search results
              setSuppressEmptyMessage(true);
              setTimeout(() => {
                searchParkingSpots();
              }, 2000);
            }
          } catch (err) {
            console.error("Error during booking:", err);
            console.error("Server response:", err.response?.data);

            let errorMessage = "אירעה שגיאה בעת ביצוע ההזמנה. אנא נסה שנית.";
            if (err.response?.data?.message) {
              errorMessage = err.response.data.message;
            }

            // Show error popup
            setPopupData({
              title: "שגיאה בהזמנה",
              description: errorMessage,
              type: "error",
            });
          }
        },
      });
    } catch (err) {
      console.error("Error preparing booking:", err);

      // Show general error popup
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

        {/* Main Content - Responsive Layout */}
        <main
          className="flex-1 p-3 sm:p-4 md:p-6 lg:p-10 mt-16 w-full 
                       mr-0 lg:mr-64 xl:mr-80 
                       transition-all duration-300 min-w-0"
        >
          {/* Header Section - Responsive */}
          <div className="mb-6 md:mb-8">
            <PageHeader
              icon={FaHome}
              title="חיפוש חניה פרטית"
              subtitle="מצא את החניה הפרטית המושלמת בדיוק במקום ובזמן שאתה צריך"
            />
          </div>

          {/* Search Form Card - Responsive */}
          <div
            className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl 
                        shadow-lg md:shadow-xl p-4 sm:p-6 md:p-8 
                        mb-6 md:mb-12 max-w-6xl mx-auto 
                        border border-blue-100"
          >
            {/* Form Header - Responsive */}
            <div className="flex flex-col sm:flex-row items-center justify-center mb-6 md:mb-8">
              <FaSearch className="text-blue-600 text-xl md:text-2xl mb-2 sm:mb-0 sm:ml-4 md:ml-6" />
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 text-center sm:text-right">
                פרטי החיפוש
              </h2>
            </div>

            <SearchForm
              searchParams={searchParams}
              handleInputChange={handleInputChange}
              address={address}
              setAddress={setAddress}
              feedback={feedback}
              setFeedback={setFeedback}
              searching={searching}
              setSearching={setSearching}
              setShowPreferences={setShowPreferences}
              chargerTypes={chargerTypes}
              searchParkingSpots={searchParkingSpots}
            />
          </div>

          {/* Results Header - Responsive */}
          {parkingSpots.length > 0 && (
            <div className="mb-4 md:mb-6">
              <ResultsHeader
                count={parkingSpots.length}
                distancePreference={distancePreference}
                pricePreference={pricePreference}
                sortBy={searchParams.sortBy}
                sortOrder={searchParams.sortOrder}
                handleSortChange={handleSortChange}
              />
            </div>
          )}

          {/* Results List - Responsive */}
          {!loading && parkingSpots.length > 0 ? (
            <ParkingResultsGrid
              parkingSpots={parkingSpots}
              searchParams={searchParams}
              calculateHours={calculateHours}
              handleBookParking={handleBookParking}
              formatAddress={formatAddress}
            />
          ) : !loading ? (
            <EmptySearchPrompt
              icon={FaSearch}
              title="התחל לחפש חניה"
              description="הזן מיקום, תאריך ושעות כדי למצוא חניות פרטיות זמינות."
            />
          ) : (
            /* Loading State - Responsive */
            <div className="text-center py-12 md:py-16">
              <div
                className="inline-block bg-white/80 backdrop-blur-sm 
                            rounded-xl md:rounded-2xl p-6 md:p-8 
                            shadow-lg md:shadow-xl max-w-sm mx-auto"
              >
                <div
                  className="bg-gradient-to-br from-blue-100 to-indigo-100 
                              w-16 h-16 md:w-20 md:h-20 rounded-full 
                              flex items-center justify-center mx-auto mb-4 md:mb-6"
                >
                  <FaSync className="animate-spin text-blue-600 text-2xl md:text-3xl" />
                </div>
                <p className="text-gray-600 text-base md:text-lg font-medium">
                  טוען חניות זמינות...
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />

      {loading && <Loader message="מחפש חניות זמינות..." />}

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
