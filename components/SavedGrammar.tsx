'use client';

import { useState, useEffect } from 'react';
import { BookOpen, X, Trash2, Loader2 } from 'lucide-react';

interface SavedGrammar {
  id: string;
  grammar_name_korean: string;
  grammar_name_vietnamese: string;
  form: string;
  meaning: string;
  explanation: string;
  example_sentence: string;
  created_at: string;
}

export default function SavedGrammar() {
  const [savedGrammar, setSavedGrammar] = useState<SavedGrammar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load saved grammar from Supabase
  const loadSavedGrammar = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/saved-grammar');
      if (!response.ok) {
        throw new Error('Failed to load saved grammar');
      }
      const data = await response.json();
      setSavedGrammar(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load saved grammar');
      console.error('Error loading saved grammar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedGrammar();
    
    // Listen for updates
    window.addEventListener('savedGrammarUpdated', loadSavedGrammar);
    return () => window.removeEventListener('savedGrammarUpdated', loadSavedGrammar);
  }, []);

  const handleRemoveGrammar = async (grammarId: string) => {
    try {
      const response = await fetch(`/api/saved-grammar?id=${grammarId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete grammar');
      }

      setSavedGrammar(prev => prev.filter(g => g.id !== grammarId));
    } catch (err: any) {
      console.error('Error deleting grammar:', err);
      alert('Không thể xóa ngữ pháp. Vui lòng thử lại.');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Bạn có chắc muốn xóa tất cả ngữ pháp đã lưu?')) {
      return;
    }

    try {
      const deletePromises = savedGrammar.map(grammar =>
        fetch(`/api/saved-grammar?id=${grammar.id}`, { method: 'DELETE' })
      );
      await Promise.all(deletePromises);
      setSavedGrammar([]);
    } catch (err: any) {
      console.error('Error clearing all grammar:', err);
      alert('Không thể xóa tất cả ngữ pháp. Vui lòng thử lại.');
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col items-center justify-center p-4">
        <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 rounded-lg">
          <p className="font-semibold">Lỗi: {error}</p>
          <button
            onClick={loadSavedGrammar}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (savedGrammar.length === 0) {
    return (
      <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Ngữ pháp cần học
          </h2>
        </div>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-base">Chưa có ngữ pháp nào được lưu</p>
          <p className="text-sm mt-2">Phân tích ngữ pháp trong câu chuyện và lưu lại để ôn tập</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col p-4">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-green-600" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Ngữ pháp cần học
          </h2>
          <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
            {savedGrammar.length}
          </span>
        </div>
        <button
          onClick={handleClearAll}
          className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg transition-colors text-xs font-medium flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Xóa tất cả
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {savedGrammar.map((grammar) => (
          <div
            key={grammar.id}
            className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                  {grammar.grammar_name_korean}
                </h3>
                <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                  {grammar.grammar_name_vietnamese}
                </p>
              </div>
              <button
                onClick={() => handleRemoveGrammar(grammar.id)}
                className="opacity-70 hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                title="Xóa ngữ pháp này"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                  Cấu trúc:
                </p>
                <p className="text-xs font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
                  {grammar.form}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                  Nghĩa:
                </p>
                <p className="text-xs text-gray-900 dark:text-white line-clamp-2">
                  {grammar.meaning}
                </p>
              </div>

              {grammar.explanation && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                    Giải thích:
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">
                    {grammar.explanation}
                  </p>
                </div>
              )}

              {grammar.example_sentence && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                    Ví dụ:
                  </p>
                  <p className="text-xs italic text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-2 py-1 rounded border-l-2 border-green-400 line-clamp-2">
                    {grammar.example_sentence}
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date(grammar.created_at).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}

