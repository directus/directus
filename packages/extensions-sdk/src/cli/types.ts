import type { EXTENSION_LANGUAGES } from '@directus/extensions';
import type { Plugin, RollupOptions, OutputOptions as RollupOutputOptions, RollupLog } from 'rollup';

export type Language = (typeof EXTENSION_LANGUAGES)[number];
export type LanguageShort = 'js' | 'ts';

export type Config = {
	plugins?: Plugin[];
	onwarn?: (warning: RollupLog, defaultHandler: (warning: string | RollupLog) => void) => void;
	watch?: {
		clearScreen?: boolean;
	};
};

export type RollupConfig = { rollupOptions: RollupOptions; rollupOutputOptions: RollupOutputOptions };
export type RollupMode = 'browser' | 'node';

export type Format = 'esm' | 'cjs';
