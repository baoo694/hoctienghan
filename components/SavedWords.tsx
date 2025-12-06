'use client';

import { useState, useEffect } from 'react';
import { BookOpen, X, Trash2, Loader2 } from 'lucide-react';
import WordModal from './WordModal';
import CompareWordsModal from './CompareWordsModal';

interface SavedWord {
  id: string;
  word: string;
  meaning_in_context: string;
  explanation: string;
  synonyms: string[];
  context_sentence: string;
  topic?: string;
  korean_text?: string;
  vietnamese_translation?: string;
  created_at: string;
}

export default function SavedWords() {
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [selectedWord, setSelectedWord] = useState<SavedWord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparingWords, setComparingWords] = useState<{ word1: string; word2: string } | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showTextModal, setShowTextModal] = useState(false);

  // Load saved words from Supabase
  const loadSavedWords = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/saved-words');
      if (!response.ok) {
        throw new Error('Failed to load saved words');
      }
      const data = await response.json();
      setSavedWords(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load saved words');
      console.error('Error loading saved words:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedWords();
    
    // Listen for saved words updates
    const handleUpdate = () => {
      loadSavedWords();
    };
    window.addEventListener('savedWordsUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('savedWordsUpdated', handleUpdate);
    };
  }, []);

  // Group words by topic
  const wordsByTopic = savedWords.reduce((acc, word) => {
    const topic = word.topic || 'Không có chủ đề';
    if (!acc[topic]) {
      acc[topic] = [];
    }
    acc[topic].push(word);
    return acc;
  }, {} as Record<string, SavedWord[]>);

  const topics = Object.keys(wordsByTopic).sort();

  const handleWordClick = (word: SavedWord) => {
    setSelectedWord(word);
    setShowModal(true);
  };

  const handleRemoveWord = async (wordId: string) => {
    try {
      const response = await fetch(`/api/saved-words?id=${wordId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete word');
      }

      // Remove from local state
      setSavedWords(prev => prev.filter(w => w.id !== wordId));
    } catch (err: any) {
      console.error('Error deleting word:', err);
      alert('Không thể xóa từ. Vui lòng thử lại.');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Bạn có chắc muốn xóa tất cả từ đã lưu?')) {
      return;
    }

    try {
      // Delete all words one by one
      const deletePromises = savedWords.map(word =>
        fetch(`/api/saved-words?id=${word.id}`, { method: 'DELETE' })
      );
      await Promise.all(deletePromises);
      setSavedWords([]);
    } catch (err: any) {
      console.error('Error clearing all words:', err);
      alert('Không thể xóa tất cả từ. Vui lòng thử lại.');
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col items-center justify-center p-4">
        <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 rounded-lg">
          <p className="font-semibold">Lỗi: {error}</p>
          <button
            onClick={loadSavedWords}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (savedWords.length === 0) {
    return (
      <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Từ mới cần học
          </h2>
        </div>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-base">Chưa có từ nào được lưu</p>
          <p className="text-sm mt-2">Click vào các từ trong câu chuyện để thêm vào đây</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col p-4">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Từ mới cần học
            </h2>
            <span className="ml-2 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
              {savedWords.length}
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
          {topics.map((topic) => {
            const words = wordsByTopic[topic];
            const firstWord = words[0];
            const hasText = firstWord.korean_text && firstWord.vietnamese_translation;
            
            return (
              <div key={topic} className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-sm">
                      {topic}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                      ({words.length} từ)
                    </span>
                  </h3>
                  {hasText && (
                    <button
                      onClick={() => {
                        setSelectedTopic(topic);
                        setShowTextModal(true);
                      }}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <BookOpen className="w-3 h-3" />
                      Xem lại đoạn văn
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {words.map((savedWord) => (
                    <div
                      key={savedWord.id}
                      className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800 hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => handleWordClick(savedWord)}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <h3 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {savedWord.word}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveWord(savedWord.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Xóa từ này"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 mb-1.5">
                        {savedWord.meaning_in_context}
                      </p>
                      {savedWord.synonyms && savedWord.synonyms.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {savedWord.synonyms.slice(0, 2).map((synonym, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setComparingWords({ word1: savedWord.word, word2: synonym });
                              }}
                              className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                              title={`Click để so sánh với ${savedWord.word}`}
                            >
                              {synonym}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(savedWord.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && selectedWord && (
        <WordModal
          word={selectedWord.word}
          contextSentence={selectedWord.context_sentence}
          topic={selectedWord.topic}
          koreanText={selectedWord.korean_text}
          vietnameseTranslation={selectedWord.vietnamese_translation}
          onClose={() => {
            setShowModal(false);
            setSelectedWord(null);
          }}
        />
      )}

      {comparingWords && (
        <CompareWordsModal
          word1={comparingWords.word1}
          word2={comparingWords.word2}
          onClose={() => setComparingWords(null)}
        />
      )}

      {/* Text Review Modal */}
      {showTextModal && selectedTopic && wordsByTopic[selectedTopic] && wordsByTopic[selectedTopic][0] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Ôn tập: {selectedTopic}
              </h2>
              <button
                onClick={() => {
                  setShowTextModal(false);
                  setSelectedTopic(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {wordsByTopic[selectedTopic][0].korean_text && (
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                    Đoạn văn tiếng Hàn
                  </h3>
                  <p className="text-gray-900 dark:text-white text-base leading-relaxed whitespace-pre-line">
                    {wordsByTopic[selectedTopic][0].korean_text}
                  </p>
                </div>
              )}
              {wordsByTopic[selectedTopic][0].vietnamese_translation && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h3 className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2 uppercase tracking-wide">
                    Bản dịch tiếng Việt
                  </h3>
                  <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                    {wordsByTopic[selectedTopic][0].vietnamese_translation}
                  </p>
                </div>
              )}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <strong>Gợi ý:</strong> Hãy đọc lại đoạn văn tiếng Hàn và thử dịch lại để ôn tập các từ mới đã học.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
