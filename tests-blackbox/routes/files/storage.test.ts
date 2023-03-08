import config, { getUrl } from '@common/config';
import request from 'supertest';
import vendors from '@common/get-dbs-to-test';
import { createReadStream } from 'fs';
import path from 'path';
import * as common from '@common/index';

const assetsDirectory = [__dirname, '..', '..', 'assets'];
const storages = ['local'];
const imageFile = {
	name: 'directus.png',
	type: 'image/png',
	filesize: '7136',
};
const imageFilePath = path.join(...assetsDirectory, imageFile.name);

describe('/files', () => {
	describe('POST /files', () => {
		describe.each(storages)('Storage: %s', (storage) => {
			it.each(vendors)('%s', async (vendor) => {
				// Action
				const response = await request(getUrl(vendor))
					.post('/files')
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
					.attach('file', createReadStream(imageFilePath))
					.field('storage', storage);

				// Normalize filesize to string as bigint returns as a string
				response.body.data.filesize = String(response.body.data.filesize);

				// Assert
				expect(response.statusCode).toBe(200);
				expect(response.body.data).toEqual(
					expect.objectContaining({
						filesize: imageFile.filesize,
						type: imageFile.type,
						filename_download: imageFile.name,
						filename_disk: expect.any(String),
						storage: storage,
						id: expect.any(String),
					})
				);
			});
		});
	});

	describe('DELETE /files/:id', () => {
		describe.each(storages)('Storage: %s', (storage) => {
			it.each(vendors)('%s', async (vendor) => {
				// Setup
				const insertResponse = await request(getUrl(vendor))
					.post('/files')
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
					.attach('file', createReadStream(imageFilePath))
					.field('storage', storage);

				// Action
				const response = await request(getUrl(vendor))
					.delete(`/files/${insertResponse.body.data.id}`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toEqual(204);
				expect(response.body.data).toBe(undefined);
			});
		});
	});

	describe('ASSETS_TRANSFORM_MAX_CONCURRENT Tests', () => {
		describe('passes when below limit', () => {
			describe.each(storages)('Storage: %s', (storage) => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const count = Number(config.envs[vendor].ASSETS_TRANSFORM_MAX_CONCURRENT);
					const uploadedFileID = (
						await request(getUrl(vendor))
							.post('/files')
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
							.attach('file', createReadStream(imageFilePath))
							.field('storage', storage)
					).body.data.id;

					// Action
					const responses = await Promise.all(
						Array(count)
							.fill(0)
							.map((_, index) =>
								request(getUrl(vendor))
									.get(`/assets/${uploadedFileID}?width=${10000 + index}&height=${10000 + index}`)
									.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
							)
					);

					// Assert
					for (const response of responses) {
						expect(response.statusCode).toBe(200);
					}
				});
			});
		});

		describe('errors when above limit', () => {
			describe.each(storages)('Storage: %s', (storage) => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const limit = Number(config.envs[vendor].ASSETS_TRANSFORM_MAX_CONCURRENT);
					const count = 10;
					const uploadedFileID = (
						await request(getUrl(vendor))
							.post('/files')
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
							.attach('file', createReadStream(imageFilePath))
							.field('storage', storage)
					).body.data.id;

					// Action
					const responses = await Promise.all(
						Array(count)
							.fill(0)
							.map((_, index) =>
								request(getUrl(vendor))
									.get(`/assets/${uploadedFileID}?width=${10000 + index}&height=${10000 + index}`)
									.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
							)
					);

					// Assert
					expect(responses.filter((response) => response.statusCode === 200).length).toBe(limit);
					expect(responses.filter((response) => response.statusCode === 503).length).toBe(count - limit);
				});
			});
		});
	});
});
