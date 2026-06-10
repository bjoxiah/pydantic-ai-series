'use client';

import { useState } from 'react';
import { Agent } from '@/models';
import { ModalHeader } from './ModalHeader';
import { ModalShell } from './ModalShell';
import { SecondaryBtn } from './SecondaryBtn';

const WIDGET_CDN_URL = process.env.NEXT_PUBLIC_WIDGET_CDN_URL ?? 'https://cdn.your-domain.com/widget.umd.js';

interface EmbedSnippetModalProps {
    agent: Agent;
    onClose: () => void;
}

type TabId = 'script' | 'react' | 'npm';

export const EmbedSnippetModal = ({ agent, onClose }: EmbedSnippetModalProps) => {
    const [copied, setCopied] = useState<TabId | null>(null);
    const [activeTab, setActiveTab] = useState<TabId>('script');

    const copy = async (text: string, tab: TabId) => {
        await navigator.clipboard.writeText(text);
        setCopied(tab);
        setTimeout(() => setCopied(null), 2000);
    };

    const scriptSnippet = `<script
  src="${WIDGET_CDN_URL}"
  data-agent-id="${agent.id}">
</script>`;

    const reactSnippet = `import { AgentWidget } from '@agent-builder/widget';

export default function App() {
  return (
    <>
      {/* your app */}
      <AgentWidget agentId="${agent.id}" />
    </>
  );
}`;

    const npmSnippet = `# Install
npm install @agent-builder/widget

# or
pnpm add @agent-builder/widget`;

    const tabs: { id: TabId; label: string }[] = [
        { id: 'script', label: 'Script Tag' },
        { id: 'react', label: 'React' },
        { id: 'npm', label: 'NPM' },
    ];

    const snippets: Record<TabId, string> = {
        script: scriptSnippet,
        react: reactSnippet,
        npm: npmSnippet,
    };

    return (
        <ModalShell onClose={onClose} width="520px">
            <ModalHeader title="Embed Widget" subtitle={`Add ${agent.name} to any website`} onClose={onClose} />

            <div className="px-5 py-5 flex flex-col gap-4">

                {/* Instructions */}
                <div className="flex items-start gap-3 bg-violet-50 border border-violet-100 rounded-lg px-3.5 py-3">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
                        <circle cx="8" cy="8" r="7" stroke="#7c6af7" strokeWidth="1.3"/>
                        <path d="M8 5v4M8 11h.01" stroke="#7c6af7" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                    <p className="text-[11px] text-violet-700 leading-relaxed">
                        Drop the snippet into your website. The widget loads your agent theme and configuration automatically.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-1.5 text-[11px] font-mono rounded-md transition-all ${
                                activeTab === tab.id
                                    ? 'bg-white text-gray-800 shadow-sm'
                                    : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Code block */}
                <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-[12px] font-mono leading-relaxed overflow-x-auto whitespace-pre">
                        {snippets[activeTab]}
                    </pre>
                    <button
                        onClick={() => copy(snippets[activeTab], activeTab)}
                        className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-mono rounded-md transition-all ${
                            copied === activeTab
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                        {copied === activeTab ? (
                            <>
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                COPIED
                            </>
                        ) : (
                            <>
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <rect x="3.5" y="1" width="5.5" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                                    <path d="M1 3.5v5a1 1 0 0 0 1 1h4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                </svg>
                                COPY
                            </>
                        )}
                    </button>
                </div>

                {/* Agent ID */}
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5">
                    <div>
                        <div className="text-[9px] font-bold tracking-widest uppercase text-gray-400 mb-0.5">Agent ID</div>
                        <div className="text-[12px] font-mono text-gray-700">{agent.id}</div>
                    </div>
                    <button
                        onClick={() => navigator.clipboard.writeText(agent.id)}
                        className="text-[10px] text-gray-400 hover:text-gray-600 font-mono transition-colors"
                    >
                        COPY
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
                <SecondaryBtn onClick={onClose}>DONE</SecondaryBtn>
            </div>
        </ModalShell>
    );
}