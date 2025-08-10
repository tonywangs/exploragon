'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Task } from '@/lib/types';

export default function RecordPage() {
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  useEffect(() => {
    // Extract task from URL parameters
    const taskParam = searchParams.get('task');
    if (taskParam) {
      try {
        const taskData = JSON.parse(decodeURIComponent(taskParam));
        setTask(taskData);
      } catch (error) {
        console.error('Error parsing task data:', error);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    //request camera access when component mounts
    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    }

    setupCamera();

    //cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = () => {
    if (!stream) return;

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks(prev => [...prev, event.data]);
      }
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadVideo = async () => {
    console.log('=== Starting Video Upload Process ===');
    
    if (recordedChunks.length === 0) {
      console.error('No video chunks recorded');
      return;
    }
    
    console.log('Number of recorded chunks:', recordedChunks.length);
    
    const videoBlob = new Blob(recordedChunks, {
      type: 'video/webm'
    });
    console.log('Video blob created:', {
      size: videoBlob.size,
      type: videoBlob.type
    });

    // Create FormData to send the file
    const formData = new FormData();
    formData.append('video', videoBlob, 'challenge-video.webm');
    
    // Add task information for validation
    if (task) {
      formData.append('task', JSON.stringify(task));
    }
    
    console.log('FormData created with video and task:', task);
    
    setUploadStatus('uploading');
    setIsUploading(true);

    try {
      console.log('Sending request to API...');
      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData,
      });
      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        console.error('Upload failed with status:', response.status);
        throw new Error('Upload failed');
      }

      const data = await response.json();
      console.log('=== Upload Response Debug ===');
      console.log('Success:', data.success);
      console.log('Message:', data.message);
      console.log('Video URL:', data.videoUrl);
      console.log('Analysis:', data.analysis);
      if (data.analysis) {
        console.log('Person Detected:', data.analysis.personDetected);
        console.log('Raw Gemini Response:', data.analysis.rawResponse);
      }
      console.log('===========================');
      
      setUploadStatus('success');
      setUploadedVideoUrl(data.videoUrl);
      setAnalysisResult(data.analysis);
      // Clear recorded chunks after successful upload
      setRecordedChunks([]);
    } catch (error) {
      console.error('Error uploading video:', error);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          {task ? `Challenge: ${task.title}` : 'Video Validation'}
        </h1>
        
        {task && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-blue-800">{task.title}</h2>
              <span className={`px-2 py-1 rounded text-sm ${
                task.difficulty === "easy" ? "bg-green-100 text-green-800" :
                task.difficulty === "medium" ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              }`}>
                {task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)}
              </span>
            </div>
            <p className="text-blue-700 mb-2">{task.description}</p>
            <div className="flex items-center justify-between text-sm text-blue-600">
              <span>📍 {task.location}</span>
              <span className="font-semibold">{task.points} points</span>
            </div>
          </div>
        )}
        
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
          
          {recordedChunks.length > 0 && !isUploading && uploadStatus !== 'success' && (
            <button
              onClick={uploadVideo}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload Video
            </button>
          )}
        </div>

        {uploadStatus === 'uploading' && (
          <div className="text-blue-600 font-medium">
            Uploading video...
          </div>
        )}
        {uploadStatus === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-green-600 font-medium">
              Video uploaded successfully!
            </div>
            {uploadedVideoUrl && (
              <div className="mt-4 w-full max-w-2xl">
                <h3 className="text-lg font-semibold mb-2">Uploaded Video:</h3>
                <video 
                  src={uploadedVideoUrl}
                  controls
                  className="w-full rounded-lg"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
            {analysisResult && (
              <div className="mt-6 w-full max-w-2xl bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Challenge Validation Results:</h3>
                <div className="space-y-2">
                  <div className={`flex items-center ${analysisResult.challengeCompleted ? 'text-green-600' : 'text-red-600'}`}>
                    <span className="font-medium">Challenge Status: </span>
                    <span className="ml-2">
                      {analysisResult.challengeCompleted ? '✓ Challenge Completed!' : '✗ Challenge Not Completed'}
                    </span>
                  </div>
                  {task && (
                    <div className="mt-2 p-3 bg-white rounded border">
                      <h4 className="font-medium mb-2">Task: {task.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      <div className="text-xs text-gray-500">
                        <span className="mr-4">📍 {task.location}</span>
                        <span className="mr-4">Difficulty: {task.difficulty}</span>
                        <span>Points: {task.points}</span>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 p-3 bg-white rounded border">
                    <h4 className="font-medium mb-2">AI Analysis:</h4>
                    <p className="text-sm whitespace-pre-wrap">
                      {analysisResult.rawResponse || analysisResult.error || 'No analysis available'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {uploadStatus === 'error' && (
          <div className="text-red-600 font-medium">
            Failed to upload video. Please try again.
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
