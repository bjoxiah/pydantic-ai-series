'use client';

import { ModalShell } from './ModalShell';
import { SecondaryBtn } from './SecondaryBtn';
import { PrimaryBtn } from './PrimaryBtn';

interface ConfirmDeleteProps {
    agentName: string;
    onConfirm: () => void;
    onClose: () => void;
    loading: boolean;
}

export const ConfirmDeleteModal = ({ agentName, onConfirm, onClose, loading }: ConfirmDeleteProps) => {
    return (
        <ModalShell onClose={onClose} width="360px">
            <div className="px-5 pt-5 pb-4">
                <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 grid place-items-center mb-4">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 5v4M8 11h.01M2 8a6 6 0 1 0 12 0A6 6 0 0 0 2 8z" stroke="#ef4444" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                </div>
                <h2 className="font-semibold text-gray-800 text-sm mb-1">Delete {agentName}?</h2>
                <p className="text-[11px] text-gray-400 leading-relaxed">This will permanently delete the agent and all its conversations. This action cannot be undone.</p>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
                <SecondaryBtn onClick={onClose} disabled={loading}>CANCEL</SecondaryBtn>
                <PrimaryBtn onClick={onConfirm} disabled={loading} loading={loading} loadingText="DELETING..." danger>
                    DELETE AGENT
                </PrimaryBtn>
            </div>
        </ModalShell>
    );
}