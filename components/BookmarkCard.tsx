interface BookmarkCardProps {
  id: string;
  title: string;
  url: string;
  created_at: string;
  onDelete: (id: string) => void;
}

export default function BookmarkCard({
  id,
  title,
  url,
  created_at,
  onDelete,
}: BookmarkCardProps) {
  const domain = (() => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  })();

  const timeAgo = (() => {
    const diff = Date.now() - new Date(created_at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  })();

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05] hover:shadow-lg hover:shadow-indigo-500/5">
      {/* Subtle gradient line at top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Title */}
          <h3 className="truncate text-base font-medium text-white/90 transition-colors group-hover:text-white">
            {title}
          </h3>

          {/* URL */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 flex items-center gap-1.5 text-sm text-indigo-400/80 transition-colors hover:text-indigo-300"
          >
            <svg
              className="h-3.5 w-3.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <span className="truncate">{domain}</span>
          </a>

          {/* Timestamp */}
          <p className="mt-2.5 text-xs text-zinc-500">{timeAgo}</p>
        </div>

        {/* Delete button */}
        <button
          onClick={() => onDelete(id)}
          className="flex-shrink-0 cursor-pointer rounded-lg p-2 text-zinc-600 opacity-0 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
          title="Delete bookmark"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
