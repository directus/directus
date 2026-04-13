import { createReadStream } from 'node:fs';
import { join } from 'path';
import { getUrl, paths } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const assetsDirectory = [paths.cwd, 'assets'];
const storages = ['local', 'minio'];

const imageFile = {
	name: 'directus.png',
	type: 'image/png',
};

const replacementFile = {
	name: 'directus.avif',
};

const imageFilePath = join(...assetsDirectory, imageFile.name);
const replacementFilePath = join(...assetsDirectory, replacementFile.name);

describe('/assets cache revalidation', () => {
	describe('GET /assets/:id', () => {
		describe.each(storages)('Storage: %s', (storage) => {
			it.each(vendors)('returns must-revalidate Cache-Control and ETag headers (%s)', async (vendor) => {
				const insertResponse = await request(getUrl(vendor))
					.post('/files')
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.field('storage', storage)
					.attach('file', createReadStream(imageFilePath));

				const fileId = insertResponse.body.data.id;
				const modifiedOn = insertResponse.body.data.modified_on;

				const response = await request(getUrl(vendor))
					.get(`/assets/${fileId}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				expect(response.statusCode).toBe(200);
				expect(response.headers['cache-control']).toBe('max-age=0, must-revalidate');
				expect(response.headers['etag']).toBe(Math.floor(new Date(modifiedOn).getTime() / 1000).toString());
				expect(response.headers['last-modified']).toBe(new Date(modifiedOn).toUTCString());
			});

			it.each(vendors)('returns 304 when If-None-Match matches the ETag (%s)', async (vendor) => {
				const insertResponse = await request(getUrl(vendor))
					.post('/files')
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.field('storage', storage)
					.attach('file', createReadStream(imageFilePath));

				const fileId = insertResponse.body.data.id;

				const firstResponse = await request(getUrl(vendor))
					.get(`/assets/${fileId}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				const etag = firstResponse.headers['etag'];

				const response = await request(getUrl(vendor))
					.get(`/assets/${fileId}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.set('If-None-Match', etag as string);

				expect(response.statusCode).toBe(304);
				expect(response.body).toEqual({});
			});

			it.each(vendors)('returns 304 when If-Modified-Since is after Last-Modified (%s)', async (vendor) => {
				const insertResponse = await request(getUrl(vendor))
					.post('/files')
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.field('storage', storage)
					.attach('file', createReadStream(imageFilePath));

				const fileId = insertResponse.body.data.id;

				const firstResponse = await request(getUrl(vendor))
					.get(`/assets/${fileId}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				const lastModified = firstResponse.headers['last-modified'];

				const response = await request(getUrl(vendor))
					.get(`/assets/${fileId}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.set('If-Modified-Since', lastModified as string);

				expect(response.statusCode).toBe(304);
			});

			it.each(vendors)('returns 200 with new ETag after the file is replaced (%s)', async (vendor) => {
				const insertResponse = await request(getUrl(vendor))
					.post('/files')
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.field('storage', storage)
					.attach('file', createReadStream(imageFilePath));

				const fileId = insertResponse.body.data.id;

				const firstResponse = await request(getUrl(vendor))
					.get(`/assets/${fileId}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				const oldEtag = firstResponse.headers['etag'];
				const oldLastModified = firstResponse.headers['last-modified'];

				// Wait a second to ensure modified_on changes as it's not in milliseconds
				await new Promise((resolve) => setTimeout(resolve, 1000));

				await request(getUrl(vendor))
					.patch(`/files/${fileId}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.attach('file', createReadStream(replacementFilePath));

				const response = await request(getUrl(vendor))
					.get(`/assets/${fileId}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.set('If-None-Match', oldEtag as string);

				expect(response.statusCode).toBe(200);
				expect(response.headers['etag']).not.toBe(oldEtag);
				expect(response.headers['last-modified']).not.toBe(oldLastModified);
			});

			it.each(vendors)('returns 401 when accessing with an invalid token (%s)', async (vendor) => {
				const insertResponse = await request(getUrl(vendor))
					.post('/files')
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
					.field('storage', storage)
					.attach('file', createReadStream(imageFilePath));

				const fileId = insertResponse.body.data.id;

				const firstResponse = await request(getUrl(vendor))
					.get(`/assets/${fileId}`)
					.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

				const etag = firstResponse.headers['etag'];

				const response = await request(getUrl(vendor))
					.get(`/assets/${fileId}`)
					.set('Authorization', `Bearer invalid-token`)
					.set('If-None-Match', etag as string);

				expect(response.statusCode).toBe(401);
			});
		});
	});
});
