import { GoogleGenerativeAI } from '@google/generative-ai';
import { Task } from '@/lib/types';

// Initialize the Gemini API client with the API key
async function getGeminiAI() {
  console.log('=== Environment Check ===');
  console.log('Current working directory:', process.cwd());
  console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
  console.log('First few chars of key:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) + '...' : 'not found');
  console.log('========================');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables. Make sure .env.local is in the correct directory.');
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  
  console.log('Using Gemini Pro Vision model');
  
  return genAI;
}

// Function to analyze video content
export async function analyzeVideo(videoData: ArrayBuffer, task?: Task | null) {
  console.log('=== Starting Gemini Analysis ===');
  console.log('Task for validation:', task);
  
  try {
    console.log('Getting Gemini client...');
    const genAI = await getGeminiAI();
    console.log('Getting Gemini model...');
    
   
    const modelName = "gemini-1.5-pro"; // Using the latest Gemini model
    console.log('Attempting to use model:', modelName);
    const model = genAI.getGenerativeModel({ model: modelName });
    console.log('Gemini model initialized');

    let prompt: string;
    if (task) {
      prompt = `Analyze if the person in this video successfully completed the following challenge:

CHALLENGE: ${task.title}
DESCRIPTION: ${task.description}
LOCATION: ${task.location}
DIFFICULTY: ${task.difficulty}

IMPORTANT: You must ONLY respond with one of these exact words:
- "true" if the person successfully completed the challenge
- "false" if the person did not complete the challenge

Do not include any other text, explanation, or punctuation in your response.`;
    } else {
      prompt = `Analyze if the person in this video is smiling.
IMPORTANT: You must ONLY respond with one of these exact words:
- "true" if the person is smiling
- "false" if the person is not smiling
Do not include any other text, explanation, or punctuation in your response.`;
    }

    console.log('Converting video data to base64...');
    const videoBase64 = Buffer.from(videoData).toString('base64');
    console.log('Base64 conversion complete, length:', videoBase64.length);
    
    console.log('Sending request to Gemini...');
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "video/webm",
          data: videoBase64
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini raw response:', text);
    console.log('Response after trim:', text.trim());
    console.log('Response after lowercase:', text.toLowerCase().trim());

    // Parse the response
    const hasTrue = text.toLowerCase().trim().includes('true');
    
    if (task) {
      console.log('=== Challenge Validation Debug ===');
      console.log('Contains "true":', hasTrue);
      const challengeCompleted = hasTrue;
      console.log('Challenge completed:', challengeCompleted);
      console.log('===============================');

      return {
        success: true,
        challengeCompleted: challengeCompleted,
        rawResponse: text,
        task: task
      };
    } else {
      console.log('=== Smile Detection Debug ===');
      console.log('Contains "true":', hasTrue);
      const isSmiling = hasTrue;
      console.log('Is person smiling:', isSmiling);
      console.log('==========================');

      return {
        success: true,
        isSmiling: isSmiling,
        rawResponse: text
      };
    }

  } catch (error) {
    console.error('Error analyzing video with Gemini:', error);
    return {
      success: false,
      error: 'Failed to analyze video',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
