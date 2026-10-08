"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Fish,
  Home,
  Map,
  Plus,
  Trophy,
  Users,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Trash2,
  Heart,
  MessageCircle,
} from "lucide-react";
import { supabase } from "./lib/supabase";

type Catch = {
  id: number;
  name: string;
  fish_species: string;
  length: number | null;
  weight: number | null;
  lake: string;
  caption: string | null;
  image_url: string | null;
  created_at: string;
};

type LikeRow = {
  id: number;
  catch_id: number;
  user_id: string;
};

type CommentRow = {
  id: number;
  catch_id: number;
  user_id: string;
  user_name: string;
  comment: string;
  created_at: string;
};

const colors = {
  ivory: "#F4F0E7",
  paper: "#FBF9F4",
  navy: "#122B3A",
  navySoft: "#1E4052",
  lake: "#64879A",
  lakeLight: "#DDE7EA",
  rust: "#B9684C",
  rustLight: "#EAD2C7",
  charcoal: "#263238",
  gray: "#6D7678",
  border: "#DDD8CC",
  white: "#FFFFFF",
};

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: colors.ivory,
    color: colors.charcoal,
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    paddingBottom: 105,
  },

  hero: {
    position: "relative",
    height: "430px",
    overflow: "hidden",
    background: colors.navy,
  },

  heroImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  heroOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to bottom, rgba(10,24,32,0.18) 0%, rgba(10,24,32,0.08) 35%, rgba(10,24,32,0.82) 100%)",
  },

  heroContent: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: "30px 22px 34px",
    color: colors.white,
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    opacity: 0.82,
    marginBottom: 10,
  },

  heroTitle: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: "clamp(44px, 13vw, 72px)",
    lineHeight: 0.95,
    fontWeight: 500,
    letterSpacing: "-0.04em",
    margin: 0,
  },

  heroSubtitle: {
    marginTop: 14,
    fontSize: 15,
    opacity: 0.9,
  },

  heroPostButton: {
    position: "absolute",
    right: 18,
    bottom: 25,
    width: 58,
    height: 58,
    borderRadius: "50%",
    border: "none",
    background: colors.rust,
    color: colors.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
    cursor: "pointer",
  },

  lakeStrip: {
    background: colors.navy,
    color: colors.white,
    padding: "17px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },

  lakeStripText: {
    minWidth: 0,
  },

  lakeStripTitle: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.04em",
  },

  lakeStripSub: {
    fontSize: 11,
    opacity: 0.7,
    marginTop: 3,
  },

  content: {
    width: "100%",
    maxWidth: 760,
    margin: "0 auto",
    padding: "0 16px",
  },

  section: {
    marginTop: 30,
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: 12,
    marginBottom: 15,
  },

  sectionEyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: colors.rust,
    marginBottom: 5,
  },

  sectionTitle: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 30,
    lineHeight: 1,
    fontWeight: 500,
    color: colors.navy,
    margin: 0,
  },

  sectionLink: {
    fontSize: 12,
    fontWeight: 800,
    color: colors.navySoft,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },

  statsRail: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    borderTop: `1px solid ${colors.border}`,
    borderBottom: `1px solid ${colors.border}`,
    background: colors.paper,
  },

  stat: {
    padding: "20px 10px",
    textAlign: "center",
    borderRight: `1px solid ${colors.border}`,
  },

  statNumber: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 28,
    color: colors.navy,
    lineHeight: 1,
  },

  statLabel: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.11em",
    textTransform: "uppercase",
    color: colors.gray,
  },

  empty: {
    padding: "55px 25px",
    background: colors.paper,
    border: `1px solid ${colors.border}`,
    textAlign: "center",
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: colors.lakeLight,
    color: colors.navy,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 15px",
  },

  emptyTitle: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 24,
    color: colors.navy,
    marginBottom: 7,
  },

  emptyText: {
    color: colors.gray,
    fontSize: 14,
    lineHeight: 1.5,
  },

  catches: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },

  journalEntry: {
    background: colors.paper,
    border: `1px solid ${colors.border}`,
    boxShadow: "0 8px 25px rgba(18,43,58,0.05)",
    overflow: "hidden",
  },

  journalPhotoWrap: {
    position: "relative",
    background: "#D9D5CA",
    cursor: "pointer",
    overflow: "hidden",
  },

  journalPhoto: {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "cover",
  },

  photoCount: {
    position: "absolute",
    top: 12,
    right: 12,
    background: "rgba(18,43,58,0.86)",
    color: colors.white,
    borderRadius: 20,
    padding: "6px 9px",
    fontSize: 11,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    gap: 5,
  },

  entryBody: {
    padding: "18px 18px 20px",
  },

  entryTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 15,
    alignItems: "flex-start",
  },

  entryName: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    color: colors.navy,
    fontSize: 25,
    lineHeight: 1.05,
    fontWeight: 500,
  },

  entryDate: {
    color: colors.gray,
    fontSize: 10,
    fontWeight: 700,
    whiteSpace: "nowrap",
    paddingTop: 3,
  },

  fishTag: {
    display: "inline-block",
    marginTop: 8,
    color: colors.rust,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },

  metadata: {
    display: "flex",
    flexWrap: "wrap",
    gap: "7px 15px",
    marginTop: 15,
    paddingTop: 14,
    borderTop: `1px solid ${colors.border}`,
    color: colors.gray,
    fontSize: 12,
    fontWeight: 600,
  },

  caption: {
    marginTop: 13,
    color: colors.charcoal,
    fontSize: 14,
    lineHeight: 1.55,
  },

  entryActions: {
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  actionGroup: {
    display: "flex",
    gap: 8,
  },

  socialButton: {
    border: `1px solid ${colors.border}`,
    background: colors.white,
    color: colors.navy,
    borderRadius: 20,
    padding: "7px 11px",
    display: "flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  },

  likedButton: {
    background: colors.rustLight,
    borderColor: colors.rust,
    color: colors.rust,
  },

  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: `1px solid ${colors.border}`,
    background: "transparent",
    color: colors.gray,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  countText: {
    fontSize: 12,
    color: colors.gray,
    fontWeight: 700,
    marginLeft: 4,
  },

  commentArea: {
    marginTop: 14,
    paddingTop: 14,
    borderTop: `1px solid ${colors.border}`,
  },

  commentList: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
    marginBottom: 12,
  },

  commentBubble: {
    background: colors.ivory,
    borderRadius: 10,
    padding: "9px 11px",
  },

  commentHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },

  commentName: {
    fontSize: 11,
    fontWeight: 900,
    color: colors.navy,
  },

  commentDate: {
    fontSize: 9,
    color: colors.gray,
  },

  commentText: {
    fontSize: 13,
    color: colors.charcoal,
    marginTop: 4,
    lineHeight: 1.45,
    wordBreak: "break-word",
  },

  commentDelete: {
    border: "none",
    background: "transparent",
    color: colors.gray,
    cursor: "pointer",
    padding: 2,
  },

  commentForm: {
    display: "flex",
    gap: 7,
  },

  commentInput: {
    flex: 1,
    minWidth: 0,
    border: `1px solid ${colors.border}`,
    background: colors.white,
    color: colors.charcoal,
    padding: "10px 11px",
    borderRadius: 10,
    outline: "none",
    fontSize: 13,
  },

  commentSend: {
    border: "none",
    background: colors.navy,
    color: colors.white,
    borderRadius: 10,
    padding: "0 13px",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
  },

  smallText: {
    fontSize: 11,
    color: colors.gray,
  },

  splitGrid: {
    display: "grid",
    gridTemplateColumns: "1.45fr 1fr",
    gap: 12,
  },

  splitCard: {
    background: colors.paper,
    border: `1px solid ${colors.border}`,
    overflow: "hidden",
  },

  splitPhoto: {
    height: 205,
    background: "#D9D5CA",
    cursor: "pointer",
  },

  splitBody: {
    padding: 14,
  },

  splitName: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 20,
    lineHeight: 1.05,
    color: colors.navy,
  },

  splitMeta: {
    marginTop: 8,
    fontSize: 11,
    color: colors.gray,
    lineHeight: 1.45,
  },

  tripCard: {
    marginTop: 34,
    background: colors.navy,
    color: colors.white,
    padding: "25px 21px",
    position: "relative",
    overflow: "hidden",
  },

  tripEyebrow: {
    color: "#A9C0CB",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
  },

  tripTitle: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 29,
    fontWeight: 500,
    marginTop: 7,
  },

  tripGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    marginTop: 22,
    borderTop: "1px solid rgba(255,255,255,0.15)",
  },

  tripStat: {
    paddingTop: 15,
    borderRight: "1px solid rgba(255,255,255,0.15)",
    paddingRight: 10,
    paddingLeft: 10,
  },

  tripNumber: {
    fontSize: 23,
    fontFamily: "Georgia, 'Times New Roman', serif",
  },

  tripLabel: {
    fontSize: 9,
    marginTop: 4,
    opacity: 0.65,
    fontWeight: 800,
    letterSpacing: "0.09em",
    textTransform: "uppercase",
  },

  nav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 80,
    height: 76,
    background: "rgba(251,249,244,0.97)",
    backdropFilter: "blur(16px)",
    borderTop: `1px solid ${colors.border}`,
    display: "flex",
    justifyContent: "center",
  },

  navInner: {
    width: "100%",
    maxWidth: 600,
    display: "grid",
    gridTemplateColumns: "1fr 1fr 78px 1fr 1fr",
    alignItems: "center",
    padding: "0 10px",
  },

  navItem: {
    border: "none",
    background: "transparent",
    color: colors.gray,
    height: 60,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    cursor: "pointer",
    textDecoration: "none",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },

  navActive: {
    color: colors.navy,
  },

  navPlus: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    border: `5px solid ${colors.ivory}`,
    background: colors.rust,
    color: colors.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto",
    boxShadow: "0 8px 22px rgba(185,104,76,0.35)",
    cursor: "pointer",
  },

  modalBackdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    background: "rgba(12,24,30,0.72)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },

  modal: {
    width: "100%",
    maxWidth: 650,
    maxHeight: "94vh",
    overflowY: "auto",
    background: colors.paper,
    borderRadius: "26px 26px 0 0",
    padding: "22px 18px 30px",
    boxShadow: "0 -15px 50px rgba(0,0,0,0.25)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  modalTitle: {
    fontFamily: "Georgia, 'Times New Roman', serif",
    color: colors.navy,
    fontSize: 30,
    fontWeight: 500,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    border: `1px solid ${colors.border}`,
    background: colors.white,
    color: colors.navy,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  formGrid: {
    display: "grid",
    gap: 13,
  },

  label: {
    display: "block",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: colors.gray,
    marginBottom: 6,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${colors.border}`,
    background: colors.white,
    color: colors.charcoal,
    padding: "13px 13px",
    fontSize: 15,
    outline: "none",
    borderRadius: 10,
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: 95,
    resize: "vertical",
    border: `1px solid ${colors.border}`,
    background: colors.white,
    color: colors.charcoal,
    padding: "13px",
    fontSize: 15,
    outline: "none",
    borderRadius: 10,
    fontFamily: "inherit",
  },

  photoUpload: {
    border: `1px dashed ${colors.lake}`,
    background: colors.lakeLight,
    minHeight: 110,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: 7,
    color: colors.navy,
    cursor: "pointer",
    borderRadius: 12,
    textAlign: "center",
    padding: 15,
  },

  thumbnails: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 7,
    marginTop: 10,
  },

  thumbnail: {
    position: "relative",
    aspectRatio: "1",
    overflow: "hidden",
    background: "#DDD",
    borderRadius: 7,
  },

  thumbnailImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  removeThumb: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.7)",
    color: colors.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  submitButton: {
    width: "100%",
    border: "none",
    background: colors.navy,
    color: colors.white,
    padding: "15px",
    fontSize: 14,
    fontWeight: 900,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    cursor: "pointer",
    borderRadius: 10,
    marginTop: 5,
  },

  viewer: {
    position: "fixed",
    inset: 0,
    zIndex: 300,
    background: "rgba(5,12,16,0.97)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  viewerImageWrap: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "75px 60px",
    boxSizing: "border-box",
    overflow: "hidden",
  },

  viewerImage: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    transition: "transform 0.2s ease",
    userSelect: "none",
  },

  viewerTop: {
    position: "absolute",
    top: 15,
    left: 15,
    right: 15,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 2,
  },

  viewerCounter: {
    color: colors.white,
    background: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    padding: "7px 11px",
    fontSize: 11,
    fontWeight: 800,
  },

  viewerControls: {
    position: "absolute",
    bottom: 20,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: 8,
    zIndex: 2,
  },

  viewerButton: {
    width: 43,
    height: 43,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.1)",
    color: colors.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },

  viewerArrow: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 46,
    height: 46,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.1)",
    color: colors.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 2,
  },

  bubbleLayer: {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 500,
    overflow: "hidden",
  },

  bubble: {
    position: "absolute",
    bottom: -40,
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: colors.lake,
    opacity: 0.75,
    animation: "floatBubble 2.8s ease-out forwards",
  },
};

function getPhotos(imageUrl: string | null): string[] {
  if (!imageUrl) return [];

  try {
    const parsed = JSON.parse(imageUrl);

    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item) => typeof item === "string"
      );
    }
  } catch {
    // Existing single-photo posts are normal URLs.
  }

  return [imageUrl];
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCommentDate(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getBrowserUserId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = localStorage.getItem(
    "ely-anglers-user-id"
  );

  if (existing) {
    return existing;
  }

  const newId =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `user-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

  localStorage.setItem(
    "ely-anglers-user-id",
    newId
  );

  return newId;
}

export default function HomePage() {
  const [catches, setCatches] = useState<Catch[]>([]);
  const [loading, setLoading] = useState(true);

  const [likes, setLikes] = useState<LikeRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);

  const [userId, setUserId] = useState("");
  const [commentName, setCommentName] = useState("");

  const [openComments, setOpenComments] =
    useState<number | null>(null);

  const [commentInputs, setCommentInputs] =
    useState<Record<number, string>>({});

  const [commentPosting, setCommentPosting] =
    useState<number | null>(null);

  const [showPostModal, setShowPostModal] =
    useState(false);

  const [name, setName] = useState("");
  const [fishSpecies, setFishSpecies] =
    useState("");
  const [length, setLength] = useState("");
  const [weight, setWeight] = useState("");
  const [lake, setLake] =
    useState("White Iron Lake");
  const [caption, setCaption] = useState("");

  const [photos, setPhotos] = useState<File[]>(
    []
  );

  const [photoPreviews, setPhotoPreviews] =
    useState<string[]>([]);

  const [posting, setPosting] = useState(false);

  const [viewerCatch, setViewerCatch] =
    useState<Catch | null>(null);

  const [viewerPhotoIndex, setViewerPhotoIndex] =
    useState(0);

  const [viewerZoom, setViewerZoom] =
    useState(1);

  const [celebrate, setCelebrate] =
    useState(false);

  useEffect(() => {
    const id = getBrowserUserId();

    setUserId(id);

    const savedName = localStorage.getItem(
      "ely-anglers-comment-name"
    );

    if (savedName) {
      setCommentName(savedName);
    }

    loadEverything();
  }, []);

  async function loadEverything() {
    setLoading(true);

    const [
      catchesResult,
      likesResult,
      commentsResult,
    ] = await Promise.all([
      supabase
        .from("catches")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("catch_likes")
        .select("id, catch_id, user_id"),

      supabase
        .from("catch_comments")
        .select(
          "id, catch_id, user_id, user_name, comment, created_at"
        )
        .order("created_at", {
          ascending: true,
        }),
    ]);

    if (catchesResult.error) {
      console.error(
        "Error loading catches:",
        catchesResult.error
      );
    } else {
      setCatches(
        (catchesResult.data || []) as Catch[]
      );
    }

    if (likesResult.error) {
      console.error(
        "Error loading likes:",
        likesResult.error
      );
    } else {
      setLikes(
        (likesResult.data || []) as LikeRow[]
      );
    }

    if (commentsResult.error) {
      console.error(
        "Error loading comments:",
        commentsResult.error
      );
    } else {
      setComments(
        (commentsResult.data ||
          []) as CommentRow[]
      );
    }

    setLoading(false);
  }

  const totalWeight = useMemo(() => {
    return catches.reduce(
      (sum, item) =>
        sum + (Number(item.weight) || 0),
      0
    );
  }, [catches]);

  const uniqueFishermen = useMemo(() => {
    return new Set(
      catches
        .map((item) =>
          item.name?.trim().toLowerCase()
        )
        .filter(Boolean)
    ).size;
  }, [catches]);

  function likeCount(catchId: number) {
    return likes.filter(
      (like) => like.catch_id === catchId
    ).length;
  }

  function commentCount(catchId: number) {
    return comments.filter(
      (comment) => comment.catch_id === catchId
    ).length;
  }

  function userLiked(catchId: number) {
    return likes.some(
      (like) =>
        like.catch_id === catchId &&
        like.user_id === userId
    );
  }

  async function toggleLike(catchId: number) {
    if (!userId) return;

    const existing = likes.find(
      (like) =>
        like.catch_id === catchId &&
        like.user_id === userId
    );

    if (existing) {
      setLikes((current) =>
        current.filter(
          (like) => like.id !== existing.id
        )
      );

      const { error } = await supabase
        .from("catch_likes")
        .delete()
        .eq("id", existing.id);

      if (error) {
        console.error(error);

        setLikes((current) => [
          ...current,
          existing,
        ]);
      }

      return;
    }

    const temporaryLike: LikeRow = {
      id: -Date.now(),
      catch_id: catchId,
      user_id: userId,
    };

    setLikes((current) => [
      ...current,
      temporaryLike,
    ]);

    const { data, error } = await supabase
      .from("catch_likes")
      .insert({
        catch_id: catchId,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error(error);

      setLikes((current) =>
        current.filter(
          (like) => like.id !== temporaryLike.id
        )
      );

      return;
    }

    setLikes((current) =>
      current.map((like) =>
        like.id === temporaryLike.id
          ? (data as LikeRow)
          : like
      )
    );
  }

  function toggleComments(catchId: number) {
    setOpenComments((current) =>
      current === catchId ? null : catchId
    );
  }

  async function addComment(catchId: number) {
    const text =
      commentInputs[catchId]?.trim() || "";

    const trimmedName = commentName.trim();

    if (!text) return;

    if (!trimmedName) {
      alert(
        "Enter your name before posting a comment."
      );
      return;
    }

    if (!userId) return;

    setCommentPosting(catchId);

    localStorage.setItem(
      "ely-anglers-comment-name",
      trimmedName
    );

    const { data, error } = await supabase
      .from("catch_comments")
      .insert({
        catch_id: catchId,
        user_id: userId,
        user_name: trimmedName,
        comment: text,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Could not post the comment.");
      setCommentPosting(null);
      return;
    }

    setComments((current) => [
      ...current,
      data as CommentRow,
    ]);

    setCommentInputs((current) => ({
      ...current,
      [catchId]: "",
    }));

    setOpenComments(catchId);
    setCommentPosting(null);
  }

  async function deleteComment(
    commentId: number
  ) {
    const comment = comments.find(
      (item) => item.id === commentId
    );

    if (!comment || comment.user_id !== userId) {
      return;
    }

    setComments((current) =>
      current.filter(
        (item) => item.id !== commentId
      )
    );

    const { error } = await supabase
      .from("catch_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error(error);

      setComments((current) => [
        ...current,
        comment,
      ]);
    }
  }

  function selectPhotos(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files || []
    );

    if (!files.length) return;

    const combined = [
      ...photos,
      ...files,
    ].slice(0, 8);

    setPhotos(combined);

    setPhotoPreviews(
      combined.map((file) =>
        URL.createObjectURL(file)
      )
    );

    event.target.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((current) =>
      current.filter((_, i) => i !== index)
    );

    setPhotoPreviews((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  function resetPostForm() {
    setName("");
    setFishSpecies("");
    setLength("");
    setWeight("");
    setLake("White Iron Lake");
    setCaption("");
    setPhotos([]);
    setPhotoPreviews([]);
  }

  async function postCatch() {
    if (
      !name.trim() ||
      !fishSpecies.trim() ||
      !lake.trim()
    ) {
      alert(
        "Please enter your name, fish species, and lake."
      );
      return;
    }

    setPosting(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of photos) {
        const safeName = file.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "-"
        );

        const filePath = `private/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}-${safeName}`;

        const { error: uploadError } =
          await supabase.storage
            .from("catch-photos")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
            });

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

        if (
          signedError ||
          !signedData?.signedUrl
        ) {
          throw (
            signedError ||
            new Error(
              "Could not create photo URL."
            )
          );
        }

        uploadedUrls.push(
          signedData.signedUrl
        );
      }

      const { error: insertError } =
        await supabase.from("catches").insert({
          name: name.trim(),
          fish_species: fishSpecies.trim(),
          length: length
            ? Number(length)
            : null,
          weight: weight
            ? Number(weight)
            : null,
          lake: lake.trim(),
          caption:
            caption.trim() || null,
          image_url:
            uploadedUrls.length > 0
              ? JSON.stringify(uploadedUrls)
              : null,
        });

      if (insertError) {
        throw insertError;
      }

      resetPostForm();
      setShowPostModal(false);

      await loadEverything();

      setCelebrate(true);

      setTimeout(() => {
        setCelebrate(false);
      }, 3000);
    } catch (error) {
      console.error(error);
      alert(
        "Something went wrong while posting the catch."
      );
    } finally {
      setPosting(false);
    }
  }

  async function deleteCatch(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this catch?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("catches")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Could not delete this catch.");
      return;
    }

    setCatches((current) =>
      current.filter((item) => item.id !== id)
    );

    setLikes((current) =>
      current.filter(
        (like) => like.catch_id !== id
      )
    );

    setComments((current) =>
      current.filter(
        (comment) =>
          comment.catch_id !== id
      )
    );

    if (viewerCatch?.id === id) {
      setViewerCatch(null);
    }
  }

  function openViewer(
    item: Catch,
    photoIndex = 0
  ) {
    setViewerCatch(item);
    setViewerPhotoIndex(photoIndex);
    setViewerZoom(1);
  }

  function closeViewer() {
    setViewerCatch(null);
    setViewerPhotoIndex(0);
    setViewerZoom(1);
  }

  function nextPhoto() {
    if (!viewerCatch) return;

    const photos = getPhotos(
      viewerCatch.image_url
    );

    if (photos.length <= 1) return;

    setViewerPhotoIndex(
      (current) =>
        (current + 1) % photos.length
    );

    setViewerZoom(1);
  }

  function previousPhoto() {
    if (!viewerCatch) return;

    const photos = getPhotos(
      viewerCatch.image_url
    );

    if (photos.length <= 1) return;

    setViewerPhotoIndex(
      (current) =>
        (current - 1 + photos.length) %
        photos.length
    );

    setViewerZoom(1);
  }

  useEffect(() => {
    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (!viewerCatch) return;

      if (event.key === "Escape") {
        closeViewer();
      }

      if (event.key === "ArrowRight") {
        nextPhoto();
      }

      if (event.key === "ArrowLeft") {
        previousPhoto();
      }

      if (event.key === "+") {
        setViewerZoom((zoom) =>
          Math.min(zoom + 0.25, 3)
        );
      }

      if (event.key === "-") {
        setViewerZoom((zoom) =>
          Math.max(zoom - 0.25, 1)
        );
      }

      if (event.key === "0") {
        setViewerZoom(1);
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
  }, [viewerCatch]);

  const firstCatch = catches[0];
  const remainingCatches = catches.slice(1);

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
          background: ${colors.ivory};
        }

        button,
        input,
        textarea {
          font: inherit;
        }

        button:active {
          transform: scale(0.97);
        }

        ::selection {
          background: ${colors.rust};
          color: white;
        }

        @keyframes floatBubble {
          0% {
            transform: translateY(0) scale(0.7);
            opacity: 0;
          }

          15% {
            opacity: 0.75;
          }

          100% {
            transform: translateY(-95vh) scale(1.3);
            opacity: 0;
          }
        }

        @media (max-width: 620px) {
          .desktopOnly {
            display: none !important;
          }

          .commentForm {
            flex-direction: column;
          }
        }
      `}</style>

      {/* HERO */}

      <section style={styles.hero}>
        <img
          src="/minnesota-sunset.jpg.png"
          alt="Minnesota sunset over the lake"
          style={styles.heroImage}
        />

        <div style={styles.heroOverlay} />

        <div style={styles.heroContent}>
          <div style={styles.eyebrow}>
            THE FAMILY FISHING JOURNAL
          </div>

          <h1 style={styles.heroTitle}>
            Ely Anglers
          </h1>

          <div style={styles.heroSubtitle}>
            White Iron Lake · Minnesota
          </div>
        </div>

        <button
          style={styles.heroPostButton}
          onClick={() =>
            setShowPostModal(true)
          }
          aria-label="Post a catch"
        >
          <Plus size={27} />
        </button>
      </section>

      {/* LAKE STRIP */}

      <div style={styles.lakeStrip}>
        <div style={styles.lakeStripText}>
          <div style={styles.lakeStripTitle}>
            WHITE IRON LAKE
          </div>

          <div style={styles.lakeStripSub}>
            Our fishing memories, all in one place
          </div>
        </div>

        <Fish size={20} />
      </div>

      <div style={styles.content}>
        {/* TRIP SNAPSHOT */}

        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.sectionEyebrow}>
                THIS TRIP
              </div>

              <h2 style={styles.sectionTitle}>
                On the Lake
              </h2>
            </div>
          </div>

          <div style={styles.statsRail}>
            <div style={styles.stat}>
              <div style={styles.statNumber}>
                {catches.length}
              </div>

              <div style={styles.statLabel}>
                Catches
              </div>
            </div>

            <div style={styles.stat}>
              <div style={styles.statNumber}>
                {uniqueFishermen}
              </div>

              <div style={styles.statLabel}>
                Anglers
              </div>
            </div>

            <div
              style={{
                ...styles.stat,
                borderRight: "none",
              }}
            >
              <div style={styles.statNumber}>
                {totalWeight.toFixed(1)}
              </div>

              <div style={styles.statLabel}>
                Total lbs
              </div>
            </div>
          </div>
        </section>

        {/* CATCHES */}

        <section
          id="catches"
          style={styles.section}
        >
          <div style={styles.sectionHeader}>
            <div>
              <div style={styles.sectionEyebrow}>
                THE JOURNAL
              </div>

              <h2 style={styles.sectionTitle}>
                Recent Catches
              </h2>
            </div>

            <button
              onClick={() =>
                setShowPostModal(true)
              }
              style={{
                ...styles.sectionLink,
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              + Add catch
            </button>
          </div>

          {loading ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>
                <Fish size={24} />
              </div>

              <div style={styles.emptyTitle}>
                Loading the journal...
              </div>
            </div>
          ) : catches.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>
                <Fish size={24} />
              </div>

              <div style={styles.emptyTitle}>
                Nothing in the journal yet
              </div>

              <div style={styles.emptyText}>
                Make the first entry from the lake.
              </div>

              <button
                onClick={() =>
                  setShowPostModal(true)
                }
                style={{
                  ...styles.submitButton,
                  maxWidth: 220,
                  margin:
                    "20px auto 0",
                }}
              >
                Post the first catch
              </button>
            </div>
          ) : (
            <div style={styles.catches}>
              {firstCatch && (
                <CatchFeature
                  item={firstCatch}
                  liked={userLiked(
                    firstCatch.id
                  )}
                  likeCount={likeCount(
                    firstCatch.id
                  )}
                  commentCount={commentCount(
                    firstCatch.id
                  )}
                  comments={comments.filter(
                    (comment) =>
                      comment.catch_id ===
                      firstCatch.id
                  )}
                  commentOpen={
                    openComments ===
                    firstCatch.id
                  }
                  commentInput={
                    commentInputs[
                      firstCatch.id
                    ] || ""
                  }
                  commentName={commentName}
                  commentPosting={
                    commentPosting ===
                    firstCatch.id
                  }
                  onLike={() =>
                    toggleLike(
                      firstCatch.id
                    )
                  }
                  onComments={() =>
                    toggleComments(
                      firstCatch.id
                    )
                  }
                  onCommentInput={(value) =>
                    setCommentInputs(
                      (current) => ({
                        ...current,
                        [firstCatch.id]:
                          value,
                      })
                    )
                  }
                  onCommentName={setCommentName}
                  onSubmitComment={() =>
                    addComment(
                      firstCatch.id
                    )
                  }
                  onDeleteComment={
                    deleteComment
                  }
                  onPhoto={() =>
                    openViewer(
                      firstCatch,
                      0
                    )
                  }
                  onDelete={() =>
                    deleteCatch(
                      firstCatch.id
                    )
                  }
                />
              )}

              {remainingCatches.length >
                0 && (
                <div style={styles.splitGrid}>
                  {remainingCatches
                    .slice(0, 2)
                    .map((item) => (
                      <CatchSmall
                        key={item.id}
                        item={item}
                        liked={userLiked(
                          item.id
                        )}
                        likeCount={likeCount(
                          item.id
                        )}
                        commentCount={commentCount(
                          item.id
                        )}
                        onLike={() =>
                          toggleLike(
                            item.id
                          )
                        }
                        onComments={() =>
                          toggleComments(
                            item.id
                          )
                        }
                        commentOpen={
                          openComments ===
                          item.id
                        }
                        onPhoto={() =>
                          openViewer(
                            item,
                            0
                          )
                        }
                        onDelete={() =>
                          deleteCatch(
                            item.id
                          )
                        }
                      />
                    ))}
                </div>
              )}

              {remainingCatches
                .slice(2)
                .map((item) => (
                  <CatchJournal
                    key={item.id}
                    item={item}
                    liked={userLiked(
                      item.id
                    )}
                    likeCount={likeCount(
                      item.id
                    )}
                    commentCount={commentCount(
                      item.id
                    )}
                    onLike={() =>
                      toggleLike(
                        item.id
                      )
                    }
                    onComments={() =>
                      toggleComments(
                        item.id
                      )
                    }
                    commentOpen={
                      openComments ===
                      item.id
                    }
                    onPhoto={() =>
                      openViewer(
                        item,
                        0
                      )
                    }
                    onDelete={() =>
                      deleteCatch(
                        item.id
                      )
                    }
                  />
                ))}
            </div>
          )}
        </section>

        {/* TRIP STATS */}

        <section style={styles.tripCard}>
          <div style={styles.tripEyebrow}>
            ELY ANGLERS
          </div>

          <div style={styles.tripTitle}>
            The White Iron Journal
          </div>

          <div style={styles.tripGrid}>
            <div style={styles.tripStat}>
              <div style={styles.tripNumber}>
                {catches.length}
              </div>

              <div style={styles.tripLabel}>
                Total catches
              </div>
            </div>

            <div style={styles.tripStat}>
              <div style={styles.tripNumber}>
                {uniqueFishermen}
              </div>

              <div style={styles.tripLabel}>
                Family anglers
              </div>
            </div>

            <div
              style={{
                ...styles.tripStat,
                borderRight: "none",
              }}
            >
              <div style={styles.tripNumber}>
                {totalWeight.toFixed(1)}
              </div>

              <div style={styles.tripLabel}>
                Pounds landed
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* NAV */}

      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <a
            href="/"
            style={{
              ...styles.navItem,
              ...styles.navActive,
            }}
          >
            <Home size={20} />
            <span>Home</span>
          </a>

          <a
            href="#catches"
            style={styles.navItem}
          >
            <Fish size={20} />
            <span>Catches</span>
          </a>

          <button
            style={styles.navPlus}
            onClick={() =>
              setShowPostModal(true)
            }
            aria-label="Post a catch"
          >
            <Plus size={29} />
          </button>

          <a
            href="/fishing-location"
            style={styles.navItem}
          >
            <Map size={20} />
            <span>Map</span>
          </a>

          <a
            href="#trip-stats"
            style={styles.navItem}
          >
            <Trophy size={20} />
            <span>Leaders</span>
          </a>
        </div>
      </nav>

      {/* POST MODAL */}

      {showPostModal && (
        <div
          style={styles.modalBackdrop}
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowPostModal(false);
            }
          }}
        >
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>
                Add to the journal
              </div>

              <button
                style={styles.closeButton}
                onClick={() =>
                  setShowPostModal(false)
                }
              >
                <X size={19} />
              </button>
            </div>

            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>
                  Angler
                </label>

                <input
                  style={styles.input}
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Who caught it?"
                />
              </div>

              <div>
                <label style={styles.label}>
                  Fish
                </label>

                <input
                  style={styles.input}
                  value={fishSpecies}
                  onChange={(event) =>
                    setFishSpecies(
                      event.target.value
                    )
                  }
                  placeholder="Walleye, pike, bass..."
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: 10,
                }}
              >
                <div>
                  <label style={styles.label}>
                    Length
                  </label>

                  <input
                    style={styles.input}
                    type="number"
                    value={length}
                    onChange={(event) =>
                      setLength(
                        event.target.value
                      )
                    }
                    placeholder="24"
                  />
                </div>

                <div>
                  <label style={styles.label}>
                    Weight
                  </label>

                  <input
                    style={styles.input}
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(event) =>
                      setWeight(
                        event.target.value
                      )
                    }
                    placeholder="5.8"
                  />
                </div>
              </div>

              <div>
                <label style={styles.label}>
                  Lake
                </label>

                <input
                  style={styles.input}
                  value={lake}
                  onChange={(event) =>
                    setLake(
                      event.target.value
                    )
                  }
                />
              </div>

              <div>
                <label style={styles.label}>
                  Story
                </label>

                <textarea
                  style={styles.textarea}
                  value={caption}
                  onChange={(event) =>
                    setCaption(
                      event.target.value
                    )
                  }
                  placeholder="Tell the story of the catch..."
                />
              </div>

              <div>
                <label style={styles.label}>
                  Photos
                </label>

                <label style={styles.photoUpload}>
                  <Camera size={25} />

                  <strong>
                    {photos.length
                      ? "Add more photos"
                      : "Choose fishing photos"}
                  </strong>

                  <span style={styles.smallText}>
                    Up to 8 photos
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={selectPhotos}
                    style={{
                      display: "none",
                    }}
                  />
                </label>

                {photoPreviews.length >
                  0 && (
                  <div
                    style={
                      styles.thumbnails
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
                            styles.thumbnail
                          }
                        >
                          <img
                            src={preview}
                            alt={`Selected photo ${
                              index +
                              1
                            }`}
                            style={
                              styles.thumbnailImg
                            }
                          />

                          <button
                            type="button"
                            style={
                              styles.removeThumb
                            }
                            onClick={() =>
                              removePhoto(
                                index
                              )
                            }
                          >
                            <X
                              size={13}
                            />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              <button
                style={{
                  ...styles.submitButton,
                  opacity: posting
                    ? 0.65
                    : 1,
                }}
                onClick={postCatch}
                disabled={posting}
              >
                {posting
                  ? "Saving catch..."
                  : "Add to journal"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO VIEWER */}

      {viewerCatch && (
        <div style={styles.viewer}>
          {(() => {
            const viewerPhotos =
              getPhotos(
                viewerCatch.image_url
              );

            const currentPhoto =
              viewerPhotos[
                viewerPhotoIndex
              ] ||
              viewerPhotos[0];

            return (
              <>
                <div
                  style={styles.viewerTop}
                >
                  <div
                    style={
                      styles.viewerCounter
                    }
                  >
                    {viewerPhotoIndex +
                      1}{" "}
                    /{" "}
                    {
                      viewerPhotos.length
                    }
                  </div>

                  <button
                    style={
                      styles.viewerButton
                    }
                    onClick={
                      closeViewer
                    }
                    aria-label="Close"
                  >
                    <X size={21} />
                  </button>
                </div>

                {viewerPhotos.length >
                  1 && (
                  <>
                    <button
                      style={{
                        ...styles.viewerArrow,
                        left: 14,
                      }}
                      onClick={
                        previousPhoto
                      }
                      aria-label="Previous photo"
                    >
                      <ChevronLeft
                        size={26}
                      />
                    </button>

                    <button
                      style={{
                        ...styles.viewerArrow,
                        right: 14,
                      }}
                      onClick={
                        nextPhoto
                      }
                      aria-label="Next photo"
                    >
                      <ChevronRight
                        size={26}
                      />
                    </button>
                  </>
                )}

                <div
                  style={
                    styles.viewerImageWrap
                  }
                >
                  <img
                    src={currentPhoto}
                    alt={`${viewerCatch.name}'s ${viewerCatch.fish_species}`}
                    style={{
                      ...styles.viewerImage,
                      transform: `scale(${viewerZoom})`,
                    }}
                  />
                </div>

                <div
                  style={
                    styles.viewerControls
                  }
                >
                  <button
                    style={
                      styles.viewerButton
                    }
                    onClick={() =>
                      setViewerZoom(
                        (zoom) =>
                          Math.max(
                            1,
                            zoom -
                              0.25
                          )
                      )
                    }
                    aria-label="Zoom out"
                  >
                    <ZoomOut size={19} />
                  </button>

                  <button
                    style={
                      styles.viewerButton
                    }
                    onClick={() =>
                      setViewerZoom(1)
                    }
                    aria-label="Reset zoom"
                  >
                    <RotateCcw
                      size={18}
                    />
                  </button>

                  <button
                    style={
                      styles.viewerButton
                    }
                    onClick={() =>
                      setViewerZoom(
                        (zoom) =>
                          Math.min(
                            3,
                            zoom +
                              0.25
                          )
                      )
                    }
                    aria-label="Zoom in"
                  >
                    <ZoomIn size={19} />
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* CELEBRATION */}

      {celebrate && (
        <div
          style={styles.bubbleLayer}
        >
          {Array.from({
            length: 22,
          }).map((_, index) => (
            <span
              key={index}
              style={{
                ...styles.bubble,
                left: `${
                  5 +
                  Math.random() * 90
                }%`,
                width: `${
                  8 +
                  Math.random() * 13
                }px`,
                height: `${
                  8 +
                  Math.random() * 13
                }px`,
                animationDelay: `${
                  Math.random() * 0.9
                }s`,
              }}
            />
          ))}
        </div>
      )}
    </main>
  );
}

