export async function setupCamera(
  videoRef: React.RefObject<HTMLVideoElement | null>,
): Promise<MediaStream | null> {
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
    return mediaStream;
  } catch (err) {
    console.error('Error accessing camera:', err);
    return null;
  }
}

export function createMediaRecorder(
  stream: MediaStream,
  onDataAvailable: (event: BlobEvent) => void,
): MediaRecorder {
  const mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = onDataAvailable;
  return mediaRecorder;
}

export async function uploadVideo(recordedChunks: Blob[]): Promise<unknown> {
  if (recordedChunks.length === 0) throw new Error('No video chunks to upload');
  
  const videoBlob = new Blob(recordedChunks, {
    type: 'video/webm'
  });

  const formData = new FormData();
  formData.append('video', videoBlob, 'challenge-video.webm');

  const response = await fetch('/api/upload-video', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  return response.json();
}

export function stopAllTracks(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}