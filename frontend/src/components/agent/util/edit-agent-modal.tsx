/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Agent, API_URL, MODELS } from '@/models';
import { ModalHeader } from './ModalHeader';
import { ModalShell } from './ModalShell';
import { SecondaryBtn } from './SecondaryBtn';
import { PrimaryBtn } from './PrimaryBtn';
import { Field } from './Field';

interface EditAgentModalProps {
    agent: Agent;
    capabilities: { id: string; name: string; description: string }[];
    onSave: (updated: Agent) => void;
    onClose: () => void;
}

export const EditAgentModal = ({ agent, onSave, onClose }: EditAgentModalProps) => {
    const [name, setName] = useState(agent.name);
    const [instructions, setInstructions] = useState(agent.instructions);
    const [modelName, setModelName] = useState(agent.model_name);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!name.trim() || !instructions.trim()) return;
        setLoading(true); setError('');
        try {
            const res = await fetch(`${API_URL}/agents/${agent.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name.trim(), instructions: instructions.trim(), model_name: modelName }),
            });
            if (!res.ok) throw new Error('Failed to update agent');
            onSave(await res.json());
            onClose();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalShell onClose={onClose} width="520px">
            <ModalHeader title="Edit Agent" subtitle="Update name, instructions and model" onClose={onClose} />
            <div className="px-5 py-5 flex flex-col gap-4 max-h-[65vh] overflow-y-auto">
                <Field label="Agent Name">
                    <input
                        autoFocus value={name} onChange={e => setName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-[12px] text-gray-800 outline-none font-mono placeholder:text-gray-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                    />
                </Field>
                <Field label="Instructions">
                    <textarea
                        value={instructions} onChange={e => setInstructions(e.target.value)} rows={5}
                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-[12px] text-gray-800 outline-none font-mono placeholder:text-gray-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none leading-relaxed"
                    />
                </Field>
                <Field label="Model">
                    <div className="grid grid-cols-2 gap-1.5">
                        {MODELS.map(m => (
                            <button
                                key={m.id} onClick={() => setModelName(m.id)}
                                className={`flex items-center justify-between cursor-pointer px-3 py-2 rounded-md border text-left transition-all ${modelName === m.id ? 'border-violet-300 bg-violet-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                            >
                                <span className={`text-[11px] ${modelName === m.id ? 'text-violet-700' : 'text-gray-500'}`}>{m.label}</span>
                                {m.tag && <span className="text-[8px] px-1.5 py-px rounded bg-emerald-50 text-emerald-600 border border-emerald-200 tracking-wide">{m.tag}</span>}
                            </button>
                        ))}
                    </div>
                </Field>
                {error && <p className="text-[10px] text-red-500">{error}</p>}
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
                <SecondaryBtn onClick={onClose} disabled={loading}>CANCEL</SecondaryBtn>
                <PrimaryBtn onClick={handleSave} disabled={loading || !name.trim() || !instructions.trim()} loading={loading} loadingText="SAVING...">
                    SAVE CHANGES
                </PrimaryBtn>
            </div>
        </ModalShell>
    );
}