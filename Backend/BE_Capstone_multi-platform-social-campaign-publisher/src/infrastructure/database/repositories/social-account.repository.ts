import type { Platform, SocialAccount as PrismaSocialAccount } from '@prisma/client';
import { prisma } from '../prisma-client.js';
import { TokenCipher } from '../../crypto/token-cipher.js';
import { env } from '../../../config/env.js';

const cipher = new TokenCipher(env.ENCRYPTION_KEY);

export class SocialAccountRepository {
  /** Encrypts the token before it ever touches the database. */
  async upsertWithToken(params: {
    platform: Platform;
    externalAccountId: string;
    plaintextToken: string;
  }): Promise<PrismaSocialAccount> {
    const encrypted = cipher.encrypt(params.plaintextToken);
    return prisma.socialAccount.upsert({
      where: {
        platform_externalAccountId: {
          platform: params.platform,
          externalAccountId: params.externalAccountId,
        },
      },
      create: {
        platform: params.platform,
        externalAccountId: params.externalAccountId,
        encryptedToken: encrypted.ciphertext,
        tokenIv: encrypted.iv,
        tokenAuthTag: encrypted.authTag,
      },
      update: {
        encryptedToken: encrypted.ciphertext,
        tokenIv: encrypted.iv,
        tokenAuthTag: encrypted.authTag,
      },
    });
  }

  async findFirstForPlatform(platform: Platform): Promise<PrismaSocialAccount | null> {
    return prisma.socialAccount.findFirst({ where: { platform } });
  }

  /** Decrypts on demand, in memory only. Callers must never log the result. */
  decryptToken(account: PrismaSocialAccount): string {
    return cipher.decrypt({
      ciphertext: account.encryptedToken,
      iv: account.tokenIv,
      authTag: account.tokenAuthTag,
    });
  }
}
