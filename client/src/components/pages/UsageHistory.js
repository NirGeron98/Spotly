import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../shared/Navbar";
import Sidebar from "../shared/Sidebar";
import Footer from "../shared/Footer";
import Popup from "../shared/Popup";
import { USER_TIMEZONE } from "../utils/constants";
import { parseISO, isValid } from "date-fns";
import { format, toZonedTime } from "date-fns-tz";
import {
  FaSearch,
  FaSync,
  FaParking,
  FaCar,
  FaCalendarAlt,
  FaMapMarkerAlt,
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
    paymentStatus: "all",
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

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const fetchAllUserActivity = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const mode = localStorage.getItem("mode");

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
      const bookingHistory = bookings
        .filter((b) => {
          if (mode === "building") {
            return b.booking_type === "building";
          } else if (mode === "paid") {
            return b.booking_type === "parking";
          }
          return false;
        })
        .map((b) => {
          const startDate = b.start_datetime
            ? parseISO(b.start_datetime)
            : null;
          const actionDate = b.created_at ? parseISO(b.created_at) : null;

          return {
            id: b._id,
            date: formatDisplayDate(b.start_datetime),
            startTime: formatDisplayTime(b.start_datetime),
            endTime: formatDisplayTime(b.end_datetime),
            actionDate: b.created_at,
            address: b.spot?.address
              ? `${b.spot.address.street || ""} ${
                  b.spot.address.number || ""
                }, ${b.spot.address.city || ""}`
              : "כתובת לא זמינה",
            city: b.spot?.address?.city || "",
            price: b.final_amount || b.base_rate || 0,
            type: b.spot?.owner?.toString() === user._id ? "השכרה" : "הזמנה",
            status: b.status || "active",
            paymentStatus: b.payment_status || "pending",
            bookingType: b.booking_type || "parking",
            rawDate: isValid(startDate) ? startDate : null,
            rawActionDate: isValid(actionDate) ? actionDate : null,
            activityType:
              b.spot?.owner?.toString() === user._id ? "rental" : "booking",
            icon:
              b.spot?.owner?.toString() === user._id ? "FaParking" : "FaCar",
            showPaymentIcon:
              b.payment_status === "completed" && b.status === "completed",
            originalBooking: b,
          };
        });

      // Transform published spots into history items
      const spotHistory = spots.flatMap((spot) => {
        const spotDate = spot.created_at ? parseISO(spot.created_at) : null;

        const spotEntry = {
          id: spot._id,
          date: formatDisplayDate(spot.created_at),
          startTime: formatDisplayTime(spot.created_at),
          endTime: "-",
          actionDate: spot.created_at,
          rawActionDate: isValid(spotDate) ? spotDate : null,
          address: spot.address
            ? `${spot.address.street || ""} ${spot.address.number || ""}, ${
                spot.address.city || ""
              }`
            : "כתובת לא זמינה",
          city: spot.address?.city || "",
          price: spot.hourly_rate || 0,
          type: "פרסום חניה",
          status: "active",
          paymentStatus: "n/a",
          rawDate: isValid(spotDate) ? spotDate : null,
          rawActionDate: isValid(spotDate) ? spotDate : null,
          activityType: "publication",
          icon: "FaMapMarkerAlt",
          showPaymentIcon: false,
          originalSpot: spot,
        };

        const scheduleEntries = (spot.availability_schedule || []).map(
          (schedule) => {
            let scheduleActionDate = spotDate;
            if (schedule.start_datetime) {
              const candidate = parseISO(schedule.start_datetime);
              if (isValid(candidate)) {
                scheduleActionDate = candidate;
              }
            }

            const formatTime = (isoString) => {
              try {
                if (!isoString) return "-";
                const date = parseISO(isoString);
                if (!isValid(date)) return "-";
                const zoned = toZonedTime(date, USER_TIMEZONE);
                return format(zoned, "HH:mm", { timeZone: USER_TIMEZONE });
              } catch {
                return "-";
              }
            };

            return {
              id: `${spot._id}-${schedule._id}`,
              date: schedule.start_datetime
                ? formatDisplayDate(schedule.start_datetime)
                : "N/A",
              startTime: formatTime(schedule.start_datetime),
              endTime: formatTime(schedule.end_datetime),
              address: spot.address
                ? `${spot.address.street || ""} ${spot.address.number || ""}, ${
                    spot.address.city || ""
                  }`
                : "כתובת לא זמינה",
              city: spot.address?.city || "",
              price: spot.hourly_rate || 0,
              type: "זמינות חניה",
              status: schedule.is_available ? "available" : "booked",
              paymentStatus: "n/a",
              rawDate: schedule.start_datetime
                ? parseISO(schedule.start_datetime)
                : null,
              actionDate: scheduleActionDate,
              rawActionDate: scheduleActionDate,
              activityType: "availability",
              icon: "FaCalendarAlt",
              showPaymentIcon: false,
              originalSchedule: schedule,
              originalSpot: spot,
              scheduleId: schedule._id,
            };
          }
        );

        return [spotEntry, ...scheduleEntries];
      });

      // Combine all history items
      const combinedHistory = [...bookingHistory, ...spotHistory];
      setUsageHistory(combinedHistory);

      // הוספת console.log לבדיקה
      console.log("Data loaded successfully:", combinedHistory.length, "items");
    } catch (err) {
      console.error("שגיאה בעת טעינת היסטוריית שימוש:", err);
      setUsageHistory([]); // וודא שה-state מתעדכן גם במקרה של שגיאה
    } finally {
      // וודא שה-loading מתבטל תמיד, גם במקרה של שגיאה
      setLoading(false);
      console.log("Loading state set to false");
    }
  };

  useEffect(() => {
    fetchAllUserActivity();
  }, []);

  useEffect(() => {
    fetchAllUserActivity();
  }, [localStorage.getItem("mode")]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, triggerSearch: false }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: "",
      usageType: "all",
      status: "all",
      activityType: "all",
      paymentStatus: "all",
      triggerSearch: false,
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
      default:
        return null;
    }
  };

  const getActivityTypeDisplay = (type) => {
    switch (type) {
      case "booking":
        return "ביצוע הזמנה";
      case "rental":
        return "השכרת חניה";
      case "publication":
        return "התחלת פעילות";
      case "availability":
        return "שינוי/ הוספת זמינות ";
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
      ${getActivityTypeDisplay(item.activityType) || ""} 
      ${getStatusDisplay(item.status).text || ""}
      ${getPaymentStatusDisplay(item.paymentStatus).text || ""}
      ${
        formatDisplayDateTime(
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

      const matchActivityType =
        filters.activityType === "all" ||
        filters.activityType === item.activityType;

      const matchPaymentStatus =
        filters.paymentStatus === "all" ||
        filters.paymentStatus === item.paymentStatus;

      return (
        matchText &&
        matchUsage &&
        matchStatus &&
        matchActivityType &&
        matchPaymentStatus
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
        ? valA.toString().localeCompare(valA.toString())
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
            היסטוריית שימוש
          </h1>
          <p className="text-gray-600 text-lg mb-8 text-center">
            כאן תוכל לצפות בכל הפעילויות שלך במערכת
          </p>

          {/* Display mode-specific icon with spacing */}
          <div className="flex items-center justify-center mb-4">
            {localStorage.getItem("mode") === "building" ? (
              <div className="flex items-center bg-green-100 text-green-800 px-4 py-2 rounded shadow-md">
                <FaBuilding className="h-6 w-6 ml-3" />
                <span>מציג נתונים עבור מסלול בניין מגורים</span>
              </div>
            ) : (
              <div className="flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded shadow-md">
                <FaCar className="h-6 w-6 ml-3" />
                <span>מציג נתונים עבור מסלול חניות פרטיות</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center mb-8">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end max-w-6xl w-full">
              <div className="col-span-2">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  סוג פעילות:
                </label>
                <select
                  name="activityType"
                  value={filters.activityType}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm"
                >
                  <option value="all">הכל</option>
                  <option value="booking">הזמנת חניה</option>
                  <option value="rental">השכרת חניה</option>
                  <option value="publication">התחלת פעילות</option>
                  <option value="availability">
                    שינוי/ הוספת זמינות לחניה פרטית{" "}
                  </option>
                </select>
              </div>

              <div>
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
                <div className="px-3 py-3 w-[35%] font-semibold text-center">
                  פרטים נוספים
                </div>
                <div className="px-3 py-3 w-[20%] font-semibold text-center">
                  סוג פעילות
                </div>
                <div className="px-3 py-3 w-[15%] font-semibold text-center">
                  סטטוס
                </div>
              </div>

              {/* Table body */}
              <div className="divide-y">
                {currentItems.map((item, index) => {
                  const status = getStatusDisplay(item.status);

                  const actionDateTime = item.rawActionDate || item.actionDate;

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
                      <div className="px-3 py-3 w-[35%] text-center">
                        {item.activityType !== "publication" ? (
                          <div className="text-sm leading-relaxed">
                            {(item.activityType === "booking" ||
                              item.activityType === "availability") && (
                              <>
                                <div>תאריך: {item.date}</div>
                                <div>
                                  שעות: {item.startTime}
                                  {item.endTime !== "-" && ` - ${item.endTime}`}
                                </div>
                              </>
                            )}
                            {item.activityType === "booking" && (
                              <div>כתובת: {item.address}</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm" />
                        )}
                      </div>
                      <div className="px-3 py-3 w-[20%]">
                        <div className="flex items-center justify-center gap-1">
                          <span className="w-5 h-5 flex items-center justify-center">
                            {getActivityIcon(item.icon)}
                          </span>
                          <span className="whitespace-nowrap">
                            {getActivityTypeDisplay(item.activityType)}
                          </span>
                        </div>
                      </div>
                      <div className="px-3 py-3 w-[15%] flex justify-center">
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
                    className={`px-3 py-1 rounded-full transition ${
                      currentPage === 1
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
                      className={`px-4 py-1.5 rounded-full font-medium transition ${
                        pageNumber === currentPage
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
                    className={`px-3 py-1 rounded-full transition ${
                      currentPage === totalPages
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
              <div className="text-center py-4 text-gray-500 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700 ml-5"></div>
                <span>טוען היסטוריית שימוש...</span>
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
