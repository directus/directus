import type { UserConfig } from 'tsdown';

/** Shared options, spread into the configs of packages that have their own `tsdown.config` */
export const baseConfig = {
	fixedExtension: false,
	// tsdown would otherwise enable dts whenever tsconfig sets `declaration`
	dts: false,
	deps: { dts: { neverBundle: true } },
} satisfies UserConfig;

export default baseConfig;
