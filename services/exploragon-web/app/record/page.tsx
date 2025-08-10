"use client";

import { useEffect, useRef, useState } from "react";
import {
  setupCamera,
  createMediaRecorder,
  uploadVideo,
  stopAllTracks,
} from "@/lib/media-utils";

export default function RecordPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");

  useEffect(() => {
    async function initCamera() {
      const mediaStream = await setupCamera(videoRef);
      if (mediaStream) {
        setStream(mediaStream);
      }
    }

    initCamera();
  }, []);

  useEffect(() => {
    return () => {
      stopAllTracks(stream);
    };
  }, [stream]);

  const startRecording = () => {
    if (!stream) return;

    const mediaRecorder = createMediaRecorder(stream, (event) => {
      if (event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
      }
    });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleUploadVideo = async () => {
    setUploadStatus("uploading");
    setIsUploading(true);

    try {
      const data = await uploadVideo(recordedChunks);
      console.log("Upload successful:", data);

      setUploadStatus("success");
      setRecordedChunks([]);
    } catch (error) {
      console.error("Error uploading video:", error);
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Record Challenge Video</h1>

        <div className="relative aspect-video mb-6 bg-gray-900 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4 justify-center">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={isUploading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                disabled={isUploading}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Stop Recording
              </button>
            )}

            {recordedChunks.length > 0 &&
              !isUploading &&
              uploadStatus !== "success" && (
                <button
                  onClick={handleUploadVideo}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upload Video
                </button>
              )}
          </div>

          {uploadStatus === "uploading" && (
            <div className="text-blue-600 font-medium">Uploading video...</div>
          )}
          {uploadStatus === "success" && (
            <div className="text-green-600 font-medium">
              Video uploaded successfully!
            </div>
          )}
          {uploadStatus === "error" && (
            <div className="text-red-600 font-medium">
              Failed to upload video. Please try again.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
