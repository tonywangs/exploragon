import { NextResponse } from "next/server";
import { writeFile, readdir } from "fs/promises";
import path from "path";
import fs from "fs";
import { analyzeVideo } from "@/utils/gemini";

// Handle GET requests to list videos
export async function GET() {
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Read the directory
    const files = await readdir(uploadDir);

    // Filter for video files and create URLs
    const videos = files
      .filter((file) => file.endsWith(".webm"))
      .map((file) => ({
        name: file,
        url: `/uploads/${file}`,
        uploadedAt: fs.statSync(path.join(uploadDir, file)).mtime,
      }));

    return NextResponse.json({
      success: true,
      videos: videos,
    });
  } catch (error) {
    console.error("Error listing videos:", error);
    return NextResponse.json(
      { error: "Failed to list videos" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  console.log("=== API Route: Starting Video Processing ===");
  try {
    console.log("Parsing form data...");
    const formData = await request.formData();
    const video = formData.get("video") as File;
    const taskData = formData.get("task") as string;

    console.log("Video file received:", {
      name: video?.name,
      type: video?.type,
      size: video?.size,
    });

    let task = null;
    if (taskData) {
      try {
        task = JSON.parse(taskData);
        console.log("Task data received:", task);
      } catch (error) {
        console.error("Error parsing task data:", error);
      }
    }

    if (!video) {
      return NextResponse.json({ error: "Video is required" }, { status: 400 });
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `video-${timestamp}.webm`;

    // Save to public/uploads directory
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadDir, filename);

    console.log("Converting video to buffer...");
    const bytes = await video.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log("Buffer created, size:", buffer.length);

    // Create uploads directory if it doesn't exist
    console.log("Checking/creating uploads directory...");
    const fs = require("fs");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log("Created uploads directory");
    }

    // Write the file
    console.log("Writing file to:", filePath);
    await writeFile(filePath, buffer);
    console.log("File written successfully");

    // Generate the public URL for the video
    const videoUrl = `/uploads/${filename}`;

    // Analyze the video with Gemini
    const analysis = await analyzeVideo(bytes, task);

    return NextResponse.json({
      success: true,
      message: "Video saved and analyzed successfully",
      videoUrl,
      videoName: video.name,
      size: video.size,
      type: video.type,
      analysis: analysis,
    });
  } catch (error) {
    console.error("Error handling video upload:", error);
    return NextResponse.json(
      { error: "Failed to process video" },
      { status: 500 },
    );
  }
}
