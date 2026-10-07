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
  species: string;
  weight: number | null;
  length: number | null;
  notes: string | null;
  photo_path: string | null;
  created_at: string;
};

export default function Home() {
  const [catches, setCatches] = useState<Catch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPost, setShowPost] = useState(false);

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);

  async function loadCatches() {
    setLoading(true);

    const { data, error } = await supabase
      .from("catches")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const withPhotos = await Promise.all(
        data.map(async (item) => {
          if (!item.photo_path) return item;

          const { data: signed } = await supabase.storage
            .from("catch-photos")
            .createSignedUrl(item.photo_path, 60 * 60 * 24);

          return {
            ...item,
            photo_path: signed?.signedUrl || null,
          };
        })
      );

      setCatches(withPhotos);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadCatches();
  }, []);

  async function postCatch() {
    if (!name || !species) {
      alert("Please enter your name and the fish species.");
      return;
    }

    setPosting(true);

    try {
      let photoPath = null;

      if (photo) {
        const fileExt = photo.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;

        const path = `private/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("catch-photos")
          .upload(path, photo);

        if (uploadError) {
          throw uploadError;
        }

        photoPath = path;
      }

      const { error } = await supabase.from("catches").insert({
        name,
        species,
        weight: weight ? Number(weight) : null,
        length: length ? Number(length) : null,
        notes: notes || null,
        photo_path: photoPath,
      });

      if (error) {
        throw error;
      }

      setName("");
      setSpecies("");
      setWeight("");
      setLength("");
      setNotes("");
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
    <main className="min-h-screen bg-[#071d18] text-white pb-24">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#123f34] via-[#0b2b24] to-[#071d18]" />

        <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute top-40 -left-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative px-5 pt-10 pb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium tracking-widest text-emerald-300 uppercase">
                White Iron Lake
              </p>

              <h1 className="mt-1 text-4xl font-black tracking-tight">
                Ely Fishing
              </h1>

              <p className="mt-2 text-sm text-emerald-100/70">
                Family Fishing Trip • Minnesota
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur">
              <Fish size={25} />
            </div>
          </div>

          {/* Trip card */}
          <div className="mt-7 rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400 text-[#071d18]">
                <MapPin size={22} />
              </div>

              <div>
                <p className="font-bold">White Iron Lake</p>
                <p className="text-sm text-white/60">
                  Ely, Minnesota
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs text-white/50">Family</p>
                <p className="mt-1 text-xl font-bold">12</p>
                <p className="text-xs text-white/50">People</p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs text-white/50">Catches</p>
                <p className="mt-1 text-xl font-bold">
                  {catches.length}
                </p>
                <p className="text-xs text-white/50">So far</p>
              </div>
            </div>
          </div>

          {/* Post button */}
          <button
            onClick={() => setShowPost(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 py-4 font-bold text-[#071d18] shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-300 active:scale-[0.98]"
          >
            <Plus size={21} />
            Post a Catch
          </button>
        </div>
      </section>

      {/* CATCH FEED */}
      <section className="px-5 pt-3">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
              The catch board
            </p>
            <h2 className="mt-1 text-2xl font-black">
              Recent Catches
            </h2>
          </div>

          <Fish className="text-white/20" size={28} />
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white/50">
            Loading catches...
          </div>
        ) : catches.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <Fish className="mx-auto text-emerald-400" size={35} />
            <p className="mt-3 font-bold">No catches yet</p>
            <p className="mt-1 text-sm text-white/50">
              Be the first one to post a fish!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {catches.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-xl"
              >
                {item.photo_path && (
                  <img
                    src={item.photo_path}
                    alt={item.species}
                    className="h-64 w-full object-cover"
                  />
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-emerald-300">
                        {item.name}
                      </p>

                      <h3 className="mt-1 text-2xl font-black">
                        {item.species}
                      </h3>
                    </div>

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
                      <Fish
                        size={22}
                        className="text-emerald-300"
                      />
                    </div>
                  </div>

                  {(item.weight || item.length) && (
                    <div className="mt-4 flex gap-2">
                      {item.weight && (
                        <div className="rounded-xl bg-black/20 px-3 py-2">
                          <p className="text-xs text-white/40">
                            Weight
                          </p>
                          <p className="font-bold">
                            {item.weight} lbs
                          </p>
                        </div>
                      )}

                      {item.length && (
                        <div className="rounded-xl bg-black/20 px-3 py-2">
                          <p className="text-xs text-white/40">
                            Length
                          </p>
                          <p className="font-bold">
                            {item.length} in
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {item.notes && (
                    <p className="mt-4 text-sm leading-6 text-white/60">
                      {item.notes}
                    </p>
                  )}

                  <div className="mt-5 flex items-center gap-5 border-t border-white/10 pt-4 text-white/40">
                    <button className="flex items-center gap-2 text-sm">
                      <Heart size={18} />
                      Like
                    </button>

                    <button className="flex items-center gap-2 text-sm">
                      <MessageCircle size={18} />
                      Comment
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* STATS */}
      <section className="px-5 pt-8">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#123f34] to-[#0b2922] p-5">
          <div className="flex items-center gap-3">
            <Trophy className="text-yellow-300" size={25} />
            <h2 className="text-xl font-black">Trip Stats</h2>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-black/20 p-4 text-center">
              <p className="text-2xl font-black">{catches.length}</p>
              <p className="mt-1 text-xs text-white/50">
                Catches
              </p>
            </div>

            <div className="rounded-2xl bg-black/20 p-4 text-center">
              <p className="text-2xl font-black">
                {new Set(catches.map((c) => c.name)).size}
              </p>
              <p className="mt-1 text-xs text-white/50">
                Fishermen
              </p>
            </div>

            <div className="rounded-2xl bg-black/20 p-4 text-center">
              <p className="text-2xl font-black">🏆</p>
              <p className="mt-1 text-xs text-white/50">
                Leaderboard
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#071d18]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md justify-around px-3 py-3">
          <button className="flex flex-col items-center gap-1 text-emerald-300">
            <Fish size={21} />
            <span className="text-[10px] font-bold">Feed</span>
          </button>

          <button className="flex flex-col items-center gap-1 text-white/40">
            <MapPin size={21} />
            <span className="text-[10px] font-bold">Fishing</span>
          </button>

          <button className="flex flex-col items-center gap-1 text-white/40">
            <Trophy size={21} />
            <span className="text-[10px] font-bold">Leaders</span>
          </button>

          <button className="flex flex-col items-center gap-1 text-white/40">
            <Users size={21} />
            <span className="text-[10px] font-bold">Family</span>
          </button>
        </div>
      </nav>

      {/* POST MODAL */}
      {showPost && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-t-[2rem] border border-white/10 bg-[#0b2922] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
                  New catch
                </p>
                <h2 className="mt-1 text-2xl font-black">
                  Post Your Fish
                </h2>
              </div>

              <button
                onClick={() => setShowPost(false)}
                className="rounded-full bg-white/10 p-2"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/30"
              />

              <input
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                placeholder="Fish species"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/30"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Weight (lbs)"
                  type="number"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/30"
                />

                <input
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="Length (in)"
                  type="number"
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/30"
                />
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tell the family about the catch..."
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/30"
              />

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-400/30 bg-emerald-400/5 px-4 py-4 text-sm text-emerald-300">
                <Camera size={20} />
                {photo ? photo.name : "Add a photo"}

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    setPhoto(e.target.files?.[0] || null)
                  }
                />
              </label>

              <button
                onClick={postCatch}
                disabled={posting}
                className="w-full rounded-xl bg-emerald-400 py-4 font-black text-[#071d18] disabled:opacity-50"
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
