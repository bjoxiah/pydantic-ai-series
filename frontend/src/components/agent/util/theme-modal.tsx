/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Agent, API_URL } from '@/models';
import { ModalHeader } from './ModalHeader';
import { ModalShell } from './ModalShell';
import { PrimaryBtn } from './PrimaryBtn';
import { SecondaryBtn } from './SecondaryBtn';

interface AgentTheme {
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

const DEFAULT_THEME: AgentTheme = {
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

interface ThemeModalProps {
    agent: Agent;
    onSave: (updated: Agent) => void;
    onClose: () => void;
}

const ColorField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => {
    return (
        <div className="flex items-center justify-between">
            <label className="text-[11px] text-gray-500 font-mono">{label}</label>
            <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400 font-mono">{value}</span>
                <input
                    type="color"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-8 h-8 rounded-md border border-gray-200 cursor-pointer p-0.5 bg-white"
                />
            </div>
        </div>
    );
}

const ToggleGroup = ({ label, value, options, onChange }: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
}) => {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold tracking-widest uppercase text-gray-400">{label}</label>
            <div className="flex gap-1.5">
                {options.map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        className={`flex-1 py-1.5 cursor-pointer text-[11px] font-mono rounded-md border transition-all ${
                            value === opt.value
                                ? 'border-violet-300 bg-violet-50 text-violet-700'
                                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

export const ThemeModal = ({ agent, onSave, onClose }: ThemeModalProps) => {
    const current = { ...DEFAULT_THEME, ...(agent as any).theme };
    const [theme, setTheme] = useState<AgentTheme>(current);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const set = (key: keyof AgentTheme, value: string) => setTheme(prev => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        setLoading(true); setError('');
        try {
            const res = await fetch(`${API_URL}/agents/${agent.id}/theme`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(theme),
            });
            if (!res.ok) throw new Error('Failed to save theme');
            onSave(await res.json());
            onClose();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalShell onClose={onClose} width="750px">
            <ModalHeader title="Widget Theme" subtitle="Customize how the chat widget looks on your site" onClose={onClose} />

            <div className="flex gap-0 max-h-[65vh] overflow-hidden">

                {/* Left — controls */}
                <div className="flex-1 px-5 py-5 overflow-y-auto flex flex-col gap-5 border-r border-gray-100">

                    {/* Colors */}
                    <div className="flex flex-col gap-3">
                        <label className="text-[9px] font-bold tracking-widest uppercase text-gray-400">Colors</label>
                        <div className="flex flex-col gap-2.5 bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <ColorField label="Primary" value={theme.primary_color} onChange={v => { set('primary_color', v); set('bubble_user_color', v); }} />
                            <div className="h-px bg-gray-200" />
                            <ColorField label="Background" value={theme.bg_color} onChange={v => set('bg_color', v)} />
                            <div className="h-px bg-gray-200" />
                            <ColorField label="Text" value={theme.text_color} onChange={v => set('text_color', v)} />
                            <div className="h-px bg-gray-200" />
                            <ColorField label="AI Bubble" value={theme.bubble_ai_color} onChange={v => set('bubble_ai_color', v)} />
                        </div>
                    </div>

                    {/* Launcher icon */}
                    <ToggleGroup
                        label="Launcher Icon"
                        value={theme.launcher_icon}
                        options={[
                            { value: 'chat', label: '💬 Chat' },
                            { value: 'bot', label: '🤖 Bot' },
                            { value: 'sparkle', label: '✨ Sparkle' },
                        ]}
                        onChange={v => set('launcher_icon', v)}
                    />

                    {/* Position */}
                    <ToggleGroup
                        label="Position"
                        value={theme.position}
                        options={[
                            { value: 'bottom-right', label: 'Bottom Right' },
                            { value: 'bottom-left', label: 'Bottom Left' },
                        ]}
                        onChange={v => set('position', v)}
                    />

                    {/* Agent label */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold tracking-widest uppercase text-gray-400">Widget Label</label>
                        <input
                            value={theme.agent_label}
                            onChange={e => set('agent_label', e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-[12px] text-gray-800 outline-none font-mono focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                        />
                    </div>

                    {/* Greeting */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-bold tracking-widest uppercase text-gray-400">Greeting Message</label>
                        <textarea
                            value={theme.greeting}
                            onChange={e => set('greeting', e.target.value)}
                            rows={3}
                            className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-[12px] text-gray-800 outline-none font-mono focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none leading-relaxed"
                        />
                    </div>

                    {error && <p className="text-[10px] text-red-500">{error}</p>}
                </div>

                {/* Right — live preview */}
                <div className="w-75 shrink-0 bg-gray-50 flex flex-col items-center justify-end p-4 gap-3">
                    <span className="text-[9px] font-bold tracking-widest uppercase text-gray-400">Preview</span>

                    {/* Mini chat window preview */}
                    <div style={{ width: 160, height: 200, borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.06)', background: theme.bg_color, display: 'flex', flexDirection: 'column', fontSize: 10 }}>
                        {/* header */}
                        <div style={{ background: theme.primary_color, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 7, fontWeight: 700 }}>
                                {theme.agent_label.slice(0, 2).toUpperCase()}
                            </div>
                            <span style={{ color: '#fff', fontWeight: 600, fontSize: 10 }}>{theme.agent_label}</span>
                        </div>
                        {/* messages */}
                        <div style={{ flex: 1, padding: '8px', background: '#f9fafb', display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <div style={{ background: '#fff', borderRadius: '6px 6px 6px 2px', padding: '5px 7px', fontSize: 9, color: theme.text_color, border: '1px solid #f3f4f6', maxWidth: '85%' }}>
                                {theme.greeting.slice(0, 40)}{theme.greeting.length > 40 ? '...' : ''}
                            </div>
                            <div style={{ background: theme.bubble_user_color, borderRadius: '6px 6px 2px 6px', padding: '5px 7px', fontSize: 9, color: '#fff', alignSelf: 'flex-end', maxWidth: '75%' }}>
                                Hello! 👋
                            </div>
                            <div style={{ background: theme.bubble_ai_color, borderRadius: '6px 6px 6px 2px', padding: '5px 7px', fontSize: 9, color: theme.text_color, border: '1px solid #f3f4f6', maxWidth: '85%' }}>
                                Hi there! How can I help?
                            </div>
                        </div>
                        {/* input */}
                        <div style={{ padding: '5px 8px', background: '#fff', borderTop: '1px solid #f3f4f6' }}>
                            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px', fontSize: 9, color: '#9ca3af' }}>
                                Type a message...
                            </div>
                        </div>
                    </div>

                    {/* Launcher preview */}
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: theme.primary_color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(0,0,0,0.15)' }}>
                        <span style={{ fontSize: 16 }}>
                            {theme.launcher_icon === 'chat' ? '💬' : theme.launcher_icon === 'bot' ? '🤖' : '✨'}
                        </span>
                    </div>

                    <span className="text-[9px] text-gray-400 text-center leading-relaxed">
                        {theme.position === 'bottom-right' ? 'Bottom Right' : 'Bottom Left'}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
                <SecondaryBtn onClick={onClose} disabled={loading}>CANCEL</SecondaryBtn>
                <PrimaryBtn onClick={handleSave} loading={loading} loadingText="SAVING..." disabled={loading}>
                    SAVE THEME
                </PrimaryBtn>
            </div>
        </ModalShell>
    );
}