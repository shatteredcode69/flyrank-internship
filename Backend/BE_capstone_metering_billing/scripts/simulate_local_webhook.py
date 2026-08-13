"""
Local Mock Webhook runner — the "stripe trigger" equivalent for Provider 2.

Usage:
    python scripts/simulate_local_webhook.py activate <tenant_id>
    python scripts/simulate_local_webhook.py cancel   <tenant_id>
    python scripts/simulate_local_webhook.py activate <tenant_id> --bad-signature   # for the 400 proof

Sends a correctly (or, with --bad-signature, incorrectly) HMAC-SHA256 signed
event to POST /api/v1/webhooks/local, exactly as the real adapter verifies it.
"""

import argparse
import os
import sys

import requests  # only used by this standalone demo script, not by the app itself

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.services.adapters.local_mock_adapter import LocalMockAdapter  # noqa: E402

EVENT_TYPES = {
    "activate": "subscription.activated",
    "cancel": "subscription.canceled",
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=EVENT_TYPES.keys())
    parser.add_argument("tenant_id")
    parser.add_argument("--base-url", default=os.getenv("APP_BASE_URL", "http://localhost:8000"))
    parser.add_argument("--bad-signature", action="store_true", help="corrupt the signature, for the 400 proof")
    parser.add_argument("--replay", action="store_true", help="send the exact same event twice, for the dedup proof")
    args = parser.parse_args()

    secret = os.environ["LOCAL_MOCK_WEBHOOK_SECRET"]
    raw_body, signature = LocalMockAdapter.build_signed_event(
        secret=secret, event_type=EVENT_TYPES[args.action], tenant_id=args.tenant_id
    )

    if args.bad_signature:
        signature = "sha256=" + "0" * 64

    url = f"{args.base_url}/api/v1/webhooks/local"
    headers = {"Content-Type": "application/json", "X-Local-Signature": signature}

    resp1 = requests.post(url, data=raw_body, headers=headers)
    print(f"POST {url} -> {resp1.status_code} {resp1.json()}")

    if args.replay:
        resp2 = requests.post(url, data=raw_body, headers=headers)
        print(f"REPLAY -> {resp2.status_code} {resp2.json()}")


if __name__ == "__main__":
    main()
