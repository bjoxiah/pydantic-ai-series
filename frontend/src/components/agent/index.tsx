/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { AgentDialog } from '../agent-dialog';
import { AgentChat } from './chat';
import { AgentList } from './util/agent-list';
import { ConversationList } from './util/conversation-list';
import { NewConvoModal } from './util/new-convo-modal';
import { EditAgentModal } from './util/edit-agent-modal';
import { ConfirmDeleteModal } from './util/delete-agent-modal';
import { ThemeModal } from './util/theme-modal';
import { EmbedSnippetModal } from './util/embed-modal';
import { Agent, Conversation, API_URL } from '@/models';

export type { Agent, Conversation };

export const AgentDashboard = () => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
    const [capabilities, setCapabilities] = useState<any[]>([]);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [newConvoOpen, setNewConvoOpen] = useState(false);
    const [newConvoLoading, setNewConvoLoading] = useState(false);
    const [menuAgentId, setMenuAgentId] = useState<string | null>(null);
    const [editAgent, setEditAgent] = useState<Agent | null>(null);
    const [deleteAgent, setDeleteAgent] = useState<Agent | null>(null);
    const [themeAgent, setThemeAgent] = useState<Agent | null>(null);
    const [embedAgent, setEmbedAgent] = useState<Agent | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [loadingAgents, setLoadingAgents] = useState(true);
    const [loadingConvos, setLoadingConvos] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/agents`).then(r => r.json()).then(setAgents).catch(console.error).finally(() => setLoadingAgents(false));
        fetch(`${API_URL}/capabilities`).then(r => r.json()).then(setCapabilities).catch(console.error);
    }, []);

    const handleSelectAgent = async (agent: Agent) => {
        setSelectedAgent(agent);
        setSelectedConvo(null);
        setLoadingConvos(true);
        try {
            const res = await fetch(`${API_URL}/agents/${agent.id}/conversations`);
            setConversations(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoadingConvos(false); }
    };

    const handleAgentUpdated = (updated: Agent) => {
        setAgents(prev => prev.map(a => a.id === updated.id ? updated : a));
        if (selectedAgent?.id === updated.id) setSelectedAgent(updated);
    };

    const handleAgentDeleted = async () => {
        if (!deleteAgent) return;
        setDeleteLoading(true);
        try {
            await fetch(`${API_URL}/agents/${deleteAgent.id}`, { method: 'DELETE' });
            setAgents(prev => prev.filter(a => a.id !== deleteAgent.id));
            if (selectedAgent?.id === deleteAgent.id) { setSelectedAgent(null); setConversations([]); setSelectedConvo(null); }
            setDeleteAgent(null);
        } catch (e) { console.error(e); }
        finally { setDeleteLoading(false); }
    };

    const handleCreateConversation = async (userName: string, userEmail: string) => {
        if (!selectedAgent) return;
        setNewConvoLoading(true);
        try {
            const res = await fetch(`${API_URL}/agents/${selectedAgent.id}/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_name: userName, user_email: userEmail }),
            });
            const convo = await res.json();
            setConversations(prev => [convo, ...prev]);
            setSelectedConvo(convo);
            setNewConvoOpen(false);
        } catch (e) { console.error(e); }
        finally { setNewConvoLoading(false); }
    };

    const handleSelectConvo = async (convo: Conversation) => {
        const res = await fetch(`${API_URL}/conversations/${convo.id}`);
        setSelectedConvo(await res.json());
    };

    const handleDeleteConvo = async (convoId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await fetch(`${API_URL}/conversations/${convoId}`, { method: 'DELETE' });
        setConversations(prev => prev.filter(c => c.id !== convoId));
        if (selectedConvo?.id === convoId) setSelectedConvo(null);
    };

    const handleConvoUpdated = (updated: Conversation) => {
        setConversations(prev => prev.map(c => c.id === updated.id ? updated : c));
        setSelectedConvo(updated);
    };

    const handleAgentCreated = (agent: Agent) => {
        setAgents(prev => [...prev, agent]);
        setSelectedAgent(agent);
        setConversations([]);
        setSelectedConvo(null);
        if (agent.ingestion_status === 'ready') return;
        const es = new EventSource(`${API_URL}/agents/${agent.id}/stream`);
        es.onmessage = e => {
            const { status } = JSON.parse(e.data);
            if (status === 'ready') {
                setAgents(prev => prev.map(a => a.id === agent.id ? { ...a, ingestion_status: 'ready' } : a));
                es.close();
            }
        };
        es.onerror = () => es.close();
    };

    return (
        <div className="h-screen w-full flex flex-col bg-gray-100 text-gray-900 font-mono overflow-hidden">

            {/* Header */}
            <header className="flex items-center justify-between px-6 h-12 border-b border-gray-200 bg-white shrink-0 shadow-sm">
                <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 border-[1.5px] border-violet-500 rounded grid place-items-center">
                        <div className="w-2 h-2 bg-violet-500 rounded-xs rotate-45" />
                    </div>
                    <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-gray-800">Agent Builder</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setDialogOpen(true)}
                        className="flex cursor-pointer items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-mono tracking-wide text-white bg-violet-600 hover:bg-violet-500 rounded-md transition-all hover:-translate-y-px shadow-sm"
                    >
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                            <path d="M4.5 1v7M1 4.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        NEW AGENT
                    </button>
                </div>
            </header>

            {/* Body */}
            <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup orientation="horizontal" className="h-full">

                    <ResizablePanel defaultSize={"18%"}>
                        <AgentList
                            agents={agents}
                            selectedAgent={selectedAgent}
                            loading={loadingAgents}
                            menuAgentId={menuAgentId}
                            onSelect={handleSelectAgent}
                            onMenuToggle={id => setMenuAgentId(menuAgentId === id ? null : id)}
                            onMenuClose={() => setMenuAgentId(null)}
                            onEdit={agent => setEditAgent(agent)}
                            onDelete={agent => setDeleteAgent(agent)}
                            onTheme={agent => setThemeAgent(agent)}
                            onEmbed={agent => setEmbedAgent(agent)}
                        />
                    </ResizablePanel>

                    <ResizableHandle className="w-px bg-gray-200 hover:bg-violet-300 transition-colors" />

                    <ResizablePanel defaultSize={"22%"}>
                        <ConversationList
                            agent={selectedAgent}
                            conversations={conversations}
                            selectedConvo={selectedConvo}
                            loading={loadingConvos}
                            onSelect={handleSelectConvo}
                            onDelete={handleDeleteConvo}
                            onNew={() => setNewConvoOpen(true)}
                        />
                    </ResizablePanel>

                    <ResizableHandle className="w-px bg-gray-200 hover:bg-violet-300 transition-colors" />

                    <ResizablePanel defaultSize={"60%"}>
                        {!selectedConvo ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 bg-gray-50">
                                <div className="w-12 h-12 rounded-xl border border-gray-200 bg-white grid place-items-center text-gray-300 shadow-sm">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                    </svg>
                                </div>
                                <div className="text-[13px] font-semibold text-gray-400">No conversation selected</div>
                                <div className="text-[11px] text-gray-300">
                                    {selectedAgent ? 'Select a conversation or start a new one' : 'Select an agent to get started'}
                                </div>
                                {selectedAgent && (
                                    <button onClick={() => setNewConvoOpen(true)} className="flex items-center gap-1.5 mt-1 px-4 py-2 text-[11px] font-mono text-white bg-violet-600 hover:bg-violet-500 rounded-md transition-all hover:-translate-y-px shadow-sm">
                                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                                            <path d="M4.5 1v7M1 4.5h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                                        </svg>
                                        New conversation
                                    </button>
                                )}
                            </div>
                        ) : (
                            <AgentChat key={selectedConvo.id} agent={selectedAgent!} conversation={selectedConvo} onConvoUpdated={handleConvoUpdated} />
                        )}
                    </ResizablePanel>

                </ResizablePanelGroup>
            </div>

            {/* Modals */}
            <AgentDialog open={dialogOpen} onOpenChange={setDialogOpen} onAgentCreated={handleAgentCreated} />

            {newConvoOpen && selectedAgent && (
                <NewConvoModal agentName={selectedAgent.name} onConfirm={handleCreateConversation} onClose={() => setNewConvoOpen(false)} loading={newConvoLoading} />
            )}
            {editAgent && (
                <EditAgentModal agent={editAgent} capabilities={capabilities} onSave={handleAgentUpdated} onClose={() => setEditAgent(null)} />
            )}
            {deleteAgent && (
                <ConfirmDeleteModal agentName={deleteAgent.name} onConfirm={handleAgentDeleted} onClose={() => setDeleteAgent(null)} loading={deleteLoading} />
            )}
            {themeAgent && (
                <ThemeModal agent={themeAgent} onSave={handleAgentUpdated} onClose={() => setThemeAgent(null)} />
            )}
            {embedAgent && (
                <EmbedSnippetModal agent={embedAgent} onClose={() => setEmbedAgent(null)} />
            )}
        </div>
    );
};