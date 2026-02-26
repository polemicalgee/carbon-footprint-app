import { useState, useCallback } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  DirectionsRenderer,
  HeatmapLayer,
} from "@react-google-maps/api";

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

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Carbon Location Tracker 🌍</h2>

      <button onClick={getLocation}>Share My GPS Location</button>

      <br /><br />

      <input
        type="text"
        placeholder="Enter destination"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        style={{ padding: "8px", width: "250px" }}
      />

      <br /><br />

      <select
        value={vehicle}
        onChange={(e) => setVehicle(e.target.value)}
        style={{ padding: "8px" }}
      >
        <option value="car">🚗 Car</option>
        <option value="bus">🚌 Bus</option>
        <option value="motorbike">🛵 Motorbike</option>
        <option value="suv">🚙 SUV</option>
        <option value="electric">⚡ Electric Car</option>
        <option value="bike">🚴 Bicycle</option>
        <option value="walk">🚶 Walking</option>
      </select>

      <br /><br />

      <button onClick={calculateRoute}>Calculate Route</button>

      <br /><br />

      {distance && (
        <div style={{ marginBottom: "20px" }}>
          <p><strong>Distance:</strong> {distance.toFixed(2)} km</p>
          <p><strong>Vehicle:</strong> {vehicle.toUpperCase()}</p>
          <p>
            <strong>Estimated CO₂:</strong> {emissions.toFixed(2)} kg
          </p>
          <p>
            <strong>Carbon Rating:</strong>{" "}
            {getCarbonRating(emissions)}
          </p>
        </div>
      )}

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
  );
}

export default LocationTrackingPage;