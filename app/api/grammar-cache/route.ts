import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Get grammar from cache
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const grammarName = searchParams.get('name');

    if (!grammarName) {
      return NextResponse.json(
        { error: 'Grammar name is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('grammar_cache')
      .select('*')
      .eq('grammar_name_korean', grammarName)
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
    console.error('Error fetching grammar from cache:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grammar from cache', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Save grammar to cache
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { grammar_name_korean, grammar_name_vietnamese, form, meaning, explanation, example_sentence } = body;

    if (!grammar_name_korean || !grammar_name_vietnamese || !form || !meaning) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Use upsert to update if exists, insert if not
    const { data, error } = await supabase
      .from('grammar_cache')
      .upsert(
        {
          grammar_name_korean,
          grammar_name_vietnamese,
          form,
          meaning,
          explanation: explanation || '',
          example_sentence: example_sentence || '',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'grammar_name_korean',
        }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error saving grammar to cache:', error);
    return NextResponse.json(
      { error: 'Failed to save grammar to cache', details: error.message },
      { status: 500 }
    );
  }
}


