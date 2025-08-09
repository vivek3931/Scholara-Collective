import React from "react";

const Loader = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-pearl via-ivory to-cream dark:from-onyx dark:via-charcoal dark:to-onyx">
      <div className="relative w-20 h-20">
        {/* Outer spinning ring */}
        <div className="absolute inset-0 border-4 border-transparent border-t-rose-400 border-b-indigo-400 rounded-full animate-spin"></div>

        {/* Inner pulsing circle */}
        <div className="absolute inset-4 border-4 border-transparent border-t-emerald-400 border-b-cyan-400 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>

        {/* Center dot */}
        <div className="absolute inset-[35%] bg-gradient-to-br from-indigo-400 to-rose-400 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
};

export default Loader;
