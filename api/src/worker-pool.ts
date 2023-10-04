import Tinypool from 'tinypool';

let workerPool: Tinypool | undefined;

export function getWorkerPool() {
	if (!workerPool) {
		workerPool = new Tinypool({
			minThreads: 0,
			maxQueue: 'auto',
		});
	}

	return workerPool;
}
