import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../shared/Navbar";
import Sidebar from "../shared/Sidebar";
import Footer from "../shared/Footer";
import Popup from "../shared/Popup";
import { USER_TIMEZONE } from "../utils/constants";
import { parseISO, isValid, startOfDay } from "date-fns";
import { format, toZonedTime } from "date-fns-tz";
import {
  FaSearch,
  FaSync,
  FaParking,
  FaCar,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaMoneyBill,
  FaInfoCircle,
  FaBuilding,
} from "react-icons/fa";

const UsageHistory = ({ loggedIn, setLoggedIn }) => {
  document.title = "היסטוריית שימוש | Spotly";

  const [current, setCurrent] = useState("history");
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role || "user";

  const [usageHistory, setUsageHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popupData, setPopupData] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const [filters, setFilters] = useState({
    searchTerm: "",
    triggerSearch: false,
    usageType: "all",
    status: "all",
    activityType: "all",
  });

  const [sortField, setSortField] = useState("actionDate");
  const [sortOrder, setSortOrder] = useState("desc");

  // Consolidated formatter for date and time
  const formatDisplayDateTime = (dateTime) => {
    if (!dateTime) return "N/A";
    try {
      const date = dateTime instanceof Date ? dateTime : parseISO(dateTime);
      if (!isValid(date)) return "Invalid Date";
      const zonedDate = toZonedTime(date, USER_TIMEZONE);
      return format(zonedDate, "dd/MM/yyyy HH:mm", { timeZone: USER_TIMEZONE });
    } catch (e) {
      console.error("Error formatting display date-time:", e, dateTime);
      return "Invalid Date";
    }
  };

  const formatDisplayDate = (dateTime) => {
    if (!dateTime) return "N/A";
    try {
      const date = dateTime instanceof Date ? dateTime : parseISO(dateTime);
      if (!isValid(date)) return "Invalid Date";
      const zonedDate = toZonedTime(date, USER_TIMEZONE);
      return format(zonedDate, "dd/MM/yyyy", { timeZone: USER_TIMEZONE });
    } catch (e) {
      console.error("Error formatting display date:", e, dateTime);
      return "Invalid Date";
    }
  };

  const formatDisplayTime = (dateTime) => {
    if (!dateTime) return "N/A";
    try {
      const date = dateTime instanceof Date ? dateTime : parseISO(dateTime);
      if (!isValid(date)) return "Invalid Date";
      const zonedDate = toZonedTime(date, USER_TIMEZONE);
      return format(zonedDate, "HH:mm", { timeZone: USER_TIMEZONE });
    } catch (e) {
      console.error("Error formatting display time:", e, dateTime);
      return "Invalid Date";
    }
  };

  useEffect(() => {
    fetchAllUserActivity();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Helper function to fetch booking details for a specific schedule
  const fetchBookingDetailsForSchedule = async (spotId, scheduleId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `/api/v1/bookings/spot/${spotId}/schedule/${scheduleId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data?.data?.booking || null;
    } catch (error) {
      console.error("Error fetching booking details:", error);
      return null;
    }
  };

  // Modified fetchAllUserActivity function with booking details fetching
  const fetchAllUserActivity = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch user's bookings (either as customer or as owner)
      const bookingsResponse = await axios.get(
        "/api/v1/bookings/user/my-bookings",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Fetch user's published parking spots
      const spotsResponse = await axios.get("/api/v1/parking-spots/my-spots", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Process bookings data
      const bookings = bookingsResponse.data?.data?.bookings || [];
      const spots = spotsResponse.data?.data?.parkingSpots || [];

      // Transform bookings into history items
      const bookingHistory = bookings.map((b) => {
        // Safely parse dates with validation
        const startDate = b.start_datetime ? parseISO(b.start_datetime) : null;
        const endDate = b.end_datetime ? parseISO(b.end_datetime) : null;
        const actionDate = b.created_at ? parseISO(b.created_at) : null;

        // Check if it's a building spot (for cooperative/free parking)
        const isBuilding = b.spot?.spot_type === "building";

        // Format address based on booking type
        let address = "כתובת לא זמינה";

        if (isBuilding) {
          // For residential building bookings, use user's address
          if (user?.address) {
            const userAddress = user.address;
            const addressParts = [];
            if (userAddress.street && userAddress.number) {
              addressParts.push(`${userAddress.street} ${userAddress.number}`);
            }
            if (userAddress.city) {
              addressParts.push(userAddress.city);
            }
            address = addressParts.join(', ') || "כתובת לא זמינה";
          }
        } else {
          // For regular paid parking, use spot's address
          if (b.spot?.address) {
            address = `${b.spot.address.street || ""} ${b.spot.address.number || ""}, ${b.spot.address.city || ""}`;
          }
        }

        return {
          id: b._id,
          date: formatDisplayDate(b.start_datetime),
          startTime: formatDisplayTime(b.start_datetime),
          endTime: formatDisplayTime(b.end_datetime),
          actionDate: b.created_at,
          address: address,
          city: isBuilding ? (user?.address?.city || "") : (b.spot?.address?.city || ""),
          price: b.final_amount || b.base_rate || 0,
          type: b.spot?.owner?.toString() === user._id ? "השכרה" : "הזמנה",
          status: b.status || "active",
          paymentStatus: b.payment_status || "pending",
          bookingType: b.booking_type || "parking",
          rawDate: isValid(startDate) ? startDate : null,
          rawActionDate: isValid(actionDate) ? actionDate : null,
          activityType:
            b.spot?.owner?.toString() === user._id ? "booking" : "booking",
          icon: isBuilding ? "FaBuilding" : (b.spot?.owner?.toString() === user._id ? "FaParking" : "FaCar"),
          showPaymentIcon:
            b.payment_status === "completed" && b.status === "completed",
          isPaid: !isBuilding,
          originalBooking: b,
        };
      });

      // Transform published spots into history items with booking details for booked schedules
      const spotHistory = [];

      for (const spot of spots) {
        // Safely parse spot creation date
        const spotDate = spot.created_at ? parseISO(spot.created_at) : null;
        const isBuilding = spot.spot_type === "building";

        // Format address for published spots
        let spotAddress = "כתובת לא זמינה";

        if (isBuilding) {
          // For residential building spots, use user's address
          if (user?.address) {
            const userAddress = user.address;
            const addressParts = [];
            if (userAddress.street && userAddress.number) {
              addressParts.push(`${userAddress.street} ${userAddress.number}`);
            }
            if (userAddress.city) {
              addressParts.push(userAddress.city);
            }
            spotAddress = addressParts.join(', ') || "כתובת לא זמינה";
          }
        } else {
          // For regular spots, use spot's address
          if (spot.address) {
            spotAddress = `${spot.address.street || ""} ${spot.address.number || ""}, ${spot.address.city || ""}`;
          }
        }

        const spotEntry = {
          id: spot._id,
          date: formatDisplayDate(spot.created_at),
          startTime: formatDisplayTime(spot.created_at),
          endTime: "-",
          actionDate: spot.created_at,
          rawActionDate: isValid(spotDate) ? spotDate : null,
          address: spotAddress,
          city: isBuilding ? (user?.address?.city || "") : (spot.address?.city || ""),
          price: spot.hourly_rate || 0,
          type: "פרסום חניה",
          status: "active",
          paymentStatus: "n/a",
          rawDate: isValid(spotDate) ? spotDate : null,
          activityType: "publication",
          icon: isBuilding ? "FaBuilding" : "FaMapMarkerAlt",
          showPaymentIcon: false,
          isPaid: !isBuilding,
          originalSpot: spot,
        };

        spotHistory.push(spotEntry);

        // Process schedule entries with proper booking details
        for (const schedule of (spot.availability_schedule || [])) {
          let scheduleDate = null;
          let scheduleStartTime = "N/A";
          let scheduleEndTime = "N/A";

          // Parse the start_datetime and end_datetime from the schedule
          try {
            if (schedule.start_datetime) {
              const startDateTime = parseISO(schedule.start_datetime);
              if (isValid(startDateTime)) {
                const zonedStart = toZonedTime(startDateTime, USER_TIMEZONE);
                scheduleDate = startOfDay(zonedStart);
                scheduleStartTime = format(zonedStart, "HH:mm", { timeZone: USER_TIMEZONE });
              }
            }

            if (schedule.end_datetime) {
              const endDateTime = parseISO(schedule.end_datetime);
              if (isValid(endDateTime)) {
                const zonedEnd = toZonedTime(endDateTime, USER_TIMEZONE);
                scheduleEndTime = format(zonedEnd, "HH:mm", { timeZone: USER_TIMEZONE });
              }
            }
          } catch (err) {
            console.error("Error parsing schedule datetime:", err, schedule);
          }

          let scheduleActionDate = null;
          let actualActionDate = null;

          // If the schedule is booked, fetch booking details to get the correct execution date
          if (schedule.is_available === false || schedule.booking_id) {
            try {
              const bookingDetails = await fetchBookingDetailsForSchedule(spot._id, schedule._id);
              if (bookingDetails && bookingDetails.created_at) {
                const bookingDate = parseISO(bookingDetails.created_at);
                if (isValid(bookingDate)) {
                  scheduleActionDate = bookingDate;
                  actualActionDate = bookingDetails.created_at;
                }
              }
            } catch (error) {
              console.error("Error fetching booking details for schedule:", error);
            }
          }

          // Fallback to schedule creation date if booking date not available
          if (!scheduleActionDate) {
            try {
              if (schedule.created_at) {
                scheduleActionDate = parseISO(schedule.created_at);
                actualActionDate = schedule.created_at;
                if (!isValid(scheduleActionDate)) {
                  scheduleActionDate = spotDate;
                  actualActionDate = spot.created_at;
                }
              } else {
                scheduleActionDate = spotDate;
                actualActionDate = spot.created_at;
              }
            } catch (err) {
              console.error("Error parsing schedule action date:", err);
              scheduleActionDate = spotDate;
              actualActionDate = spot.created_at;
            }
          }

          const scheduleEntry = {
            id: `${spot._id}-${schedule._id}`,
            date: scheduleDate ? formatDisplayDate(scheduleDate) : "N/A",
            startTime: scheduleStartTime,
            endTime: scheduleEndTime,
            address: spotAddress,
            city: isBuilding ? (user?.address?.city || "") : (spot.address?.city || ""),
            price: spot.hourly_rate || 0,
            type: isBuilding ? "פינוי חניה" : "זמינות חניה",
            status: (schedule.is_available === false || schedule.booking_id) ? "booked" : "available",
            paymentStatus: "n/a",
            rawDate: scheduleDate,
            rawActionDate: scheduleActionDate,
            actionDate: actualActionDate, // Use the correct action date
            activityType: "availability",
            icon: isBuilding ? "FaBuilding" : "FaCalendarAlt",
            showPaymentIcon: false,
            isPaid: !isBuilding,
            originalSchedule: schedule,
            originalSpot: spot,
            scheduleId: schedule._id,
          };

          spotHistory.push(scheduleEntry);
        }
      }

      // Combine all history items and sort by date
      const combinedHistory = [...bookingHistory, ...spotHistory];
      setUsageHistory(combinedHistory);
    } catch (err) {
      console.error("שגיאה בעת טעינת היסטוריית שימוש:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    if (name === "searchTerm") {
      // For search text, just update the state without triggering search
      setFilters((prev) => ({ ...prev, [name]: value, triggerSearch: false }));
    } else {
      // For dropdowns, immediately trigger the search
      setFilters((prev) => ({ ...prev, [name]: value, triggerSearch: true }));
    }
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: "",
      usageType: "all",
      status: "all",
      activityType: "all",
      triggerSearch: true, // Immediately trigger the search on reset
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder(
        field === "actionDate" || field === "actionTime" ? "desc" : "asc"
      );
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case "active":
        return { text: "פעיל", class: "bg-green-100 text-green-800" };
      case "completed":
        return { text: "הושלם", class: "bg-blue-100 text-blue-800" };
      case "cancelled":
        return { text: "בוטל", class: "bg-red-100 text-red-800" };
      case "available":
        return { text: "זמין", class: "bg-emerald-100 text-emerald-800" };
      case "booked":
        return {
          text: "מוזמן",
          class: "bg-purple-100 text-purple-800 cursor-pointer",
        };
      default:
        return { text: status, class: "bg-gray-100 text-gray-800" };
    }
  };

  const getPaymentStatusDisplay = (status) => {
    switch (status) {
      case "completed":
        return { text: "שולם", class: "bg-green-100 text-green-800" };
      case "pending":
        return { text: "ממתין לתשלום", class: "bg-yellow-100 text-yellow-800" };
      case "n/a":
        return { text: "", class: "" };
      default:
        return { text: status, class: "bg-gray-100 text-gray-800" };
    }
  };

  const getActivityIcon = (iconName) => {
    switch (iconName) {
      case "FaParking":
        return <FaParking className="text-blue-600" />;
      case "FaCar":
        return <FaCar className="text-indigo-600" />;
      case "FaMapMarkerAlt":
        return <FaMapMarkerAlt className="text-red-600" />;
      case "FaCalendarAlt":
        return <FaCalendarAlt className="text-green-600" />;
      case "FaBuilding":
        return <FaBuilding className="text-purple-600" />;
      default:
        return null;
    }
  };

  const getActivityTypeDisplay = (type, item) => {
    // Check if this is an availability activity in a residential building
    if (type === "availability" &&
      item.originalSpot &&
      item.originalSpot.spot_type === "building") {
      return "פינוי חניה לשכן";  // "vacating parking space for a neighbor"
    }

    // Original switch case for other activity types
    switch (type) {
      case "booking":
        return "ביצוע הזמנה";
      case "publication":
        return "התחלת פעילות";
      case "availability":
        return "שינוי/ הוספת זמינות";
      default:
        return type;
    }
  };

  const getBookingDetails = async (item) => {
    if (item.status !== "booked") return;

    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `/api/v1/bookings/spot/${item.originalSpot._id}/schedule/${item.scheduleId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const booking = res.data?.data?.booking;

      if (!booking || !booking.user) {
        setPopupData({
          title: "אין הזמנה",
          description: "לא נמצאה הזמנה תואמת לפינוי הזה",
          type: "info",
        });
        return;
      }

      const user = booking.user;
      const start = formatDisplayTime(booking.start_datetime);
      const end = formatDisplayTime(booking.end_datetime);

      const content = (
        <div className="text-right text-gray-800 space-y-2 leading-relaxed">
          <p>
            <strong>שם מלא:</strong> {user.first_name} {user.last_name}
          </p>
          <p>
            <strong>אימייל:</strong> {user.email}
          </p>
          <p>
            <strong>טלפון:</strong> {user.phone_number}
          </p>
          <p>
            <strong>שעות ההזמנה:</strong> {start} - {end}
          </p>
        </div>
      );

      setPopupData({
        title: "פרטי המזמין",
        description: content,
        type: "info",
      });
    } catch (err) {
      setPopupData({
        title: "שגיאה",
        description: "לא ניתן לשלוף את פרטי המזמין",
        type: "error",
      });
    }
  };

  const filteredHistory = usageHistory
    .filter((item) => {
      if (!filters.triggerSearch) return true;

      const term = filters.searchTerm.toLowerCase();

      const searchableText = `
    ${item.address || ""} 
    ${item.city || ""} 
    ${item.date || ""} 
    ${item.startTime || ""} 
    ${item.endTime || ""} 
    ${getActivityTypeDisplay(item.activityType, item) || ""} 
    ${getStatusDisplay(item.status).text || ""}
    ${getPaymentStatusDisplay(item.paymentStatus).text || ""}
    ${formatDisplayDateTime(
        item.originalBooking?.created_at ||
        item.originalSpot?.created_at ||
        item.actionDate
      ) || ""
        }
  `.toLowerCase();

      const matchText = searchableText.includes(term);

      const matchUsage =
        filters.usageType === "all" || filters.usageType === item.type;

      const matchStatus =
        filters.status === "all" || filters.status === item.status;

      // Special handling for activity type filtering
      let matchActivityType = false;

      if (filters.activityType === "all") {
        matchActivityType = true;
      }
      else if (filters.activityType === "availability_building") {
        // Match residential building availability items
        matchActivityType = (
          (item.activityType === "availability" &&
            item.originalSpot &&
            item.originalSpot.spot_type === "building")
        );
      }
      else if (filters.activityType === "availability_regular") {
        // Match regular availability items
        matchActivityType = (
          (item.activityType === "availability" &&
            item.originalSpot &&
            item.originalSpot.spot_type !== "building")
        );
      }
      else {
        // Default case - match the exact activity type
        matchActivityType = (filters.activityType === item.activityType);
      }

      return (
        matchText &&
        matchUsage &&
        matchStatus &&
        matchActivityType
      );
    })
    .sort((a, b) => {
      if (sortField === "actionDate" || sortField === "actionTime") {
        // Use safe date comparison that handles null values
        const dateA = a.rawActionDate ? new Date(a.rawActionDate) : new Date(0);
        const dateB = b.rawActionDate ? new Date(b.rawActionDate) : new Date(0);

        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }

      if (sortField === "date") {
        // Use safe date comparison that handles null values
        const dateA = a.rawDate ? new Date(a.rawDate) : new Date(0);
        const dateB = b.rawDate ? new Date(b.rawDate) : new Date(0);

        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }

      // Handle other fields with null-safe comparison
      const valA = a[sortField] || "";
      const valB = b[sortField] || "";

      return sortOrder === "asc"
        ? valA.toString().localeCompare(valB.toString())
        : valB.toString().localeCompare(valA.toString());
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);

  // Generate page numbers
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxButtons = 5; // Maximum number of page buttons to show

    if (totalPages <= maxButtons) {
      // Show all pages if less than maxButtons
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Show limited page numbers with ellipsis
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Add an option for residential building activities
  const activityTypeOptions = (
    <>
      <option value="all">הכל</option>
      <option value="booking">הזמנת חניה</option>
      <option value="publication">התחלת פעילות</option>
      <option value="availability_regular">שינוי/ הוספת זמינות</option>
      <option value="availability_building">פינוי חניה לשכן</option>
    </>
  );

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
            היסטוריית פעילות
          </h1>
          <p className="text-gray-600 text-lg mb-8 text-center">
            כאן תוכל לצפות בכל הפעילויות שלך במערכת
          </p>

          <div className="flex flex-col items-center mb-8">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end max-w-6xl w-full">
              {/* Activity Type dropdown - rightmost */}
              <div className="col-span-1 md:col-span-1 order-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  סוג פעילות:
                </label>
                <select
                  name="activityType"
                  value={filters.activityType}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm"
                >
                  {activityTypeOptions}
                </select>
              </div>

              {/* Status dropdown - second from right */}
              <div className="col-span-1 md:col-span-1 order-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  סטטוס:
                </label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm"
                >
                  <option value="all">הכל</option>
                  <option value="active">פעיל</option>
                  <option value="completed">הושלם</option>
                  <option value="cancelled">בוטל</option>
                  <option value="available">זמין</option>
                  <option value="booked">מוזמן</option>
                </select>
              </div>

              {/* Search field and buttons - leftmost */}
              <div className="col-span-2 md:col-span-4 order-3 flex items-end gap-2">
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מונח חיפוש:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="searchTerm"
                      placeholder="הקלד כאן"
                      value={filters.searchTerm}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-2 pl-10 pr-3 rounded-md border border-gray-300 text-sm"
                    />
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, triggerSearch: true }))
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm flex items-center gap-2"
                  >
                    <FaSearch /> חפש
                  </button>
                  <button
                    onClick={resetFilters}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 text-sm flex items-center gap-2"
                  >
                    <FaSync /> איפוס
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto bg-white rounded-lg shadow-md max-w-7xl mx-auto flex flex-col">
            {/* Table container */}
            <div className="w-full text-base text-right">
              {/* Header row */}
              <div className="flex bg-indigo-50 text-indigo-800 border-b">
                <div
                  className="px-3 py-3 w-[10%] font-semibold cursor-pointer text-center"
                  onClick={() => handleSort("actionDate")}
                >
                  תאריך ביצוע
                </div>
                <div
                  className="px-3 py-3 w-[10%] font-semibold cursor-pointer text-center"
                  onClick={() => handleSort("actionDate")}
                >
                  שעת ביצוע
                </div>
                <div className="px-3 py-3 w-[40%] font-semibold text-center">
                  פרטים נוספים
                </div>
                <div className="px-3 py-3 w-[20%] font-semibold text-center">
                  סוג פעילות
                </div>
                <div className="px-3 py-3 w-[20%] font-semibold text-center">
                  סטטוס
                </div>
              </div>

              {/* Table body */}
              <div className="divide-y">
                {currentItems.map((item, index) => {
                  const status = getStatusDisplay(item.status);
                  const paymentStatus = getPaymentStatusDisplay(
                    item.paymentStatus
                  );
                  const actionDateTime = item.rawActionDate || item.actionDate;
                  const isPaid = item.isPaid;

                  return (
                    <div
                      key={index}
                      className="flex hover:bg-indigo-50 transition-colors duration-150"
                    >
                      <div className="px-3 py-3 w-[10%] text-center">
                        {formatDisplayDate(actionDateTime)}
                      </div>
                      <div className="px-3 py-3 w-[10%] text-center">
                        {formatDisplayTime(actionDateTime)}
                      </div>
                      <div className="px-3 py-3 w-[40%] text-center">
                        {item.activityType !== "publication" ? (
                          <div className="text-sm leading-relaxed">
                            {/* For booking activities - show booking details */}
                            {item.activityType === "booking" && (
                              <>
                                <div>תאריך הזמנה: {item.date}</div>
                                <div>
                                  שעות הזמנה: {item.startTime}
                                  {item.endTime !== "-" && ` - ${item.endTime}`}
                                </div>
                                <div>כתובת: {item.address}</div>
                                {isPaid && (
                                  <div>
                                    תעריף: {item.price} ש"ח לשעה
                                    {item.showPaymentIcon && (
                                      <FaMoneyBill className="text-green-600 mr-1 inline" />
                                    )}
                                  </div>
                                )}
                              </>
                            )}

                            {/* For availability activities - show original availability details */}
                            {item.activityType === "availability" && (
                              <>
                                <div>תאריך פינוי: {item.date}</div>
                                <div>
                                  שעות פינוי: {item.startTime}
                                  {item.endTime !== "-" && ` - ${item.endTime}`}
                                </div>
                                {/* Show hourly rate for regular parking */}
                                {item.originalSpot &&
                                  item.originalSpot.spot_type !== "building" &&
                                  item.isPaid && item.activityType !== "availability" && (
                                    <div>מחיר שעתי: {item.price} ₪</div>
                                  )}
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm">
                            {item.isPaid && item.activityType !== "publication" && (
                              <div className="text-sm">
                                <div>מחיר שעתי: {item.price} ₪</div>
                                <div>כתובת: {item.address}</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="px-3 py-3 w-[20%]">
                        <div className="flex items-center justify-center gap-1">
                          <span className="w-5 h-5 flex items-center justify-center">
                            {getActivityIcon(item.icon)}
                          </span>
                          <span className="whitespace-nowrap">
                            {getActivityTypeDisplay(item.activityType, item)}
                          </span>
                        </div>
                      </div>
                      <div className="px-3 py-3 w-[20%] flex justify-center">
                        {item.status === "booked" ? (
                          <div>
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs ${status.class} cursor-pointer`}
                              onClick={() => getBookingDetails(item)}
                            >
                              {status.text}
                              <FaInfoCircle className="inline-block text-purple-700 ml-1" />
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs ${status.class}`}
                            >
                              {status.text}
                            </span>
                            {isPaid && item.paymentStatus !== "n/a" && (
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs ml-1 ${paymentStatus.class}`}
                              >
                                {paymentStatus.text}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {!loading && filteredHistory.length > 0 && (
              <div className="flex justify-between items-center px-6 py-4 border-t bg-white mt-auto">
                <div className="text-sm text-gray-600">
                  מציג {indexOfFirstItem + 1}-
                  {Math.min(indexOfLastItem, filteredHistory.length)} מתוך{" "}
                  {filteredHistory.length}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-full transition ${currentPage === 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                  >
                    הקודם
                  </button>

                  {getPageNumbers().map((pageNumber, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        typeof pageNumber === "number" &&
                        handlePageChange(pageNumber)
                      }
                      disabled={pageNumber === "..."}
                      className={`px-4 py-1.5 rounded-full font-medium transition ${pageNumber === currentPage
                        ? "bg-blue-700 text-white"
                        : pageNumber === "..."
                          ? "bg-transparent text-gray-400 cursor-default"
                          : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                        }`}
                    >
                      {pageNumber}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-full transition ${currentPage === totalPages
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                  >
                    הבא
                  </button>
                </div>
              </div>
            )}

            {!loading && filteredHistory.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                לא נמצאה היסטוריית פעילות להצגה
              </div>
            )}

            {loading && (
              <div className="text-center py-4 text-gray-500">
                טוען היסטוריית...
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer />

      {/* Popup for displaying reservation details */}
      {popupData && (
        <Popup
          title={popupData.title}
          description={popupData.description}
          type={popupData.type || "info"}
          onClose={() => setPopupData(null)}
        />
      )}
    </div>
  );
};

export default UsageHistory;