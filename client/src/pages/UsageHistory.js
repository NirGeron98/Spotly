import { useState, useEffect } from "react";
import axios from "../axios";
import Navbar from "../components/shared/Navbar";
import Sidebar from "../components/shared/Sidebar";
import Footer from "../components/shared/Footer";
import Popup from "../components/shared/Popup";
import UsageFilters from "../components/usage-history/UsageFilters";
import UsageDesktopTable from "../components/usage-history/UsageDesktopTable";
import UsageMobileCards from "../components/usage-history/UsageMobileCards";
import PageHeader from "../components/shared/PageHeader";
import { USER_TIMEZONE } from "../utils/constants";
import { parseISO, isValid } from "date-fns";
import { format, toZonedTime } from "date-fns-tz";
import {
  FaParking,
  FaCar,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaBuilding,
  FaChevronLeft,
  FaChevronRight,
  FaSortUp,
  FaSortDown,
  FaSort,
  FaHistory,
  FaClock,
  FaUser,
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
    } catch (err) {
      console.error("שגיאה בעת טעינת היסטוריית שימוש:", err);
      setUsageHistory([]);
    } finally {
      setLoading(false);
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

  const getStatusDisplay = (status) => {
    switch (status) {
      case "active":
        return {
          text: "פעיל",
          class: "bg-emerald-100 text-emerald-800 border-emerald-200",
          icon: "🟢",
        };
      case "completed":
        return {
          text: "הושלם",
          class: "bg-blue-100 text-blue-800 border-blue-200",
          icon: "✅",
        };
      case "cancelled":
        return {
          text: "בוטל",
          class: "bg-red-100 text-red-800 border-red-200",
          icon: "❌",
        };
      case "available":
        return {
          text: "זמין",
          class: "bg-green-100 text-green-800 border-green-200",
          icon: "🆓",
        };
      case "booked":
        return {
          text: "מוזמן",
          class:
            "bg-purple-100 text-purple-800 border-purple-200 cursor-pointer hover:bg-purple-200",
          icon: "📅",
        };
      default:
        return {
          text: status,
          class: "bg-gray-100 text-gray-800 border-gray-200",
          icon: "❓",
        };
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
    const iconProps = "text-lg";
    switch (iconName) {
      case "FaParking":
        return <FaParking className={`${iconProps} text-blue-600`} />;
      case "FaCar":
        return <FaCar className={`${iconProps} text-indigo-600`} />;
      case "FaMapMarkerAlt":
        return <FaMapMarkerAlt className={`${iconProps} text-red-600`} />;
      case "FaCalendarAlt":
        return <FaCalendarAlt className={`${iconProps} text-green-600`} />;
      default:
        return <FaHistory className={`${iconProps} text-gray-600`} />;
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
        return "שינוי/הוספת זמינות";
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
        <div className="text-right text-gray-800 space-y-3 leading-relaxed bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <FaUser className="text-blue-600" />
            <div>
              <strong>שם מלא:</strong> {user.first_name} {user.last_name}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>📧</span>
            <div>
              <strong>אימייל:</strong> {user.email}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>📱</span>
            <div>
              <strong>טלפון:</strong> {user.phone_number}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FaClock className="text-green-600" />
            <div>
              <strong>שעות ההזמנה:</strong> {start} - {end}
            </div>
          </div>
        </div>
      );

      setPopupData({
        title: "פרטי המזמין",
        description: content,
        type: "info",
      });
    } catch (err) {
      console.error("שגיאה בעת טעינת פרטי המזמין:", err);
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
        const dateA = a.rawActionDate ? new Date(a.rawActionDate) : new Date(0);
        const dateB = b.rawActionDate ? new Date(b.rawActionDate) : new Date(0);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }

      if (sortField === "date") {
        const dateA = a.rawDate ? new Date(a.rawDate) : new Date(0);
        const dateB = b.rawDate ? new Date(b.rawDate) : new Date(0);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }

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

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxButtons = 5;

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
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

        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-10 mt-16 w-full mr-0 sm:mr-16 md:mr-64 lg:mr-80 transition-all duration-300 min-w-0">
          {/* Header Section - Responsive */}
          <PageHeader
            icon={FaHistory}
            title="היסטוריית שימוש"
            subtitle="כאן תוכל לצפות בכל הפעילויות שלך במערכת"
          />

          {/* Mode Indicator - Responsive */}
          <div className="flex items-center justify-center mb-6 sm:mb-8 px-4 sm:px-0">
            {localStorage.getItem("mode") === "building" ? (
              <div className="flex flex-col sm:flex-row items-center bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-lg border border-green-200 gap-2 sm:gap-3 max-w-full">
                <FaBuilding className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                <span className="text-sm sm:text-base font-semibold text-center sm:text-right">
                  מציג נתונים עבור מסלול בניין מגורים
                </span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-lg border border-blue-200 gap-2 sm:gap-3 max-w-full">
                <FaCar className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                <span className="text-sm sm:text-base font-semibold text-center sm:text-right">
                  מציג נתונים עבור מסלול חניות פרטיות
                </span>
              </div>
            )}
          </div>

          {/* Filters Section - Responsive */}
          <UsageFilters
            filters={filters}
            handleFilterChange={handleFilterChange}
            resetFilters={resetFilters}
            setFilters={setFilters}
          />

          {/* Table Section - Modern Design */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 overflow-hidden w-full max-w-6xl mx-auto">
            {/* Desktop Table View */}
            <UsageDesktopTable
              items={currentItems}
              getStatusDisplay={getStatusDisplay}
              getActivityIcon={getActivityIcon}
              getActivityTypeDisplay={getActivityTypeDisplay}
              formatDisplayDate={formatDisplayDate}
              formatDisplayTime={formatDisplayTime}
              getBookingDetails={getBookingDetails}
            />

            {/* Mobile Card View */}
            <UsageMobileCards
              items={currentItems}
              getActivityIcon={getActivityIcon}
              getActivityTypeDisplay={getActivityTypeDisplay}
              getStatusDisplay={getStatusDisplay}
              getBookingDetails={getBookingDetails}
              formatDisplayDate={formatDisplayDate}
              formatDisplayTime={formatDisplayTime}
            />

            {/* Pagination */}
            {!loading && filteredHistory.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 py-4 border-t bg-gradient-to-r from-gray-50 to-white gap-4">
                <div className="text-sm text-gray-600 order-2 sm:order-1">
                  מציג {indexOfFirstItem + 1}-
                  {Math.min(indexOfLastItem, filteredHistory.length)} מתוך{" "}
                  {filteredHistory.length} רשומות
                </div>

                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      currentPage === 1
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 shadow-lg"
                    }`}
                  >
                    <FaChevronRight className="text-xs" />
                    <span className="hidden sm:inline">הקודם</span>
                  </button>

                  <div className="flex items-center gap-1 sm:gap-2">
                    {getPageNumbers().map((pageNumber, index) => (
                      <button
                        key={index}
                        onClick={() =>
                          typeof pageNumber === "number" &&
                          handlePageChange(pageNumber)
                        }
                        disabled={pageNumber === "..."}
                        className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                          pageNumber === currentPage
                            ? "bg-blue-700 text-white shadow-lg transform scale-105"
                            : pageNumber === "..."
                            ? "bg-transparent text-gray-400 cursor-default"
                            : "bg-white text-gray-700 hover:bg-blue-100 hover:text-blue-700 border border-gray-300 hover:border-blue-300"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      currentPage === totalPages
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105 shadow-lg"
                    }`}
                  >
                    <span className="hidden sm:inline">הבא</span>
                    <FaChevronLeft className="text-xs" />
                  </button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredHistory.length === 0 && (
              <div className="text-center py-12 px-4">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <FaHistory className="text-4xl text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  לא נמצאה היסטוריית פעילות
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  לא קיימות פעילויות התואמות לקריטריונים שנבחרו. נסה לשנות את
                  הפילטרים או לבצע פעילויות חדשות במערכת.
                </p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12 px-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  טוען היסטוריית שימוש...
                </h3>
                <p className="text-gray-500">
                  אנא המתן בזמן שאנחנו טוענים את הנתונים שלך
                </p>
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
