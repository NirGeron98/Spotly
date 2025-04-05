import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const defaultPosition = [32.0853, 34.7818];

const markerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2776/2776067.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
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
    async (latlng, force = false) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json`
        );
        const data = await res.json();

        if (data?.address) {
          const fallbackNumber =
            data.display_name?.split(",")[0].match(/\d+/)?.[0] || "";
          const numberFromAPI = data.address.house_number || fallbackNumber;

          setAddress((prev) => ({
            city:
              data.address.city ||
              data.address.town ||
              data.address.village ||
              prev.city,
            street: data.address.road || prev.street,
            number:
              numberFromAPI !== "" ? numberFromAPI : force ? "" : prev.number,
          }));

          if (numberFromAPI) {
            setFeedback("✅ הכתובת עודכנה לפי המפה");
          } else {
            setFeedback("⚠️ מספר בית לא זוהה, נא להזין ידנית");
          }
        } else {
          if (force) {
            setAddress((prev) => ({
              ...prev,
              number: "",
            }));
          }
          setFeedback("⚠️ מספר בית לא זוהה, נא להזין ידנית");
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
    const query = `${address.street}, ${address.city}`.trim();

    if (!query) {
      setFeedback("❌ יש להזין עיר ורחוב");
      return;
    }

    setSearching(true);
    setFeedback("מחפש כתובת...");

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setSelectedPosition([lat, lon]);
        await handleReverseGeocode({ lat, lng: lon }, false);
        if (mapRef.current) {
          mapRef.current.setView([lat, lon], 16);
        }
      } else {
        setFeedback("❌ לא נמצאה כתובת מתאימה");
      }
    } catch (error) {
      console.error("Search failed:", error);
      setFeedback("❌ שגיאה בחיפוש כתובת");
    } finally {
      setSearching(false);
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
    <div className="space-y-4" dir="rtl">
      <div className="text-right mb-2">
        <h2 className="text-lg font-semibold text-gray-800">כתובת</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end">
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
            className={`w-full px-3 py-2 rounded-md ${
              address.number
                ? "border border-gray-300"
                : "border border-red-400"
            }`}
            required
          />
        </div>
        <div>
          <button
            onClick={handleMapSearch}
            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition"
          >
            חפש
          </button>
        </div>
      </div>

      {(feedback || searching) && (
        <div className="text-center mt-2">
          {searching ? (
            <div className="flex justify-center items-center gap-2 text-blue-700 font-medium">
              <div className="w-5 h-5 border-4 border-t-4 border-blue-600 rounded-full animate-spin" />
              <span>מחפש כתובת...</span>
            </div>
          ) : (
            <div
              className={`text-sm font-medium flex items-center justify-center gap-2 ${
                feedback.startsWith("✅")
                  ? "text-green-600"
                  : feedback.startsWith("❌")
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
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

      {mapVisible && selectedPosition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-3xl relative">
            <h3 className="text-lg font-bold mb-4 text-center text-blue-800">
              בחר מיקום על המפה או הזן כתובת מדויקת
            </h3>

            <div className="flex flex-col md:flex-row gap-4 items-end mb-2">
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
                  className={`w-full px-3 py-2 rounded-md ${
                    address.number
                      ? "border border-gray-300"
                      : "border border-red-400"
                  }`}
                />
              </div>
              <div>
                <button
                  onClick={handleMapSearch}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  חפש
                </button>
              </div>
            </div>

            {(feedback || searching) && (
              <div className="text-center mb-2">
                {searching ? (
                  <div className="flex justify-center items-center gap-2 text-blue-700 font-medium">
                    <div className="w-5 h-5 border-4 border-t-4 border-blue-600 rounded-full animate-spin" />
                    <span>מחפש כתובת...</span>
                  </div>
                ) : (
                  <div
                    className={`text-sm font-medium flex items-center justify-center gap-2 ${
                      feedback.startsWith("✅")
                        ? "text-green-600"
                        : feedback.startsWith("❌")
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {feedback}
                  </div>
                )}
              </div>
            )}

            <MapContainer
              center={selectedPosition}
              zoom={16}
              style={{ height: "400px", width: "100%" }}
              className="rounded-xl shadow-xl z-0"
              whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
            >
              <TileLayer
                attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
                url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png"
              />
              <LocationPicker
                onSelect={(latlng) => {
                  setSelectedPosition([latlng.lat, latlng.lng]);
                  handleReverseGeocode(latlng);
                }}
              />
              <Marker position={selectedPosition} icon={markerIcon}>
                <Tooltip direction="top" offset={[0, -30]}>
                  {address.street || "מיקום שנבחר"}
                </Tooltip>
              </Marker>
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
