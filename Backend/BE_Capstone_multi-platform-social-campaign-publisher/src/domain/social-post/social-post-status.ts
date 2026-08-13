export type SocialPostStatus = 'QUEUED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED';

/**
 * The only legal state transitions for a SocialPost. Enforced centrally so
 * neither the publish use-case nor the webhook handler can "sneak" an
 * invalid transition through — e.g. a webhook can never move a post to
 * PUBLISHED unless it is currently PUBLISHING.
 */
const ALLOWED_TRANSITIONS: Record<SocialPostStatus, SocialPostStatus[]> = {
  QUEUED: ['PUBLISHING'],
  PUBLISHING: ['PUBLISHED', 'FAILED'],
  PUBLISHED: [],
  FAILED: ['PUBLISHING'], // manual/automatic re-attempt re-enters the flow
};

export function isValidTransition(from: SocialPostStatus, to: SocialPostStatus): boolean {
  if (from === to) return false;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertValidTransition(from: SocialPostStatus, to: SocialPostStatus): void {
  if (!isValidTransition(from, to)) {
    throw new Error(`Invalid SocialPost state transition: ${from} -> ${to}`);
  }
}
