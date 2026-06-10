'use client';

import { useState } from 'react';
import { Field } from './Field';
import { PrimaryBtn } from './PrimaryBtn';
import { SecondaryBtn } from './SecondaryBtn';
import { ModalShell } from './ModalShell';
import { ModalHeader } from './ModalHeader';

interface NewConvoModalProps {
    agentName: string;
    onConfirm: (name: string, email: string) => void;
    onClose: () => void;
    loading: boolean;
}

export const NewConvoModal = ({ agentName, onConfirm, onClose, loading }: NewConvoModalProps) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

    const validate = () => {
        const e: typeof errors = {};
        if (!name.trim()) e.name = 'Name is required';
        if (!email.trim()) e.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = () => { if (validate()) onConfirm(name.trim(), email.trim()); };

    return (
        <ModalShell onClose={onClose} width="400px">
            <ModalHeader title="Start Conversation" subtitle={`Chatting with ${agentName}`} onClose={onClose} />
            <div className="px-5 py-5 flex flex-col gap-4">
                <Field label="Your Name" error={errors.name}>
                    <input
                        autoFocus placeholder="Jane Smith" value={name}
                        onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })); }}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        className={`w-full bg-gray-50 border rounded-md px-3 py-2 text-[12px] text-gray-800 outline-none font-mono placeholder:text-gray-300 transition-all ${errors.name ? 'border-red-300' : 'border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100'}`}
                    />
                </Field>
                <Field label="Email Address" error={errors.email}>
                    <input
                        type="email" placeholder="jane@company.com" value={email}
                        onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        className={`w-full bg-gray-50 border rounded-md px-3 py-2 text-[12px] text-gray-800 outline-none font-mono placeholder:text-gray-300 transition-all ${errors.email ? 'border-red-300' : 'border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100'}`}
                    />
                </Field>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
                <SecondaryBtn onClick={onClose} disabled={loading}>CANCEL</SecondaryBtn>
                <PrimaryBtn onClick={handleSubmit} disabled={loading || !name.trim() || !email.trim()} loading={loading} loadingText="STARTING...">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M4.5 1v7M1 4.5h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    START CHAT
                </PrimaryBtn>
            </div>
        </ModalShell>
    );
}
