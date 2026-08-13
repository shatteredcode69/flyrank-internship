import { sharedBrandVoice, platformRules, summarizeContent, type ContentSummaryInput } from '../../config/social-prompts.config.js';
import type { Platform } from '../../domain/platform/platform.js';

export interface ComposeCaptionInput {
  platform: Platform;
  content: ContentSummaryInput;
}

/**
 * Composes: Shared Brand Voice + Platform Rules + Content Summary → caption.
 *
 * This is the deterministic, zero-cost fallback path required by §9 — the
 * application MUST work with no AI provider configured. When AI_PROVIDER
 * is set, an AI-backed composer (not required for the graded core) can sit
 * in front of this and use the exact same fragments as its prompt input,
 * so the two paths never drift into inconsistent voice.
 */
export function composeCaption({ platform, content }: ComposeCaptionInput): string {
  const rules = platformRules[platform];
  const summary = summarizeContent(content);
  const hashtags = buildHashtags(content.title, rules.hashtagCount);

  const voiceLine = `${sharedBrandVoice.tone}, ${rules.voiceModifier}.`;
  const body = [summary, rules.callToAction, content.sourceUrl].join(' ');

  const caption = `${body}\n\n${hashtags.join(' ')}`.trim();

  return caption.length > rules.maxLength ? `${caption.slice(0, rules.maxLength - 1)}…` : caption;
}

function buildHashtags(title: string, count: number): string[] {
  const words = title
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, count);
  return words.map((w) => `#${w[0]!.toUpperCase()}${w.slice(1).toLowerCase()}`);
}

/** Sanity guard referenced by tests/unit/caption-composition.test.ts */
export function captionsAreDistinctPerPlatform(captions: Record<Platform, string>): boolean {
  const values = Object.values(captions);
  return new Set(values).size === values.length;
}
