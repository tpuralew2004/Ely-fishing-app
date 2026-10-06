"use client";

import { Heart, MessageCircle, Camera, Trophy, MapPin, Users, Fish } from "lucide-react";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7f5",
        color: "#17231c",
        fontFamily: "Arial, sans-serif",
        paddingBottom: "90px",
      }}
    >
      <header
        style={{
          background: "#173f2a",
          color: "white",
          padding: "22px 18px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 650, margin: "0 auto" }}>
          <div style={{ fontSize: 14, opacity: 0.8 }}>
            FAMILY FISHING TRIP
          </div>

          <h1 style={{ margin: "4px 0", fontSize: 28 }}>
            🎣 Ely Fishing Trip
          </h1>

          <div style={{ fontSize: 14, opacity: 0.85 }}>
            Ely, Minnesota
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 650, margin: "0 auto", padding: "18px" }}>
        <section
          style={{
            background: "white",
            borderRadius: 18,
            padding: 20,
            marginBottom: 18,
            boxShadow: "0 3px 12px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: 38 }}>🌲🎣</div>

          <h2 style={{ margin: "8px 0 5px", fontSize: 23 }}>
            Welcome to the trip!
          </h2>

          <p style={{ margin: 0, color: "#647067", lineHeight: 1.5 }}>
            Share your catches, photos, stories, and memories with the family.
          </p>

          <button
            style={{
              marginTop: 16,
              width: "100%",
              padding: "14px",
              border: "none",
              borderRadius: 12,
              background: "#2d7a4b",
              color: "white",
              fontSize: 16,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            📸 Post a Catch
          </button>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            marginBottom: 22,
          }}
        >
          <QuickButton icon={<Fish size={23} />} text="Catches" />
          <QuickButton icon={<Trophy size={23} />} text="Leaderboard" />
          <QuickButton icon={<Users size={23} />} text="Family" />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 21 }}>Recent Catches</h2>
          <span style={{ color: "#718078", fontSize: 13 }}>Trip Feed</span>
        </div>

        <CatchPost
          name="Dad"
          time="Today"
          lake="White Iron Lake"
          fish="Walleye"
          length="24 in"
          emoji="🐟"
          caption="First good one of the trip! Hopefully there are bigger ones out there."
        />

        <CatchPost
          name="Tom"
          time="Today"
          lake="Ely, Minnesota"
          fish="Northern Pike"
          length="31 in"
          emoji="🐊"
          caption="Finally got one! This thing put up a fight."
        />

        <section
          style={{
            background: "#173f2a",
            color: "white",
            borderRadius: 18,
            padding: 20,
            marginTop: 20,
          }}
        >
          <h2 style={{ marginTop: 0 }}>🏆 Trip Stats</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
            }}
          >
            <Stat number="12" label="Family Members" />
            <Stat number="2" label="Catches" />
            <Stat number="2" label="Species" />
            <Stat number="31 in" label="Biggest Fish" />
          </div>
        </section>
      </div>

      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "white",
          borderTop: "1px solid #dce3de",
          padding: "10px 5px",
          display: "flex",
          justifyContent: "center",
          zIndex: 20,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 650,
            display: "flex",
            justifyContent: "space-around",
          }}
        >
          <NavItem icon={<Camera size={21} />} text="Feed" active />
          <NavItem icon={<Fish size={21} />} text="Fishing" />
          <NavItem icon={<Trophy size={21} />} text="Leaders" />
          <NavItem icon={<MapPin size={21} />} text="Trip" />
          <NavItem icon={<Users size={21} />} text="Family" />
        </div>
      </nav>
    </main>
  );
}

function QuickButton({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <button
      style={{
        border: "none",
        background: "white",
        borderRadius: 14,
        padding: "14px 5px",
        color: "#254b34",
        fontWeight: "bold",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 5 }}>
        {icon}
      </div>
      <div style={{ fontSize: 12 }}>{text}</div>
    </button>
  );
}

function CatchPost({
  name,
  time,
  lake,
  fish,
  length,
  emoji,
  caption,
}: {
  name: string;
  time: string;
  lake: string;
  fish: string;
  length: string;
  emoji: string;
  caption: string;
}) {
  return (
    <article
      style={{
        background: "white",
        borderRadius: 18,
        marginBottom: 18,
        overflow: "hidden",
        boxShadow: "0 3px 12px rgba(0,0,0,0.07)",
      }}
    >
      <div
        style={{
          height: 270,
          background: "linear-gradient(135deg, #86b79b, #2d6845)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 80,
        }}
      >
        {emoji}
      </div>

      <div style={{ padding: 17 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <strong style={{ fontSize: 17 }}>{name}</strong>
            <div style={{ fontSize: 12, color: "#78837c", marginTop: 3 }}>
              {time} • {lake}
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
            }}
          >
            {fish}
          </div>
        </div>

        <div style={{ marginTop: 14, fontSize: 14 }}>
          <strong>{length}</strong>
        </div>

        <p style={{ lineHeight: 1.5, marginBottom: 12 }}>{caption}</p>

        <div
          style={{
            borderTop: "1px solid #edf0ed",
            paddingTop: 12,
            display: "flex",
            gap: 22,
            color: "#68736c",
          }}
        >
          <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <Heart size={19} /> Like
          </span>

          <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <MessageCircle size={19} /> Comment
          </span>
        </div>
      </div>
    </article>
  );
}

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
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div style={{ fontSize: 22, fontWeight: "bold" }}>{number}</div>
      <div style={{ fontSize: 12, opacity: 0.75 }}>{label}</div>
    </div>
  );
}

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
        color: active ? "#2d7a4b" : "#7b857e",
        fontSize: 11,
        fontWeight: active ? "bold" : "normal",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 3 }}>
        {icon}
      </div>
      {text}
    </div>
  );
}
