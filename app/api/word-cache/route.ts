import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Get word from cache
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');

    if (!word) {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('word_cache')
      .select('*')
      .eq('word', word)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return NextResponse.json(null, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching word from cache:', error);
    return NextResponse.json(
      { error: 'Failed to fetch word from cache', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Save word to cache
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { word, meaning_in_context, explanation, synonyms, context_sentence } = body;

    if (!word || !meaning_in_context) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use upsert to update if exists, insert if not
    const { data, error } = await supabase
      .from('word_cache')
      .upsert(
        {
          word,
          meaning_in_context,
          explanation: explanation || '',
          synonyms: synonyms || [],
          context_sentence: context_sentence || '',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'word',
        }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error saving word to cache:', error);
    return NextResponse.json(
      { error: 'Failed to save word to cache', details: error.message },
      { status: 500 }
    );
  }
}

