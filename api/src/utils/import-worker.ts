import { createReadStream } from 'node:fs';
import { isMainThread, parentPort, workerData } from 'node:worker_threads';
import { ImportService } from '../services/import-export.js';

async function importWorker() {
	const { collection, mimeType, filePath, accountability, schema } = workerData;

	const service = new ImportService({
		accountability: accountability,
		schema: schema,
	});

	await service.import(collection, mimeType, createReadStream(filePath));

	parentPort?.postMessage({ type: 'finish' });
}

if (!isMainThread) {
	importWorker();
}
