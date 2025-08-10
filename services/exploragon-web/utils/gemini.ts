import { GoogleGenerativeAI } from '@google/generative-ai';

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
export async function analyzeVideo(videoData: ArrayBuffer) {
  console.log('=== Starting Gemini Analysis ===');
  try {
    console.log('Getting Gemini client...');
    const genAI = await getGeminiAI();
    console.log('Getting Gemini model...');
    
   
    const modelName = "gemini-1.5-pro"; // Using the latest Gemini model
    console.log('Attempting to use model:', modelName);
    const model = genAI.getGenerativeModel({ model: modelName });
    console.log('Gemini model initialized');

    const prompt = `Analyze if the person in this video is smiling.
IMPORTANT: You must ONLY respond with one of these exact words:
- "true" if the person is smiling
- "false" if the person is not smiling
Do not include any other text, explanation, or punctuation in your response.`;

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

    // More lenient check for positive responses
    // Check each condition separately for debugging
    const hasTrue = text.toLowerCase().trim().includes('true');
    const hasYes = text.toLowerCase().trim().includes('yes');
    const hasPerson = text.toLowerCase().trim().includes('person');
    
    console.log('=== Person Detection Debug ===');
    console.log('Contains "true":', hasTrue);
    console.log('Contains "yes":', hasYes);
    console.log('Contains "person":', hasPerson);
    
    const isSmiling = hasTrue;
    console.log('Is person smiling:', isSmiling);
    console.log('=========================');

    return {
      success: true,
      isSmiling: isSmiling,
      rawResponse: text
    };

  } catch (error) {
    console.error('Error analyzing video with Gemini:', error);
    return {
      success: false,
      error: 'Failed to analyze video',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
