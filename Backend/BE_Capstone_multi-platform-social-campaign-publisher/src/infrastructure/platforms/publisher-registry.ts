import type { Platform } from '../../domain/platform/platform.js';
import type { SocialPublisher } from './social-publisher.port.js';
import { FakeInstagramPublisher } from './fake-instagram/fake-instagram.publisher.js';
import { FakeXPublisher } from './fake-x/fake-x.publisher.js';

/**
 * The only place in the app that knows the concrete adapter classes.
 * Everything downstream (use cases, worker) resolves a SocialPublisher by
 * platform through this registry — never by importing an adapter directly.
 */
const registry: Record<Platform, SocialPublisher> = {
  INSTAGRAM: new FakeInstagramPublisher(),
  X: new FakeXPublisher(),
};

export function getPublisherFor(platform: Platform): SocialPublisher {
  const publisher = registry[platform];
  if (!publisher) {
    throw new Error(`No SocialPublisher registered for platform ${platform}`);
  }
  return publisher;
}
