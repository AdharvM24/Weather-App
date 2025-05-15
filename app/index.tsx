import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  StatusBar,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import LottieView from "lottie-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface WeatherData {
  main: {
    temp: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
  clouds: {
    all: number;
  };
  weather: {
    description: string;
  }[];
}

interface StatBoxProps {
  label: string;
  value: string;
  animation: any;
}

const StatBox: React.FC<StatBoxProps> = ({ label, value, animation }) => (
  <View style={styles.statBox}>
    <LottieView source={animation} autoPlay loop style={styles.statLottie} />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

export default function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const fetchWeather = async (lat: number, lon: number) => {
    const apiKey = "2a99e1d56e4e479b3eaa2dc135515488";

    try {
      // Fetch current weather
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
      const currentRes = await fetch(currentUrl);
      const currentData = await currentRes.json();
      setWeather(currentData);

      // Fetch forecast (3-hour steps)
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
      const forecastRes = await fetch(forecastUrl);
      const forecastData = await forecastRes.json();
      setForecast(forecastData.list.slice(0, 8)); // show next 8 (3-hour intervals)
      console.log(forecastData.list.slice(0, 8));
    } catch (err) {
      console.error("Failed to fetch weather or forecast:", err);
    }
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.error("Permission to access location was denied");
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    fetchWeather(latitude, longitude);

    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        setCity(place.city || place.region || place.country || "Unknown");
      }
    } catch (err) {
      console.error("Failed to get city name:", err);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  if (!weather) {
    return (
      <View style={styles.fullScreenLoader}>
        <StatusBar hidden />
        <LottieView
          source={require("../assets/loader.json")} // replace with your actual JSON file
          autoPlay
          loop
          style={styles.lottieLoader}
        />
        {/* <Text style={styles.loadingTextLoader}>Loading weather...</Text> */}
      </View>
    );
  }

  return (
    <View style={styles.fullScreen}>
      <StatusBar hidden />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.city}>📍 {city || "Current Location"}</Text>
        </View>

        <LottieView
          source={require("../assets/thunder.json")}
          autoPlay
          loop
          style={styles.lottie}
        />

        <Text style={styles.temp}>{`${Math.round(weather.main.temp)}°`}</Text>
        <Text style={styles.condition}>{weather.weather[0].description}</Text>

        <View style={styles.stats}>
          <StatBox
            label="Wind"
            value={`${weather.wind.speed} km/h`}
            animation={require("../assets/1.json")}
          />
          <StatBox
            label="Humidity"
            value={`${weather.main.humidity}%`}
            animation={require("../assets/2.json")}
          />
          <StatBox
            label="Rain"
            value={`${weather.clouds.all}%`}
            animation={require("../assets/3.json")}
          />
        </View>

        <ScrollView
          horizontal
          style={styles.scroll}
          showsHorizontalScrollIndicator={false}
        >
          {forecast.map((item, i) => {
            const hour = new Date(item.dt * 1000).getHours();
            const temp = Math.round(item.main.temp);
            const icon = item.weather[0].main.includes("Rain")
              ? "🌧️"
              : item.weather[0].main.includes("Cloud")
              ? "☁️"
              : "☀️";

            return (
              <View
                key={i}
                style={[styles.hourCard, i === 0 && styles.activeHour]}
              >
                <Text style={styles.hourTime}>{`${hour}:00`}</Text>
                <Text style={styles.hourTemp}>{temp}°</Text>
                <Text style={styles.hourIcon}>{icon}</Text>
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenLoader: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  lottieLoader: {
    width: 200,
    height: 200,
  },
  loadingTextLoader: {
    color: "#fff",
    marginTop: 20,
    textAlign: "center",
    fontSize: 16,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: "#101014",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 0,
  },
  header: {
    alignItems: "center",
    marginBottom: 10,
  },
  city: {
    fontSize: 20,
    color: "#fff",
  },
  lottie: {
    width: 200,
    height: 200,
    alignSelf: "center",
    marginVertical: 10,
  },
  temp: {
    fontSize: 64,
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  condition: {
    fontSize: 18,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 20,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  statBox: {
    backgroundColor: "#1a1a1d",
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
    width: "30%",
  },
  statLottie: {
    width: 40,
    height: 40,
    marginBottom: 5,
  },
  statLabel: {
    color: "#ccc",
    fontSize: 14,
  },
  statValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 5,
  },
  scroll: {
    marginTop: 10,
  },
  hourCard: {
    backgroundColor: "#1f1f22",
    padding: 15,
    borderRadius: 14,
    marginRight: 10,
    alignItems: "center",
    width: 80,
    height: 120,
  },
  activeHour: {
    backgroundColor: "#2a2aff",
  },
  hourTime: {
    color: "#ccc",
    marginBottom: 4,
  },
  hourTemp: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  hourIcon: {
    fontSize: 18,
    marginTop: 5,
  },
});
