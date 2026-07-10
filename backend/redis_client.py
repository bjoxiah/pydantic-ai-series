import ssl
import certifi
from redis.asyncio import Redis
from settings import settings

# SSL kwargs are only valid for rediss:// (TLS) URLs.
# Passing them to a plain redis:// connection raises TypeError.
_ssl_kwargs: dict = (
    {
        "ssl_cert_reqs": ssl.CERT_REQUIRED,
        "ssl_ca_certs": certifi.where(),
    }
    if settings.redis_url.startswith("rediss://")
    else {}
)

redis_client = Redis.from_url(
    settings.redis_url,
    decode_responses=True,
    socket_timeout=None,        # no timeout — pub/sub needs to wait indefinitely
    socket_connect_timeout=10,  # but the initial connection itself can still timeout
    **_ssl_kwargs,
)
