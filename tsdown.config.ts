import type { UserConfig } from 'tsdown';

export default {
	fixedExtension: false,
	deps: { dts: { neverBundle: true } },
} satisfies UserConfig;
