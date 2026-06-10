'use client';

import { Agent, modelLabel, capBadge } from '@/models';
import { AgentMenu } from './AgentMenu';

interface AgentListProps {
    agents: Agent[];
    selectedAgent: Agent | null;
    loading: boolean;
    menuAgentId: string | null;
    onSelect: (agent: Agent) => void;
    onMenuToggle: (id: string) => void;
    onMenuClose: () => void;
    onEdit: (agent: Agent) => void;
    onDelete: (agent: Agent) => void;
    onTheme: (agent: Agent) => void;
    onEmbed: (agent: Agent) => void;
}

export function AgentList({ agents, selectedAgent, loading, menuAgentId, onSelect, onMenuToggle, onMenuClose, onEdit, onDelete, onTheme, onEmbed }: AgentListProps) {
    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
            <div className="flex items-center justify-between px-3.5 py-3 border-b border-gray-100">
                <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-gray-400">Agents</span>
                {agents.length > 0 && <span className="text-[10px] text-gray-400 bg-gray-100 rounded-full px-2 py-px">{agents.length}</span>}
            </div>
            <div className="flex-1 overflow-y-auto p-1.5">
                {loading ? (
                    <div className="flex flex-col gap-1.5 p-2">
                        {[1,2,3].map(i => <div key={i} className="h-12 rounded-md bg-gray-100 animate-pulse" style={{ opacity: 1 - i * 0.2 }} />)}
                    </div>
                ) : agents.length === 0 ? (
                    <p className="text-[11px] text-gray-300 text-center px-3 py-8 leading-relaxed">No agents yet.<br/>Create one to start.</p>
                ) : agents.map(agent => (
                    <div
                        key={agent.id}
                        onClick={() => onSelect(agent)}
                        className={`cursor-pointer rounded-md px-2.5 py-2 mb-0.5 transition-all relative group ${
                            selectedAgent?.id === agent.id
                                ? 'bg-violet-50 border border-violet-200'
                                : 'border border-transparent hover:bg-gray-50 hover:border-gray-200'
                        }`}
                    >
                        {selectedAgent?.id === agent.id && (
                            <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-violet-500 rounded-r" />
                        )}
                        <div className="flex items-start justify-between gap-1">
                            <div className={`text-[12px] font-semibold truncate mb-1 flex-1 ${selectedAgent?.id === agent.id ? 'text-violet-700' : 'text-gray-700'}`}>
                                {agent.name}
                            </div>
                            <button
                                onClick={e => { e.stopPropagation(); onMenuToggle(agent.id); }}
                                className="opacity-0 cursor-pointer group-hover:opacity-100 w-5 h-5 rounded grid place-items-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all shrink-0 -mt-0.5"
                            >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                    <circle cx="2" cy="6" r="1"/><circle cx="6" cy="6" r="1"/><circle cx="10" cy="6" r="1"/>
                                </svg>
                            </button>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[9px] text-gray-400">{modelLabel(agent.model_name)}</span>
                            {agent.capability_ids.map(cap => (
                                <span key={cap} className="text-[8px] px-1 py-px rounded bg-violet-50 text-violet-600 border border-violet-200">
                                    {capBadge(cap)}
                                </span>
                            ))}
                        </div>
                        {agent.ingestion_status === 'pending' && (
                            <div className="flex items-center gap-1 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                <span className="text-[8px] text-amber-500">indexing...</span>
                            </div>
                        )}
                        {menuAgentId === agent.id && (
                            <AgentMenu
                                onEdit={() => onEdit(agent)}
                                onDelete={() => onDelete(agent)}
                                onTheme={() => onTheme(agent)}
                                onEmbed={() => onEmbed(agent)}
                                onClose={onMenuClose}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}