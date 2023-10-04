import { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

describe('/files', () => {
	describe('POST /', () => {
		describe('when only request body is provided without any multipart files', () => {
			describe('returns created file when required properties are included', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const payload = {
						title: 'Test File',
						storage: 'local',
						filename_download: 'test_file',
						type: 'application/octet-stream',
					};

					// Action
					const response = await request(getUrl(vendor))
						.post(`/files`)
						.send(payload)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(200);

					expect(response.body).toMatchObject({
						data: {
							title: payload.title,
							storage: payload.storage,
							filename_download: payload.filename_download,
						},
					});
				});
			});

			describe('returns code: FAILED_VALIDATION when required property "storage" is not included', () => {
				it.each(vendors)('%s', async (vendor) => {
					// Setup
					const payload = { title: 'Test File', filename_download: 'test_file', type: 'application/octet-stream' };

					// Action
					const response = await request(getUrl(vendor))
						.post(`/files`)
						.send(payload)
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(400);

					expect(response.body).toMatchObject({
						errors: [
							{
								message: 'Validation failed for field "storage". Value is required.',
								extensions: {
									code: 'FAILED_VALIDATION',
								},
							},
						],
					});
				});
			});
		});
	});
});
