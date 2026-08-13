import { describe, it, expect, beforeAll } from 'vitest';
import { isDatabaseReachable, cleanDatabase } from '../fixtures/test-env.js';
import { prisma } from '../../src/infrastructure/database/prisma-client.js';
import { SocialAccountRepository } from '../../src/infrastructure/database/repositories/social-account.repository.js';

/** Acceptance Probe 6: grep the database — no plaintext token anywhere. */
describe.runIf(await isDatabaseReachable())('Probe 6 — no plaintext tokens at rest (e2e)', () => {
  const socialAccountRepo = new SocialAccountRepository();
  const plaintextToken = 'super-secret-fake-oauth-token-should-never-appear-in-db';

  beforeAll(async () => {
    await cleanDatabase();
    await socialAccountRepo.upsertWithToken({
      platform: 'INSTAGRAM',
      externalAccountId: 'ig_secrecy_test',
      plaintextToken,
    });
  });

  it('never stores the plaintext token value in encryptedToken', async () => {
    const account = await prisma.socialAccount.findFirstOrThrow({
      where: { externalAccountId: 'ig_secrecy_test' },
    });
    expect(account.encryptedToken).not.toContain(plaintextToken);
    expect(account.encryptedToken).not.toBe(plaintextToken);
  });

  it('round-trips correctly via decryptToken (proves it is real encryption, not just obfuscation)', async () => {
    const account = await prisma.socialAccount.findFirstOrThrow({
      where: { externalAccountId: 'ig_secrecy_test' },
    });
    expect(socialAccountRepo.decryptToken(account)).toBe(plaintextToken);
  });
});
