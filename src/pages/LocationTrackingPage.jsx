import { useState, useCallback } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  DirectionsRenderer,
  HeatmapLayer,
} from "@react-google-maps/api";
import { useTheme } from "../context/ThemeContext";

const containerStyle = {
  width: "100%",
  height: "500px",
};

const center = {
  lat: -1.286389,
  lng: 36.817223,
};

// Emission factors (kg CO2 per km)
const emissionFactors = {
  car: 0.21,
  bus: 0.1,
  bike: 0.0,
  walk: 0.0,
  motorbike: 0.12,
  suv: 0.27,
  electric: 0.05,
};

function LocationTrackingPage() {
  const { isDark } = useTheme();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places", "visualization"],
  });

  const [currentPosition, setCurrentPosition] = useState(null);
  const [destination, setDestination] = useState("");
  const [directions, setDirections] = useState(null);
  const [distance, setDistance] = useState(null);
  const [emissions, setEmissions] = useState(null);
  const [vehicle, setVehicle] = useState("car");
  const [heatmapData, setHeatmapData] = useState([]);

  // Get user location
  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => alert("Unable to retrieve location")
    );
  };

  // Carbon rating system
  const getCarbonRating = (value) => {
    if (value <= 1) return "🌿 Eco Friendly";
    if (value <= 5) return "⚠ Moderate";
    return "🔴 High Emission";
  };

  // Calculate route
  const calculateRoute = useCallback(() => {
    if (!currentPosition || !destination) return;

    const directionsService = new window.google.maps.DirectionsService();

    let travelMode = window.google.maps.TravelMode.DRIVING;
    if (vehicle === "bike")
      travelMode = window.google.maps.TravelMode.BICYCLING;
    if (vehicle === "walk")
      travelMode = window.google.maps.TravelMode.WALKING;

    directionsService.route(
      {
        origin: currentPosition,
        destination: destination,
        travelMode: travelMode,
      },
      (result, status) => {
        if (status === "OK") {
          setDirections(result);

          const routeDistance =
            result.routes[0].legs[0].distance.value / 1000;

          setDistance(routeDistance);

          const emissionEstimate =
            routeDistance * emissionFactors[vehicle];

          setEmissions(emissionEstimate);

          // Create heatmap
          const routePath = result.routes[0].overview_path;

          const heatPoints = routePath.map((point) => ({
            location: new window.google.maps.LatLng(
              point.lat(),
              point.lng()
            ),
            weight: emissionFactors[vehicle] * 10,
          }));

          setHeatmapData(heatPoints);
        } else {
          alert("Route calculation failed");
        }
      }
    );
  }, [currentPosition, destination, vehicle]);

  if (!isLoaded) return <div className={isDark ? "text-white" : ""}>Loading Map...</div>;

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-5xl mx-auto">
        <h2 className={`text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Carbon Location Tracker 🌍
        </h2>

        <button
          onClick={getLocation}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition mb-6"
        >
          Share My GPS Location
        </button>

        <div className={`space-y-4 mb-6 p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Destination
            </label>
            <input
              type="text"
              placeholder="Enter destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' : 'border border-gray-300'}`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Transportation Mode
            </label>
            <select
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border border-gray-300'}`}
            >
              <option value="car">🚗 Car</option>
              <option value="bus">🚌 Bus</option>
              <option value="motorbike">🛵 Motorbike</option>
              <option value="suv">🚙 SUV</option>
              <option value="electric">⚡ Electric Car</option>
              <option value="bike">🚴 Bicycle</option>
              <option value="walk">🚶 Walking</option>
            </select>
          </div>

          <button
            onClick={calculateRoute}
            className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition font-semibold"
          >
            Calculate Route
          </button>
        </div>

        {distance && (
          <div className={`mb-6 p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <p className={`mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <strong>Distance:</strong> {distance.toFixed(2)} km
            </p>
            <p className={`mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <strong>Vehicle:</strong> {vehicle.toUpperCase()}
            </p>
            <p className={`mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <strong>Estimated CO₂:</strong> {emissions.toFixed(2)} kg
            </p>
            <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
              <strong>Carbon Rating:</strong>{" "}
              {getCarbonRating(emissions)}
            </p>
          </div>
        )}

        <div className={`rounded-lg overflow-hidden shadow-lg ${isDark ? 'shadow-black' : ''}`}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={currentPosition || center}
            zoom={12}
          >
            {currentPosition && <Marker position={currentPosition} />}
            {directions && <DirectionsRenderer directions={directions} />}

            {heatmapData.length > 0 && (
              <HeatmapLayer
                data={heatmapData}
                options={{
                  radius: 30,
                  opacity: 0.6,
                }}
              />
            )}
          </GoogleMap>
        </div>
      </div>
    </div>
  );
}

export default LocationTrackingPage;