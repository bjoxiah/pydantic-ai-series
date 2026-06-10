/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { API_URL, MODELS } from '@/models';
import { Field } from '../agent/util/Field';

interface Capability { id: string; name: string; description: string; requires_knowledge: boolean; }
interface AgentDialogProps { open: boolean; onOpenChange: (open: boolean) => void; onAgentCreated: (agent: any) => void; }


export const AgentDialog = ({ open, onOpenChange, onAgentCreated }: AgentDialogProps) => {
    const [agentName, setAgentName] = useState('');
    const [instructions, setInstructions] = useState('');
    const [model, setModel] = useState('google/gemini-2.5-flash');
    const [selectedCaps, setSelectedCaps] = useState<string[]>([]);
    const [capabilities, setCapabilities] = useState<Capability[]>([]);
    const [companyName, setCompanyName] = useState('');
    const [knowledgeUrl, setKnowledgeUrl] = useState('');
    const [knowledgeText, setKnowledgeText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);

    const requiresKnowledge = selectedCaps.includes('company_knowledge');
    const step1Valid = agentName.trim() && instructions.trim() && model;
    const step2Valid = !requiresKnowledge || knowledgeUrl.trim() || knowledgeText.trim();

    useEffect(() => {
        fetch(`${API_URL}/capabilities`).then(r => r.json()).then(setCapabilities).catch(() => {});
    }, []);

    const reset = () => {
        setAgentName(''); setInstructions(''); setModel('google/gemini-2.5-flash');
        setSelectedCaps([]); setCompanyName(''); setKnowledgeUrl('');
        setKnowledgeText(''); setError(''); setStep(1);
    };

    const handleClose = (o: boolean) => { if (!o) reset(); onOpenChange(o); };
    const toggleCap = (id: string) => setSelectedCaps(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

    const handleSubmit = async () => {
        setLoading(true); setError('');
        try {
            const res = await fetch(`${API_URL}/agents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: agentName, instructions, model_name: model,
                    capability_ids: selectedCaps,
                    company_name: companyName || agentName,
                    knowledge_url: knowledgeUrl || null,
                    knowledge_text: knowledgeText || null,
                }),
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d.detail ?? 'Failed'); }
            onAgentCreated(await res.json());
            handleClose(false);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-[12px] text-gray-800 font-mono outline-none placeholder:text-gray-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all";

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="bg-white border border-gray-200 rounded-xl p-0 overflow-hidden md:min-w-130! font-mono gap-0 shadow-xl">

                {/* Steps bar */}
                <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <div className={`flex items-center gap-1.5 text-[10px] tracking-wide transition-colors ${step === 1 ? 'text-violet-600' : step > 1 ? 'text-emerald-500' : 'text-gray-300'}`}>
                        <div className="w-4.5 h-4.5 rounded-full border border-current grid place-items-center text-[9px] font-bold">
                            {step > 1 ? '✓' : '1'}
                        </div>
                        CONFIGURE
                    </div>
                    <div className="flex-1 h-px bg-gray-200" />
                    <div className={`flex items-center gap-1.5 text-[10px] tracking-wide transition-colors ${step === 2 ? 'text-violet-600' : 'text-gray-300'}`}>
                        <div className="w-4.5 h-4.5 rounded-full border border-current grid place-items-center text-[9px] font-bold">2</div>
                        KNOWLEDGE
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 overflow-y-auto max-h-[60vh]">
                    <DialogHeader className="mb-5">
                        <DialogTitle className="text-[15px] font-bold text-gray-800">
                            {step === 1 ? 'Create Agent' : 'Add Knowledge'}
                        </DialogTitle>
                        <DialogDescription className="text-[11px] text-gray-400">
                            {step === 1 ? 'Name, instruct, and equip your agent with capabilities.' : 'Give your agent access to company-specific knowledge.'}
                        </DialogDescription>
                    </DialogHeader>

                    {step === 1 ? (
                        <div className="flex flex-col gap-4">
                            <Field label="Agent Name">
                                <input className={inputCls} placeholder="e.g. Support Assistant" value={agentName} onChange={e => setAgentName(e.target.value)} />
                            </Field>
                            <Field label="Instructions">
                                <textarea className={`${inputCls} resize-none min-h-22 leading-relaxed`} placeholder="You are an expert assistant that..." value={instructions} onChange={e => setInstructions(e.target.value)} />
                            </Field>
                            <Field label="Model">
                                <div className="grid grid-cols-2 gap-1.5">
                                    {MODELS.map(m => (
                                        <button key={m.id} onClick={() => setModel(m.id)}
                                            className={`flex items-center cursor-pointer justify-between px-3 py-2 rounded-md border text-left transition-all ${model === m.id ? 'border-violet-300 bg-violet-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                                            <span className={`text-[11px] ${model === m.id ? 'text-violet-700' : 'text-gray-500'}`}>{m.label}</span>
                                            {m.tag && <span className="text-[8px] px-1.5 py-px rounded bg-emerald-50 text-emerald-600 border border-emerald-200 tracking-wide">{m.tag}</span>}
                                        </button>
                                    ))}
                                </div>
                            </Field>
                            <Field label="Capabilities">
                                <div className="grid grid-cols-2 gap-1.5">
                                    {capabilities.map(cap => (
                                        <button key={cap.id} onClick={() => toggleCap(cap.id)}
                                            className={`text-left px-3 py-2.5 cursor-pointer rounded-md border transition-all ${selectedCaps.includes(cap.id) ? 'border-violet-300 bg-violet-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                                            <div className={`text-[11px] font-semibold mb-0.5 ${selectedCaps.includes(cap.id) ? 'text-violet-700' : 'text-gray-600'}`}>{cap.name}</div>
                                            <div className="text-[9px] text-gray-400 leading-snug">{cap.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </Field>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase text-violet-600 mb-4">
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                        <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
                                        <path d="M5 3v2.5l1.5 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                                    </svg>
                                    Company Knowledge
                                </div>
                                <div className="flex flex-col gap-3">
                                    <Field label="Company Name">
                                        <input className={inputCls} placeholder="Acme Inc." value={companyName} onChange={e => setCompanyName(e.target.value)} />
                                    </Field>
                                    <Field label="Website URL">
                                        <input className={inputCls} placeholder="https://yourcompany.com" value={knowledgeUrl} onChange={e => setKnowledgeUrl(e.target.value)} />
                                    </Field>
                                    <div className="flex items-center gap-2 my-1 text-[9px] text-gray-300 tracking-wider">
                                        <div className="flex-1 h-px bg-gray-200" />OR<div className="flex-1 h-px bg-gray-200" />
                                    </div>
                                    <Field label="Paste Knowledge">
                                        <textarea className={`${inputCls} resize-none min-h-22 leading-relaxed`} placeholder="FAQs, product info, policies..." value={knowledgeText} onChange={e => setKnowledgeText(e.target.value)} />
                                    </Field>
                                </div>
                            </div>
                            {!requiresKnowledge && <p className="text-[11px] text-gray-400 text-center">No knowledge-based capabilities selected. You can skip this step.</p>}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
                    <span className="text-[10px] text-red-500 max-w-65">{error}</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => step === 1 ? handleClose(false) : setStep(1)}
                            disabled={loading}
                            className="px-3.5 py-1.5 cursor-pointer text-[11px] tracking-wide text-gray-500 border border-gray-200 rounded-md hover:border-gray-300 hover:text-gray-700 transition-all disabled:opacity-40 bg-white"
                        >
                            {step === 1 ? 'CANCEL' : '← BACK'}
                        </button>
                        {step === 1 ? (
                            <button
                                disabled={!step1Valid}
                                onClick={() => requiresKnowledge ? setStep(2) : handleSubmit()}
                                className="flex items-center gap-1.5 px-4 py-1.5 cursor-pointer text-[11px] tracking-wide text-white bg-violet-600 rounded-md hover:bg-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-px shadow-sm"
                            >
                                {requiresKnowledge ? 'NEXT →' : 'CREATE'}
                            </button>
                        ) : (
                            <button
                                disabled={!step2Valid || loading}
                                onClick={handleSubmit}
                                className="flex items-center gap-1.5 px-4 py-1.5 text-[11px] tracking-wide text-white bg-violet-600 rounded-md hover:bg-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-px shadow-sm"
                            >
                                {loading ? <><span className="w-2.5 h-2.5 rounded-full border-[1.5px] border-white/40 border-t-white animate-spin" />CREATING...</> : 'CREATE AGENT'}
                            </button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};