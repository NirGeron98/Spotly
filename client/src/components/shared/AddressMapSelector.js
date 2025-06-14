import React, { useEffect, useRef, useState, useCallback } from "react";
import Popup from "./Popup";

const loadGoogleMaps = (apiKey) => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve(window.google);
      return;
    }

    const existingScript = document.getElementById("googleMaps");
    if (existingScript) {
      existingScript.onload = () => resolve(window.google);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.id = "googleMaps";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;

    document.body.appendChild(script);
  });
};

const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const defaultPosition = { lat: 32.0853, lng: 34.7818 };

const AddressMapSelector = ({
  address,
  setAddress,
  feedback,
  setFeedback,
  searching,
  setSearching,
  disableSearchButton = false,
  mode = "default",
}) => {
  const [selectedPosition, setSelectedPosition] = useState(defaultPosition);
  const [mapVisible, setMapVisible] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [popupAddress, setPopupAddress] = useState(address);
  const [, setPopupVisible] = useState(false);
  const [popupData, setPopupData] = useState(null);

  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const handleFeedback = (message, type = "info") => {
    if (type === "map") {
      setFeedback(message);
    } else {
      setPopupData({ title: "הודעה", description: message, type });
    }
  };

  useEffect(() => {
    if (popupData) {
      const timer = setTimeout(() => setPopupData(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [popupData]);

  useEffect(() => {
    loadGoogleMaps(GOOGLE_API_KEY)
      .then(() => setGoogleReady(true))
      .catch((err) => {
        console.error("Failed to load Google Maps:", err);
        setFeedback("❌ שגיאה בטעינת Google Maps");
      });
  }, []);

  useEffect(() => {
    if (mapVisible && googleReady) {
      setTimeout(initializeMap, 300);
    }
  }, [mapVisible, googleReady]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSelectedPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => setSelectedPosition(defaultPosition)
    );
  }, []);

  useEffect(() => {
    if (mapVisible) {
      setPopupAddress(address);
    }
  }, [mapVisible]);

  useEffect(() => {
    if (feedback) {
      setPopupVisible(true);
      const timer = setTimeout(() => setPopupVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleReverseGeocode = useCallback(
    async (latlng, force = false, updatePopupFields = false) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json`
        );
        const data = await res.json();
        const fallbackNumber =
          data.display_name?.split(",")[0].match(/\d+/)?.[0] || "";
        const numberFromAPI = data?.address?.house_number || fallbackNumber;
        const existingNumber = address.number;

        const city =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          address.city;

        const street = data.address?.road || address.street;

        const number =
          numberFromAPI || (existingNumber && !force ? existingNumber : "");

        if (updatePopupFields) {
          setPopupAddress({
            city,
            street,
            number,
          });
        } else {
          setAddress((prev) => ({
            city,
            street,
            number,
          }));
        }

        if (numberFromAPI) {
          setFeedback("✅ הכתובת עודכנה לפי המפה");
        } else if (existingNumber && !force) {
          setFeedback("✅ הכתובת עודכנה לפי המפה והמספר שהזנת");
        } else {
          setFeedback("⚠️ מספר בית לא זוהה, נא להזין ידנית");
        }
      } catch (err) {
        console.error("Reverse geocoding failed:", err);
        setFeedback("❌ שגיאה בהשלמת כתובת");
      }
    },
    [address.number, setAddress, setFeedback]
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handlePopupInputChange = (e) => {
    const { name, value } = e.target;
    setPopupAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handlePopupMapSearch = async () => {
    if (!popupAddress.number) {
      setFeedback("❌ יש להזין מספר בית");
      return;
    }

    const query = `${popupAddress.street}, ${popupAddress.city}`.trim();
    if (!query) {
      setFeedback("❌ יש להזין עיר ורחוב");
      return;
    }

    setSearching(true);
    setFeedback("מחפש כתובת...");

    try {
      const geocoder = new window.google.maps.Geocoder();
      const { results } = await geocoder.geocode({ address: query });

      if (results && results.length > 0) {
        const location = results[0].geometry.location;
        const latlng = { lat: location.lat(), lng: location.lng() };
        setSelectedPosition(latlng);

        if (mapRef.current && markerRef.current) {
          mapRef.current.setCenter(latlng);
          markerRef.current.setPosition(latlng);
        }

        setFeedback("✅ המפה עודכנה לפי הכתובת");
      } else {
        setFeedback("❌ לא נמצאה כתובת מתאימה");
      }
    } catch (err) {
      console.error("Search failed:", err);
      setFeedback("❌ שגיאה בחיפוש כתובת");
    } finally {
      setSearching(false);
    }
  };

  const handlePopupClose = () => {
    setAddress(popupAddress);
    handleReverseGeocode(selectedPosition);
    setMapVisible(false);
  };

  const handleMapSearch = async () => {
    const query = `${address.street}, ${address.city}`.trim();

    if (!query) {
      handleFeedback("❌ יש להזין/לבחור כתובת", "map");
      return;
    }

    setSearching(true);
    handleFeedback("מחפש כתובת...", "map");

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setSelectedPosition({ lat, lng });

        const userEnteredNumber = address.number;

        await handleReverseGeocode({ lat, lng }, false);

        if (!address.number && userEnteredNumber) {
          setAddress((prev) => ({ ...prev, number: userEnteredNumber }));
          handleFeedback("✅ הכתובת עודכנה לפי המפה והמספר שהזנת", "map");
        }

        if (mapRef.current) {
          mapRef.current.setCenter({ lat, lng });
          mapRef.current.setZoom(16);
        }
      } else {
        setPopupData({
          title: "שגיאה",
          description: "❌ לא נמצאו חניות זמינות התואמות את החיפוש",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Search failed:", error);
      handleFeedback("❌ שגיאה בחיפוש כתובת", "popup");
    } finally {
      setSearching(false);
    }
  };

  const initializeMap = () => {
    const map = new window.google.maps.Map(document.getElementById("map"), {
      center: selectedPosition,
      zoom: 16,
    });

    const marker = new window.google.maps.Marker({
      position: selectedPosition,
      map,
      draggable: true,
    });

    map.addListener("click", async (e) => {
      const latlng = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      marker.setPosition(latlng);
      setSelectedPosition(latlng);
      setFeedback("✅ מיקום עודכן ידנית במפה");

      await handleReverseGeocode(latlng, false, true);
    });

    marker.addListener("dragend", async (e) => {
      const latlng = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      setSelectedPosition(latlng);
      setFeedback("✅ מיקום נגרר ידנית");

      await handleReverseGeocode(latlng, false, true);
    });

    mapRef.current = map;
    markerRef.current = marker;
  };

  return (
    <div className="space-y-4" dir="rtl">
      {popupData && (
        <Popup
          title={popupData.title}
          description={popupData.description}
          type={popupData.type}
          onClose={() => setPopupData(null)}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
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
          className={`w-full px-3 py-2 rounded-md ${
            address.number ? "border border-gray-300" : "border border-red-400"
          }`}
        />

        {mode === "search" ? (
          <button
            type="button"
            onClick={() => setMapVisible(true)}
            className="bg-blue-600 text-white font-bold px-4 py-2 rounded-md hover:bg-blue-700 transition w-full"
          >
            בחר מיקום מהמפה
          </button>
        ) : (
          !disableSearchButton && (
            <button
              onClick={handleMapSearch}
              disabled={!address.number}
              className={`text-white font-bold py-2 px-4 rounded-md transition w-full ${
                !address.number
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              חפש
            </button>
          )
        )}
      </div>

      {mode !== "search" && (
        <div className="text-center mt-2">
          <button
            type="button"
            onClick={() => setMapVisible(true)}
            className="bg-blue-600 text-white font-bold px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            בחר מיקום מהמפה
          </button>
        </div>
      )}

      {(feedback || searching) && (
        <div className="text-center mt-2">
          <span className="text-sm font-medium text-gray-700">{feedback}</span>
        </div>
      )}

      {mapVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-3xl relative">
            <h3 className="text-lg font-bold mb-4 text-center text-blue-800">
              בחר מיקום על המפה או הזן כתובת מדויקת
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end mb-3">
              <input
                type="text"
                name="city"
                placeholder="עיר"
                value={popupAddress.city}
                onChange={handlePopupInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                name="street"
                placeholder="רחוב"
                value={popupAddress.street}
                onChange={handlePopupInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <input
                type="text"
                name="number"
                placeholder="מספר"
                value={popupAddress.number}
                onChange={handlePopupInputChange}
                className={`w-full px-3 py-2 rounded-md ${
                  popupAddress.number
                    ? "border border-gray-300"
                    : "border border-red-400"
                }`}
              />
              <button
                onClick={handlePopupMapSearch}
                disabled={!popupAddress.number || disableSearchButton}
                className={`text-white font-bold px-4 py-2 rounded-md transition ${
                  !popupAddress.number || disableSearchButton
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                חפש
              </button>
            </div>

            {(feedback || searching) && (
              <div className="text-center mb-3">
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
                    {feedback.startsWith("✅") && (
                      <span className="text-green-500">✔</span>
                    )}
                  </div>
                )}
              </div>
            )}

            <div
              id="map"
              style={{ height: "400px", width: "100%" }}
              className="rounded-xl"
            />

            <div className="mt-4 flex justify-end">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                onClick={handlePopupClose}
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
