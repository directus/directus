import type { Accountability, SchemaOverview } from '@directus/types';
import { createReadStream } from 'node:fs';
import { isMainThread, parentPort, workerData } from 'node:worker_threads';
import { ImportService } from '../services/import-export.js';

export type WorkerData = {
	collection: string;
	mimeType: string;
	filePath: string;
	accountability: Accountability | undefined;
	schema: SchemaOverview;
};

async function importWorker() {
	const { collection, mimeType, filePath, accountability, schema }: WorkerData = workerData;

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
