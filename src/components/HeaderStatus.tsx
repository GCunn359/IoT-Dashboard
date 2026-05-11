"use client";

import { useEffect, useState } from "react";

type WeatherState =
  | {
      condition: string;
      icon: string;
      location: string;
      temperature: number;
      windSpeed: number | null;
    }
  | {
      error: string;
    };

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Dublin",
  }).format(date);
}

export function HeaderStatus() {
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const currentWeather = weather && !("error" in weather) ? weather : null;

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadWeather() {
      const response = await fetch("/api/weather");
      const nextWeather = (await response.json()) as WeatherState;

      if (isMounted) {
        setWeather(nextWeather);
      }
    }

    loadWeather().catch(() => {
      if (isMounted) {
        setWeather({ error: "Weather unavailable" });
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="header-status-panel" aria-label="Local time and weather">
      <div className="header-status-card">
        <span>Date & time</span>
        <strong>{formatDateTime(now)}</strong>
      </div>
      <div className="header-status-card weather">
        <span>Kildare weather</span>
        {weather && "error" in weather ? (
          <strong>Unavailable</strong>
        ) : currentWeather ? (
          <strong>
            <i aria-hidden="true">{currentWeather.icon}</i>
            {Math.round(currentWeather.temperature)}°C ·{" "}
            {currentWeather.condition}
          </strong>
        ) : (
          <strong>Loading…</strong>
        )}
      </div>
    </div>
  );
}
