"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CloudRain,
  CloudSun,
  Droplets,
  Fish,
  MapPin,
  Navigation,
  Sun,
  Sunrise,
  Sunset,
  Wind,
} from "lucide-react";

const LAKE_CENTER: [number, number] = [47.86791, -91.81121];

type Weather = {
  temperature: number;
  feelsLike: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  sunrise: string;
  sunset: string;
};

function weatherText(code: number) {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Cloudy / fog";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  return "Thunderstorms";
}

function weatherIcon(code: number) {
  if (code === 0) {
    return <Sun size={42} />;
  }

  if (code <= 3) {
    return <CloudSun size={42} />;
  }

  if (code <= 67) {
    return <CloudRain size={42} />;
  }

  return <CloudSun size={42} />;
}

function windDirection(degrees: number) {
  const directions = [
    "N",
    "NE",
    "E",
    "SE",
    "S",
    "SW",
    "W",
    "NW",
  ];

  return directions[
    Math.round(degrees / 45) % 8
  ];
}

function formatTime(time: string) {
  if (!time) return "--";

  const date = new Date(time);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function FishingLocation() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);

  const [weather, setWeather] =
    useState<Weather | null>(null);

  const [weatherLoading, setWeatherLoading] =
    useState(true);

  const [weatherError, setWeatherError] =
    useState("");

  const [satellite, setSatellite] =
    useState(true);

  useEffect(() => {
    const loadWeather = async () => {
      try {
        setWeatherLoading(true);

        const url =
          "https://api.open-meteo.com/v1/forecast" +
          "?latitude=47.86791" +
          "&longitude=-91.81121" +
          "&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m" +
          "&daily=sunrise,sunset" +
          "&temperature_unit=fahrenheit" +
          "&wind_speed_unit=mph" +
          "&precipitation_unit=inch" +
          "&timezone=America%2FChicago";

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Weather request failed");
        }

        const data = await response.json();

        if (!data.current) {
          throw new Error("No current weather data");
        }

        setWeather({
          temperature:
            data.current.temperature_2m,

          feelsLike:
            data.current.apparent_temperature,

          windSpeed:
            data.current.wind_speed_10m,

          windDirection:
            data.current.wind_direction_10m,

          windGusts:
            data.current.wind_gusts_10m,

          humidity:
            data.current.relative_humidity_2m,

          precipitation:
            data.current.precipitation,

          weatherCode:
            data.current.weather_code,

          sunrise:
            data.daily?.sunrise?.[0] || "",

          sunset:
            data.daily?.sunset?.[0] || "",
        });

        setWeatherError("");
      } catch (error) {
        console.error(error);
        setWeatherError(
          "Weather information could not be loaded."
        );
      } finally {
        setWeatherLoading(false);
      }
    };

    loadWeather();
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;
    let script: HTMLScriptElement | null = null;

    const setupMap = async () => {
      const leafletWindow = window as any;

      if (!leafletWindow.L) {
        await new Promise<void>(
          (resolve, reject) => {
            script =
              document.createElement("script");

            script.src =
              "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

            script.onload = () => resolve();

            script.onerror = () =>
              reject(
                new Error(
                  "Leaflet failed to load"
                )
              );

            document.body.appendChild(script);
          }
        );
      }

      if (cancelled || !mapRef.current) {
        return;
      }

      const L = (window as any).L;

      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView(LAKE_CENTER, 13);

      leafletMapRef.current = map;

      const satelliteLayer =
        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            maxZoom: 19,
            attribution:
              "Tiles © Esri",
          }
        );

      const streetLayer =
        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution:
              "© OpenStreetMap contributors",
          }
        );

      if (satellite) {
        satelliteLayer.addTo(map);
      } else {
        streetLayer.addTo(map);
      }

      const lakeOutline = [
        [47.9005, -91.8500],
        [47.9060, -91.8320],
        [47.9000, -91.8100],
        [47.8890, -91.7900],
        [47.8750, -91.7780],
        [47.8580, -91.7780],
        [47.8440, -91.7950],
        [47.8340, -91.8180],
        [47.8420, -91.8400],
        [47.8580, -91.8500],
        [47.8780, -91.8580],
        [47.8950, -91.8500],
      ];

      /*
        General rocky shoreline zones.

        These are intentionally broad areas rather than
        pretending that we know the exact underwater
        location of every individual rock.
      */

      const rockyAreas = [
        {
          name: "Rocky North Shore",
          center: [47.8965, -91.8375],
          radius: 850,
        },
        {
          name: "Rocky West Shore",
          center: [47.8590, -91.8450],
          radius: 650,
        },
        {
          name: "Rocky East Shore",
          center: [47.8750, -91.7930],
          radius: 600,
        },
      ];

      const lakePolygon =
        L.polygon(lakeOutline, {
          color: "#FFC83D",
          weight: 2,
          opacity: 0.9,
          fillColor: "#FFC83D",
          fillOpacity: 0.06,
        }).addTo(map);

      lakePolygon.bindPopup(
        "<strong>White Iron Lake</strong><br/>" +
          "Rocky structure areas are highlighted nearby."
      );

      rockyAreas.forEach(
        (area: any) => {
          const circle =
            L.circle(area.center, {
              radius: area.radius,
              color: "#FFC83D",
              weight: 2,
              opacity: 0.9,
              fillColor: "#FFC83D",
              fillOpacity: 0.2,
              dashArray: "8 6",
            }).addTo(map);

          circle.bindPopup(
            `<strong>🪨 ${area.name}</strong><br/>` +
              `<span style="font-size:12px">` +
              `Likely rocky structure area. ` +
              `Look for points, boulders, rock piles, and shoreline structure.` +
              `</span>`
          );
        }
      );

      /*
        Add fishing structure markers.
      */

      const spots = [
        {
          name: "Rocky Point",
          position: [47.8915, -91.8315],
          description:
            "Rocky point that may hold fish, especially around changing wind conditions.",
        },
        {
          name: "Rocky Shoreline",
          position: [47.8615, -91.8410],
          description:
            "Rocky shoreline area worth checking for smallmouth, walleye, and pike.",
        },
        {
          name: "Rocky East Point",
          position: [47.8790, -91.7970],
          description:
            "Rocky shoreline and point structure. Check different depths around the point.",
        },
      ];

      spots.forEach((spot) => {
        const icon =
          L.divIcon({
            className:
              "ely-fishing-marker",

            html: `
              <div style="
                width:38px;
                height:38px;
                border-radius:50%;
                background:#FFC83D;
                border:3px solid white;
                box-shadow:0 3px 10px rgba(0,0,0,.45);
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:20px;
              ">
                🪨
              </div>
            `,

            iconSize: [38, 38],
            iconAnchor: [19, 19],
          });

        L.marker(
          spot.position,
          { icon }
        )
          .addTo(map)
          .bindPopup(
            `<strong>${spot.name}</strong><br/>` +
              `<span style="font-size:12px">${spot.description}</span>`
          );
      });

      const bounds =
        L.latLngBounds(lakeOutline);

      map.fitBounds(bounds.pad(0.08), {
        maxZoom: 14,
      });

      /*
        Make sure Leaflet recalculates the map
        correctly after the page loads.
      */

      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    };

    setupMap().catch((error) => {
      console.error(error);
    });

    return () => {
      cancelled = true;

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();

        leafletMapRef.current = null;
      }

      if (
        script &&
        script.parentNode
      ) {
        script.parentNode.removeChild(
          script
        );
      }
    };
  }, [satellite]);

  return (
    <main style={styles.page}>
      <style>{`
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');

        .leaflet-popup-content-wrapper {
          border-radius: 14px;
        }

        .leaflet-popup-content {
          margin: 13px 15px;
          line-height: 1.45;
          font-family: Arial, Helvetica, sans-serif;
        }
      `}</style>

      {/* ================= HEADER ================= */}

      <section style={styles.header}>
        <button
          onClick={() =>
            (window.location.href = "/")
          }
          style={styles.backButton}
        >
          <ArrowLeft size={18} />
          Back to Feed
        </button>

        <div style={styles.headerTitleRow}>
          <div>
            <div style={styles.eyebrow}>
              WHITE IRON LAKE
            </div>

            <h1 style={styles.title}>
              Fishing Location
            </h1>

            <p style={styles.subtitle}>
              Find rocky structure and see
              where to start fishing.
            </p>
          </div>

          <div style={styles.logoCircle}>
            <img
              src="/loon-logo.png.png"
              alt="Loon"
              style={styles.logo}
            />
          </div>
        </div>
      </section>

      <section style={styles.content}>

        {/* ================= WEATHER ================= */}

        <section style={styles.weatherSection}>
          <div style={styles.weatherTop}>
            <div>
              <div style={styles.cardEyebrow}>
                WHITE IRON LAKE
              </div>

              <h2 style={styles.weatherTitle}>
                Today's Weather
              </h2>
            </div>

            {weather && (
              <div style={styles.weatherConditionIcon}>
                {weatherIcon(
                  weather.weatherCode
                )}
              </div>
            )}
          </div>

          {weatherLoading && (
            <div style={styles.weatherLoading}>
              Loading current weather...
            </div>
          )}

          {weatherError && (
            <div style={styles.weatherError}>
              {weatherError}
            </div>
          )}

          {weather && !weatherLoading && (
            <>
              <div style={styles.temperatureRow}>
                <div style={styles.temperature}>
                  {Math.round(
                    weather.temperature
                  )}
                  <span>°F</span>
                </div>

                <div>
                  <div
                    style={
                      styles.conditionText
                    }
                  >
                    {weatherText(
                      weather.weatherCode
                    )}
                  </div>

                  <div
                    style={
                      styles.feelsLike
                    }
                  >
                    Feels like{" "}
                    {Math.round(
                      weather.feelsLike
                    )}
                    °F
                  </div>
                </div>
              </div>

              <div style={styles.weatherGrid}>

                <div style={styles.weatherStat}>
                  <Wind
                    size={20}
                    color="#FFC83D"
                  />

                  <div>
                    <span>
                      WIND
                    </span>

                    <strong>
                      {Math.round(
                        weather.windSpeed
                      )}{" "}
                      mph{" "}
                      {windDirection(
                        weather.windDirection
                      )}
                    </strong>
                  </div>
                </div>

                <div style={styles.weatherStat}>
                  <Navigation
                    size={20}
                    color="#FFC83D"
                  />

                  <div>
                    <span>
                      GUSTS
                    </span>

                    <strong>
                      {Math.round(
                        weather.windGusts
                      )} mph
                    </strong>
                  </div>
                </div>

                <div style={styles.weatherStat}>
                  <Droplets
                    size={20}
                    color="#FFC83D"
                  />

                  <div>
                    <span>
                      HUMIDITY
                    </span>

                    <strong>
                      {Math.round(
                        weather.humidity
                      )}
                      %
                    </strong>
                  </div>
                </div>

                <div style={styles.weatherStat}>
                  <CloudRain
                    size={20}
                    color="#FFC83D"
                  />

                  <div>
                    <span>
                      PRECIPITATION
                    </span>

                    <strong>
                      {weather.precipitation.toFixed(
                        2
                      )}
                      "
                    </strong>
                  </div>
                </div>

              </div>

              <div style={styles.sunRow}>

                <div style={styles.sunItem}>
                  <Sunrise
                    size={20}
                    color="#FFC83D"
                  />

                  <div>
                    <span>
                      SUNRISE
                    </span>

                    <strong>
                      {formatTime(
                        weather.sunrise
                      )}
                    </strong>
                  </div>
                </div>

                <div style={styles.sunItem}>
                  <Sunset
                    size={20}
                    color="#FFC83D"
                  />

                  <div>
                    <span>
                      SUNSET
                    </span>

                    <strong>
                      {formatTime(
                        weather.sunset
                      )}
                    </strong>
                  </div>
                </div>

              </div>
            </>
          )}
        </section>

        {/* ================= ROCK MAP ================= */}

        <section style={styles.mapCard}>

          <div style={styles.mapHeader}>
            <div>
              <div style={styles.cardEyebrow}>
                FIND THE STRUCTURE
              </div>

              <h2 style={styles.mapTitle}>
                Rocky Areas
              </h2>

              <p style={styles.mapSubtitle}>
                Look for rocks, points,
                boulders and shoreline
                structure.
              </p>
            </div>

            <div style={styles.rockBadge}>
              🪨 Rock
            </div>
          </div>

          <div style={styles.mapControls}>
            <button
              onClick={() =>
                setSatellite(true)
              }
              style={
                satellite
                  ? styles.mapToggleActive
                  : styles.mapToggle
              }
            >
              Satellite
            </button>

            <button
              onClick={() =>
                setSatellite(false)
              }
              style={
                !satellite
                  ? styles.mapToggleActive
                  : styles.mapToggle
              }
            >
              Map
            </button>
          </div>

          <div
            ref={mapRef}
            style={styles.map}
          />

          <div style={styles.mapLegend}>

            <div>
              <span
                style={
                  styles.yellowDot
                }
              />
              Rocky area
            </div>

            <div>
              <span
                style={
                  styles.rockMarker
                }
              >
                🪨
              </span>
              Structure spot
            </div>

          </div>
        </section>

        {/* ================= FISHING TIPS ================= */}

        <section style={styles.structureCard}>

          <div style={styles.structureHeader}>
            <div
              style={
                styles.structureIcon
              }
            >
              <Fish size={24} />
            </div>

            <div>
              <div
                style={styles.cardEyebrow}
              >
                WHERE TO START
              </div>

              <h2
                style={
                  styles.structureTitle
                }
              >
                Fish the Rocks
              </h2>
            </div>
          </div>

          <div style={styles.tipList}>

            <div style={styles.tip}>
              <div style={styles.tipNumber}>
                1
              </div>

              <div>
                <strong>
                  Rocky points
                </strong>

                <p>
                  Check the tip and both
                  sides of rocky points.
                </p>
              </div>
            </div>

            <div style={styles.tip}>
              <div style={styles.tipNumber}>
                2
              </div>

              <div>
                <strong>
                  Boulders & rock piles
                </strong>

                <p>
                  Rocks can create places
                  for fish to hold and
                  ambush prey.
                </p>
              </div>
            </div>

            <div style={styles.tip}>
              <div style={styles.tipNumber}>
                3
              </div>

              <div>
                <strong>
                  Wind-blown shoreline
                </strong>

                <p>
                  When the wind pushes
                  bait toward rocky
                  shoreline, it can be
                  worth checking.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ================= LAKE INFO ================= */}

        <div style={styles.infoGrid}>

          <div style={styles.infoCard}>
            <div style={styles.infoIcon}>
              <MapPin size={22} />
            </div>

            <strong>
              3,246 acres
            </strong>

            <span>
              White Iron Lake
            </span>
          </div>

          <div style={styles.infoCard}>
            <div style={styles.infoIcon}>
              <Fish size={22} />
            </div>

            <strong>
              Walleye
            </strong>

            <span>
              Major game fish
            </span>
          </div>

          <div style={styles.infoCard}>
            <div style={styles.infoIcon}>
              🪨
            </div>

            <strong>
              Rocky
            </strong>

            <span>
              Shoreline structure
            </span>
          </div>

        </div>

        {/* ================= NOTE ================= */}

        <div style={styles.noteCard}>

          <strong>
            About the rock map
          </strong>

          <p>
            The highlighted areas are
            intended to help identify
            places where rocky structure
            may be worth checking.
          </p>

          <p style={styles.muted}>
            Individual underwater rocks
            aren't mapped here as exact
            GPS locations, so the map
            avoids pretending that an
            exact rock is guaranteed at
            every marker.
          </p>

        </div>

      </section>

      {/* ================= NAV ================= */}

      <nav style={styles.nav}>

        <button
          style={styles.navButton}
          onClick={() =>
            (window.location.href = "/")
          }
        >
          <Fish size={21} />
          Feed
        </button>

        <button
          style={styles.navActive}
        >
          <MapPin size={21} />
          Fishing
        </button>

      </nav>

    </main>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles: Record<
  string,
  React.CSSProperties
