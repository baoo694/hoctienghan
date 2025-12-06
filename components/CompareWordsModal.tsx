'use client';

import { useEffect, useState } from 'react';
import { X, Loader2, ArrowLeftRight } from 'lucide-react';

interface WordComparisonData {
  characteristics: string;
  focus: string;
  feeling: string;
  often_goes_with: string;
  vietnamese_examples: string[];
  korean_examples: string[];
}

interface ComparisonResult {
  word1: string;
  word2: string;
  word1_data: WordComparisonData;
  word2_data: WordComparisonData;
}

interface CompareWordsModalProps {
  word1: string;
  word2: string;
  onClose: () => void;
}

export default function CompareWordsModal({ word1, word2, onClose }: CompareWordsModalProps) {
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComparison = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/compare-words', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word1, word2 }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to compare words');
        }

        const data = await response.json();
        setComparison(data);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [word1, word2]);

  if (!comparison && !loading && !error) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ArrowLeftRight className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              So sánh: <span className="text-blue-600">{word1}</span> vs <span className="text-purple-600">{word2}</span>
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
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          {comparison && !loading && (
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                    <th className="p-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 w-1/4">
                      Đặc điểm
                    </th>
                    <th className="p-4 text-center text-base font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">
                      {comparison.word1}
                    </th>
                    <th className="p-4 text-center text-base font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20">
                      {comparison.word2}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="p-4 font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">
                      Trọng tâm
                    </td>
                    <td className="p-4 text-gray-900 dark:text-white">
                      <div className="text-sm leading-relaxed">
                        {comparison.word1_data.focus.split(/(\*\*[^*]+\*\*)/g).map((part, idx) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return (
                              <strong key={idx} className="text-blue-600 dark:text-blue-400 font-bold">
                                {part.replace(/\*\*/g, '')}
                              </strong>
                            );
                          }
                          return <span key={idx}>{part}</span>;
                        })}
                      </div>
                    </td>
                    <td className="p-4 text-gray-900 dark:text-white">
                      <div className="text-sm leading-relaxed">
                        {comparison.word2_data.focus.split(/(\*\*[^*]+\*\*)/g).map((part, idx) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return (
                              <strong key={idx} className="text-purple-600 dark:text-purple-400 font-bold">
                                {part.replace(/\*\*/g, '')}
                              </strong>
                            );
                          }
                          return <span key={idx}>{part}</span>;
                        })}
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="p-4 font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">
                      Cảm giác
                    </td>
                    <td className="p-4 text-gray-900 dark:text-white text-sm">
                      {comparison.word1_data.feeling}
                    </td>
                    <td className="p-4 text-gray-900 dark:text-white text-sm">
                      {comparison.word2_data.feeling}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="p-4 font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">
                      Thường đi với
                    </td>
                    <td className="p-4 text-gray-900 dark:text-white text-sm">
                      {comparison.word1_data.often_goes_with}
                    </td>
                    <td className="p-4 text-gray-900 dark:text-white text-sm">
                      {comparison.word2_data.often_goes_with}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="p-4 font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">
                      Ví dụ Tiếng Việt
                    </td>
                    <td className="p-4">
                      <ul className="list-disc list-inside space-y-1.5 text-gray-900 dark:text-white">
                        {comparison.word1_data.vietnamese_examples.map((example, idx) => (
                          <li key={idx} className="text-sm">"{example}"</li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-4">
                      <ul className="list-disc list-inside space-y-1.5 text-gray-900 dark:text-white">
                        {comparison.word2_data.vietnamese_examples.map((example, idx) => (
                          <li key={idx} className="text-sm">"{example}"</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900">
                      Ví dụ câu tiếng Hàn
                    </td>
                    <td className="p-4">
                      <ul className="space-y-2.5 text-gray-900 dark:text-white">
                        {comparison.word1_data.korean_examples.map((example, idx) => (
                          <li key={idx} className="text-sm italic border-l-3 border-blue-400 pl-3 py-1">
                            {example}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-4">
                      <ul className="space-y-2.5 text-gray-900 dark:text-white">
                        {comparison.word2_data.korean_examples.map((example, idx) => (
                          <li key={idx} className="text-sm italic border-l-3 border-purple-400 pl-3 py-1">
                            {example}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

