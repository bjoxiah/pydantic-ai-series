import { useState, useRef, useEffect } from 'react';
import { type AgentTheme, type Conversation, type DisplayMessage, toDisplayMessages } from '../models';
import { X } from 'lucide-react';

interface ChatWindowProps {
    theme: AgentTheme;
    agentName: string;
    conversation: Conversation;
    apiUrl: string;
    onClose: () => void;
}

export function ChatWindow({ theme, agentName, conversation, apiUrl, onClose }: ChatWindowProps) {
    const [messages, setMessages] = useState<DisplayMessage[]>(toDisplayMessages(conversation.messages_json));
    const [input, setInput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || streaming) return;
        const userMessage = input.trim();
        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        const updatedMessages: DisplayMessage[] = [...messages, { role: 'user', content: userMessage }];
        setMessages(updatedMessages);
        setStreaming(true);
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
            const res = await fetch(`${apiUrl}/agui`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
                body: JSON.stringify({
                    thread_id: conversation.id,
                    run_id: crypto.randomUUID(),
                    messages: updatedMessages.map(m => ({ role: m.role, content: m.content, id: crypto.randomUUID() })),
                    state: {}, tools: [], context: [], forwardedProps: {},
                }),
            });

            const reader = res.body!.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                for (const line of decoder.decode(value).split('\n')) {
                    if (!line.startsWith('data: ')) continue;
                    const data = line.slice(6).trim();
                    if (!data) continue;
                    try {
                        const event = JSON.parse(data);
                        if (event.type === 'TEXT_MESSAGE_CONTENT' && event.delta) {
                            setMessages(prev => {
                                const updated = [...prev];
                                updated[updated.length - 1] = {
                                    role: 'assistant',
                                    content: updated[updated.length - 1].content + event.delta,
                                };
                                return updated;
                            });
                        }
                        if (event.type === 'RUN_FINISHED') setStreaming(false);
                    } catch { /* skip */ }
                }
            }
        } catch {
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: 'Something went wrong. Please try again.' };
                return updated;
            });
        } finally {
            setStreaming(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const s = (style: React.CSSProperties): React.CSSProperties => style;

    return (
        <div style={s({ display: 'flex', flexDirection: 'column', height: '100%', background: theme.bg_color, fontFamily: 'system-ui, -apple-system, sans-serif' })}>

            {/* Header */}
            <div style={s({
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', background: theme.primary_color,
                flexShrink: 0,
            })}>
                <div style={s({ display: 'flex', alignItems: 'center', gap: 10 })}>
                    <div style={s({
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: '#fff',
                    })}>
                        {agentName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div style={s({ fontSize: 13, fontWeight: 600, color: '#fff' })}>{agentName}</div>
                        <div style={s({ display: 'flex', alignItems: 'center', gap: 4 })}>
                            <span style={s({ width: 6, height: 6, borderRadius: '50%', background: '#86efac', display: 'inline-block' })} />
                            <span style={s({ fontSize: 11, color: 'rgba(255,255,255,0.8)' })}>Online</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={s({ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' })}
                >
                    <X />
                </button>
            </div>

            {/* Messages */}
            <div style={s({ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10, background: '#f9fafb' })}>
                {messages.length === 0 && (
                    <div style={s({
                        background: '#fff', borderRadius: 12, padding: '10px 13px',
                        fontSize: 13, color: '#374151', maxWidth: '80%',
                        border: '1px solid #f3f4f6', alignSelf: 'flex-start',
                        lineHeight: 1.5,
                    })}>
                        {theme.greeting}
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} style={s({ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' })}>
                        <div style={s({
                            maxWidth: '80%',
                            padding: '9px 13px',
                            borderRadius: m.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                            fontSize: 13,
                            lineHeight: 1.55,
                            background: m.role === 'user' ? theme.bubble_user_color : '#fff',
                            color: m.role === 'user' ? '#fff' : theme.text_color,
                            border: m.role === 'assistant' ? '1px solid #f3f4f6' : 'none',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                        })}>
                            {m.content}
                            {streaming && i === messages.length - 1 && m.role === 'assistant' && (
                                <span style={s({ display: 'inline-block', width: 2, height: 13, background: theme.primary_color, marginLeft: 2, verticalAlign: 'middle', animation: 'widget-blink 0.9s step-end infinite' })} />
                            )}
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={s({ padding: '10px 12px 12px', background: '#fff', borderTop: '1px solid #f3f4f6', flexShrink: 0 })}>
                <div style={s({
                    display: 'flex', alignItems: 'flex-end', gap: 8,
                    background: '#f9fafb', border: '1.5px solid #e5e7eb',
                    borderRadius: 10, padding: '8px 10px',
                    transition: 'border-color 0.15s',
                })}>
                    <textarea
                        ref={textareaRef}
                        placeholder="Type a message..."
                        value={input}
                        rows={1}
                        disabled={streaming}
                        onChange={e => {
                            setInput(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={e => { (e.target.closest('div') as HTMLDivElement).style.borderColor = theme.primary_color; }}
                        onBlur={e => { (e.target.closest('div') as HTMLDivElement).style.borderColor = '#e5e7eb'; }}
                        style={s({
                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                            resize: 'none', fontSize: 13, color: theme.text_color,
                            fontFamily: 'system-ui, sans-serif', lineHeight: 1.5,
                            minHeight: 20, maxHeight: 100,
                        })}
                    />
                    <button
                        onClick={handleSend}
                        disabled={streaming || !input.trim()}
                        style={s({
                            width: 30, height: 30, borderRadius: 8, border: 'none',
                            background: streaming || !input.trim() ? '#e5e7eb' : theme.primary_color,
                            color: '#fff', cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, transition: 'background 0.15s',
                        })}
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
                <div style={s({ fontSize: 10, color: '#d1d5db', marginTop: 5, textAlign: 'center', fontFamily: 'system-ui, sans-serif' })}>
                    Powered by Agent Builder
                </div>
            </div>
        </div>
    );
}