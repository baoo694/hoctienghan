import { NextResponse } from 'next/server';
import { callGroqAPI } from '@/lib/groq';

export async function POST(request: Request) {
  try {
    const { word, context_sentence } = await request.json();

    if (!word || !context_sentence) {
      return NextResponse.json(
        { error: 'Word and context sentence are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Groq API key is not configured' },
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

    // Call Groq API
    const text = await callGroqAPI(prompt);

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

