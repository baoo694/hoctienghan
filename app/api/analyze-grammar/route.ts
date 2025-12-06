import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { sentence } = await request.json();

    if (!sentence) {
      return NextResponse.json(
        { error: 'Sentence is required' },
        { status: 400 }
      );
    }

    // Normalize sentence for comparison (trim and normalize whitespace)
    const normalizedSentence = sentence.trim().replace(/\s+/g, ' ');

    // Check cache first
    const { data: cached, error: cacheError } = await supabase
      .from('sentence_grammar_cache')
      .select('*')
      .eq('sentence', normalizedSentence)
      .single();

    // Check if cache exists (even if there's an error, if data exists, use it)
    if (cached) {
      console.log('Cache hit for sentence:', normalizedSentence);
      // Return cached result
      return NextResponse.json({
        sentence: cached.sentence,
        grammar_points: cached.grammar_points,
      });
    }

    // Log cache miss for debugging
    if (cacheError && cacheError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is expected for cache miss
      console.warn('Cache query error (non-critical):', cacheError);
    } else {
      console.log('Cache miss for sentence:', normalizedSentence);
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      );
    }

    const prompt = `You are a Korean language teacher for Vietnamese students.

Analyze the grammar structures used in this Korean sentence: "${sentence}"

For each grammar point found, provide:
1. Grammar name (in Korean and Vietnamese)
2. Grammar form/pattern
3. Meaning in Vietnamese
4. Usage explanation in Vietnamese
5. The part of the sentence that uses this grammar

RETURN JSON ONLY. Do not include any markdown formatting, code blocks, or explanations. Just the raw JSON.

Structure:
{
  "sentence": "${sentence}",
  "grammar_points": [
    {
      "name_korean": "Grammar name in Korean",
      "name_vietnamese": "Grammar name in Vietnamese",
      "form": "Grammar pattern/form",
      "meaning": "Meaning in Vietnamese",
      "explanation": "Detailed explanation in Vietnamese",
      "example_in_sentence": "The part of sentence using this grammar"
    }
  ]
}`;

    // Try using REST API directly first, then fallback to SDK
    let text: string;
    
    try {
      // Try REST API with v1 endpoint (try newer models first)
      const restModels = [
        'gemini-2.0-flash-live',
        'gemini-2.5-flash-live',
        'gemini-2.0-flash',
        'gemini-2.5-flash',
        'gemini-pro'
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
        'gemini-2.0-flash-live',
        'gemini-2.5-flash-live',
        'gemini-2.0-flash',
        'gemini-2.5-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro',
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

    // Clean up common JSON issues
    text = text
      .replace(/,\s*}/g, '}') // Remove trailing commas before }
      .replace(/,\s*]/g, ']') // Remove trailing commas before ]
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .trim();

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(text);
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError);
      console.error('Text that failed to parse:', text.substring(0, 1000));
      
      // Try to fix common JSON issues and retry
      try {
        // Try to find and fix unquoted keys
        text = text.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
        jsonResponse = JSON.parse(text);
      } catch (retryError) {
        return NextResponse.json(
          { 
            error: 'Failed to parse AI response as JSON', 
            details: parseError.message,
            hint: 'The AI response may not be in valid JSON format. Please try again.'
          },
          { status: 500 }
        );
      }
    }

    // Validate the response structure
    if (!jsonResponse.sentence || !jsonResponse.grammar_points) {
      console.error('Invalid response structure:', JSON.stringify(jsonResponse, null, 2));
      return NextResponse.json(
        { 
          error: 'Invalid response format from AI',
          details: 'Response missing required fields: sentence or grammar_points'
        },
        { status: 500 }
      );
    }

    // Ensure grammar_points is an array
    if (!Array.isArray(jsonResponse.grammar_points)) {
      console.error('grammar_points is not an array:', jsonResponse.grammar_points);
      return NextResponse.json(
        { 
          error: 'Invalid response format from AI',
          details: 'grammar_points must be an array'
        },
        { status: 500 }
      );
    }

    // Normalize sentence before saving to cache
    const sentenceToCache = jsonResponse.sentence.trim().replace(/\s+/g, ' ');

    // Save to sentence cache
    try {
      const { error: cacheError } = await supabase
        .from('sentence_grammar_cache')
        .upsert(
          {
            sentence: sentenceToCache,
            grammar_points: jsonResponse.grammar_points,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'sentence',
          }
        );
      
      if (cacheError) {
        console.warn('Failed to save sentence grammar to cache:', cacheError);
      } else {
        console.log('Saved to cache:', sentenceToCache);
      }
    } catch (cacheError) {
      // Don't fail if cache save fails
      console.warn('Failed to save sentence grammar to cache:', cacheError);
    }

    // Save individual grammar points to grammar_cache
    for (const grammar of jsonResponse.grammar_points) {
      try {
        await supabase
          .from('grammar_cache')
          .upsert(
            {
              grammar_name_korean: grammar.name_korean,
              grammar_name_vietnamese: grammar.name_vietnamese,
              form: grammar.form,
              meaning: grammar.meaning,
              explanation: grammar.explanation || '',
              example_sentence: grammar.example_in_sentence || '',
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'grammar_name_korean',
            }
          );
      } catch (grammarCacheError) {
        // Don't fail if individual grammar cache save fails
        console.warn('Failed to save grammar point to cache:', grammarCacheError);
      }
    }

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error('Error analyzing grammar:', error);
    return NextResponse.json(
      { error: 'Failed to analyze grammar', details: error.message },
      { status: 500 }
    );
  }
}

