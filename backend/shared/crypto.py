from cryptography.fernet import Fernet
from settings import settings


def _fernet() -> Fernet:
    return Fernet(settings.encryption_key.encode())


def encrypt(value: str) -> str:
    """Encrypt a plaintext string. Returns a URL-safe base64 token."""
    if not value:
        return value
    return _fernet().encrypt(value.encode()).decode()


def decrypt(token: str) -> str:
    """Decrypt a Fernet token back to plaintext."""
    if not token:
        return token
    return _fernet().decrypt(token.encode()).decode()
