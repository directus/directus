import { inject } from 'vitest';
import { database } from './constants.js';

export function useOptions() {
	return inject('options')[database];
}
