'use client';

import { CurrencySelector } from '@/components/currency';
import { AgentMessage } from '@/model/message';
import { useAppStore } from '@/store';
import { Message, randomUUID } from '@ag-ui/client';
import { useEffect, useRef } from 'react';

type Props = {
    onSendMessage: (messages: Message[], assistantId: string) => void;
};

export const ChatComponent = ({ onSendMessage }: Props) => {
    const { messages, addMessage, activeTool, setLoading, loading } = useAppStore();
    const hasHydrated = useAppStore.persist.hasHydrated();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeTool, loading]);

    const handleSubmit = () => {
        const value = textareaRef.current?.value.trim() ?? '';
        if (!value || activeTool || loading) return;

        const newUserMessage: Message = { id: randomUUID(), role: 'user', content: value };
        const assistantId = randomUUID();
        const newAssistantMessage: Message = { id: assistantId, role: 'assistant', content: '' };

        addMessage(newUserMessage as AgentMessage);
        addMessage(newAssistantMessage as AgentMessage);
        onSendMessage([...messages, newUserMessage] as Message[], assistantId);

        if (textareaRef.current) {
            textareaRef.current.value = '';
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
    };

    const handleToolRespond = async (output: any) => {
        const { activeTool } = useAppStore.getState();
        if (!activeTool) return;

        if (output.confirmed && output.currencies?.length) {
            useAppStore.getState().addSnapshot({
                base: 'USD',
                rates: output.currencies.map((c: { code: string; name: string }) => ({
                    code: c.code, name: c.name, rate: null,
                })),
                status: 'fetching',
                date: '',
            });
        }

        setLoading(true);
        useAppStore.getState().setActiveTool(null);

        const toolMessage: Message = {
            id: randomUUID(),
            role: 'tool',
            content: JSON.stringify(output),
            toolCallId: activeTool.toolCallId,
        };

        const nextAssistantId = randomUUID();
        addMessage({ id: nextAssistantId, role: 'assistant', content: '' } as AgentMessage);

        const currentMessages = useAppStore.getState().messages;
        const messagesForAgent: Message[] = currentMessages
            .filter(m => m.id !== nextAssistantId)
            .map(m => ({
                id: m.id, role: m.role, content: m.content,
                ...(m.toolCalls && { toolCalls: m.toolCalls }),
                ...(m.toolCallId && { toolCallId: m.toolCallId }),
            }));

        onSendMessage([...messagesForAgent, toolMessage], nextAssistantId);
    };

    if (!hasHydrated) return null;

    const visibleMessages = messages.filter(
        x => x.role === 'user' || (x.role === 'assistant' && x.content !== '')
    );

    return (
        // h-full + overflow-hidden on the container prevents the whole component scrolling
        <div className="flex flex-col h-full overflow-hidden bg-slate-50">

            {/* HEADER — shrink-0 keeps it fixed height, never scrolls */}
            <div className="shrink-0 flex items-center gap-3 px-5 py-4 bg-white border-b border-slate-100">
                <span className="text-xl">🧙‍♂️</span>
                <div>
                    <p className="text-sm font-semibold text-slate-800 leading-tight">FX Assistant</p>
                    <p className="text-xs text-slate-400">USD · Real-time rates</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <span className="text-xs text-slate-400">{loading ? 'thinking' : 'online'}</span>
                </div>
            </div>

            {/* MESSAGES — this is the ONLY scrollable section */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 space-y-4">

                {visibleMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
                        <span className="text-5xl opacity-20">💬</span>
                        <p className="text-sm text-slate-400">Ask about exchange rates</p>
                        <p className="text-xs text-slate-300">e.g. "Rate for GBP and JPY?"</p>
                    </div>
                ) : (
                    visibleMessages.map(msg => (
                        <div
                            key={msg.id}
                            className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-base shrink-0 mt-0.5">
                                    🤖
                                </div>
                            )}
                            <div className={`max-w-[76%] px-4 py-2.5 text-sm leading-relaxed ${
                                msg.role === 'user'
                                    ? 'rounded-2xl rounded-tr-sm bg-indigo-600 text-white shadow-sm'
                                    : 'rounded-2xl rounded-tl-sm bg-white text-slate-700 border border-slate-100'
                            }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))
                )}

                {/* HITL */}
                {activeTool?.toolName === 'confirm_currency' && activeTool.status === 'executing' && (
                    <div className="flex gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-base shrink-0 mt-0.5">
                            🤖
                        </div>
                        <div className="flex-1">
                            <CurrencySelector
                                currencies={activeTool.args.target_currencies ?? []}
                                onConfirm={s => handleToolRespond({ confirmed: true, currencies: s })}
                                onCancel={() => handleToolRespond({ confirmed: false, currencies: [] })}
                            />
                        </div>
                    </div>
                )}

                {/* typing dots */}
                {loading && !activeTool && (
                    <div className="flex gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-base shrink-0">
                            🤖
                        </div>
                        <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-slate-100">
                            {[0, 1, 2].map(i => (
                                <span
                                    key={i}
                                    className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce"
                                    style={{ animationDelay: `${i * 150}ms` }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* INPUT — shrink-0 keeps it fixed at the bottom, never scrolls */}
            <div className="shrink-0 px-4 py-3 bg-white border-t border-slate-100">
                <div className="flex items-end gap-2 rounded-2xl px-4 py-2.5 bg-slate-50 border border-slate-200">
                    <textarea
                        ref={textareaRef}
                        placeholder={activeTool ? 'Make your selection above...' : 'Ask about exchange rates...'}
                        rows={1}
                        disabled={!!activeTool || loading}
                        onKeyDown={handleKeyDown}
                        onChange={handleInput}
                        className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-slate-700 placeholder-slate-400 leading-relaxed disabled:opacity-40 max-h-36 overflow-y-auto"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!!activeTool || loading}
                        className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-base font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                            activeTool || loading
                                ? 'bg-slate-200 text-slate-400'
                                : 'bg-indigo-600 text-white'
                        }`}
                    >
                        ↑
                    </button>
                </div>
                <p className="text-xs text-center text-slate-300 mt-2 font-mono">
                    Enter to send · Shift+Enter for new line
                </p>
            </div>
        </div>
    );
};