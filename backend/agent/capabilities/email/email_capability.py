from dataclasses import dataclass
from pydantic_ai import FunctionToolset
from pydantic_ai.capabilities import AbstractCapability
import resend
from settings import settings

def get_tools():
    toolset = FunctionToolset()
    
    @toolset.tool_plain
    def send_email(
        to: str,
        subject: str,
        body: str
    ):
        resend.api_key = settings.resend_api_key
        params: resend.Emails.SendParams = {
          "from": "Research Email <no-reply@email.any>",
          "to": [to],
          "subject": subject,
          "html": body
        }

        email = resend.Emails.send(params)
        return f"Email sent to {to}: {email.id}"
    
    return toolset

@dataclass
class EmailCapability(AbstractCapability):
    def get_instructions(self):
        return "You can send emails using the send email tool"
    
    def get_toolset(self):
        return get_tools()