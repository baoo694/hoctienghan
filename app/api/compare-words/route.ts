import { NextResponse } from 'next/server';
import { callGroqAPI } from '@/lib/groq';

export async function POST(request: Request) {
  try {
    const { word1, word2 } = await request.json();

    if (!word1 || !word2) {
      return NextResponse.json(
        { error: 'Both words are required' },
        { status: 400 }
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

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error('Error comparing words:', error);
    return NextResponse.json(
      { error: 'Failed to compare words', details: error.message },
      { status: 500 }
    );
  }
}

