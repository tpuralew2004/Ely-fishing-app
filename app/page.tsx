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
  Trash2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Image as ImageIcon,
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

type ViewerState = {
  item: Catch;
  photos: string[];
  index: number;
};

const colors = {
  forest: "#173A2A",
  darkForest: "#0C2118",
  deepest: "#07130E",
  lake: "#2D7C91",
  lakeLight: "#72B7C4",
  cream: "#F4EFE3",
  warmWhite: "#FFFDF7",
  gold: "#D9A441",
  orange: "#C96A3D",
  red: "#B94A42",
  textDark: "#18241D",
  muted: "#68746B",
  line: "#D8D1C2",
};

const BUBBLES = Array.from({ length: 22 }, (_, index) => ({
  left: `${(index * 17) % 97}%`,
  delay: `${(index % 7) * 0.13}s`,
  duration: `${2.1 + (index % 5) * 0.28}s`,
  size: `${10 + (index % 5) * 5}px`,
  drift: `${-25 + (index % 7) * 9}px`,
}));

function getPhotoUrls(
  imageUrl: string | null | undefined
): string[] {
  if (!imageUrl) return [];

  try {
    const parsed = JSON.parse(imageUrl);

    if (
      Array.isArray(parsed) &&
      parsed.every(
        (value) => typeof value === "string"
      )
    ) {
      return parsed;
    }
  } catch {
    // Old posts contain one normal URL.
  }

  return [imageUrl];
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const seconds = Math.floor(
    (Date.now() - date.getTime()) / 1000
  );

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString();
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
  const [lake, setLake] =
    useState("White Iron Lake");
  const [caption, setCaption] = useState("");

  const [photoFiles, setPhotoFiles] = useState<File[]>(
    []
  );

  const [photoPreviews, setPhotoPreviews] =
    useState<string[]>([]);

  const [viewer, setViewer] =
    useState<ViewerState | null>(null);

  const [zoom, setZoom] = useState(1);

  const [celebrateId, setCelebrateId] =
    useState<number | null>(null);

  useEffect(() => {
    loadCatches();
  }, []);

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, [photoPreviews]);

  useEffect(() => {
    if (celebrateId === null) return;

    const timer = window.setTimeout(() => {
      setCelebrateId(null);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [celebrateId]);

  useEffect(() => {
    if (!viewer) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeViewer();
      }

      if (event.key === "ArrowLeft") {
        previousPhoto();
      }

      if (event.key === "ArrowRight") {
        nextPhoto();
      }

      if (event.key === "+") {
        zoomIn();
      }

      if (event.key === "-") {
        zoomOut();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [viewer]);

  async function loadCatches() {
    setLoading(true);

    const { data, error } = await supabase
      .from("catches")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (!error && data) {
      setCatches(data as Catch[]);
    } else if (error) {
      console.error(
        "Could not load catches:",
        error
      );
    }

    setLoading(false);
  }

  function resetPostForm() {
    setName("");
    setFishSpecies("");
    setLength("");
    setWeight("");
    setLake("White Iron Lake");
    setCaption("");
    setPhotoFiles([]);

    photoPreviews.forEach((url) =>
      URL.revokeObjectURL(url)
    );

    setPhotoPreviews([]);
  }

  function closePostModal() {
    if (posting) return;

    resetPostForm();
    setShowPost(false);
  }

  function handlePhotoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files || []
    );

    if (files.length === 0) return;

    const imageFiles = files.filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      alert("Please choose image files.");
      return;
    }

    if (imageFiles.length > 8) {
      alert(
        "You can add up to 8 photos to one catch."
      );
      return;
    }

    photoPreviews.forEach((url) =>
      URL.revokeObjectURL(url)
    );

    const previews = imageFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setPhotoFiles(imageFiles);
    setPhotoPreviews(previews);
  }

  function removeSelectedPhoto(index: number) {
    const newFiles = photoFiles.filter(
      (_, photoIndex) => photoIndex !== index
    );

    const newPreviews = photoPreviews.filter(
      (_, photoIndex) => photoIndex !== index
    );

    if (photoPreviews[index]) {
      URL.revokeObjectURL(
        photoPreviews[index]
      );
    }

    setPhotoFiles(newFiles);
    setPhotoPreviews(newPreviews);
  }

  async function postCatch() {
    if (
      !name.trim() ||
      !fishSpecies.trim() ||
      !length.trim() ||
      !lake.trim()
    ) {
      alert(
        "Please enter your name, fish species, length, and lake."
      );
      return;
    }

    if (Number(length) <= 0) {
      alert("Please enter a valid fish length.");
      return;
    }

    if (
      weight &&
      Number(weight) < 0
    ) {
      alert("Please enter a valid fish weight.");
      return;
    }

    setPosting(true);

    try {
      const uploadedUrls: string[] = [];

      for (const photo of photoFiles) {
        const extension =
          photo.name.split(".").pop() ||
          "jpg";

        const fileName =
          `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.${extension}`;

        const filePath =
          `private/${fileName}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from("catch-photos")
          .upload(
            filePath,
            photo
          );

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: signedData,
          error: signedError,
        } =
          await supabase.storage
            .from("catch-photos")
            .createSignedUrl(
              filePath,
              60 * 60 * 24 * 365
            );

        if (signedError) {
          throw signedError;
        }

        uploadedUrls.push(
          signedData.signedUrl
        );
      }

      let imageUrl: string | null = null;

      if (uploadedUrls.length === 1) {
        imageUrl = uploadedUrls[0];
      }

      if (uploadedUrls.length > 1) {
        imageUrl =
          JSON.stringify(uploadedUrls);
      }

      const {
        data,
        error,
      } = await supabase
        .from("catches")
        .insert({
          name: name.trim(),
          fish_species:
            fishSpecies.trim(),
          length: Number(length),
          weight: weight
            ? Number(weight)
            : null,
          lake: lake.trim(),
          caption:
            caption.trim() || null,
          image_url: imageUrl,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const newCatch =
          data as Catch;

        setCatches((current) => [
          newCatch,
          ...current,
        ]);

        setCelebrateId(
          newCatch.id
        );
      }

      resetPostForm();
      setShowPost(false);
    } catch (error) {
      console.error(
        "Posting error:",
        error
      );

      alert(
        "Something went wrong posting the catch."
      );
    } finally {
      setPosting(false);
    }
  }

  async function deleteCatch(
    id: number
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this catch?"
      );

    if (!confirmed) {
      return;
    }

    try {
      const {
        error,
      } = await supabase
        .from("catches")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      setCatches((current) =>
        current.filter(
          (item) => item.id !== id
        )
      );

      if (
        viewer &&
        viewer.item.id === id
      ) {
        setViewer(null);
      }
    } catch (error) {
      console.error(
        "Delete error:",
        error
      );

      alert(
        "Something went wrong deleting the catch. Supabase may need a DELETE policy."
      );
    }
  }

  function openViewer(
    item: Catch,
    index = 0
  ) {
    const photos =
      getPhotoUrls(
        item.image_url
      );

    if (photos.length === 0) {
      return;
    }

    setViewer({
      item,
      photos,
      index,
    });

    setZoom(1);
  }

  function closeViewer() {
    setViewer(null);
    setZoom(1);
  }

  function previousPhoto() {
    if (!viewer) return;

    const newIndex =
      viewer.index === 0
        ? viewer.photos.length - 1
        : viewer.index - 1;

    setViewer({
      ...viewer,
      index: newIndex,
    });

    setZoom(1);
  }

  function nextPhoto() {
    if (!viewer) return;

    const newIndex =
      viewer.index ===
      viewer.photos.length - 1
        ? 0
        : viewer.index + 1;

    setViewer({
      ...viewer,
      index: newIndex,
    });

    setZoom(1);
  }

  function zoomIn() {
    setZoom((current) =>
      Math.min(current + 0.25, 3)
    );
  }

  function zoomOut() {
    setZoom((current) =>
      Math.max(current - 0.25, 0.5)
    );
  }

  function resetZoom() {
    setZoom(1);
  }

  function handleImageWheel(
    event: React.WheelEvent
  ) {
    event.preventDefault();

    if (event.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  }

  return (
    <main style={styles.page}>
      <style>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: ${colors.deepest};
        }

        button,
        input,
        textarea {
          font-family: inherit;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        .ely-post-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(201,106,61,0.32) !important;
        }

        .ely-photo:hover img {
          transform: scale(1.015);
        }

        .ely-delete:hover {
          background: rgba(185,74,66,0.14) !important;
          border-color: rgba(185,74,66,0.4) !important;
        }

        .ely-thumbnail:hover {
          transform: translateY(-2px);
          opacity: 1 !important;
        }

        .ely-nav-button:hover {
          color: ${colors.gold} !important;
        }

        @keyframes bubbleRise {
          0% {
            opacity: 0;
            transform: translate3d(0, 45px, 0) scale(0.5);
          }

          15% {
            opacity: 0.9;
          }

          75% {
            opacity: 0.65;
          }

          100% {
            opacity: 0;
            transform:
              translate3d(var(--drift), -260px, 0)
              scale(1.1);
          }
        }

        @keyframes newCatchGlow {
          0% {
            box-shadow:
              0 0 0 rgba(217,164,65,0),
              0 12px 35px rgba(0,0,0,0.18);
          }

          30% {
            box-shadow:
              0 0 35px rgba(217,164,65,0.45),
              0 12px 35px rgba(0,0,0,0.18);
          }

          100% {
            box-shadow:
              0 0 0 rgba(217,164,65,0),
              0 12px 35px rgba(0,0,0,0.18);
          }
        }

        @keyframes softPulse {
          0%, 100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.04);
          }
        }

        @media (max-width: 600px) {
          .hero-title {
            font-size: 44px !important;
          }

          .catch-stats {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          .catch-stat {
            padding-bottom: 10px !important;
            border-bottom: 1px solid ${colors.line};
          }

          .catch-stat:last-child {
            border-bottom: none;
            padding-bottom: 0 !important;
          }

          .bottom-nav {
            gap: 26px !important;
          }

          .viewer-info {
            max-height: 34vh !important;
          }
        }

        @media (min-width: 800px) {
          .feed-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
          }

          .feed-grid > article {
            margin-bottom: 0 !important;
          }

          .feed-grid > article:first-child {
            grid-column: 1 / -1;
          }
        }
      `}</style>

      {/* =========================
          HERO
      ========================= */}

      <section style={styles.hero}>
        <div style={styles.heroImage} />

        <div style={styles.heroOverlay} />

        <div style={styles.heroContent}>
          <div style={styles.heroTopLabel}>
            FAMILY FISHING JOURNAL
          </div>

          {/* LOGO — NO CIRCLE */}
          <div style={styles.fishLogo}>
            <img
              src="/loon-logo.png.png"
              alt="Ely Fishing loon logo"
              style={styles.logoImage}
            />
          </div>

          <h1
            className="hero-title"
            style={styles.title}
          >
            Ely Fishing
          </h1>

          <p style={styles.subtitle}>
            White Iron Lake • Northern Minnesota
          </p>

          <div style={styles.heroRule}>
            <span />
            <span style={styles.heroRuleDot}>
              •
            </span>
            <span />
          </div>

          <div style={styles.locationCard}>
            <div style={styles.locationIcon}>
              <MapPin size={21} />
            </div>

            <div>
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

          <button
            className="ely-post-button"
            onClick={() =>
              setShowPost(true)
            }
            style={styles.postButton}
          >
            <Plus size={21} />
            Post a Catch
          </button>
        </div>
      </section>

      {/* =========================
          FEED
      ========================= */}

      <section style={styles.feed}>
        <div style={styles.feedIntro}>
          <div>
            <div style={styles.sectionEyebrow}>
              THE CATCH BOARD
            </div>

            <h2 style={styles.sectionTitle}>
              Recent Catches
            </h2>

            <p style={styles.sectionDescription}>
              The newest fish are always at the top.
            </p>
          </div>

          <div style={styles.fishBadge}>
            <Fish size={23} />
          </div>
        </div>

        {loading && (
          <div style={styles.loadingCard}>
            <Fish
              size={30}
              style={{
                animation:
                  "softPulse 1.2s infinite",
              }}
            />

            <span>
              Loading the catch board...
            </span>
          </div>
        )}

        {!loading &&
          catches.length === 0 && (
            <div style={styles.emptyCard}>
              <div style={styles.emptyIcon}>
                <Fish size={42} />
              </div>

              <h3 style={styles.emptyTitle}>
                No catches yet
              </h3>

              <p style={styles.emptyText}>
                Be the first person to post
                a fish from the trip.
              </p>

              <button
                onClick={() =>
                  setShowPost(true)
                }
                style={styles.emptyButton}
              >
                <Plus size={18} />
                Post the first catch
              </button>
            </div>
          )}

        {!loading &&
          catches.length > 0 && (
            <div className="feed-grid">
              {catches.map((item) => {
                const photos =
                  getPhotoUrls(
                    item.image_url
                  );

                const isNew =
                  celebrateId ===
                  item.id;

                return (
                  <article
                    key={item.id}
                    style={{
                      ...styles.catchCard,
                      ...(isNew
                        ? {
                            animation:
                              "newCatchGlow 3s ease-out",
                          }
                        : {}),
                    }}
                  >
                    {/* PHOTO AREA */}

                    {photos.length > 0 && (
                      <div
                        className="ely-photo"
                        style={
                          styles.photoSection
                        }
                      >
                        <button
                          onClick={() =>
                            openViewer(
                              item,
                              0
                            )
                          }
                          style={
                            styles.mainPhotoButton
                          }
                          aria-label="Open catch photo"
                        >
                          <img
                            src={photos[0]}
                            alt={`${item.fish_species} caught by ${item.name}`}
                            style={
                              styles.catchImage
                            }
                          />

                          <div
                            style={
                              styles.photoOpenHint
                            }
                          >
                            <ImageIcon
                              size={16}
                            />

                            <span>
                              Tap to enlarge
                            </span>
                          </div>
                        </button>

                        {photos.length > 1 && (
                          <div
                            style={
                              styles.thumbnailRow
                            }
                          >
                            {photos.map(
                              (
                                photoUrl,
                                photoIndex
                              ) => (
                                <button
                                  key={
                                    photoIndex
                                  }
                                  className="ely-thumbnail"
                                  onClick={() =>
                                    openViewer(
                                      item,
                                      photoIndex
                                    )
                                  }
                                  style={{
                                    ...styles.thumbnail,
                                    opacity:
                                      photoIndex ===
                                      0
                                        ? 1
                                        : 0.72,
                                  }}
                                >
                                  <img
                                    src={
                                      photoUrl
                                    }
                                    alt={`Catch photo ${photoIndex + 1}`}
                                    style={
                                      styles.thumbnailImage
                                    }
                                  />

                                  {photoIndex ===
                                    0 && (
                                    <span
                                      style={
                                        styles.coverPhotoLabel
                                      }
                                    >
                                      Main
                                    </span>
                                  )}
                                </button>
                              )
                            )}

                            <span
                              style={
                                styles.photoCount
                              }
                            >
                              {photos.length}{" "}
                              photos
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* BUBBLES */}

                    {isNew && (
                      <div
                        style={
                          styles.bubbleLayer
                        }
                        aria-hidden="true"
                      >
                        {BUBBLES.map(
                          (
                            bubble,
                            index
                          ) => (
                            <span
                              key={index}
                              style={{
                                ...styles.bubble,
                                left:
                                  bubble.left,
                                width:
                                  bubble.size,
                                height:
                                  bubble.size,
                                animationDelay:
                                  bubble.delay,
                                animationDuration:
                                  bubble.duration,
                                "--drift":
                                  bubble.drift,
                              } as React.CSSProperties}
                            />
                          )
                        )}
                      </div>
                    )}

                    {/* CATCH CONTENT */}

                    <div
                      style={
                        styles.catchContent
                      }
                    >
                      <div
                        style={
                          styles.catchHeader
                        }
                      >
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

                        <div
                          style={
                            styles.catchActions
                          }
                        >
                          <Fish
                            size={22}
                            color={
                              colors.lake
                            }
                          />

                          <button
                            className="ely-delete"
                            onClick={() =>
                              deleteCatch(
                                item.id
                              )
                            }
                            style={
                              styles.deleteButton
                            }
                            title="Delete catch"
                            aria-label="Delete catch"
                          >
                            <Trash2
                              size={17}
                            />
                          </button>
                        </div>
                      </div>

                      {/* CLEAR METADATA */}

                      <div
                        className="catch-stats"
                        style={
                          styles.catchStats
                        }
                      >
                        <div
                          className="catch-stat"
                          style={
                            styles.catchStat
                          }
                        >
                          <span
                            style={
                              styles.statLabel
                            }
                          >
                            LENGTH
                          </span>

                          <strong
                            style={
                              styles.statValue
                            }
                          >
                            {item.length} in
                          </strong>
                        </div>

                        <div
                          className="catch-stat"
                          style={
                            styles.catchStat
                          }
                        >
                          <span
                            style={
                              styles.statLabel
                            }
                          >
                            WEIGHT
                          </span>

                          <strong
                            style={
                              styles.statValue
                            }
                          >
                            {item.weight !==
                            null
                              ? `${item.weight} lb`
                              : "—"}
                          </strong>
                        </div>

                        <div
                          className="catch-stat"
                          style={
                            styles.catchStat
                          }
                        >
                          <span
                            style={
                              styles.statLabel
                            }
                          >
                            LAKE
                          </span>

                          <strong
                            style={{
                              ...styles.statValue,
                              color:
                                colors.lake,
                            }}
                          >
                            {item.lake}
                          </strong>
                        </div>
                      </div>

                      <div
                        style={
                          styles.metadataLine
                        }
                      >
                        Length —{" "}
                        {item.length} in
                        <span>
                          •
                        </span>
                        Weight —{" "}
                        {item.weight !==
                        null
                          ? `${item.weight} lb`
                          : "Not recorded"}
                        <span>
                          •
                        </span>
                        Lake — {item.lake}
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
                          <Heart
                            size={17}
                          />
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

                        <span
                          style={
                            styles.time
                          }
                        >
                          {formatTimeAgo(
                            item.created_at
                          )}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

        {/* =========================
            TRIP STATS
        ========================= */}

        <div style={styles.tripCard}>
          <div
            style={
              styles.tripHeader
            }
          >
            <div style={styles.trophyCircle}>
              <Trophy size={22} />
            </div>

            <div>
              <div
                style={
                  styles.sectionEyebrow
                }
              >
                THIS TRIP
              </div>

              <h2
                style={
                  styles.tripTitle
                }
              >
                Trip Stats
              </h2>
            </div>
          </div>

          <div
            style={
              styles.tripStats
            }
          >
            <div
              style={
                styles.tripStat
              }
            >
              <strong>
                {catches.length}
              </strong>

              <span>
                CATCHES
              </span>
            </div>

            <div
              style={
                styles.tripStat
              }
            >
              <strong>
                {
                  new Set(
                    catches.map(
                      (c) =>
                        c.name
                    )
                  ).size
                }
              </strong>

              <span>
                FISHERMEN
              </span>
            </div>

            <div
              style={
                styles.tripStat
              }
            >
              <strong>
                🐟
              </strong>

              <span>
                WHITE IRON
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          BOTTOM NAV
      ========================= */}

      <nav
        className="bottom-nav"
        style={styles.nav}
      >
        <button
          className="ely-nav-button"
          style={styles.navActive}
        >
          <Fish size={21} />
          <span>Feed</span>
        </button>

        <button
          className="ely-nav-button"
          onClick={() => {
            window.location.href =
              "/fishing-location";
          }}
          style={styles.navItem}
        >
          <MapPin size={21} />
          <span>Fishing</span>
        </button>

        <button
          className="ely-nav-button"
          style={styles.navItem}
        >
          <Trophy size={21} />
          <span>Leaders</span>
        </button>

        <button
          className="ely-nav-button"
          style={styles.navItem}
        >
          <Users size={21} />
          <span>Family</span>
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
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closePostModal();
            }
          }}
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

                <h2
                  style={
                    styles.modalTitle
                  }
                >
                  Post Your Fish
                </h2>

                <p
                  style={
                    styles.modalSubtitle
                  }
                >
                  Add up to 8 photos of
                  the catch.
                </p>
              </div>

              <button
                onClick={
                  closePostModal
                }
                style={
                  styles.closeButton
                }
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={
                styles.form
              }
            >
              <input
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                placeholder="Your name"
                style={
                  styles.input
                }
              />

              <input
                value={fishSpecies}
                onChange={(event) =>
                  setFishSpecies(
                    event.target.value
                  )
                }
                placeholder="Fish species"
                style={
                  styles.input
                }
              />

              <div
                style={
                  styles.twoInputs
                }
              >
                <input
                  value={length}
                  onChange={(event) =>
                    setLength(
                      event.target.value
                    )
                  }
                  placeholder="Length (in)"
                  type="number"
                  min="0"
                  step="0.1"
                  style={
                    styles.input
                  }
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
                  min="0"
                  step="0.1"
                  style={
                    styles.input
                  }
                />
              </div>

              <input
                value={lake}
                onChange={(event) =>
                  setLake(
                    event.target.value
                  )
                }
                placeholder="Lake"
                style={
                  styles.input
                }
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
                  resize: "vertical",
                }}
              />

              <label
                style={
                  styles.photoButton
                }
              >
                <Camera size={21} />

                <div>
                  <strong>
                    {photoFiles.length >
                    0
                      ? `${photoFiles.length} photo${
                          photoFiles.length ===
                          1
                            ? ""
                            : "s"
                        } selected`
                      : "Add photos"}
                  </strong>

                  <span
                    style={
                      styles.photoButtonHint
                    }
                  >
                    Choose up to 8
                  </span>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{
                    display:
                      "none",
                  }}
                  onChange={
                    handlePhotoChange
                  }
                />
              </label>

              {photoPreviews.length >
                0 && (
                <div
                  style={
                    styles.previewGrid
                  }
                >
                  {photoPreviews.map(
                    (
                      preview,
                      index
                    ) => (
                      <div
                        key={preview}
                        style={
                          styles.previewItem
                        }
                      >
                        <img
                          src={preview}
                          alt={`Selected photo ${
                            index + 1
                          }`}
                          style={
                            styles.previewImage
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
                            styles.previewRemove
                          }
                        >
                          <X
                            size={15}
                          />
                        </button>

                        {index ===
                          0 && (
                          <span
                            style={
                              styles.previewMain
                            }
                          >
                            Main
                          </span>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}

              <button
                onClick={
                  postCatch
                }
                disabled={
                  posting
                }
                style={{
                  ...styles.submitButton,
                  opacity:
                    posting
                      ? 0.65
                      : 1,
                }}
              >
                {posting ? (
                  "Posting Catch..."
                ) : (
                  <>
                    <Fish
                      size={19}
                    />
                    Post Catch
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================
          PHOTO VIEWER
      ========================= */}

      {viewer && (
        <div
          style={
            styles.viewerBackground
          }
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeViewer();
            }
          }}
        >
          <div
            style={
              styles.viewer
            }
          >
            <div
              style={
                styles.viewerTop
              }
            >
              <div>
                <div
                  style={
                    styles.viewerEyebrow
                  }
                >
                  {viewer.item.name}
                </div>

                <h2
                  style={
                    styles.viewerTitle
                  }
                >
                  {
                    viewer.item
                      .fish_species
                  }
                </h2>
              </div>

              <button
                onClick={
                  closeViewer
                }
                style={
                  styles.viewerClose
                }
              >
                <X size={23} />
              </button>
            </div>

            <div
              style={
                styles.viewerImageArea
              }
              onWheel={
                handleImageWheel
              }
            >
              {viewer.photos.length >
                1 && (
                <button
                  onClick={
                    previousPhoto
                  }
                  style={{
                    ...styles.viewerArrow,
                    left: "14px",
                  }}
                  aria-label="Previous photo"
                >
                  <ChevronLeft
                    size={28}
                  />
                </button>
              )}

              <img
                src={
                  viewer.photos[
                    viewer.index
                  ]
                }
                alt={
                  viewer.item
                    .fish_species
                }
                style={{
                  ...styles.viewerImage,
                  transform: `scale(${zoom})`,
                }}
              />

              {viewer.photos.length >
                1 && (
                <button
                  onClick={
                    nextPhoto
                  }
                  style={{
                    ...styles.viewerArrow,
                    right: "14px",
                  }}
                  aria-label="Next photo"
                >
                  <ChevronRight
                    size={28}
                  />
                </button>
              )}
            </div>

            <div
              style={
                styles.viewerControls
              }
            >
              <button
                onClick={
                  zoomOut
                }
                style={
                  styles.viewerControl
                }
              >
                <ZoomOut
                  size={18}
                />
              </button>

              <span
                style={
                  styles.zoomText
                }
              >
                {Math.round(
                  zoom * 100
                )}
                %
              </span>

              <button
                onClick={
                  zoomIn
                }
                style={
                  styles.viewerControl
                }
              >
                <ZoomIn
                  size={18}
                />
              </button>

              <button
                onClick={
                  resetZoom
                }
                style={
                  styles.viewerControl
                }
              >
                <RotateCcw
                  size={17}
                />
              </button>
            </div>

            {viewer.photos.length >
              1 && (
              <div
                style={
                  styles.viewerCounter
                }
              >
                Photo{" "}
                {viewer.index + 1}{" "}
                of{" "}
                {
                  viewer.photos
                    .length
                }
              </div>
            )}

            <div
              className="viewer-info"
              style={
                styles.viewerInfo
              }
            >
              <div
                style={
                  styles.viewerMetadata
                }
              >
                <div>
                  <span>
                    LENGTH
                  </span>

                  <strong>
                    {
                      viewer.item
                        .length
                    }{" "}
                    in
                  </strong>
                </div>

                <div>
                  <span>
                    WEIGHT
                  </span>

                  <strong>
                    {viewer.item
                      .weight !==
                    null
                      ? `${viewer.item.weight} lb`
                      : "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    LAKE
                  </span>

                  <strong>
                    {
                      viewer.item
                        .lake
                    }
                  </strong>
                </div>
              </div>

              {viewer.item
                .caption && (
                <p
                  style={
                    styles.viewerCaption
                  }
                >
                  {
                    viewer.item
                      .caption
                  }
                </p>
              )}
            </div>
          </div>
        </div>
      )}
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
    background: colors.cream,
    color: colors.textDark,
    paddingBottom: "92px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  /* =========================
     HERO
  ========================= */

  hero: {
    position: "relative",
    minHeight: "620px",
    overflow: "hidden",
    color: "#fff",
  },

  heroImage: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "url('/minnesota-sunset.jpg.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    transform: "scale(1.02)",
  },

  heroOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to bottom, rgba(5,18,12,0.20) 0%, rgba(5,18,12,0.36) 45%, rgba(7,19,14,0.94) 100%)",
  },

  heroContent: {
    position: "relative",
    zIndex: 2,
    maxWidth: "900px",
    margin: "0 auto",
    padding:
      "42px 22px 38px",
    textAlign: "center",
  },

  heroTopLabel: {
    display: "inline-block",
    padding:
      "8px 13px",
    border:
      "1px solid rgba(255,255,255,0.35)",
    borderRadius: "999px",
    background:
      "rgba(0,0,0,0.18)",
    color:
      "rgba(255,255,255,0.9)",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "2.5px",
  },

  fishLogo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin:
      "22px auto 4px",
    background:
      "transparent",
    border: "none",
    boxShadow: "none",
  },

  logoImage: {
    width: "170px",
    height: "170px",
    objectFit: "contain",
    display: "block",
  },

  title: {
    margin:
      "5px 0 0",
    fontSize: "52px",
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: "-2.5px",
    textShadow:
      "0 5px 22px rgba(0,0,0,0.35)",
  },

  subtitle: {
    margin:
      "13px 0 0",
    fontSize: "15px",
    color:
      "rgba(255,255,255,0.84)",
    letterSpacing: "0.3px",
  },

  heroRule: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    margin:
      "20px auto 0",
    width: "170px",
  },

  heroRuleDot: {
    color: colors.gold,
    fontSize: "18px",
  },

  locationCard: {
    margin:
      "43px auto 0",
    maxWidth: "540px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "16px",
    textAlign: "left",
    borderRadius: "16px",
    background:
      "rgba(8,29,19,0.76)",
    border:
      "1px solid rgba(255,255,255,0.22)",
    backdropFilter:
      "blur(14px)",
    boxShadow:
      "0 18px 45px rgba(0,0,0,0.28)",
  },

  locationIcon: {
    flexShrink: 0,
    width: "46px",
    height: "46px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background:
      colors.gold,
    color:
      colors.darkForest,
  },

  locationLabel: {
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: "2px",
    color:
      "rgba(255,255,255,0.58)",
  },

  locationTitle: {
    marginTop: "3px",
    fontSize: "17px",
    fontWeight: 900,
  },

  locationSub: {
    marginTop: "3px",
    fontSize: "12px",
    color:
      "rgba(255,255,255,0.62)",
  },

  postButton: {
    width: "100%",
    maxWidth: "540px",
    margin:
      "12px auto 0",
    padding: "17px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    border: "none",
    borderRadius: "13px",
    background:
      colors.orange,
    color: "#fff",
    fontSize: "16px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow:
      "0 10px 25px rgba(201,106,61,0.24)",
    transition:
      "all 0.2s ease",
  },

  /* =========================
     FEED
  ========================= */

  feed: {
    maxWidth: "980px",
    margin: "0 auto",
    padding:
      "32px 20px 40px",
  },

  feedIntro: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent:
      "space-between",
    marginBottom: "22px",
  },

  sectionEyebrow: {
    color:
      colors.orange,
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "2.6px",
  },

  sectionTitle: {
    margin:
      "5px 0 0",
    fontSize: "30px",
    lineHeight: 1,
    fontWeight: 900,
    color:
      colors.forest,
    letterSpacing:
      "-1px",
  },

  sectionDescription: {
    margin:
      "8px 0 0",
    color:
      colors.muted,
    fontSize: "13px",
  },

  fishBadge: {
    width: "48px",
    height: "48px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "14px",
    background:
      colors.forest,
    color:
      colors.gold,
    boxShadow:
      "0 8px 20px rgba(23,58,42,0.15)",
  },

  loadingCard: {
    minHeight: "160px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    color:
      colors.muted,
  },

  emptyCard: {
    padding:
      "45px 20px",
    border:
      `1px solid ${colors.line}`,
    borderRadius: "18px",
    background:
      colors.warmWhite,
    textAlign: "center",
  },

  emptyIcon: {
    width: "76px",
    height: "76px",
    margin:
      "0 auto 15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background:
      "#E5EEE8",
    color:
      colors.forest,
  },

  emptyTitle: {
    margin: 0,
    color:
      colors.forest,
    fontSize: "23px",
  },

  emptyText: {
    margin:
      "8px 0 20px",
    color:
      colors.muted,
  },

  emptyButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding:
      "12px 16px",
    border: "none",
    borderRadius: "10px",
    background:
      colors.forest,
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },

  /* =========================
     CATCH CARD
  ========================= */

  catchCard: {
    position: "relative",
    overflow: "hidden",
    marginBottom: "18px",
    border:
      `1px solid ${colors.line}`,
    borderRadius: "18px",
    background:
      colors.warmWhite,
    boxShadow:
      "0 12px 35px rgba(37,45,39,0.10)",
  },

  photoSection: {
    position: "relative",
    background:
      "#111B16",
  },

  mainPhotoButton: {
    position: "relative",
    width: "100%",
    minHeight: "280px",
    maxHeight: "520px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    border: "none",
    background:
      "#111B16",
    cursor: "zoom-in",
    overflow: "hidden",
  },

  catchImage: {
    width: "100%",
    height: "auto",
    maxHeight: "520px",
    objectFit: "contain",
    display: "block",
    transition:
      "transform 0.25s ease",
  },

  photoOpenHint: {
    position: "absolute",
    right: "12px",
    bottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding:
      "7px 10px",
    borderRadius: "999px",
    background:
      "rgba(0,0,0,0.68)",
    color: "#fff",
    fontSize: "11px",
    fontWeight: 800,
  },

  thumbnailRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding:
      "10px 12px",
    overflowX: "auto",
    background:
      "#0D1712",
  },

  thumbnail: {
    position: "relative",
    flexShrink: 0,
    width: "60px",
    height: "52px",
    padding: 0,
    border:
      "1px solid rgba(255,255,255,0.18)",
    borderRadius: "8px",
    overflow: "hidden",
    background:
      "#17221B",
    cursor: "pointer",
    transition:
      "all 0.2s ease",
  },

  thumbnailImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  coverPhotoLabel: {
    position: "absolute",
    left: "4px",
    bottom: "4px",
    padding:
      "2px 4px",
    borderRadius: "4px",
    background:
      "rgba(0,0,0,0.68)",
    color: "#fff",
    fontSize: "7px",
    fontWeight: 900,
    textTransform:
      "uppercase",
  },

  photoCount: {
    flexShrink: 0,
    marginLeft: "2px",
    color:
      "rgba(255,255,255,0.58)",
    fontSize: "11px",
    fontWeight: 800,
  },

  catchContent: {
    padding: "18px",
  },

  catchHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent:
      "space-between",
    gap: "12px",
  },

  catchPerson: {
    color:
      colors.orange,
    fontSize: "12px",
    fontWeight: 900,
    letterSpacing:
      "0.4px",
  },

  fishName: {
    margin:
      "3px 0 0",
    color:
      colors.forest,
    fontSize: "26px",
    lineHeight: 1.05,
    fontWeight: 900,
    letterSpacing:
      "-0.8px",
  },

  catchActions: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  deleteButton: {
    width: "35px",
    height: "35px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border:
      "1px solid rgba(185,74,66,0.20)",
    borderRadius: "9px",
    background:
      "rgba(185,74,66,0.06)",
    color:
      colors.red,
    cursor: "pointer",
    transition:
      "all 0.2s ease",
  },

  catchStats: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr 1.4fr",
    gap: "10px",
    marginTop: "17px",
    padding:
      "13px 0",
    borderTop:
      `1px solid ${colors.line}`,
    borderBottom:
      `1px solid ${colors.line}`,
  },

  catchStat: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: 0,
  },

  statLabel: {
    color:
      colors.muted,
    fontSize: "8px",
    fontWeight: 900,
    letterSpacing: "1.8px",
  },

  statValue: {
    color:
      colors.forest,
    fontSize: "14px",
    fontWeight: 900,
    overflow: "hidden",
    textOverflow:
      "ellipsis",
    whiteSpace:
      "nowrap",
  },

  metadataLine: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "7px",
    marginTop: "13px",
    color:
      colors.muted,
    fontSize: "11px",
    fontWeight: 700,
  },

  caption: {
    margin:
      "14px 0 0",
    color:
      "#455249",
    fontSize: "14px",
    lineHeight: 1.55,
  },

  social: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginTop: "15px",
    paddingTop:
      "13px",
    borderTop:
      `1px solid ${colors.line}`,
  },

  socialButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: 0,
    border: "none",
    background:
      "transparent",
    color:
      colors.muted,
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
  },

  time: {
    marginLeft: "auto",
    color:
      "#9A9F99",
    fontSize: "11px",
  },

  bubbleLayer: {
    position: "absolute",
    inset: 0,
    zIndex: 20,
    pointerEvents: "none",
    overflow: "hidden",
  },

  bubble: {
    position: "absolute",
    bottom: "20%",
    border:
      "2px solid rgba(255,255,255,0.7)",
    borderRadius: "50%",
    background:
      "rgba(255,255,255,0.12)",
    animation:
      "bubbleRise 2.5s ease-out forwards",
    "--drift": "0px",
  } as React.CSSProperties,

  /* =========================
     TRIP STATS
  ========================= */

  tripCard: {
    marginTop: "28px",
    padding: "20px",
    borderRadius: "17px",
    background:
      colors.forest,
    color: "#fff",
    boxShadow:
      "0 12px 28px rgba(23,58,42,0.16)",
  },

  tripHeader: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
  },

  trophyCircle: {
    width: "43px",
    height: "43px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    background:
      "rgba(217,164,65,0.15)",
    color:
      colors.gold,
  },

  tripTitle: {
    margin:
      "3px 0 0",
    fontSize: "23px",
    fontWeight: 900,
  },

  tripStats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3,1fr)",
    marginTop: "22px",
    paddingTop: "17px",
    borderTop:
      "1px solid rgba(255,255,255,0.12)",
  },

  tripStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "5px",
    textAlign: "center",
  },

  /* =========================
     NAV
  ========================= */

  nav: {
    position: "fixed",
    zIndex: 80,
    bottom: 0,
    left: 0,
    right: 0,
    height: "75px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "55px",
    background:
      "rgba(12,33,24,0.97)",
    borderTop:
      "1px solid rgba(255,255,255,0.10)",
    boxShadow:
      "0 -8px 25px rgba(0,0,0,0.12)",
    backdropFilter:
      "blur(16px)",
  },

  navActive: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    padding: 0,
    border: "none",
    background:
      "transparent",
    color:
      colors.gold,
    fontSize: "10px",
    fontWeight: 900,
    cursor: "pointer",
  },

  navItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    padding: 0,
    border: "none",
    background:
      "transparent",
    color:
      "rgba(255,255,255,0.48)",
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
    transition:
      "color 0.2s ease",
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
      "rgba(3,10,7,0.74)",
    backdropFilter:
      "blur(5px)",
  },

  modal: {
    width: "100%",
    maxWidth: "680px",
    maxHeight: "94vh",
    overflowY: "auto",
    padding:
      "25px 20px 32px",
    borderRadius:
      "22px 22px 0 0",
    background:
      colors.warmWhite,
    border:
      `1px solid ${colors.line}`,
    color:
      colors.textDark,
  },

  modalHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    gap: "15px",
    marginBottom:
      "20px",
  },

  modalTitle: {
    margin:
      "5px 0 0",
    color:
      colors.forest,
    fontSize: "28px",
    fontWeight: 900,
  },

  modalSubtitle: {
    margin:
      "6px 0 0",
    color:
      colors.muted,
    fontSize: "12px",
  },

  closeButton: {
    width: "40px",
    height: "40px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border:
      `1px solid ${colors.line}`,
    borderRadius: "10px",
    background:
      "#ECE7DB",
    color:
      colors.forest,
    cursor: "pointer",
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
    padding:
      "14px 13px",
    border:
      `1px solid ${colors.line}`,
    borderRadius: "10px",
    background:
      "#FAF8F2",
    color:
      colors.textDark,
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
    minHeight: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    gap: "10px",
    border:
      `1px dashed ${colors.gold}`,
    borderRadius: "11px",
    background:
      "#FBF7EA",
    color:
      colors.forest,
    cursor: "pointer",
  },

  photoButtonHint: {
    display: "block",
    marginTop: "2px",
    color:
      colors.muted,
    fontSize: "10px",
  },

  previewGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, 1fr)",
    gap: "8px",
  },

  previewItem: {
    position: "relative",
    aspectRatio: "1",
    overflow: "hidden",
    borderRadius: "9px",
    background:
      "#D9D4C8",
  },

  previewImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  previewRemove: {
    position: "absolute",
    top: "5px",
    right: "5px",
    width: "25px",
    height: "25px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    borderRadius: "50%",
    background:
      "rgba(0,0,0,0.68)",
    color: "#fff",
    cursor: "pointer",
  },

  previewMain: {
    position: "absolute",
    left: "5px",
    bottom: "5px",
    padding:
      "3px 5px",
    borderRadius: "4px",
    background:
      colors.gold,
    color:
      colors.darkForest,
    fontSize: "8px",
    fontWeight: 900,
  },

  submitButton: {
    minHeight: "52px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    gap: "8px",
    padding:
      "14px",
    border: "none",
    borderRadius: "11px",
    background:
      colors.forest,
    color: "#fff",
    fontSize: "15px",
    fontWeight: 900,
    cursor: "pointer",
  },

  /* =========================
     PHOTO VIEWER
  ========================= */

  viewerBackground: {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    padding: "14px",
    background:
      "rgba(3,8,5,0.94)",
    backdropFilter:
      "blur(8px)",
  },

  viewer: {
    width: "100%",
    maxWidth: "1050px",
    maxHeight: "96vh",
    display: "flex",
    flexDirection:
      "column",
    overflow: "hidden",
    border:
      "1px solid rgba(255,255,255,0.12)",
    borderRadius: "17px",
    background:
      "#08130E",
    color: "#fff",
    boxShadow:
      "0 30px 90px rgba(0,0,0,0.55)",
  },

  viewerTop: {
    flexShrink: 0,
    display: "flex",
    alignItems: "flex-start",
    justifyContent:
      "space-between",
    gap: "15px",
    padding:
      "15px 16px",
    borderBottom:
      "1px solid rgba(255,255,255,0.08)",
  },

  viewerEyebrow: {
    color:
      colors.gold,
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: "2px",
  },

  viewerTitle: {
    margin:
      "3px 0 0",
    fontSize: "21px",
    fontWeight: 900,
  },

  viewerClose: {
    width: "39px",
    height: "39px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    flexShrink: 0,
    border:
      "1px solid rgba(255,255,255,0.15)",
    borderRadius: "10px",
    background:
      "rgba(255,255,255,0.08)",
    color: "#fff",
    cursor: "pointer",
  },

  viewerImageArea: {
    position: "relative",
    flex: "1 1 auto",
    minHeight: "280px",
    maxHeight: "65vh",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    overflow: "hidden",
    background:
      "#020705",
  },

  viewerImage: {
    maxWidth: "100%",
    maxHeight: "65vh",
    width: "auto",
    height: "auto",
    objectFit: "contain",
    display: "block",
    transition:
      "transform 0.18s ease",
    userSelect: "none",
  },

  viewerArrow: {
    position: "absolute",
    top: "50%",
    zIndex: 5,
    width: "45px",
    height: "45px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    border:
      "1px solid rgba(255,255,255,0.18)",
    borderRadius: "50%",
    background:
      "rgba(0,0,0,0.58)",
    color: "#fff",
    cursor: "pointer",
    transform:
      "translateY(-50%)",
  },

  viewerControls: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    gap: "8px",
    padding:
      "10px",
    borderTop:
      "1px solid rgba(255,255,255,0.08)",
  },

  viewerControl: {
    width: "38px",
    height: "38px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    border:
      "1px solid rgba(255,255,255,0.12)",
    borderRadius: "9px",
    background:
      "rgba(255,255,255,0.07)",
    color: "#fff",
    cursor: "pointer",
  },

  zoomText: {
    minWidth: "50px",
    textAlign: "center",
    color:
      "rgba(255,255,255,0.65)",
    fontSize: "12px",
    fontWeight: 800,
  },

  viewerCounter: {
    flexShrink: 0,
    textAlign: "center",
    padding:
      "0 0 8px",
    color:
      "rgba(255,255,255,0.5)",
    fontSize: "10px",
    fontWeight: 800,
  },

  viewerInfo: {
    flexShrink: 0,
    padding:
      "14px 16px 17px",
    borderTop:
      "1px solid rgba(255,255,255,0.08)",
    overflowY: "auto",
  },

  viewerMetadata: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3,1fr)",
    gap: "10px",
  },

  viewerCaption: {
    margin:
      "12px 0 0",
    color:
      "rgba(255,255,255,0.68)",
    fontSize: "13px",
    lineHeight: 1.5,
  },
};
