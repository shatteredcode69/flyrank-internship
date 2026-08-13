export type Platform = 'INSTAGRAM' | 'X';

export interface PlatformImageSpec {
  platform: Platform;
  width: number;
  height: number;
  aspectRatioLabel: string;
}

/**
 * The two platform image specifications required by the capstone brief.
 * Adding a third platform means adding one entry here plus one adapter —
 * nothing else in the domain/application layers changes.
 */
export const PLATFORM_IMAGE_SPECS: Record<Platform, PlatformImageSpec> = {
  INSTAGRAM: { platform: 'INSTAGRAM', width: 1080, height: 1080, aspectRatioLabel: '1:1' },
  X: { platform: 'X', width: 1600, height: 900, aspectRatioLabel: '16:9' },
};

export const ALL_PLATFORMS: Platform[] = ['INSTAGRAM', 'X'];
