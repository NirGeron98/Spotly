export const geocodeAddress = async (address) => {
    if (!address.city || !address.street || !address.number) {
      return { success: false, message: "❌ יש להזין כתובת מלאה" };
    }
  
    const query = `${address.street} ${address.number}, ${address.city}`;
  
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await res.json();
  
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        return { success: true, lat, lon };
      } else {
        return { success: false, message: "❌ לא נמצאה כתובת מתאימה" };
      }
    } catch (error) {
      console.error("Geocode error:", error);
      return { success: false, message: "❌ שגיאה בחיפוש כתובת" };
    }
  };
  