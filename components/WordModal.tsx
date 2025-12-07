'use client';

import { useEffect, useState } from 'react';
import { X, Loader2, Bookmark, BookmarkCheck } from 'lucide-react';
import CompareWordsModal from './CompareWordsModal';

interface WordDetails {
  original_word: string;
  meaning_in_context: string;
  explanation: string;
  synonyms: string[];
}

interface SavedWord {
  word: string;
  meaning_in_context: string;
  explanation: string;
  synonyms: string[];
  contextSentence: string;
  savedAt: string;
}

interface WordModalProps {
  word: string;
  contextSentence: string;
  topic?: string;
  koreanText?: string;
  vietnameseTranslation?: string;
  onClose: () => void;
}

export default function WordModal({ word, contextSentence, topic, koreanText, vietnameseTranslation, onClose }: WordModalProps) {
  const [wordDetails, setWordDetails] = useState<WordDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [comparingWord, setComparingWord] = useState<string | null>(null);

  // Check if word is already saved in Supabase
  useEffect(() => {
    const checkIfSaved = async () => {
      try {
        const response = await fetch('/api/saved-words');
        if (response.ok) {
          const savedWords: SavedWord[] = await response.json();
          setIsSaved(savedWords.some(w => w.word === word));
        }
      } catch (error) {
        console.error('Error checking saved words:', error);
      }
    };

    if (word) {
      checkIfSaved();
    }
  }, [word]);

  useEffect(() => {
    const fetchWordDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        // First, try to get from cache
        const cacheResponse = await fetch(`/api/word-cache?word=${encodeURIComponent(word)}`);
        
        if (cacheResponse.ok) {
          const cachedData = await cacheResponse.json();
          setWordDetails({
            original_word: cachedData.word,
            meaning_in_context: cachedData.meaning_in_context,
            explanation: cachedData.explanation || '',
            synonyms: cachedData.synonyms || [],
          });
          setLoading(false);
          return;
        }

        // If not in cache, call Groq API
        const response = await fetch('/api/lookup-word', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word, context_sentence: contextSentence }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to lookup word');
        }

        const data = await response.json();
        setWordDetails(data);

        // Save to cache for future use
        try {
          await fetch('/api/word-cache', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              word: data.original_word,
              meaning_in_context: data.meaning_in_context,
              explanation: data.explanation,
              synonyms: data.synonyms || [],
              context_sentence: contextSentence,
            }),
          });
        } catch (cacheError) {
          // Don't fail if cache save fails
          console.warn('Failed to save to cache:', cacheError);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchWordDetails();
  }, [word, contextSentence]);

  const handleSaveWord = async () => {
    if (!wordDetails) return;

    setSaving(true);
    try {
      if (isSaved) {
        // Remove word
        const response = await fetch(`/api/saved-words?word=${encodeURIComponent(word)}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setIsSaved(false);
          // Dispatch event to update other components
          window.dispatchEvent(new Event('savedWordsUpdated'));
        } else {
          throw new Error('Failed to remove word');
        }
      } else {
        // Save word (will automatically use cache if available)
        const response = await fetch('/api/saved-words', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            word: wordDetails.original_word,
            // These will be used if not in cache, otherwise API will get from cache
            meaning_in_context: wordDetails.meaning_in_context,
            explanation: wordDetails.explanation,
            synonyms: wordDetails.synonyms || [],
            context_sentence: contextSentence,
            topic: topic,
            korean_text: koreanText,
            vietnamese_translation: vietnameseTranslation,
          }),
        });

        if (response.ok) {
          setIsSaved(true);
          // Dispatch event to update other components
          window.dispatchEvent(new Event('savedWordsUpdated'));
        } else {
          const errorData = await response.json();
          if (response.status === 409) {
            // Word already exists
            setIsSaved(true);
          } else {
            throw new Error(errorData.error || 'Failed to save word');
          }
        }
      }
    } catch (error: any) {
      console.error('Error saving word:', error);
      alert('Không thể lưu từ. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {word}
          </h2>
          <div className="flex items-center gap-2">
            {wordDetails && (
              <button
                onClick={handleSaveWord}
                disabled={saving}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSaved
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
                }`}
                title={isSaved ? 'Đã lưu - Click để bỏ lưu' : 'Thêm vào từ mới cần học'}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : isSaved ? (
                  <>
                    <BookmarkCheck className="w-4 h-4" />
                    Đã lưu
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    Lưu từ
                  </>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          {wordDetails && !loading && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Meaning in Context
                </p>
                <p className="text-base text-gray-900 dark:text-white">
                  {wordDetails.meaning_in_context}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Explanation
                </p>
                <p className="text-base text-gray-700 dark:text-gray-300">
                  {wordDetails.explanation}
                </p>
              </div>

              {wordDetails.synonyms && wordDetails.synonyms.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Từ đồng nghĩa
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {wordDetails.synonyms.map((synonym, index) => (
                      <button
                        key={index}
                        onClick={() => setComparingWord(synonym)}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                        title={`Click để so sánh với ${word}`}
                      >
                        {synonym}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Context Sentence
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  {contextSentence}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {comparingWord && (
        <CompareWordsModal
          word1={word}
          word2={comparingWord}
          onClose={() => setComparingWord(null)}
        />
      )}
    </div>
  );
}

