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

const AddressMapSelector = ({ address, setAddress }) => {
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [searchClicked, setSearchClicked] = useState(false); // To track if search was clicked
  const mapRef = useRef();

  const handleReverseGeocode = useCallback(async (latlng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json`
      );
      const data = await res.json();
      if (data?.address) {
        setAddress({
          city: data.address.city || data.address.town || data.address.village || "",
          street: data.address.road || "",
          number: data.address.house_number || "",
        });
        setFeedback("✅ כתובת עודכנה לפי המפה");
      }
    } catch (error) {
      console.error("Reverse geocode failed:", error);
      setFeedback("❌ לא הצלחנו לעדכן כתובת מהמפה");
    }
  }, [setAddress]);

  const handleGeocode = useCallback(async () => {
    if (!address.city || !address.street || !address.number) return;
    try {
      const query = `${address.street} ${address.number}, ${address.city}`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setSelectedPosition([lat, lon]);
        setFeedback("✅ כתובת נמצאה");
        if (mapRef.current) {
          mapRef.current.setView([lat, lon], 16);
        }
      } else {
        setFeedback("❌ לא נמצאה כתובת מתאימה");
      }
    } catch (error) {
      console.error("Geocode failed:", error);
      setFeedback("❌ שגיאה בחיפוש כתובת");
    }
  }, [address]);

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

  useEffect(() => {
    if (searchClicked) { // Check if search was clicked before executing geocode
      handleGeocode();
      setSearchClicked(false); // Reset the click tracker
    }
  }, [searchClicked, handleGeocode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleMapSearch = async () => {
    setSearchClicked(true); // Set the flag to true when "חפש" is clicked

    if (!address.city || !address.street || !address.number) {
      setFeedback("❌ יש להזין/לבחור כתובת");
      return;
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setSelectedPosition([lat, lon]);
        await handleReverseGeocode({ lat, lng: lon });
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
    }
  };

  return (
    <div className="space-y-4">
      {/* כתובת */}
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
          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
        >
          חפש
        </button>
      </div>

      {feedback && <div className="text-sm text-center text-blue-700">{feedback}</div>}

      <div className="text-center">
        <button
          type="button"
          onClick={() => setMapVisible(true)}
          className="bg-blue-600 text-white font-bold px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          בחר מיקום מהמפה
        </button>
      </div>

      {mapVisible && selectedPosition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-3xl relative">
            <h3 className="text-lg font-bold mb-4 text-center text-blue-800">
              לחץ על המפה כדי לבחור מיקום או חפש כתובת
            </h3>
            <div className="mb-2 text-center text-sm text-blue-600 font-medium min-h-[24px]">{feedback}</div>
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                placeholder="חפש כתובת"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <button
                onClick={handleMapSearch}
                className="bg-blue-500 text-white px-4 py-2 rounded-md"
              >
                חפש
              </button>
            </div>
            <MapContainer
              center={selectedPosition}
              zoom={16}
              style={{ height: "400px", width: "100%" }}
              className="rounded-lg"
              whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
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
