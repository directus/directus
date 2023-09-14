import { workerData, isMainThread, parentPort } from 'worker_threads';
import fs from 'node:fs';
import { ImportService } from '../services/import-export.js';

async function importWorker() {
	const { collection, mimeType, filePath, accountability, schema } = workerData;

	const service = new ImportService({
		accountability: accountability,
		schema: schema,
	});

	await service.import(collection, mimeType, fs.createReadStream(filePath));

	if (parentPort) {
		parentPort.postMessage({ type: 'finish' });
	}
}

if (!isMainThread) {
	importWorker();
}
