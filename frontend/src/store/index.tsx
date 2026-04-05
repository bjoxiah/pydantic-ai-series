import { create } from 'zustand'; // Use 'create' for hooks
import { persist, createJSONStorage } from 'zustand/middleware';
import { AgentMessage } from '@/model/message';
import { ExchangeRateSnapshot } from '@/model/snapshot';
import { ToolCall } from '@/model/tool';

type AppState = {
	threadId: string;
	messages: AgentMessage[];
	snapshot: ExchangeRateSnapshot | null;
	loading: boolean;
    activeTool: ToolCall | null,
};

type AppActions = {
	setThreadId: (threadId: string) => void;
	addMessage: (message: AgentMessage) => void;
	reset: () => void;
	addSnapshot: (snapshot: ExchangeRateSnapshot | null) => void;
	setLoading: (loading: boolean) => void;
    setActiveTool: (tool: ToolCall | null) => void,
};

const initialState: AppState = {
    threadId: '',
    messages: [],
    snapshot: null,
    loading: false,
    activeTool: null
};

// Use 'create' instead of 'createStore'
export const useAppStore = create<AppState & AppActions>()(
	persist(
		(set) => ({
			...initialState,
			setThreadId: (threadId) => set({ threadId }),
			addMessage: (message) =>
				set((state) => {
					const exists = state.messages.find(
						(m) => m.id === message.id,
					);
					if (exists) {
						return {
							messages: state.messages.map((m) =>
								m.id === message.id ? message : m,
							),
						};
					}
					return { messages: [...state.messages, message] };
				}),
			addSnapshot: (snapshot) => set({ snapshot }),
			setLoading: (loading) => set({ loading }),
			reset: () => set(initialState),
            setActiveTool: (tool: ToolCall | null) => set({ activeTool: tool }),
		}),
		{
			name: 'app-storage',
			storage: createJSONStorage(() => localStorage),
		},
	),
);
