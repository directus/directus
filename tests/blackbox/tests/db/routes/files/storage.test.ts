import { getUrl, paths } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import { createReadStream } from 'fs';
import { join } from 'path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const assetsDirectory = [paths.cwd, 'assets'];
const storages = ['local', 'minio'];

const imageFile = {
	name: 'directus.png',
	type: 'image/png',
	filesize: '7136',
	title: 'Directus',
	description: 'The Directus Logo',
};

const imageFilePath = join(...assetsDirectory, imageFile.name);

describe('/files', () => {
	describe('POST /files', () => {
		describe.each(storages)('Storage: %s', (storage) => {
			it.each(vendors)('%s', async (vendor) => {
				// Action
				const response = await request(getUrl(vendor))
					.post('/files')
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.field('storage', storage)
					.field('title', imageFile.title)
					.field('description', imageFile.description)
					.attach('file', createReadStream(imageFilePath));

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
						title: imageFile.title,
						description: imageFile.description,
						id: expect.any(String),
					}),
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
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.field('storage', storage)
					.attach('file', createReadStream(imageFilePath));

				// Action
				const response = await request(getUrl(vendor))
					.delete(`/files/${insertResponse.body.data.id}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toEqual(204);
				expect(response.body.data).toBe(undefined);
			});
		});
	});
});