> = {

  page: {
    minHeight: "100vh",
    background: "#050B10",
    color: "#F5F7F7",
    paddingBottom: "90px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  header: {
    background:
      "linear-gradient(145deg, #071827, #0B2637)",
    padding:
      "22px 22px 30px",
    borderBottom:
      "1px solid rgba(255,255,255,0.1)",
  },

  backButton: {
    border: "none",
    background:
      "rgba(255,255,255,0.08)",
    color: "#fff",
    borderRadius: 12,
    padding:
      "10px 13px",
    display: "flex",
    alignItems: "center",
    gap: 7,
    cursor: "pointer",
    fontWeight: 800,
  },

  headerTitleRow: {
    maxWidth: 900,
    margin:
      "25px auto 0",
    display: "flex",
    justifyContent:
      "space-between",
    gap: 20,
    alignItems: "center",
  },

  eyebrow: {
    color: "#FFC83D",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 3,
  },

  title: {
    margin:
      "6px 0 0",
    fontSize: 38,
    lineHeight: 1,
    fontWeight: 900,
  },

  subtitle: {
    margin:
      "10px 0 0",
    color:
      "rgba(255,255,255,0.65)",
    fontSize: 14,
    lineHeight: 1.5,
  },

  logoCircle: {
    width: 86,
    height: 86,
    borderRadius: "50%",
    background:
      "rgba(0,0,0,0.25)",
    border:
      "1px solid rgba(255,255,255,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  logo: {
    width: 76,
    height: 76,
    objectFit: "contain",
  },

  content: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "22px",
  },

  /* WEATHER */

  weatherSection: {
    padding: 22,
    borderRadius: 24,
    background:
      "linear-gradient(145deg, #0C3046, #082235)",
    border:
      "1px solid rgba(255,255,255,0.12)",
    marginBottom: 18,
    boxShadow:
      "0 15px 40px rgba(0,0,0,0.2)",
  },

  weatherTop: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  weatherTitle: {
    margin:
      "5px 0 0",
    fontSize: 26,
    fontWeight: 900,
  },

  weatherConditionIcon: {
    width: 70,
    height: 70,
    borderRadius: 20,
    background:
      "rgba(255,200,61,0.15)",
    color: "#FFC83D",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  weatherLoading: {
    marginTop: 20,
    color:
      "rgba(255,255,255,0.6)",
  },

  weatherError: {
    marginTop: 18,
    padding: 13,
    borderRadius: 12,
    background:
      "rgba(255,100,80,0.12)",
    color: "#FFC83D",
  },

  temperatureRow: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    marginTop: 18,
  },

  temperature: {
    fontSize: 64,
    fontWeight: 900,
    lineHeight: 0.95,
    letterSpacing: -3,
  },

  conditionText: {
    fontSize: 19,
    fontWeight: 800,
  },

  feelsLike: {
    marginTop: 5,
    color:
      "rgba(255,255,255,0.55)",
    fontSize: 13,
  },

  weatherGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, 1fr)",
    gap: 10,
    marginTop: 22,
  },

  weatherStat: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: 13,
    borderRadius: 15,
    background:
      "rgba(255,255,255,0.05)",
  },

  weatherStatSpan: {},

  weatherStatStrong: {},

  sunRow: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, 1fr)",
    gap: 10,
    marginTop: 10,
  },

  sunItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 13,
    borderRadius: 15,
    background:
      "rgba(255,255,255,0.05)",
  },

  /* MAP */

  mapCard: {
    overflow: "hidden",
    borderRadius: 24,
    background: "#071827",
    border:
      "1px solid rgba(255,255,255,0.12)",
    boxShadow:
      "0 15px 40px rgba(0,0,0,0.25)",
  },

  mapHeader: {
    padding:
      "19px 19px 14px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent:
      "space-between",
    gap: 15,
  },

  mapTitle: {
    margin:
      "5px 0 0",
    fontSize: 27,
    fontWeight: 900,
  },

  mapSubtitle: {
    margin:
      "6px 0 0",
    color:
      "rgba(255,255,255,0.55)",
    fontSize: 13,
    lineHeight: 1.45,
  },

  rockBadge: {
    padding:
      "8px 11px",
    borderRadius: 999,
    background:
      "rgba(255,200,61,0.15)",
    color: "#FFC83D",
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },

  mapControls: {
    display: "flex",
    gap: 7,
    padding:
      "0 18px 14px",
  },

  mapToggle: {
    border:
      "1px solid rgba(255,255,255,0.12)",
    background:
      "rgba(255,255,255,0.05)",
    color:
      "rgba(255,255,255,0.65)",
    padding:
      "8px 13px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 800,
  },

  mapToggleActive: {
    border:
      "1px solid rgba(255,200,61,0.4)",
    background:
      "rgba(255,200,61,0.16)",
    color: "#FFC83D",
    padding:
      "8px 13px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 900,
  },

  map: {
    height: 520,
    width: "100%",
    background: "#D9EEF5",
  },

  mapLegend: {
    display: "flex",
    flexWrap: "wrap",
    gap: 18,
    padding:
      "13px 17px",
    color:
      "rgba(255,255,255,0.7)",
    fontSize: 12,
    borderTop:
      "1px solid rgba(255,255,255,0.08)",
  },

  yellowDot: {
    display: "inline-block",
    width: 11,
    height: 11,
    borderRadius: "50%",
    background: "#FFC83D",
    marginRight: 6,
  },

  rockMarker: {
    marginRight: 5,
  },

  /* STRUCTURE */

  structureCard: {
    marginTop: 18,
    padding: 20,
    borderRadius: 22,
    background:
      "rgba(255,255,255,0.04)",
    border:
      "1px solid rgba(255,255,255,0.09)",
  },

  structureHeader: {
    display: "flex",
    alignItems: "center",
    gap: 13,
  },

  structureIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    background: "#FFC83D",
    color: "#050B10",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  structureTitle: {
    margin:
      "4px 0 0",
    fontSize: 24,
    fontWeight: 900,
  },

  tipList: {
    display: "flex",
    flexDirection: "column",
    gap: 13,
    marginTop: 20,
  },

  tip: {
    display: "flex",
    gap: 12,
  },

  tipNumber: {
    width: 29,
    height: 29,
    borderRadius: "50%",
    background:
      "rgba(255,200,61,0.15)",
    color: "#FFC83D",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    flexShrink: 0,
  },

  /* INFO */

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: 12,
    marginTop: 18,
  },

  infoCard: {
    padding: 17,
    borderRadius: 19,
    background:
      "rgba(255,255,255,0.04)",
    border:
      "1px solid rgba(255,255,255,0.09)",
    display: "flex",
    flexDirection: "column",
  },

  infoIcon: {
    color: "#FFC83D",
    marginBottom: 10,
  },

  /* NOTE */

  noteCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 20,
    background:
      "rgba(255,255,255,0.04)",
    border:
      "1px solid rgba(255,255,255,0.09)",
    lineHeight: 1.55,
    fontSize: 13,
  },

  muted: {
    color:
      "rgba(255,255,255,0.55)",
    fontSize: 12,
    lineHeight: 1.5,
  },

  /* NAV */

  nav: {
    position: "fixed",
    zIndex: 80,
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 70,
    background:
      "rgba(5,11,16,0.96)",
    borderTop:
      "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(18px)",
  },

  navButton: {
    border: "none",
    background: "transparent",
    color:
      "rgba(255,255,255,0.45)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    fontWeight: 700,
    cursor: "pointer",
  },

  navActive: {
    border: "none",
    background: "transparent",
    color: "#FFC83D",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    fontWeight: 800,
  },
};
