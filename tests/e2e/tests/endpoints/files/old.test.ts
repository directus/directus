import { port } from '@utils/constants.js';
import { describe, expect, test } from 'vitest';

describe('/files', () => {
	describe('POST /', () => {
		describe('when only request body is provided without any multipart files', () => {
			test('returns created file when required properties are included', async () => {
				// Setup
				const payload = {
					title: 'Test File',
					storage: 'local',
					filename_download: 'test_file',
					type: 'application/octet-stream',
				};

				const response = await fetch(`http://localhost:${port}/files`, {
					method: 'POST',
					body: JSON.stringify(payload),
					headers: {
						['Content-Type']: 'application/json',
						Authorization: 'Bearer admin',
					},
				});

				// Assert
				expect(response.status).toBe(200);

				expect(await response.json()).toMatchObject({
					data: {
						title: payload.title,
						storage: payload.storage,
						filename_download: payload.filename_download,
					},
				});
			});

			test('returns code: FAILED_VALIDATION when required property "storage" is not included', async () => {
				// Setup
				const payload = { title: 'Test File', filename_download: 'test_file', type: 'application/octet-stream' };

				const response = await fetch(`http://localhost:${port}/files`, {
					method: 'POST',
					body: JSON.stringify(payload),
					headers: {
						['Content-Type']: 'application/json',
						Authorization: 'Bearer admin',
					},
				});

				// Assert
				expect(response.status).toBe(400);

				expect(await response.json()).toMatchObject({
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
