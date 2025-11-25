/**
 * TUS implementation for resumable uploads
 *
 * https://tus.io/
 */
import { useEnv } from '@directus/env';
import type { Driver, TusDriver } from '@directus/storage';
import { supportsTus } from '@directus/storage';
import type { Accountability, File, SchemaOverview } from '@directus/types';
import { toArray } from '@directus/utils';
import { Server } from '@tus/server';
import { RESUMABLE_UPLOADS } from '../../constants.js';
import { getStorage } from '../../storage/index.js';
import { extractMetadata } from '../files/lib/extract-metadata.js';
import { ItemsService } from '../index.js';
import { TusDataStore } from './data-store.js';
import { getTusLocker } from './lockers.js';
import { pick } from 'lodash-es';
import emitter from '../../emitter.js';
import getDatabase from '../../database/index.js';
import { getSchema } from '../../utils/get-schema.js';

type Context = {
	schema: SchemaOverview;
	accountability?: Accountability | undefined;
};

async function createTusStore(context: Context) {
	const env = useEnv();
	const storage = await getStorage();
	const location = toArray(env['STORAGE_LOCATIONS'] as string)[0]!;
	const driver: Driver | TusDriver = storage.location(location);

	if (!supportsTus(driver)) {
		throw new Error(`Storage location ${location} does not support the TUS protocol`);
	}

	return new TusDataStore({
		constants: RESUMABLE_UPLOADS,
		accountability: context.accountability,
		schema: context.schema,
		location,
		driver,
	});
}

export async function createTusServer(context: Context): Promise<[Server, () => void]> {
	const env = useEnv();
	const store = await createTusStore(context);

	const server = new Server({
		path: '/files/tus',
		datastore: store,
		locker: getTusLocker(),
		...(RESUMABLE_UPLOADS.MAX_SIZE !== null && { maxSize: RESUMABLE_UPLOADS.MAX_SIZE }),
		async onUploadFinish(_req: any, upload) {
			const schema = await getSchema();

			const service = new ItemsService<File>('directus_files', {
				schema,
			});

			const file = (
				await service.readByQuery({
					filter: { tus_id: { _eq: upload.id } },
					limit: 1,
				})
			)[0];

			if (!file) return {};

			let fileData;

			// update metadata when file is replaced
			if (file.tus_data?.['metadata']?.['replace_id']) {
				const newFile = await service.readOne(file.tus_data['metadata']['replace_id']);
				const updateFields = pick(file, ['filename_download', 'filesize', 'type']);

				const metadata = await extractMetadata(newFile.storage, {
					...newFile,
					...updateFields,
				});

				await service.updateOne(file.tus_data['metadata']['replace_id'], {
					...updateFields,
					...metadata,
				});

				fileData = {
					...newFile,
					...updateFields,
					...metadata,
					id: file.tus_data['metadata']['replace_id'],
				};

				await service.deleteOne(file.id);
			} else {
				const metadata = await extractMetadata(file.storage, file);

				await service.updateOne(file.id, {
					...metadata,
					tus_id: null,
					tus_data: null,
				});

				fileData = {
					...file,
					...metadata,
					tus_id: null,
					tus_data: null,
				};
			}

			emitter.emitAction(
				'files.upload',
				{
					payload: fileData,
					key: fileData.id,
					collection: 'directus_files',
				},
				{
					schema,
					database: getDatabase(),
					accountability: context.accountability ?? null,
				},
			);

			return {
				headers: {
					'Directus-File-Id': upload.metadata!['id']!,
				},
			};
		},
		generateUrl(_req, opts) {
			return env['PUBLIC_URL'] + '/files/tus/' + opts.id;
		},
		allowedHeaders: env['CORS_ALLOWED_HEADERS'] as string[],
		exposedHeaders: env['CORS_EXPOSED_HEADERS'] as string[],
		relativeLocation: String(env['PUBLIC_URL']).startsWith('http'),
	});

	return [server, cleanup];

	function cleanup() {
		server.removeAllListeners();
	}
}
