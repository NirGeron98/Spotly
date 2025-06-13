import React, { useState } from "react";
import Navbar from "../shared/Navbar";
import Footer from "../shared/Footer";
import Popup from "../shared/Popup";
import { FaSearch, FaBolt } from "react-icons/fa";
import Sidebar from "../shared/Sidebar";
import { format } from "date-fns";

const ResidentialParkingSearch = ({ loggedIn, setLoggedIn }) => {
    document.title = "חיפוש חניה בבניין מגורים | Spotly";

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
        date: new Date().toISOString().split("T")[0],
        startTime: format(now, "HH:mm"),
        endTime: format(twoHoursLater > new Date().setHours(23, 59) ? new Date().setHours(23, 59) : twoHoursLater, "HH:mm"),
        is_charging_station: false,
        charger_type: "",
    });

    const [popupData, setPopupData] = useState(null);

    const chargerTypes = [
        { id: "Type 1", label: "סוג 1" },
        { id: "Type 2", label: "סוג 2" },
        { id: "CCS", label: "CCS" },
        { id: "CHAdeMO", label: "CHAdeMO" },
        { id: "Other", label: "אחר" },
    ];

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSearchParams((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const searchParkingSpots = (e) => {
        e.preventDefault();
        // Add logic to search for residential parking spots
        setPopupData({
            title: "חיפוש הושלם",
            description: "תוצאות החיפוש יופיעו כאן.",
            type: "info",
        });
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-white to-blue-50" dir="rtl">
            <Navbar loggedIn={loggedIn} setLoggedIn={setLoggedIn} />

            <div className="flex flex-grow">
                <Sidebar current="residential-parking" setCurrent={() => { }} role="building_resident" />

                <main className="flex-grow p-4 md:p-6 md:mr-5 mt-12">
                    <h1 className="pt-[68px] text-3xl font-extrabold text-blue-700 mb-4 text-center">
                        חיפוש חניה בבניין מגורים
                    </h1>
                    <p className="text-gray-600 text-lg mb-8 text-center">
                        מצא חניה בבניין מגורים בתאריך ובשעות הרצויות
                    </p>

                    <div className="bg-white rounded-lg shadow-md p-6 mb-8 max-w-4xl mx-auto">
                        <form onSubmit={searchParkingSpots} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Date Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
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
                                    className="w-full px-4 py-2 rounded-md border border-gray-300 text-right"
                                >
                                    {Array.from({ length: 72 }).map((_, i) => {
                                        const hours = Math.floor(i / 4) + 6;
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
                                    <option value="23:59">23:59</option>
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
                                    className="w-full px-4 py-2 rounded-md border border-gray-300 text-right"
                                >
                                    {Array.from({ length: 72 }).map((_, i) => {
                                        const hours = Math.floor(i / 4) + 6;
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
                                    <option value="23:59">23:59</option>
                                </select>
                            </div>

                            {/* Charging Station */}
                            <div className="md:col-span-3">
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">סוג מטען</label>
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

                            {/* Search Button */}
                            <div className="md:col-span-3 flex justify-center mt-4">
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <FaSearch /> חפש חניה
                                </button>
                            </div>
                        </form>
                    </div>
                </main>
            </div>

            <Footer />

            {/* Popup for search results or errors */}
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

export default ResidentialParkingSearch;