import { NextResponse } from 'next/server';
import { supabase, hasSupabaseCredentials } from '@/lib/supabase';

// GET - Get all saved grammar
export async function GET() {
  try {
    if (!hasSupabaseCredentials()) {
      return NextResponse.json(
        { 
          error: 'Supabase credentials are not configured',
          message: 'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables'
        },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from('saved_grammar')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error fetching saved grammar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved grammar', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Save a new grammar (copy from cache if available)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { grammar_name_korean, grammar_name_vietnamese, form, meaning, explanation, example_sentence } = body;

    if (!grammar_name_korean) {
      return NextResponse.json(
        { error: 'Grammar name is required' },
        { status: 400 }
      );
    }

    // Try to get from cache first if data is incomplete
    let grammarData = {
      grammar_name_korean,
      grammar_name_vietnamese: grammar_name_vietnamese || '',
      form: form || '',
      meaning: meaning || '',
      explanation: explanation || '',
      example_sentence: example_sentence || '',
    };

    // If not provided, try to get from cache
    if (!grammar_name_vietnamese || !form || !meaning) {
      const { data: cached } = await supabase
        .from('grammar_cache')
        .select('*')
        .eq('grammar_name_korean', grammar_name_korean)
        .single();

      if (cached) {
        grammarData = {
          grammar_name_korean: cached.grammar_name_korean,
          grammar_name_vietnamese: cached.grammar_name_vietnamese,
          form: cached.form,
          meaning: cached.meaning,
          explanation: cached.explanation || '',
          example_sentence: cached.example_sentence || '',
        };
      }
    }

    if (!grammarData.grammar_name_vietnamese || !grammarData.form || !grammarData.meaning) {
      return NextResponse.json(
        { error: 'Grammar data is incomplete. Please analyze the grammar first.' },
        { status: 400 }
      );
    }

    // Check if grammar already exists
    const { data: existing } = await supabase
      .from('saved_grammar')
      .select('id')
      .eq('grammar_name_korean', grammar_name_korean)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Grammar already saved', data: existing },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('saved_grammar')
      .insert([grammarData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error saving grammar:', error);
    return NextResponse.json(
      { error: 'Failed to save grammar', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a saved grammar
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const grammarName = searchParams.get('name');
    const id = searchParams.get('id');

    if (!grammarName && !id) {
      return NextResponse.json(
        { error: 'Grammar name or ID is required' },
        { status: 400 }
      );
    }

    let query = supabase.from('saved_grammar').delete();

    if (id) {
      query = query.eq('id', id);
    } else if (grammarName) {
      query = query.eq('grammar_name_korean', grammarName);
    }

    const { error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting grammar:', error);
    return NextResponse.json(
      { error: 'Failed to delete grammar', details: error.message },
      { status: 500 }
    );
  }
}


