import { getUrl, paths } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'path';
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
		describe.each(storages)('Storage: %s', (storage) => {
			it.each(vendors)(
				'%s',
				async (vendor) => {
					// Setup
					const insertResponse = await request(getUrl(vendor))
						.post('/files')
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`)
						.field('storage', storage)
						.attach('file', createReadStream(imageFilePath));

					// TODO temporarily in place to find cause of flaky test
					if (!insertResponse.body?.data?.id) {
						/* eslint-disable no-console */
						console.log(insertResponse.statusCode);
						console.log(insertResponse.body);
						/* eslint-enable no-console */
					}

					// Action
					const response = await request(getUrl(vendor))
						.get(`/assets/${insertResponse.body.data.id}`)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(200);
					expect(response.headers['content-type']).toBe(imageFile.type);
					expect(response.headers['content-length']).toBe(imageFile.filesize);
					expect(Buffer.compare(response.body, await readFile(imageFilePath))).toBe(0);
				},
				{ retry: 1 },
			);
		});
	});
});
