import { Options } from '@directus/sandbox';
import { inject } from 'vitest';

export function useOptions(): Options {
	return inject('options')[process.env['DATABASE']!];
}
