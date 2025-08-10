"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Task } from "@/lib/types";

export default function RecordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

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
        setCameraError(null);
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 },
            facingMode: 'environment' // Use back camera on mobile
          },
          audio: true,
        });
        if (!active) return;

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setCameraError("Camera access denied. Please allow camera permissions.");
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
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const startRecording = async () => {
    if (!stream) return;

    try {
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      setRecordedChunks([]);
      setRecordingTime(0);
      setIsPaused(false);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUpload = async () => {
    if (recordedChunks.length === 0) return;

    setIsUploading(true);
    setUploadStatus("uploading");

    try {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const formData = new FormData();
      formData.append('video', blob, 'challenge-video.webm');

      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setUploadedVideoUrl(result.videoUrl);
        setUploadStatus("success");
        
        // Auto-redirect to map page after 3 seconds
        setTimeout(() => {
          router.push('/user');
        }, 3000);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus("error");
    } finally {
      setIsUploading(false);
    }
  };

  const retakeVideo = () => {
    setRecordedChunks([]);
    setRecordingTime(0);
    setIsPaused(false);
    setUploadedVideoUrl(null);
    setAnalysisResult(null);
    setUploadStatus("idle");
  };

  if (!task) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-slate-400">
          <div className="w-16 h-16 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p>No task selected</p>
          <button 
            onClick={() => router.push('/user')}
            className="mt-4 px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button 
              onClick={() => router.push('/user')}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-center flex-1">Record Challenge</h1>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
          
          {/* Task Info */}
          <div className="bg-slate-700/30 rounded-xl p-3 border border-slate-600/30">
            <h2 className="font-semibold text-cyan-300 mb-1">{task.title}</h2>
            <p className="text-sm text-slate-300">{task.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-1 bg-slate-600/50 rounded text-xs text-slate-300">
                {task.difficulty}
              </span>
              <span className="px-2 py-1 bg-cyan-600/50 rounded text-xs text-cyan-300">
                {task.points} pts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto p-4">
        {/* Camera View */}
        <div className="relative bg-black rounded-2xl overflow-hidden mb-6 aspect-video">
          {cameraError ? (
            <div className="absolute inset-0 flex items-center justify-center text-center p-6">
              <div className="text-slate-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-sm mb-3">{cameraError}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-700 transition-colors"
                >
                  Retry Camera
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Recording Overlay */}
              {isRecording && (
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  {formatTime(recordingTime)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Recording Controls */}
        {!cameraError && (
          <div className="space-y-4 mb-6">
            {!isRecording && recordedChunks.length === 0 && (
              <button
                onClick={startRecording}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:scale-[1.02] flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z" />
                </svg>
                Start Recording
              </button>
            )}

            {isRecording && (
              <div className="flex gap-3">
                {isPaused ? (
                  <button
                    onClick={resumeRecording}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-2xl transition-colors flex items-center justify-center gap-3"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Resume
                  </button>
                ) : (
                  <button
                    onClick={pauseRecording}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-4 px-6 rounded-2xl transition-colors flex items-center justify-center gap-3"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pause
                  </button>
                )}
                
                <button
                  onClick={stopRecording}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-2xl transition-colors flex items-center justify-center gap-3"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Stop
                </button>
              </div>
            )}
          </div>
        )}

        {/* Recorded Video Preview */}
        {recordedChunks.length > 0 && !isRecording && (
          <div className="space-y-4 mb-6">
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
              <h3 className="font-semibold mb-3 text-cyan-300">Recording Complete!</h3>
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-slate-300">Duration: {formatTime(recordingTime)}</span>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={retakeVideo}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
                >
                  Retake
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className={`flex-1 font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 ${
                    isUploading
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Submit Challenge
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Status */}
        {uploadStatus === "success" && (
          <div className="bg-green-600/20 border border-green-500/30 rounded-2xl p-4 text-center">
            <svg className="w-12 h-12 text-green-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-semibold text-green-300 mb-2">Challenge Submitted!</h3>
            <p className="text-sm text-green-200 mb-4">Your video has been uploaded successfully.</p>
            <p className="text-xs text-green-300 mb-4">Redirecting to map in 3 seconds...</p>
            <button
              onClick={() => router.push('/user')}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
            >
              Back to Map Now
            </button>
          </div>
        )}

        {uploadStatus === "error" && (
          <div className="bg-red-600/20 border border-red-500/30 rounded-2xl p-4 text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="font-semibold text-red-300 mb-2">Upload Failed</h3>
            <p className="text-sm text-red-200 mb-4">There was an error uploading your video. Please try again.</p>
            <button
              onClick={handleUpload}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
