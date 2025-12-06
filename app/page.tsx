'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Sparkles, GraduationCap } from 'lucide-react';
import LessonGenerator from '@/components/LessonGenerator';
import Reader from '@/components/Reader';
import SavedWords from '@/components/SavedWords';
import SavedGrammar from '@/components/SavedGrammar';

interface Lesson {
  title: string;
  korean_text: string;
  vietnamese_translation: string;
  topic?: string;
  vocabulary: Array<{
    word: string;
    romanization: string;
    meaning: string;
  }>;
}

type ViewMode = 'lesson' | 'saved-words' | 'saved-grammar';

export default function Home() {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('lesson');
  const [savedWordsCount, setSavedWordsCount] = useState(0);
  const [savedGrammarCount, setSavedGrammarCount] = useState(0);

  // Update saved words count when storage changes
  useEffect(() => {
    const updateWordCount = async () => {
      try {
        const response = await fetch('/api/saved-words');
        if (response.ok) {
          const words = await response.json();
          setSavedWordsCount(words.length);
        } else {
          setSavedWordsCount(0);
        }
      } catch (error) {
        setSavedWordsCount(0);
      }
    };

    const updateGrammarCount = async () => {
      try {
        const response = await fetch('/api/saved-grammar');
        if (response.ok) {
          const grammar = await response.json();
          setSavedGrammarCount(grammar.length);
        } else {
          setSavedGrammarCount(0);
        }
      } catch (error) {
        setSavedGrammarCount(0);
      }
    };

    updateWordCount();
    updateGrammarCount();
    window.addEventListener('savedWordsUpdated', updateWordCount);
    window.addEventListener('savedGrammarUpdated', updateGrammarCount);

    return () => {
      window.removeEventListener('savedWordsUpdated', updateWordCount);
      window.removeEventListener('savedGrammarUpdated', updateGrammarCount);
    };
  }, []);

  return (
    <main className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      <div className="container mx-auto max-w-7xl h-full px-4 py-2 flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex gap-3 justify-center mb-3 flex-wrap flex-shrink-0">
          <button
            onClick={() => setViewMode('lesson')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              viewMode === 'lesson'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Bài học mới
          </button>
          <button
            onClick={() => setViewMode('saved-words')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors text-sm font-medium relative ${
              viewMode === 'saved-words'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Từ mới
            {savedWordsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {savedWordsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setViewMode('saved-grammar')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors text-sm font-medium relative ${
              viewMode === 'saved-grammar'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Ngữ pháp
            {savedGrammarCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {savedGrammarCount}
              </span>
            )}
          </button>
        </div>

        {/* Content based on view mode */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'saved-words' ? (
            <SavedWords />
          ) : viewMode === 'saved-grammar' ? (
            <SavedGrammar />
          ) : !lesson ? (
            <div className="flex flex-col items-center justify-center h-full">
              <LessonGenerator onGenerate={setLesson} />
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Your Lesson
                </h1>
                <button
                  onClick={() => setLesson(null)}
                  className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium"
                >
                  New Lesson
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <Reader lesson={lesson} />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
