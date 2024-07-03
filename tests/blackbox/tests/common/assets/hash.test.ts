import { getUrl, paths } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import { createReadStream } from 'node:fs';
import { join } from 'path';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

const assetsDirectory = [paths.cwd, 'assets'];

const imageFile = {
	name: 'directus.png',
	hash: '3a02abb7e82b91bbac1f252eb3d430d854dd35f4c8e2381f33ff81bb9c86f4ae',
};

const imageFilePath = join(...assetsDirectory, imageFile.name);

describe('/assets', () => {
	describe('GET /assets/:id', () => {
		it.each(vendors)('%s', async (vendor) => {
			// Setup
			const insertResponse = await request(getUrl(vendor))
				.post('/files')
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
				.attach('file', createReadStream(imageFilePath));

			// Action
			const response = await request(getUrl(vendor))
				.get(`/files/${insertResponse.body.data.id}?fields=hash`)
				.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

			// Assert
			expect(response.statusCode).toBe(200);
			expect(response.body.data.hash).toBe(imageFile.hash);
		});
	});
});
