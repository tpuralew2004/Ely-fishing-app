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

export default function Home() {
  const [catches, setCatches] = useState<Catch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPost, setShowPost] = useState(false);
  const [posting, setPosting] = useState(false);

  const [name, setName] = useState("");
  const [fishSpecies, setFishSpecies] = useState("");
  const [length, setLength] = useState("");
  const [weight, setWeight] = useState("");
  const [lake, setLake] = useState("White Iron Lake");
  const [caption, setCaption] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

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

  useEffect(() => {
    loadCatches();
  }, []);

  async function postCatch() {
    if (!name || !fishSpecies || !length || !lake) {
      alert("Please enter your name, fish species, length, and lake.");
      return;
    }

    setPosting(true);

    try {
      let imageUrl: string | null = null;

      if (photo) {
        const extension = photo.name.split(".").pop() || "jpg";
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${extension}`;

        const filePath = `private/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("catch-photos")
          .upload(filePath, photo);

        if (uploadError) {
          throw uploadError;
        }

        const { data: signedData, error: signedError } =
          await supabase.storage
            .from("catch-photos")
            .createSignedUrl(filePath, 60 * 60 * 24 * 365);

        if (signedError) {
          throw signedError;
        }

        imageUrl = signedData.signedUrl;
      }

      const { error } = await supabase.from("catches").insert({
        name,
        fish_species: fishSpecies,
        length: Number(length),
        weight: weight ? Number(weight) : null,
        lake,
        caption: caption || null,
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
      alert("Something went wrong posting the catch.");
    }

    setPosting(false);
  }

  return (
    <main style={styles.page}>
      {/* HEADER */}
      <header style={styles.hero}>
        <div style={styles.heroOverlay} />

        <div style={styles.heroContent}>
          <div style={styles.topRow}>
            <div>
              <div style={styles.eyebrow}>FAMILY FISHING TRIP</div>

              <h1 style={styles.title}>Ely Fishing</h1>

              <p style={styles.subtitle}>
                White Iron Lake • Minnesota
              </p>
            </div>

            <div style={styles.fishIcon}>
              <Fish size={27} />
            </div>
          </div>

          {/* LAKE CARD */}
          <div style={styles.lakeCard}>
            <div style={styles.lakeIcon}>
              <MapPin size={23} />
            </div>

            <div>
              <div style={styles.lakeName}>White Iron Lake</div>
              <div style={styles.lakeLocation}>Ely, Minnesota</div>
            </div>
          </div>

          {/* POST BUTTON */}
          <button
            onClick={() => setShowPost(true)}
            style={styles.postButton}
          >
            <Plus size={21} />
            Post a Catch
          </button>
        </div>
      </header>

      {/* MAIN FEED */}
      <section style={styles.content}>
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionEyebrow}>THE CATCH BOARD</div>
            <h2 style={styles.sectionTitle}>Recent Catches</h2>
          </div>

          <Fish size={27} color="#6f927f" />
        </div>

        {/* LOADING */}
        {loading && (
          <div style={styles.emptyCard}>
            <Fish size={34} color="#7fc69b" />
            <h3 style={styles.emptyTitle}>Loading catches...</h3>
          </div>
        )}

        {/* NO CATCHES */}
        {!loading && catches.length === 0 && (
          <div style={styles.emptyCard}>
            <Fish size={38} color="#7fc69b" />

            <h3 style={styles.emptyTitle}>
              No catches yet
            </h3>

            <p style={styles.emptyText}>
              Be the first person to post a fish!
            </p>
          </div>
        )}

        {/* CATCHES */}
        {!loading && catches.length > 0 && (
          <div>
            {catches.map((item) => (
              <article key={item.id} style={styles.catchCard}>
                {/* PHOTO */}
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.fish_species}
                    style={styles.catchImage}
                  />
                )}

                {/* CATCH INFO */}
                <div style={styles.catchBody}>
                  <div style={styles.catchTop}>
                    <div>
                      <div style={styles.catchName}>
                        {item.name}
                      </div>

                      <h3 style={styles.fishName}>
                        {item.fish_species}
                      </h3>
                    </div>

                    <div style={styles.smallFishIcon}>
                      <Fish size={20} />
                    </div>
                  </div>

                  {/* STATS */}
                  <div style={styles.statsRow}>
                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>LENGTH</div>
                      <div style={styles.statValue}>
                        {item.length}""
                      </div>
                    </div>

                    {item.weight !== null && (
                      <div style={styles.statBox}>
                        <div style={styles.statLabel}>WEIGHT</div>
                        <div style={styles.statValue}>
                          {item.weight} lbs
                        </div>
                      </div>
                    )}

                    <div style={styles.statBox}>
                      <div style={styles.statLabel}>LAKE</div>
                      <div style={styles.statValueSmall}>
                        {item.lake}
                      </div>
                    </div>
                  </div>

                  {/* CAPTION */}
                  {item.caption && (
                    <p style={styles.caption}>
                      {item.caption}
                    </p>
                  )}

                  {/* SOCIAL */}
                  <div style={styles.socialRow}>
                    <button style={styles.socialButton}>
                      <Heart size={18} />
                      Like
                    </button>

                    <button style={styles.socialButton}>
                      <MessageCircle size={18} />
                      Comment
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* TRIP STATS */}
        <div style={styles.tripCard}>
          <div style={styles.tripHeader}>
            <Trophy size={23} color="#e8c96b" />

            <h2 style={styles.tripTitle}>
              Trip Stats
            </h2>
          </div>

          <div style={styles.tripStats}>
            <div style={styles.tripStat}>
              <div style={styles.tripNumber}>
                {catches.length}
              </div>

              <div style={styles.tripLabel}>
                CATCHES
              </div>
            </div>

            <div style={styles.tripStat}>
              <div style={styles.tripNumber}>
                {new Set(catches.map((c) => c.name)).size}
              </div>

              <div style={styles.tripLabel}>
                FISHERMEN
              </div>
            </div>

            <div style={styles.tripStat}>
              <div style={styles.trophy}>
                🏆
              </div>

              <div style={styles.tripLabel}>
                LEADERBOARD
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM NAV */}
      <nav style={styles.bottomNav}>
        <button style={styles.navButtonActive}>
          <Fish size={21} />
          <span>Feed</span>
        </button>

        <button style={styles.navButton}>
          <MapPin size={21} />
          <span>Fishing</span>
        </button>

        <button style={styles.navButton}>
          <Trophy size={21} />
          <span>Leaders</span>
        </button>

        <button style={styles.navButton}>
          <Users size={21} />
          <span>Family</span>
        </button>
      </nav>

      {/* POST MODAL */}
      {showPost && (
        <div style={styles.modalBackground}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.sectionEyebrow}>
                  NEW CATCH
                </div>

                <h2 style={styles.modalTitle}>
                  Post Your Fish
                </h2>
              </div>

              <button
                onClick={() => setShowPost(false)}
                style={styles.closeButton}
              >
                <X size={21} />
              </button>
            </div>

            <div style={styles.form}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={styles.input}
              />

              <input
                value={fishSpecies}
                onChange={(e) =>
                  setFishSpecies(e.target.value)
                }
                placeholder="Fish species"
                style={styles.input}
              />

              <div style={styles.twoInputs}>
                <input
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="Length (in)"
                  type="number"
                  style={styles.input}
                />

                <input
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Weight (lbs)"
                  type="number"
                  style={styles.input}
                />
              </div>

              <input
                value={lake}
                onChange={(e) => setLake(e.target.value)}
                placeholder="Lake"
                style={styles.input}
              />

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Tell the family about the catch..."
                rows={3}
                style={{
                  ...styles.input,
                  resize: "none",
                }}
              />

              <label style={styles.photoButton}>
                <Camera size={20} />

                <span>
                  {photo
                    ? photo.name
                    : "Add a photo"}
                </span>

                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) =>
                    setPhoto(
                      e.target.files?.[0] || null
                    )
                  }
                />
              </label>

              <button
                onClick={postCatch}
                disabled={posting}
                style={{
                  ...styles.submitButton,
                  opacity: posting ? 0.6 : 1,
                }}
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

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#071914",
    color: "#ffffff",
    paddingBottom: "85px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    background:
      "linear-gradient(145deg, #164637 0%, #0d3025 45%, #071914 100%)",
    borderBottom:
      "1px solid rgba(255,255,255,0.08)",
  },

  heroOverlay: {
    position: "absolute",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background:
      "rgba(54, 150, 112, 0.12)",
    filter: "blur(70px)",
    top: "-200px",
    right: "-120px",
  },

  heroContent: {
    position: "relative",
    maxWidth: "700px",
    margin: "0 auto",
    padding: "42px 20px 30px",
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  eyebrow: {
    color: "#7fd19e",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "2px",
    marginBottom: "7px",
  },

  title: {
    margin: 0,
    fontSize: "42px",
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: "-1.5px",
  },

  subtitle: {
    marginTop: "10px",
    marginBottom: 0,
    color: "rgba(255,255,255,0.6)",
    fontSize: "14px",
  },

  fishIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(255,255,255,0.08)",
    border:
      "1px solid rgba(255,255,255,0.1)",
    color: "#91d6aa",
  },

  lakeCard: {
    marginTop: "28px",
    padding: "16px",
    borderRadius: "18px",
    display: "flex",
    alignItems: "center",
    gap: "13px",
    background:
      "rgba(255,255,255,0.07)",
    border:
      "1px solid rgba(255,255,255,0.1)",
  },

  lakeIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#74c995",
    color: "#082016",
  },

  lakeName: {
    fontWeight: 800,
    fontSize: "16px",
  },

  lakeLocation: {
    marginTop: "3px",
    color: "rgba(255,255,255,0.5)",
    fontSize: "13px",
  },

  postButton: {
    width: "100%",
    marginTop: "14px",
    border: "none",
    borderRadius: "16px",
    padding: "16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    background: "#79d39a",
    color: "#071914",
    fontSize: "16px",
    fontWeight: 900,
    cursor: "pointer",
  },

  content: {
    maxWidth: "700px",
    margin: "0 auto",
    padding: "25px 20px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "16px",
  },

  sectionEyebrow: {
    color: "#78ce98",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "2px",
  },

  sectionTitle: {
    margin: "5px 0 0",
    fontSize: "27px",
    fontWeight: 900,
    letterSpacing: "-0.5px",
  },

  emptyCard: {
    padding: "45px 20px",
    borderRadius: "22px",
    textAlign: "center",
    background: "#0d2920",
    border:
      "1px solid rgba(255,255,255,0.08)",
  },

  emptyTitle: {
    margin: "12px 0 5px",
    fontSize: "18px",
  },

  emptyText: {
    margin: 0,
    color: "rgba(255,255,255,0.5)",
    fontSize: "14px",
  },

  catchCard: {
    overflow: "hidden",
    marginBottom: "18px",
    borderRadius: "22px",
    background: "#0d2920",
    border:
      "1px solid rgba(255,255,255,0.08)",
    boxShadow:
      "0 12px 30px rgba(0,0,0,0.2)",
  },

  catchImage: {
    width: "100%",
    height: "280px",
    objectFit: "cover",
    display: "block",
  },

  catchBody: {
    padding: "19px",
  },

  catchTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  catchName: {
    color: "#7fd19e",
    fontSize: "13px",
    fontWeight: 700,
  },

  fishName: {
    margin: "4px 0 0",
    fontSize: "27px",
    fontWeight: 900,
  },

  smallFishIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(121,211,154,0.1)",
    color: "#79d39a",
  },

  statsRow: {
    display: "flex",
    gap: "8px",
    marginTop: "16px",
    overflow: "hidden",
  },

  statBox: {
    flex: 1,
    minWidth: 0,
    padding: "11px",
    borderRadius: "12px",
    background: "rgba(0,0,0,0.18)",
  },

  statLabel: {
    fontSize: "9px",
    fontWeight: 800,
    color: "rgba(255,255,255,0.38)",
    letterSpacing: "1px",
  },

  statValue: {
    marginTop: "4px",
    fontWeight: 800,
    fontSize: "15px",
  },

  statValueSmall: {
    marginTop: "4px",
    fontWeight: 700,
    fontSize: "12px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  caption: {
    margin: "16px 0 0",
    color: "rgba(255,255,255,0.62)",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  socialRow: {
    display: "flex",
    gap: "20px",
    marginTop: "17px",
    paddingTop: "14px",
    borderTop:
      "1px solid rgba(255,255,255,0.08)",
  },

  socialButton: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    border: "none",
    background: "none",
    color: "rgba(255,255,255,0.45)",
    fontSize: "13px",
    cursor: "pointer",
    padding: 0,
  },

  tripCard: {
    marginTop: "28px",
    padding: "20px",
    borderRadius: "22px",
    background:
      "linear-gradient(145deg, #123d2e, #0c261e)",
    border:
      "1px solid rgba(255,255,255,0.08)",
  },

  tripHeader: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  tripTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 900,
  },

  tripStats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: "8px",
    marginTop: "18px",
  },

  tripStat: {
    padding: "14px 8px",
    borderRadius: "14px",
    textAlign: "center",
    background:
      "rgba(0,0,0,0.18)",
  },

  tripNumber: {
    fontSize: "24px",
    fontWeight: 900,
  },

  trophy: {
    fontSize: "24px",
    height: "29px",
  },

  tripLabel: {
    marginTop: "4px",
    fontSize: "9px",
    color: "rgba(255,255,255,0.4)",
    fontWeight: 800,
    letterSpacing: "0.8px",
  },

  bottomNav: {
    position: "fixed",
    zIndex: 50,
    bottom: 0,
    left: 0,
    right: 0,
    height: "72px",
    display: "flex",
    justifyContent: "center",
    gap: "35px",
    alignItems: "center",
    background:
      "rgba(5,20,15,0.97)",
    borderTop:
      "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(12px)",
  },

  navButton: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    border: "none",
    background: "none",
    color: "rgba(255,255,255,0.35)",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  navButtonActive: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    border: "none",
    background: "none",
    color: "#79d39a",
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  modalBackground: {
    position: "fixed",
    zIndex: 100,
    inset: 0,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    background:
      "rgba(0,0,0,0.72)",
    padding: 0,
  },

  modal: {
    width: "100%",
    maxWidth: "700px",
    maxHeight: "92vh",
    overflowY: "auto",
    padding: "24px 20px 30px",
    borderRadius:
      "25px 25px 0 0",
    background: "#0c271f",
    border:
      "1px solid rgba(255,255,255,0.1)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
  },

  modalTitle: {
    margin: "5px 0 0",
    fontSize: "25px",
    fontWeight: 900,
  },

  closeButton: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "none",
    background:
      "rgba(255,255,255,0.08)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "11px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: "13px",
    border:
      "1px solid rgba(255,255,255,0.1)",
    background: "#071914",
    color: "#fff",
    padding: "14px",
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
    minHeight: "54px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    borderRadius: "13px",
    border:
      "1px dashed rgba(121,211,154,0.4)",
    background:
      "rgba(121,211,154,0.05)",
    color: "#79d39a",
    padding: "10px",
    fontSize: "13px",
    cursor: "pointer",
    overflow: "hidden",
  },

  submitButton: {
    border: "none",
    borderRadius: "13px",
    padding: "15px",
    background: "#79d39a",
    color: "#071914",
    fontSize: "15px",
    fontWeight: 900,
    cursor: "pointer",
  },
};
