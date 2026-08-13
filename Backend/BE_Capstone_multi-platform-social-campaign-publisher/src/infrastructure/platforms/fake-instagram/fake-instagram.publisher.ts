import { readFile } from 'node:fs/promises';
import type {
  SocialPublisher,
  PublishInput,
  PublishResult,
  StatusInput,
  PublishStatus,
} from '../social-publisher.port.js';
import { callFakePlatform } from '../fake-platform-http-client.js';
import type { FakePlatformPublishResponse } from '../fake-platform-http-client.js';

/**
 * Adapter for the fake Instagram platform. All Instagram-specific concerns
 * (auth header shape, request path) live here and ONLY here — the
 * application layer only ever calls the SocialPublisher interface.
 */
export class FakeInstagramPublisher implements SocialPublisher {
  readonly platform = 'INSTAGRAM' as const;

  async publish(input: PublishInput): Promise<PublishResult> {
    const imageBase64 = (await readFile(input.imagePath)).toString('base64');

    const response = await callFakePlatform<Record<string, unknown>, FakePlatformPublishResponse>(
      '/instagram/publish',
      {
        externalAccountId: input.externalAccountId,
        idempotencyKey: input.idempotencyKey,
        caption: input.caption,
        imageBase64,
      },
      { authorization: `Bearer ${input.accessToken}` },
    );

    return { externalPostId: response.externalPostId, wasDeduplicated: response.deduplicated };
  }

  async getStatus(input: StatusInput): Promise<PublishStatus> {
    const response = await callFakePlatform<Record<string, unknown>, { status: PublishStatus['status'] }>(
      '/instagram/status',
      { externalPostId: input.externalPostId },
      { authorization: `Bearer ${input.accessToken}` },
    );
    return { externalPostId: input.externalPostId, status: response.status };
  }
}
