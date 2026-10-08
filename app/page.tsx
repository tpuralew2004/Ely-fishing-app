"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  Camera,
  Fish,
  Trophy,
  MapPin,
  Users,
  X,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
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
  background: "#111513",
  backgroundSoft: "#181D1A",
  card: "#1B211E",
  cardLight: "#222925",
  cream: "#F1EEE6",
  muted: "#A9AEA8",
  subtle: "#737A73",
  border: "rgba(241,238,230,0.11)",
  green: "#71816D",
  greenLight: "#93A08D",
  blueGray: "#687D7D",
  black: "#0B0E0C",
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
  const [photos, setPhotos] = useState<File[]>([]);

  const [viewerCatch, setViewerCatch] = useState<Catch | null>(null);
  const [viewerPhotoIndex, setViewerPhotoIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  const [celebrating, setCelebrating] = useState(false);

  async function loadCatches() {
    setLoading(true);

    const { data, error } = await supabase
      .from("catches")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (!error && data) {
      setCatches(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadCatches();
  }, []);

  function getPhotos(item: Catch): string[] {
    if (!item.image_url) {
      return [];
    }

    try {
      const parsed = JSON.parse(item.image_url);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (url): url is string => typeof url === "string"
        );
      }
    } catch {
      // Older posts contain one normal URL.
    }

    return [item.image_url];
  }

  async function postCatch() {
    if (
      !name.trim() ||
      !fishSpecies.trim() ||
      !length ||
      !lake.trim()
    ) {
      alert(
        "Please enter your name, fish species, length, and lake."
      );
      return;
    }

    setPosting(true);

    try {
      const uploadedUrls: string[] = [];

      for (const photo of photos) {
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

        uploadedUrls.push(signedData.signedUrl);
      }

      const imageUrl =
        uploadedUrls.length > 0
          ? JSON.stringify(uploadedUrls)
          : null;

      const { error } = await supabase
        .from("catches")
        .insert({
          name: name.trim(),
          fish_species: fishSpecies.trim(),
          length: Number(length),
          weight: weight ? Number(weight) : null,
          lake: lake.trim(),
          caption: caption.trim() || null,
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
      setPhotos([]);

      setShowPost(false);

      await loadCatches();

      setCelebrating(true);

      setTimeout(() => {
        setCelebrating(false);
      }, 2500);
    } catch (error) {
      console.error(error);

      alert(
        "Something went wrong posting the catch."
      );
    }

    setPosting(false);
  }

  async function deleteCatch(catchId: number) {
    const confirmed = window.confirm(
      "Delete this catch? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("catches")
      .delete()
      .eq("id", catchId);

    if (error) {
      console.error(error);

      alert("Could not delete this catch.");
      return;
    }

    setCatches((current) =>
      current.filter(
        (item) => item.id !== catchId
      )
    );

    if (viewerCatch?.id === catchId) {
      setViewerCatch(null);
    }
  }

  function openViewer(
    item: Catch,
    photoIndex: number
  ) {
    setViewerCatch(item);
    setViewerPhotoIndex(photoIndex);
    setZoom(1);
  }

  function closeViewer() {
    setViewerCatch(null);
    setViewerPhotoIndex(0);
    setZoom(1);
  }

  function goToPreviousPhoto() {
    if (!viewerCatch) return;

    const photos = getPhotos(viewerCatch);

    if (photos.length <= 1) return;

    setViewerPhotoIndex(
      (current) =>
        (current - 1 + photos.length) %
        photos.length
    );

    setZoom(1);
  }

  function goToNextPhoto() {
    if (!viewerCatch) return;

    const photos = getPhotos(viewerCatch);

    if (photos.length <= 1) return;

    setViewerPhotoIndex(
      (current) =>
        (current + 1) % photos.length
    );

    setZoom(1);
  }

  useEffect(() => {
    function handleKeyboard(
      event: KeyboardEvent
    ) {
      if (!viewerCatch) return;

      if (event.key === "Escape") {
        closeViewer();
      }

      if (event.key === "ArrowLeft") {
        goToPreviousPhoto();
      }

      if (event.key === "ArrowRight") {
        goToNextPhoto();
      }

      if (event.key === "+") {
        setZoom((current) =>
          Math.min(current + 0.25, 3)
        );
      }

      if (event.key === "-") {
        setZoom((current) =>
          Math.max(current - 0.25, 1)
        );
      }

      if (event.key === "0") {
        setZoom(1);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  }, [viewerCatch, viewerPhotoIndex]);

  const totalWeight = useMemo(() => {
    return catches.reduce(
      (total, item) =>
        total + (item.weight || 0),
      0
    );
  }, [catches]);

  const fishermanCount = useMemo(() => {
    return new Set(
      catches.map((item) => item.name)
    ).size;
  }, [catches]);

  return (
    <main style={styles.page}>
      {/* HERO */}

      <section style={styles.hero}>
        <div style={styles.heroImage} />

        <div style={styles.heroOverlay} />

        <div style={styles.heroContent}>
          <div style={styles.heroTop}>
            <div style={styles.heroEyebrow}>
              FAMILY FISHING TRIP
            </div>

            <div style={styles.heroLogo}>
              <img
                src="/loon-logo.png.png"
                alt="Ely Anglers loon"
                style={styles.logoImage}
              />
            </div>

            <h1 style={styles.title}>
              Ely Anglers
            </h1>

            <p style={styles.subtitle}>
              White Iron Lake · Minnesota
            </p>
          </div>

          <div style={styles.heroBottom}>
            <div style={styles.locationCard}>
              <div style={styles.locationIcon}>
                <MapPin size={19} />
              </div>

              <div>
                <div style={styles.locationLabel}>
                  FISHING LOCATION
                </div>

                <div style={styles.locationTitle}>
                  White Iron Lake
                </div>

                <div style={styles.locationSub}>
                  Ely, Minnesota
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPost(true)}
              style={styles.postButton}
            >
              <Plus size={20} />
              Post a Catch
            </button>
          </div>
        </div>
      </section>

      {/* FEED */}

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

          <div style={styles.sectionIcon}>
            <Fish size={21} />
          </div>
        </div>

        {loading && (
          <div style={styles.loadingCard}>
            Loading catches...
          </div>
        )}

        {!loading && catches.length === 0 && (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>
              <Fish size={32} />
            </div>

            <h3>No catches yet</h3>

            <p>
              Be the first to add a fish
              to the family board.
            </p>
          </div>
        )}

        {!loading &&
          catches.map((item) => {
            const itemPhotos =
              getPhotos(item);

            return (
              <article
                key={item.id}
                style={styles.catchCard}
              >
                {itemPhotos.length > 0 && (
                  <div style={styles.photoSection}>
                    <button
                      onClick={() =>
                        openViewer(item, 0)
                      }
                      style={styles.mainPhotoButton}
                    >
                      <img
                        src={itemPhotos[0]}
                        alt={item.fish_species}
                        style={styles.catchImage}
                      />
                    </button>

                    {itemPhotos.length > 1 && (
                      <div style={styles.photoCount}>
                        {itemPhotos.length} photos
                      </div>
                    )}

                    {itemPhotos.length > 1 && (
                      <div style={styles.photoStrip}>
                        {itemPhotos.map(
                          (photo, index) => (
                            <button
                              key={`${item.id}-${index}`}
                              onClick={() =>
                                openViewer(
                                  item,
                                  index
                                )
                              }
                              style={
                                styles.thumbnailButton
                              }
                            >
                              <img
                                src={photo}
                                alt=""
                                style={styles.thumbnail}
                              />
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div style={styles.catchContent}>
                  <div style={styles.catchTop}>
                    <div>
                      <div style={styles.catchPerson}>
                        {item.name}
                      </div>

                      <h3 style={styles.fishName}>
                        {item.fish_species}
                      </h3>
                    </div>

                    <button
                      onClick={() =>
                        deleteCatch(item.id)
                      }
                      style={styles.deleteButton}
                      title="Delete catch"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>

                  <div style={styles.metadata}>
                    <span>
                      Length —{" "}
                      <strong>
                        {item.length}"
                      </strong>
                    </span>

                    <span>
                      Weight —{" "}
                      <strong>
                        {item.weight !== null
                          ? `${item.weight} lbs`
                          : "—"}
                      </strong>
                    </span>

                    <span>
                      Lake —{" "}
                      <strong>
                        {item.lake}
                      </strong>
                    </span>
                  </div>

                  {item.caption && (
                    <p style={styles.caption}>
                      {item.caption}
                    </p>
                  )}

                  <div style={styles.catchFooter}>
                    <span style={styles.dateText}>
                      {new Date(
                        item.created_at
                      ).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </span>

                    <button
                      onClick={() =>
                        openViewer(item, 0)
                      }
                      style={styles.viewButton}
                    >
                      {itemPhotos.length > 0
                        ? "View photo"
                        : "View catch"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

        {/* TRIP STATS */}

        <div style={styles.tripCard}>
          <div style={styles.tripHeader}>
            <div>
              <div style={styles.tripEyebrow}>
                THIS TRIP
              </div>

              <h2 style={styles.tripTitle}>
                Trip Stats
              </h2>
            </div>

            <div style={styles.tripIcon}>
              <Trophy size={20} />
            </div>
          </div>

          <div style={styles.tripStats}>
            <div style={styles.tripStat}>
              <strong>
                {catches.length}
              </strong>

              <span>Catches</span>
            </div>

            <div style={styles.tripDivider} />

            <div style={styles.tripStat}>
              <strong>
                {fishermanCount}
              </strong>

              <span>Fishermen</span>
            </div>

            <div style={styles.tripDivider} />

            <div style={styles.tripStat}>
              <strong>
                {totalWeight
                  ? totalWeight.toFixed(1)
                  : "0"}
              </strong>

              <span>Total lbs</span>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM NAV */}

      <nav style={styles.nav}>
        <button style={styles.navActive}>
          <Fish size={20} />
          <span>Feed</span>
        </button>

        <button
          onClick={() => {
            window.location.href =
              "/fishing-location";
          }}
          style={styles.navItem}
        >
          <MapPin size={20} />
          <span>Fishing</span>
        </button>

        <button style={styles.navItem}>
          <Trophy size={20} />
          <span>Leaders</span>
        </button>

        <button style={styles.navItem}>
          <Users size={20} />
          <span>Family</span>
        </button>
      </nav>

      {/* POST MODAL */}

      {showPost && (
        <div
          style={styles.modalBackground}
          onClick={() => setShowPost(false)}
        >
          <div
            style={styles.modal}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalEyebrow}>
                  NEW CATCH
                </div>

                <h2 style={styles.modalTitle}>
                  Post Your Fish
                </h2>
              </div>

              <button
                onClick={() =>
                  setShowPost(false)
                }
                style={styles.closeButton}
              >
                <X size={20} />
              </button>
            </div>

            <div style={styles.form}>
              <input
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Your name"
                style={styles.input}
              />

              <input
                value={fishSpecies}
                onChange={(event) =>
                  setFishSpecies(
                    event.target.value
                  )
                }
                placeholder="Fish species"
                style={styles.input}
              />

              <div style={styles.twoInputs}>
                <input
                  value={length}
                  onChange={(event) =>
                    setLength(
                      event.target.value
                    )
                  }
                  placeholder="Length (in)"
                  type="number"
                  style={styles.input}
                />

                <input
                  value={weight}
                  onChange={(event) =>
                    setWeight(
                      event.target.value
                    )
                  }
                  placeholder="Weight (lbs)"
                  type="number"
                  style={styles.input}
                />
              </div>

              <input
                value={lake}
                onChange={(event) =>
                  setLake(event.target.value)
                }
                placeholder="Lake"
                style={styles.input}
              />

              <textarea
                value={caption}
                onChange={(event) =>
                  setCaption(
                    event.target.value
                  )
                }
                placeholder="Tell the family about the catch..."
                rows={4}
                style={{
                  ...styles.input,
                  resize: "none",
                }}
              />

              <label style={styles.photoUpload}>
                <Camera size={19} />

                <span>
                  {photos.length > 0
                    ? `${photos.length} photo${
                        photos.length === 1
                          ? ""
                          : "s"
                      } selected`
                    : "Add photos"}
                </span>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{
                    display: "none",
                  }}
                  onChange={(event) => {
                    const files =
                      Array.from(
                        event.target.files || []
                      );

                    setPhotos(files);
                  }}
                />
              </label>

              {photos.length > 0 && (
                <div style={styles.selectedPhotos}>
                  {photos.map(
                    (photo, index) => (
                      <div
                        key={`${photo.name}-${index}`}
                        style={styles.selectedPhoto}
                      >
                        <span>
                          {photo.name}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}

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

      {/* PHOTO VIEWER */}

      {viewerCatch && (
        <div
          style={styles.viewerBackground}
          onClick={closeViewer}
        >
          <div style={styles.viewerTop}>
            <div style={styles.viewerTitle}>
              {viewerCatch.fish_species}
            </div>

            <button
              onClick={closeViewer}
              style={styles.viewerClose}
            >
              <X size={22} />
            </button>
          </div>

          <div
            style={styles.viewerImageArea}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {getPhotos(viewerCatch).length >
              1 && (
              <button
                onClick={goToPreviousPhoto}
                style={styles.viewerArrowLeft}
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {getPhotos(viewerCatch).length >
              0 && (
              <img
                src={
                  getPhotos(viewerCatch)[
                    viewerPhotoIndex
                  ]
                }
                alt={viewerCatch.fish_species}
                style={{
                  ...styles.viewerImage,
                  transform: `scale(${zoom})`,
                }}
              />
            )}

            {getPhotos(viewerCatch).length >
              1 && (
              <button
                onClick={goToNextPhoto}
                style={styles.viewerArrowRight}
              >
                <ChevronRight size={28} />
              </button>
            )}
          </div>

          <div
            style={styles.viewerControls}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              onClick={() =>
                setZoom((current) =>
                  Math.max(
                    current - 0.25,
                    1
                  )
                )
              }
              style={styles.viewerControl}
            >
              <ZoomOut size={19} />
            </button>

            <button
              onClick={() => setZoom(1)}
              style={styles.viewerControl}
            >
              <RotateCcw size={18} />
            </button>

            <div style={styles.zoomText}>
              {Math.round(zoom * 100)}%
            </div>

            <button
              onClick={() =>
                setZoom((current) =>
                  Math.min(
                    current + 0.25,
                    3
                  )
                )
              }
              style={styles.viewerControl}
            >
              <ZoomIn size={19} />
            </button>
          </div>

          <div style={styles.viewerCounter}>
            {viewerPhotoIndex + 1} /{" "}
            {getPhotos(viewerCatch).length}
          </div>
        </div>
      )}

      {/* CELEBRATION */}

      {celebrating && (
        <div style={styles.celebration}>
          <div style={styles.bubble} />
        </div>
      )}
    </main>
  );
}

/* =====================================================
   STYLES
===================================================== */

const styles: Record<
  string,
  CSSProperties
> = {
  page: {
    minHeight: "100vh",
    background: colors.background,
    color: colors.cream,
    paddingBottom: "88px",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  hero: {
    position: "relative",
    minHeight: "610px",
    overflow: "hidden",
  },

  heroImage: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "url('/minnesota-sunset.jpg.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter:
      "saturate(0.62) contrast(1.03)",
  },

  heroOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to bottom, rgba(8,11,9,0.22) 0%, rgba(8,11,9,0.48) 45%, #111513 100%)",
  },

  heroContent: {
    position: "relative",
    zIndex: 2,
    maxWidth: "920px",
    minHeight: "610px",
    margin: "0 auto",
    padding:
      "54px 22px 32px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },

  heroTop: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },

  heroEyebrow: {
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "3.2px",
    color:
      "rgba(241,238,230,0.72)",
  },

  heroLogo: {
    width: "125px",
    height: "125px",
    marginTop: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  logoImage: {
    width: "125px",
    height: "125px",
    objectFit: "contain",
    display: "block",
    filter:
      "grayscale(1) brightness(1.35) contrast(0.9)",
  },

  title: {
    margin: "18px 0 0",
    fontSize:
      "clamp(42px, 9vw, 70px)",
    lineHeight: 0.95,
    fontWeight: 800,
    letterSpacing: "-3px",
    color: colors.cream,
  },

  subtitle: {
    margin: "14px 0 0",
    fontSize: "15px",
    color:
      "rgba(241,238,230,0.72)",
    letterSpacing: "0.2px",
  },

  heroBottom: {
    width: "100%",
    maxWidth: "680px",
    margin: "0 auto",
  },

  locationCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "16px",
    borderRadius: "14px",
    background:
      "rgba(17,21,19,0.76)",
    border:
      "1px solid rgba(241,238,230,0.14)",
    backdropFilter: "blur(16px)",
  },

  locationIcon: {
    width: "42px",
    height: "42px",
    flexShrink: 0,
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(147,160,141,0.18)",
    color: colors.cream,
  },

  locationLabel: {
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "2px",
    color: colors.greenLight,
  },

  locationTitle: {
    marginTop: "3px",
    fontSize: "16px",
    fontWeight: 750,
  },

  locationSub: {
    marginTop: "2px",
    fontSize: "12px",
    color: colors.muted,
  },

  postButton: {
    width: "100%",
    marginTop: "10px",
    padding: "15px",
    border:
      "1px solid rgba(241,238,230,0.15)",
    borderRadius: "13px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: colors.cream,
    color: colors.background,
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow:
      "0 10px 30px rgba(0,0,0,0.22)",
  },

  feed: {
    maxWidth: "920px",
    margin: "0 auto",
    padding:
      "34px 20px 25px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: "19px",
  },

  sectionEyebrow: {
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "2.6px",
    color: colors.greenLight,
  },

  sectionTitle: {
    margin: "5px 0 0",
    fontSize: "30px",
    lineHeight: 1,
    fontWeight: 800,
    letterSpacing: "-1px",
  },

  sectionIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(147,160,141,0.12)",
    color: colors.greenLight,
  },

  loadingCard: {
    padding: "40px 20px",
    textAlign: "center",
    color: colors.muted,
  },

  emptyCard: {
    padding: "48px 20px",
    borderRadius: "16px",
    textAlign: "center",
    background: colors.card,
    border:
      `1px solid ${colors.border}`,
  },

  emptyIcon: {
    width: "58px",
    height: "58px",
    margin: "0 auto 14px",
    borderRadius: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(147,160,141,0.13)",
    color: colors.greenLight,
  },

  catchCard: {
    overflow: "hidden",
    marginBottom: "16px",
    borderRadius: "16px",
    background: colors.card,
    border:
      `1px solid ${colors.border}`,
    boxShadow:
      "0 10px 28px rgba(0,0,0,0.16)",
  },

  photoSection: {
    position: "relative",
    background: colors.black,
  },

  mainPhotoButton: {
    width: "100%",
    padding: 0,
    border: "none",
    display: "block",
    background: colors.black,
    cursor: "pointer",
  },

  catchImage: {
    width: "100%",
    height: "340px",
    objectFit: "contain",
    display: "block",
    background: colors.black,
  },

  photoCount: {
    position: "absolute",
    right: "12px",
    top: "12px",
    padding:
      "6px 9px",
    borderRadius: "8px",
    background:
      "rgba(11,14,12,0.78)",
    color: colors.cream,
    fontSize: "11px",
    fontWeight: 700,
    backdropFilter: "blur(8px)",
  },

  photoStrip: {
    display: "flex",
    gap: "7px",
    padding: "8px",
    overflowX: "auto",
    background:
      "rgba(11,14,12,0.96)",
  },

  thumbnailButton: {
    width: "58px",
    height: "48px",
    flexShrink: 0,
    padding: 0,
    border:
      "1px solid rgba(241,238,230,0.12)",
    borderRadius: "7px",
    overflow: "hidden",
    background: colors.black,
    cursor: "pointer",
  },

  thumbnail: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  catchContent: {
    padding: "19px",
  },

  catchTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
  },

  catchPerson: {
    fontSize: "12px",
    fontWeight: 750,
    color: colors.greenLight,
  },

  fishName: {
    margin: "4px 0 0",
    fontSize: "27px",
    lineHeight: 1,
    fontWeight: 800,
    letterSpacing: "-0.7px",
  },

  deleteButton: {
    width: "35px",
    height: "35px",
    flexShrink: 0,
    border:
      "1px solid rgba(241,238,230,0.10)",
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(241,238,230,0.04)",
    color: colors.subtle,
    cursor: "pointer",
  },

  metadata: {
    display: "flex",
    flexWrap: "wrap",
    gap: "7px 16px",
    marginTop: "17px",
    padding:
      "14px 0",
    borderTop:
      "1px solid rgba(241,238,230,0.08)",
    borderBottom:
      "1px solid rgba(241,238,230,0.08)",
    color: colors.muted,
    fontSize: "12px",
  },

  caption: {
    margin: "15px 0 0",
    color: colors.muted,
    fontSize: "14px",
    lineHeight: 1.65,
  },

  catchFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "17px",
  },

  dateText: {
    color: colors.subtle,
    fontSize: "11px",
  },

  viewButton: {
    border: "none",
    background: "transparent",
    color: colors.greenLight,
    fontSize: "12px",
    fontWeight: 750,
    cursor: "pointer",
  },

  tripCard: {
    marginTop: "30px",
    padding: "21px",
    borderRadius: "16px",
    background:
      "linear-gradient(145deg, #202721, #181D1A)",
    border:
      `1px solid ${colors.border}`,
  },

  tripHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  tripEyebrow: {
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "2.4px",
    color: colors.greenLight,
  },

  tripTitle: {
    margin: "4px 0 0",
    fontSize: "23px",
    fontWeight: 800,
    letterSpacing: "-0.5px",
  },

  tripIcon: {
    width: "39px",
    height: "39px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(147,160,141,0.13)",
    color: colors.greenLight,
  },

  tripStats: {
    display: "grid",
    gridTemplateColumns:
      "1fr auto 1fr auto 1fr",
    alignItems: "center",
    marginTop: "23px",
  },

  tripStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "5px",
  },

  tripDivider: {
    width: "1px",
    height: "35px",
    background:
      "rgba(241,238,230,0.11)",
  },

  nav: {
    position: "fixed",
    zIndex: 80,
    bottom: 0,
    left: 0,
    right: 0,
    height: "70px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "clamp(25px, 9vw, 65px)",
    background:
      "rgba(17,21,19,0.97)",
    borderTop:
      "1px solid rgba(241,238,230,0.10)",
    backdropFilter: "blur(18px)",
  },

  navActive: {
    border: "none",
    background: "transparent",
    color: colors.cream,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    fontSize: "10px",
    fontWeight: 750,
    cursor: "pointer",
  },

  navItem: {
    border: "none",
    background: "transparent",
    color: colors.subtle,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  modalBackground: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    background:
      "rgba(0,0,0,0.72)",
    backdropFilter: "blur(5px)",
  },

  modal: {
    width: "100%",
    maxWidth: "700px",
    maxHeight: "92vh",
    overflowY: "auto",
    padding:
      "25px 20px 30px",
    borderRadius:
      "20px 20px 0 0",
    background: colors.backgroundSoft,
    border:
      `1px solid ${colors.border}`,
  },

  modalHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "21px",
  },

  modalEyebrow: {
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "2.5px",
    color: colors.greenLight,
  },

  modalTitle: {
    margin: "5px 0 0",
    fontSize: "27px",
    fontWeight: 800,
    letterSpacing: "-0.6px",
  },

  closeButton: {
    width: "39px",
    height: "39px",
    borderRadius: "10px",
    border:
      "1px solid rgba(241,238,230,0.10)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(241,238,230,0.05)",
    color: colors.cream,
    cursor: "pointer",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  input: {
    boxSizing: "border-box",
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    border:
      "1px solid rgba(241,238,230,0.10)",
    background: colors.background,
    color: colors.cream,
    fontSize: "15px",
    outline: "none",
  },

  twoInputs: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "10px",
  },

  photoUpload: {
    minHeight: "52px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: "10px",
    border:
      "1px dashed rgba(147,160,141,0.42)",
    color: colors.greenLight,
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 700,
  },

  selectedPhotos: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  selectedPhoto: {
    padding: "9px 11px",
    borderRadius: "8px",
    background:
      "rgba(147,160,141,0.08)",
    color: colors.muted,
    fontSize: "12px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  submitButton: {
    marginTop: "5px",
    padding: "15px",
    border: "none",
    borderRadius: "10px",
    background: colors.cream,
    color: colors.background,
    fontSize: "15px",
    fontWeight: 800,
    cursor: "pointer",
  },

  viewerBackground: {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    background:
      "rgba(5,7,6,0.97)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  viewerTop: {
    position: "absolute",
    zIndex: 3,
    top: "18px",
    left: "18px",
    right: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  viewerTitle: {
    color: colors.cream,
    fontSize: "15px",
    fontWeight: 750,
  },

  viewerClose: {
    width: "42px",
    height: "42px",
    borderRadius: "11px",
    border:
      "1px solid rgba(241,238,230,0.14)",
    background:
      "rgba(241,238,230,0.07)",
    color: colors.cream,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  viewerImageArea: {
    position: "relative",
    width: "100%",
    height: "calc(100vh - 150px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  viewerImage: {
    maxWidth: "90vw",
    maxHeight: "76vh",
    objectFit: "contain",
    display: "block",
    transition:
      "transform 0.18s ease",
    userSelect: "none",
  },

  viewerArrowLeft: {
    position: "absolute",
    left: "15px",
    zIndex: 4,
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    border:
      "1px solid rgba(241,238,230,0.14)",
    background:
      "rgba(17,21,19,0.72)",
    color: colors.cream,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  viewerArrowRight: {
    position: "absolute",
    right: "15px",
    zIndex: 4,
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    border:
      "1px solid rgba(241,238,230,0.14)",
    background:
      "rgba(17,21,19,0.72)",
    color: colors.cream,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  viewerControls: {
    position: "absolute",
    bottom: "32px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  viewerControl: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    border:
      "1px solid rgba(241,238,230,0.13)",
    background:
      "rgba(241,238,230,0.07)",
    color: colors.cream,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  zoomText: {
    minWidth: "45px",
    textAlign: "center",
    color: colors.muted,
    fontSize: "12px",
    fontWeight: 700,
  },

  viewerCounter: {
    position: "absolute",
    bottom: "12px",
    right: "18px",
    color: colors.subtle,
    fontSize: "11px",
  },

  celebration: {
    position: "fixed",
    inset: 0,
    zIndex: 300,
    pointerEvents: "none",
    overflow: "hidden",
  },

  bubble: {
    position: "absolute",
    left: "50%",
    bottom: "20%",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background:
      "rgba(147,160,141,0.7)",
    animation:
      "bubbleRise 2.2s ease-out forwards",
  },
};

/*
  Global styles and animation.
*/

if (
  typeof document !== "undefined" &&
  !document.getElementById(
    "ely-anglers-animations"
  )
) {
  const styleTag =
    document.createElement("style");

  styleTag.id =
    "ely-anglers-animations";

  styleTag.innerHTML = `
    @keyframes bubbleRise {
      0% {
        transform:
          translate(-50%, 0)
          scale(0.6);
        opacity: 0;
      }

      15% {
        opacity: 0.8;
      }

      100% {
        transform:
          translate(-50%, -70vh)
          scale(1.4);
        opacity: 0;
      }
    }

    * {
      box-sizing: border-box;
    }

    button,
    input,
    textarea {
      font-family: inherit;
    }

    button:active {
      transform: scale(0.98);
    }

    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    ::-webkit-scrollbar-track {
      background: transparent;
    }

    ::-webkit-scrollbar-thumb {
      background: rgba(241,238,230,0.16);
      border-radius: 20px;
    }

    input::placeholder,
    textarea::placeholder {
      color: rgba(241,238,230,0.35);
    }
  `;

  document.head.appendChild(styleTag);
}
