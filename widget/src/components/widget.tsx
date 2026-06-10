import { useState, useEffect } from 'react';
import {
	API_URL,
	DEFAULT_THEME,
	type AgentConfig,
	type AgentWidgetProps,
	type Conversation,
} from '../models';
import { ChatWindow } from './chat-window';
import { IdentityForm } from './indentity-form';
import { Launcher } from './launcher';

const STYLES = `
@keyframes widget-spin { to { transform: rotate(360deg); } }
@keyframes widget-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
@keyframes widget-slide-up { from { opacity: 0; transform: translateY(16px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
.agent-widget-window { animation: widget-slide-up 0.22s cubic-bezier(0.16, 1, 0.3, 1); }
`;

export const AgentWidget = ({ agentId }: Omit<AgentWidgetProps, 'apiUrl'>) => {
	const [open, setOpen] = useState(false);
	const [config, setConfig] = useState<AgentConfig | null>(null);
	const [conversation, setConversation] = useState<Conversation | null>(null);
	const [identityLoading, setIdentityLoading] = useState(false);
	const [loadingConfig, setLoadingConfig] = useState(true);

    const [hasOpened, setHasOpened] = useState(false);

    const handleOpen = () => {
        setOpen(o => {
            if (!o) setHasOpened(true);
            return !o;
        });
    };

	const theme = { ...DEFAULT_THEME, ...(config?.theme ?? {}) };
	const position =
		theme.position === 'bottom-left'
			? { bottom: 24, left: 24 }
			: { bottom: 24, right: 24 };

	useEffect(() => {
		fetch(`${API_URL}/agents/${agentId}/widget-config`)
			.then((r) => r.json())
			.then(setConfig)
			.catch(console.error)
			.finally(() => setLoadingConfig(false));
	}, [agentId]);

	const handleIdentitySubmit = async (name: string, email: string) => {
		setIdentityLoading(true);
		try {
			const res = await fetch(
				`${API_URL}/agents/${agentId}/conversations`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						user_name: name,
						user_email: email,
					}),
				},
			);
			setConversation(await res.json());
		} catch (e) {
			console.error(e);
		} finally {
			setIdentityLoading(false);
		}
	};

	if (loadingConfig) return null;

	const agentName = config?.name ?? theme.agent_label;

	return (
		<>
			<style>{STYLES}</style>
			<div style={{ position: 'fixed', zIndex: 999999, ...position }}>
					<div
						className="agent-widget-window"
						style={{
							width: 360,
							height: 540,
							borderRadius: 16,
							overflow: 'hidden',
							boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
							marginBottom: 12,
							display: 'flex',
							flexDirection: 'column',
							border: '1px solid rgba(0,0,0,0.08)',
							background: '#fff',
							opacity: open ? 1 : 0,
                            visibility: hasOpened ? 'visible' : 'hidden',
							pointerEvents: open ? 'auto' : 'none',
							transform: open
								? 'translateY(0) scale(1)'
								: 'translateY(16px) scale(0.96)',
							transition:
								'opacity 0.2s ease, transform 0.2s ease',
						}}
					>
						{!conversation ? (
							<IdentityForm
								theme={theme}
								agentName={agentName}
								onSubmit={handleIdentitySubmit}
								loading={identityLoading}
							/>
						) : (
							<ChatWindow
								theme={theme}
								agentName={agentName}
								conversation={conversation}
								apiUrl={API_URL}
								onClose={() => setOpen(false)}
							/>
						)}
					</div>
				<div
					style={{
						display: 'flex',
						justifyContent:
							theme.position === 'bottom-left'
								? 'flex-start'
								: 'flex-end',
					}}
				>
					<Launcher
						open={open}
						onClick={handleOpen}
						theme={theme}
					/>
				</div>
			</div>
		</>
	);
}
