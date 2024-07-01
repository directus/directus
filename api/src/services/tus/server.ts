/**
 * TUS implementation for resumable uploads
 *
 * https://tus.io/
 */
import type { TusDataStore } from '@directus/tus-driver';
import { useEnv } from '@directus/env';
import { Server } from '@tus/server';
import type { Request } from 'express';
import { cloneDeep } from 'lodash-es';
import { getTusAdapter } from './adapters.js';
import { getTusLocker } from './lockers.js';
import type { IncomingMessage } from 'node:http';
import { RESUMABLE_UPLOADS } from '../../constants.js';
import { ItemsService } from '../index.js';
import { FilesService } from '../files.js';

let _store: TusDataStore | undefined = undefined;

export async function getTusStore() {
	if (!_store) {
		_store = await getTusAdapter();
	}

	return _store;
}

let _server: Server | undefined = undefined;

export async function getTusServer() {
	if (!_server) {
		const env = useEnv();
		const store = await getTusStore();

		_server = new Server({
			path: '/files/tus',
			datastore: store,
			locker: getTusLocker(),
			maxSize: RESUMABLE_UPLOADS.MAX_SIZE,
			async onIncomingRequest(msg: IncomingMessage) {
				const req = msg as Request;
				// Make sure that the schema modification does not influence anything else
				const schema = cloneDeep(req.schema);

				// set the services
				store.setServices(
					new FilesService({
						accountability: req.accountability,
						schema: schema,
					}),
					// sudo service
					new FilesService({
						schema: schema,
					}),
				);
			},
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

	return _server;
}
