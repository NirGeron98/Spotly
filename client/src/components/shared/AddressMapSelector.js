// ...imports
import React, { useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const defaultPosition = [32.0853, 34.7818];

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const LocationPicker = ({ onSelect }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });
  return null;
};

const AddressMapSelector = ({
  address,
  setAddress,
  feedback,
  setFeedback,
  searching,
  setSearching,
}) => {
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [mapVisible, setMapVisible] = useState(false);
  const mapRef = useRef();

  const handleReverseGeocode = useCallback(
    async (latlng, forceReplace = false) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json`
        );
        const data = await res.json();
        if (data?.address) {
          setAddress((prev) => ({
            ...prev,
            city:
              data.address.city ||
              data.address.town ||
              data.address.village ||
              prev.city,
            street: data.address.road || prev.street,
            number: forceReplace
              ? (data.address.house_number ? data.address.house_number : prev.number)
              : (data.address.house_number || prev.number),
          }));
          setFeedback("✅ כתובת עודכנה לפי המפה");
        }
      } catch (error) {
        console.error("Reverse geocode failed:", error);
        setFeedback("❌ לא הצלחנו לעדכן כתובת מהמפה");
      }
    },
    [setAddress, setFeedback]
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMapSearch = async () => {
    const query = `${address.street} ${address.number}, ${address.city}`.trim();

    if (!query) {
      setFeedback("❌ יש להזין כתובת");
      return;
    }

    setSearching?.(true);
    setFeedback("מחפש כתובת...");

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setSelectedPosition([lat, lon]);
        await handleReverseGeocode({ lat, lng: lon }, true);
        if (mapRef.current) {
          mapRef.current.setView([lat, lon], 16);
        }
        setFeedback("✅ כתובת נמצאה");
      } else {
        setFeedback("❌ לא נמצאה כתובת מתאימה");
      }
    } catch (error) {
      console.error("Search failed:", error);
      setFeedback("❌ שגיאה בחיפוש כתובת");
    } finally {
      setSearching?.(false);
    }
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setSelectedPosition([latitude, longitude]);
      },
      () => {
        setSelectedPosition(defaultPosition);
      }
    );
  }, []);

  return (
    <div className="space-y-4">
      {/* טופס ראשי */}
      <div className="text-right mb-2">
        <h2 className="text-lg font-semibold text-gray-800">כתובת</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            name="city"
            placeholder="עיר"
            value={address.city}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            name="street"
            placeholder="רחוב"
            value={address.street}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="relative w-24">
          <input
            type="text"
            name="number"
            placeholder="מספר"
            value={address.number}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <button
          onClick={handleMapSearch}
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition"
        >
          חפש
        </button>
      </div>

      {/* אינדיקציה לחיפוש */}
      {(feedback || searching) && (
        <div className="text-center mt-2">
          {searching && (
            <div className="flex justify-center items-center gap-2 mb-2 text-blue-700 font-medium">
              <div className="w-5 h-5 border-4 border-t-4 border-blue-600 rounded-full animate-spin" />
              <span>מחפש כתובת...</span>
            </div>
          )}
          {!searching && feedback && (
            <div
              className={`text-sm font-medium flex items-center justify-center gap-2 ${
                feedback.startsWith("✅")
                  ? "text-green-600"
                  : feedback.startsWith("❌")
                  ? "text-red-600"
                  : "text-blue-700"
              }`}
            >
              {feedback.startsWith("✅")}
              {feedback.startsWith("❌")}
              {feedback}
            </div>
          )}
        </div>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={() => setMapVisible(true)}
          className="bg-blue-600 text-white font-bold px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          בחר מיקום מהמפה
        </button>
      </div>

      {/* POPUP MAP MODAL */}
      {mapVisible && selectedPosition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-3xl relative">
            <h3 className="text-lg font-bold mb-4 text-center text-blue-800">
              בחר מיקום על המפה או הזן כתובת מדויקת
            </h3>

            {/* שדות הכתובת גם בתוך הפופ־אפ */}
            <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
              <input
                type="text"
                name="city"
                placeholder="עיר"
                value={address.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                name="street"
                placeholder="רחוב"
                value={address.street}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                name="number"
                placeholder="מספר"
                value={address.number}
                onChange={handleInputChange}
                className="w-24 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={handleMapSearch}
                className="bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                חפש
              </button>
            </div>

            {/* חיווי לפעולה */}
            {(feedback || searching) && (
              <div className="text-center mb-4">
                {searching && (
                  <div className="flex justify-center items-center gap-2 mb-2 text-blue-700 font-medium">
                    <div className="w-5 h-5 border-4 border-t-4 border-blue-600 rounded-full animate-spin" />
                    <span>מחפש כתובת...</span>
                  </div>
                )}
                {!searching && feedback && (
                  <div
                    className={`text-sm font-medium flex items-center justify-center gap-2 ${
                      feedback.startsWith("✅")
                        ? "text-green-600"
                        : feedback.startsWith("❌")
                        ? "text-red-600"
                        : "text-blue-700"
                    }`}
                  >
                    {feedback.startsWith("✅") && "✔️"}
                    {feedback.startsWith("❌") && "❌"}
                    {feedback}
                  </div>
                )}
              </div>
            )}

            {/* המפה */}
            <MapContainer
              center={selectedPosition}
              zoom={16}
              style={{ height: "400px", width: "100%" }}
              className="rounded-lg"
              whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationPicker
                onSelect={(latlng) => {
                  setSelectedPosition([latlng.lat, latlng.lng]);
                  handleReverseGeocode(latlng);
                }}
              />
              <Marker position={selectedPosition} icon={markerIcon} />
            </MapContainer>

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                onClick={() => setMapVisible(false)}
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressMapSelector;
