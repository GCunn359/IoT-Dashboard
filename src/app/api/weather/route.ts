import { NextResponse } from "next/server";

import { describeWeather, weatherIcon } from "@/lib/weather";

type OpenMeteoResponse = {
  current?: {
    apparent_temperature?: number;
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
};

export async function GET() {
  const response = await fetch(
    "https://api.open-meteo.com/v1/forecast?latitude=53.1589&longitude=-6.9096&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Europe%2FDublin",
    {
      next: {
        revalidate: 600,
      },
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Could not load Kildare weather." },
      { status: 502 },
    );
  }

  const data = (await response.json()) as OpenMeteoResponse;
  const current = data.current;

  if (!current || typeof current.temperature_2m !== "number") {
    return NextResponse.json(
      { error: "Kildare weather response was incomplete." },
      { status: 502 },
    );
  }

  const code = current.weather_code ?? -1;

  return NextResponse.json({
    apparentTemperature: current.apparent_temperature ?? current.temperature_2m,
    condition: describeWeather(code),
    icon: weatherIcon(code),
    location: "Kildare, Ireland",
    temperature: current.temperature_2m,
    windSpeed: current.wind_speed_10m ?? null,
  });
}
