import { useState, useEffect } from "react";
import { MapPin, Navigation } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

function LocationMarker({ onSelect }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      setPosition(e.latlng);

      // 🔥 FIXED CORS (using open proxy)
   const res = await fetch(
  `${import.meta.env.VITE_API_URL}/api/location/reverse?lat=${lat}&lon=${lng}`
);
      const data = await res.json();

      onSelect({
        lat,
        lng,
        address: data.display_name,
      });
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function LocationPicker({ onSelect }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [mapOpen, setMapOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");

  // 🔎 SEARCH SUGGESTIONS
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }

   const res = await fetch(
  `${import.meta.env.VITE_API_URL}/api/location/search?q=${query}`
);
      const data = await res.json();
      setSuggestions(data.slice(0, 5));
    }, 400);

    return () => clearTimeout(delay);
  }, [query]);

  // 📍 CURRENT LOCATION
  const handleCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;

  const res = await fetch(
  `${import.meta.env.VITE_API_URL}/api/location/reverse?lat=${latitude}&lon=${longitude}`
);

      const data = await res.json();

      setSelectedAddress(data.display_name);
      onSelect({
        lat: latitude,
        lng: longitude,
        address: data.display_name,
      });
    });
  };

  return (
    <div className="space-y-3 relative">
      {/* INPUT FIELD */}
      <div className="relative">
        <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />

        <input
          type="text"
          value={selectedAddress || query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedAddress("");
          }}
          placeholder="Search location..."
          className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:outline-none shadow-sm"
        />

        {/* OPEN MAP ICON */}
        <button
          onClick={() => setMapOpen(true)}
          className="absolute right-3 top-2.5 text-orange-500 hover:scale-110 transition"
        >
          <MapPin size={20} />
        </button>
      </div>

      {/* SUGGESTIONS DROPDOWN */}
      {suggestions.length > 0 && (
        <div className="absolute z-50 bg-white w-full border rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((place) => (
            <div
              key={place.place_id}
              onClick={() => {
                setSelectedAddress(place.display_name);
                setSuggestions([]);
                onSelect({
                  lat: place.lat,
                  lng: place.lon,
                  address: place.display_name,
                });
              }}
              className="px-4 py-3 hover:bg-orange-50 cursor-pointer text-sm"
            >
              {place.display_name}
            </div>
          ))}
        </div>
      )}

      {/* CURRENT LOCATION BUTTON */}
      <button
        onClick={handleCurrentLocation}
        className="flex items-center gap-2 text-orange-600 text-sm hover:underline"
      >
        <Navigation size={16} />
        Use Current Location
      </button>

      {/* MAP MODAL */}
      {mapOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[90%] h-[80%] rounded-2xl overflow-hidden relative">
            <button
              onClick={() => setMapOpen(false)}
              className="absolute top-3 right-3 bg-white p-2 rounded-full shadow"
            >
              ✕
            </button>

            <MapContainer
              center={[23.0225, 72.5714]}
              zoom={10}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution="© OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker
                onSelect={(location) => {
                  setSelectedAddress(location.address);
                  onSelect(location);
                  setMapOpen(false);
                }}
              />
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}
