import { useState } from "react";
import axios from "../axios";
import Navbar from "../components/shared/Navbar";
import Footer from "../components/shared/Footer";
import Sidebar from "../components/shared/Sidebar";
import Popup from "../components/shared/Popup";
import PageHeader from "../components/shared/PageHeader";
import Loader from "../components/shared/Loader";
import BuildingSearchForm from "../components/building-parking-search/BuildingSearchForm";
import FallbackResultsGrid from "../components/building-parking-search/FallbackResultsGrid";
import { useSearchParams } from "../components/building-parking-search/hooks/useSearchParams";
import BookingSummaryCard from "../components/building-parking-search/BookingSummaryCard";
import { fromZonedTime } from "date-fns-tz"; // Import for timezone conversion
import { USER_TIMEZONE } from "../utils/constants"; // Import timezone constant

import { FaBuilding } from "react-icons/fa";

const ResidentialParkingSearch = ({ loggedIn, setLoggedIn }) => {
  document.title = "חיפוש חניה בבניין מגורים | Spotly";

  const { searchParams, handleInputChange } = useSearchParams();
  const [popupData, setPopupData] = useState(null);
  const [fallbackResults, setFallbackResults] = useState([]);
  const [foundSpot, setFoundSpot] = useState(null);
  const [loading, setLoading] = useState(false);

  // Available charger types for EV stations
  const chargerTypes = [
    { id: "Type 1", label: "סוג 1" },
    { id: "Type 2", label: "סוג 2" },
    { id: "CCS", label: "CCS" },
    { id: "CHAdeMO", label: "CHAdeMO" },
    { id: "Other", label: "אחר" },
  ];

  // Calculate total parking hours from start and end time
  const calculateHours = () => {
    const [startH, startM] = searchParams.startTime.split(":").map(Number);
    const [endH, endM] = searchParams.endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const diff = endMinutes - startMinutes;
    return Math.max(1, Math.ceil(diff / 60));
  };

  // Generate booking summary JSX component for popup display
  const generateBookingSummary = (spot, params) => {
    return <BookingSummaryCard spot={spot} searchParams={params} />;
  };

  const handleWaitlistConfirmation = async () => {
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
        title: "נרשמת לרשימת ההמתנה",
        description: "הבקשה שלך נשמרה. נעדכן אותך אם תתפנה חניה.",
        type: "success",
      });
    } catch (error) {
      console.error("❌ Error during waitlist:", error);
      setPopupData({
        title: "שגיאה",
        description:
          error.response?.data?.message || "שגיאה בהרשמה לרשימת ההמתנה.",
        type: "error",
      });
    }
  };

  // Handle booking confirmation with proper timezone conversion
  const handleConfirmReservation = async (selectedSpot) => {
    setLoading(true);
    const token =
      typeof Storage !== "undefined" ? localStorage.getItem("token") : null;
    const spotToBook = selectedSpot || foundSpot;
    const bookingType = spotToBook.is_charging_station ? "charging" : "parking";

    try {
      // Convert local datetime strings to UTC for API
      const localStartString = `${searchParams.date}T${searchParams.startTime}:00`;
      const localEndString = `${searchParams.date}T${searchParams.endTime}:00`;

      const startUtc = fromZonedTime(localStartString, USER_TIMEZONE);
      const endUtc = fromZonedTime(localEndString, USER_TIMEZONE);

      await axios.post(
        "/api/v1/bookings",
        {
          spot: spotToBook._id,
          booking_type: bookingType,
          start_datetime: startUtc.toISOString(), // Send as UTC ISO string
          end_datetime: endUtc.toISOString(), // Send as UTC ISO string
          timezone: USER_TIMEZONE,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Show success message with booking details
      setPopupData({
        title: "הזמנה בוצעה בהצלחה",
        type: "success",
        description: (
          <BookingSummaryCard spot={spotToBook} searchParams={searchParams} />
        ),
      });

      // Clear search results after successful booking
      setFoundSpot(null);
      setFallbackResults([]);
    } catch (error) {
      console.error("❌ Failed to confirm booking:", error);
      console.error("Server response:", error.response?.data);

      // Show error message with server response if available
      setPopupData({
        title: "שגיאת הזמנה",
        type: "error",
        description: error.response?.data?.message || "אירעה שגיאה בעת ההזמנה.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Search for available parking spots in building
  const searchParkingSpots = async (e) => {
    console.log("🚀 searchParkingSpots called");

    setLoading(true);
    e.preventDefault();
    setPopupData(null);
    setFoundSpot(null);

    try {
      const token =
        typeof Storage !== "undefined" ? localStorage.getItem("token") : null;
      const user =
        typeof Storage !== "undefined"
          ? JSON.parse(localStorage.getItem("user") || "{}")
          : {};

      // Convert local datetime to UTC for API request
      const localStartString = `${searchParams.date}T${searchParams.startTime}:00`;
      const localEndString = `${searchParams.date}T${searchParams.endTime}:00`;

      const startUtc = fromZonedTime(localStartString, USER_TIMEZONE);
      const endUtc = fromZonedTime(localEndString, USER_TIMEZONE);

      const response = await axios.post(
        "/api/v1/parking-spots/building/find-available",
        {
          building_id: user.resident_building,
          start_datetime: startUtc.toISOString(), // Send as UTC
          end_datetime: endUtc.toISOString(), // Send as UTC
          timezone: USER_TIMEZONE,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const status = response.data?.status;
      const spot = response.data?.data?.spot;

      // Handle different scenarios based on date and status
      const isToday =
        searchParams.date === new Date().toISOString().split("T")[0];

      // If spot found, show confirmation popup
      if (status === "success" && spot) {
        setFoundSpot(spot);
        setPopupData({
          title: "חניה נמצאה בהצלחה",
          type: "confirm",
          description: (
            <BookingSummaryCard spot={spot} searchParams={searchParams} />
          ),
          onConfirm: () => handleConfirmReservation(spot),
        });
        return;
      }

      if (status === "no_spot_today" || (status === "accepted" && isToday)) {
        // Today's search - offer private parking directly
        setPopupData({
          title: "לא נמצאה חניה זמינה בבניין בזמנים שביקשת",
          description: "האם לחפש חניה פרטית באזורך?",
          type: "confirm",
          onConfirm: runPrivateParkingFallback,
        });
      } else if (
        status === "no_spot_future" ||
        (status === "accepted" && !isToday)
      ) {
        // Future search - offer waitlist first
        setPopupData({
          title: "לא נמצאה חניה בזמן שביקשת",
          description: "האם תרצה להיכנס לרשימת ההמתנה?",
          type: "confirm",
          onConfirm: handleWaitlistConfirmation,
          onCancel: () => {
            setPopupData({
              title: "חיפוש חניה פרטית",
              description: "האם לחפש חניה פרטית בתשלום באזורך?",
              type: "confirm",
              onConfirm: runPrivateParkingFallback,
            });
          },
        });
      }
    } catch (err) {
      console.error("Parking request error:", err);
      setPopupData({
        title: "שגיאת חיפוש",
        description: err.response?.data?.message || "אירעה שגיאה בלתי צפויה.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fallback to search private parking spots nearby
  const runPrivateParkingFallback = async () => {
    setLoading(true);
    try {
      const token =
        typeof Storage !== "undefined" ? localStorage.getItem("token") : null;
      const user =
        typeof Storage !== "undefined"
          ? JSON.parse(localStorage.getItem("user") || "{}")
          : {};
      const { latitude = 32.0518, longitude = 34.8585 } = user?.address || {};

      // Convert local datetime to UTC for private parking search
      const localStartString = `${searchParams.date}T${searchParams.startTime}:00`;
      const localEndString = `${searchParams.date}T${searchParams.endTime}:00`;

      const startUtc = fromZonedTime(localStartString, USER_TIMEZONE);
      const endUtc = fromZonedTime(localEndString, USER_TIMEZONE);

      const requestBody = {
        latitude,
        longitude,
        date: searchParams.date,
        startTime: searchParams.startTime,
        endTime: searchParams.endTime,
        start_datetime: startUtc.toISOString(), // Add UTC datetime
        end_datetime: endUtc.toISOString(), // Add UTC datetime
        timezone: USER_TIMEZONE,
      };

      // Add charging station filters if selected
      if (searchParams.is_charging_station) {
        requestBody.is_charging_station = true;
        if (searchParams.charger_type) {
          requestBody.charger_type = searchParams.charger_type;
        }
      }

      const response = await axios.post(
        "/api/v1/parking-spots/private/find-optimal",
        requestBody,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const spots = response.data?.data?.parkingSpots || [];

      if (spots.length > 0) {
        setFallbackResults(spots);
        setPopupData({
          title: "נמצאו חניות פרטיות",
          description: `נמצאו ${spots.length} חניות. בחר אחת להזמנה.`,
          type: "success",
        });
      } else {
        setPopupData({
          title: "לא נמצאו חניות פרטיות",
          description: "לא נמצאו חניות פרטיות זמינות בתאריכים ובשעות שנבחרו.",
          type: "info",
        });
      }
    } catch (error) {
      console.error("❌ Error during fallback:", error);
      setPopupData({
        title: "שגיאה",
        description: error.response?.data?.message || "שגיאה במהלך החיפוש.",
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
        <main className="flex-1 p-2 sm:p-4 md:p-6 lg:p-10 mt-16 w-full md:mr-64 lg:mr-80 transition-all duration-300 min-w-0">
          <div className="px-2 sm:px-0">
            <PageHeader
              icon={FaBuilding}
              title="חיפוש חניה בבניין מגורים"
              subtitle="מצא חניה בבניין מגורים בתאריך ובשעות הרצויות"
            />

            <div className="max-w-4xl mx-auto">
              <BuildingSearchForm
                searchParams={searchParams}
                handleInputChange={handleInputChange}
                chargerTypes={chargerTypes}
                searchParkingSpots={searchParkingSpots}
              />

              {/* Display fallback private parking results if available */}
              {fallbackResults.length > 0 && (
                <div className="mt-4 sm:mt-6 md:mt-8">
                  <FallbackResultsGrid
                    fallbackResults={fallbackResults}
                    searchParams={searchParams}
                    setPopupData={setPopupData}
                    handleConfirmReservation={handleConfirmReservation}
                    generateBookingSummary={generateBookingSummary} // Pass the function
                    setFoundSpot={setFoundSpot}
                    calculateHours={calculateHours}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />

      {/* Loading overlay */}
      {loading && <Loader />}

      {/* Popup for confirmations, errors, and success messages */}
      {popupData && (
        <Popup
          title={popupData.title}
          description={popupData.description}
          type={popupData.type || "info"}
          onClose={() => {
            if (popupData.onCancel) {
              popupData.onCancel();
            } else {
              setPopupData(null);
              setFoundSpot(null);
            }
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
