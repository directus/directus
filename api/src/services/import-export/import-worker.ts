import type { Accountability, SchemaOverview } from '@directus/types';
import { createReadStream } from 'node:fs';
import { ImportService } from './index.js';

export type ImportWorkerData = {
	collection: string;
	mimeType: string;
	filePath: string;
	accountability: Accountability | undefined;
	schema: SchemaOverview;
};

export default async function ({ collection, mimeType, filePath, accountability, schema }: ImportWorkerData) {
	const service = new ImportService({
		accountability: accountability,
		schema: schema,
	});

	await service.import(collection, mimeType, createReadStream(filePath));
}
