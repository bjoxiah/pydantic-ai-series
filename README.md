# Exchange Rate Agent

A full-stack AI-powered currency exchange application built with Pydantic AI, featuring real-time exchange rates and an interactive chat interface.

## Overview

This project demonstrates the integration of Pydantic AI's Agentic UI (AG-UI) framework with modern web technologies to create an intelligent currency exchange assistant. The application consists of:

- **Backend**: FastAPI server with Pydantic AI agent that fetches live exchange rates
- **Frontend**: Next.js application with AG-UI client for seamless user interaction

## Features

- 🤖 AI-powered currency exchange assistant
- 💬 Real-time chat interface with the agent
- 📊 Live exchange rate data from Open Exchange Rates API
- 🎯 Interactive currency selection and confirmation
- 🔄 Real-time updates via Server-Sent Events (SSE)
- 📱 Responsive design with resizable panels

## Supported Currencies

- GBP (British Pound)
- EUR (Euro)
- JPY (Japanese Yen)
- KRW (Korean Won)
- CNY (Chinese Yuan)

All rates are quoted against USD (US Dollar) as the base currency.

## Architecture

### Backend (`/backend`)
- **Framework**: FastAPI
- **AI Engine**: Pydantic AI with OpenRouter (Google Gemini 3 Flash)
- **Data Source**: Open Exchange Rates API
- **Communication**: MCP Server SSE for real-time updates
- **CORS**: Enabled for frontend integration

### Frontend (`/frontend`)
- **Framework**: Next.js 16 with App Router
- **UI Library**: AG-UI Client
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Layout**: React Resizable Panels

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 18+
- API keys for OpenRouter and Open Exchange Rates

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bjoxiah/pydantic-ai-series.git
   cd pydantic-ai-series
   ```

2. **Backend Setup**
   ```bash
   cd backend
   uv sync
   .env  # Add your API keys
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   pnpm install
   ```

### Running the Application

1. **Start Backend**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **Start Frontend** (in another terminal)
   ```bash
   cd frontend
   pnpm dev
   ```

3. **Open** [http://localhost:3000](http://localhost:3000)

## Usage

1. Click "Start Message" on the home page
2. Ask the AI about exchange rates (e.g., "What's the rate for USD to EUR?")
3. The agent will confirm currencies if needed
4. View live rates in the preview panel

## API Keys Required

Create accounts and get API keys from:
- [OpenRouter](https://openrouter.ai/) - For AI model access
- [Open Exchange Rates](https://openexchangerates.org/) - For currency data

## Project Structure

```
pydantic-ai-series/
├── backend/
│   ├── main.py              # FastAPI app with Pydantic AI agent
│   ├── pyproject.toml       # Python dependencies
│   └── README.md           # Backend documentation
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js pages
│   │   ├── components/     # React components
│   │   ├── model/          # TypeScript types
│   │   └── store/          # Zustand state
│   ├── package.json        # Node dependencies
│   └── README.md           # Frontend documentation
└── README.md               # This file
```

## Technologies

- **Backend**: FastAPI, Pydantic AI, OpenRouter, httpx, python-dotenv
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, AG-UI, Zustand
- **AI**: Google Gemini 3 Flash via OpenRouter
- **Data**: Open Exchange Rates API

## Development

- Backend uses `uvicorn` for development server
- Frontend uses `pnpm` for package management
- Both projects include comprehensive READMEs with detailed setup instructions