/* =====================================================
   FEATURED CATCH
===================================================== */

function CatchFeature({
  item,
  liked,
  likeCount,
  commentCount,
  comments,
  commentOpen,
  commentInput,
  commentName,
  commentPosting,
  onLike,
  onComments,
  onCommentInput,
  onCommentName,
  onSubmitComment,
  onDeleteComment,
  onPhoto,
  onDelete,
}: {
  item: Catch;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  comments: CommentRow[];
  commentOpen: boolean;
  commentInput: string;
  commentName: string;
  commentPosting: boolean;
  onLike: () => void;
  onComments: () => void;
  onCommentInput: (value: string) => void;
  onCommentName: (value: string) => void;
  onSubmitComment: () => void;
  onDeleteComment: (id: number) => void;
  onPhoto: () => void;
  onDelete: () => void;
}) {
  const photos = getPhotos(
    item.image_url
  );

  return (
    <article style={styles.journalEntry}>
      {photos.length > 0 && (
        <div
          style={{
            ...styles.journalPhotoWrap,
            aspectRatio: "1.08 / 1",
          }}
          onClick={onPhoto}
        >
          <img
            src={photos[0]}
            alt={`${item.name}'s ${item.fish_species}`}
            style={styles.journalPhoto}
          />

          {photos.length > 1 && (
            <div
              style={styles.photoCount}
            >
              <Camera size={13} />
              {photos.length}
            </div>
          )}
        </div>
      )}

      <div style={styles.entryBody}>
        <div style={styles.entryTop}>
          <div>
            <div style={styles.entryName}>
              {item.name}'s Catch
            </div>

            <div style={styles.fishTag}>
              {item.fish_species}
            </div>
          </div>

          <div style={styles.entryDate}>
            {formatDate(
              item.created_at
            )}
          </div>
        </div>

        <div style={styles.metadata}>
          {item.length !== null && (
            <span>
              Length — {item.length}"
            </span>
          )}

          {item.weight !== null && (
            <span>
              Weight — {item.weight} lbs
            </span>
          )}

          <span>
            Lake — {item.lake}
          </span>
        </div>

        {item.caption && (
          <div style={styles.caption}>
            {item.caption}
          </div>
        )}

        <div
          style={styles.entryActions}
        >
          <div
            style={styles.actionGroup}
          >
            <button
              style={{
                ...styles.socialButton,
                ...(liked
                  ? styles.likedButton
                  : {}),
              }}
              onClick={onLike}
            >
              <Heart
                size={16}
                fill={
                  liked
                    ? colors.rust
                    : "none"
                }
              />

              {liked
                ? "Liked"
                : "Like"}

              {likeCount > 0 && (
                <span
                  style={
                    styles.countText
                  }
                >
                  {likeCount}
                </span>
              )}
            </button>

            <button
              style={styles.socialButton}
              onClick={onComments}
            >
              <MessageCircle
                size={16}
              />

              Comment

              {commentCount > 0 && (
                <span
                  style={
                    styles.countText
                  }
                >
                  {commentCount}
                </span>
              )}
            </button>
          </div>

          <button
            style={styles.deleteButton}
            onClick={onDelete}
            aria-label="Delete catch"
          >
            <Trash2 size={15} />
          </button>
        </div>

        {commentOpen && (
          <CommentsSection
            comments={comments}
            commentInput={commentInput}
            commentName={commentName}
            commentPosting={
              commentPosting
            }
            onCommentInput={
              onCommentInput
            }
            onCommentName={
              onCommentName
            }
            onSubmitComment={
              onSubmitComment
            }
            onDeleteComment={
              onDeleteComment
            }
          />
        )}
      </div>
    </article>
  );
}

