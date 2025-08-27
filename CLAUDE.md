# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Voice-Powered RAG FAQ Agent with a NestJS backend and Next.js frontend. The system transcribes user speech, retrieves relevant documents using semantic search, generates answers with an LLM, and responds via text-to-speech.

## Architecture

### Backend (NestJS)
- **Location**: `backend/`
- **Framework**: NestJS with TypeScript
- **Structure**: Standard NestJS module-based architecture
  - `src/app.module.ts`: Main application module
  - `src/app.controller.ts`: Main controller with basic endpoints
  - `src/app.service.ts`: Business logic service layer
- **Planned Features**: Will include RAG pipeline, vector database integration, speech-to-text, text-to-speech, and LLM integration

### Frontend (Next.js)
- **Location**: `frontend/`
- **Framework**: Next.js 15 with App Router, React 19, TypeScript
- **UI Library**: Shadcn/ui components with Tailwind CSS
- **Theme**: Uses `next-themes` for dark/light mode switching
- **Key Components**:
  - `app/page.tsx`: Main chat interface with mock functionality
  - `components/chat-bubble.tsx`: Message display component
  - `components/voice-button.tsx`: Voice input interface
  - `components/audio-player.tsx`: Audio playback for responses
  - `app/admin/page.tsx`: Admin interface for FAQ management
- **Current State**: Mock implementation with placeholders for real API integration

## Development Commands

### Backend Development
```bash
cd backend

# Install dependencies
npm install

# Development server (with hot reload)
npm run start:dev

# Production build and start
npm run build
npm run start:prod

# Testing
npm run test           # Unit tests
npm run test:e2e       # End-to-end tests
npm run test:cov       # Test coverage

# Code quality
npm run lint           # ESLint with auto-fix
npm run format         # Prettier formatting
```

### Frontend Development
```bash
cd frontend

# Install dependencies  
npm install

# Development server (with Turbopack)
npm run dev

# Production build and start
npm run build
npm run start

# Code quality
npm run lint           # Next.js ESLint
```

## Development Workflow

1. **Backend Development**: Start with `npm run start:dev` in the backend directory for hot reloading
2. **Frontend Development**: Use `npm run dev --turbopack` for fast development with Turbopack
3. **Testing**: Run backend tests with `npm run test` and ensure coverage with `npm run test:cov`
4. **Code Quality**: Both projects use ESLint - run linting before committing changes

## Key Technical Details

### Frontend UI Components
- Uses Shadcn/ui component library configured in `components.json`
- Tailwind CSS with custom theme and CSS variables
- Responsive design with mobile-first approach
- Dark/light theme support throughout the application

### Current Implementation Status
- Frontend has mock chat interface with placeholder voice recognition
- Backend is minimal NestJS starter - RAG pipeline not yet implemented
- Admin interface exists but not yet connected to backend
- Voice and audio features are mocked pending real API integration

### Planned Features (from PRD)
- Vector database integration (Qdrant, Milvus, or Pinecone)
- LLM provider integration (OpenAI, Claude, etc.)
- Speech services (OpenAI Whisper for STT, OpenAI TTS for voice synthesis)
- Document upload and processing for knowledge base
- Query logging and analytics for admin

When implementing new features, follow the established patterns: NestJS modules/controllers/services for backend, and React components with TypeScript for frontend.