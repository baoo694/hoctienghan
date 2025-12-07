import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { word1, word2 } = await request.json();

    if (!word1 || !word2) {
      return NextResponse.json(
        { error: 'Both words are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      );
    }

    const prompt = `You are a Korean language teacher for Vietnamese students.

Compare two Korean words: "${word1}" and "${word2}".

Provide a detailed comparison in Vietnamese with:
1. Characteristics (Đặc điểm) - Key differences
2. Focus (Trọng tâm) - What each word emphasizes
3. Feeling (Cảm giác) - The feeling/tone each word conveys
4. Often goes with (Thường đi với) - Common contexts or words they pair with
5. Vietnamese Examples (Ví dụ Tiếng Việt) - Example phrases in Vietnamese
6. Korean Example Sentences (Ví dụ câu tiếng Hàn) - Example sentences in Korean for each word

RETURN JSON ONLY. Do not include any markdown formatting, code blocks, or explanations. Just the raw JSON.

Structure:
{
  "word1": "${word1}",
  "word2": "${word2}",
  "word1_data": {
    "characteristics": "Key characteristics",
    "focus": "What it emphasizes",
    "feeling": "The feeling it conveys",
    "often_goes_with": "Common contexts",
    "vietnamese_examples": ["example1", "example2"],
    "korean_examples": ["Korean sentence 1", "Korean sentence 2"]
  },
  "word2_data": {
    "characteristics": "Key characteristics",
    "focus": "What it emphasizes",
    "feeling": "The feeling it conveys",
    "often_goes_with": "Common contexts",
    "vietnamese_examples": ["example1", "example2"],
    "korean_examples": ["Korean sentence 1", "Korean sentence 2"]
  }
}`;

    // Try using REST API directly first, then fallback to SDK
    let text: string;
    
    try {
      // Try REST API with v1 endpoint (try newer models first)
      const restModels = [
        'gemini-2.0-flash-lite',
        'gemini-2.0-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash'
      ];
      
      let restResponse: Response | null = null;
      let restError: Error | null = null;
      
      for (const modelName of restModels) {
        try {
          restResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: prompt
                  }]
                }]
              })
            }
          );

          if (restResponse.ok) {
            break; // Success, exit loop
          }
        } catch (error: any) {
          restError = error;
          continue;
        }
      }

      if (restResponse && restResponse.ok) {
        const restData = await restResponse.json();
        text = restData.candidates[0].content.parts[0].text;
      } else {
        throw new Error(`REST API failed: ${restResponse?.status || restError?.message || 'Unknown error'}`);
      }
    } catch (restError) {
      // Fallback to SDK with multiple model names
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Try different model names in order
      const modelNames = [
        'gemini-2.0-flash-lite',
        'gemini-2.0-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash',
      ];

      let result;
      let lastError;
      
      // Try each model until one works
      for (const modelName of modelNames) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          result = await model.generateContent(prompt);
          break; // Success, exit loop
        } catch (error: any) {
          lastError = error;
          // Check if it's a 404 error (model not found) or 429 (quota exceeded)
          const is404 = error.status === 404 || 
                       error.statusCode === 404 || 
                       error.message?.includes('404') ||
                       error.message?.includes('not found');
          
          const is429 = error.status === 429 || 
                       error.statusCode === 429 || 
                       error.message?.includes('429') ||
                       error.message?.includes('Too Many Requests') ||
                       error.message?.includes('quota') ||
                       error.message?.includes('Quota exceeded');
          
          // Continue to next model if 404 or 429 (quota exceeded)
          if (is404 || is429) {
            if (is429) {
              console.warn(`Quota exceeded for model ${modelName}, trying next model...`);
            }
            continue;
          }
          
          // If it's not a 404 or 429, throw immediately (other errors are more serious)
          throw error;
        }
      }

      if (!result) {
        throw new Error(
          `None of the models are available. ` +
          `Please check your API key permissions. ` +
          `Last error: ${lastError?.message || 'Unknown error'}. ` +
          `You can visit https://aistudio.google.com/app/apikey to check your API key.`
        );
      }
      
      const response = result.response;
      text = response.text();
    }

    // Remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to extract JSON if there's extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    const jsonResponse = JSON.parse(text);

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error('Error comparing words:', error);
    return NextResponse.json(
      { error: 'Failed to compare words', details: error.message },
      { status: 500 }
    );
  }
}

