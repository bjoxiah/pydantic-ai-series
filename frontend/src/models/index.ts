/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Agent {
    id: string;
    name: string;
    model_name: string;
    instructions: string;
    capability_ids: string[];
    ingestion_status: string;
    created_at: string;
}

export interface Conversation {
    id: string;
    agent_id: string;
    title: string;
    messages_json: any[];
    user_name: string | null;
    user_email: string | null;
    created_at: string;
    updated_at: string;
}

export interface DisplayMessage {
    role: 'user' | 'assistant';
    content: string;
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export function toDisplayMessages(messages_json: any[]): DisplayMessage[] {
    const result: DisplayMessage[] = [];
    for (const msg of messages_json ?? []) {
        if (msg.role === 'system' || msg.role === 'tool') continue;
        if (msg.role === 'assistant' && !msg.content && msg.tool_calls?.length) continue;
        if (msg.role === 'user' && msg.content) result.push({ role: 'user', content: msg.content });
        else if (msg.role === 'assistant' && msg.content) result.push({ role: 'assistant', content: msg.content });
    }
    return result;
}

export const modelLabel = (m: string) => m.split('/').pop() ?? m;

export const capBadge = (id: string) =>
    ({ company_knowledge: 'KB', web_search: 'WS', calculator: 'CA', weather: 'WX', email: 'EM' }[id] ?? id.slice(0, 2).toUpperCase());

export const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(d).toLocaleDateString();
};

export const MODELS = [
    { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', tag: 'FAST' },
    { id: 'google/gemini-2.5-pro',   label: 'Gemini 2.5 Pro',   tag: 'SMART' },
    { id: 'openai/gpt-4.1',          label: 'GPT-4.1',          tag: '' },
    { id: 'openai/gpt-4o',           label: 'GPT-4o',           tag: '' },
    { id: 'anthropic/claude-sonnet-4-5', label: 'Claude Sonnet 4.5', tag: '' },
    { id: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash Preview', tag: '' },
];