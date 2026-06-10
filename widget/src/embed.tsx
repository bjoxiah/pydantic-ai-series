import { createRoot } from 'react-dom/client';
import { AgentWidget } from './components/widget';

const init = (agentId: string) => {
    const container = document.createElement('div');
    container.id = 'agent-widget-root';
    document.body.appendChild(container);
    createRoot(container).render(
        <AgentWidget agentId={agentId} />
    );
}

const script = document.currentScript as HTMLScriptElement | null;
if (script) {
    const agentId = script.getAttribute('data-agent-id');
    if (agentId) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => init(agentId));
        } else {
            init(agentId);
        }
    }
}

export { init };