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
											.get(`/assets/${uploadedFileID}?width=${4000 + index}&height=${4000 + index}`)
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

			describe('errors when above limit', () => {
				describe.each(storages)('Storage: %s', (storage) => {
					it.each(vendors)(
						'%s',
						async (vendor) => {
							// Setup
							const attempts = 100;

							const uploadedFileID = (
								await request(getUrl(vendor))
									.post('/files')
									.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
									.field('storage', storage)
									.attach('file', createReadStream(imageFilePath))
							).body.data.id;

							// Action
							const responses = await Promise.all(
								Array(attempts)
									.fill(0)
									.map((_, index) =>
										request(getUrl(vendor))
											.get(`/assets/${uploadedFileID}?width=${4000 + index}&height=${4000 + index}`)
											.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`),
									),
							);

							// Assert
							const unavailableCount = responses.filter((response) => response.statusCode === 503).length;
							expect(unavailableCount).toBeGreaterThanOrEqual(1);

							expect(responses.filter((response) => response.statusCode === 200).length).toBe(
								attempts - unavailableCount,
							);
						},
						1_200_000,
					);
				});
			});
		});
	});
});
