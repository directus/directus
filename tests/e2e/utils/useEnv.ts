import { inject } from 'vitest';
import { database } from './constants.js';

export function useEnv() {
	return inject('envs')[database];
}
