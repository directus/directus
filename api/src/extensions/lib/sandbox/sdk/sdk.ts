import { logGenerator, readItemsGenerator, requestGenerator, sleepGenerator } from './generators/index.js';

/**
 * Create a new SDK context for use in the isolate
 */
export function getSdk() {
	return [
		{ name: 'readItems', generator: readItemsGenerator, args: ['collection', 'query'], async: true },
		{ name: 'log', generator: logGenerator, args: ['message'], async: false },
		{ name: 'request', generator: requestGenerator, args: ['url', 'options'], async: true },
		{ name: 'sleep', generator: sleepGenerator, args: ['milliseconds'], async: true },
	];
}
