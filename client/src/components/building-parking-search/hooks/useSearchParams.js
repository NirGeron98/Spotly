import { useState } from "react";
import { format } from "date-fns";

export const useSearchParams = () => {
  const getRoundedTime = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    if (roundedMinutes === 60) {
      now.setHours(now.getHours() + 1, 0);
    } else {
      now.setMinutes(roundedMinutes);
    }
    if (now.getHours() < 6) {
      now.setHours(6, 0, 0, 0);
    }
    return now;
  };

  const getEndTime = (startDate) => {
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const maxEnd = new Date(startDate);
    maxEnd.setHours(23, 59, 0, 0);
    return endDate > maxEnd ? maxEnd : endDate;
  };

  const now = getRoundedTime();
  const end = getEndTime(now);

  const [searchParams, setSearchParams] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: format(now, "HH:mm"),
    endTime: format(end, "HH:mm"),
    is_charging_station: false,
    charger_type: "",
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "startTime") {
      const [hours, minutes] = value.split(":").map(Number);
      const startDateTime = new Date();
      startDateTime.setHours(hours, minutes, 0, 0);
      const newEndTime = getEndTime(startDateTime);
      setSearchParams((prev) => ({
        ...prev,
        startTime: value,
        endTime: format(newEndTime, "HH:mm"),
      }));
    } else {
      setSearchParams((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  return { searchParams, setSearchParams, handleInputChange };
};
