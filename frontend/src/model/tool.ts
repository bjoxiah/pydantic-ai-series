
export type ToolCall = {
  toolCallId: string
  toolName: string
  args: Record<string, any>
  status: 'pending' | 'executing' | 'complete',
}
