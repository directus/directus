import { inject } from 'vitest';
import { database } from './constants.js';

export function usePort() {
	return inject('port')[database];
}
