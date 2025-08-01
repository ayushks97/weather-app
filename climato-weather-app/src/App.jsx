import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

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
  const [alert, setAlert] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [localTime, setLocalTime] = useState("");

  const apiKey = "f2c48101809e3bb9e778b94a810f4367";

  const fetchWeather = async () => {
    if (!city) return;
    setLoading(true);
    setWeather(null);
    setForecast([]);
    setAlert("");

    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
      );
      setWeather(res.data);

      const { lat, lon } = res.data.coord;
      const forecastRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=hourly,minutely&units=metric&appid=${apiKey}`
      );
      setForecast(forecastRes.data.daily.slice(1, 5));
      setAlert(forecastRes.data.alerts?.[0]?.description || "");

      const time = new Date((res.data.dt + res.data.timezone) * 1000);
      const formatted = time.toUTCString().slice(17, 25);
      setLocalTime(formatted);

      setCity("");
    } catch (err) {
      alert("City not found!");
      console.error("Error fetching weather:", err);
    } finally {
      setLoading(false);
    }
  };

  const getMyLocationWeather = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setWeather(null);
    setForecast([]);
    setAlert("");

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        const weatherRes = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`
        );
        setWeather(weatherRes.data);

        const forecastRes = await axios.get(
          `https://api.openweathermap.org/data/2.5/onecall?lat=${latitude}&lon=${longitude}&exclude=hourly,minutely&units=metric&appid=${apiKey}`
        );
        setForecast(forecastRes.data.daily.slice(1, 5));
        setAlert(forecastRes.data.alerts?.[0]?.description || "");

        const time = new Date((weatherRes.data.dt + weatherRes.data.timezone) * 1000);
        const formatted = time.toUTCString().slice(17, 25);
        setLocalTime(formatted);
      } catch (error) {
        alert("Unable to fetch weather for your location.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    });
  };

  const background = weather ? getBgImage(weather.weather[0].main) : sunny;
  const emoji = weather ? getEmoji(weather.weather[0].main) : "🌦️";

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="full-screen-bg" style={{ backgroundImage: `url(${background})` }}>
        {loading && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-white border-solid"></div>
          </div>
        )}

        <div className="weather-card">
          <div className="toggle-button" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </div>

          <h1 className="text-3xl font-bold mb-6 text-center tracking-wide">
            Climato <span className="text-4xl animate-pulse">{emoji}</span>
          </h1>

          <div className="flex mb-6">
            <input
              type="text"
              placeholder="Enter city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchWeather()}
              className="flex-1 px-4 py-2 rounded-l-xl text-black outline-none"
            />
            <button
              onClick={fetchWeather}
              className="bg-white text-gray-700 px-4 py-2 rounded-r-xl font-semibold hover:bg-gray-200"
            >
              Get Weather
            </button>
          </div>

          <button
            onClick={getMyLocationWeather}
            className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            📍 Get My Location Weather
          </button>

          {weather && (
            <>
              <div className="text-center space-y-2">
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
              </div>

              {alert && (
                <div className="mt-4 p-2 bg-red-500/80 rounded shadow text-sm">
                  ⚠️ {alert}
                </div>
              )}

              <h3 className="mt-6 mb-2 font-semibold text-xl text-center">🗕️ 4-Day Forecast</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {forecast.map((day, i) => (
                  <div
                    key={i}
                    className="bg-white/10 p-2 rounded shadow backdrop-blur-sm text-center hover:bg-white/20 transition-all duration-300 cursor-pointer"
                  >
                    <p className="font-bold">
                      {new Date(day.dt * 1000).toLocaleDateString("en-IN", {
                        weekday: "short",
                      })}
                    </p>
                    <p>{getEmoji(day.weather[0].main)}</p>
                    <p>{day.weather[0].main}</p>
                    <p>🌡️ {day.temp.day}°C</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
