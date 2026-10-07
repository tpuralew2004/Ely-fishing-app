"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, CloudSun, Fish, MapPin, Waves } from "lucide-react";

const DNR_CONTOURS_URL =
  "https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/water_lake_bathymetry/MapServer/0/query";

const LAKE_CENTER: [number, number] = [47.86791, -91.81121];

type Weather = {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
};

type SelectedDepth = {
  depth: number;
  lat: number;
  lng: number;
  distanceMeters: number;
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

function haversineMeters(
  a: [number, number],
  b: [number, number]
) {
  const R = 6371000;

  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;

  const dLat =
    ((b[0] - a[0]) * Math.PI) / 180;

  const dLng =
    ((b[1] - a[1]) * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) ** 2;

  return (
    2 *
    R *
    Math.atan2(
      Math.sqrt(x),
      Math.sqrt(1 - x)
    )
  );
}

function pointToSegmentDistance(
  point: [number, number],
  start: [number, number],
  end: [number, number]
) {
  const latScale = 111320;

  const lngScale =
    111320 *
    Math.cos(
      (point[0] * Math.PI) / 180
    );

  const px = point[1] * lngScale;
  const py = point[0] * latScale;

  const ax = start[1] * lngScale;
  const ay = start[0] * latScale;

  const bx = end[1] * lngScale;
  const by = end[0] * latScale;

  const dx = bx - ax;
  const dy = by - ay;

  const lengthSquared =
    dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return {
      distance: haversineMeters(
        point,
        start
      ),
      point: start,
    };
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((px - ax) * dx +
        (py - ay) * dy) /
        lengthSquared
    )
  );

  const closest: [number, number] = [
    ay / latScale +
      (dy * t) / latScale,

    ax / lngScale +
      (dx * t) / lngScale,
  ];

  return {
    distance: Math.sqrt(
      (px - (ax + dx * t)) ** 2 +
        (py - (ay + dy * t)) ** 2
    ),

    point: closest,
  };
}

