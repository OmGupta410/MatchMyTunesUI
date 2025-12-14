/**
 * Displays a music service card with connection indicator.
 * @param {{
 *  name:string,
 *  icon:import("react").ReactNode,
 *  connected:boolean,
 *  onClick:Function,
 *  selected?:boolean,
 *  disabled?:boolean,
 *  badge?:string
 * }} props
 */
const ServiceCard = ({
  name,
  icon,
  connected,
  onClick,
  selected = false,
  disabled = false,
  badge,
}) => {
  const baseClass = "relative p-6 rounded-xl border-2 transition-all";
  const interactiveClass = disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer";
  const connectionClass = connected
    ? "border-white/20 bg-white/5 hover:border-white/30"
    : "border-white/10 bg-white/5 hover:border-white/20";
  const selectedClass = selected ? "border-green-500 bg-green-500/10" : "";

  const handleClick = disabled ? undefined : onClick;

  return (
    <div onClick={handleClick} className={[baseClass, interactiveClass, connectionClass, selectedClass].join(" ")}>
      {badge && (
        <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] uppercase tracking-widest bg-white/10 text-gray-300 rounded-full">
          {badge}
        </span>
      )}

      <div className="flex items-center justify-center mb-4">
        <div className="text-4xl">{icon}</div>
      </div>

      <h3 className="text-white font-medium text-center mb-2">{name}</h3>

      <div className="flex items-center justify-center gap-2 text-xs">
        <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-500"}`} />
        <span className={connected ? "text-green-400" : "text-gray-400"}>
          {connected ? "Connected" : disabled ? "Unavailable" : "Not connected"}
        </span>
      </div>

      {selected && !disabled && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export { ServiceCard };
