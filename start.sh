#!/bin/bash

echo "🚀 Starting Audio Transcription App..."
echo "📝 Make sure to set your OPENAI_API_KEY in .env.local"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local file not found"
    echo "📋 Copy .env.local.example to .env.local and add your OpenAI API key"
    echo ""
    if [ -f ".env.local.example" ]; then
        cp .env.local.example .env.local
        echo "✅ Created .env.local from template"
        echo "🔑 Please edit .env.local and add your OpenAI API key"
    else
        echo "❌ No .env.local.example found"
    fi
    echo ""
fi

npm run dev
