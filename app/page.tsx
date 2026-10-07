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
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Images,
  Sparkles,
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
  forest: "#12352A",
  deepForest: "#071D17",
  lake: "#286B78",
  lakeDark: "#153E48",
  sunset: "#E97845",
  gold: "#E9B949",
  cream: "#F6F1E6",
  paper: "#FFFDF7",
  ink: "#17312A",
  muted: "#6B756F",
  white: "#FFFFFF",
};

const FAMILY_CODE = "Nofireplease123";
const ACCESS_KEY = "ely-fishing-family-access";

/*
  image_url originally contained one normal URL.

  New posts can contain:
  [
    "photo-url-1",
    "photo-url-2",
    "photo-url-3"
  ]

  Older posts containing one normal URL still work.
*/
function getPhotoUrls(imageUrl: string | null): string[] {
  if (!imageUrl) return [];

  try {
    const parsed = JSON.parse(imageUrl);

    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item) => typeof item === "string"
      );
    }
  } catch {
    // Old posts contain one normal URL.
  }

  return [imageUrl];
}

function formatDate(date: string) {
  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "Recently";
  }

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Home() {
  const [catches, setCatches] = useState<Catch[]>([]);
  const [loading, setLoading] = useState(true);

  const [accessGranted, setAccessGranted] =
    useState(false);

  const [familyCode, setFamilyCode] =
    useState("");

  const [codeError, setCodeError] =
    useState("");

  const [showPost, setShowPost] =
    useState(false);

  const [posting, setPosting] =
    useState(false);

  const [name, setName] =
    useState("");

  const [fishSpecies, setFishSpecies] =
    useState("");

  const [length, setLength] =
    useState("");

  const [weight, setWeight] =
    useState("");

  const [lake, setLake] =
    useState("White Iron Lake");

  const [caption, setCaption] =
    useState("");

  const [photos, setPhotos] =
    useState<File[]>([]);

  const [photoPreviews, setPhotoPreviews] =
    useState<string[]>([]);

  const [viewerOpen, setViewerOpen] =
    useState(false);

  const [viewerPhotos, setViewerPhotos] =
    useState<string[]>([]);

  const [viewerIndex, setViewerIndex] =
    useState(0);

  const [zoom, setZoom] =
    useState(1);

  const [selectedCatch, setSelectedCatch] =
    useState<Catch | null>(null);

  const [celebratingId, setCelebratingId] =
    useState<number | null>(null);

  useEffect(() => {
    const hasAccess =
      localStorage.getItem(ACCESS_KEY) ===
      "granted";

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

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, [photoPreviews]);

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

  function unlockSite() {
    if (
      familyCode.trim() ===
      FAMILY_CODE
    ) {
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

  function handlePhotos(
    files: FileList | null
  ) {
    if (!files) return;

    const selected = Array.from(files);

    if (selected.length === 0) {
      return;
    }

    const combined = [
      ...photos,
      ...selected,
    ].slice(0, 8);

    photoPreviews.forEach((url) =>
      URL.revokeObjectURL(url)
    );

    setPhotos(combined);

    setPhotoPreviews(
      combined.map((file) =>
        URL.createObjectURL(file)
      )
    );
  }

  function removePhoto(index: number) {
    const nextPhotos = photos.filter(
      (_, i) => i !== index
    );

    const nextPreviews =
      photoPreviews.filter(
        (_, i) => i !== index
      );

    setPhotos(nextPhotos);
    setPhotoPreviews(nextPreviews);
  }

  function resetPostForm() {
    setName("");
    setFishSpecies("");
    setLength("");
    setWeight("");
    setLake("White Iron Lake");
    setCaption("");
    setPhotos([]);

    photoPreviews.forEach((url) =>
      URL.revokeObjectURL(url)
    );

    setPhotoPreviews([]);
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
      const uploadedPhotoUrls: string[] = [];

      for (
        let i = 0;
        i < photos.length;
        i++
      ) {
        const photo = photos[i];

        const extension =
          photo.name.split(".").pop() ||
          "jpg";

        const fileName =
          `${Date.now()}-${i}-${Math.random()
            .toString(36)
            .substring(2)}.${extension}`;

        const filePath =
          `private/${fileName}`;

        const { error: uploadError } =
          await supabase.storage
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

        if (
          signedData?.signedUrl
        ) {
          uploadedPhotoUrls.push(
            signedData.signedUrl
          );
        }
      }

      let imageUrl: string | null =
        null;

      if (
        uploadedPhotoUrls.length === 1
      ) {
        imageUrl =
          uploadedPhotoUrls[0];
      } else if (
        uploadedPhotoUrls.length > 1
      ) {
        imageUrl =
          JSON.stringify(
            uploadedPhotoUrls
          );
      }

      const { data, error } =
        await supabase
          .from("catches")
          .insert({
            name,
            fish_species:
              fishSpecies,
            length: Number(length),
            weight: weight
              ? Number(weight)
              : null,
            lake,
            caption:
              caption || null,
            image_url: imageUrl,
          })
          .select()
          .single();

      if (error) {
        throw error;
      }

      resetPostForm();
      setShowPost(false);

      await loadCatches();

      /*
        Trigger the bubble celebration
        on the newly-created catch.
      */
      if (data?.id) {
        setCelebratingId(data.id);

        setTimeout(() => {
          setCelebratingId(null);
        }, 2800);
      }
    } catch (error) {
      console.error(error);

      alert(
        "Something went wrong posting the catch."
      );
    }

    setPosting(false);
  }

  function openViewer(
    urls: string[],
    index = 0
  ) {
    if (!urls.length) return;

    setViewerPhotos(urls);
    setViewerIndex(index);
    setZoom(1);
    setViewerOpen(true);
  }

  function closeViewer() {
    setViewerOpen(false);
    setZoom(1);
  }

  function nextPhoto() {
    if (!viewerPhotos.length) return;

    setViewerIndex(
      (current) =>
        (current + 1) %
        viewerPhotos.length
    );

    setZoom(1);
  }

  function previousPhoto() {
    if (!viewerPhotos.length) return;

    setViewerIndex(
      (current) =>
        (current - 1 +
          viewerPhotos.length) %
        viewerPhotos.length
    );

    setZoom(1);
  }

  function openCatchDetails(
    item: Catch
  ) {
    setSelectedCatch(item);
  }

  if (!accessGranted) {
    return (
      <main style={styles.accessPage}>
        <div style={styles.accessCard}>
          <div style={styles.accessLogoWrap}>
            <img
              src="/loon-logo.png.png"
              alt="Ely Fishing"
              style={styles.accessLogo}
            />
          </div>

          <div style={styles.accessEyebrow}>
            FAMILY FISHING TRIP
          </div>

          <h1 style={styles.accessTitle}>
            Ely Fishing
          </h1>

          <p style={styles.accessText}>
            White Iron Lake • Minnesota
          </p>

          <input
            type="password"
            value={familyCode}
            onChange={(e) =>
              setFamilyCode(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                unlockSite();
              }
            }}
            placeholder="Family code"
            style={styles.accessInput}
          />

          {codeError && (
            <div style={styles.codeError}>
              {codeError}
            </div>
          )}

          <button
            onClick={unlockSite}
            style={styles.accessButton}
          >
            Enter Fishing Trip
          </button>

          <div style={styles.accessFooter}>
            Our lake. Our fish. Our stories.
          </div>
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
        <div style={styles.heroOverlay} />

        <div style={styles.heroGlowOne} />
        <div style={styles.heroGlowTwo} />

        <div style={styles.heroContent}>
          <div style={styles.heroTop}>
            <div style={styles.heroBadge}>
              <span
                style={styles.liveDot}
              />
              FAMILY FISHING TRIP
            </div>
          </div>

          <div style={styles.centerHero}>
            <div style={styles.logoRing}>
              <img
                src="/loon-logo.png.png"
                alt="Ely Fishing loon"
                style={styles.logoImage}
              />
            </div>

            <div style={styles.titleSmall}>
              WHITE IRON LAKE
            </div>

            <h1 style={styles.title}>
              Ely Fishing
            </h1>

            <p style={styles.subtitle}>
              Minnesota • Our Fishing Journal
            </p>
          </div>

          <div style={styles.heroBottom}>
            <div style={styles.locationCard}>
              <div
                style={styles.locationIcon}
              >
                <MapPin size={21} />
              </div>

              <div>
                <div
                  style={
                    styles.locationLabel
                  }
                >
                  FISHING SPOT
                </div>

                <div
                  style={
                    styles.locationTitle
                  }
                >
                  White Iron Lake
                </div>

                <div
                  style={styles.locationSub}
                >
                  Ely, Minnesota
                </div>
              </div>
            </div>

            <button
              onClick={() =>
                setShowPost(true)
              }
              style={styles.postButton}
            >
              <Plus size={22} />
              Post a Catch
            </button>
          </div>
        </div>
      </section>

      {/* =========================
          FEED
      ========================= */}

      <section style={styles.feed}>
        <div style={styles.sectionHeader}>
          <div>
            <div
              style={styles.sectionEyebrow}
            >
              THE CATCH BOARD
            </div>

            <h2
              style={styles.sectionTitle}
            >
              Recent Catches
            </h2>

            <p
              style={styles.sectionDescription}
            >
              The latest fish from the lake.
            </p>
          </div>

          <div
            style={styles.sectionIcon}
          >
            <Fish size={24} />
          </div>
        </div>

        {loading && (
          <div style={styles.loadingCard}>
            <div
              style={styles.loadingCircle}
            >
              <Fish size={25} />
            </div>

            Loading the catch board...
          </div>
        )}

        {!loading &&
          catches.length === 0 && (
            <div style={styles.emptyCard}>
              <Fish
                size={44}
                color={colors.gold}
              />

              <h3>
                No catches yet
              </h3>

              <p>
                Be the first one to put
                a fish on the board.
              </p>

              <button
                onClick={() =>
                  setShowPost(true)
                }
                style={
                  styles.emptyButton
                }
              >
                <Plus size={18} />
                Post First Catch
              </button>
            </div>
          )}

        {!loading &&
          catches.map((item) => {
            const urls =
              getPhotoUrls(
                item.image_url
              );

            const isCelebrating =
              celebratingId ===
              item.id;

            return (
              <article
                key={item.id}
                style={{
                  ...styles.catchCard,
                  ...(isCelebrating
                    ? styles.catchCardNew
                    : {}),
                }}
              >
                {/* BUBBLE CELEBRATION */}

                {isCelebrating && (
                  <div
                    style={
                      styles.bubbleLayer
                    }
                    aria-hidden="true"
                  >
                    {Array.from({
                      length: 18,
                    }).map(
                      (_, index) => (
                        <span
                          key={index}
                          style={{
                            ...styles.bubble,
                            left: `${
                              5 +
                              Math.random() *
                                90
                            }%`,
                            animationDelay: `${
                              Math.random() *
                              0.7
                            }s`,
                            animationDuration: `${
                              1.8 +
                              Math.random() *
                                1
                            }s`,
                            width: `${
                              8 +
                              Math.random() *
                                17
                            }px`,
                            height: `${
                              8 +
                              Math.random() *
                                17
                            }px`,
                          }}
                        />
                      )
                    )}
                  </div>
                )}

                {/* PHOTO AREA */}

                {urls.length > 0 && (
                  <div
                    style={
                      styles.photoGallery
                    }
                  >
                    <button
                      onClick={() =>
                        openViewer(
                          urls,
                          0
                        )
                      }
                      style={
                        styles.mainPhotoButton
                      }
                      aria-label="Open catch photo"
                    >
                      <img
                        src={urls[0]}
                        alt={
                          item.fish_species
                        }
                        style={
                          styles.catchImage
                        }
                      />

                      <div
                        style={
                          styles.photoShade
                        }
                      />

                      <div
                        style={
                          styles.photoOpenHint
                        }
                      >
                        <ZoomIn
                          size={18}
                        />
                        Tap to view
                      </div>

                      {urls.length >
                        1 && (
                        <div
                          style={
                            styles.photoCount
                          }
                        >
                          <Images
                            size={16}
                          />
                          {urls.length} photos
                        </div>
                      )}
                    </button>

                    {urls.length >
                      1 && (
                      <div
                        style={
                          styles.thumbnailRow
                        }
                      >
                        {urls
                          .slice(0, 4)
                          .map(
                            (
                              url,
                              index
                            ) => (
                              <button
                                key={
                                  index
                                }
                                onClick={() =>
                                  openViewer(
                                    urls,
                                    index
                                  )
                                }
                                style={
                                  styles.thumbnailButton
                                }
                              >
                                <img
                                  src={url}
                                  alt=""
                                  style={
                                    styles.thumbnail
                                  }
                                />
                              </button>
                            )
                          )}
                      </div>
                    )}
                  </div>
                )}

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
                        styles.fishBadge
                      }
                    >
                      <Fish size={18} />
                    </div>
                  </div>

                  <div
                    style={
                      styles.catchStats
                    }
                  >
                    <div
                      style={
                        styles.statBlock
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
                        — {item.length}"
                      </strong>
                    </div>

                    {item.weight !==
                      null && (
                      <div
                        style={
                          styles.statBlock
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
                          — {item.weight} lbs
                        </strong>
                      </div>
                    )}

                    <div
                      style={
                        styles.statBlock
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
                        style={
                          styles.statValue
                        }
                      >
                        — {item.lake}
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
                      styles.postFooter
                    }
                  >
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
                        openCatchDetails(
                          item
                        )
                      }
                      style={
                        styles.detailsButton
                      }
                    >
                      View catch
                    </button>

                    <span
                      style={
                        styles.time
                      }
                    >
                      {formatDate(
                        item.created_at
                      )}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}

        {/* =========================
            TRIP STATS
        ========================= */}

        <div style={styles.tripCard}>
          <div style={styles.tripHeader}>
            <div
              style={
                styles.tripIcon
              }
            >
              <Trophy size={21} />
            </div>

            <div>
              <div
                style={
                  styles.tripEyebrow
                }
              >
                THIS TRIP
              </div>

              <h2
                style={
                  styles.tripTitle
                }
              >
                Fishing Stats
              </h2>
            </div>
          </div>

          <div
            style={styles.tripStats}
          >
            <div
              style={
                styles.tripStat
              }
            >
              <strong>
                {catches.length}
              </strong>

              <span>CATCHES</span>
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

              <span>FISHERMEN</span>
            </div>

            <div
              style={
                styles.tripStat
              }
            >
              <strong>∞</strong>

              <span>MEMORIES</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          NAV
      ========================= */}

      <nav style={styles.nav}>
        <button
          style={styles.navActive}
        >
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

        <button
          style={styles.navItem}
        >
          <Trophy size={21} />
          Leaders
        </button>

        <button
          style={styles.navItem}
        >
          <Users size={21} />
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
          onClick={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              setShowPost(false);
            }
          }}
        >
          <div
            style={styles.modal}
          >
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
                    styles.modalSub
                  }
                >
                  Add the details and
                  your best photos.
                </p>
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

            <div
              style={styles.form}
            >
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
                  step="0.1"
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

              {/* PHOTO UPLOAD */}

              <label
                style={
                  styles.photoUpload
                }
              >
                <Camera size={22} />

                <div>
                  <strong>
                    Add photos
                  </strong>

                  <span>
                    Choose up to 8 photos
                  </span>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  style={{
                    display: "none",
                  }}
                  onChange={(e) =>
                    handlePhotos(
                      e.target.files
                    )
                  }
                />
              </label>

              {/* PHOTO PREVIEWS */}

              {photoPreviews.length >
                0 && (
                <div
                  style={
                    styles.previewSection
                  }
                >
                  <div
                    style={
                      styles.previewHeader
                    }
                  >
                    <span>
                      Selected photos
                    </span>

                    <span>
                      {
                        photoPreviews.length
                      }/8
                    </span>
                  </div>

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
                          key={
                            preview
                          }
                          style={
                            styles.previewItem
                          }
                        >
                          <img
                            src={preview}
                            alt=""
                            style={
                              styles.previewImage
                            }
                          />

                          <button
                            onClick={() =>
                              removePhoto(
                                index
                              )
                            }
                            style={
                              styles.previewRemove
                            }
                            type="button"
                          >
                            <X
                              size={15}
                            />
                          </button>

                          {index ===
                            0 && (
                            <div
                              style={
                                styles.coverLabel
                              }
                            >
                              MAIN
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={postCatch}
                disabled={posting}
                style={{
                  ...styles.submitButton,
                  opacity:
                    posting ? 0.7 : 1,
                }}
              >
                {posting ? (
                  <>
                    <span
                      style={
                        styles.spinner
                      }
                    />
                    Posting Catch...
                  </>
                ) : (
                  <>
                    <Fish size={19} />
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

      {viewerOpen &&
        viewerPhotos.length >
          0 && (
          <div
            style={
              styles.viewerBackground
            }
            onClick={(e) => {
              if (
                e.target ===
                e.currentTarget
              ) {
                closeViewer();
              }
            }}
          >
            <div
              style={
                styles.viewerTop
              }
            >
              <div
                style={
                  styles.viewerCounter
                }
              >
                {viewerIndex + 1} /{" "}
                {viewerPhotos.length}
              </div>

              <button
                onClick={closeViewer}
                style={
                  styles.viewerClose
                }
              >
                <X size={25} />
              </button>
            </div>

            <button
              onClick={
                previousPhoto
              }
              style={
                styles.viewerArrowLeft
              }
              aria-label="Previous photo"
            >
              <ChevronLeft
                size={30}
              />
            </button>

            <div
              style={
                styles.viewerImageWrap
              }
            >
              <img
                src={
                  viewerPhotos[
                    viewerIndex
                  ]
                }
                alt="Fishing catch"
                style={{
                  ...styles.viewerImage,
                  transform: `scale(${zoom})`,
                }}
                onWheel={(e) => {
                  e.preventDefault();

                  if (
                    e.deltaY < 0
                  ) {
                    setZoom(
                      (z) =>
                        Math.min(
                          z + 0.15,
                          3
                        )
                    );
                  } else {
                    setZoom(
                      (z) =>
                        Math.max(
                          z - 0.15,
                          1
                        )
                    );
                  }
                }}
              />
            </div>

            <button
              onClick={nextPhoto}
              style={
                styles.viewerArrowRight
              }
              aria-label="Next photo"
            >
              <ChevronRight
                size={30}
              />
            </button>

            <div
              style={
                styles.viewerControls
              }
            >
              <button
                onClick={() =>
                  setZoom(
                    (z) =>
                      Math.max(
                        z - 0.25,
                        1
                      )
                  )
                }
                style={
                  styles.viewerControl
                }
              >
                <ZoomOut
                  size={19}
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
                onClick={() =>
                  setZoom(
                    (z) =>
                      Math.min(
                        z + 0.25,
                        3
                      )
                  )
                }
                style={
                  styles.viewerControl
                }
              >
                <ZoomIn
                  size={19}
                />
              </button>
            </div>

            {viewerPhotos.length >
              1 && (
              <div
                style={
                  styles.viewerThumbnails
                }
              >
                {viewerPhotos.map(
                  (
                    url,
                    index
                  ) => (
                    <button
                      key={index}
                      onClick={() => {
                        setViewerIndex(
                          index
                        );
                        setZoom(1);
                      }}
                      style={{
                        ...styles.viewerThumbnail,
                        ...(index ===
                        viewerIndex
                          ? styles.viewerThumbnailActive
                          : {}),
                      }}
                    >
                      <img
                        src={url}
                        alt=""
                        style={
                          styles.viewerThumbnailImage
                        }
                      />
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        )}

      {/* =========================
          CATCH DETAILS
      ========================= */}

      {selectedCatch && (
        <div
          style={
            styles.detailsBackground
          }
          onClick={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              setSelectedCatch(null);
            }
          }}
        >
          <div
            style={
              styles.detailsModal
            }
          >
            <div
              style={
                styles.detailsHeader
              }
            >
              <div>
                <div
                  style={
                    styles.sectionEyebrow
                  }
                >
                  CATCH DETAILS
                </div>

                <h2
                  style={
                    styles.detailsTitle
                  }
                >
                  {
                    selectedCatch.fish_species
                  }
                </h2>
              </div>

              <button
                onClick={() =>
                  setSelectedCatch(null)
                }
                style={
                  styles.closeButton
                }
              >
                <X size={21} />
              </button>
            </div>

            {getPhotoUrls(
              selectedCatch.image_url
            ).length > 0 && (
              <button
                onClick={() =>
                  openViewer(
                    getPhotoUrls(
                      selectedCatch.image_url
                    )
                  )
                }
                style={
                  styles.detailsPhotoButton
                }
              >
                <img
                  src={
                    getPhotoUrls(
                      selectedCatch.image_url
                    )[0]
                  }
                  alt={
                    selectedCatch.fish_species
                  }
                  style={
                    styles.detailsPhoto
                  }
                />

                <div
                  style={
                    styles.detailsPhotoOverlay
                  }
                >
                  <ZoomIn size={19} />
                  View all photos
                </div>
              </button>
            )}

            <div
              style={
                styles.detailsPerson
              }
            >
              Caught by{" "}
              <strong>
                {selectedCatch.name}
              </strong>
            </div>

            <div
              style={
                styles.detailsStats
              }
            >
              <div
                style={
                  styles.detailsStat
                }
              >
                <span>LENGTH</span>
                <strong>
                  — {selectedCatch.length}"
                </strong>
              </div>

              {selectedCatch.weight !==
                null && (
                <div
                  style={
                    styles.detailsStat
                  }
                >
                  <span>WEIGHT</span>
                  <strong>
                    —{" "}
                    {
                      selectedCatch.weight
                    }{" "}
                    lbs
                  </strong>
                </div>
              )}

              <div
                style={
                  styles.detailsStat
                }
              >
                <span>LAKE</span>
                <strong>
                  — {selectedCatch.lake}
                </strong>
              </div>
            </div>

            {selectedCatch.caption && (
              <p
                style={
                  styles.detailsCaption
                }
              >
                {selectedCatch.caption}
              </p>
            )}

            <div
              style={
                styles.detailsDate
              }
            >
              Posted{" "}
              {formatDate(
                selectedCatch.created_at
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* =========================================
   STYLES
========================================= */

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    background: colors.cream,
    color: colors.ink,
    paddingBottom: "95px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  /* ACCESS */

  accessPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    boxSizing: "border-box",
    background:
      "linear-gradient(145deg, #071D17, #153E48 55%, #E97845)",
  },

  accessCard: {
    width: "100%",
    maxWidth: "430px",
    padding: "38px 28px",
    boxSizing: "border-box",
    borderRadius: "30px",
    textAlign: "center",
    background:
      "rgba(255,253,247,0.96)",
    boxShadow:
      "0 30px 90px rgba(0,0,0,0.35)",
  },

  accessLogoWrap: {
    width: "120px",
    height: "120px",
    margin: "0 auto 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  accessLogo: {
    width: "115px",
    height: "115px",
    objectFit: "contain",
  },

  accessEyebrow: {
    color: colors.sunset,
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "3px",
  },

  accessTitle: {
    margin: "8px 0 5px",
    fontSize: "42px",
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: "-2px",
    color: colors.forest,
  },

  accessText: {
    margin: "0 0 25px",
    color: colors.muted,
    fontSize: "14px",
  },

  accessInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px",
    borderRadius: "14px",
    border:
      "1px solid rgba(23,49,42,0.18)",
    background: "#FFFFFF",
    color: colors.ink,
    fontSize: "16px",
    outline: "none",
  },

  codeError: {
    marginTop: "10px",
    color: "#B42318",
    fontSize: "13px",
    fontWeight: 700,
  },

  accessButton: {
    width: "100%",
    marginTop: "13px",
    padding: "16px",
    border: "none",
    borderRadius: "14px",
    background: colors.forest,
    color: colors.white,
    fontSize: "15px",
    fontWeight: 900,
    cursor: "pointer",
  },

  accessFooter: {
    marginTop: "23px",
    color: colors.muted,
    fontSize: "12px",
  },

  /* HERO */

  hero: {
    position: "relative",
    minHeight: "610px",
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

  heroOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to bottom, rgba(7,29,23,0.18), rgba(7,29,23,0.48) 48%, rgba(7,29,23,0.96) 100%)",
  },

  heroGlowOne: {
    position: "absolute",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background:
      "rgba(233,185,73,0.18)",
    filter: "blur(80px)",
    top: "10%",
    right: "-100px",
  },

  heroGlowTwo: {
    position: "absolute",
    width: "260px",
    height: "260px",
    borderRadius: "50%",
    background:
      "rgba(40,107,120,0.22)",
    filter: "blur(80px)",
    bottom: "-100px",
    left: "-90px",
  },

  heroContent: {
    position: "relative",
    zIndex: 2,
    maxWidth: "920px",
    margin: "0 auto",
    minHeight: "610px",
    padding: "26px 20px 30px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },

  heroTop: {
    display: "flex",
    justifyContent: "center",
  },

  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 13px",
    borderRadius: "999px",
    background:
      "rgba(7,29,23,0.45)",
    border:
      "1px solid rgba(255,255,255,0.2)",
    backdropFilter: "blur(12px)",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "2px",
  },

  liveDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: colors.gold,
    boxShadow:
      "0 0 12px rgba(233,185,73,0.9)",
  },

  centerHero: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },

  logoRing: {
    width: "142px",
    height: "142px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(7,29,23,0.35)",
    border:
      "1px solid rgba(255,255,255,0.3)",
    boxShadow:
      "0 20px 60px rgba(0,0,0,0.3)",
    backdropFilter: "blur(10px)",
  },

  logoImage: {
    width: "125px",
    height: "125px",
    objectFit: "contain",
  },

  titleSmall: {
    marginTop: "22px",
    color: colors.gold,
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "4px",
  },

  title: {
    margin: "8px 0 0",
    fontSize:
      "clamp(46px, 10vw, 76px)",
    lineHeight: 0.95,
    fontWeight: 950,
    letterSpacing: "-4px",
    textShadow:
      "0 5px 25px rgba(0,0,0,0.35)",
  },

  subtitle: {
    margin: "15px 0 0",
    fontSize: "15px",
    color:
      "rgba(255,255,255,0.8)",
  },

  heroBottom: {
    display: "flex",
    flexDirection: "column",
    gap: "11px",
  },

  locationCard: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "15px",
    borderRadius: "18px",
    background:
      "rgba(7,29,23,0.63)",
    border:
      "1px solid rgba(255,255,255,0.18)",
    backdropFilter: "blur(14px)",
  },

  locationIcon: {
    width: "45px",
    height: "45px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "14px",
    background: colors.gold,
    color: colors.forest,
  },

  locationLabel: {
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: "2px",
    color:
      "rgba(255,255,255,0.55)",
  },

  locationTitle: {
    marginTop: "3px",
    fontSize: "17px",
    fontWeight: 900,
  },

  locationSub: {
    marginTop: "2px",
    fontSize: "12px",
    color:
      "rgba(255,255,255,0.6)",
  },

  postButton: {
    width: "100%",
    padding: "17px",
    border: "none",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    background: colors.sunset,
    color: colors.white,
    fontSize: "16px",
    fontWeight: 900,
    cursor: "pointer",
    boxShadow:
      "0 12px 30px rgba(233,120,69,0.28)",
  },

  /* FEED */

  feed: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "34px 18px",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: "22px",
  },

  sectionEyebrow: {
    color: colors.sunset,
    fontSize: "10px",
    fontWeight: 950,
    letterSpacing: "3px",
  },

  sectionTitle: {
    margin: "6px 0 0",
    fontSize: "32px",
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: "-1.5px",
    color: colors.forest,
  },

  sectionDescription: {
    margin: "8px 0 0",
    color: colors.muted,
    fontSize: "13px",
  },

  sectionIcon: {
    width: "46px",
    height: "46px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "15px",
    background: colors.forest,
    color: colors.gold,
  },

  loadingCard: {
    padding: "45px 20px",
    borderRadius: "22px",
    textAlign: "center",
    color: colors.muted,
    background: colors.paper,
    border:
      "1px solid rgba(23,49,42,0.1)",
  },

  loadingCircle: {
    width: "48px",
    height: "48px",
    margin: "0 auto 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: colors.forest,
    color: colors.gold,
  },

  emptyCard: {
    padding: "50px 25px",
    borderRadius: "24px",
    textAlign: "center",
    background: colors.paper,
    border:
      "1px solid rgba(23,49,42,0.1)",
  },

  emptyButton: {
    marginTop: "12px",
    padding: "12px 17px",
    border: "none",
    borderRadius: "12px",
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    background: colors.forest,
    color: colors.white,
    fontWeight: 800,
    cursor: "pointer",
  },

  /* CATCH CARD */

  catchCard: {
    position: "relative",
    overflow: "hidden",
    marginBottom: "22px",
    borderRadius: "25px",
    background: colors.paper,
    border:
      "1px solid rgba(23,49,42,0.1)",
    boxShadow:
      "0 15px 40px rgba(23,49,42,0.09)",
  },

  catchCardNew: {
    boxShadow:
      "0 0 0 3px rgba(233,185,73,0.65), 0 25px 65px rgba(233,185,73,0.3)",
  },

  photoGallery: {
    position: "relative",
    width: "100%",
    background: "#0B1714",
  },

  mainPhotoButton: {
    position: "relative",
    display: "block",
    width: "100%",
    padding: 0,
    border: "none",
    background: "#0B1714",
    cursor: "pointer",
    overflow: "hidden",
  },

  catchImage: {
    width: "100%",
    maxHeight: "600px",
    minHeight: "220px",
    display: "block",
    objectFit: "contain",
    background: "#0B1714",
  },

  photoShade: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "linear-gradient(to bottom, transparent 65%, rgba(0,0,0,0.42))",
  },

  photoOpenHint: {
    position: "absolute",
    right: "13px",
    bottom: "13px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 11px",
    borderRadius: "999px",
    background:
      "rgba(7,29,23,0.7)",
    color: colors.white,
    fontSize: "11px",
    fontWeight: 800,
    backdropFilter: "blur(8px)",
  },

  photoCount: {
    position: "absolute",
    top: "13px",
    right: "13px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 10px",
    borderRadius: "999px",
    background:
      "rgba(7,29,23,0.72)",
    color: colors.white,
    fontSize: "11px",
    fontWeight: 900,
    backdropFilter: "blur(8px)",
  },

  thumbnailRow: {
    display: "flex",
    gap: "7px",
    padding: "8px",
    overflowX: "auto",
    background: "#0B1714",
  },

  thumbnailButton: {
    width: "64px",
    height: "54px",
    flexShrink: 0,
    padding: 0,
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "8px",
    overflow: "hidden",
    background: "#17221F",
    cursor: "pointer",
  },

  thumbnail: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  catchContent: {
    padding: "20px",
  },

  catchHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  catchPerson: {
    color: colors.sunset,
    fontSize: "12px",
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: "1px",
  },

  fishName: {
    margin: "4px 0 0",
    fontSize: "28px",
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: "-1px",
    color: colors.forest,
  },

  fishBadge: {
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "13px",
    background:
      "rgba(233,185,73,0.16)",
    color: colors.forest,
  },

  catchStats: {
    display: "flex",
    flexDirection: "column",
    gap: "9px",
    marginTop: "18px",
    padding:
      "15px 0",
    borderTop:
      "1px solid rgba(23,49,42,0.09)",
    borderBottom:
      "1px solid rgba(23,49,42,0.09)",
  },

  statBlock: {
    display: "flex",
    alignItems: "baseline",
    gap: "7px",
    flexWrap: "wrap",
  },

  statLabel: {
    minWidth: "62px",
    color: colors.muted,
    fontSize: "9px",
    fontWeight: 950,
    letterSpacing: "1.7px",
  },

  statValue: {
    color: colors.ink,
    fontSize: "14px",
    fontWeight: 900,
  },

  caption: {
    margin: "16px 0 0",
    color: "#52605A",
    lineHeight: 1.6,
    fontSize: "14px",
  },

  postFooter: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginTop: "17px",
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
    fontWeight: 800,
    cursor: "pointer",
  },

  detailsButton: {
    padding: "8px 11px",
    border: "none",
    borderRadius: "9px",
    background:
      "rgba(18,53,42,0.08)",
    color: colors.forest,
    fontSize: "11px",
    fontWeight: 900,
    cursor: "pointer",
  },

  time: {
    marginLeft: "auto",
    color: "#9AA29E",
    fontSize: "11px",
  },

  /* BUBBLES */

  bubbleLayer: {
    position: "absolute",
    inset: 0,
    zIndex: 20,
    pointerEvents: "none",
    overflow: "hidden",
  },

  bubble: {
    position: "absolute",
    bottom: "-30px",
    border:
      "2px solid rgba(255,255,255,0.75)",
    background:
      "rgba(190,235,239,0.18)",
    borderRadius: "50%",
    animationName: "bubbleFloat",
    animationTimingFunction: "ease-out",
    animationIterationCount: 1,
  },

  /* TRIP STATS */

  tripCard: {
    marginTop: "32px",
    padding: "23px",
    borderRadius: "24px",
    background:
      "linear-gradient(145deg, #12352A, #153E48)",
    color: colors.white,
    boxShadow:
      "0 18px 45px rgba(18,53,42,0.18)",
  },

  tripHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  tripIcon: {
    width: "43px",
    height: "43px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "13px",
    background: colors.gold,
    color: colors.forest,
  },

  tripEyebrow: {
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: "2px",
    color:
      "rgba(255,255,255,0.55)",
  },

  tripTitle: {
    margin: "2px 0 0",
    fontSize: "21px",
  },

  tripStats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    marginTop: "25px",
    textAlign: "center",
  },

  tripStat: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  /* NAV */

  nav: {
    position: "fixed",
    zIndex: 80,
    bottom: 0,
    left: 0,
    right: 0,
    height: "76px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "clamp(22px, 8vw, 70px)",
    background:
      "rgba(7,29,23,0.96)",
    borderTop:
      "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(18px)",
  },

  navActive: {
    border: "none",
    background: "transparent",
    color: colors.gold,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    fontSize: "10px",
    fontWeight: 900,
    cursor: "pointer",
  },

  navItem: {
    border: "none",
    background: "transparent",
    color:
      "rgba(255,255,255,0.45)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  /* POST MODAL */

  modalBackground: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    background:
      "rgba(5,18,14,0.72)",
    backdropFilter: "blur(5px)",
  },

  modal: {
    width: "100%",
    maxWidth: "700px",
    maxHeight: "93vh",
    overflowY: "auto",
    padding: "26px 20px 30px",
    boxSizing: "border-box",
    borderRadius:
      "27px 27px 0 0",
    background: colors.paper,
    color: colors.ink,
    boxShadow:
      "0 -20px 70px rgba(0,0,0,0.28)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "15px",
    marginBottom: "21px",
  },

  modalTitle: {
    margin: "5px 0 0",
    fontSize: "29px",
    fontWeight: 950,
    color: colors.forest,
  },

  modalSub: {
    margin: "5px 0 0",
    color: colors.muted,
    fontSize: "13px",
  },

  closeButton: {
    width: "40px",
    height: "40px",
    flexShrink: 0,
    border: "none",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(23,49,42,0.08)",
    color: colors.ink,
    cursor: "pointer",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "11px",
  },

  input: {
    boxSizing: "border-box",
    width: "100%",
    padding: "14px",
    borderRadius: "13px",
    border:
      "1px solid rgba(23,49,42,0.14)",
    background: "#FFFFFF",
    color: colors.ink,
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
    minHeight: "65px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "11px",
    borderRadius: "14px",
    border:
      "2px dashed rgba(18,53,42,0.25)",
    background:
      "rgba(18,53,42,0.04)",
    color: colors.forest,
    cursor: "pointer",
  },

  previewSection: {
    padding: "13px",
    borderRadius: "15px",
    background:
      "rgba(18,53,42,0.05)",
  },

  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "9px",
    color: colors.muted,
    fontSize: "11px",
    fontWeight: 900,
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
    borderRadius: "10px",
    background: "#DDD",
  },

  previewImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  previewRemove: {
    position: "absolute",
    top: "5px",
    right: "5px",
    width: "25px",
    height: "25px",
    border: "none",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(0,0,0,0.72)",
    color: colors.white,
    cursor: "pointer",
  },

  coverLabel: {
    position: "absolute",
    bottom: "5px",
    left: "5px",
    padding: "3px 5px",
    borderRadius: "5px",
    background: colors.gold,
    color: colors.forest,
    fontSize: "7px",
    fontWeight: 950,
  },

  submitButton: {
    marginTop: "5px",
    padding: "16px",
    border: "none",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: colors.forest,
    color: colors.white,
    fontSize: "15px",
    fontWeight: 950,
    cursor: "pointer",
  },

  spinner: {
    width: "15px",
    height: "15px",
    border:
      "2px solid rgba(255,255,255,0.3)",
    borderTop:
      "2px solid white",
    borderRadius: "50%",
  },

  /* PHOTO VIEWER */

  viewerBackground: {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(3,12,10,0.97)",
  },

  viewerTop: {
    position: "absolute",
    top: "18px",
    left: "18px",
    right: "18px",
    zIndex: 5,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  viewerCounter: {
    padding: "8px 12px",
    borderRadius: "999px",
    background:
      "rgba(255,255,255,0.1)",
    color: colors.white,
    fontSize: "12px",
    fontWeight: 800,
  },

  viewerClose: {
    width: "43px",
    height: "43px",
    border: "none",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(255,255,255,0.1)",
    color: colors.white,
    cursor: "pointer",
  },

  viewerImageWrap: {
    maxWidth: "90vw",
    maxHeight: "78vh",
    overflow: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  viewerImage: {
    maxWidth: "88vw",
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
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 5,
    width: "48px",
    height: "48px",
    border: "none",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(255,255,255,0.11)",
    color: colors.white,
    cursor: "pointer",
  },

  viewerArrowRight: {
    position: "absolute",
    right: "15px",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 5,
    width: "48px",
    height: "48px",
    border: "none",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(255,255,255,0.11)",
    color: colors.white,
    cursor: "pointer",
  },

  viewerControls: {
    position: "absolute",
    bottom: "82px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "7px",
    borderRadius: "999px",
    background:
      "rgba(255,255,255,0.1)",
  },

  viewerControl: {
    width: "38px",
    height: "38px",
    border: "none",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "rgba(255,255,255,0.12)",
    color: colors.white,
    cursor: "pointer",
  },

  zoomText: {
    minWidth: "45px",
    textAlign: "center",
    color: colors.white,
    fontSize: "12px",
    fontWeight: 800,
  },

  viewerThumbnails: {
    position: "absolute",
    bottom: "15px",
    left: "50%",
    transform: "translateX(-50%)",
    maxWidth: "90vw",
    display: "flex",
    gap: "6px",
    overflowX: "auto",
    padding: "4px",
  },

  viewerThumbnail: {
    width: "52px",
    height: "42px",
    flexShrink: 0,
    padding: 0,
    border:
      "2px solid transparent",
    borderRadius: "7px",
    overflow: "hidden",
    background: "transparent",
    cursor: "pointer",
  },

  viewerThumbnailActive: {
    border:
      "2px solid #E9B949",
  },

  viewerThumbnailImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  /* DETAILS */

  detailsBackground: {
    position: "fixed",
    inset: 0,
    zIndex: 150,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    background:
      "rgba(3,12,10,0.72)",
    backdropFilter: "blur(5px)",
  },

  detailsModal: {
    width: "100%",
    maxWidth: "700px",
    maxHeight: "92vh",
    overflowY: "auto",
    padding: "25px 20px 30px",
    boxSizing: "border-box",
    borderRadius:
      "27px 27px 0 0",
    background: colors.paper,
  },

  detailsHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "18px",
  },

  detailsTitle: {
    margin: "5px 0 0",
    fontSize: "31px",
    fontWeight: 950,
    color: colors.forest,
  },

  detailsPhotoButton: {
    position: "relative",
    display: "block",
    width: "100%",
    padding: 0,
    border: "none",
    borderRadius: "17px",
    overflow: "hidden",
    background: "#0B1714",
    cursor: "pointer",
  },

  detailsPhoto: {
    width: "100%",
    maxHeight: "500px",
    objectFit: "contain",
    display: "block",
  },

  detailsPhotoOverlay: {
    position: "absolute",
    bottom: "12px",
    right: "12px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 11px",
    borderRadius: "999px",
    background:
      "rgba(7,29,23,0.75)",
    color: colors.white,
    fontSize: "11px",
    fontWeight: 800,
  },

  detailsPerson: {
    marginTop: "17px",
    color: colors.muted,
    fontSize: "13px",
  },

  detailsStats: {
    display: "flex",
    flexDirection: "column",
    gap: "11px",
    marginTop: "18px",
    padding:
      "17px 0",
    borderTop:
      "1px solid rgba(23,49,42,0.1)",
    borderBottom:
      "1px solid rgba(23,49,42,0.1)",
  },

  detailsStat: {
    display: "flex",
    alignItems: "baseline",
    gap: "9px",
  },

  detailsCaption: {
    marginTop: "17px",
    color: "#52605A",
    lineHeight: 1.65,
    fontSize: "14px",
  },

  detailsDate: {
    marginTop: "18px",
    color: "#9AA29E",
    fontSize: "11px",
  },
};

/*
  Bubble animation.
  This uses a small style tag so the
  celebration works without another package.
*/

if (
  typeof document !== "undefined" &&
  !document.getElementById(
    "ely-fishing-animations"
  )
) {
  const style =
    document.createElement("style");

  style.id =
    "ely-fishing-animations";

  style.innerHTML = `
    @keyframes bubbleFloat {
      0% {
        transform: translateY(0) scale(0.5);
        opacity: 0;
      }

      15% {
        opacity: 1;
      }

      100% {
        transform: translateY(-420px) scale(1.15);
        opacity: 0;
      }
    }

    @keyframes elySpin {
      from {
        transform: rotate(0deg);
      }

      to {
        transform: rotate(360deg);
      }
    }

    @media (max-width: 600px) {
      .ely-fishing-hide-mobile {
        display: none;
      }
    }
  `;

  document.head.appendChild(style);
}
