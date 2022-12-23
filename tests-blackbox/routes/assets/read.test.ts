import { getUrl } from '@common/config';
import request from 'supertest';
import vendors from '@common/get-dbs-to-test';
import { createReadStream, readFileSync } from 'fs';
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

describe('/assets', () => {
	describe('GET /assets/:id', () => {
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
					.get(`/assets/${insertResponse.body.data.id}`)
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);

				// Assert
				expect(response.statusCode).toBe(200);
				expect(response.headers['content-type']).toBe(imageFile.type);
				expect(response.headers['content-length']).toBe(imageFile.filesize);
				expect(Buffer.compare(response.body, await readFileSync(imageFilePath))).toBe(0);
			});
		});
	});
});
