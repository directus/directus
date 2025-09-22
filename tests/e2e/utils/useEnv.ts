import type { Database } from '@directus/sandbox';
import { inject } from 'vitest';

export function useEnv() {
	return inject('envs')[process.env['DATABASE'] as Database];
}
