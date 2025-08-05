import 'leaflet/dist/leaflet.css';
import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment-timezone";
import "./App.css";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

// Backgrounds
import sunny from "./assets/backgrounds/sunny.jpg";
import rain from "./assets/backgrounds/rain.jpg";
import snow from "./assets/backgrounds/snow.jpg";
import thunder from "./assets/backgrounds/thunder.jpg";
import cloudy from "./assets/backgrounds/cloudy.jpg";
import fog from "./assets/backgrounds/fog.jpg";
import clearNight from "./assets/backgrounds/clear-night.jpg";
import rainNight from "./assets/backgrounds/rain-night.jpg";
import snowNight from "./assets/backgrounds/snow-night.jpg";
import thunderNight from "./assets/backgrounds/thunder-night.jpg";
import cloudyNight from "./assets/backgrounds/cloudy-night.jpg";
import fogNight from "./assets/backgrounds/fog-night.jpg";

// Helper functions
const getBgImage = (condition) => {
  const hour = new Date().getHours();
  const isNight = hour < 6 || hour >= 18;
  switch (condition.toLowerCase()) {
    case "clear": return isNight ? clearNight : sunny;
    case "clouds": return isNight ? cloudyNight : cloudy;
    case "rain": return isNight ? rainNight : rain;
    case "snow": return isNight ? snowNight : snow;
    case "thunderstorm": return isNight ? thunderNight : thunder;
    case "mist":
    case "fog":
    case "haze": return isNight ? fogNight : fog;
    default: return sunny;
  }
};

const getEmoji = (condition) => {
  switch (condition.toLowerCase()) {
    case "clear": return "☀️";
    case "clouds": return "☁️";
    case "rain": return "🌧️";
    case "snow": return "❄️";
    case "thunderstorm": return "⛈️";
    case "mist":
    case "fog":
    case "haze": return "🌫️";
    default: return "🌈";
  }
};

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [localTime, setLocalTime] = useState("");
  const [sunriseTime, setSunriseTime] = useState("");
  const [sunsetTime, setSunsetTime] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const apiKey = "f2c48101809e3bb9e778b94a810f4367";

  const convertToCityTime = (unixTime, timezoneOffset) => {
    const utc = unixTime * 1000;
    const localTime = new Date(utc + timezoneOffset * 1000);
    return localTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const processWeatherData = async (data) => {
    setWeather(data);

    let timezoneName = "UTC";
    if (data && data.timezone) {
      const offsetInMinutes = data.timezone / 60;
      timezoneName =
        moment.tz.names().find(
          (tz) => moment.tz(tz).utcOffset() === offsetInMinutes
        ) || "UTC";
    }

    setLocalTime(moment().tz(timezoneName).format("hh:mm A"));
    setSunriseTime(moment.unix(data.sys.sunrise).tz(timezoneName).format("hh:mm A"));
    setSunsetTime(moment.unix(data.sys.sunset).tz(timezoneName).format("hh:mm A"));

    const forecastRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${data.coord.lat}&lon=${data.coord.lon}&units=metric&appid=${apiKey}`
    );
    const dailyData = forecastRes.data.list.filter((item) =>
      item.dt_txt.includes("12:00:00")
    );
    setForecast(dailyData.slice(1, 5));
  };

  const fetchWeatherByCity = async () => {
    if (!city) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
      );
      await processWeatherData(res.data);
      setCity("");
    } catch (err) {
      alert("City not found!");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`
          );
          await processWeatherData(res.data);
        } catch (err) {
          alert("Unable to fetch location weather");
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        alert("Location access denied.");
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    fetchWeatherByLocation();
  }, []);

  const background = weather ? getBgImage(weather.weather[0].main) : sunny;
  const emoji = weather ? getEmoji(weather.weather[0].main) : "🌦️";

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div
        className="min-h-screen w-full bg-cover bg-center overflow-y-auto"
        style={{ backgroundImage: `url(${background})` }}
      >
        {loading && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-white border-solid"></div>
          </div>
        )}

        <div className="weather-card py-10 px-4 max-w-xl mx-auto">
          <div
            className="toggle-button mb-4 cursor-pointer text-white"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </div>

          <h1 className="text-3xl font-bold mb-6 text-center tracking-wide text-white">
            Climato <span className="text-4xl animate-pulse">{emoji}</span>
          </h1>

          <div className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Enter city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchWeatherByCity()}
              className="flex-1 px-4 py-2 rounded-l-xl text-black outline-none"
            />
            <button
              onClick={fetchWeatherByCity}
              className="bg-white text-gray-700 px-4 py-2 font-semibold hover:bg-gray-200"
            >
              Get Weather
            </button>
            <button
              onClick={fetchWeatherByLocation}
              title="Use current location"
              className="text-3xl text-white bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-full shadow-lg animate-pulse transition-all duration-300"
            >
              ⌖
            </button>
          </div>

          {weather && (
            <div className="text-center space-y-2 text-white">
              <h2 className="text-2xl font-semibold">
                {weather.name}, {weather.sys.country}
              </h2>
              <img
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                alt="weather-icon"
                className="mx-auto w-16 h-16"
              />
              <div className="text-5xl animate-bounce">{emoji}</div>
              <p className="text-lg">{weather.weather[0].main}</p>
              <div>🌡️ Temp: <strong>{weather.main.temp}°C</strong></div>
              <div>🥵 Feels Like: <strong>{weather.main.feels_like}°C</strong></div>
              <div>💧 Humidity: <strong>{weather.main.humidity}%</strong></div>
              <div>🌬️ Wind: <strong>{weather.wind.speed} m/s</strong></div>
              <div>🕐 Local Time: <strong>{localTime}</strong></div>
              <div>🌅 Sunrise: <strong>{sunriseTime}</strong></div>
              <div>🌇 Sunset: <strong>{sunsetTime}</strong></div>
            </div>
          )}

          {weather && forecast.length > 0 && (
            <>
              <h3 className="mt-6 mb-2 font-semibold text-xl text-center text-white">
                🗓️ 4-Day Forecast
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-white">
                {forecast.map((day, i) => (
                  <div
                    key={i}
                    className="bg-white/10 p-2 rounded shadow backdrop-blur-sm text-center hover:bg-white/20 transition-all duration-300 cursor-pointer"
                  >
                    <p className="font-bold">
                      {new Date(day.dt * 1000).toLocaleDateString("en-IN", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <img
                      src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                      alt="icon"
                      className="mx-auto w-10 h-10"
                    />
                    <p>{day.weather[0].main}</p>
                    <p>🌡️ Temp: {day.main.temp}°C</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ✅ Leaflet Map */}
          {weather && weather.coord && (
            <div className="mt-6 h-[300px] w-full mx-auto rounded-lg overflow-hidden shadow-lg border border-white bg-white bg-opacity-20 backdrop-blur-md">
              <MapContainer
                center={[weather.coord.lat, weather.coord.lon]}
                zoom={10}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[weather.coord.lat, weather.coord.lon]}>
                  <Popup>{weather.name}</Popup>
                </Marker>
              </MapContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
