import type { EXTENSION_LANGUAGES } from '@directus/extensions';
import type { InputOptions, OutputOptions, Plugin } from 'rolldown';

export type Language = (typeof EXTENSION_LANGUAGES)[number];
export type LanguageShort = 'js' | 'ts';

export type Config = {
	plugins?: Plugin[];
	watch?: {
		clearScreen?: boolean;
	};
};

export type RolldownConfig = { inputOptions: InputOptions; outputOptions: OutputOptions };

export type Format = 'esm' | 'cjs';

export type Report = {
	level: 'info' | 'warn' | 'error';
	message: string;
};
