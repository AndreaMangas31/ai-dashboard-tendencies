"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPause, faPlay, faSync } from "@fortawesome/free-solid-svg-icons";

interface RefreshBarProps {
  fetchedAt: string | null;
  onRefresh: () => void;
  loading: boolean;
}

export function RefreshBar({ fetchedAt, onRefresh, loading }: RefreshBarProps) {
  const [timeAgo, setTimeAgo] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(600); // 10 minutes
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Update relative time
  useEffect(() => {
    if (!fetchedAt) return;
    const updateTime = () => {
      const now = new Date();
      const date = new Date(fetchedAt);
      const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSecs < 60) {
        setTimeAgo("just now");
      } else if (diffSecs < 3600) {
        const mins = Math.floor(diffSecs / 60);
        setTimeAgo(`${mins}m ago`);
      } else {
        const hours = Math.floor(diffSecs / 3600);
        setTimeAgo(`${hours}h ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [fetchedAt]);

  // Update countdown
  useEffect(() => {
    if (isPaused) return; // Stop countdown when paused

    const interval = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 600 : prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const countdownMins = Math.floor(countdown / 60);
  const countdownSecs = countdown % 60;
  function togglePause() {
    setIsPaused((prev) => !prev);
  }

  return (
    <div className="bg-tech-black-900 border border-tech-black-600 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <p className="text-xs text-slate-500">Last updated</p>
          <p className="text-sm font-medium text-slate-300">{timeAgo}</p>
        </div>

        <div className="w-px h-8 bg-tech-black-700" />

        <div>
          <p className="text-xs text-slate-500">Next refresh in</p>
          {/* Backwards Counter */}
          <p className="text-sm font-mono font-medium text-slate-300">
            {String(countdownMins).padStart(2, "0")}:
            {String(countdownSecs).padStart(2, "0")}
          </p>
        </div>
      </div>

      <div id="action-buttons" className="flex flex-row items-center gap-6">
        <button
          id="pause-button"
          onClick={togglePause}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={!isPaused ? faPause : faPlay}
              className="w-4 h-4 "
            />
            {isPaused ? "Resume" : "Pause"}
          </span>
        </button>

        <button
          id="refresh-button"
          onClick={onRefresh}
          disabled={loading}
          className={`
          px-4 py-2 rounded-lg font-medium text-sm
          transition-all duration-200
          ${
            loading
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
          }
        `}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faSync} className="w-4 h-4 animate-spin" />
              Refreshing
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faSync} className="w-4 h-4" />
              Refresh
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
