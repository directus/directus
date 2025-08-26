import { Options } from '@directus/sandbox';
import { DeepPartial } from '@directus/types';
import { inject } from 'vitest';

export function useOptions(): DeepPartial<Options> {
	return inject('options')[process.env['DATABASE']!];
}
