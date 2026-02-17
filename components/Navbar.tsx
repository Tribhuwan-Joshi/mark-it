"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

interface NavbarProps {
  user: User;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img src="/bookmark.png" alt="MarkIt Logo" className="h-9 w-9 object-contain" />
          <span className="text-lg font-semibold tracking-tight text-white">
            MarkIt
          </span>
        </div>

        {/* User info + Sign out */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            {user.user_metadata?.avatar_url && (
              <img
                src={user.user_metadata.avatar_url}
                alt="avatar"
                className="h-8 w-8 rounded-full ring-2 ring-white/10"
              />
            )}
            <span className="hidden text-sm text-zinc-300 sm:block">
              {user.user_metadata?.full_name || user.email}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 transition-all duration-200 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
