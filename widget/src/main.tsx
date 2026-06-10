import { createRoot } from 'react-dom/client';
import { AgentWidget } from './components/widget';

createRoot(document.getElementById('root')!).render(
	<AgentWidget agentId="your-agent-uuid" />,
);
