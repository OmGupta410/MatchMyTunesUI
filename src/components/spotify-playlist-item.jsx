import { useSelectionStore } from "../store/selection.js";

/**
 * Renders a selectable playlist row.
 * @param {{
 *   id: string,
 *   name: string,
 *   image?: string,
 *   trackCount: number,
 *   type?: "playlist" | "favorite-songs" | "favorite-albums" | "favorite-artists",
 *   icon?: import("react").ReactNode,
 *   provider?: string,
 *   onExpand?: () => void,
 *   isExpanded?: boolean,
 *   loadingTracks?: boolean
 * }} props
 */
const SpotifyPlaylistItem = ({
  id,
  name,
  image,
  trackCount,
  type = "playlist",
  icon,
  provider = "spotify",
  onExpand,
  isExpanded = false,
  loadingTracks = false,
}) => {
  const { isSelected, togglePlaylist } = useSelectionStore();
  const selected = isSelected(id);

  const handleToggle = () => {
    togglePlaylist({
      id,
      name,
      image,
      trackCount,
      type,
      provider,
    });
  };

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
      onClick={handleToggle}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={handleToggle}
        onClick={(event) => event.stopPropagation()}
        className="w-5 h-5 rounded border-gray-600 bg-transparent text-green-500 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 cursor-pointer accent-green-500"
      />

      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : icon ? (
          <div className="text-white text-2xl">{icon}</div>
        ) : (
          <div className="text-white text-xl font-bold">
            {name?.charAt(0)?.toUpperCase?.() || "?"}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-white font-medium text-sm truncate">{name}</h3>
        <p className="text-gray-400 text-xs mt-1">
          {selected ? `${trackCount}/${trackCount} selected` : `0/${trackCount} selected`}
        </p>
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (onExpand) {
            onExpand();
          }
        }}
        className="flex items-center justify-center w-8 h-8 rounded-full border border-white/10 hover:border-white/30 text-gray-400 hover:text-white transition-colors"
        title={isExpanded ? "Collapse" : "View tracks"}
      >
        {loadingTracks ? (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
            <path className="opacity-75" d="M4 12a8 8 0 018-8" strokeWidth="4" strokeLinecap="round" />
          </svg>
        ) : (
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>
    </div>
  );
};

export { SpotifyPlaylistItem };
