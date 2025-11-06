import { getUrl } from '@common/config';
import { CreatePermission, DeletePermission } from '@common/functions';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import request, { type Response } from 'supertest';
import { Upload } from 'tus-js-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const file = {
	name: 'tus.text',
	type: 'text/plain',
	content: 'tus',
};

const policies = new Map();

beforeAll(async () => {
	for (const vendor of vendors) {
		const response = await CreatePermission(vendor, {
			role: USER.APP_ACCESS.KEY,
			permissions: [
				{
					collection: 'directus_files',
					action: 'create',
					permissions: {},
					fields: ['*'],
				},
				{
					collection: 'directus_files',
					action: 'read',
					permissions: {},
					fields: ['*'],
				},
				{
					collection: 'directus_files',
					action: 'update',
					permissions: {},
					fields: ['*'],
				},
				{
					collection: 'directus_files',
					action: 'delete',
					permissions: {},
					fields: ['*'],
				},
			],
			policyName: 'TUS',
		});

		policies.set(vendor, response.id);
	}
});

afterAll(async () => {
	for (const vendor of vendors) {
		if (!policies.has(vendor)) continue;

		await DeletePermission(vendor, {
			policyId: policies.get(vendor),
		});
	}
});

describe('/files/tus', () => {
	describe('POST /files/tus', () => {
		it.each(vendors)('%s', async (vendor) => {
			// Action
			const response = await new Promise<Response>((resolve, reject) => {
				const upload = new Upload(Buffer.from(file.content), {
					headers: {
						Authorization: `Bearer ${USER.APP_ACCESS.TOKEN}`,
					},
					endpoint: getUrl(vendor) + `/files/tus`,
					chunkSize: Buffer.from(file.content).byteLength,
					metadata: { filename_download: file.name, type: file.type },
					removeFingerprintOnSuccess: true,
					onError(error) {
						reject(error);
					},
					async onSuccess() {
						const response = await request(getUrl(vendor))
							.get('/files')
							.query({
								filename_download: { _eq: file.name },
								fields: ['id'],
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.APP_ACCESS.TOKEN}`);

						resolve(response);
					},
					onShouldRetry() {
						return false;
					},
				});

				upload.start();
			});

			// Assert
			expect(response.statusCode).toBe(200);
			expect(response.body.data?.[0]?.id).toBeDefined();
		});
	});

	describe('PATCH /files/tus/:id', () => {
		it.each(vendors)('%s', async (vendor) => {
			const fileResponse = await request(getUrl(vendor))
				.get('/files')
				.query({
					filter: { filename_download: { _eq: file.name } },
					fields: ['id'],
					limit: 1,
				})
				.set('Authorization', `Bearer ${USER.APP_ACCESS.TOKEN}`);

			file.name = `changed_${file.name}`;

			// Action
			const response = await new Promise<Response>((resolve, reject) => {
				const upload = new Upload(Buffer.from(file.content), {
					headers: {
						Authorization: `Bearer ${USER.APP_ACCESS.TOKEN}`,
					},
					endpoint: getUrl(vendor) + `/files/tus`,
					chunkSize: Buffer.from(file.content).byteLength,
					metadata: { filename_download: file.name, type: file.type, id: fileResponse.body.data?.[0]?.id },
					removeFingerprintOnSuccess: true,
					onError(error) {
						reject(error);
					},
					async onSuccess() {
						const response = await request(getUrl(vendor))
							.get('/files')
							.query({
								filename_download: { _eq: file.name },
								fields: ['id'],
								limit: 1,
							})
							.set('Authorization', `Bearer ${USER.APP_ACCESS.TOKEN}`);

						resolve(response);
					},
					onShouldRetry() {
						return false;
					},
				});

				upload.start();
			});

			// Assert
			expect(response.statusCode).toBe(200);
			expect(response.body.data?.[0]?.id).toBeDefined();
		});
	});
});
