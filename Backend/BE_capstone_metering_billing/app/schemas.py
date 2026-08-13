from pydantic import BaseModel, Field


class TokenUsageIn(BaseModel):
    standard_input_tokens: int = Field(0, ge=0)
    cached_input_tokens: int = Field(0, ge=0)
    output_tokens: int = Field(0, ge=0)
    reasoning_tokens: int = Field(0, ge=0)


class RecordUsageRequest(BaseModel):
    tenant_id: str
    usage_type: str = Field(pattern="^(api_call|ai_tokens)$")
    api_call_qty: int = Field(0, ge=0)
    tokens: TokenUsageIn = TokenUsageIn()


class UsageRollupResponse(BaseModel):
    tenant_id: str
    plan_id: str
    api_calls_used: int
    api_calls_limit: int
    tokens_used: int
    tokens_limit: int
    cost_micro_cents: int
    cost_display: str
