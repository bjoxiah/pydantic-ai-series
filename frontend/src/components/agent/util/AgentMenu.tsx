'use client'
import { useEffect } from 'react';

interface AgentMenuProps {
    onEdit: () => void;
    onDelete: () => void;
    onTheme: () => void;
    onEmbed: () => void;
    onClose: () => void;
}

export const AgentMenu = ({ onEdit, onDelete, onTheme, onEmbed, onClose }: AgentMenuProps) => {
    useEffect(() => {
        const handler = () => onClose();
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [onClose]);

    return (
        <div className="absolute right-1 top-8 z-50 w-40 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <button onClick={() => { onEdit(); onClose(); }} className="w-full cursor-pointer flex items-center gap-2 px-3 py-2 text-[11px] text-gray-600 hover:bg-gray-50 transition-colors text-left">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M7.5 1.5l2 2-6 6H1.5v-2l6-6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Edit Agent
            </button>
            <div className="h-px bg-gray-100" />
            <button onClick={() => { onTheme(); onClose(); }} className="w-full cursor-pointer flex items-center gap-2 px-3 py-2 text-[11px] text-gray-600 hover:bg-gray-50 transition-colors text-left">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2"/>
                    <circle cx="5.5" cy="5.5" r="1.5" fill="currentColor"/>
                </svg>
                Widget Theme
            </button>
            <div className="h-px bg-gray-100" />
            <button onClick={() => { onEmbed(); onClose(); }} className="w-full cursor-pointer flex items-center gap-2 px-3 py-2 text-[11px] text-violet-600 hover:bg-violet-50 transition-colors text-left">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M3.5 3L1 5.5l2.5 2.5M7.5 3L10 5.5 7.5 8M6 1.5l-1 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Embed Widget
            </button>
            <div className="h-px bg-gray-100" />
            <button onClick={() => { onDelete(); onClose(); }} className="w-full cursor-pointer flex items-center gap-2 px-3 py-2 text-[11px] text-red-500 hover:bg-red-50 transition-colors text-left">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M1.5 3h8M4 3V2h3v1M4.5 5v3M6.5 5v3M2.5 3l.5 6h5l.5-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Delete Agent
            </button>
        </div>
    );
}

