'use client';

import { CopilotKit } from '@copilotkit/react-core';
import "@copilotkit/react-ui/v2/styles.css";
import {
	ResizablePanelGroup,
	ResizablePanel,
	ResizableHandle,
} from '../ui/resizable';
import { ChatComponent } from '../chat';
import { PreviewComponent } from '../preview';
import { ConfirmPageTool } from '../tools/confirm_pages';

export const MainComponent = () => {
	return (
		<CopilotKit runtimeUrl="/api/copilotkit" enableInspector={true}>
			<ResizablePanelGroup orientation="horizontal" className='h-screen!'>
				<ResizablePanel defaultSize={'25%'} className='p-2'>
                    <ChatComponent />
                </ResizablePanel>
				<ResizableHandle />
				<ResizablePanel>
                   <PreviewComponent />
                </ResizablePanel>
			</ResizablePanelGroup>
            <ConfirmPageTool />
		</CopilotKit>
	);
};
