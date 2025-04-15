import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../shared/Navbar";
import Sidebar from "../shared/Sidebar";
import Footer from "../shared/Footer";
import { FaSearch, FaSync } from "react-icons/fa";

const UsageHistory = ({ loggedIn, setLoggedIn }) => {
  document.title = "היסטוריית שימוש | Spotly";

  const [current, setCurrent] = useState("history");
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role || "user";

  const [usageHistory, setUsageHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    searchTerm: "",
    searchField: "address",
    triggerSearch: false,
    usageType: "all",
  });

  const [sortField, setSortField] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/v1/bookings/user/my-bookings", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const bookings = res.data?.data?.bookings || [];

        const transformed = bookings.map((b) => ({
          date: new Date(b.start_datetime).toLocaleDateString(),
          startTime: new Date(b.start_datetime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          endTime: new Date(b.end_datetime).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          address: b.spot?.address
            ? `${b.spot.address.street || ""} ${b.spot.address.number || ""}, ${
                b.spot.address.city || ""
              }`
            : "כתובת לא זמינה",
          city: b.spot?.address?.city || "",
          price: b.final_amount || b.base_rate || 0,
          type: b.spot?.owner?.toString() === user._id ? "השכרה" : "הזמנה",
        }));

        setUsageHistory(transformed);
      } catch (err) {
        console.error("שגיאה בעת טעינת היסטוריית שימוש:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [user._id]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, triggerSearch: false }));
  };

  const resetFilters = () => {
    setFilters({
      searchTerm: "",
      searchField: "all",
      usageType: "all",
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

      return matchText.includes(term) && matchUsage;
    })
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (sortField === "date") {
        const dateA = new Date(valA.split("/").reverse().join("-"));
        const dateB = new Date(valB.split("/").reverse().join("-"));
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
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
            היסטוריית שימוש
          </h1>
          <p className="text-gray-600 text-lg mb-8 text-center">
            כאן תוכל לצפות בהיסטוריית השימוש שלך
          </p>

          <div className="flex flex-col items-center mb-8">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end max-w-5xl w-full">
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
                  סוג שימוש:
                </label>
                <select
                  name="usageType"
                  value={filters.usageType}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-sm"
                >
                  <option value="all">הכל</option>
                  <option value="הזמנה">הזמנה</option>
                  <option value="השכרה">השכרה</option>
                </select>
              </div>

              <div className="flex gap-2 col-span-2">
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
            <table className="w-full text-base text-right border-collapse">
              <thead className="bg-indigo-50 text-indigo-800">
                <tr>
                  <th
                    className="px-4 py-3 border-b cursor-pointer"
                    onClick={() => handleSort("date")}
                  >
                    תאריך
                  </th>
                  <th
                    className="px-4 py-3 border-b cursor-pointer"
                    onClick={() => handleSort("startTime")}
                  >
                    שעות
                  </th>
                  <th
                    className="px-4 py-3 border-b w-62 cursor-pointer"
                    onClick={() => handleSort("address")}
                  >
                    כתובת
                  </th>
                  <th
                    className="px-4 py-3 border-b w-48 cursor-pointer"
                    onClick={() => handleSort("city")}
                  >
                    עיר
                  </th>
                  <th
                    className="px-4 py-3 border-b w-28 cursor-pointer"
                    onClick={() => handleSort("price")}
                  >
                    מחיר
                  </th>
                  <th className="px-4 py-3 border-b w-36">סוג שימוש</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-indigo-50 transition-colors duration-150"
                  >
                    <td className="px-4 py-3 border-b">{item.date}</td>
                    <td className="px-4 py-3 border-b">
                      {item.startTime} - {item.endTime}
                    </td>
                    <td className="px-4 py-3 border-b">{item.address}</td>
                    <td className="px-4 py-3 border-b">{item.city}</td>
                    <td className="px-4 py-3 border-b">{item.price} ₪</td>
                    <td className="px-4 py-3 border-b">{item.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!loading && filteredHistory.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                לא נמצאה היסטוריית שימוש להצגה
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
    </div>
  );
};

export default UsageHistory;
