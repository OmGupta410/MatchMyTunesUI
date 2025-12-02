import React from 'react';

interface ServiceCardProps {
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  onClick: () => void;
  selected?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  name,
  icon,
  connected,
  onClick,
  selected = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative p-6 rounded-xl border-2 transition-all cursor-pointer
        ${selected 
          ? 'border-green-500 bg-green-500/10' 
          : connected 
            ? 'border-white/20 bg-white/5 hover:border-white/30' 
            : 'border-white/10 bg-white/5 hover:border-white/20 opacity-60'
        }
      `}
    >
      {/* Icon */}
      <div className="flex items-center justify-center mb-4">
        <div className="text-4xl">{icon}</div>
      </div>

      {/* Name */}
      <h3 className="text-white font-medium text-center mb-2">{name}</h3>

      {/* Status Badge */}
      <div className="flex items-center justify-center gap-2">
        {connected ? (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-green-400">Connected</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
            <span className="text-xs text-gray-400">Not Connected</span>
          </>
        )}
      </div>

      {/* Selected Indicator */}
      {selected && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

