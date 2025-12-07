import { NextResponse } from 'next/server';
import { supabase, hasSupabaseCredentials } from '@/lib/supabase';

// GET - Get all saved words, sorted by topic
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
      .from('saved_words')
      .select('*')
      .order('topic', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error fetching saved words:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved words', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Save a new word (copy from cache if available)
export async function POST(request: Request) {
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

    const body = await request.json();
    const { word, meaning_in_context, explanation, synonyms, context_sentence, topic, korean_text, vietnamese_translation } = body;

    if (!word) {
      return NextResponse.json(
        { error: 'Word is required' },
        { status: 400 }
      );
    }

    // Try to get from cache first if data is incomplete
    let wordData = {
      word,
      meaning_in_context: meaning_in_context || '',
      explanation: explanation || '',
      synonyms: synonyms || [],
      context_sentence: context_sentence || '',
      topic: topic || null,
      korean_text: korean_text || null,
      vietnamese_translation: vietnamese_translation || null,
    };

    // If not provided, try to get from cache
    if (!meaning_in_context) {
      const { data: cached } = await supabase
        .from('word_cache')
        .select('*')
        .eq('word', word)
        .single();

      if (cached) {
        wordData = {
          word: cached.word,
          meaning_in_context: cached.meaning_in_context,
          explanation: cached.explanation || '',
          synonyms: cached.synonyms || [],
          context_sentence: cached.context_sentence || '',
          topic: topic || null,
          korean_text: korean_text || null,
          vietnamese_translation: vietnamese_translation || null,
        };
      }
    }

    if (!wordData.meaning_in_context) {
      return NextResponse.json(
        { error: 'Word data is incomplete. Please look up the word first.' },
        { status: 400 }
      );
    }

    // Check if word already exists
    const { data: existing } = await supabase
      .from('saved_words')
      .select('id')
      .eq('word', word)
      .single();

    if (existing) {
      // Update existing word with new topic/text if provided
      if (topic || korean_text || vietnamese_translation) {
        const updateData: any = {};
        if (topic) updateData.topic = topic;
        if (korean_text) updateData.korean_text = korean_text;
        if (vietnamese_translation) updateData.vietnamese_translation = vietnamese_translation;
        
        const { data: updated, error: updateError } = await supabase
          .from('saved_words')
          .update(updateData)
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        return NextResponse.json(updated);
      }
      
      return NextResponse.json(
        { error: 'Word already saved', data: existing },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('saved_words')
      .insert([wordData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error saving word:', error);
    return NextResponse.json(
      { error: 'Failed to save word', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a saved word
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');
    const id = searchParams.get('id');

    if (!word && !id) {
      return NextResponse.json(
        { error: 'Word or ID is required' },
        { status: 400 }
      );
    }

    let query = supabase.from('saved_words').delete();

    if (id) {
      query = query.eq('id', id);
    } else if (word) {
      query = query.eq('word', word);
    }

    const { error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting word:', error);
    return NextResponse.json(
      { error: 'Failed to delete word', details: error.message },
      { status: 500 }
    );
  }
}

