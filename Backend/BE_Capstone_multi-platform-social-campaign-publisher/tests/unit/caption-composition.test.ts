import { describe, it, expect } from 'vitest';
import { composeCaption, captionsAreDistinctPerPlatform } from '../../src/application/campaigns/compose-caption.js';

const content = {
  title: 'How We Cut Cold-Start Latency by 80%',
  body: 'We rebuilt our request-routing layer around a warm-pool strategy and cut p99 cold-start latency by 80%.',
  sourceUrl: 'https://blog.example.com/cold-start-latency',
};

describe('composeCaption', () => {
  it('produces different captions for Instagram and X from the same content', () => {
    const ig = composeCaption({ platform: 'INSTAGRAM', content });
    const x = composeCaption({ platform: 'X', content });
    expect(ig).not.toBe(x);
    expect(captionsAreDistinctPerPlatform({ INSTAGRAM: ig, X: x })).toBe(true);
  });

  it('respects the X platform max length', () => {
    const longContent = { ...content, body: 'A'.repeat(5000) };
    const x = composeCaption({ platform: 'X', content: longContent });
    expect(x.length).toBeLessThanOrEqual(280);
  });

  it('includes the source URL so captions stay grounded in the source post', () => {
    const ig = composeCaption({ platform: 'INSTAGRAM', content });
    expect(ig).toContain(content.sourceUrl);
  });
});