/* =====================================================
   SMALL CATCH
===================================================== */

function CatchSmall({
  item,
  liked,
  likeCount,
  commentCount,
  onLike,
  onComments,
  commentOpen,
  onPhoto,
  onDelete,
}: {
  item: Catch;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  onLike: () => void;
  onComments: () => void;
  commentOpen: boolean;
  onPhoto: () => void;
  onDelete: () => void;
}) {
  const photos = getPhotos(
    item.image_url
  );

  return (
    <article style={styles.splitCard}>
      {photos.length > 0 && (
        <div
          style={styles.splitPhoto}
          onClick={onPhoto}
        >
          <img
            src={photos[0]}
            alt={`${item.name}'s ${item.fish_species}`}
            style={styles.journalPhoto}
          />
        </div>
      )}

      <div style={styles.splitBody}>
        <div style={styles.splitName}>
          {item.name}'s Catch
        </div>

        <div style={styles.fishTag}>
          {item.fish_species}
        </div>

        <div style={styles.splitMeta}>
          {item.length !== null &&
            `${item.length}"`}

          {item.length !== null &&
            item.weight !== null &&
            " · "}

          {item.weight !== null &&
            `${item.weight} lbs`}

          <br />

          {item.lake}
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 12,
          }}
        >
          <button
            style={{
              ...styles.socialButton,
              ...(liked
                ? styles.likedButton
                : {}),
            }}
            onClick={onLike}
          >
            <Heart
              size={14}
              fill={
                liked
                  ? colors.rust
                  : "none"
              }
            />

            {likeCount > 0 &&
              likeCount}
          </button>

          <button
            style={styles.socialButton}
            onClick={onComments}
          >
            <MessageCircle
              size={14}
            />

            {commentCount > 0 &&
              commentCount}
          </button>
        </div>

        {commentOpen && (
          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              color: colors.gray,
            }}
          >
            Tap the catch above to view
            comments.
          </div>
        )}

        <button
          style={{
            ...styles.deleteButton,
            marginTop: 10,
          }}
          onClick={onDelete}
          aria-label="Delete catch"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </article>
  );
}

