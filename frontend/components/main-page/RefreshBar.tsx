"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPause, faPlay, faSync } from "@fortawesome/free-solid-svg-icons";
import { CustomButton } from "../CustomButton";

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
          <p className="text-sm font-medium text-slate-300">
            {timeAgo ? timeAgo : "..."}
          </p>
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

      <div id="action-buttons" className="flex flex-row items-center gap-2">
        <CustomButton
          id="pause-button"
          variant="ghost"
          onClick={togglePause}
          className=" transition-colors"
          icon={
            <FontAwesomeIcon
              icon={!isPaused ? faPause : faPlay}
              className="w-4 h-4 "
            />
          }
        >
          {!isPaused ? "Pause" : "Resume"}
        </CustomButton>

        <CustomButton
          variant="secondary"
          onClick={onRefresh}
          disabled={loading}
          className={`transition-all duration-200
          ${loading ? " cursor-not-allowed" : "active:scale-95"}
        `}
          icon={
            <FontAwesomeIcon
              icon={faSync}
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
          }
        >
          {loading ? "Refreshing..." : "Refresh"}
        </CustomButton>
      </div>
    </div>
  );
}
