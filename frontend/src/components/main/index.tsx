'use client';

import { AgentSubscriber, HttpAgent, Message, randomUUID } from '@ag-ui/client';
import { ChatComponent } from './chat';
import { PreviewComponent } from './preview';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import { useAppStore } from '@/store';
import { AgentMessage } from '@/model/message';
import { CONFIRM_CURRENCY_TOOL } from '../tools/currency';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/components/ui/resizable';

export const MainComponent = () => {
	const params = useParams();
	const { addMessage, setLoading, reset } = useAppStore();

	const handleInitAgent = (threadId: string) => {
		return new HttpAgent({
			url: 'http://localhost:8000',
			threadId,
		});
	};

	const handleSendMessage = async (
		messages: Message[],
		assistantId: string,
	) => {
		const subscriber = getSubscription(assistantId);
		const agent = handleInitAgent(params.id?.toString() || randomUUID());
		agent.messages = messages;
		await agent.runAgent(
			{
				runId: randomUUID(),
				tools: [CONFIRM_CURRENCY_TOOL],
				context: [],
			},
			subscriber,
		);
	};

	const getSubscription = (assistantId: string): AgentSubscriber => {
		const pendingArgs: Record<string, string> = {};
		const pendingNames: Record<string, string> = {};

		return {
			onRunStartedEvent: () => setLoading(true),

			onTextMessageContentEvent: ({ event }) => {
				const delta = event.delta ?? '';
				if (!delta) return;

				const messageList = useAppStore.getState().messages;
				const existing = messageList.find((m) => m.id === assistantId);

				if (existing) {
					addMessage({
						...existing,
						content: existing.content + delta,
					} as AgentMessage);
				} else {
					addMessage({
						id: assistantId,
						role: 'assistant',
						content: delta,
					} as AgentMessage);
				}
			},

			onToolCallStartEvent: ({ event }) => {
				pendingArgs[event.toolCallId] = '';
				pendingNames[event.toolCallId] = event.toolCallName; // ← store name here

				if (event.toolCallName === 'confirm_currency') {
					useAppStore.getState().setActiveTool({
						toolCallId: event.toolCallId,
						toolName: event.toolCallName,
						args: {},
						status: 'executing',
					});
				}
			},

			onToolCallArgsEvent: ({ event }) => {
				pendingArgs[event.toolCallId] =
					(pendingArgs[event.toolCallId] ?? '') + (event.delta ?? '');
			},

			onToolCallEndEvent: ({ event }) => {
				const raw = pendingArgs[event.toolCallId] ?? '{}';
				const name = pendingNames[event.toolCallId]; // ← read from our map

				let args: Record<string, any> = {};
				try {
					args = JSON.parse(raw);
				} catch (e) {
					console.error('Failed to parse tool args:', raw);
				}

				if (name === 'confirm_currency') {
					useAppStore.getState().setActiveTool({
						toolCallId: event.toolCallId,
						toolName: name,
						args,
						status: 'executing',
					});
				}

				const messages = useAppStore.getState().messages;
				const assistantMsg = messages.find((m) => m.id === assistantId);
				if (assistantMsg) {
					addMessage({
						...assistantMsg,
						toolCalls: [
							...(assistantMsg.toolCalls ?? []),
							{
								id: event.toolCallId,
								type: 'function',
								function: {
									name,
									arguments: raw,
								},
							},
						],
					} as AgentMessage);
				}
			},

			onRunFailed: ({ error }) => {
				console.error('Agent run failed:', error);
				setLoading(false);
				useAppStore.getState().addSnapshot(null);
			},

			onStateSnapshotEvent(params) {
				console.log('State snapshot:', params);
				useAppStore.getState().addSnapshot(params.event.snapshot)
			},

			onRunFinishedEvent: () => setLoading(false),
		};
	};

	useEffect(() => {
		reset();
	}, []);

	return (
    <ResizablePanelGroup
        orientation="horizontal"
        className="h-screen w-full overflow-hidden fixed"
    >
        <ResizablePanel
            defaultSize={'25%'}              // ← number not string
            className="min-h-0 overflow-hidden"  // ← min-h-0 + overflow-hidden
        >
            <ChatComponent onSendMessage={handleSendMessage} />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel className="min-h-0 overflow-hidden">  {/* ← same here */}
            <PreviewComponent />
        </ResizablePanel>
    </ResizablePanelGroup>
);
};
