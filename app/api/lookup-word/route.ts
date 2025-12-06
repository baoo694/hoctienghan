import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { word, context_sentence } = await request.json();

    if (!word || !context_sentence) {
      return NextResponse.json(
        { error: 'Word and context sentence are required' },
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

Explain the word "${word}" in the context of this Korean sentence: "${context_sentence}".

Provide:
1. The original word (exactly as provided)
2. Meaning in the specific context of that sentence (in Vietnamese)
3. A brief explanation (in Vietnamese)
4. 3-5 synonyms or similar words in Korean (as an array)

RETURN JSON ONLY. Do not include any markdown formatting, code blocks, or explanations. Just the raw JSON.

Structure:
{
  "original_word": "${word}",
  "meaning_in_context": "Meaning in this specific context",
  "explanation": "Brief explanation in Vietnamese",
  "synonyms": ["synonym1", "synonym2", "synonym3"]
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
      
      // Try different model names in order (using available models from API key)
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
          // Check if it's a 404 error (model not found)
          const is404 = error.status === 404 || 
                       error.statusCode === 404 || 
                       error.message?.includes('404') ||
                       error.message?.includes('not found');
          
          // If it's not a 404, throw immediately (other errors are more serious)
          if (!is404) {
            throw error;
          }
          // Continue to next model if 404
          continue;
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
    console.error('Error looking up word:', error);
    return NextResponse.json(
      { error: 'Failed to lookup word', details: error.message },
      { status: 500 }
    );
  }
}

