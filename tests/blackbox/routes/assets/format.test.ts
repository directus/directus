import { getUrl } from '@common/config';
import request from 'supertest';
import vendors from '@common/get-dbs-to-test';
import { createReadStream } from 'fs';
import path from 'path';
import * as common from '@common/index';

const assetsDirectory = [__dirname, '..', '..', 'assets'];
const storages = ['local', 'minio'];

const imageFileAvif = path.join(...assetsDirectory, 'directus.avif');
const imageFilePng = path.join(...assetsDirectory, 'directus.png');

describe('/assets', () => {
	describe('GET /assets/:id', () => {
		describe('format=auto Tests', () => {
			describe('without Accept request header', () => {
				describe.each(storages)('Storage: %s', (storage) => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const insertResponse = await request(getUrl(vendor))
							.post('/files')
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
							.field('storage', storage)
							.attach('file', createReadStream(imageFileAvif));

						// Action
						const response = await request(getUrl(vendor))
							.get(`/assets/${insertResponse.body.data.id}?format=auto`)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

						// Assert
						expect(response.statusCode).toBe(200);
						expect(response.headers['content-type']).toBe('image/png'); // Expect fallback to png for image format with transparency support
					});
				});
			});

			describe.each([
				{ requestHeaderAccept: 'image/avif,image/webp,image/*,*/*;q=0.8', responseHeaderContentType: 'image/avif' },
				{ requestHeaderAccept: 'image/avif', responseHeaderContentType: 'image/avif' },
				{ requestHeaderAccept: 'image/webp', responseHeaderContentType: 'image/webp' },
				{ requestHeaderAccept: '*/*', responseHeaderContentType: 'image/png' }, // Expect to return png as original image is png
			])('with "$requestHeaderAccept" Accept request header', ({ requestHeaderAccept, responseHeaderContentType }) => {
				describe.each(storages)('Storage: %s', (storage) => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const insertResponse = await request(getUrl(vendor))
							.post('/files')
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
							.field('storage', storage)
							.attach('file', createReadStream(imageFilePng));

						// Action
						const response = await request(getUrl(vendor))
							.get(`/assets/${insertResponse.body.data.id}?format=auto`)
							.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
							.set('Accept', requestHeaderAccept);

						// Assert
						expect(response.statusCode).toBe(200);
						expect(response.headers['content-type']).toBe(responseHeaderContentType);
					});
				});
			});
		});
	});
});
