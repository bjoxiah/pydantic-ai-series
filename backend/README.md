# Pydantic AI Backend Examples

Simple examples and agents using Pydantic AI to demonstrate AI-powered functionality.

## Prerequisites

- Python 3.12+
- API keys for:
  - OpenRouter (for LLM access)
  - OpenExchangeRates (for exchange rate data)
  - Logfire (optional, for monitoring)

## Setup

### 1. Install Dependencies

```bash
uv sync
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
OPEN_ROUTER_API_KEY=your_openrouter_api_key
OPEN_EXCHANGE_APP_ID=your_openexchangerates_app_id
LOG_FIRE_TOKEN=your_logfire_token  # optional
```

## Running the Agent

### Start the Web Server

```bash
uvicorn main:app --reload
```

The agent will be available at `http://localhost:8000` if testing on the web

 or if running synchronously
```bash
uv run main.py
```

## Learn More

- [Pydantic AI Documentation](https://ai.pydantic.dev)
- [OpenRouter](https://openrouter.ai)
