"use client";

import { useEffect, useMemo, useState } from "react";
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
  Trash2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Scale,
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
  forest: "#173D2D",
  deepForest: "#0D241A",
  pine: "#24553D",
  lake: "#2E7180",
  water: "#5FA9B5",
  cream: "#F4F0E6",
  paper: "#FFFDF7",
  gold: "#D7A928",
  orange: "#D66B3D",
  dark: "#16211B",
  muted: "#6F776F",
  white: "#FFFFFF",
  danger: "#B94A48",
};

const bubbleValues = Array.from({ length: 22 }, (_, index) => ({
  left: `${4 + ((index * 17) % 92)}%`,
  size: `${10 + ((index * 7) % 16)}px`,
  delay: `${(index * 0.13).toFixed(2)}s`,
  duration: `${1.7 + ((index * 11) % 13) / 10}s`,
}));

function getPhotoUrls(imageUrl: string | null | undefined): string[] {
  if (!imageUrl) return [];

  try {
    const parsed = JSON.parse(imageUrl);

    if (
      Array.isArray(parsed) &&
      parsed.every((value) => typeof value === "string")
    ) {
      return parsed;
    }
  } catch {
    // Old posts contain a normal URL rather than JSON.
  }

  return [imageUrl];
}

function formatWeight(value: number | null) {
  if (value === null || Number.isNaN(value)) return null;

  return Number.isInteger(value)
    ? `${value} lbs`
    : `${value.toFixed(1)} lbs`;
}

