import type { Platform } from '../domain/platform/platform.js';

/**
 * Prompt fragments as DATA, composed at request time — modeled on the
 * FlyRank reference `config/social-prompts.config.ts` cited in the brief
 * (not present in this workspace to inspect, so reconstructed from spec;
 * see README → Engineering Decisions).
 *
 * There is exactly ONE shared voice block and ONE small rules block per
 * platform — never a full duplicated prompt per platform.
 */
export const sharedBrandVoice = {
  tone: 'confident, concise, genuinely useful — never hypey or clickbait',
  perspective: 'first-person plural ("we")',
  bannedPhrases: ['game-changer', 'unlock', 'in today\'s fast-paced world'],
};

export interface PlatformRules {
  platform: Platform;
  maxLength: number;
  hashtagCount: number;
  callToAction: string;
  voiceModifier: string;
}

export const platformRules: Record<Platform, PlatformRules> = {
  INSTAGRAM: {
    platform: 'INSTAGRAM',
    maxLength: 2200,
    hashtagCount: 5,
    callToAction: 'Link in bio.',
    voiceModifier: 'warmer, a little more visual/story-driven',
  },
  X: {
    platform: 'X',
    maxLength: 280,
    hashtagCount: 2,
    callToAction: 'Read more:',
    voiceModifier: 'punchier, one clear idea, no fluff',
  },
};

export interface ContentSummaryInput {
  title: string;
  body: string;
  sourceUrl: string;
}

/** Deterministic, non-AI content summary — the local fallback described in §9. */
export function summarizeContent(input: ContentSummaryInput): string {
  const firstSentence = input.body.split(/(?<=[.!?])\s+/)[0] ?? input.body;
  const trimmed = firstSentence.length > 180 ? `${firstSentence.slice(0, 177)}...` : firstSentence;
  return `${input.title} — ${trimmed}`;
}