/* =====================================================
   JOURNAL CATCH
===================================================== */

function CatchJournal({
  item,
  liked,
  likeCount,
  commentCount,
  onLike,
  onComments,
  commentOpen,
  onPhoto,
  onDelete,
}: {
  item: Catch;
  liked: boolean;
  likeCount: number;
  commentCount: number;
  onLike: () => void;
  onComments: () => void;
  commentOpen: boolean;
  onPhoto: () => void;
  onDelete: () => void;
}) {
  const photos = getPhotos(
    item.image_url
  );

  return (
    <article style={styles.journalEntry}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            photos.length > 0
              ? "150px 1fr"
              : "1fr",
        }}
      >
        {photos.length > 0 && (
          <div
            style={{
              ...styles.journalPhotoWrap,
              minHeight: 155,
            }}
            onClick={onPhoto}
          >
            <img
              src={photos[0]}
              alt={`${item.name}'s ${item.fish_species}`}
              style={styles.journalPhoto}
            />
          </div>
        )}

        <div style={styles.entryBody}>
          <div style={styles.entryName}>
            {item.name}'s Catch
          </div>

          <div style={styles.fishTag}>
            {item.fish_species}
          </div>

          <div style={styles.metadata}>
            {item.length !== null && (
              <span>
                {item.length}"
              </span>
            )}

            {item.weight !== null && (
              <span>
                {item.weight} lbs
              </span>
            )}

            <span>{item.lake}</span>
          </div>

          {item.caption && (
            <div style={styles.caption}>
              {item.caption}
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 7,
              marginTop: 13,
            }}
          >
            <button
              style={{
                ...styles.socialButton,
                ...(liked
                  ? styles.likedButton
                  : {}),
              }}
              onClick={onLike}
            >
              <Heart
                size={14}
                fill={
                  liked
                    ? colors.rust
                    : "none"
                }
              />

              {likeCount > 0
                ? likeCount
                : "Like"}
            </button>

            <button
              style={styles.socialButton}
              onClick={onComments}
            >
              <MessageCircle
                size={14}
              />

              {commentCount > 0
                ? commentCount
                : "Comment"}
            </button>
          </div>

          {commentOpen && (
            <div
              style={{
                marginTop: 10,
                fontSize: 11,
                color: colors.gray,
              }}
            >
              Open the featured catch
              section to view comments.
            </div>
          )}

          <button
            style={{
              ...styles.deleteButton,
              marginTop: 12,
            }}
            onClick={onDelete}
            aria-label="Delete catch"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

