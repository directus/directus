/* eslint-disable no-console */
/**
 * TUS implementation for resumable uploads
 *
 * https://tus.io/
 */
import { toArray } from '@directus/utils';
// import { Server } from '@tus/server';
import { TusServer } from './server.js';
import { FilesService } from '../files.js';
import path from 'path';
import { useEnv } from '@directus/env';
import type { Request /*, Response, NextFunction*/ } from 'express';
import { randomUUID } from '@directus/random';
import { getTusAdapter } from './adapters/index.js';

const env = useEnv();

const store = getTusAdapter({
	directory: path.join(env['EXTENSIONS_PATH'] as string, '.temp'),
	expirationPeriodInMilliseconds: 120_000,
});

export const tusServer = new TusServer({
	path: '/files/tus',
	datastore: store,
	onUploadCreate: async (_req, res, upload) => {
		console.log('create', /*req, res,*/ upload);
		return res;
	},
	onUploadFinish: async (req: any, res, upload) => {
		console.log('finished', /*req, res,*/ upload);

		try {
			const service = new FilesService({
				// accountability: req.accountability,
				schema: req.schema,
			});

			const disk: string = toArray(env['STORAGE_LOCATIONS'] as string)[0]!;

			console.log(
				'stored?',
				await service.uploadOne(await store.read(upload.id), {
					storage: disk,
					type: upload.metadata?.['filetype'] ?? 'unknown',
					title: upload.metadata?.['filename'] ?? null,
					filename_download: upload.metadata?.['filename'] ?? 'test',
				}),
			);

			await store.remove(upload.id);
		} catch (err) {
			console.warn('why', err);
		}

		return res;
	},
	namingFunction(req) {
		const id = randomUUID();
		const folder = (req as Request).accountability?.user ?? 'public';
		return `users/${folder}/${id}`;
	},
	generateUrl(_req, { proto, host, path, id }) {
		id = Buffer.from(id, 'utf-8').toString('base64url');
		return `${proto}://${host}${path}/${id}`;
	},
});
