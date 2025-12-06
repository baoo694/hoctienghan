'use client';

import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface LessonGeneratorProps {
  onGenerate: (data: any) => void;
}

export default function LessonGenerator({ onGenerate }: LessonGeneratorProps) {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, level }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate lesson');
      }

      const data = await response.json();
      onGenerate(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-blue-600" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Korean Contextual Learning
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="topic"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Topic
          </label>
          <input
            id="topic"
            type="text"
            placeholder="e.g., Daily Life, K-Pop, Travel, Food..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="level"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Level
          </label>
          <select
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating Lesson...' : 'Generate Lesson'}
        </button>
      </form>
    </div>
  );
}

