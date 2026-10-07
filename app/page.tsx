"use client";

import { useEffect, useState } from "react";
import {
  Camera,
  Fish,
  Trophy,
  MapPin,
  Users,
  Heart,
  MessageCircle,
  X,
  Plus,
  Waves,
} from "lucide-react";
import { supabase } from "./lib/supabase";

type Catch = {
  id: number;
  name: string;
  fish_species: string;
  length: number;
  weight: number | null;
  lake: string;
  caption: string | null;
  image_url: string | null;
  created_at: string;
};

const colors = {
  navy: "#071827",
  deepNavy: "#050B10",
  lakeBlue: "#1E78B7",
  sunsetOrange: "#FF7043",
  sunYellow: "#FFC83D",
  loonWhite: "#F5F7F7",
};

const FAMILY_CODE = "Nofireplease123";
const ACCESS_KEY = "ely-fishing-family-access";

export default function Home() {
  const [catches, setCatches] = useState<Catch[]>([]);
  const [loading, setLoading] = useState(true);

  const [accessGranted, setAccessGranted] = useState(false);
  const [familyCode, setFamilyCode] = useState("");
  const [codeError, setCodeError] = useState("");

  const [showPost, setShowPost] = useState(false);
  const [posting, setPosting] = useState(false);

  const [name, setName] = useState("");
  const [fishSpecies, setFishSpecies] = useState("");
  const [length, setLength] = useState("");
  const [weight, setWeight] = useState("");
  const [lake, setLake] = useState("White Iron Lake");
  const [caption, setCaption] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  useEffect(() => {
    const hasAccess =
      localStorage.getItem(ACCESS_KEY) === "granted";

    if (hasAccess) {
      setAccessGranted(true);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accessGranted) {
      loadCatches();
    }
  }, [accessGranted]);

  async function loadCatches() {
    setLoading(true);

    const { data, error } = await supabase
      .from("catches")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCatches(data);
    }

    setLoading(false);
  }

  function unlockSite() {
    if (familyCode.trim() === FAMILY_CODE) {
      localStorage.setItem(
        ACCESS_KEY,
        "granted"
      );

      setAccessGranted(true);
      setCodeError("");
    } else {
      setCodeError(
        "That family code is incorrect."
      );
    }
  }

  async function postCatch() {
    if (
      !name ||
      !fishSpecies ||
      !length ||
      !lake
    ) {
      alert(
        "Please enter your name, fish species, length, and lake."
      );
      return;
    }

    setPosting(true);

    try {
      let imageUrl: string | null = null;

      if (photo) {
        const extension =
          photo.name.split(".").pop() || "jpg";

        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${extension}`;

        const filePath = `private/${fileName}`;

        const { error: uploadError } =
          await supabase.storage
            .from("catch-photos")
            .upload(filePath, photo);

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: signedData,
          error: signedError,
        } = await supabase.storage
          .from("catch-photos")
          .createSignedUrl(
            filePath,
            60 * 60 * 24 * 365
          );

        if (signedError) {
          throw signedError;
        }

        imageUrl =
          signedData.signedUrl;
      }

      const { error } =
        await supabase
          .from("catches")
          .insert({
            name,
            fish_species: fishSpecies,
            length: Number(length),
            weight: weight
              ? Number(weight)
              : null,
            lake,
            caption:
              caption || null,
            image_url: imageUrl,
          });

      if (error) {
        throw error;
      }

      setName("");
      setFishSpecies("");
      setLength("");
      setWeight("");
      setLake("White Iron Lake");
      setCaption("");
      setPhoto(null);
      setShowPost(false);

      await loadCatches();
    } catch (error) {
      console.error(error);
      alert(
        "Something went wrong posting the catch."
      );
    }

    setPosting(false);
  }

  /* =========================
     FAMILY LOGIN
  ========================= */

  if (!accessGranted) {
    return (
      <main style={styles.accessPage}>
        <div style={styles.accessCard}>
          <div style={styles.accessLogoWrap}>
            <img
              src="/loon-logo.png.png"
              alt="Ely Fishing loon logo"
              style={styles.accessLogo}
            />
          </div>

          <div style={styles.accessEyebrow}>
            ELY FISHING
          </div>

          <h1 style={styles.accessTitle}>
            Family Access
          </h1>

          <p style={styles.accessText}>
            This fishing board is for the family.
          </p>

          <input
            type="password"
            value={familyCode}
            onChange={(e) => {
              setFamilyCode(e.target.value);
              setCodeError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                unlockSite();
              }
            }}
            placeholder="Enter family code"
            style={styles.accessInput}
          />

          {codeError && (
            <p style={styles.accessError}>
              {codeError}
            </p>
          )}

          <button
            onClick={unlockSite}
            style={styles.accessButton}
          >
            Enter Family Site
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>

      {/* =========================
          HERO
      ========================= */}

      <section style={styles.hero}>
        <div style={styles.heroImage} />
        <div style={styles.heroDark} />

        <div style={styles.heroContent}>

          {/* BIG CENTERED LOGO */}

          <div style={styles.centerLogoArea}>
            <div style={styles.logoGlow} />

            <img
              src="/loon-logo.png.png"
              alt="Ely Fishing loon logo"
              style={styles.heroLogo}
            />
          </div>

          <div style={styles.heroEyebrow}>
            FAMILY FISHING TRIP
          </div>

          <h1 style={styles.title}>
            Ely Fishing
          </h1>

          <p style={styles.subtitle}>
            White Iron Lake • Ely, Minnesota
          </p>

          <div style={styles.heroDivider}>
            <span />
            <Waves size={18} />
            <span />
          </div>

          {/* LOCATION */}

          <div style={styles.locationCard}>
            <div style={styles.locationIcon}>
              <MapPin size={25} />
            </div>

            <div style={styles.locationText}>
              <div style={styles.locationLabel}>
                FISHING SPOT
              </div>

              <div style={styles.locationTitle}>
                White Iron Lake
              </div>

              <div style={styles.locationSub}>
                Ely, Minnesota
              </div>
            </div>
          </div>

          {/* POST BUTTON */}

          <button
            onClick={() =>
              setShowPost(true)
            }
            style={styles.postButton}
          >
            <Plus size={23} />
            Post a Catch
          </button>

        </div>
      </section>

      {/* =========================
          CATCH BOARD
      ========================= */}

      <section style={styles.feed}>

        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionEyebrow}>
              THE CATCH BOARD
            </div>

            <h2 style={styles.sectionTitle}>
              Recent Catches
            </h2>
          </div>

          <div style={styles.sectionFishIcon}>
            <Fish size={25} />
          </div>
        </div>

        {loading && (
          <div style={styles.loadingCard}>
            Loading catches...
          </div>
        )}

        {!loading &&
          catches.length === 0 && (
            <div style={styles.emptyCard}>
              <Fish
                size={42}
                color={colors.sunYellow}
              />

              <h3>
                No catches yet
              </h3>

              <p>
                Be the first person to post a fish!
              </p>
            </div>
          )}

        {!loading &&
          catches.map((item) => (
            <article
              key={item.id}
              style={styles.catchCard}
            >

              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.fish_species}
                  style={styles.catchImage}
                />
              )}

              <div style={styles.catchContent}>

                <div style={styles.catchHeader}>

                  <div>
                    <div
                      style={
                        styles.catchPerson
                      }
                    >
                      {item.name}
                    </div>

                    <h3
                      style={
                        styles.fishName
                      }
                    >
                      {item.fish_species}
                    </h3>
                  </div>

                  <Fish
                    size={23}
                    color={
                      colors.sunYellow
                    }
                  />
                </div>

                <div
                  style={
                    styles.catchStats
                  }
                >

                  <div>
                    <span>
                      LENGTH
                    </span>

                    <strong>
                      {item.length}"
                    </strong>
                  </div>

                  {item.weight !==
                    null && (
                    <div>
                      <span>
                        WEIGHT
                      </span>

                      <strong>
                        {item.weight} lbs
                      </strong>
                    </div>
                  )}

                  <div>
                    <span>
                      LAKE
                    </span>

                    <strong
                      style={
                        styles.lakeStat
                      }
                    >
                      {item.lake}
                    </strong>
                  </div>

                </div>

                {item.caption && (
                  <p
                    style={
                      styles.caption
                    }
                  >
                    {item.caption}
                  </p>
                )}

                <div
                  style={
                    styles.social
                  }
                >

                  <button
                    style={
                      styles.socialButton
                    }
                  >
                    <Heart size={18} />
                    Like
                  </button>

                  <button
                    style={
                      styles.socialButton
                    }
                  >
                    <MessageCircle
                      size={18}
                    />
                    Comment
                  </button>

                  <span
                    style={styles.time}
                  >
                    Just now
                  </span>

                </div>

              </div>
            </article>
          ))}

        {/* =========================
            TRIP STATS
        ========================= */}

        <div style={styles.tripCard}>

          <div style={styles.tripHeader}>
            <Trophy
              size={25}
              color={colors.sunYellow}
            />

            <h2>
              Trip Stats
            </h2>
          </div>

          <div style={styles.tripStats}>

            <div>
              <strong>
                {catches.length}
              </strong>

              <span>
                CATCHES
              </span>
            </div>

            <div>
              <strong>
                {
                  new Set(
                    catches.map(
                      (c) => c.name
                    )
                  ).size
                }
              </strong>

              <span>
                FISHERMEN
              </span>
            </div>

            <div>
              <strong>
                🏆
              </strong>

              <span>
                LEADERBOARD
              </span>
            </div>

          </div>
        </div>

      </section>

      {/* =========================
          BOTTOM NAV
      ========================= */}

      <nav style={styles.nav}>

        <button
          style={styles.navActive}
        >
          <Fish size={22} />
          Feed
        </button>

        <button
          style={styles.navItem}
        >
          <MapPin size={22} />
          Fishing
        </button>

        <button
          style={styles.navItem}
        >
          <Trophy size={22} />
          Leaders
        </button>

        <button
          style={styles.navItem}
        >
          <Users size={22} />
          Family
        </button>

      </nav>

      {/* =========================
          POST MODAL
      ========================= */}

      {showPost && (
        <div
          style={
            styles.modalBackground
          }
        >

          <div style={styles.modal}>

            <div
              style={
                styles.modalHeader
              }
            >

              <div>
                <div
                  style={
                    styles.sectionEyebrow
                  }
                >
                  NEW CATCH
                </div>

                <h2>
                  Post Your Fish
                </h2>
              </div>

              <button
                onClick={() =>
                  setShowPost(false)
                }
                style={
                  styles.closeButton
                }
              >
                <X size={21} />
              </button>

            </div>

            <div style={styles.form}>

              <input
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                placeholder="Your name"
                style={styles.input}
              />

              <input
                value={fishSpecies}
                onChange={(e) =>
                  setFishSpecies(
                    e.target.value
                  )
                }
                placeholder="Fish species"
                style={styles.input}
              />

              <div
                style={
                  styles.twoInputs
                }
              >

                <input
                  value={length}
                  onChange={(e) =>
                    setLength(
                      e.target.value
                    )
                  }
                  placeholder="Length (in)"
                  type="number"
                  style={styles.input}
                />

                <input
                  value={weight}
                  onChange={(e) =>
                    setWeight(
                      e.target.value
                    )
                  }
                  placeholder="Weight (lbs)"
                  type="number"
                  style={styles.input}
                />

              </div>

              <input
                value={lake}
                onChange={(e) =>
                  setLake(
                    e.target.value
                  )
                }
                placeholder="Lake"
                style={styles.input}
              />

              <textarea
                value={caption}
                onChange={(e) =>
                  setCaption(
                    e.target.value
                  )
                }
                placeholder="Tell the family about the catch..."
                rows={3}
                style={{
                  ...styles.input,
                  resize: "none",
                }}
              />

              <label
                style={
                  styles.photoButton
                }
              >
                <Camera size={20} />

                {photo
                  ? photo.name
                  : "Add a photo"}

                <input
                  type="file"
                  accept="image/*"
                  style={{
                    display: "none",
                  }}
                  onChange={(e) =>
                    setPhoto(
                      e.target.files?.[0] ||
                        null
                    )
                  }
                />
              </label>

              <button
                onClick={postCatch}
                disabled={posting}
                style={
                  styles.submitButton
                }
              >
                {posting
                  ? "Posting..."
                  : "Post Catch"}
              </button>

            </div>
          </div>

        </div>
      )}

    </main>
  );
}

/* =========================
   STYLES
========================= */

const styles: Record<
  string,
  React.CSSProperties
> = {

  /* =========================
     LOGIN
  ========================= */

  accessPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    boxSizing: "border-box",
    background:
      "linear-gradient(135deg, #050B10 0%, #071827 55%, #12344A 100%)",
    color: colors.loonWhite,
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  accessCard: {
    width: "100%",
    maxWidth: "420px",
    padding: "32px 24px",
    borderRadius: "24px",
    textAlign: "center",
    background:
      "rgba(7,24,39,0.94)",
    border:
      "1px solid rgba(255,255,255,0.13)",
    boxShadow:
      "0 20px 60px rgba(0,0,0,0.35)",
    backdropFilter:
      "blur(16px)",
  },

  accessLogoWrap: {
    width: "110px",
    height: "110px",
    margin: "0 auto 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    background: "transparent",
  },

  accessLogo: {
    width: "105px",
    height: "105px",
    objectFit: "contain",
    display: "block",

    /*
      Removes the black background
      that is baked into the PNG.
    */
    mixBlendMode: "screen",
  },

  accessEyebrow: {
    color: colors.sunYellow,
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "3px",
  },

  accessTitle: {
    margin: "8px 0",
    fontSize: "32px",
    fontWeight: 900,
  },

  accessText: {
    margin: "0 0 22px",
    color:
      "rgba(255,255,255,0.65)",
    fontSize: "14px",
  },

  accessInput: {
    boxSizing: "border-box",
    width: "100%",
    padding: "15px",
    borderRadius: "13px",
    border:
      "1px solid rgba(255,255,255,0.12)",
    background:
      colors.deepNavy,
    color:
      colors.loonWhite,
    fontSize: "16px",
    outline: "none",
    marginBottom: "10px",
  },

  accessError: {
    margin: "0 0 10px",
    color: "#FF8A80",
    fontSize: "13px",
  },

  accessButton: {
    width: "100%",
    padding: "15px",
    border: "none",
    borderRadius: "13px",
    background:
      colors.sunsetOrange,
    color:
      colors.loonWhite,
    fontSize: "15px",
    fontWeight: 900,
    cursor: "pointer",
  },

  /* =========================
     MAIN PAGE
  ========================= */

  page: {
    minHeight: "100vh",
    background:
      colors.deepNavy,
    color:
      colors.loonWhite,
    paddingBottom: "90px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  /* =========================
     HERO
  ========================= */

  hero: {
    position: "relative",
    minHeight: "650px",
    overflow: "hidden",
  },

  heroImage: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "url('/minnesota-sunset.jpg.png')",
    backgroundSize: "cover",
    backgroundPosition:
      "center",
  },

  heroDark: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to bottom, rgba(3,12,16,0.08) 0%, rgba(3,12,16,0.18) 42%, rgba(3,12,16,0.82) 100%)",
  },

  heroContent: {
    position: "relative",
    maxWidth: "900px",
    minHeight: "650px",
    margin: "0 auto",
    padding: "34px 22px 45px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },

  /*
    This is the new centered logo area.
  */

  centerLogoArea: {
    position: "relative",
    width: "220px",
    height: "220px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin:
      "0 auto 8px",
  },

  logoGlow: {
    position: "absolute",
    width: "190px",
    height: "190px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(255,200,61,0.25) 0%, rgba(255,112,67,0.12) 45%, transparent 72%)",
    filter: "blur(4px)",
  },

  /*
    BIG LOGO
    The screen blend removes the black
    square that is built into the PNG.
  */

  heroLogo: {
    position: "relative",
    width: "205px",
    height: "205px",
    objectFit: "contain",
    display: "block",
    mixBlendMode: "screen",
    filter:
      "drop-shadow(0 12px 24px rgba(0,0,0,0.35))",
  },

  heroEyebrow: {
    color:
      colors.sunYellow,
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing: "4px",
    marginTop: "2px",
  },

  title: {
    margin: "8px 0 0",
    fontSize: "58px",
    lineHeight: 0.98,
    fontWeight: 900,
    letterSpacing: "-2.5px",
    textShadow:
      "0 5px 20px rgba(0,0,0,0.4)",
  },

  subtitle: {
    margin: "12px 0 0",
    fontSize: "16px",
    color:
      "rgba(255,255,255,0.82)",
    fontWeight: 600,
  },

  heroDivider: {
    width: "180px",
    margin: "18px auto 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    color:
      colors.sunYellow,
  },

  /* =========================
     LOCATION CARD
  ========================= */

  locationCard: {
    width: "100%",
    boxSizing: "border-box",
    marginTop: "24px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding:
      "17px 19px",
    borderRadius: "20px",
    background:
      "rgba(7,24,39,0.78)",
    border:
      "1px solid rgba(255,255,255,0.18)",
    backdropFilter:
      "blur(15px)",
    boxShadow:
      "0 15px 40px rgba(0,0,0,0.3)",
    textAlign: "left",
  },

  locationIcon: {
    flexShrink: 0,
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      colors.sunYellow,
    color:
      colors.deepNavy,
  },

  locationText: {
    minWidth: 0,
  },

  locationLabel: {
    color:
      colors.sunYellow,
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: "2px",
    marginBottom: "2px",
  },

  locationTitle: {
    fontSize: "19px",
    fontWeight: 900,
  },

  locationSub: {
    marginTop: "3px",
    fontSize: "13px",
    color:
      "rgba(255,255,255,0.65)",
  },

  postButton: {
    width: "100%",
    marginTop: "14px",
    padding: "17px",
    border: "none",
    borderRadius: "17px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    background:
      colors.sunsetOrange,
    color:
      colors.loonWhite,
    fontSize: "17px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow:
      "0 10px 30px rgba(255,112,67,0.28)",
  },

  /* =========================
     FEED
  ========================= */

  feed: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "36px 22px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: "18px",
  },

  sectionEyebrow: {
    color:
      colors.sunYellow,
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "3px",
  },

  sectionTitle: {
    margin: "5px 0 0",
    fontSize: "29px",
    fontWeight: 900,
  },

  sectionFishIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(255,200,61,0.12)",
    color:
      colors.sunYellow,
  },

  loadingCard: {
    padding: "35px",
    textAlign: "center",
    color:
      "rgba(255,255,255,0.5)",
  },

  emptyCard: {
    padding:
      "45px 20px",
    borderRadius: "22px",
    textAlign: "center",
    background:
      "rgba(255,255,255,0.05)",
    border:
      "1px solid rgba(255,255,255,0.1)",
  },

  catchCard: {
    overflow: "hidden",
    marginBottom: "18px",
    borderRadius: "22px",
    background:
      "rgba(7,24,39,0.88)",
    border:
      "1px solid rgba(255,255,255,0.12)",
    boxShadow:
      "0 12px 35px rgba(0,0,0,0.25)",
    backdropFilter:
      "blur(12px)",
  },

  catchImage: {
    width: "100%",
    height: "300px",
    objectFit: "cover",
    display: "block",
  },

  catchContent: {
    padding: "19px",
  },

  catchHeader: {
    display: "flex",
    justifyContent:
      "space-between",
  },

  catchPerson: {
    color:
      colors.sunYellow,
    fontSize: "13px",
    fontWeight: 800,
  },

  fishName: {
    margin: "3px 0 0",
    fontSize: "27px",
    fontWeight: 900,
  },

  catchStats: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr 1.5fr",
    marginTop: "17px",
    padding: "13px 0",
    borderTop:
      "1px solid rgba(255,255,255,0.08)",
    borderBottom:
      "1px solid rgba(255,255,255,0.08)",
  },

  lakeStat: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow:
      "ellipsis",
  },

  caption: {
    margin:
      "15px 0 0",
    color:
      "rgba(255,255,255,0.68)",
    lineHeight: 1.6,
    fontSize: "14px",
  },

  social: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    marginTop: "15px",
  },

  socialButton: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    border: "none",
    background:
      "transparent",
    color:
      "rgba(255,255,255,0.5)",
    cursor: "pointer",
  },

  time: {
    marginLeft: "auto",
    color:
      "rgba(255,255,255,0.35)",
    fontSize: "12px",
  },

  /* =========================
     TRIP STATS
  ========================= */

  tripCard: {
    marginTop: "30px",
    padding: "22px",
    borderRadius: "23px",
    background:
      "linear-gradient(145deg, rgba(30,120,183,0.20), rgba(5,11,16,0.92))",
    border:
      "1px solid rgba(255,255,255,0.13)",
    backdropFilter:
      "blur(12px)",
  },

  tripHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  tripStats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3,1fr)",
    marginTop: "22px",
    textAlign: "center",
  },

  /* =========================
     BOTTOM NAV
  ========================= */

  nav: {
    position: "fixed",
    zIndex: 80,
    bottom: 0,
    left: 0,
    right: 0,
    height: "74px",
    display: "flex",
    justifyContent:
      "center",
    alignItems: "center",
    gap: "28px",
    background:
      "rgba(5,11,16,0.96)",
    borderTop:
      "1px solid rgba(255,255,255,0.12)",
    backdropFilter:
      "blur(18px)",
  },

  navActive: {
    border: "none",
    background:
      "transparent",
    color:
      colors.sunYellow,
    display: "flex",
    flexDirection:
      "column",
    alignItems:
      "center",
    gap: "4px",
    fontWeight: 800,
  },

  navItem: {
    border: "none",
    background:
      "transparent",
    color:
      "rgba(255,255,255,0.4)",
    display: "flex",
    flexDirection:
      "column",
    alignItems:
      "center",
    gap: "4px",
    fontWeight: 700,
  },

  /* =========================
     POST MODAL
  ========================= */

  modalBackground: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "flex-end",
    justifyContent:
      "center",
    background:
      "rgba(0,0,0,0.75)",
  },

  modal: {
    width: "100%",
    maxWidth: "700px",
    maxHeight: "92vh",
    overflowY: "auto",
    padding:
      "24px 20px 30px",
    borderRadius:
      "25px 25px 0 0",
    background:
      colors.navy,
    border:
      "1px solid rgba(255,255,255,0.13)",
  },

  modalHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    marginBottom:
      "20px",
  },

  closeButton: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "none",
    background:
      "rgba(255,255,255,0.08)",
    color: "#fff",
  },

  form: {
    display: "flex",
    flexDirection:
      "column",
    gap: "11px",
  },

  input: {
    boxSizing: "border-box",
    width: "100%",
    padding: "14px",
    borderRadius: "13px",
    border:
      "1px solid rgba(255,255,255,0.1)",
    background:
      colors.deepNavy,
    color:
      colors.loonWhite,
    fontSize: "15px",
    outline: "none",
  },

  twoInputs: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "10px",
  },

  photoButton: {
    minHeight: "52px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    gap: "8px",
    borderRadius: "13px",
    border:
      "1px dashed rgba(255,112,67,0.55)",
    color:
      colors.sunYellow,
    cursor: "pointer",
  },

  submitButton: {
    padding: "15px",
    border: "none",
    borderRadius: "13px",
    background:
      colors.sunsetOrange,
    color:
      colors.loonWhite,
    fontSize: "15px",
    fontWeight: 900,
    cursor: "pointer",
  },
};
