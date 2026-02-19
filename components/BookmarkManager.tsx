"use client";

import { useEffect, useState, useRef, FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import Navbar from "./Navbar";
import BookmarkCard from "./BookmarkCard";

interface Bookmark {
  id: string;
  title: string;
  url: string;
  user_id: string;
  created_at: string;
}

interface BookmarkManagerProps {
  user: User;
}

export default function BookmarkManager({ user }: BookmarkManagerProps) {
  const supabase = useRef(createClient()).current;

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchBookmarks = async () => {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBookmarks(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookmarks();
  }, [user.id]);

  useEffect(() => {
    let isMounted = true;

    const setupRealtime = async () => {
      // 🔴 CRITICAL FIX: correct session API for supabase-js v2
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      if (accessToken) {
        supabase.realtime.setAuth(accessToken);
      }

      // Clean old channel if exists (prevents duplicate subscriptions)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase
        // 🔴 FIX: Removed private channel (not needed for postgres_changes)
        .channel(`bookmarks-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookmarks",
            filter: `user_id=eq.${user.id}`, // owner-only realtime
          },
          (payload) => {
            if (!isMounted) return;

            const ev = payload.eventType;

            if (ev === "INSERT" && payload.new) {
              const newRow = payload.new as Bookmark;

              setBookmarks((current) => {
                // Remove optimistic temp items & dedupe
                const filtered = current.filter(
                  (b) => !b.id.startsWith("temp-") && b.id !== newRow.id
                );
                return [newRow, ...filtered];
              });
            }

            if (ev === "UPDATE" && payload.new) {
              const updated = payload.new as Bookmark;
              setBookmarks((current) =>
                current.map((b) => (b.id === updated.id ? updated : b))
              );
            }

            if (ev === "DELETE") {
              const oldRow = payload.old as Partial<Bookmark> | null;

              if (oldRow?.id) {
                setBookmarks((current) =>
                  current.filter((b) => b.id !== oldRow.id)
                );
              } else {
                // fallback safety
                fetchBookmarks();
              }
            }
          }
        )
        .subscribe((status) => {
          console.log("Realtime status:", status);
        });

      channelRef.current = channel;
    };

    setupRealtime();

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user.id, supabase]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    setSubmitting(true);

    const optimisticBookmark: Bookmark = {
      id: `temp-${Date.now()}`,
      title: title.trim(),
      url: url.trim(),
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    setBookmarks((current) => [optimisticBookmark, ...current]);

    const { data: inserted, error } = await supabase
      .from("bookmarks")
      .insert({
        title: title.trim(),
        url: url.trim(),
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      // rollback optimistic update
      setBookmarks((current) =>
        current.filter((b) => b.id !== optimisticBookmark.id)
      );
      console.error("Insert failed:", error);
    } else if (inserted) {
      setBookmarks((current) =>
        current.map((b) =>
          b.id === optimisticBookmark.id ? inserted : b
        )
      );
      setTitle("");
      setUrl("");
    }

    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    // Optimistic delete
    setBookmarks((prev) => prev.filter((b) => b.id !== id));

    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete failed:", error);
      fetchBookmarks(); // rollback via refetch
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0f]">
      <Navbar user={user} />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <form
          onSubmit={handleSubmit}
          className="mb-10 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
        >
          <h2 className="mb-5 text-lg font-semibold text-white/90">
            Add a bookmark
          </h2>

          <div className="flex flex-col gap-4 sm:flex-row">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
            />
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="flex-[2] rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting ? "Adding…" : "Add"}
            </button>
          </div>
        </form>

        {loading ? (
          <div className="text-center text-white/60">Loading...</div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center text-zinc-500 py-20">
            No bookmarks yet
          </div>
        ) : (
          <div className="grid gap-3">
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                id={bookmark.id}
                title={bookmark.title}
                url={bookmark.url}
                created_at={bookmark.created_at}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
