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

import { FaBuilding } from "react-icons/fa";

const ResidentialParkingSearch = ({ loggedIn, setLoggedIn }) => {
  document.title = "חיפוש חניה בבניין מגורים | Spotly";

  const { searchParams, setSearchParams, handleInputChange } =
    useSearchParams();
  const [popupData, setPopupData] = useState(null);
  const [fallbackResults, setFallbackResults] = useState([]);
  const [foundSpot, setFoundSpot] = useState(null);
  const [loading, setLoading] = useState(false);

  const chargerTypes = [
    { id: "Type 1", label: "סוג 1" },
    { id: "Type 2", label: "סוג 2" },
    { id: "CCS", label: "CCS" },
    { id: "CHAdeMO", label: "CHAdeMO" },
    { id: "Other", label: "אחר" },
  ];

  const calculateHours = () => {
    const [startH, startM] = searchParams.startTime.split(":").map(Number);
    const [endH, endM] = searchParams.endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const diff = endMinutes - startMinutes;
    return Math.max(1, Math.ceil(diff / 60));
  };

  const handleConfirmReservation = async (selectedSpot) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const spotToBook = selectedSpot || foundSpot;
    const bookingType = spotToBook.is_charging_station ? "charging" : "parking";

    try {
      await axios.post(
        "/api/v1/bookings",
        {
          spot: spotToBook._id,
          booking_type: bookingType,
          start_datetime: `${searchParams.date}T${searchParams.startTime}:00`,
          end_datetime: `${searchParams.date}T${searchParams.endTime}:00`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPopupData({
        title: "הזמנה בוצעה בהצלחה",
        type: "success",
        description: (
          <BookingSummaryCard spot={spotToBook} searchParams={searchParams} />
        ),
      });

      setFoundSpot(null);
      setFallbackResults([]);
    } catch (error) {
      console.error("❌ Failed to confirm booking:", error);
      setPopupData({
        title: "שגיאת הזמנה",
        type: "error",
        description: error.response?.data?.message || "אירעה שגיאה בעת ההזמנה.",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchParkingSpots = async (e) => {
    setLoading(true);
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

      if (
        status === "accepted" ||
        status === "no_spot_today" ||
        status === "no_spot_future"
      ) {
        setPopupData({
          title: "לא נמצאה חניה זמינה",
          description: "האם לחפש חניה פרטית באזורך?",
          type: "confirm",
          onConfirm: runPrivateParkingFallback,
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

  const runPrivateParkingFallback = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));
      const { latitude = 32.0518, longitude = 34.8585 } = user?.address || {};

      const requestBody = {
        latitude,
        longitude,
        date: searchParams.date,
        startTime: searchParams.startTime,
        endTime: searchParams.endTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

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
        <main className="flex-1 p-4 md:p-10 mt-16 w-full mr-64 lg:mr-80 transition-all duration-300 min-w-0">
          <PageHeader
            icon={FaBuilding}
            title="חיפוש חניה בבניין מגורים"
            subtitle="מצא חניה בבניין מגורים בתאריך ובשעות הרצויות"
          />

          <BuildingSearchForm
            searchParams={searchParams}
            handleInputChange={handleInputChange}
            chargerTypes={chargerTypes}
            searchParkingSpots={searchParkingSpots}
          />

          {fallbackResults.length > 0 && (
            <FallbackResultsGrid
              fallbackResults={fallbackResults}
              searchParams={searchParams}
              setPopupData={setPopupData}
              handleConfirmReservation={handleConfirmReservation}
              setFoundSpot={setFoundSpot}
              calculateHours={calculateHours}
            />
          )}
        </main>
      </div>
      <Footer />

      {loading && <Loader />}

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
