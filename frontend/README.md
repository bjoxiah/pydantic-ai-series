# Frontend for Pydantic AI Currency Exchange Agent

This is the Next.js frontend for a USD currency exchange agent built with Pydantic AI AG-UI. It provides a chat interface for interacting with the AI agent and displays real-time exchange rates.

## Features

- Interactive chat interface with AI currency exchange agent
- Real-time exchange rate display
- Currency selection interface for user confirmation
- Resizable panels for optimal layout
- Built with modern React and TypeScript

## Prerequisites

- Node.js 18 or higher
- Backend server running (see backend README)
- pnpm package manager

## Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/`: Next.js app router
  - `page.tsx`: Home page with start button
  - `chat/[id]/page.tsx`: Chat interface page
  - `api/ag-ui/route.ts`: API route for backend communication
- `components/`: React components
  - `home/`: Home page component
  - `main/`: Main chat interface
    - `chat/`: Chat component with message display and input
    - `preview/`: Exchange rate preview component
  - `currency/`: Currency selection component
  - `tools/`: Tool definitions for AG-UI
  - `ui/`: Reusable UI components
- `lib/`: Utility functions
- `model/`: TypeScript type definitions
- `store/`: Zustand state management

## Technologies Used

- **Next.js 16**: React framework with app router
- **React 19**: UI library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **@ag-ui/client**: AG-UI client library for AI agent communication
- **Zustand**: Lightweight state management
- **React Resizable Panels**: Layout management
- **shadcn/ui**: Component library
- **Zod**: Schema validation

## Development

### Available Scripts

- `pnpm dev`: Start development server
- `pnpm build`: Build for production
- `pnpm start`: Start production server
- `pnpm lint`: Run ESLint


## How It Works

1. **Home Page**: Users start by clicking "Start Message" to create a new chat session
2. **Chat Interface**: Users can ask about exchange rates (e.g., "Rate for GBP and JPY?")
3. **Currency Confirmation**: When the AI needs confirmation, users select currencies via an interactive UI
4. **Rate Display**: Real-time exchange rates are fetched and displayed in the preview panel

## API Integration

The frontend communicates with the backend through:
- Direct HTTP requests to the AG-UI endpoint
- Server-sent events for real-time updates
- Tool calls for interactive currency selection

