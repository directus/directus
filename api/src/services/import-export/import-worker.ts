import type { Accountability, SchemaOverview } from '@directus/types';
import { createReadStream } from 'node:fs';
import { ImportService } from './index.js';
import type { MessagePort } from 'node:worker_threads';

export type ImportWorkerData = {
	collection: string;
	mimeType: string;
	filePath: string;
	accountability: Accountability | undefined;
	schema: SchemaOverview;
	port: MessagePort;
};

export default async function ({ port, collection, mimeType, filePath, accountability, schema }: ImportWorkerData) {
	const service = new ImportService({
		accountability: accountability,
		schema: schema,
		runtime: 'worker',
		port,
	});

	await service.import(collection, mimeType, createReadStream(filePath));
}
