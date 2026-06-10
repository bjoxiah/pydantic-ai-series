/* eslint-disable @typescript-eslint/no-explicit-any */
export interface AgentTheme {
    primary_color: string;
    bg_color: string;
    text_color: string;
    bubble_user_color: string;
    bubble_ai_color: string;
    launcher_icon: 'chat' | 'bot' | 'sparkle';
    position: 'bottom-right' | 'bottom-left';
    greeting: string;
    agent_label: string;
}

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export interface AgentConfig {
    id: string;
    name: string;
    theme: AgentTheme;
}

export interface Conversation {
    id: string;
    agent_id: string;
    user_name: string | null;
    user_email: string | null;
    messages_json: any[];
}

export interface DisplayMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface AgentWidgetProps {
    agentId: string;
}

export const DEFAULT_THEME: AgentTheme = {
    primary_color: '#7c6af7',
    bg_color: '#ffffff',
    text_color: '#1f2937',
    bubble_user_color: '#7c6af7',
    bubble_ai_color: '#f3f4f6',
    launcher_icon: 'chat',
    position: 'bottom-right',
    greeting: 'Hi there! How can I help you today?',
    agent_label: 'AI Assistant',
};

export const toDisplayMessages = (messages_json: any[]): DisplayMessage[] => {
    const result: DisplayMessage[] = [];
    for (const msg of messages_json ?? []) {
        if (msg.role === 'system' || msg.role === 'tool') continue;
        if (msg.role === 'assistant' && !msg.content && msg.tool_calls?.length) continue;
        if (msg.role === 'user' && msg.content) result.push({ role: 'user', content: msg.content });
        else if (msg.role === 'assistant' && msg.content) result.push({ role: 'assistant', content: msg.content });
    }
    return result;
}