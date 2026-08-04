import { createReadStream } from 'fs';
import { join } from 'path';
import config, { getUrl, paths } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const assetsDirectory = [paths.cwd, 'assets'];
const storages = ['local', 'minio'];

const imageFile = {
	name: 'directus.png',
	type: 'image/png',
	filesize: '7136',
};

const imageFilePath = join(...assetsDirectory, imageFile.name);

describe('/assets', () => {
	describe('GET /assets/:id', () => {
		describe('ASSETS_TRANSFORM_MAX_CONCURRENT Tests', () => {
			describe('passes when below limit', () => {
				describe.each(storages)('Storage: %s', (storage) => {
					it.each(vendors)(
						'%s',
						async (vendor) => {
							// Setup
							const count = Number(config.envs[vendor]['ASSETS_TRANSFORM_MAX_CONCURRENT']);

							const uploadedFileID = (
								await request(getUrl(vendor))
									.post('/files')
									.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
									.field('storage', storage)
									.attach('file', createReadStream(imageFilePath))
							).body.data.id;

							// Action
							const responses = await Promise.all(
								Array(count)
									.fill(0)
									.map((_, index) =>
										request(getUrl(vendor))
											.get(`/assets/${uploadedFileID}?width=${1000 + index}&height=${1000 + index}`)
											.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`),
									),
							);

							// Assert
							for (const response of responses) {
								expect(response.statusCode).toBe(200);
							}
						},
						60_000,
					);
				});
			});

			/*
			 * Load shedding above the limit is covered by a unit test in
			 * `api/src/services/assets.test.ts`. Asserting it over HTTP made the outcome depend on how
			 * many requests happen to sit in sharp's queue at once, which is a property of event loop
			 * and libuv threadpool scheduling rather than of the limit itself. Switching sqlite off the
			 * threadpool-bound `sqlite3` driver was enough to make it never trip.
			 */
		});
	});
});
