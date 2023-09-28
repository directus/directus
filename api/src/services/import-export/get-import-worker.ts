import Tinypool from 'tinypool';
import { createRequire } from 'node:module';

let worker: Tinypool | undefined;

export function getImportWorker() {
	if (!worker) {
		const require = createRequire(import.meta.url);
		const path = require.resolve('./import-worker');

		worker = new Tinypool({
			minThreads: 0,
			maxQueue: 'auto',
			filename: new URL(path, import.meta.url).href,
		});
	}

	return worker;
}
