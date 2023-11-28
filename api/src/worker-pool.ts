import os from 'node:os';
import Tinypool from 'tinypool';

let workerPool: Tinypool | undefined;

export function getWorkerPool() {
	if (!workerPool) {
		workerPool = new Tinypool({
			minThreads: 0,
			maxQueue: 'auto',
		});

		// TODO Workaround currently required for failing CPU count on ARM in Tinypool,
		//      remove again once fixed upstream
		if (workerPool.options.maxThreads === 0) {
			const availableParallelism = os.availableParallelism();

			workerPool.options.maxThreads = availableParallelism;
			workerPool.options.maxQueue = availableParallelism ** 2;
		}
	}

	return workerPool;
}
