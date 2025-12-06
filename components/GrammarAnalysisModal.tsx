'use client';

import { useEffect, useState } from 'react';
import { X, Loader2, BookOpen, Bookmark, BookmarkCheck } from 'lucide-react';

interface GrammarPoint {
  name_korean: string;
  name_vietnamese: string;
  form: string;
  meaning: string;
  explanation: string;
  example_in_sentence: string;
}

interface GrammarAnalysis {
  sentence: string;
  grammar_points: GrammarPoint[];
}

interface GrammarAnalysisModalProps {
  sentence: string;
  onClose: () => void;
}

export default function GrammarAnalysisModal({ sentence, onClose }: GrammarAnalysisModalProps) {
  const [analysis, setAnalysis] = useState<GrammarAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedGrammar, setSavedGrammar] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null);

  // Check which grammar points are already saved
  useEffect(() => {
    const checkSavedGrammar = async () => {
      try {
        const response = await fetch('/api/saved-grammar');
        if (response.ok) {
          const saved = await response.json();
          const savedNames = new Set<string>(saved.map((g: any) => g.grammar_name_korean));
          setSavedGrammar(savedNames);
        }
      } catch (error) {
        console.error('Error checking saved grammar:', error);
      }
    };

    checkSavedGrammar();
  }, []);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check client-side cache first (sessionStorage)
        const cacheKey = `grammar_analysis_${sentence.trim()}`;
        const cached = sessionStorage.getItem(cacheKey);
        
        if (cached) {
          try {
            const cachedData = JSON.parse(cached);
            setAnalysis(cachedData);
            setLoading(false);
            return; // Use cached data, no API call needed
          } catch (e) {
            // If cache is corrupted, continue to API call
            sessionStorage.removeItem(cacheKey);
          }
        }

        // API will automatically check server cache and return cached result if available
        const response = await fetch('/api/analyze-grammar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sentence }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to analyze grammar');
        }

        const data = await response.json();
        setAnalysis(data);
        
        // Save to client-side cache for future use
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {
          // Ignore storage errors (e.g., quota exceeded)
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [sentence]);

  const handleSaveGrammar = async (grammar: GrammarPoint) => {
    setSaving(grammar.name_korean);
    try {
      if (savedGrammar.has(grammar.name_korean)) {
        // Remove grammar
        const response = await fetch(`/api/saved-grammar?name=${encodeURIComponent(grammar.name_korean)}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setSavedGrammar(prev => {
            const newSet = new Set(prev);
            newSet.delete(grammar.name_korean);
            return newSet;
          });
          window.dispatchEvent(new Event('savedGrammarUpdated'));
        } else {
          throw new Error('Failed to remove grammar');
        }
      } else {
        // Save grammar
        const response = await fetch('/api/saved-grammar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grammar_name_korean: grammar.name_korean,
            grammar_name_vietnamese: grammar.name_vietnamese,
            form: grammar.form,
            meaning: grammar.meaning,
            explanation: grammar.explanation,
            example_sentence: grammar.example_in_sentence,
          }),
        });

        if (response.ok) {
          setSavedGrammar(prev => new Set(prev).add(grammar.name_korean));
          window.dispatchEvent(new Event('savedGrammarUpdated'));
        } else {
          const errorData = await response.json();
          if (response.status === 409) {
            setSavedGrammar(prev => new Set(prev).add(grammar.name_korean));
          } else {
            throw new Error(errorData.error || 'Failed to save grammar');
          }
        }
      }
    } catch (error: any) {
      console.error('Error saving grammar:', error);
      alert('Không thể lưu ngữ pháp. Vui lòng thử lại.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Phân tích ngữ pháp
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          {analysis && !loading && (
            <div className="space-y-6">
              {/* Sentence */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Câu được phân tích:
                </p>
                <p className="text-lg text-gray-900 dark:text-white leading-relaxed">
                  {analysis.sentence}
                </p>
              </div>

              {/* Grammar Points */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Các ngữ pháp được sử dụng ({analysis.grammar_points.length})
                </h3>
                <div className="space-y-4">
                  {analysis.grammar_points.map((grammar, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-5 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                            {grammar.name_korean}
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                            {grammar.name_vietnamese}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveGrammar(grammar)}
                            disabled={saving === grammar.name_korean}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 ${
                              savedGrammar.has(grammar.name_korean)
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30'
                            }`}
                            title={savedGrammar.has(grammar.name_korean) ? 'Đã lưu - Click để bỏ lưu' : 'Lưu ngữ pháp'}
                          >
                            {saving === grammar.name_korean ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : savedGrammar.has(grammar.name_korean) ? (
                              <BookmarkCheck className="w-3 h-3" />
                            ) : (
                              <Bookmark className="w-3 h-3" />
                            )}
                          </button>
                          <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                            #{index + 1}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Cấu trúc:
                          </p>
                          <p className="text-sm font-mono bg-white dark:bg-gray-800 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                            {grammar.form}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Nghĩa:
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {grammar.meaning}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Giải thích:
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {grammar.explanation}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Ví dụ trong câu:
                          </p>
                          <p className="text-sm italic text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-3 py-2 rounded border-l-4 border-green-400">
                            {grammar.example_in_sentence}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

