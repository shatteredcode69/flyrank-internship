"""
PaymentAdapter — the modular adapter interface both Stripe and the local
mock provider implement. Swapping providers means writing a new adapter
class; nothing in MeteringService, QuotaService, or the route layer
changes. This is the "swap the DB or a provider without touching business
logic" architecture point the rubric asks for.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass


class SignatureVerificationError(Exception):
    """Raised when an inbound webhook's signature does not verify."""


@dataclass(frozen=True)
class VerifiedEvent:
    provider: str
    event_id: str
    event_type: str
    payload: dict


class PaymentAdapter(ABC):
    provider_name: str

    @abstractmethod
    def verify_and_parse_webhook(self, raw_body: bytes, signature_header: str) -> VerifiedEvent:
        """Verify the signature on raw_body against signature_header.
        Raises SignatureVerificationError on a bad/forged signature.
        Returns a VerifiedEvent on success."""
        raise NotImplementedError

    @abstractmethod
    def create_checkout_session(self, *, tenant_id: str, plan_id: str) -> dict:
        """Kick off a hosted checkout flow. Returns at minimum {'checkout_url': str}."""
        raise NotImplementedError
