import type { Database } from '@directus/sandbox';
import { inject } from 'vitest';

export function useOptions() {
	return inject('options')[process.env['DATABASE'] as Database];
}
