'use client';

import { Agent, Conversation, formatTime, toDisplayMessages } from '@/models';

interface ConversationListProps {
    agent: Agent | null;
    conversations: Conversation[];
    selectedConvo: Conversation | null;
    loading: boolean;
    onSelect: (convo: Conversation) => void;
    onDelete: (convoId: string, e: React.MouseEvent) => void;
    onNew: () => void;
}

export const ConversationList = ({ agent, conversations, selectedConvo, loading, onSelect, onDelete, onNew }: ConversationListProps) => {
    return (
        <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200">
            <div className="flex items-center justify-between px-3.5 py-3 border-b border-gray-100 bg-white">
                <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-gray-400 truncate">
                    {agent?.name ?? 'Conversations'}
                </span>
                {agent && (
                    <button
                        onClick={onNew}
                        disabled={agent.ingestion_status === 'pending'}
                        className="flex cursor-pointer items-center gap-1 px-2 py-1 text-[10px] font-mono text-violet-600 bg-violet-50 border border-violet-200 rounded hover:bg-violet-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M4 1v6M1 4h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                        </svg>
                        NEW
                    </button>
                )}
            </div>

            {agent?.ingestion_status === 'pending' && (
                <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 border-b border-amber-100 text-[10px] text-amber-600">
                    <span className="w-2.5 h-2.5 rounded-full border border-amber-300 border-t-amber-500 animate-spin shrink-0" />
                    Indexing knowledge base...
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-1.5">
                {!agent ? (
                    <p className="text-[11px] text-gray-300 text-center px-3 py-8">Select an agent to view conversations.</p>
                ) : loading ? (
                    <div className="flex flex-col gap-1.5 p-2">
                        {[1,2].map(i => <div key={i} className="h-14 rounded-md bg-gray-200 animate-pulse" style={{ opacity: 1 - i * 0.3 }} />)}
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
                        <p className="text-[11px] text-gray-300">No conversations yet.</p>
                        <button onClick={onNew} className="flex cursor-pointer items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-mono text-white bg-violet-600 hover:bg-violet-500 rounded transition-all hover:-translate-y-px shadow-sm">
                            Start first chat
                        </button>
                    </div>
                ) : conversations.map(convo => (
                    <div
                        key={convo.id}
                        onClick={() => onSelect(convo)}
                        className={`cursor-pointer rounded-md px-2.5 py-2.5 mb-0.5 transition-all relative group flex items-start justify-between gap-2 ${
                            selectedConvo?.id === convo.id
                                ? 'bg-violet-50 border border-violet-200'
                                : 'border border-transparent hover:bg-white hover:border-gray-200 hover:shadow-sm'
                        }`}
                    >
                        {selectedConvo?.id === convo.id && (
                            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-violet-500 rounded-r" />
                        )}
                        <div className="flex-1 min-w-0">
                            <div className={`text-[11px] font-semibold truncate mb-0.5 ${selectedConvo?.id === convo.id ? 'text-violet-700' : 'text-gray-700'}`}>
                                {convo.user_name ?? convo.title}
                            </div>
                            {convo.user_email && (
                                <div className="text-[9px] text-gray-400 truncate mb-1">{convo.user_email}</div>
                            )}
                            <div className="text-[9px] text-gray-300">
                                {toDisplayMessages(convo.messages_json).length} messages
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[9px] text-gray-300">{formatTime(convo.updated_at)}</span>
                            <button
                                onClick={e => onDelete(convo.id, e)}
                                className="opacity-0 cursor-pointer group-hover:opacity-100 w-4 h-4 rounded grid place-items-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all"
                            >
                                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                                    <path d="M1.5 1.5l6 6M7.5 1.5l-6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}