/**
 * TUS implementation for resumable uploads
 *
 * https://tus.io/
 */
import { FilesService } from '../files.js';
import { useEnv } from '@directus/env';
import type { Request } from 'express';
import { getTusAdapter } from './adapters/index.js';
import { getTusLocker } from './lockers.js';
import { Server } from '@tus/server';
import type { IncomingMessage } from 'node:http';
import { RESUMABLE_UPLOADS } from '../../constants.js';

const env = useEnv();

export const tusStore = getTusAdapter();

export const tusServer = new Server({
	path: '/files/tus',
	datastore: tusStore,
	locker: getTusLocker(),
	maxSize: RESUMABLE_UPLOADS.MAX_SIZE,
	async onIncomingRequest(msg: IncomingMessage) {
		const req = msg as Request;
		const schema = req.schema;

		if (req.method === 'PATCH' && schema.collections['directus_files']) {
			// dont add revisions for each individual chunks
			schema.collections['directus_files'].accountability = null;
		}

		tusStore.init({
			accountability: req.accountability,
			schema: schema,
		});
	},
	async onUploadFinish(req: any, res, upload) {
		const service = new FilesService({
			// accountability: req.accountability,
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
