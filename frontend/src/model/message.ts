export type AgentMessage = {
    id: string;
    role: string;
    content: string;
    toolCallId?: string;
    toolName?: string;
    toolCalls: any
};