function formatLength(value: number | null) {
  if (value === null || Number.isNaN(value)) return null;

  return Number.isInteger(value)
    ? `${value}"`
    : `${value.toFixed(1)}"`;
}

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

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const [viewerCatch, setViewerCatch] = useState<Catch | null>(null);
  const [viewerPhotoIndex, setViewerPhotoIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  const [celebrateId, setCelebrateId] = useState<number | null>(null);

  const totalWeight = useMemo(() => {
    return catches.reduce((total, item) => {
      return total + (item.weight ?? 0);
    }, 0);
  }, [catches]);

  const fishermen = useMemo(() => {
    return new Set(catches.map((item) => item.name.trim()).filter(Boolean))
      .size;
  }, [catches]);

  async function loadCatches() {
    setLoading(true);

    const { data, error } = await supabase
      .from("catches")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading catches:", error);
    }

    if (!error && data) {
      setCatches(data as Catch[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadCatches();
  }, []);

  useEffect(() => {
    if (photoFiles.length === 0) {
      setPhotoPreviews([]);
      return;
    }

    const urls = photoFiles.map((file) => URL.createObjectURL(file));

    setPhotoPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoFiles]);

  useEffect(() => {
    if (celebrateId === null) return;

    const timer = window.setTimeout(() => {
      setCelebrateId(null);
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [celebrateId]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!viewerCatch) return;

      if (event.key === "Escape") {
        closeViewer();
      }

      if (event.key === "ArrowRight") {
        goToNextPhoto();
      }

      if (event.key === "ArrowLeft") {
        goToPreviousPhoto();
      }

      if (event.key === "+") {
        setZoom((current) => Math.min(3, current + 0.25));
      }

      if (event.key === "-") {
        setZoom((current) => Math.max(0.5, current - 0.25));
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [viewerCatch, viewerPhotoIndex]);

  function handlePhotoSelection(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      setPhotoFiles([]);
      return;
    }

    setPhotoFiles(files);
  }

  function removeSelectedPhoto(index: number) {
    setPhotoFiles((current) =>
      current.filter((_, photoIndex) => photoIndex !== index)
    );
  }

  async function postCatch() {
    if (!name || !fishSpecies || !length || !lake) {
      alert(
        "Please enter your name, fish species, length, and lake."
      );
      return;
    }

    setPosting(true);

    try {
      const uploadedUrls: string[] = [];

      for (const photo of photoFiles) {
        const extension =
          photo.name.split(".").pop()?.toLowerCase() || "jpg";

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

        const {
          data: signedData,
          error: signedError,
        } = await supabase.storage
          .from("catch-photos")
          .createSignedUrl(
            filePath,
            60 * 60 * 24 * 365
          );

        if (signedError || !signedData?.signedUrl) {
          throw signedError || new Error("Could not create photo URL.");
        }

        uploadedUrls.push(signedData.signedUrl);
      }

      /*
        IMPORTANT:

        We are keeping your existing image_url column.

        - Old posts can still contain one normal URL.
        - New posts store multiple URLs as a JSON array.

        Example:
        ["url1", "url2", "url3"]
      */

      const imageUrl =
        uploadedUrls.length > 0
          ? JSON.stringify(uploadedUrls)
          : null;

      const { data: insertedCatch, error } = await supabase
        .from("catches")
        .insert({
          name,
          fish_species: fishSpecies,
          length: Number(length),
          weight: weight ? Number(weight) : null,
          lake,
          caption: caption || null,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      const newCatch = insertedCatch as Catch;

      setCatches((current) => [
        newCatch,
        ...current,
      ]);

      setName("");
      setFishSpecies("");
      setLength("");
      setWeight("");
      setLake("White Iron Lake");
      setCaption("");
      setPhotoFiles([]);
      setPhotoPreviews([]);

      setShowPost(false);

      setCelebrateId(newCatch.id);
    } catch (error) {
      console.error("Error posting catch:", error);

      alert(
        "Something went wrong posting the catch. Please try again."
      );
    } finally {
      setPosting(false);
    }
  }

  async function deleteCatch(catchId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this catch?"
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("catches")
        .delete()
        .eq("id", catchId);

      if (error) {
        console.error("Delete error:", error);

        alert(
          "Something went wrong deleting the catch."
        );

        return;
      }

      setCatches((current) =>
        current.filter((item) => item.id !== catchId)
      );
    } catch (error) {
      console.error(error);

      alert(
        "Something went wrong deleting the catch."
      );
    }
  }

  function openViewer(item: Catch, photoIndex = 0) {
    setViewerCatch(item);
    setViewerPhotoIndex(photoIndex);
    setZoom(1);
  }

  function closeViewer() {
    setViewerCatch(null);
    setViewerPhotoIndex(0);
    setZoom(1);
  }

  function goToNextPhoto() {
    if (!viewerCatch) return;

    const photos = getPhotoUrls(viewerCatch.image_url);

    if (photos.length <= 1) return;

    setViewerPhotoIndex((current) =>
      current >= photos.length - 1 ? 0 : current + 1
    );

    setZoom(1);
  }

  function goToPreviousPhoto() {
    if (!viewerCatch) return;

    const photos = getPhotoUrls(viewerCatch.image_url);

    if (photos.length <= 1) return;

    setViewerPhotoIndex((current) =>
      current <= 0 ? photos.length - 1 : current - 1
    );

    setZoom(1);
  }

  function resetZoom() {
    setZoom(1);
  }

  function changeZoom(amount: number) {
    setZoom((current) =>
      Math.min(3, Math.max(0.5, current + amount))
    );
  }

  return (
    <main style={styles.page}>
      {/* =====================================================
          HERO
      ====================================================== */}

      <section style={styles.hero}>
        <div style={styles.heroImage} />
        <div style={styles.heroDark} />

        <div style={styles.heroContent}>
          {/* LOGO */}

          <div style={styles.logoArea}>
            <img
              src="/loon-logo.png.png"
              alt="Ely Anglers loon logo"
              style={styles.heroLogo}
            />
          </div>

          {/* TITLE */}

          <div style={styles.heroTitleArea}>
            <div style={styles.eyebrow}>
              FAMILY FISHING TRIP
            </div>

            <h1 style={styles.title}>
              Ely Anglers
            </h1>

            <p style={styles.subtitle}>
              White Iron Lake • Minnesota
            </p>
          </div>

          {/* LOCATION */}

          <div style={styles.locationCard}>
            <div style={styles.locationIcon}>
              <MapPin size={23} />
            </div>

            <div>
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
            onClick={() => setShowPost(true)}
            style={styles.postButton}
          >
            <Plus size={22} />
            Post a Catch
          </button>
        </div>
      </section>

      {/* =====================================================
          STICKY TRIP SUMMARY
      ====================================================== */}

      <div style={styles.stickyStatsWrapper}>
        <div style={styles.stickyStats}>
          <div style={styles.stickyStat}>
            <div style={styles.stickyIcon}>
              <Fish size={17} />
            </div>

            <div>
              <strong>
                {catches.length}
              </strong>

              <span>CATCHES</span>
            </div>
          </div>

          <div style={styles.statDivider} />

          <div style={styles.stickyStat}>
            <div style={styles.stickyIcon}>
              <Users size={17} />
            </div>

            <div>
              <strong>
                {fishermen}
              </strong>

              <span>FISHERMEN</span>
            </div>
          </div>

          <div style={styles.statDivider} />

          <div style={styles.stickyStat}>
            <div style={styles.stickyIcon}>
              <Scale size={17} />
            </div>

            <div>
              <strong>
                {totalWeight % 1 === 0
                  ? totalWeight
                  : totalWeight.toFixed(1)}
              </strong>

              <span>LBS</span>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          FEED
      ====================================================== */}

      <section style={styles.feed}>
        <div style={styles.sectionHeader}>
          <div>
            <div style={styles.sectionEyebrow}>
              THE CATCH BOARD
            </div>

            <h2 style={styles.sectionTitle}>
              Recent Catches
            </h2>

            <p style={styles.sectionSubtext}>
              Newest catches appear first
            </p>
          </div>

          <Fish
            size={30}
            color={colors.gold}
          />
        </div>

        {loading && (
          <div style={styles.loadingCard}>
            Loading catches...
          </div>
        )}

        {!loading && catches.length === 0 && (
          <div style={styles.emptyCard}>
            <Fish
              size={42}
              color={colors.gold}
            />

            <h3 style={styles.emptyTitle}>
              No catches yet
            </h3>

            <p style={styles.emptyText}>
              Be the first person to post a fish!
            </p>
          </div>
        )}

        {!loading &&
          catches.map((item) => {
            const photos = getPhotoUrls(item.image_url);
            const isCelebrating =
              celebrateId === item.id;

            return (
              <article
                key={item.id}
                style={{
                  ...styles.catchCard,
                  position: "relative",
                }}
              >
                {/* NEW CATCH BUBBLES */}

                {isCelebrating && (
                  <div
                    style={
                      styles.celebrationOverlay
                    }
                  >
                    {bubbleValues.map(
                      (bubble, index) => (
                        <span
                          key={index}
                          style={{
                            ...styles.bubble,
                            left: bubble.left,
                            width: bubble.size,
                            height: bubble.size,
                            animationDelay:
                              bubble.delay,
                            animationDuration:
                              bubble.duration,
                          }}
                        />
                      )
                    )}

                    <div
                      style={
                        styles.newCatchBadge
                      }
                    >
                      🎣 NEW CATCH!
                    </div>
                  </div>
                )}

                {/* =================================================
                    PHOTO AREA
                ================================================== */}

                {photos.length > 0 && (
                  <div style={styles.photoSection}>
                    <button
                      onClick={() =>
                        openViewer(item, 0)
                      }
                      style={
                        styles.mainPhotoButton
                      }
                    >
                      <img
                        src={photos[0]}
                        alt={item.fish_species}
                        style={
                          styles.catchImage
                        }
                      />

                      <div
                        style={
                          styles.photoViewHint
                        }
                      >
                        Tap to view
                      </div>
                    </button>

                    {photos.length > 1 && (
                      <div
                        style={
                          styles.photoStrip
                        }
                      >
                        {photos.map(
                          (photoUrl, index) => (
                            <button
                              key={photoUrl}
                              onClick={() =>
                                openViewer(
                                  item,
                                  index
                                )
                              }
                              style={{
                                ...styles.thumbnailButton,
                                border:
                                  index === 0
                                    ? `2px solid ${colors.gold}`
                                    : "2px solid transparent",
                              }}
                            >
                              <img
                                src={photoUrl}
                                alt={`${item.fish_species} photo ${index + 1}`}
                                style={
                                  styles.thumbnail
                                }
                              />
                            </button>
                          )
                        )}

                        <div
                          style={
                            styles.photoCount
                          }
                        >
                          {photos.length} photos
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* =================================================
                    CATCH CONTENT
                ================================================== */}

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
                      color={colors.gold}
                    />
                  </div>

                  {/* CLEAR METADATA */}

                  <div style={styles.metadataBar}>
                    <span>
                      <b>Length</b>
                      {" — "}
                      {formatLength(
                        item.length
                      )}
                    </span>

                    <span
                      style={
                        styles.metadataDot
                      }
                    >
                      •
                    </span>

                    <span>
                      <b>Weight</b>
                      {" — "}
                      {formatWeight(
                        item.weight
                      ) ?? "—"}
                    </span>

                    <span
                      style={
                        styles.metadataDot
                      }
                    >
                      •
                    </span>

                    <span
                      style={
                        styles.metadataLake
                      }
                    >
                      <b>Lake</b>
                      {" — "}
                      {item.lake}
                    </span>
                  </div>

                  {item.caption && (
                    <p style={styles.caption}>
                      {item.caption}
                    </p>
                  )}

                  {/* ACTION ROW */}

                  <div style={styles.social}>
                    <button
                      style={
                        styles.socialButton
                      }
                    >
                      <Heart size={17} />
                      Like
                    </button>

                    <button
                      style={
                        styles.socialButton
                      }
                    >
                      <MessageCircle
                        size={17}
                      />
                      Comment
                    </button>

                    <button
                      onClick={() =>
                        deleteCatch(item.id)
                      }
                      style={
                        styles.deleteButton
                      }
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>

                    <span style={styles.time}>
                      {new Date(
                        item.created_at
                      ).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}

        {/* =====================================================
            SECONDARY TRIP STATS
        ====================================================== */}

        <div style={styles.tripCard}>
          <div style={styles.tripHeader}>
            <Trophy
              size={25}
              color={colors.gold}
            />

            <div>
              <div
                style={
                  styles.tripEyebrow
                }
              >
                THE BIG PICTURE
              </div>

              <h2 style={styles.tripTitle}>
                Trip Stats
              </h2>
            </div>
          </div>

          <div style={styles.tripStats}>
            <div style={styles.tripStat}>
              <strong>
                {catches.length}
              </strong>

              <span>CATCHES</span>
            </div>

            <div style={styles.tripStat}>
              <strong>
                {fishermen}
              </strong>

              <span>FISHERMEN</span>
            </div>

            <div style={styles.tripStat}>
              <strong>
                {totalWeight % 1 === 0
                  ? totalWeight
                  : totalWeight.toFixed(1)}
              </strong>

              <span>TOTAL LBS</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          BOTTOM NAV
      ====================================================== */}

      <nav style={styles.nav}>
        <button style={styles.navActive}>
          <Fish size={21} />
          Feed
        </button>

        <button
          onClick={() => {
            window.location.href =
              "/fishing-location";
          }}
          style={styles.navItem}
        >
          <MapPin size={21} />
          Fishing
        </button>

        <button style={styles.navItem}>
          <Trophy size={21} />
          Leaders
        </button>

        <button style={styles.navItem}>
          <Users size={21} />
          Family
        </button>
      </nav>

      {/* =====================================================
          POST MODAL
      ====================================================== */}

      {showPost && (
        <div style={styles.modalBackground}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <div
                  style={
                    styles.sectionEyebrow
                  }
                >
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
                <X size={21} />
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
                  step="0.1"
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
                  step="0.1"
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
                rows={3}
                style={{
                  ...styles.input,
                  resize: "none",
                }}
              />

              {/* MULTIPLE PHOTOS */}

              <label style={styles.photoButton}>
                <Camera size={20} />

                <span>
                  {photoFiles.length === 0
                    ? "Add photos"
                    : `${photoFiles.length} photo${
                        photoFiles.length === 1
                          ? ""
                          : "s"
                      } selected`}
                </span>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={
                    handlePhotoSelection
                  }
                />
              </label>

              {photoPreviews.length > 0 && (
                <div
                  style={
                    styles.selectedPhotos
                  }
                >
                  {photoPreviews.map(
                    (preview, index) => (
                      <div
                        key={preview}
                        style={
                          styles.selectedPhoto
                        }
                      >
                        <img
                          src={preview}
                          alt={`Selected photo ${index + 1}`}
                          style={
                            styles.selectedPhotoImage
                          }
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeSelectedPhoto(
                              index
                            )
                          }
                          style={
                            styles.removePhotoButton
                          }
                        >
                          <X size={14} />
                        </button>
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
                  opacity: posting
                    ? 0.65
                    : 1,
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

      {/* =====================================================
          FULL PHOTO VIEWER
      ====================================================== */}

      {viewerCatch && (
        <div
          style={styles.viewerBackground}
          onClick={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeViewer();
            }
          }}
        >
          <div style={styles.viewer}>
            {/* TOP BAR */}

            <div style={styles.viewerTop}>
              <div>
                <div
                  style={
                    styles.viewerPerson
                  }
                >
                  {viewerCatch.name}
                </div>

                <div
                  style={
                    styles.viewerFish
                  }
                >
                  {viewerCatch.fish_species}
                </div>
              </div>

              <button
                onClick={closeViewer}
                style={
                  styles.viewerClose
                }
              >
                <X size={23} />
              </button>
            </div>

            {/* IMAGE */}

            <div style={styles.viewerImageArea}>
              {getPhotoUrls(
                viewerCatch.image_url
              ).length > 1 && (
                <button
                  onClick={
                    goToPreviousPhoto
                  }
                  style={
                    styles.viewerArrowLeft
                  }
                >
                  <ChevronLeft size={30} />
                </button>
              )}

              <div
                style={
                  styles.zoomViewport
                }
              >
                <img
                  src={
                    getPhotoUrls(
                      viewerCatch.image_url
                    )[viewerPhotoIndex]
                  }
                  alt={
                    viewerCatch.fish_species
                  }
                  style={{
                    ...styles.viewerImage,
                    transform: `scale(${zoom})`,
                  }}
                />
              </div>

              {getPhotoUrls(
                viewerCatch.image_url
              ).length > 1 && (
                <button
                  onClick={goToNextPhoto}
                  style={
                    styles.viewerArrowRight
                  }
                >
                  <ChevronRight size={30} />
                </button>
              )}
            </div>

            {/* CONTROLS */}

            <div style={styles.viewerControls}>
              <button
                onClick={() =>
                  changeZoom(-0.25)
                }
                style={
                  styles.viewerControl
                }
              >
                <ZoomOut size={19} />
              </button>

              <button
                onClick={resetZoom}
                style={
                  styles.zoomPercentage
                }
              >
                {Math.round(zoom * 100)}%
              </button>

              <button
                onClick={() =>
                  changeZoom(0.25)
                }
                style={
                  styles.viewerControl
                }
              >
                <ZoomIn size={19} />
              </button>

              <button
                onClick={resetZoom}
                style={
                  styles.viewerControl
                }
              >
                <RotateCcw size={17} />
              </button>
            </div>

            {/* PHOTO COUNTER */}

            {getPhotoUrls(
              viewerCatch.image_url
            ).length > 1 && (
              <div
                style={
                  styles.viewerCounter
                }
              >
                Photo{" "}
                {viewerPhotoIndex + 1} of{" "}
                {
                  getPhotoUrls(
                    viewerCatch.image_url
                  ).length
                }
              </div>
            )}

            {/* DETAILS */}

            <div
              style={
                styles.viewerDetails
              }
            >
              <div>
                <b>Length</b>
                {" — "}
                {formatLength(
                  viewerCatch.length
                )}
              </div>

              <div>
                <b>Weight</b>
                {" — "}
                {formatWeight(
                  viewerCatch.weight
                ) ?? "—"}
              </div>

              <div>
                <b>Lake</b>
                {" — "}
                {viewerCatch.lake}
              </div>
            </div>

            {viewerCatch.caption && (
              <p
                style={
                  styles.viewerCaption
                }
              >
                {viewerCatch.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    background: colors.cream,
    color: colors.dark,
    paddingBottom: "90px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  /* ==========================================================
     HERO
  ========================================================== */

  hero: {
    position: "relative",
    minHeight: "510px",
    overflow: "hidden",
    color: colors.white,
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
      "linear-gradient(to bottom, rgba(7,20,14,0.12) 0%, rgba(7,20,14,0.35) 45%, rgba(7,20,14,0.95) 100%)",
  },

  heroContent: {
    position: "relative",
    zIndex: 2,
    maxWidth: "900px",
    margin: "0 auto",
    padding:
      "38px 20px 32px",
  },

  logoArea: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "190px",
  },

  /*
    IMPORTANT:
    There is NO circular background around the logo anymore.
    The PNG sits directly on the hero.
  */

  heroLogo: {
    width: "185px",
    height: "185px",
    objectFit: "contain",
    display: "block",
    filter:
      "drop-shadow(0 12px 20px rgba(0,0,0,0.45))",
  },

  heroTitleArea: {
    textAlign: "center",
  },

  eyebrow: {
    color: "#F0CF5A",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "3px",
  },

  title: {
    margin: "8px 0 0",
    fontSize: "44px",
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: "-2px",
  },

  subtitle: {
    margin:
      "10px 0 0",
    fontSize: "15px",
    color:
      "rgba(255,255,255,0.82)",
  },

  locationCard: {
    marginTop: "55px",
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "15px",
    borderRadius: "16px",
    background:
      "rgba(13,36,26,0.76)",
    border:
      "1px solid rgba(255,255,255,0.16)",
    backdropFilter:
      "blur(14px)",
    boxShadow:
      "0 12px 30px rgba(0,0,0,0.24)",
  },

  locationIcon: {
    width: "45px",
    height: "45px",
    flexShrink: 0,
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: colors.gold,
    color: colors.dark,
  },

  locationTitle: {
    fontSize: "16px",
    fontWeight: 900,
  },

  locationSub: {
    marginTop: "3px",
    fontSize: "12px",
    color:
      "rgba(255,255,255,0.65)",
  },

  postButton: {
    width: "100%",
    marginTop: "12px",
    padding: "16px",
    border: "none",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: colors.orange,
    color: colors.white,
    fontSize: "16px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow:
      "0 10px 25px rgba(214,107,61,0.28)",
  },

  /* ==========================================================
     STICKY STATS
  ========================================================== */

  stickyStatsWrapper: {
    position: "sticky",
    top: 0,
    zIndex: 70,
    padding:
      "9px 12px",
    background:
      "rgba(244,240,230,0.96)",
    borderBottom:
      "1px solid rgba(23,61,45,0.12)",
    backdropFilter:
      "blur(16px)",
  },

  stickyStats: {
    maxWidth: "900px",
    margin: "0 auto",
    minHeight: "58px",
    display: "grid",
    gridTemplateColumns:
      "1fr auto 1fr auto 1fr",
    alignItems: "center",
    padding: "5px 4px",
    borderRadius: "16px",
    background: colors.forest,
    color: colors.white,
    boxShadow:
      "0 6px 20px rgba(13,36,26,0.18)",
  },

  stickyStat: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
  },

  stickyIcon: {
    width: "29px",
    height: "29px",
    borderRadius: "9px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(255,255,255,0.1)",
    color: "#F0CF5A",
  },

  statDivider: {
    width: "1px",
    height: "31px",
    background:
      "rgba(255,255,255,0.18)",
  },

  /* ==========================================================
     FEED
  ========================================================== */

  feed: {
    maxWidth: "900px",
    margin: "0 auto",
    padding:
      "25px 17px 30px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent:
      "space-between",
    marginBottom: "16px",
  },

  sectionEyebrow: {
    color: colors.forest,
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: "2.5px",
  },

  sectionTitle: {
    margin:
      "5px 0 0",
    fontSize: "29px",
    lineHeight: 1,
    fontWeight: 900,
    color: colors.dark,
  },

  sectionSubtext: {
    margin:
      "7px 0 0",
    color: colors.muted,
    fontSize: "12px",
  },

  loadingCard: {
    padding: "40px",
    textAlign: "center",
    color: colors.muted,
  },

  emptyCard: {
    padding:
      "45px 20px",
    borderRadius: "20px",
    textAlign: "center",
    background: colors.paper,
    border:
      "1px solid rgba(23,61,45,0.1)",
  },

  emptyTitle: {
    margin:
      "12px 0 0",
    color: colors.dark,
  },

  emptyText: {
    color: colors.muted,
    fontSize: "14px",
  },

  /* ==========================================================
     CATCH CARD
  ========================================================== */

  catchCard: {
    overflow: "hidden",
    marginBottom: "16px",
    borderRadius: "20px",
    background: colors.paper,
    border:
      "1px solid rgba(23,61,45,0.12)",
    boxShadow:
      "0 8px 24px rgba(23,61,45,0.09)",
  },

  photoSection: {
    background: "#17211B",
  },

  mainPhotoButton: {
    position: "relative",
    width: "100%",
    height: "330px",
    padding: 0,
    border: "none",
    background: "#17211B",
    display: "block",
    cursor: "pointer",
    overflow: "hidden",
  },

  catchImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
    background: "#17211B",
  },

  photoViewHint: {
    position: "absolute",
    right: "12px",
    bottom: "12px",
    padding:
      "7px 10px",
    borderRadius: "999px",
    background:
      "rgba(13,36,26,0.82)",
    color: colors.white,
    fontSize: "11px",
    fontWeight: 800,
    backdropFilter:
      "blur(8px)",
  },

  photoStrip: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding:
      "8px 10px 10px",
    overflowX: "auto",
  },

  thumbnailButton: {
    flexShrink: 0,
    width: "54px",
    height: "54px",
    padding: 0,
    borderRadius: "9px",
    overflow: "hidden",
    background: "#17211B",
    cursor: "pointer",
  },

  thumbnail: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  photoCount: {
    marginLeft: "auto",
    flexShrink: 0,
    padding:
      "6px 9px",
    borderRadius: "999px",
    background:
      "rgba(255,255,255,0.12)",
    color:
      "rgba(255,255,255,0.78)",
    fontSize: "11px",
    fontWeight: 800,
  },

  catchContent: {
    padding: "17px",
  },

  catchHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
  },

  catchPerson: {
    color: colors.pine,
    fontSize: "12px",
    fontWeight: 900,
    textTransform:
      "uppercase",
    letterSpacing:
      "0.7px",
  },

  fishName: {
    margin:
      "3px 0 0",
    fontSize: "26px",
    lineHeight: 1.05,
    fontWeight: 900,
    color: colors.dark,
  },

  /* ==========================================================
     METADATA
  ========================================================== */

  metadataBar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "6px",
    marginTop: "15px",
    padding:
      "12px 0",
    borderTop:
      "1px solid rgba(23,61,45,0.1)",
    borderBottom:
      "1px solid rgba(23,61,45,0.1)",
    color: colors.dark,
    fontSize: "12px",
    lineHeight: 1.5,
  },

  metadataDot: {
    color: colors.gold,
    fontWeight: 900,
  },

  metadataLake: {
    minWidth: 0,
  },

  caption: {
    margin:
      "13px 0 0",
    color: "#59615A",
    lineHeight: 1.55,
    fontSize: "14px",
  },

  social: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginTop: "14px",
  },

  socialButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: 0,
    border: "none",
    background: "transparent",
    color: colors.muted,
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  deleteButton: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: 0,
    border: "none",
    background: "transparent",
    color: colors.danger,
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },

  time: {
    marginLeft: "auto",
    color: "#929991",
    fontSize: "11px",
  },

  /* ==========================================================
     BUBBLE CELEBRATION
  ========================================================== */

  celebrationOverlay: {
    position: "absolute",
    zIndex: 20,
    inset: 0,
    pointerEvents: "none",
    overflow: "hidden",
  },

  bubble: {
    position: "absolute",
    bottom: "-25px",
    display: "block",
    borderRadius: "50%",
    border:
      "2px solid rgba(255,255,255,0.65)",
    background:
      "rgba(255,255,255,0.18)",
    boxShadow:
      "0 0 12px rgba(255,255,255,0.18)",
    animationName:
      "bubbleRise",
    animationTimingFunction:
      "ease-out",
    animationIterationCount:
      1,
  },

  newCatchBadge: {
    position: "absolute",
    top: "18px",
    left: "50%",
    transform:
      "translateX(-50%)",
    padding:
      "9px 15px",
    borderRadius: "999px",
    background: colors.gold,
    color: colors.dark,
    fontSize: "12px",
    fontWeight: 900,
    boxShadow:
      "0 7px 18px rgba(0,0,0,0.22)",
  },

  /* ==========================================================
     TRIP CARD
  ========================================================== */

  tripCard: {
    marginTop: "25px",
    padding: "20px",
    borderRadius: "20px",
    background: colors.forest,
    color: colors.white,
    boxShadow:
      "0 10px 25px rgba(23,61,45,0.15)",
  },

  tripHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  tripEyebrow: {
    color: "#F0CF5A",
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: "2px",
  },

  tripTitle: {
    margin:
      "3px 0 0",
    fontSize: "21px",
  },

  tripStats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    marginTop: "20px",
    textAlign: "center",
  },

  tripStat: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  /* ==========================================================
     BOTTOM NAV
  ========================================================== */

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
    gap: "50px",
    background:
      "rgba(13,36,26,0.97)",
    borderTop:
      "1px solid rgba(255,255,255,0.12)",
    backdropFilter:
      "blur(18px)",
  },

  navActive: {
    border: "none",
    background: "transparent",
    color: "#F0CF5A",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "3px",
    fontSize: "10px",
    fontWeight: 900,
  },

  navItem: {
    border: "none",
    background: "transparent",
    color:
      "rgba(255,255,255,0.48)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "3px",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  /* ==========================================================
     POST MODAL
  ========================================================== */

  modalBackground: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    background:
      "rgba(5,15,10,0.76)",
    backdropFilter:
      "blur(5px)",
  },

  modal: {
    width: "100%",
    maxWidth: "700px",
    maxHeight: "92vh",
    overflowY: "auto",
    padding:
      "23px 18px 28px",
    borderRadius:
      "24px 24px 0 0",
    background: colors.paper,
    color: colors.dark,
  },

  modalHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    marginBottom: "19px",
  },

  modalTitle: {
    margin:
      "5px 0 0",
    fontSize: "27px",
    fontWeight: 900,
  },

  closeButton: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "none",
    background:
      "rgba(23,61,45,0.08)",
    color: colors.dark,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
    borderRadius: "12px",
    border:
      "1px solid rgba(23,61,45,0.15)",
    background: "#F8F6EF",
    color: colors.dark,
    fontSize: "15px",
    outline: "none",
  },

  twoInputs: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "9px",
  },

  photoButton: {
    minHeight: "52px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: "12px",
    border:
      `1px dashed ${colors.pine}`,
    color: colors.forest,
    background:
      "rgba(23,61,45,0.04)",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "14px",
  },

  selectedPhotos: {
    display: "flex",
    gap: "8px",
    overflowX: "auto",
    padding:
      "2px 0 5px",
  },

  selectedPhoto: {
    position: "relative",
    flexShrink: 0,
    width: "76px",
    height: "76px",
    borderRadius: "10px",
    overflow: "hidden",
    background: "#17211B",
  },

  selectedPhotoImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  removePhotoButton: {
    position: "absolute",
    top: "4px",
    right: "4px",
    width: "24px",
    height: "24px",
    padding: 0,
    borderRadius: "50%",
    border: "none",
    background:
      "rgba(0,0,0,0.72)",
    color: colors.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  submitButton: {
    padding: "15px",
    border: "none",
    borderRadius: "12px",
    background: colors.orange,
    color: colors.white,
    fontSize: "15px",
    fontWeight: 900,
    cursor: "pointer",
  },

  /* ==========================================================
     PHOTO VIEWER
  ========================================================== */

  viewerBackground: {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(4,10,7,0.97)",
    padding: "10px",
  },

  viewer: {
    width: "100%",
    maxWidth: "1000px",
    height: "100%",
    maxHeight: "900px",
    display: "flex",
    flexDirection: "column",
    color: colors.white,
  },

  viewerTop: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    padding:
      "8px 4px 12px",
  },

  viewerPerson: {
    color: "#F0CF5A",
    fontSize: "11px",
    fontWeight: 800,
    textTransform:
      "uppercase",
    letterSpacing:
      "1px",
  },

  viewerFish: {
    marginTop: "2px",
    fontSize: "20px",
    fontWeight: 900,
  },

  viewerClose: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    border:
      "1px solid rgba(255,255,255,0.16)",
    background:
      "rgba(255,255,255,0.08)",
    color: colors.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  viewerImageArea: {
    position: "relative",
    flex: 1,
    minHeight: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  zoomViewport: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  viewerImage: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    display: "block",
    transition:
      "transform 0.18s ease",
    transformOrigin:
      "center center",
  },

  viewerArrowLeft: {
    position: "absolute",
    zIndex: 5,
    left: "7px",
    top: "50%",
    transform:
      "translateY(-50%)",
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    border:
      "1px solid rgba(255,255,255,0.18)",
    background:
      "rgba(0,0,0,0.55)",
    color: colors.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  viewerArrowRight: {
    position: "absolute",
    zIndex: 5,
    right: "7px",
    top: "50%",
    transform:
      "translateY(-50%)",
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    border:
      "1px solid rgba(255,255,255,0.18)",
    background:
      "rgba(0,0,0,0.55)",
    color: colors.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  viewerControls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding:
      "12px 0 8px",
  },

  viewerControl: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border:
      "1px solid rgba(255,255,255,0.15)",
    background:
      "rgba(255,255,255,0.08)",
    color: colors.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  zoomPercentage: {
    minWidth: "58px",
    height: "40px",
    padding:
      "0 10px",
    borderRadius: "999px",
    border:
      "1px solid rgba(255,255,255,0.15)",
    background:
      "rgba(255,255,255,0.08)",
    color: colors.white,
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },

  viewerCounter: {
    textAlign: "center",
    color:
      "rgba(255,255,255,0.55)",
    fontSize: "11px",
    paddingBottom: "8px",
  },

  viewerDetails: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "7px 14px",
    padding:
      "11px 8px",
    borderTop:
      "1px solid rgba(255,255,255,0.1)",
    color:
      "rgba(255,255,255,0.8)",
    fontSize: "12px",
  },

  viewerCaption: {
    margin:
      "5px 8px 8px",
    textAlign: "center",
    color:
      "rgba(255,255,255,0.55)",
    fontSize: "13px",
    lineHeight: 1.5,
  },
};

/* ============================================================
   BUBBLE ANIMATION
============================================================ */

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
        transform: translateY(0) scale(0.65);
        opacity: 0;
      }

      15% {
        opacity: 0.9;
      }

      100% {
        transform: translateY(-420px) translateX(25px) scale(1);
        opacity: 0;
      }
    }

    * {
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      padding: 0;
      background: #F4F0E6;
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
      width: 7px;
      height: 7px;
    }

    ::-webkit-scrollbar-track {
      background: transparent;
    }

    ::-webkit-scrollbar-thumb {
      background: rgba(23,61,45,0.25);
      border-radius: 999px;
    }
  `;

  document.head.appendChild(styleTag);
}
