import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try to list available models
    try {
      // Note: The SDK might not have a direct listModels method
      // We'll try to test a few common models
      const testModels = [
        'gemini-2.0-flash-lite',
        'gemini-2.0-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash',
      ];

      const availableModels: string[] = [];
      
      for (const modelName of testModels) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          // Try a simple test call
          await model.generateContent('test');
          availableModels.push(modelName);
        } catch (error: any) {
          // Skip 404 errors
          if (!error.message?.includes('404') && !error.message?.includes('not found')) {
            // If it's not a 404, the model might be available but the test failed
            availableModels.push(modelName + ' (might work)');
          }
        }
      }

      return NextResponse.json({
        message: 'Available models (tested)',
        models: availableModels,
        note: 'If empty, try checking your API key permissions or region settings'
      });
    } catch (error: any) {
      return NextResponse.json(
        { 
          error: 'Could not list models',
          details: error.message,
          suggestion: 'Try using gemini-2.0-flash-lite or check your API key permissions'
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to check models', details: error.message },
      { status: 500 }
    );
  }
}

