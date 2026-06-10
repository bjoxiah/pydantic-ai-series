'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { HttpAgent, AgentSubscriber, randomUUID } from '@ag-ui/client';
import { Agent, Conversation, DisplayMessage, toDisplayMessages } from '@/models';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

interface AgentChatProps {
    agent: Agent;
    conversation: Conversation;
    onConvoUpdated: (convo: Conversation) => void;
}

export const AgentChat = ({ agent, conversation, onConvoUpdated }: AgentChatProps) => {
    const [messages, setMessages] = useState<DisplayMessage[]>(() =>
        toDisplayMessages(conversation.messages_json)
    );
    const [input, setInput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || streaming) return;

        const userMessage = input.trim();
        setInput('');

        const updatedMessages: DisplayMessage[] = [
            ...messages,
            { role: 'user', content: userMessage },
        ];
        setMessages(updatedMessages);
        setStreaming(true);

        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        const httpAgent = new HttpAgent({
            url: `${API_URL}/agui`,
            threadId: conversation.id,
        });

        httpAgent.messages = updatedMessages.map(m => ({
            id: randomUUID(),
            role: m.role,
            content: m.content,
        }));

        const subscriber: AgentSubscriber = {
            onRunStartedEvent: () => setStreaming(true),

            onTextMessageContentEvent: ({ event }) => {
                const delta = event.delta ?? '';
                if (!delta) return;
                setMessages(prev => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    updated[updated.length - 1] = {
                        ...last,
                        content: last.content + delta,
                    };
                    return updated;
                });
            },

            onRunFinishedEvent: () => {
                setStreaming(false);
                fetch(`${API_URL}/conversations/${conversation.id}`)
                    .then(r => r.json())
                    .then(onConvoUpdated);
            },

            onRunFailed: ({ error }) => {
                console.error('Agent run failed:', error);
                setStreaming(false);
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                        role: 'assistant',
                        content: 'Something went wrong. Please try again.',
                    };
                    return updated;
                });
            },
        };

        await httpAgent.runAgent({ runId: randomUUID(), tools: [], context: [] }, subscriber);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const modelLabel = (m: string) => m.split('/').pop() ?? m;

    return (
        <div className="flex flex-col h-full bg-white font-mono">
            {/* Agent bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-white shrink-0 shadow-sm">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-linear-to-br from-violet-600 to-violet-400 grid place-items-center text-[10px] font-bold text-white shrink-0">
                        {agent.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="text-[12px] font-semibold text-gray-800">{agent.name}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-60">
                            {conversation.user_name
                                ? `${conversation.user_name} · ${conversation.user_email}`
                                : modelLabel(agent.model_name)}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    {agent.capability_ids.map(cap => (
                        <span key={cap} className="text-[9px] px-1.5 py-px rounded border border-violet-200 bg-violet-50 text-violet-600 tracking-wide">
                            {cap.replace('_', ' ')}
                        </span>
                    ))}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-5 bg-gray-50 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 px-10 text-center">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-violet-600 to-violet-400 grid place-items-center text-white text-[12px] font-bold shadow-md">
                            {agent.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="text-[14px] font-semibold text-gray-700">{agent.name}</div>
                        <div className="text-[11px] text-gray-400 max-w-65 leading-relaxed">
                            {agent.instructions.slice(0, 100)}{agent.instructions.length > 100 ? '...' : ''}
                        </div>
                        <div className="flex flex-wrap gap-1.5 justify-center mt-2 max-w-85">
                            {['What can you help me with?', 'Tell me about yourself', 'Get started'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => { setInput(p); inputRef.current?.focus(); }}
                                    className="text-[10px] px-2.5 py-1 rounded-full border border-gray-200 text-gray-400 hover:border-violet-300 hover:text-violet-500 hover:bg-violet-50 transition-all bg-white"
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((m, i) => (
                        <div
                            key={i}
                            className={`flex px-5 py-1.5 gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            style={{ animation: 'msgIn 0.18s ease-out' }}
                        >
                            {m.role === 'assistant' && (
                                <div className="w-6 h-6 rounded-full bg-linear-to-br from-violet-600 to-violet-400 grid place-items-center text-[7px] font-bold text-white shrink-0 mt-0.5 shadow-sm">
                                    AI
                                </div>
                            )}
                            <div className={`max-w-[70%] px-3.5 py-2.5 rounded-xl text-[13px] leading-relaxed wrap-break-words ${
                                m.role === 'user'
                                    ? 'bg-violet-600 text-white rounded-br-sm shadow-sm whitespace-pre-wrap'
                                    : 'bg-white text-gray-700 border border-gray-200 rounded-bl-sm shadow-sm'
                            }`}>
                                {m.role === 'user' ? m.content : (
                                    <div className="prose prose-sm max-w-none
                                        prose-p:my-1 prose-p:leading-relaxed prose-p:text-gray-700
                                        prose-headings:text-gray-800 prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1
                                        prose-strong:text-gray-800 prose-strong:font-semibold
                                        prose-code:text-violet-600 prose-code:bg-violet-50 prose-code:px-1 prose-code:py-px prose-code:rounded prose-code:text-[11px] prose-code:before:content-none prose-code:after:content-none
                                        prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-pre:rounded-lg prose-pre:p-3 prose-pre:my-2
                                        prose-ul:my-1 prose-ul:pl-4 prose-li:my-0.5 prose-li:text-gray-700
                                        prose-ol:my-1 prose-ol:pl-4
                                        prose-a:text-violet-600 prose-a:no-underline hover:prose-a:underline
                                        prose-blockquote:border-l-2 prose-blockquote:border-violet-300 prose-blockquote:text-gray-500 prose-blockquote:pl-3 prose-blockquote:my-2
                                        prose-hr:border-gray-200">
                                        <ReactMarkdown>{m.content}</ReactMarkdown>
                                    </div>
                                )}
                                {streaming && i === messages.length - 1 && m.role === 'assistant' && (
                                    <span className="inline-block w-0.5 h-3.5 bg-violet-400 ml-0.5 align-middle animate-[blink_0.9s_step-end_infinite]" />
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-5 pt-3 border-t border-gray-100 bg-white shrink-0">
                <div className="flex items-end gap-2.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
                    <textarea
                        ref={inputRef}
                        placeholder={`Message ${agent.name}...`}
                        value={input}
                        rows={1}
                        disabled={streaming}
                        onChange={e => {
                            setInput(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
                        }}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-none outline-none resize-none text-[13px] text-gray-800 placeholder:text-gray-300 leading-relaxed min-h-5 max-h-36 overflow-y-auto scrollbar-none font-mono"
                    />
                    <button
                        onClick={handleSend}
                        disabled={streaming || !input.trim()}
                        className="w-7 h-7 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-gray-200 text-white grid place-items-center shrink-0 transition-all hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed shadow-sm"
                    >
                        {streaming ? (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                                <rect x="1" y="1" width="3.5" height="8" rx="1"/>
                                <rect x="5.5" y="1" width="3.5" height="8" rx="1"/>
                            </svg>
                        ) : (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M5 8.5V1.5M2 4.5L5 1.5l3 3" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        )}
                    </button>
                </div>
                <div className="text-[9px] text-gray-300 mt-1.5 px-1 tracking-wide">↵ SEND · SHIFT+↵ NEW LINE</div>
            </div>

            <style>{`
                @keyframes msgIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
                .scrollbar-none::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};