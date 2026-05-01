#!/bin/bash

echo "🚀 Starting Audio Transcription App..."
echo "📝 Make sure to set your ASSEMBLYAI_API_KEY in .env.local"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local file not found"
    echo "📋 Copy .env.local.example to .env.local and add your AssemblyAI API key"
    echo ""
    if [ -f ".env.local.example" ]; then
        cp .env.local.example .env.local
        echo "✅ Created .env.local from template"
        echo "🔑 Please edit .env.local and add your AssemblyAI API key"
    else
        echo "❌ No .env.local.example found"
    fi
    echo ""
fi

npm run dev
