import React from "react";
import { useRouter } from "next/navigation";
import { Task } from "../types";

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
}

export const TaskModal = React.memo(function TaskModal({ task, onClose }: TaskModalProps) {
  const router = useRouter();

  if (!task) return null;

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return {
          bgClass: "bg-gradient-to-r from-emerald-500/20 to-green-500/20 border-emerald-500/30",
          textClass: "text-emerald-300",
          icon: "🌟"
        };
      case "medium":
        return {
          bgClass: "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30",
          textClass: "text-yellow-300",
          icon: "⚡"
        };
      case "hard":
        return {
          bgClass: "bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/30",
          textClass: "text-red-300",
          icon: "🔥"
        };
      default:
        return {
          bgClass: "bg-gradient-to-r from-slate-500/20 to-slate-600/20 border-slate-500/30",
          textClass: "text-slate-300",
          icon: "⭐"
        };
    }
  };

  const difficultyConfig = getDifficultyConfig(task.difficulty);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">{task.title}</h2>
              <div className="text-sm text-slate-400">Challenge Available</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-slate-700/50 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`px-3 py-2 rounded-xl border ${difficultyConfig.bgClass} flex items-center gap-2`}>
            <span className="text-sm">{difficultyConfig.icon}</span>
            <span className={`text-sm font-medium ${difficultyConfig.textClass}`}>
              {task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}
            </span>
          </div>
          <div className="px-3 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <span className="text-sm font-semibold text-cyan-300">
              {task.points} points
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-4 mb-6">
          <p className="text-slate-300 leading-relaxed">{task.description}</p>
        </div>

        {/* Location */}
        <div className="flex items-center gap-3 mb-8 text-slate-400">
          <div className="w-8 h-8 bg-slate-700/50 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-slate-300">{task.location}</div>
            <div className="text-xs text-slate-500">Challenge location</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              onClose();
              router.push(
                `/record?task=${encodeURIComponent(JSON.stringify(task))}`,
              );
            }}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Start Challenge</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white font-medium rounded-xl transition-all duration-300 hover:bg-slate-700/50 backdrop-blur-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});
