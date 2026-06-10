from fastapi import APIRouter

router = APIRouter(tags=["capabilities"])


@router.get("/capabilities")
def list_capabilities():
    return [
        {
            "id": "company_knowledge",
            "name": "Company Knowledge",
            "description": "Answer questions from your company docs or website",
            "requires_knowledge": True,
        }
    ]