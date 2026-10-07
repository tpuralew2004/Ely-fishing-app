"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Cloud,
  CloudRain,
  Fish,
  Map,
  MapPin,
  Sun,
  Thermometer,
  Wind,
  Waves,
} from "lucide-react";

type Weather = {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  weatherCode: number;
};

const colors = {
  navy: "#071827",
  deepNavy: "#050B10",
  lakeBlue: "#1E78B7",
  sunsetOrange: "#FF7043",
  sunYellow: "#FFC83D",
  loonWhite: "#F5F7F7",
};

const LATITUDE = 47.868;
const LONGITUDE = -91.811;

function weatherDescription(code: number) {
  if (code === 0) return "Clear skies";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Cloudy";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code >= 95) return "Thunderstorm";

  return "Mixed conditions";
}

function weatherIcon(code: number) {
  if (code === 0) {
    return <Sun size={34} />;
  }

  if (code <= 3) {
    return <Cloud size={34} />;
  }

  return <CloudRain size={34} />;
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

export default function FishingLocation() {
  const [weather, setWeather] =
    useState<Weather | null>(null);

  const [weatherLoading, setWeatherLoading] =
    useState(true);

  useEffect(() => {
    async function getWeather() {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}&current=temperature_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`
        );

        const data = await response.json();

        setWeather({
          temperature:
            data.current.temperature_2m,
          windSpeed:
            data.current.wind_speed_10m,
          windDirection:
            data.current.wind_direction_10m,
          precipitation:
            data.current.precipitation,
          weatherCode:
            data.current.weather_code,
        });
      } catch (error) {
        console.error(
          "Weather error:",
          error
        );
      } finally {
        setWeatherLoading(false);
      }
    }

    getWeather();
  }, []);

  return (
    <main style={styles.page}>

      {/* HEADER */}

      <header style={styles.header}>

        <button
          onClick={() => {
            window.location.href = "/";
          }}
          style={styles.backButton}
        >
          <ArrowLeft size={21} />
        </button>

        <div>
          <div style={styles.headerEyebrow}>
            ELY, MINNESOTA
          </div>

          <h1 style={styles.headerTitle}>
            Fishing Location
          </h1>
        </div>

      </header>


      {/* HERO */}

      <section style={styles.hero}>

        <div style={styles.heroOverlay} />

        <div style={styles.heroContent}>

          <div style={styles.heroIcon}>
            <Fish size={30} />
          </div>

          <div style={styles.heroEyebrow}>
            WHITE IRON LAKE
          </div>

          <h2 style={styles.heroTitle}>
            Know the Lake
          </h2>

          <p style={styles.heroText}>
            Weather, lake depth, fishing
            conditions and useful spots
            for the family fishing trip.
          </p>

        </div>

      </section>


      {/* WEATHER */}

      <section style={styles.section}>

        <div style={styles.sectionHeader}>

          <div>
            <div style={styles.sectionEyebrow}>
              CURRENT CONDITIONS
            </div>

            <h2 style={styles.sectionTitle}>
              Weather
            </h2>
          </div>

          <Cloud size={25} />

        </div>


        {weatherLoading && (
          <div style={styles.card}>
            Loading current weather...
          </div>
        )}


        {!weatherLoading && weather && (
          <div style={styles.weatherCard}>

            <div style={styles.weatherTop}>

              <div style={styles.weatherIcon}>
                {weatherIcon(
                  weather.weatherCode
                )}
              </div>

              <div>

                <div style={styles.temperature}>
                  {Math.round(
                    weather.temperature
                  )}°
                </div>

                <div style={styles.weatherDescription}>
                  {weatherDescription(
                    weather.weatherCode
                  )}
                </div>

              </div>

            </div>


            <div style={styles.weatherGrid}>

              <div style={styles.weatherStat}>
                <Wind size={20} />

                <div>
                  <span>
                    WIND
                  </span>

                  <strong>
                    {Math.round(
                      weather.windSpeed
                    )} mph{" "}
                    {windDirection(
                      weather.windDirection
                    )}
                  </strong>
                </div>

              </div>


              <div style={styles.weatherStat}>
                <Thermometer size={20} />

                <div>
                  <span>
                    TEMPERATURE
                  </span>

                  <strong>
                    {Math.round(
                      weather.temperature
                    )}°F
                  </strong>
                </div>

              </div>

            </div>

          </div>
        )}

      </section>


      {/* LAKE FACTS */}

      <section style={styles.section}>

        <div style={styles.sectionHeader}>

          <div>
            <div style={styles.sectionEyebrow}>
              LAKE DATA
            </div>

            <h2 style={styles.sectionTitle}>
              White Iron Lake
            </h2>
          </div>

          <Waves size={25} />

        </div>


        <div style={styles.statsGrid}>

          <div style={styles.statCard}>
            <Waves size={22} />

            <strong>
              3,246
            </strong>

            <span>
              Acres
            </span>
          </div>


          <div style={styles.statCard}>
            <Map size={22} />

            <strong>
              47 ft
            </strong>

            <span>
              Maximum depth
            </span>
          </div>


          <div style={styles.statCard}>
            <MapPin size={22} />

            <strong>
              14 mi
            </strong>

            <span>
              Shoreline
            </span>
          </div>


          <div style={styles.statCard}>
            <Fish size={22} />

            <strong>
              Walleye
            </strong>

            <span>
              Major species
            </span>
          </div>

        </div>

      </section>


      {/* DEPTH */}

      <section style={styles.section}>

        <div style={styles.sectionHeader}>

          <div>
            <div style={styles.sectionEyebrow}>
              DEPTH GUIDE
            </div>

            <h2 style={styles.sectionTitle}>
              How deep is the water?
            </h2>
          </div>

          <Map size={25} />

        </div>


        <div style={styles.depthCard}>

          <DepthRow
            depth="0–10 ft"
            title="Shallow"
            description="Good area to check around shorelines, flats and structure, especially during low-light periods."
            level="shallow"
          />

          <DepthRow
            depth="10–20 ft"
            title="Mid-depth"
            description="A useful range to search for walleye, perch, crappies and other fish moving between shallow and deeper water."
            level="medium"
          />

          <DepthRow
            depth="20–35 ft"
            title="Deep transition"
            description="Look for drop-offs where the bottom changes quickly from mid-depth water into deeper water."
            level="deep"
          />

          <DepthRow
            depth="35–47 ft"
            title="Deep water"
            description="The deepest part of the lake. Useful when fish move away from shallow areas."
            level="veryDeep"
          />

        </div>


        <div style={styles.note}>

          <Map size={16} />

          <span>
            These are general depth ranges.
            Use the official DNR bathymetric
            map for exact contours and
            individual locations.
          </span>

        </div>

      </section>


      {/* FISHING AREAS */}

      <section style={styles.section}>

        <div style={styles.sectionHeader}>

          <div>
            <div style={styles.sectionEyebrow}>
              FISHING GUIDE
            </div>

            <h2 style={styles.sectionTitle}>
              What to look for
            </h2>
          </div>

          <Fish size={25} />

        </div>


        <div style={styles.spotCard}>

          <div style={styles.spotNumber}>
            01
          </div>

          <div>

            <h3>
              Drop-offs
            </h3>

            <p>
              Find places where shallow
              water quickly falls into
              deeper water.
            </p>

            <strong>
              Try: 15–30+ ft
            </strong>

          </div>

        </div>


        <div style={styles.spotCard}>

          <div style={styles.spotNumber}>
            02
          </div>

          <div>

            <h3>
              Shallow flats
            </h3>

            <p>
              Check shallower areas around
              structure, especially early
              and late in the day.
            </p>

            <strong>
              Try: 6–12 ft
            </strong>

          </div>

        </div>


        <div style={styles.spotCard}>

          <div style={styles.spotNumber}>
            03
          </div>

          <div>

            <h3>
              Deep basin
            </h3>

            <p>
              When fish move deeper, look
              for the deepest basin areas
              and nearby transitions.
            </p>

            <strong>
              Try: 30–45+ ft
            </strong>

          </div>

        </div>

      </section>


      {/* OFFICIAL MAP */}

      <section style={styles.section}>

        <div style={styles.mapCard}>

          <div style={styles.mapIcon}>
            <Map size={27} />
          </div>

          <div>

            <div style={styles.sectionEyebrow}>
              OFFICIAL RESOURCE
            </div>

            <h2 style={styles.mapTitle}>
              White Iron Depth Map
            </h2>

            <p style={styles.mapText}>
              Open the Minnesota DNR's
              White Iron Lake information
              and depth-map resources.
            </p>

            <a
              href="https://www.dnr.state.mn.us/fisheries/slice/white-iron-lake.html"
              target="_blank"
              rel="noreferrer"
              style={styles.mapButton}
            >
              Open DNR Lake Information
            </a>

          </div>

        </div>

      </section>


      {/* FISH SPECIES */}

      <section style={styles.section}>

        <div style={styles.sectionHeader}>

          <div>
            <div style={styles.sectionEyebrow}>
              WHAT'S IN THE LAKE
            </div>

            <h2 style={styles.sectionTitle}>
              Main Fish
            </h2>
          </div>

          <Fish size={25} />

        </div>


        <div style={styles.fishGrid}>

          <div style={styles.fishCard}>
            <Fish size={20} />
            <strong>Walleye</strong>
          </div>

          <div style={styles.fishCard}>
            <Fish size={20} />
            <strong>Northern Pike</strong>
          </div>

          <div style={styles.fishCard}>
            <Fish size={20} />
            <strong>Yellow Perch</strong>
          </div>

          <div style={styles.fishCard}>
            <Fish size={20} />
            <strong>Crappie</strong>
          </div>

        </div>

      </section>


      <div style={styles.bottomSpace} />

    </main>
  );
}


function DepthRow({
  depth,
  title,
  description,
  level,
}: {
  depth: string;
  title: string;
  description: string;
  level: string;
}) {

  const backgrounds: Record<
    string,
    string
  > = {
    shallow: "#2D8AC5",
    medium: "#216FA8",
    deep: "#165477",
    veryDeep: "#0B344D",
  };

  return (
    <div style={styles.depthRow}>

      <div
        style={{
          ...styles.depthBadge,
          background:
            backgrounds[level],
        }}
      >
        {depth}
      </div>

      <div>

        <h3>
          {title}
        </h3>

        <p>
          {description}
        </p>

      </div>

    </div>
  );
}


const styles: Record<
  string,
  React.CSSProperties
> = {

  page: {
    minHeight: "100vh",
    background: colors.deepNavy,
    color: colors.loonWhite,
    paddingBottom: "40px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  header: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "17px 20px",
    background:
      "rgba(5,11,16,0.95)",
    borderBottom:
      "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(15px)",
  },

  backButton: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    border:
      "1px solid rgba(255,255,255,0.12)",
    background: "#102532",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  headerEyebrow: {
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "2px",
    color: colors.sunYellow,
  },

  headerTitle: {
    margin: "3px 0 0",
    fontSize: "21px",
    fontWeight: 900,
  },

  hero: {
    position: "relative",
    minHeight: "285px",
    overflow: "hidden",
    background:
      "linear-gradient(135deg,#164F70,#071827)",
  },

  heroOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg,rgba(0,0,0,0.05),rgba(3,12,18,0.9))",
  },

  heroContent: {
    position: "relative",
    zIndex: 2,
    maxWidth: "900px",
    margin: "0 auto",
    padding: "35px 22px",
  },

  heroIcon: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    background: colors.sunYellow,
    color: colors.deepNavy,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "20px",
  },

  heroEyebrow: {
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "2.5px",
    color: colors.sunYellow,
  },

  heroTitle: {
    margin: "7px 0 0",
    fontSize: "38px",
    fontWeight: 900,
  },

  heroText: {
    maxWidth: "400px",
    margin: "10px 0 0",
    fontSize: "14px",
    lineHeight: 1.6,
    color:
      "rgba(255,255,255,0.68)",
  },

  section: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "27px 22px 0",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "15px",
  },

  sectionEyebrow: {
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "2.5px",
    color: colors.sunYellow,
  },

  sectionTitle: {
    margin: "5px 0 0",
    fontSize: "27px",
    fontWeight: 900,
  },

  card: {
    padding: "25px",
    borderRadius: "19px",
    background: "#0B202D",
    color:
      "rgba(255,255,255,0.6)",
  },

  weatherCard: {
    padding: "20px",
    borderRadius: "21px",
    background:
      "linear-gradient(145deg,#102D3D,#091A25)",
    border:
      "1px solid rgba(255,255,255,0.09)",
  },

  weatherTop: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },

  weatherIcon: {
    width: "62px",
    height: "62px",
    borderRadius: "17px",
    background: "#16384A",
    color: colors.sunYellow,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  temperature: {
    fontSize: "43px",
    fontWeight: 900,
    lineHeight: 1,
  },

  weatherDescription: {
    marginTop: "5px",
    color:
      "rgba(255,255,255,0.6)",
    fontSize: "14px",
  },

  weatherGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2,1fr)",
    gap: "10px",
    marginTop: "20px",
  },

  weatherStat: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "13px",
    borderRadius: "13px",
    background:
      "rgba(255,255,255,0.05)",
  },

  weatherStatLabel: {
    fontSize: "10px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2,1fr)",
    gap: "10px",
  },

  statCard: {
    padding: "19px",
    borderRadius: "18px",
    background: "#0B202D",
    border:
      "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  depthCard: {
    overflow: "hidden",
    borderRadius: "20px",
    background: "#0B202D",
    border:
      "1px solid rgba(255,255,255,0.07)",
  },

  depthRow: {
    display: "flex",
    gap: "15px",
    padding: "17px",
    borderBottom:
      "1px solid rgba(255,255,255,0.06)",
  },

  depthBadge: {
    width: "70px",
    minWidth: "70px",
    height: "49px",
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 900,
  },

  note: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    marginTop: "10px",
    color:
      "rgba(255,255,255,0.42)",
    fontSize: "11px",
    lineHeight: 1.5,
  },

  spotCard: {
    display: "flex",
    gap: "15px",
    padding: "18px",
    marginBottom: "10px",
    borderRadius: "18px",
    background: "#0B202D",
    border:
      "1px solid rgba(255,255,255,0.07)",
  },

  spotNumber: {
    width: "43px",
    height: "43px",
    minWidth: "43px",
    borderRadius: "13px",
    background: colors.sunYellow,
    color: colors.deepNavy,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 900,
  },

  mapCard: {
    display: "flex",
    gap: "15px",
    padding: "20px",
    borderRadius: "20px",
    background:
      "linear-gradient(145deg,#102D3D,#091A25)",
    border:
      "1px solid rgba(255,255,255,0.08)",
  },

  mapIcon: {
    width: "52px",
    height: "52px",
    minWidth: "52px",
    borderRadius: "15px",
    background: colors.sunYellow,
    color: colors.deepNavy,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  mapTitle: {
    margin: "6px 0 7px",
    fontSize: "20px",
    fontWeight: 900,
  },

  mapText: {
    margin: "0 0 15px",
    color:
      "rgba(255,255,255,0.62)",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  mapButton: {
    display: "inline-block",
    padding: "11px 14px",
    borderRadius: "11px",
    background: colors.sunYellow,
    color: colors.deepNavy,
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: 900,
  },

  fishGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2,1fr)",
    gap: "10px",
  },

  fishCard: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "16px",
    borderRadius: "16px",
    background: "#0B202D",
    color: colors.sunYellow,
  },

  bottomSpace: {
    height: "30px",
  },
};
