import { ReactFlowProvider } from '@xyflow/react';
import { CanvasComponent } from './canvas';
import { useAgent } from '@copilotkit/react-core/v2';

export const PreviewComponent = () => {
	const { agent } = useAgent();
	return (
		<ReactFlowProvider>
			{agent.state && agent.state?.generated_pages?.length > 0 ? (
				<CanvasComponent pages={agent.state.generated_pages} />
			) : (
				<div className="w-full h-full flex items-center justify-center">
					<p>No Generated Pages Yet!</p>
				</div>
			)}
		</ReactFlowProvider>
	);
};
