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

  const fetchBookmarks = async () => {
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setBookmarks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`bookmarks-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setBookmarks((current) => {
            // Remove temp entries (our own optimistic adds)
            const withoutTemp = current.filter((b) => !b.id.startsWith("temp-"));
            return [payload.new as Bookmark, ...withoutTemp];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "bookmarks",
        },
        (payload) => {
          setBookmarks((current) => current.filter((b) => b.id !== payload.old.id));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setBookmarks((current) =>
            current.map((b) =>
              b.id === payload.new.id ? (payload.new as Bookmark) : b
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

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

    const { error } = await supabase
      .from("bookmarks")
      .insert({ title: title.trim(), url: url.trim(), user_id: user.id });

    if (!error) {
      setTitle("");
      setUrl("");
    } else {
      setBookmarks((current) => current.filter((b) => b.id !== optimisticBookmark.id));
      console.error("Insert failed:", error);
    }

    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));

    const { error } = await supabase.from("bookmarks").delete().eq("id", id);

    if (error) {
      fetchBookmarks();
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
              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-indigo-500/50 focus:bg-white/[0.06]"
            />
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="flex-[2] rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-indigo-500/50 focus:bg-white/[0.06]"
            />
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Adding…
                </span>
              ) : (
                "Add"
              )}
            </button>
          </div>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="h-8 w-8 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04]">
              <svg className="h-8 w-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-zinc-300">No bookmarks yet</h3>
            <p className="mt-1 text-sm text-zinc-500">Add your first bookmark above to get started.</p>
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

      <footer className="border-t border-white/[0.04] py-6 text-center text-xs text-zinc-600">
        MarkIt — {bookmarks.length} bookmark{bookmarks.length !== 1 && "s"} saved
      </footer>
    </div>
  );
}