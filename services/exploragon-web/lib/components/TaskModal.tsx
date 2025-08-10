import React from "react";
import { useRouter } from "next/navigation";
import { Task } from "../types";

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
}

export function TaskModal({ task, onClose }: TaskModalProps) {
  const router = useRouter();

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-800">{task.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <span
            className={`inline-block px-2 py-1 rounded text-sm ${
              task.difficulty === "easy"
                ? "bg-green-100 text-green-800"
                : task.difficulty === "medium"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}
          </span>
          <span className="ml-2 font-semibold text-blue-600">
            {task.points} points
          </span>
        </div>

        <p className="text-gray-600 mb-3">{task.description}</p>
        <p className="text-sm text-gray-500 mb-4">📍 {task.location}</p>

        <div className="flex gap-2">
          <button
            onClick={() => {
              onClose();
              router.push(
                `/record?task=${encodeURIComponent(JSON.stringify(task))}`,
              );
            }}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
          >
            Start Challenge
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
