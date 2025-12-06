'use client';

import { useState } from 'react';
import { Eye, EyeOff, Book, Search } from 'lucide-react';
import WordModal from './WordModal';
import GrammarAnalysisModal from './GrammarAnalysisModal';

interface Vocabulary {
  word: string;
  romanization: string;
  meaning: string;
}

interface Lesson {
  title: string;
  korean_text: string;
  vietnamese_translation: string;
  topic?: string;
  vocabulary: Vocabulary[];
}

interface ReaderProps {
  lesson: Lesson;
}

export default function Reader({ lesson }: ReaderProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [contextSentence, setContextSentence] = useState<string | null>(null);
  const [analyzingSentence, setAnalyzingSentence] = useState<string | null>(null);

  const handleWordClick = (word: string, sentence: string) => {
    // Clean the word (remove punctuation)
    const cleanWord = word.replace(/[.,!?;:]/g, '');
    if (cleanWord.trim()) {
      setSelectedWord(cleanWord);
      setContextSentence(sentence);
    }
  };

  const handleVocabularyClick = (vocab: Vocabulary) => {
    // Find a sentence containing this word in the Korean text
    const sentences = lesson.korean_text.split(/[.!?]\s+/).filter(s => s.trim());
    
    // Try to find a sentence that contains the word (exact match or as part of a word)
    let contextSentence = sentences.find(s => {
      // Check if the word appears in the sentence (as whole word or part of compound word)
      const words = s.split(/\s+/);
      return words.some(w => w.includes(vocab.word) || vocab.word.includes(w.replace(/[.,!?;:]/g, '')));
    });
    
    // If word not found in any sentence, use the first sentence or the full text
    if (!contextSentence) {
      contextSentence = sentences[0] || lesson.korean_text;
    }
    
    setSelectedWord(vocab.word);
    setContextSentence(contextSentence.trim());
  };

  const handleCloseModal = () => {
    setSelectedWord(null);
    setContextSentence(null);
  };

  const handleAnalyzeGrammar = (sentence: string) => {
    setAnalyzingSentence(sentence);
  };

  // Split text into sentences, then into words
  const renderKoreanText = () => {
    const sentences = lesson.korean_text.split(/[.!?]\s+/).filter(s => s.trim());
    
    return sentences.map((sentence, sentenceIndex) => {
      const words = sentence.trim().split(/\s+/);
      const sentenceWithPunctuation = sentenceIndex < sentences.length - 1 
        ? sentence + (lesson.korean_text.match(/[.!?]/g)?.[sentenceIndex] || '.')
        : sentence + '.';

      return (
        <p key={sentenceIndex} className="mb-2 text-base leading-relaxed group inline-flex items-start gap-1.5 w-full">
          <span className="flex-1">
            {words.map((word, wordIndex) => {
              const cleanWord = word.replace(/[.,!?;:]/g, '');
              const punctuation = word.match(/[.,!?;:]/g)?.[0] || '';
              
              return (
                <span key={wordIndex}>
                  <span
                    onClick={() => handleWordClick(word, sentence.trim())}
                    className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:underline transition-colors px-0.5 rounded"
                    title="Click to see meaning"
                  >
                    {cleanWord}
                  </span>
                  {punctuation && <span>{punctuation}</span>}
                  {wordIndex < words.length - 1 && ' '}
                </span>
              );
            })}
          </span>
          <button
            onClick={() => handleAnalyzeGrammar(sentence.trim())}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 rounded"
            title="Phân tích ngữ pháp trong câu này"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </p>
      );
    });
  };

  return (
    <div className="w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg flex flex-col p-4">
      <div className="mb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Book className="w-4 h-4 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {lesson.title}
            </h2>
          </div>
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-xs font-medium"
          >
            {showTranslation ? (
              <>
                <EyeOff className="w-3 h-3" />
                Hide
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" />
                Show
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 min-h-0">
        {/* Left Column - Korean Text and Translation */}
        <div className="flex flex-col space-y-3 overflow-y-auto pr-2 min-h-0">
          {/* Korean Text */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg flex-shrink-0">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Korean Text
            </h3>
            <div className="text-gray-900 dark:text-white text-base leading-relaxed">
              {renderKoreanText()}
            </div>
          </div>

          {/* Vietnamese Translation */}
          {showTranslation && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 flex-shrink-0">
              <h3 className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2 uppercase tracking-wide">
                Vietnamese Translation
              </h3>
              <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                {lesson.vietnamese_translation}
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Vocabulary List */}
        <div className="flex flex-col min-h-0">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 h-full flex flex-col">
            <h3 className="text-xs font-semibold text-green-700 dark:text-green-400 mb-3 uppercase tracking-wide flex-shrink-0">
              Key Vocabulary
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 min-h-0">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 auto-rows-max">
                {lesson.vocabulary.map((vocab, index) => (
                  <div
                    key={index}
                    onClick={() => handleVocabularyClick(vocab)}
                    className="bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-green-200 dark:border-green-800 hover:shadow-md transition-shadow cursor-pointer hover:border-green-400 dark:hover:border-green-600"
                    title="Click to see detailed meaning and save word"
                  >
                    <div className="text-sm font-bold text-gray-900 dark:text-white mb-1 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                      {vocab.word}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 italic">
                      {vocab.romanization}
                    </div>
                    <div className="text-xs text-gray-700 dark:text-gray-300 font-medium line-clamp-2">
                      {vocab.meaning}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Word Modal */}
      {selectedWord && contextSentence && (
        <WordModal
          word={selectedWord}
          contextSentence={contextSentence}
          topic={lesson.topic}
          koreanText={lesson.korean_text}
          vietnameseTranslation={lesson.vietnamese_translation}
          onClose={handleCloseModal}
        />
      )}

      {/* Grammar Analysis Modal */}
      {analyzingSentence && (
        <GrammarAnalysisModal
          sentence={analyzingSentence}
          onClose={() => setAnalyzingSentence(null)}
        />
      )}
    </div>
  );
}

