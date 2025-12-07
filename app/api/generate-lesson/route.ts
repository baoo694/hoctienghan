import { NextResponse } from 'next/server';
import { callGroqAPI } from '@/lib/groq';

export async function POST(request: Request) {
  try {
    const { topic, level } = await request.json();

    if (!topic || !level) {
      return NextResponse.json(
        { error: 'Topic and level are required' },
        { status: 400 }
      );
    }

    // Determine number of sentences based on level
    const sentenceCounts: Record<string, number> = {
      beginner: 5,
      intermediate: 10,
      advanced: 15,
    };
    
    const sentenceCount = sentenceCounts[level.toLowerCase()] || 5;

    const prompt = `You are a Korean language teacher for Vietnamese students.

1. Write a short story (${sentenceCount} sentences) about "${topic}" for ${level} level students.
2. Translate it to Vietnamese.
3. Extract key vocabulary words with Korean romanization (Revised Romanization of Korean).

RETURN JSON ONLY. Do not include any markdown formatting, code blocks, or explanations. Just the raw JSON.

Structure:
{
  "title": "Story title in Korean",
  "korean_text": "The full Korean story text here. Each sentence should be separated by a period and space.",
  "vietnamese_translation": "The full Vietnamese translation here.",
  "vocabulary": [
    {
      "word": "Korean word",
      "romanization": "Korean romanization (Revised Romanization)",
      "meaning": "Meaning in Vietnamese"
    }
  ]
}`;

    // Call Groq API
    let text = await callGroqAPI(prompt);

    // Remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to extract JSON if there's extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    const jsonResponse = JSON.parse(text);

    // Validate the response structure
    if (!jsonResponse.korean_text || !jsonResponse.vietnamese_translation) {
      return NextResponse.json(
        { error: 'Invalid response format from AI' },
        { status: 500 }
      );
    }

    // Add topic to response
    jsonResponse.topic = topic;

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error('Error generating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to generate lesson', details: error.message },
      { status: 500 }
    );
  }
}

