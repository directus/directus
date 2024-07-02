/**
 * TUS implementation for resumable uploads
 *
 * https://tus.io/
 */
import { useEnv } from '@directus/env';
import type { Driver, TusDriver } from '@directus/storage';
import { supportsTus } from '@directus/storage';
import type { Accountability, SchemaOverview } from '@directus/types';
import { toArray } from '@directus/utils';
import { Server } from '@tus/server';
import { RESUMABLE_UPLOADS } from '../../constants.js';
import { getStorage } from '../../storage/index.js';
import { FilesService } from '../index.js';
import { TusDataStore } from './data-store.js';
import { getTusLocker } from './lockers.js';

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

export async function createTusServer(context: Context) {
	const env = useEnv();
	const store = await createTusStore(context);

	return new Server({
		path: '/files/tus',
		datastore: store,
		locker: getTusLocker(),
		maxSize: RESUMABLE_UPLOADS.MAX_SIZE,
		async onUploadFinish(req: any, res, upload) {
			const service = new FilesService({
				schema: req.schema,
			});

			await service.updateByQuery(
				{
					filter: { tus_id: { _eq: upload.id } },
				},
				{
					tus_id: null,
					tus_data: null,
				},
			);

			return res;
		},
		generateUrl(_req, opts) {
			return env['PUBLIC_URL'] + '/files/tus/' + opts.id;
		},
		relativeLocation: String(env['PUBLIC_URL']).startsWith('http'),
	});
}
