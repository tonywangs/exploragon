import { NextResponse } from 'next/server';
import { writeFile, readdir } from 'fs/promises';
import path from 'path';
import fs from 'fs';

// Handle GET requests to list videos
export async function GET() {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Read the directory
    const files = await readdir(uploadDir);
    
    // Filter for video files and create URLs
    const videos = files
      .filter(file => file.endsWith('.webm'))
      .map(file => ({
        name: file,
        url: `/uploads/${file}`,
        uploadedAt: fs.statSync(path.join(uploadDir, file)).mtime
      }));

    return NextResponse.json({
      success: true,
      videos: videos
    });
  } catch (error) {
    console.error('Error listing videos:', error);
    return NextResponse.json(
      { error: 'Failed to list videos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const video = formData.get('video') as File;
    
    if (!video) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `video-${timestamp}.webm`;
    
    // Save to public/uploads directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filePath = path.join(uploadDir, filename);

    // Convert the video to a Buffer and save it
    const bytes = await video.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create uploads directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Write the file
    await writeFile(filePath, buffer);
    
    // Generate the public URL for the video
    const videoUrl = `/uploads/${filename}`;
    
    return NextResponse.json({
      success: true,
      message: 'Video saved successfully',
      videoUrl,
      videoName: video.name,
      size: video.size,
      type: video.type
    });

  } catch (error) {
    console.error('Error handling video upload:', error);
    return NextResponse.json(
      { error: 'Failed to process video' },
      { status: 500 }
    );
  }
}