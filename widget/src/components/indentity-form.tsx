import { useState } from 'react';
import type { AgentTheme } from '../models';

interface IdentityFormProps {
    theme: AgentTheme;
    agentName: string;
    onSubmit: (name: string, email: string) => void;
    loading: boolean;
}

export const IdentityForm = ({ theme, agentName, onSubmit, loading }: IdentityFormProps) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

    const validate = () => {
        const e: typeof errors = {};
        if (!name.trim()) e.name = 'Name is required';
        if (!email.trim()) e.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email address';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = () => { if (validate()) onSubmit(name.trim(), email.trim()); };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '10px 12px',
        borderRadius: 8,
        border: '1.5px solid #e5e7eb',
        fontSize: 13,
        fontFamily: 'system-ui, sans-serif',
        color: theme.text_color,
        background: '#f9fafb',
        outline: 'none',
        transition: 'border-color 0.15s',
        boxSizing: 'border-box',
    };

    return (
        <div style={{ padding: '24px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
            {/* Greeting */}
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: theme.primary_color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px',
                    color: '#fff', fontSize: 16, fontWeight: 700,
                    fontFamily: 'system-ui, sans-serif',
                }}>
                    {agentName.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: theme.text_color, fontFamily: 'system-ui, sans-serif', marginBottom: 4 }}>
                    {agentName}
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'system-ui, sans-serif', lineHeight: 1.5 }}>
                    {theme.greeting}
                </div>
            </div>

            {/* Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', letterSpacing: '0.05em', display: 'block', marginBottom: 5, fontFamily: 'system-ui, sans-serif', textTransform: 'uppercase' }}>
                        Your Name
                    </label>
                    <input
                        autoFocus
                        style={{ ...inputStyle, borderColor: errors.name ? '#fca5a5' : '#e5e7eb' }}
                        placeholder="Jane Smith"
                        value={name}
                        onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })); }}
                        onFocus={e => (e.target.style.borderColor = theme.primary_color)}
                        onBlur={e => (e.target.style.borderColor = errors.name ? '#fca5a5' : '#e5e7eb')}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    />
                    {errors.name && <span style={{ fontSize: 11, color: '#ef4444', marginTop: 3, display: 'block', fontFamily: 'system-ui, sans-serif' }}>{errors.name}</span>}
                </div>

                <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', letterSpacing: '0.05em', display: 'block', marginBottom: 5, fontFamily: 'system-ui, sans-serif', textTransform: 'uppercase' }}>
                        Email Address
                    </label>
                    <input
                        type="email"
                        style={{ ...inputStyle, borderColor: errors.email ? '#fca5a5' : '#e5e7eb' }}
                        placeholder="jane@company.com"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
                        onFocus={e => (e.target.style.borderColor = theme.primary_color)}
                        onBlur={e => (e.target.style.borderColor = errors.email ? '#fca5a5' : '#e5e7eb')}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    />
                    {errors.email && <span style={{ fontSize: 11, color: '#ef4444', marginTop: 3, display: 'block', fontFamily: 'system-ui, sans-serif' }}>{errors.email}</span>}
                </div>
            </div>

            {/* Submit */}
            <button
                onClick={handleSubmit}
                disabled={loading || !name.trim() || !email.trim()}
                style={{
                    width: '100%',
                    padding: '11px',
                    borderRadius: 8,
                    border: 'none',
                    background: loading || !name.trim() || !email.trim() ? '#d1d5db' : theme.primary_color,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: 'system-ui, sans-serif',
                    cursor: loading || !name.trim() || !email.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'background 0.15s',
                    marginTop: 4,
                }}
            >
                {loading ? (
                    <>
                        <span style={{
                            width: 14, height: 14, borderRadius: '50%',
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: '#fff',
                            animation: 'widget-spin 0.7s linear infinite',
                            display: 'inline-block',
                        }} />
                        Starting...
                    </>
                ) : 'Start Chatting →'}
            </button>
        </div>
    );
}