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
  id: string;
  name: string;
  fish: string;
  length: string;
  weight: string;
  lake: string;
  caption: string;
  image_url: string | null;
  created_at: string;
};

const colors = {
  navy: "#071827",
  deepNavy: "#050B10",
  lakeBlue: "#1E78B7",
  sunsetOrange: "#FF7043",
  sunYellow: "#FFC83D",
  dockBrown: "#8B5A2B",
  loonWhite: "#F5F7F7",
};

export default function Home() {
  const [catches, setCatches] = useState<Catch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPost, setShowPost] = useState(false);
  const [posting, setPosting] = useState(false);

  const [name, setName] = useState("");
  const [fish, setFish] = useState("");
  const [length, setLength] = useState("");
  const [weight, setWeight] = useState("");
  const [lake, setLake] = useState("White Iron Lake");
  const [caption, setCaption] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  useEffect(() => {
    loadCatches();
  }, []);

  async function loadCatches() {
    try {
      const { data, error } = await supabase
        .from("catches")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading catches:", error);
        return;
      }

      setCatches(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePost() {
    if (!name || !fish || !lake) {
      alert("Please fill in your name, fish, and lake.");
      return;
    }

    setPosting(true);

    try {
      let photoUrl: string | null = null;

      if (photo) {
        const fileExt = photo.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("catch-photos")
          .upload(`private/${fileName}`, photo);

        if (uploadError) {
          console.error("Photo upload error:", uploadError);
          alert("Photo upload failed.");
          setPosting(false);
          return;
        }

        const { data: signedUrlData, error: signedUrlError } =
          await supabase.storage
            .from("catch-photos")
            .createSignedUrl(`private/${fileName}`, 60 * 60 * 24 * 365);

        if (signedUrlError) {
          console.error("Signed URL error:", signedUrlError);
        } else {
          photoUrl = signedUrlData?.signedUrl || null;
        }
      }

      const { error } = await supabase.from("catches").insert({
        name,
        fish_species: fish,
        length,
        weight,
        lake,
        caption,
        image_url: photoUrl,
      });

      if (error) {
        console.error("Post error:", error);
        alert(`Post error: ${error.message}`);
        return;
      }

      setName("");
      setFish("");
      setLength("");
      setWeight("");
      setLake("White Iron Lake");
      setCaption("");
      setPhoto(null);
      setShowPost(false);

      await loadCatches();
    } catch (error) {
  console.error("Error:", error);
  alert(
    error instanceof Error
      ? error.message
      : "Something went wrong posting the catch."
  );
}
    
    setPosting(false);
  }

  return (
    <main style={styles.page}>
      {/* ================= HERO ================= */}

      <section style={styles.hero}>
        <div style={styles.heroImage} />
        <div style={styles.heroDark} />

        <div style={styles.heroContent}>
          <div style={styles.logoCircle}>
  <img
    src="/loon-logo.png.png"
    alt="Ely Fishing loon logo"
    style={{
      width: "110px",
      height: "110px",
      objectFit: "cover",
      borderRadius: "18px",
    }}
  />
</div>
          <p style={styles.eyebrow}>FAMILY FISHING TRIP</p>

          <h1 style={styles.heroTitle}>Ely Fishing</h1>

          <p style={styles.heroSubtitle}>
            White Iron Lake • Minnesota
          </p>

          <button
            style={styles.heroButton}
            onClick={() => setShowPost(true)}
          >
            <Plus size={20} />
            Post a Catch
          </button>
        </div>
      </section>

      {/* ================= STATS ================= */}

      <section style={styles.statsSection}>
        <div style={styles.statCard}>
          <Fish size={24} color={colors.sunsetOrange} />
          <strong>{catches.length}</strong>
          <span>Catches</span>
        </div>

        <div style={styles.statCard}>
          <Users size={24} color={colors.sunsetOrange} />
          <strong>12</strong>
          <span>Family</span>
        </div>

        <div style={styles.statCard}>
          <MapPin size={24} color={colors.sunsetOrange} />
          <strong>1</strong>
          <span>Lake</span>
        </div>
      </section>

      {/* ================= FEED ================= */}

      <section style={styles.feedSection}>
        <div style={styles.sectionHeader}>
          <div>
            <p style={styles.sectionEyebrow}>THE TRIP</p>
            <h2 style={styles.sectionTitle}>Recent Catches</h2>
          </div>

          <Trophy size={28} color={colors.sunsetOrange} />
        </div>

        {loading ? (
          <div style={styles.emptyState}>
            Loading catches...
          </div>
        ) : catches.length === 0 ? (
          <div style={styles.emptyState}>
            <Fish size={42} color={colors.lakeBlue} />
            <h3>No catches yet</h3>
            <p>Be the first person to post a catch from the trip.</p>

            <button
              style={styles.primaryButton}
              onClick={() => setShowPost(true)}
            >
              <Plus size={18} />
              Post the First Catch
            </button>
          </div>
        ) : (
          <div style={styles.catchGrid}>
            {catches.map((item) => (
              <article key={item.id} style={styles.catchCard}>
                {item.photo_url ? (
                  <img
                    src={item.photo_url}
                    alt={`${item.fish} caught by ${item.name}`}
                    style={styles.catchImage}
                  />
                ) : (
                  <div style={styles.noPhoto}>
                    <Fish size={42} color={colors.lakeBlue} />
                  </div>
                )}

                <div style={styles.catchBody}>
                  <div style={styles.catchTop}>
                    <div>
                      <h3 style={styles.catchName}>{item.name}</h3>
                      <p style={styles.catchFish}>{item.fish}</p>
                    </div>

                    <Heart
                      size={21}
                      color={colors.sunsetOrange}
                    />
                  </div>

                  <div style={styles.catchDetails}>
                    {item.length && (
                      <span>{item.length} in</span>
                    )}

                    {item.weight && (
                      <span>{item.weight} lbs</span>
                    )}

                    <span>{item.lake}</span>
                  </div>

                  {item.caption && (
                    <p style={styles.caption}>{item.caption}</p>
                  )}

                  <div style={styles.commentRow}>
                    <MessageCircle size={16} />
                    <span>Family catch</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ================= TRIP INFO ================= */}

      <section style={styles.tripSection}>
        <div style={styles.tripCard}>
          <div style={styles.tripIcon}>
            <MapPin size={25} color={colors.loonWhite} />
          </div>

          <div>
            <p style={styles.tripLabel}>CURRENT LOCATION</p>
            <h3 style={styles.tripTitle}>White Iron Lake</h3>
            <p style={styles.tripText}>
              Ely, Minnesota
            </p>
          </div>
        </div>

        <div style={styles.tripCard}>
          <div style={styles.tripIcon}>
            <Users size={25} color={colors.loonWhite} />
          </div>

          <div>
            <p style={styles.tripLabel}>THE CREW</p>
            <h3 style={styles.tripTitle}>Puralewski Family</h3>
            <p style={styles.tripText}>
              Making memories on the water
            </p>
          </div>
        </div>
      </section>

      {/* ================= BOTTOM NAV ================= */}

      <nav style={styles.bottomNav}>
        <button style={styles.navItem}>
          <Fish size={22} />
          <span>Feed</span>
        </button>

        <button
          style={styles.navPost}
          onClick={() => setShowPost(true)}
        >
          <Plus size={25} />
        </button>

        <button style={styles.navItem}>
          <Trophy size={22} />
          <span>Stats</span>
        </button>
      </nav>

      {/* ================= POST MODAL ================= */}

      {showPost && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <p style={styles.modalEyebrow}>ADD TO THE TRIP</p>
                <h2 style={styles.modalTitle}>Post a Catch</h2>
              </div>

              <button
                style={styles.closeButton}
                onClick={() => setShowPost(false)}
              >
                <X size={23} />
              </button>
            </div>

            <div style={styles.form}>
              <label style={styles.label}>
                Your Name
                <input
                  style={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </label>

              <label style={styles.label}>
                Fish
                <input
                  style={styles.input}
                  value={fish}
                  onChange={(e) => setFish(e.target.value)}
                  placeholder="Bass, walleye, pike..."
                />
              </label>

              <div style={styles.twoColumn}>
                <label style={styles.label}>
                  Length
                  <input
                    style={styles.input}
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="24"
                  />
                </label>

                <label style={styles.label}>
                  Weight
                  <input
                    style={styles.input}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="6.5"
                  />
                </label>
              </div>

              <label style={styles.label}>
                Lake
                <input
                  style={styles.input}
                  value={lake}
                  onChange={(e) => setLake(e.target.value)}
                  placeholder="White Iron Lake"
                />
              </label>

              <label style={styles.label}>
                Caption
                <textarea
                  style={styles.textarea}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Tell the family about the catch..."
                  rows={4}
                />
              </label>

              <label style={styles.photoUpload}>
                <Camera size={22} />
                <span>
                  {photo ? photo.name : "Add a photo"}
                </span>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setPhoto(e.target.files?.[0] || null)
                  }
                  style={{ display: "none" }}
                />
              </label>

              <button
                style={styles.submitButton}
                onClick={handlePost}
                disabled={posting}
              >
                {posting ? "Posting..." : "Post Catch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
  const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: colors.deepNavy,
    color: colors.loonWhite,
    paddingBottom: "90px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  hero: {
    position: "relative",
    minHeight: "620px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },

  heroImage: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "url('/minnesota-sunset.jpg.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  },

  heroDark: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to bottom, rgba(5,11,16,0.25), rgba(5,11,16,0.92))",
  },

  heroContent: {
    position: "relative",
    zIndex: 2,
    padding: "40px 20px",
  },

  logoCircle: {
    width: "76px",
    height: "76px",
    borderRadius: "50%",
    background: "rgba(7,24,39,0.85)",
    border: `2px solid ${colors.loonWhite}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 24px",
  },

  eyebrow: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "3px",
    color: colors.sunYellow,
  },

  heroTitle: {
    margin: "12px 0 8px",
    fontSize: "clamp(48px, 10vw, 82px)",
    lineHeight: 0.95,
    fontWeight: 900,
    letterSpacing: "-3px",
  },

  heroSubtitle: {
    margin: "0 0 30px",
    fontSize: "18px",
    color: colors.loonWhite,
    opacity: 0.9,
  },

  heroButton: {
    border: "none",
    borderRadius: "999px",
    background: colors.sunsetOrange,
    color: "#ffffff",
    padding: "15px 24px",
    fontSize: "16px",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: "9px",
    cursor: "pointer",
    boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
  },

  statsSection: {
    maxWidth: "900px",
    margin: "-35px auto 0",
    position: "relative",
    zIndex: 3,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    padding: "0 16px",
  },

  statCard: {
    background: colors.navy,
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px",
    padding: "20px 10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "5px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
  },

  feedSection: {
    maxWidth: "900px",
    margin: "55px auto 0",
    padding: "0 18px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "22px",
  },

  sectionEyebrow: {
    margin: 0,
    color: colors.sunYellow,
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "2px",
  },

  sectionTitle: {
    margin: "5px 0 0",
    fontSize: "30px",
  },

  catchGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
  },

  catchCard: {
    background: colors.navy,
    borderRadius: "20px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
  },

  catchImage: {
    width: "100%",
    height: "270px",
    objectFit: "cover",
    display: "block",
  },

  noPhoto: {
    height: "270px",
    background:
      "linear-gradient(135deg, #0d3550, #071827)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  catchBody: {
    padding: "20px",
  },

  catchTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
  },

  catchName: {
    margin: 0,
    fontSize: "21px",
  },

  catchFish: {
    margin: "4px 0 0",
    color: colors.sunsetOrange,
    fontWeight: 700,
  },

  catchDetails: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "15px",
  },

  caption: {
    color: "rgba(245,247,247,0.78)",
    lineHeight: 1.5,
    margin: "16px 0 0",
  },

  commentRow: {
    marginTop: "18px",
    display: "flex",
    alignItems: "center",
    gap: "7px",
    color: "rgba(245,247,247,0.55)",
    fontSize: "13px",
  },

  emptyState: {
    background: colors.navy,
    borderRadius: "20px",
    padding: "45px 25px",
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  primaryButton: {
    marginTop: "20px",
    border: "none",
    borderRadius: "12px",
    background: colors.sunsetOrange,
    color: "#ffffff",
    padding: "13px 20px",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  },

  tripSection: {
    maxWidth: "900px",
    margin: "45px auto",
    padding: "0 18px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "15px",
  },

  tripCard: {
    background: colors.navy,
    borderRadius: "18px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    border: "1px solid rgba(255,255,255,0.08)",
  },

  tripIcon: {
    width: "48px",
    height: "48px",
    flexShrink: 0,
    borderRadius: "14px",
    background: colors.lakeBlue,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  tripLabel: {
    margin: 0,
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1.5px",
    color: colors.sunYellow,
  },

  tripTitle: {
    margin: "4px 0",
    fontSize: "17px",
  },

  tripText: {
    margin: 0,
    color: "rgba(245,247,247,0.6)",
    fontSize: "13px",
  },

  bottomNav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "72px",
    background: "rgba(5,11,16,0.96)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "65px",
    zIndex: 20,
  },

  navItem: {
    border: "none",
    background: "transparent",
    color: colors.loonWhite,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    fontSize: "11px",
    cursor: "pointer",
  },

  navPost: {
    width: "54px",
    height: "54px",
    borderRadius: "50%",
    border: "4px solid " + colors.deepNavy,
    background: colors.sunsetOrange,
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    marginTop: "-28px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.3)",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },

  modal: {
    width: "100%",
    maxWidth: "520px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: colors.navy,
    borderRadius: "22px",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "25px",
  },

  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "25px",
  },

  modalEyebrow: {
    margin: 0,
    color: colors.sunYellow,
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "2px",
  },

  modalTitle: {
    margin: "5px 0 0",
    fontSize: "28px",
  },

  closeButton: {
    border: "none",
    background: "rgba(255,255,255,0.08)",
    color: colors.loonWhite,
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "17px",
  },

  label: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    fontSize: "13px",
    fontWeight: 700,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(255,255,255,0.12)",
    background: colors.deepNavy,
    color: colors.loonWhite,
    borderRadius: "10px",
    padding: "13px",
    fontSize: "15px",
    outline: "none",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(255,255,255,0.12)",
    background: colors.deepNavy,
    color: colors.loonWhite,
    borderRadius: "10px",
    padding: "13px",
    fontSize: "15px",
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
  },

  twoColumn: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },

  photoUpload: {
    border: "1px dashed rgba(255,255,255,0.25)",
    borderRadius: "12px",
    minHeight: "65px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    color: colors.loonWhite,
    cursor: "pointer",
    background: "rgba(255,255,255,0.03)",
  },

  submitButton: {
    border: "none",
    borderRadius: "12px",
    background: colors.sunsetOrange,
    color: "#ffffff",
    padding: "15px",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
  },
};
