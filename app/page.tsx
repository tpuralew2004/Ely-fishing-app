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
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [fishSpecies, setFishSpecies] = useState("");
  const [length, setLength] = useState("");
  const [weight, setWeight] = useState("");
  const [lake, setLake] = useState("");
  const [caption, setCaption] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadCatches();
  }, []);

  async function loadCatches() {
    const { data, error } = await supabase
      .from("catches")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCatches(data);
    }

    setLoading(false);
  }

  async function postCatch() {
    if (!name || !fishSpecies || !length || !lake) {
      alert("Please fill in your name, fish species, length, and lake.");
      return;
    }

    setPosting(true);

    let imageUrl: string | null = null;

    if (photo) {
      const extension = photo.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${extension}`;
      const filePath = `private/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("catch-photos")
        .upload(filePath, photo);

      if (uploadError) {
        alert("Photo upload failed: " + uploadError.message);
        setPosting(false);
        return;
      }

      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("catch-photos")
          .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      if (signedUrlError) {
        alert("Could not create photo link.");
        setPosting(false);
        return;
      }

      imageUrl = signedUrlData.signedUrl;
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
      alert("Could not save catch: " + error.message);
      setPosting(false);
      return;
    }

    setName("");
    setFishSpecies("");
    setLength("");
    setWeight("");
    setLake("");
    setCaption("");
    setPhoto(null);
    setShowForm(false);
    setPosting(false);

    loadCatches();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#eef4ef",
        color: "#17231c",
        fontFamily: "Arial, sans-serif",
        paddingBottom: 90,
      }}
    >
      {/* HEADER */}

      <header
        style={{
          background: "#173f2a",
          color: "white",
          padding: "24px 18px",
        }}
      >
        <div
          style={{
            maxWidth: 650,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: 2,
              opacity: 0.75,
            }}
          >
            FAMILY FISHING TRIP
          </div>

          <h1
            style={{
              margin: "6px 0",
              fontSize: 30,
            }}
          >
            🎣 Ely Fishing Trip
          </h1>

          <div
            style={{
              fontSize: 14,
              opacity: 0.8,
            }}
          >
            Ely, Minnesota
          </div>
        </div>
      </header>

      <div
        style={{
          maxWidth: 650,
          margin: "0 auto",
          padding: 18,
        }}
      >
        {/* WELCOME */}

        <section
          style={{
            background: "white",
            borderRadius: 20,
            padding: 22,
            marginBottom: 18,
            boxShadow: "0 4px 15px rgba(0,0,0,0.07)",
          }}
        >
          <div
            style={{
              fontSize: 42,
              marginBottom: 8,
            }}
          >
            🌲🎣
          </div>

          <h2
            style={{
              margin: "0 0 6px",
              fontSize: 24,
            }}
          >
            Welcome to the trip!
          </h2>

          <p
            style={{
              margin: 0,
              color: "#68736c",
              lineHeight: 1.5,
            }}
          >
            Share your catches, photos, stories, and memories
            with the family.
          </p>

          <button
            onClick={() => setShowForm(true)}
            style={{
              width: "100%",
              marginTop: 18,
              padding: 16,
              border: "none",
              borderRadius: 13,
              background: "#2d7a4b",
              color: "white",
              fontSize: 17,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            📸 Post a Catch
          </button>
        </section>

        {/* POST FORM */}

        {showForm && (
          <section
            style={{
              background: "white",
              borderRadius: 20,
              padding: 20,
              marginBottom: 20,
              boxShadow: "0 4px 15px rgba(0,0,0,0.07)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ margin: 0 }}>
                📸 Post a Catch
              </h2>

              <button
                onClick={() => setShowForm(false)}
                style={{
                  border: "none",
                  background: "#eef2ef",
                  borderRadius: "50%",
                  width: 36,
                  height: 36,
                  cursor: "pointer",
                }}
              >
                <X size={19} />
              </button>
            </div>

            <label>Name</label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Who caught it?"
              style={inputStyle}
            />

            <label>Fish species</label>

            <input
              value={fishSpecies}
              onChange={(e) => setFishSpecies(e.target.value)}
              placeholder="Walleye, Northern Pike, Bass..."
              style={inputStyle}
            />

            <label>Length (inches)</label>

            <input
              type="number"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="24"
              style={inputStyle}
            />

            <label>Weight (optional)</label>

            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="5.2"
              style={inputStyle}
            />

            <label>Lake</label>

            <input
              value={lake}
              onChange={(e) => setLake(e.target.value)}
              placeholder="White Iron Lake"
              style={inputStyle}
            />

            <label>Caption</label>

            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Tell the family about the catch..."
              rows={4}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />

            <label>Photo</label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setPhoto(e.target.files?.[0] || null)
              }
              style={{
                width: "100%",
                marginTop: 8,
                marginBottom: 18,
              }}
            />

            <button
              onClick={postCatch}
              disabled={posting}
              style={{
                width: "100%",
                padding: 15,
                border: "none",
                borderRadius: 13,
                background: posting
                  ? "#8aa895"
                  : "#2d7a4b",
                color: "white",
                fontSize: 16,
                fontWeight: "bold",
                cursor: posting
                  ? "default"
                  : "pointer",
              }}
            >
              {posting ? "Posting..." : "Post Catch"}
            </button>
          </section>
        )}

        {/* RECENT CATCHES */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 22,
            }}
          >
            Recent Catches
          </h2>

          <span
            style={{
              color: "#718078",
              fontSize: 13,
            }}
          >
            Trip Feed
          </span>
        </div>

        {loading ? (
          <p>Loading catches...</p>
        ) : catches.length === 0 ? (
          <section
            style={{
              background: "white",
              borderRadius: 18,
              padding: 25,
              textAlign: "center",
              color: "#718078",
            }}
          >
            No catches posted yet.
          </section>
        ) : (
          catches.map((item) => (
            <CatchPost
              key={item.id}
              item={item}
            />
          ))
        )}

        {/* STATS */}

        <section
          style={{
            background: "#173f2a",
            color: "white",
            borderRadius: 20,
            padding: 20,
            marginTop: 22,
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            🏆 Trip Stats
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <Stat
              number={String(catches.length)}
              label="Catches"
            />

            <Stat
              number={String(
                new Set(
                  catches.map((c) => c.fish_species)
                ).size
              )}
              label="Species"
            />

            <Stat
              number={
                catches.length
                  ? `${Math.max(
                      ...catches.map((c) => c.length)
                    )} in`
                  : "0 in"
              }
              label="Biggest Fish"
            />

            <Stat
              number="12"
              label="Family Members"
            />
          </div>
        </section>
      </div>

      {/* BOTTOM NAV */}

      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "white",
          borderTop: "1px solid #dce3de",
          padding: "10px 5px",
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: 650,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-around",
          }}
        >
          <NavItem
            icon={<Camera size={21} />}
            text="Feed"
            active
          />

          <NavItem
            icon={<Fish size={21} />}
            text="Fishing"
          />

          <NavItem
            icon={<Trophy size={21} />}
            text="Leaders"
          />

          <NavItem
            icon={<MapPin size={21} />}
            text="Trip"
          />

          <NavItem
            icon={<Users size={21} />}
            text="Family"
          />
        </div>
      </nav>
    </main>
  );
}

