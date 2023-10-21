import { logGenerator, requestGenerator, sleepGenerator } from './generators/index.js';

/**
 * Create a new SDK context for use in the isolate
 */
export function getSdk() {
	return [
		{ name: 'log', generator: logGenerator, args: ['message'], async: false },
		{ name: 'sleep', generator: sleepGenerator, args: ['milliseconds'], async: true },
		{ name: 'request', generator: requestGenerator, args: ['url', 'options'], async: true },
	];
}