export default function FishingLocation() {
  const mapRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const leafletMapRef =
    useRef<any>(null);

  const contourFeaturesRef =
    useRef<any[]>([]);

  const [weather, setWeather] =
    useState<Weather | null>(null);

  const [mapLoading, setMapLoading] =
    useState(true);

  const [mapError, setMapError] =
    useState("");

  const [
    selectedDepth,
    setSelectedDepth,
  ] =
    useState<SelectedDepth | null>(
      null
    );

  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=47.86791&longitude=-91.81121&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph"
    )
      .then((response) =>
        response.json()
      )
      .then((data) => {
        if (data.current) {
          setWeather(data.current);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    let cancelled = false;
    let script:
      | HTMLScriptElement
      | null = null;

    const setupMap = async () => {
      const leafletWindow =
        window as any;

      if (!leafletWindow.L) {
        await new Promise<void>(
          (resolve, reject) => {
            script =
              document.createElement(
                "script"
              );

            script.src =
              "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

            script.onload = () =>
              resolve();

            script.onerror = () =>
              reject(
                new Error(
                  "Leaflet failed to load"
                )
              );

            document.body.appendChild(
              script
            );
          }
        );
      }

      if (
        cancelled ||
        !mapRef.current
      ) {
        return;
      }

      const L = (window as any).L;

      const map = L.map(
        mapRef.current,
        {
          zoomControl: true,
          scrollWheelZoom: true,
        }
      ).setView(
        LAKE_CENTER,
        13
      );

      leafletMapRef.current =
        map;

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution:
            "© OpenStreetMap contributors",
        }
      ).addTo(map);

      try {
        const params =
          new URLSearchParams({
            where:
              "dowlknum='69000400'",

            outFields:
              "depth,abs_depth,lake_name",

            returnGeometry: "true",

            outSR: "4326",

            f: "geojson",
          });

        const response =
          await fetch(
            `${DNR_CONTOURS_URL}?${params.toString()}`
          );

        if (!response.ok) {
          throw new Error(
            "DNR contour request failed"
          );
        }

        const geojson =
          await response.json();

        const features =
          geojson.features || [];

        contourFeaturesRef.current =
          features;

        L.geoJSON(geojson, {
          style: (
            feature: any
          ) => {
            const depth =
              Number(
                feature?.properties
                  ?.depth ?? 0
              );

            const weight =
              depth >= 35
                ? 4
                : depth >= 20
                ? 3
                : 2;

            return {
              color:
                depth >= 35
                  ? "#073B5C"
                  : "#1677A8",

              weight,

              opacity: 0.9,
            };
          },

          onEachFeature: (
            feature: any,
            layer: any
          ) => {
            const depth =
              Number(
                feature?.properties
                  ?.depth ?? 0
              );

            layer.bindTooltip(
              `${depth} ft contour`,
              {
                sticky: true,
                direction: "top",
              }
            );
          },
        }).addTo(map);

        const outlineParams =
          new URLSearchParams({
            where:
              "dowlknum='69000400'",

            outFields:
              "lake_name",

            returnGeometry: "true",

            outSR: "4326",

            f: "geojson",
          });

        const outlineResponse =
          await fetch(
            `https://enterprise.gisdata.mn.gov/aghost/rest/services/us_mn_state_dnr/water_lake_bathymetry/MapServer/1/query?${outlineParams.toString()}`
          );

        if (outlineResponse.ok) {
          const outline =
            await outlineResponse.json();

          L.geoJSON(outline, {
            style: {
              color: "#062D45",
              weight: 3,
              fillColor:
                "#4FB3D1",
              fillOpacity: 0.08,
            },
          }).addTo(map);
        }

        map.on(
          "click",
          (event: any) => {
            const clickPoint: [
              number,
              number
            ] = [
              event.latlng.lat,
              event.latlng.lng,
            ];

            let closest:
              | SelectedDepth
              | null = null;

            for (const feature of
              contourFeaturesRef.current) {
              const depth =
                Number(
                  feature?.properties
                    ?.depth
                );

              const coordinates =
                feature?.geometry
                  ?.coordinates || [];

              for (const line of coordinates) {
                for (
                  let i = 1;
                  i < line.length;
                  i++
                ) {
                  const start: [
                    number,
                    number
                  ] = [
                    line[i - 1][1],
                    line[i - 1][0],
                  ];

                  const end: [
                    number,
                    number
                  ] = [
                    line[i][1],
                    line[i][0],
                  ];

                  const result =
                    pointToSegmentDistance(
                      clickPoint,
                      start,
                      end
                    );

                  if (
                    !closest ||
                    result.distance <
                      closest.distanceMeters
                  ) {
                    closest = {
                      depth,
                      lat:
                        result.point[0],
                      lng:
                        result.point[1],
                      distanceMeters:
                        result.distance,
                    };
                  }
                }
              }
            }

            if (closest) {
              setSelectedDepth(
                closest
              );

              L.popup()
                .setLatLng(
                  event.latlng
                )
                .setContent(
                  `<strong>Nearest surveyed contour: ${closest.depth} ft</strong><br/>` +
                    `<span style="font-size:12px">This is the closest DNR contour to your tap — not an exact point depth.</span>`
                )
                .openOn(map);
            }
          }
        );

        map.fitBounds(
          L.geoJSON(
            geojson
          ).getBounds().pad(0.08),
          {
            maxZoom: 14,
          }
        );

        setMapLoading(false);
      } catch (error) {
        console.error(error);

        setMapError(
          "The DNR depth layer could not load. The rest of the fishing page is still available."
        );

        setMapLoading(false);
      }
    };

    setupMap().catch(
      (error) => {
        console.error(error);

        setMapError(
          "The interactive map could not load."
        );

        setMapLoading(false);
      }
    );

    return () => {
      cancelled = true;

      if (leafletMapRef.current) {
        leafletMapRef.current.remove();

        leafletMapRef.current =
          null;
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
  }, []);

  return (
    <main style={styles.page}>
      <style>{`
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
      `}</style>

      <section style={styles.header}>
        <button
          onClick={() =>
            (window.location.href =
              "/")
          }
          style={styles.backButton}
        >
          <ArrowLeft size={18} />
          Back to Feed
        </button>

        <div
          style={
            styles.headerTitleRow
          }
        >
          <div>
            <div
              style={styles.eyebrow}
            >
              WHITE IRON LAKE
            </div>

            <h1
              style={styles.title}
            >
              Fishing Location
            </h1>

            <p
              style={
                styles.subtitle
              }
            >
              Explore the lake and
              tap near a contour to
              see its surveyed depth.
            </p>
          </div>

          <div
            style={
              styles.logoCircle
            }
          >
            <img
              src="/loon-logo.png.png"
              alt="Loon"
              style={styles.logo}
            />
          </div>
        </div>
      </section>

      <section style={styles.content}>
        {weather && (
          <div
            style={
              styles.weatherCard
            }
          >
            <div
              style={
                styles.weatherIcon
              }
            >
              <CloudSun size={28} />
            </div>

            <div>
              <div
                style={
                  styles.cardEyebrow
                }
              >
                CURRENT WEATHER
              </div>

              <div
                style={
                  styles.weatherMain
                }
              >
                {Math.round(
                  weather.temperature
                )}
                °F ·{" "}
                {weatherText(
                  weather.weatherCode
                )}
              </div>

              <div
                style={styles.muted}
              >
                Wind{" "}
                {Math.round(
                  weather.windSpeed
                )}{" "}
                mph ·{" "}
                {Math.round(
                  weather.windDirection
                )}
                °
              </div>
            </div>
          </div>
        )}

        <div
          style={styles.mapCard}
        >
          <div
            style={
              styles.mapHeader
            }
          >
            <div>
              <div
                style={
                  styles.cardEyebrow
                }
              >
                INTERACTIVE DEPTH MAP
              </div>

              <h2
                style={styles.mapTitle}
              >
                White Iron Lake
              </h2>
            </div>

            <div
              style={
                styles.depthBadge
              }
            >
              DNR contours
            </div>
          </div>

          <div
            ref={mapRef}
            style={styles.map}
          />

          {mapLoading && (
            <div
              style={
                styles.mapOverlay
              }
            >
              Loading DNR depth
              contours…
            </div>
          )}

          {mapError && (
            <div
              style={styles.error}
            >
              {mapError}
            </div>
          )}

          <div
            style={styles.legend}
          >
            <span>
              <i
                style={{
                  ...styles.legendDot,
                  background:
                    "#1677A8",
                }}
              />{" "}
              0–20 ft
            </span>

            <span>
              <i
                style={{
                  ...styles.legendDot,
                  background:
                    "#073B5C",
                }}
              />{" "}
              35–40 ft
            </span>

            <span>
              <i
                style={
                  styles.legendLine
                }
              />{" "}
              surveyed contour
            </span>
          </div>
        </div>

        {selectedDepth && (
          <div
            style={
              styles.selectedCard
            }
          >
            <div
              style={
                styles.selectedIcon
              }
            >
              <Waves size={24} />
            </div>

            <div>
              <div
                style={
                  styles.cardEyebrow
                }
              >
                MAP SELECTION
              </div>

              <div
                style={
                  styles.selectedDepth
                }
              >
                {selectedDepth.depth} ft
              </div>

              <div
                style={styles.muted}
              >
                Nearest surveyed
                contour to your tap
                · about{" "}
                {Math.round(
                  selectedDepth.distanceMeters
                )}{" "}
                m away
              </div>
            </div>
          </div>
        )}

        <div
          style={styles.infoGrid}
        >
          <div
            style={styles.infoCard}
          >
            <div
              style={
                styles.infoIcon
              }
            >
              <Waves size={22} />
            </div>

            <strong>
              47 ft
            </strong>

            <span>
              maximum depth reported
              by MN DNR
            </span>
          </div>

          <div
            style={styles.infoCard}
          >
            <div
              style={
                styles.infoIcon
              }
            >
              <MapPin size={22} />
            </div>

            <strong>
              3,246 acres
            </strong>

            <span>
              White Iron Lake
              surface area
            </span>
          </div>

          <div
            style={styles.infoCard}
          >
            <div
              style={
                styles.infoIcon
              }
            >
              <Fish size={22} />
            </div>

            <strong>
              Walleye
            </strong>

            <span>
              one of the lake’s
              major game fish
            </span>
          </div>
        </div>

        <div
          style={styles.noteCard}
        >
          <strong>
            How the map works
          </strong>

          <p>
            The lines are the
            Minnesota DNR’s surveyed
            bathymetric contours.
            Tap the map to find the
            closest surveyed contour.
            A tap between lines is
            not an exact depth
            reading, so the site does
            not pretend to give a
            made-up precise number.
          </p>

          <p
            style={styles.muted}
          >
            The historical DNR survey
            maps White Iron Lake with
            contours to 40 ft, while
            the DNR lake information
            reports a 47 ft maximum
            depth.
          </p>
        </div>
      </section>

      <nav style={styles.nav}>
        <button
          style={styles.navButton}
          onClick={() =>
            (window.location.href =
              "/")
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
    padding: "22px 22px 28px",
    borderBottom:
      "1px solid rgba(255,255,255,0.1)",
  },

  backButton: {
    border: "none",
    background:
      "rgba(255,255,255,0.08)",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 13px",
    display: "flex",
    alignItems: "center",
    gap: 7,
    cursor: "pointer",
    fontWeight: 800,
  },

  headerTitleRow: {
    maxWidth: 900,
    margin: "25px auto 0",
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
    margin: "6px 0 0",
    fontSize: 38,
    lineHeight: 1,
    fontWeight: 900,
  },

  subtitle: {
    margin: "10px 0 0",
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
    justifyContent:
      "center",
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

  weatherCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: 17,
    borderRadius: 20,
    background:
      "rgba(30,120,183,0.16)",
    border:
      "1px solid rgba(255,255,255,0.1)",
    marginBottom: 16,
  },

  weatherIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    background: "#FFC83D",
    color: "#050B10",
  },

  cardEyebrow: {
    color: "#FFC83D",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 2,
  },

  weatherMain: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: 900,
  },

  muted: {
    marginTop: 3,
    color:
      "rgba(255,255,255,0.55)",
    fontSize: 12,
    lineHeight: 1.5,
  },

  mapCard: {
    overflow: "hidden",
    borderRadius: 23,
    background: "#071827",
    border:
      "1px solid rgba(255,255,255,0.12)",
    boxShadow:
      "0 15px 40px rgba(0,0,0,0.25)",
  },

  mapHeader: {
    padding:
      "18px 18px 15px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: 12,
  },

  mapTitle: {
    margin: "4px 0 0",
    fontSize: 25,
    fontWeight: 900,
  },

  depthBadge: {
    padding: "7px 10px",
    borderRadius: 999,
    background:
      "rgba(79,179,209,0.16)",
    color: "#8FDDF0",
    fontSize: 11,
    fontWeight: 800,
  },

  map: {
    height: 520,
    width: "100%",
    background: "#D9EEF5",
  },

  mapOverlay: {
    position: "relative",
    margin: "-520px 0 0",
    height: 520,
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    pointerEvents: "none",
    background:
      "rgba(5,11,16,0.18)",
    color: "#fff",
    fontWeight: 800,
  },

  error: {
    padding: 15,
    color: "#FFC83D",
    background:
      "rgba(255,112,67,0.12)",
  },

  legend: {
    display: "flex",
    flexWrap: "wrap",
    gap: 15,
    padding:
      "13px 17px",
    color:
      "rgba(255,255,255,0.7)",
    fontSize: 11,
    borderTop:
      "1px solid rgba(255,255,255,0.08)",
  },

  legendDot: {
    display: "inline-block",
    width: 9,
    height: 9,
    borderRadius: "50%",
    marginRight: 5,
  },

  legendLine: {
    display: "inline-block",
    width: 18,
    height: 3,
    background: "#1677A8",
    marginRight: 5,
    verticalAlign:
      "middle",
  },

  selectedCard: {
    marginTop: 16,
    padding: 18,
    borderRadius: 20,
    background:
      "rgba(255,200,61,0.1)",
    border:
      "1px solid rgba(255,200,61,0.2)",
    display: "flex",
    gap: 14,
    alignItems: "center",
  },

  selectedIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    background: "#FFC83D",
    color: "#050B10",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
  },

  selectedDepth: {
    fontSize: 27,
    fontWeight: 900,
    marginTop: 2,
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: 12,
    marginTop: 16,
  },

  infoCard: {
    padding: 17,
    borderRadius: 19,
    background:
      "rgba(255,255,255,0.04)",
    border:
      "1px solid rgba(255,255,255,0.09)",
  },

  infoIcon: {
    color: "#FFC83D",
    marginBottom: 10,
  },

  noteCard: {
    marginTop: 16,
    padding: 18,
    borderRadius: 20,
    background:
      "rgba(255,255,255,0.04)",
    border:
      "1px solid rgba(255,255,255,0.09)",
    lineHeight: 1.55,
    fontSize: 13,
  },

  nav: {
    position: "fixed",
    zIndex: 80,
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    display: "flex",
    justifyContent:
      "center",
    alignItems: "center",
    gap: 70,
    background:
      "rgba(5,11,16,0.96)",
    borderTop:
      "1px solid rgba(255,255,255,0.12)",
    backdropFilter:
      "blur(18px)",
  },

  navButton: {
    border: "none",
    background: "transparent",
    color:
      "rgba(255,255,255,0.45)",
    display: "flex",
    flexDirection:
      "column",
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
    flexDirection:
      "column",
    alignItems: "center",
    gap: 4,
    fontWeight: 800,
  },
};