/* INPUT STYLE */

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  marginTop: 6,
  marginBottom: 15,
  border: "1px solid #d5ddd8",
  borderRadius: 10,
  fontSize: 15,
  fontFamily: "inherit",
};

/* CATCH POST */

function CatchPost({
  item,
}: {
  item: Catch;
}) {
  return (
    <article
      style={{
        background: "white",
        borderRadius: 20,
        marginBottom: 18,
        overflow: "hidden",
        boxShadow: "0 3px 12px rgba(0,0,0,0.07)",
      }}
    >
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={`${item.fish_species} caught by ${item.name}`}
          style={{
            width: "100%",
            height: 280,
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            height: 220,
            background:
              "linear-gradient(135deg, #86b79b, #2d6845)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 75,
          }}
        >
          🐟
        </div>
      )}

      <div style={{ padding: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div>
            <strong style={{ fontSize: 18 }}>
              {item.name}
            </strong>

            <div
              style={{
                fontSize: 12,
                color: "#78837c",
                marginTop: 4,
              }}
            >
              {new Date(
                item.created_at
              ).toLocaleDateString()}{" "}
              • {item.lake}
            </div>
          </div>

          <div
            style={{
              background: "#e7f1ea",
              color: "#27623d",
              padding: "7px 10px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: "bold",
              height: "fit-content",
            }}
          >
            {item.fish_species}
          </div>
        </div>

        <div
          style={{
            marginTop: 15,
            fontSize: 15,
          }}
        >
          <strong>{item.length} in</strong>

          {item.weight && (
            <> • {item.weight} lb</>
          )}
        </div>

        {item.caption && (
          <p
            style={{
              lineHeight: 1.5,
              marginBottom: 12,
            }}
          >
            {item.caption}
          </p>
        )}

        <div
          style={{
            borderTop: "1px solid #edf0ed",
            paddingTop: 12,
            display: "flex",
            gap: 22,
            color: "#68736c",
          }}
        >
          <span>
            <Heart size={18} /> Like
          </span>

          <span>
            <MessageCircle size={18} /> Comment
          </span>
        </div>
      </div>
    </article>
  );
}

/* STAT */

function Stat({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.1)",
        borderRadius: 13,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: "bold",
        }}
      >
        {number}
      </div>

      <div
        style={{
          fontSize: 12,
          opacity: 0.75,
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* NAV */

function NavItem({
  icon,
  text,
  active,
}: {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        color: active
          ? "#2d7a4b"
          : "#7b857e",
        fontSize: 11,
        fontWeight: active
          ? "bold"
          : "normal",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 3,
        }}
      >
        {icon}
      </div>

      {text}
    </div>
  );
}
