import { CopilotChat } from "@copilotkit/react-core/v2"

export const ChatComponent = () => {
    return (
        <CopilotChat 
            welcomeScreen={false}
            className="p-2"
        />
    )
}