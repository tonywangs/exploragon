"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Task } from "@/lib/types";

export default function RecordClient() {
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  useEffect(() => {
    const taskParam = searchParams.get("task");
    if (taskParam) {
      try {
        const taskData = JSON.parse(decodeURIComponent(taskParam));
        setTask(taskData);
      } catch (error) {
        console.error("Error parsing task data:", error);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        if (!active) return;

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    }

    setupCamera();

    return () => {
      active = false;
      setIsRecording(false);
      try {
        mediaRecorderRef.current?.stop();
      } catch {}
      setRecordedChunks([]);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []); // mount-only

  // Render your UI (buttons/handlers omitted for brevity)
  return (
    <main>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: "100%", maxWidth: 800 }}
      />
      {/* ...rest of your UI... */}
    </main>
  );
}
