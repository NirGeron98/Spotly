import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../shared/Navbar";
import Sidebar from "../shared/Sidebar";
import Footer from "../shared/Footer";
import Popup from "../shared/Popup";
import { FaSearch, FaSync, FaParking, FaCar, FaCalendarAlt, FaMapMarkerAlt, FaMoneyBill, FaInfoCircle } from "react-icons/fa";

const UsageHistory = ({ loggedIn, setLoggedIn }) => {
  document.title = "היסטוריית שימוש | Spotly";

  const [current, setCurrent] = useState("history");
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role || "user";

  const [usageHistory, setUsageHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popupData, setPopupData] = useState(null);

  const [filters, setFilters] = useState({
    searchTerm: "",
    searchField: "address",
    triggerSearch: false,
    usageType: "all",
    status: "all",
    activityType: "all",
    paymentStatus: "all"
  });

  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetchAllUserActivity();
  }, []);

  const formatTimeTo24Hour = (dateString) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const fetchAllUserActivity = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch user's bookings (either as customer or as owner)
      const bookingsResponse = await axios.get("/api/v1/bookings/user/my-bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch user's published parking spots
      const spotsResponse = await axios.get("/api/v1/parking-spots/my-spots", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Process bookings data
      const bookings = bookingsResponse.data?.data?.bookings || [];
      const spots = spotsResponse.data?.data?.parkingSpots || [];

      // Transform bookings into history items
      const bookingHistory = bookings.map((b) => ({
        id: b._id,
        date: new Date(b.start_datetime).toLocaleDateString(),
        startTime: formatTimeTo24Hour(b.start_datetime),
        endTime: formatTimeTo24Hour(b.end_datetime),
        address: b.spot?.address
          ? `${b.spot.address.street || ""} ${b.spot.address.number || ""}, ${b.spot.address.city || ""
          }`
          : "כתובת לא זמינה",
        city: b.spot?.address?.city || "",
        price: b.final_amount || b.base_rate || 0,
        type: b.spot?.owner?.toString() === user._id ? "השכרה" : "הזמנה",
        status: b.status || "active",
        paymentStatus: b.payment_status || "pending",
        bookingType: b.booking_type || "parking",
        rawDate: new Date(b.start_datetime),
        activityType: b.spot?.owner?.toString() === user._id ? "rental" : "booking",
        icon: b.spot?.owner?.toString() === user._id ? "FaParking" : "FaCar",
        // Add payment icon if completed
        showPaymentIcon: b.payment_status === "completed" && b.status === "completed",
        // Save original booking object for the popup
        originalBooking: b
      }));

      // Transform published spots into history items
      const spotHistory = spots.flatMap((spot) => {
        // For each spot, create entries for when it was published and its schedules
        const spotEntry = {
          id: spot._id,
          date: new Date(spot.created_at).toLocaleDateString(),
          startTime: formatTimeTo24Hour(spot.created_at),
          endTime: "-",
          address: spot.address
            ? `${spot.address.street || ""} ${spot.address.number || ""}, ${spot.address.city || ""
            }`
            : "כתובת לא זמינה",
          city: spot.address?.city || "",
          price: spot.hourly_rate || 0,
          type: "פרסום חניה",
          status: "active",
          paymentStatus: "n/a",
          rawDate: new Date(spot.created_at),
          activityType: "publication",
          icon: "FaMapMarkerAlt",
          showPaymentIcon: false,
          originalSpot: spot
        };

        // Create entries for each scheduled availability
        const scheduleEntries = (spot.availability_schedule || []).map((schedule) => {
          const scheduleDate = new Date(schedule.date);

          // Format time strings to 24-hour format
          const formatTime = (timeStr) => {
            if (!timeStr || timeStr === "-") return "-";
            // If already in proper format, return as is
            if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;

            // Try to parse HH:MM format
            const [hours, minutes] = timeStr.split(":").map(Number);
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          };

          return {
            id: `${spot._id}-${schedule._id}`,
            date: scheduleDate.toLocaleDateString(),
            startTime: formatTime(schedule.start_time),
            endTime: formatTime(schedule.end_time),
            address: spot.address
              ? `${spot.address.street || ""} ${spot.address.number || ""}, ${spot.address.city || ""
              }`
              : "כתובת לא זמינה",
            city: spot.address?.city || "",
            price: spot.hourly_rate || 0,
            type: "זמינות חניה",
            status: schedule.is_available ? "available" : "booked",
            paymentStatus: "n/a",
            rawDate: scheduleDate,
            activityType: "availability",
            icon: "FaCalendarAlt",
            showPaymentIcon: false,
            originalSchedule: schedule,
            originalSpot: spot,
            scheduleId: schedule._id
          };
        });

        return [spotEntry, ...scheduleEntries];
      });

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
    setFilters((prev) => ({ ...prev, [name]: value, triggerSearch: false }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: "",
      searchField: "all",
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
      setSortOrder("asc");
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
        return { text: "מוזמן", class: "bg-purple-100 text-purple-800 cursor-pointer" };
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

  // Function to get the booking details for a scheduled spot
  // Function to get the booking details for a scheduled spot
  // Function to get the booking details for a scheduled spot
  const getBookingDetails = async (item) => {
    if (item.status !== "booked") return;

    try {
      const token = localStorage.getItem("token");

      // Using the correct endpoint format identical to ReleaseParking.jsx
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
      const start = new Date(booking.start_datetime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const end = new Date(booking.end_datetime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

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
      const matchText =
        filters.searchField === "all"
          ? `${item.address} ${item.city} ${item.date}`.toLowerCase()
          : (item[filters.searchField] || "").toLowerCase();

      const matchUsage =
        filters.usageType === "all" || filters.usageType === item.type;

      const matchStatus =
        filters.status === "all" || filters.status === item.status;

      const matchActivityType =
        filters.activityType === "all" || filters.activityType === item.activityType;

      const matchPaymentStatus =
        filters.paymentStatus === "all" || filters.paymentStatus === item.paymentStatus;

      return matchText.includes(term) && matchUsage && matchStatus && matchActivityType && matchPaymentStatus;
    })
    .sort((a, b) => {
      if (sortField === "date") {
        return sortOrder === "asc"
          ? a.rawDate - b.rawDate
          : b.rawDate - a.rawDate;
      }

      const valA = a[sortField];
      const valB = b[sortField];

      return sortOrder === "asc"
        ? valA.toString().localeCompare(valB.toString())
        : valB.toString().localeCompare(valA.toString());
    });

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
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end max-w-6xl w-full">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  חפש לפי:
                </label>
                <select
                  name="searchField"
                  value={filters.searchField}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm"
                >
                  <option value="address">כתובת</option>
                  <option value="city">עיר</option>
                  <option value="date">תאריך</option>
                  <option value="all">הכל</option>
                </select>
              </div>

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
                  <option value="availability">שינוי/ הוספת זמינות לחניה פרטית </option>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  סטטוס תשלום:
                </label>
                <select
                  name="paymentStatus"
                  value={filters.paymentStatus}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm"
                >
                  <option value="all">הכל</option>
                  <option value="completed">שולם</option>
                  <option value="pending">ממתין לתשלום</option>
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

          <div className="overflow-x-auto bg-white rounded-lg shadow-md max-w-7xl mx-auto">
            {/* Table container using divs with customized column widths */}
            <div className="w-full text-base text-right">
              {/* Header row */}
              <div className="flex bg-indigo-50 text-indigo-800 border-b">
                <div className="px-3 py-3 w-[12%] font-semibold cursor-pointer text-center" onClick={() => handleSort("date")}>
                  תאריך
                </div>
                <div className="px-3 py-3 w-[12%] font-semibold cursor-pointer text-center" onClick={() => handleSort("startTime")}>
                  שעות
                </div>
                <div className="px-3 py-3 w-[30%] font-semibold cursor-pointer text-center" onClick={() => handleSort("address")}>
                  כתובת
                </div>
                <div className="px-3 py-3 w-[12%] font-semibold cursor-pointer text-center" onClick={() => handleSort("city")}>
                  עיר
                </div>
                <div className="px-3 py-3 w-[14%] font-semibold text-center">
                  סוג פעילות
                </div>
                <div className="px-3 py-3 w-[10%] font-semibold text-center">
                  סטטוס
                </div>
                <div className="px-3 py-3 w-[10%] font-semibold text-center">
                  תשלום
                </div>
              </div>

              {/* Table body */}
              <div className="divide-y">
                {filteredHistory.map((item, index) => {
                  const status = getStatusDisplay(item.status);
                  const paymentStatus = getPaymentStatusDisplay(item.paymentStatus);
                  return (
                    <div key={index} className="flex hover:bg-indigo-50 transition-colors duration-150">
                      <div className="px-3 py-3 w-[12%] text-center">{item.date}</div>
                      <div className="px-3 py-3 w-[12%] text-center whitespace-nowrap">
                        {item.startTime} {item.endTime !== "-" ? `- ${item.endTime}` : ""}
                      </div>
                      <div className="px-3 py-3 w-[30%] text-center" title={item.address}>
                        {item.address}
                      </div>
                      <div className="px-3 py-3 w-[12%] text-center">{item.city}</div>
                      <div className="px-3 py-3 w-[14%]">
                        <div className="flex items-center justify-center gap-1">
                          <span className="w-5 h-5 flex items-center justify-center">
                            {getActivityIcon(item.icon)}
                          </span>
                          <span className="whitespace-nowrap">{getActivityTypeDisplay(item.activityType)}</span>
                        </div>
                      </div>
                      <div className="px-3 py-3 w-[10%] flex justify-center">
                        {item.status === "booked" ? (
                          <div className="flex items-center justify-center">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${status.class} flex items-center gap-1`}
                              onClick={() => getBookingDetails(item)}
                            >
                              {status.text}
                              <FaInfoCircle className="cursor-pointer text-purple-700 ml-1" />
                            </span>
                          </div>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs ${status.class}`}>
                            {status.text}
                          </span>
                        )}
                      </div>
                      <div className="px-3 py-3 w-[10%] flex justify-center">
                        {item.paymentStatus !== "n/a" && (
                          <div className="flex items-center justify-center gap-1">
                            {item.showPaymentIcon && (
                              <FaMoneyBill className="text-green-600" />
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs ${paymentStatus.class}`}>
                              {paymentStatus.text}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

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