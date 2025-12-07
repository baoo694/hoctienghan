import { NextResponse } from 'next/server';
import { callGroqAPI } from '@/lib/groq';

export async function GET() {
  try {
    // Test Groq API connection
    try {
      await callGroqAPI('test');
      
      return NextResponse.json({
        message: 'Groq API is configured and working',
        model: 'llama-3.3-70b-versatile',
        status: 'available'
      });
    } catch (error: any) {
      return NextResponse.json(
        { 
          error: 'Could not connect to Groq API',
          details: error.message,
          suggestion: 'Please check your GROQ_API_KEY environment variable'
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

