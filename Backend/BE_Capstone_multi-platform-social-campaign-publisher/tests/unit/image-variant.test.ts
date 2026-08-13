import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { generateVariant, generateAllVariants } from '../../src/infrastructure/image/image-variant-generator.js';

let workDir: string;
let sourcePath: string;

beforeAll(async () => {
  workDir = await mkdtemp(path.join(os.tmpdir(), 'variant-test-'));
  sourcePath = path.join(workDir, 'source.jpg');
  // A simple 2000x1200 synthetic source, deliberately not square/16:9 so
  // the resize/crop logic is meaningfully exercised.
  await sharp({
    create: { width: 2000, height: 1200, channels: 3, background: { r: 100, g: 120, b: 200 } },
  })
    .jpeg()
    .toFile(sourcePath);
});

afterAll(async () => {
  await rm(workDir, { recursive: true, force: true });
});

describe('generateVariant', () => {
  it('produces an exact 1080x1080 Instagram variant', async () => {
    const result = await generateVariant({
      sourcePath,
      platform: 'INSTAGRAM',
      outputDir: workDir,
      campaignId: 'test-campaign',
    });
    expect(result.width).toBe(1080);
    expect(result.height).toBe(1080);

    const meta = await sharp(result.path).metadata();
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(1080);
  });

  it('produces an exact 1600x900 X variant', async () => {
    const result = await generateVariant({
      sourcePath,
      platform: 'X',
      outputDir: workDir,
      campaignId: 'test-campaign',
    });
    expect(result.width).toBe(1600);
    expect(result.height).toBe(900);

    const meta = await sharp(result.path).metadata();
    expect(meta.width).toBe(1600);
    expect(meta.height).toBe(900);
  });
});

describe('generateAllVariants', () => {
  it('generates both platform variants from one source image', async () => {
    const results = await generateAllVariants({
      sourcePath,
      outputDir: workDir,
      campaignId: 'test-campaign-all',
      platforms: ['INSTAGRAM', 'X'],
    });
    expect(results).toHaveLength(2);
    const byPlatform = Object.fromEntries(results.map((r) => [r.platform, r]));
    expect(byPlatform.INSTAGRAM).toMatchObject({ width: 1080, height: 1080 });
    expect(byPlatform.X).toMatchObject({ width: 1600, height: 900 });
  });
});