/* =====================================================
   COMMENTS
===================================================== */

function CommentsSection({
  comments,
  commentInput,
  commentName,
  commentPosting,
  onCommentInput,
  onCommentName,
  onSubmitComment,
  onDeleteComment,
}: {
  comments: CommentRow[];
  commentInput: string;
  commentName: string;
  commentPosting: boolean;
  onCommentInput: (value: string) => void;
  onCommentName: (value: string) => void;
  onSubmitComment: () => void;
  onDeleteComment: (id: number) => void;
}) {
  return (
    <div style={styles.commentArea}>
      {comments.length > 0 && (
        <div style={styles.commentList}>
          {comments.map((comment) => (
            <div
              key={comment.id}
              style={styles.commentBubble}
            >
              <div
                style={
                  styles.commentHeader
                }
              >
                <span
                  style={
                    styles.commentName
                  }
                >
                  {comment.user_name}
                </span>

                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    gap: 5,
                  }}
                >
                  <span
                    style={
                      styles.commentDate
                    }
                  >
                    {formatCommentDate(
                      comment.created_at
                    )}
                  </span>

                  <button
                    style={
                      styles.commentDelete
                    }
                    onClick={() =>
                      onDeleteComment(
                        comment.id
                      )
                    }
                    title="Delete your comment"
                  >
                    <Trash2
                      size={12}
                    />
                  </button>
                </div>
              </div>

              <div
                style={
                  styles.commentText
                }
              >
                {comment.comment}
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        style={{
          ...styles.commentInput,
          width: "100%",
          marginBottom: 7,
        }}
        value={commentName}
        onChange={(event) =>
          onCommentName(
            event.target.value
          )
        }
        placeholder="Your name"
      />

      <div style={styles.commentForm}>
        <input
          style={styles.commentInput}
          value={commentInput}
          onChange={(event) =>
            onCommentInput(
              event.target.value
            )
          }
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey
            ) {
              event.preventDefault();
              onSubmitComment();
            }
          }}
          placeholder="Write a comment..."
        />

        <button
          style={{
            ...styles.commentSend,
            opacity: commentPosting
              ? 0.6
              : 1,
          }}
          onClick={
            onSubmitComment
          }
          disabled={commentPosting}
        >
          {commentPosting
            ? "..."
            : "Post"}
        </button>
      </div>
    </div>
  );
}
