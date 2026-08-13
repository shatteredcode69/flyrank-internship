import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { AppError } from '../../shared/errors/app-error.js';
import type { Platform } from '../../domain/platform/platform.js';
import { PLATFORM_IMAGE_SPECS } from '../../domain/platform/platform.js';
import { logger } from '../../shared/logging/logger.js';

export interface GenerateVariantInput {
  sourcePath: string;
  platform: Platform;
  outputDir: string;
  campaignId: string;
  /** Optional branding overlay: a small PNG composited into the bottom-right safe zone. */
  brandOverlayPath?: string;
}

export interface GenerateVariantResult {
  path: string;
  width: number;
  height: number;
  platform: Platform;
}

/**
 * Reusable image-variant pipeline (§8 of the build spec). One function,
 * driven entirely by data (PLATFORM_IMAGE_SPECS) — there is deliberately no
 * `if (platform === 'INSTAGRAM')` branching here or anywhere else in the
 * app; adding a platform means adding a spec entry, not new code paths.
 *
 * Safe-zone handling: `fit: 'cover'` with `position: 'attention'` asks
 * Sharp to crop toward the most visually salient region rather than a
 * naive center-crop, keeping the subject inside frame across very
 * different target aspect ratios (1:1 vs 16:9).
 */
export async function generateVariant(input: GenerateVariantInput): Promise<GenerateVariantResult> {
  const spec = PLATFORM_IMAGE_SPECS[input.platform];
  if (!spec) {
    throw AppError.validation(`No image spec registered for platform ${input.platform}`);
  }

  await mkdir(input.outputDir, { recursive: true });

  let pipeline = sharp(input.sourcePath).resize({
    width: spec.width,
    height: spec.height,
    fit: 'cover',
    position: sharp.strategy.attention,
  });

  if (input.brandOverlayPath) {
    pipeline = pipeline.composite([
      { input: input.brandOverlayPath, gravity: 'southeast' },
    ]);
  }

  const outputPath = path.join(
    input.outputDir,
    `${input.campaignId}-${input.platform.toLowerCase()}.jpg`,
  );

  try {
    await pipeline.jpeg({ quality: 88 }).toFile(outputPath);
  } catch (err) {
    logger.error({ err, platform: input.platform }, 'Image variant generation failed');
    throw AppError.validation(`Failed to generate ${input.platform} image variant`, {
      platform: input.platform,
      cause: err instanceof Error ? err.message : String(err),
    });
  }

  // Deterministic verification: re-read the metadata of what we just wrote,
  // rather than trusting the resize call blindly — this is what the
  // "correct dimensions" acceptance probe actually checks against.
  const meta = await sharp(outputPath).metadata();
  if (meta.width !== spec.width || meta.height !== spec.height) {
    throw AppError.validation(
      `Generated ${input.platform} variant has wrong dimensions: ${meta.width}x${meta.height}, expected ${spec.width}x${spec.height}`,
    );
  }

  return { path: outputPath, width: spec.width, height: spec.height, platform: input.platform };
}

export async function generateAllVariants(
  input: Omit<GenerateVariantInput, 'platform'> & { platforms: Platform[] },
): Promise<GenerateVariantResult[]> {
  const results: GenerateVariantResult[] = [];
  for (const platform of input.platforms) {
    // eslint-disable-next-line no-await-in-loop -- deterministic, sequential by design for predictable test ordering
    results.push(await generateVariant({ ...input, platform }));
  }
  return results;
}
