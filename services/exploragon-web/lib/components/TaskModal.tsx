import React from "react";
import { useRouter } from "next/navigation";
import { Task } from "../types";
import { Coords } from "../types";
import { calculateDistance } from "../gps-utils";

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
  userLocation?: Coords | null;
}

export const TaskModal = React.memo(function TaskModal({ task, onClose, userLocation }: TaskModalProps) {
  const router = useRouter();

  if (!task) return null;

  // Check if user is at the hexagon location (within 100 meters)
  const isUserAtLocation = userLocation && task.coordinates ? 
    calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      task.coordinates.lat,
      task.coordinates.lng
    ) <= 100 : false;

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return {
          color: "text-accent-primary",
          label: "LOW_RISK",
          prefix: "[L]"
        };
      case "medium":
        return {
          color: "text-accent-secondary",
          label: "MED_RISK",
          prefix: "[M]"
        };
      case "hard":
        return {
          color: "text-accent-primary",
          label: "HIGH_RISK",
          prefix: "[H]"
        };
      default:
        return {
          color: "text-terminal-secondary",
          label: "UNKNOWN",
          prefix: "[?]"
        };
    }
  };

  const difficultyConfig = getDifficultyConfig(task.difficulty);

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
      <div className="terminal-container max-w-md w-full mx-4 animate-fadeInUp">
        {/* Terminal Header */}
        <div className="terminal-header">
          <div className="terminal-dots"></div>
          <span className="text-accent-primary">challenge_info.sh</span>
          <button
            onClick={onClose}
            className="ml-auto text-accent-secondary hover:text-text-primary transition-colors text-xs"
          >
            [ESC]
          </button>
        </div>

        {/* Terminal Content */}
        <div className="p-6 space-y-4 bg-black opacity-90 rounded-sm drop-shadow-lg">
          <div className="command-prompt mb-4">
            cat /missions/{task.id}.json
          </div>
          
          <div className="pl-4 space-y-4">
            {/* Mission Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-accent-secondary">MISSION:</span>
                <span className="text-accent-primary font-semibold">{task.title}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-accent-secondary">RISK_LEVEL:</span>
                <span className={`${difficultyConfig.color} font-mono`}>
                  {difficultyConfig.prefix} {difficultyConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-accent-secondary">REWARD:</span>
                <span className="text-accent-primary font-mono">{task.points.toString().padStart(3, '0')} pts</span>
              </div>
            </div>

            {/* Mission Description */}
            <div className="border-l-2 border-accent-primary/30 pl-4 py-2">
              <div className="text-accent-secondary text-xs mb-1">OBJECTIVE:</div>
              <div className="text-terminal-primary text-sm">{task.description}</div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-accent-secondary">LOCATION:</span>
                <span className="text-terminal-primary">{task.location}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-accent-secondary">COORDS:</span>
                <span className="text-terminal-secondary font-mono">
                  {task.coordinates.lat.toFixed(4)}, {task.coordinates.lng.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Location Status */}
            {userLocation && (
              <div className="border-t border-accent-primary/20 pt-4 space-y-3">
                <div className="text-accent-secondary text-xs">LOCATION_STATUS:</div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
                  <div className={`w-3 h-3 rounded-full ${isUserAtLocation ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                  <div className="text-sm">
                    <span className={`font-medium ${isUserAtLocation ? 'text-green-300' : 'text-yellow-300'}`}>
                      {isUserAtLocation ? 'At location' : 'Not at location'}
                    </span>
                    <div className="text-xs text-slate-400">
                      {isUserAtLocation 
                        ? 'You can start this challenge!' 
                        : 'Move closer to start this challenge'
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t border-accent-primary/20 pt-4 space-y-3">
              <div className="text-accent-secondary text-xs">SELECT_ACTION:</div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onClose();
                    router.push(
                      `/record?task=${encodeURIComponent(JSON.stringify(task))}`,
                    );
                  }}
                  disabled={!isUserAtLocation}
                  className={`terminal-button-primary flex-1 text-center text-sm ${
                    !isUserAtLocation ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isUserAtLocation ? '[1] ACCEPT_MISSION' : '[1] MOVE_CLOSER'}
                </button>
                <button
                  onClick={onClose}
                  className="terminal-button text-sm px-4"
                >
                  [0] ABORT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
