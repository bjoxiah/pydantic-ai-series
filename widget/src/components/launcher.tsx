import { BotMessageSquare, MessageCircleMoreIcon, Sparkles, X } from "lucide-react";
import type { AgentTheme } from "../models";


interface LauncherProps {
    open: boolean;
    onClick: () => void;
    theme: AgentTheme;
    unread?: number;
}

const ChatIcon = () => {
    return (
        <MessageCircleMoreIcon />
    );
}

const BotIcon = () => {
    return (
        <BotMessageSquare />
    );
}

const SparkleIcon = () => {
    return (
        <Sparkles />
    );
}

const CloseIcon = () => {
    return (
        <X />
    );
}

export const Launcher = ({ open, onClick, theme, unread = 0 }: LauncherProps) => {
    const icons = { chat: ChatIcon, bot: BotIcon, sparkle: SparkleIcon };
    const Icon = icons[theme.launcher_icon];

    return (
        <button
            onClick={onClick}
            style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: theme.primary_color,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                position: 'relative',
                outline: 'none',
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.22)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
            }}
            aria-label={open ? 'Close chat' : 'Open chat'}
        >
            <span style={{ display: 'flex', transition: 'opacity 0.15s, transform 0.15s', opacity: open ? 0 : 1, transform: open ? 'rotate(90deg) scale(0.7)' : 'rotate(0) scale(1)', position: 'absolute' }}>
                <Icon />
            </span>
            <span style={{ display: 'flex', transition: 'opacity 0.15s, transform 0.15s', opacity: open ? 1 : 0, transform: open ? 'rotate(0) scale(1)' : 'rotate(-90deg) scale(0.7)', position: 'absolute' }}>
                <CloseIcon />
            </span>
            {unread > 0 && !open && (
                <span style={{
                    position: 'absolute', top: 0, right: 0,
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#ef4444', color: '#fff',
                    fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #fff',
                }}>
                    {unread}
                </span>
            )}
        </button>
    );
}