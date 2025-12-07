# Korean Contextual Learning App

A modern web application for learning Korean through contextual stories powered by Groq AI (Llama 3.3 70B). Users can generate Korean stories based on topics and levels, then click on words to see their meanings in context with pronunciations.

## Features

- **Topic-based Story Generation**: Generate Korean stories based on any topic (Daily Life, K-Pop, Travel, etc.)
- **Level Selection**: Choose between Beginner, Intermediate, and Advanced levels
- **Interactive Word Learning**: Click on any Korean word in the story to see:
  - Han-Viet pronunciation
  - Meaning in the specific context
  - Detailed explanation
- **Translation Toggle**: Show/hide full Vietnamese translation
- **Vocabulary List**: Automatically extracted key vocabulary with pronunciations and meanings

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI**: Groq AI (Llama 3.3 70B Versatile)
- **Database**: Supabase (for saving words)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Groq API key ([Get one here](https://console.groq.com/keys))
- Supabase account ([Sign up here](https://supabase.com))

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

3. Add your API keys to `.env.local`:

```env
GROQ_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase database:

   a. Create a new project at [Supabase](https://supabase.com)
   
   b. Go to SQL Editor and run the SQL from `supabase-schema.sql` (or copy the entire content of the file)
   
   This will create two tables:
   - `word_cache`: Stores all looked-up words to avoid calling Groq API again
   - `saved_words`: Stores words that users want to learn
   
   c. Get your Supabase URL and Anon Key from Project Settings > API

5. Run the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
tuhoctienghan/
├── app/
│   ├── api/
│   │   ├── generate-lesson/
│   │   │   └── route.ts          # API route for generating lessons
│   │   └── lookup-word/
│   │       └── route.ts          # API route for word lookups
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page
├── components/
│   ├── LessonGenerator.tsx       # Input form for topic/level
│   ├── Reader.tsx                 # Story display with clickable words
│   └── WordModal.tsx             # Modal showing word details
├── .env.local.example            # Environment variables template
└── README.md                     # This file
```

## Usage

1. **Generate a Lesson**:
   - Enter a topic (e.g., "Daily Life", "K-Pop", "Travel")
   - Select your level (Beginner, Intermediate, or Advanced)
   - Click "Generate Lesson"

2. **Read the Story**:
   - Read the generated Korean story
   - Click on any word to see its meaning in context

3. **View Translation**:
   - Click "Show Translation" to see the full Vietnamese translation
   - Click "Hide Translation" to hide it

4. **Review Vocabulary**:
   - Scroll down to see the key vocabulary list with pronunciations and meanings

## API Routes

### `/api/generate-lesson`

Generates a Korean story based on topic and level.

**Request:**
```json
{
  "topic": "Daily Life",
  "level": "Beginner"
}
```

**Response:**
```json
{
  "title": "Story Title",
  "korean_text": "Korean story text...",
  "vietnamese_translation": "Vietnamese translation...",
  "vocabulary": [
    {
      "word": "한국어",
      "han_viet": "Han Quốc ngữ",
      "meaning": "Tiếng Hàn"
    }
  ]
}
```

### `/api/lookup-word`

Looks up a word's meaning in context.

**Request:**
```json
{
  "word": "한국어",
  "context_sentence": "한국어를 배우고 있습니다."
}
```

**Response:**
```json
{
  "original_word": "한국어",
  "han_viet": "Han Quốc ngữ",
  "meaning_in_context": "Tiếng Hàn",
  "explanation": "Explanation in Vietnamese..."
}
```

## Building for Production

```bash
npm run build
npm start
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
