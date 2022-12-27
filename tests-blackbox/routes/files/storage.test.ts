import { getUrl } from '@common/config';
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
});
