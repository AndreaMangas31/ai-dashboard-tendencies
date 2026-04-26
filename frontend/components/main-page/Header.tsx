export const Header: React.FC<{
  briefingOpen: boolean;
  setBriefingOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ briefingOpen, setBriefingOpen }) => {
  return (
    <header className="sticky top-0 z-30 bg-tech-black-950/95 border-b border-tech-black-600 py-6 px-4 md:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Tech Pulse
          </h1>
          <p className="text-sm text-slate-400 ">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <button
          onClick={() => setBriefingOpen(true)}
          className={`
                  px-4 py-2 rounded-lg font-semibold text-sm
                  transition-all duration-200 whitespace-nowrap
                  ${
                    briefingOpen
                      ? "bg-slate-700 text-slate-400"
                      : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-blue-500/50 active:scale-95"
                  }
                `}
        >
          <span className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Generate Brief
          </span>
        </button>
      </div>
    </header>
  );
};
