import { Env } from '@directus/sandbox';
import { inject } from 'vitest';

export function useEnv(): Env {
	return inject('envs')[process.env['DATABASE']!];
}
