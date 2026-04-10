# Backend for Pydantic AI Currency Exchange Agent

This is the backend service for a USD currency exchange agent built with Pydantic AI and FastAPI. It provides real-time exchange rates for various currencies using the Open Exchange Rates API.

## Features

- Real-time USD exchange rates for GBP, EUR, JPY, KRW, CNY
- Built with Pydantic AI for intelligent agent interactions
- FastAPI for high-performance API endpoints
- CORS enabled for frontend integration
- MCP Server SSE for real-time updates

## Prerequisites

- Python 3.12 or higher
- API keys for:
  - OpenRouter (for AI model)
  - Open Exchange Rates (for currency data)

## Installation

1. Clone the repository and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   uv sync
   ```

3. Create a `.env` file in the backend directory with your API keys:
   ```
   OPEN_ROUTER_API_KEY=your_openrouter_api_key
   OPEN_EXCHANGE_APP_ID=your_open_exchange_app_id
   ```

## Running the Application

Start the development server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.


## Project Structure

- `main.py`: Main application file with FastAPI app and Pydantic AI agent
- `pyproject.toml`: Project configuration and dependencies
- `README.md`: This file

## Dependencies

- FastAPI: Web framework
- Pydantic AI: AI agent framework
- Uvicorn: ASGI server
- python-dotenv: Environment variable management
- httpx: HTTP client for API calls
