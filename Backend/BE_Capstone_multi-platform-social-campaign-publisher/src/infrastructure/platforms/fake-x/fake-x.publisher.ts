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

/** Adapter for the fake X platform — see FakeInstagramPublisher for the pattern. */
export class FakeXPublisher implements SocialPublisher {
  readonly platform = 'X' as const;

  async publish(input: PublishInput): Promise<PublishResult> {
    const imageBase64 = (await readFile(input.imagePath)).toString('base64');

    const response = await callFakePlatform<Record<string, unknown>, FakePlatformPublishResponse>(
      '/x/publish',
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
      '/x/status',
      { externalPostId: input.externalPostId },
      { authorization: `Bearer ${input.accessToken}` },
    );
    return { externalPostId: input.externalPostId, status: response.status };
  }
}
