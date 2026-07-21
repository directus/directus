import { randomUUID } from 'crypto';
import { createDirectus, deleteFile, readFile, rest, staticToken, updateFile, uploadFiles } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { afterEach, describe, expect, test } from 'vitest';

const api = createDirectus<unknown>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

const uploaded: string[] = [];

afterEach(async () => {
	while (uploaded.length > 0) {
		const id = uploaded.pop()!;
		await api.request(deleteFile(id)).catch(() => {});
	}
});

async function upload(filenameDisk: string) {
	const form = new FormData();
	form.set('storage', 'local');
	form.set('filename_disk', filenameDisk);
	form.set('file', new Blob([Buffer.from('filename-disk-test')], { type: 'application/octet-stream' }), 'file.bin');

	const result = await api.request<{ id: string }>(uploadFiles(form));
	uploaded.push(result.id);
	return result;
}

describe('filename_disk uniqueness', () => {
	test('rejects an upload that reuses an existing filename_disk', async () => {
		const name = `${randomUUID()}.jpg`;

		await upload(name);

		await expect(upload(name)).rejects.toMatchObject({
			errors: [expect.objectContaining({ extensions: expect.objectContaining({ code: 'FORBIDDEN' }) })],
		});
	});

	test('allows an upload with a unique filename_disk', async () => {
		const created = await upload(`${randomUUID()}.jpg`);

		const fileInfo = await api.request<{ id: string }>(readFile(created.id));
		expect(fileInfo.id).toBe(created.id);
	});

	test('allows a file to keep its own filename_disk on update', async () => {
		const name = `${randomUUID()}.jpg`;
		const file = await upload(name);

		await expect(api.request(updateFile(file.id, { filename_disk: name }))).resolves.toMatchObject({ id: file.id });
	});
});

describe('filename_disk path sanitization', () => {
	test('clamps ../ traversal in filename_disk to the storage root', async () => {
		const safeName = `${randomUUID()}.jpg`;
		const created = await upload(`../../../../${safeName}`);

		const fileInfo = await api.request<{ filename_disk: string }>(readFile(created.id));

		// The traversal segments are stripped, keeping the stored path inside the storage root
		expect(fileInfo.filename_disk).toBe(safeName);
	});
});
