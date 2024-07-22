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
import { Server, EVENTS } from '@tus/server';
import { RESUMABLE_UPLOADS } from '../../constants.js';
import { getStorage } from '../../storage/index.js';
import { extractMetadata } from '../files/lib/extract-metadata.js';
import { ItemsService } from '../index.js';
import { TusDataStore } from './data-store.js';
import { getTusLocker } from './lockers.js';
import { pick } from 'lodash-es';

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
		maxSize: RESUMABLE_UPLOADS.MAX_SIZE,
		async onUploadFinish(req: any, res, upload) {
			const service = new ItemsService<File>('directus_files', {
				schema: req.schema,
			});

			const file = (
				await service.readByQuery({
					filter: { tus_id: { _eq: upload.id } },
					limit: 1,
				})
			)[0];

			if (!file) return res;

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

				await service.deleteOne(file.id);
			} else {
				const metadata = await extractMetadata(file.storage, file);

				await service.updateOne(file.id, {
					...metadata,
					tus_id: null,
					tus_data: null,
				});
			}

			return res;
		},
		generateUrl(_req, opts) {
			return env['PUBLIC_URL'] + '/files/tus/' + opts.id;
		},
		relativeLocation: String(env['PUBLIC_URL']).startsWith('http'),
	});

	server.on(EVENTS.POST_CREATE, async (_req, res, upload) => {
		res.setHeader('Directus-File-Id', upload.metadata!['id']!);
	});

	return [server, cleanup];

	function cleanup() {
		server.removeAllListeners();
	}
}
