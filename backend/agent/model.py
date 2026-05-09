from pydantic import BaseModel, Field

class ConfirmedPage(BaseModel):
    name: str 
    description: str
    
class GeneratedPage(BaseModel):
    name: str 
    description: str
    html: str

class SharedState(BaseModel):
    project_name: str = ""
    confirmed_pages: list[ConfirmedPage] = Field(default_factory=list)
    generated_pages: list[GeneratedPage] = Field(default_factory=list)