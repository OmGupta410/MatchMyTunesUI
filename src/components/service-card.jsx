import React from 'react';

export const ServiceCard = (props) => {
  const {
    name = 'Unknown Service',
    icon,
    connected = false,
    onClick,
    selected = false,
  } = props || {};

  const handleClick = () => {
    if (typeof onClick === 'function') {
      onClick();
    }
  };

  const baseClasses = [
    'relative p-6 rounded-xl border-2 transition-all cursor-pointer',
    selected
      ? 'border-green-500 bg-green-500/10'
      : connected
        ? 'border-white/20 bg-white/5 hover:border-white/30'
        : 'border-white/10 bg-white/5 hover:border-white/20 opacity-60',
  ].join(' ');

  return (
    <div
      onClick={handleClick}
      className={baseClasses}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="flex items-center justify-center mb-4">
        <div className="text-4xl" aria-hidden="true">{icon}</div>
      </div>

      <h3 className="text-white font-medium text-center mb-2">{name}</h3>

      <div className="flex items-center justify-center gap-2">
        {connected ? (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-green-400">Connected</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-gray-500" />
            <span className="text-xs text-gray-400">Not Connected</span>
          </>
        )}
      </div>

      {selected && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
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

export default ServiceCard;