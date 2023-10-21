import { logGenerator } from './generators/log.js';
import { requestGenerator } from './generators/request.js';
import { sleepGenerator } from './generators/sleep.js';

export function getSdk() {
	return [
		{ name: 'log', generator: logGenerator, args: ['message'], async: false },
		{ name: 'sleep', generator: sleepGenerator, args: ['milliseconds'], async: true },
		{ name: 'request', generator: requestGenerator, args: ['url', 'options'], async: true },
	];
}
