import { createHash } from 'crypto';
import fs from 'fs/promises';
import { join } from 'path';
import {
	createDirectus,
	deleteFile,
	readAssetArrayBuffer,
	readFile,
	rest,
	staticToken,
	uploadFiles,
} from '@directus/sdk';
import { options, port } from '@utils/constants.js';
import { UUID } from '@utils/regex.js';
import { expect, test } from 'vitest';

const api = createDirectus<unknown>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));

test('upload a file', async () => {
	const file = await fs.readFile(join(import.meta.dirname, 'image.jpg'));
	const blob = new Blob([file], { type: 'image/jpg' });
	const form = new FormData();
	// Storage needs to be set before file, otherwise it defaults to the first option of env.STORAGE_LOCATIONS
	// TODO: Look into documenting this behavior
	form.set('storage', 'local');
	form.set('file', blob, 'image.jpg');

	const upload = await api.request(uploadFiles(form));
	const read = await api.request(readAssetArrayBuffer(upload.id));

	const originalHash = createHash('sha256').update(file).digest('hex');
	const uploadHash = createHash('sha256').update(Buffer.from(read)).digest('hex');

	expect(originalHash).toEqual(uploadHash);

	const fileInfo = await api.request(readFile(upload.id));

	expect(fileInfo).toMatchObject({
		filename_disk: expect.toSatisfy((value: string) => UUID.test(value.toLowerCase())),
		filename_download: 'image.jpg',
		filesize: expect.toSatisfy((val) => String(val) === '41274'),
		id: upload.id,
		storage: 'local',
		title: 'Image',
		type: 'image/jpg',
	});
});

test('delete a file', async () => {
	const file = await fs.readFile(join(import.meta.dirname, 'image.jpg'));
	const blob = new Blob([file], { type: 'image/jpg' });
	const form = new FormData();
	form.set('storage', 'local');
	form.set('file', blob, 'image.jpg');

	const upload = await api.request(uploadFiles(form));

	await api.request(deleteFile(upload.id));

	await expect(api.request(readFile(upload.id))).rejects.toThrowError();
});

if (options.extras?.minio) {
	test('upload a file to minio', async () => {
		const file = await fs.readFile(join(import.meta.dirname, 'image.jpg'));
		const blob = new Blob([file], { type: 'image/jpg' });
		const form = new FormData();
		form.set('storage', 'minio');
		form.set('file', blob, 'image.jpg');

		const upload = await api.request(uploadFiles(form));
		const read = await api.request(readAssetArrayBuffer(upload.id));

		const originalHash = createHash('sha256').update(file).digest('hex');
		const uploadHash = createHash('sha256').update(Buffer.from(read)).digest('hex');

		expect(originalHash).toEqual(uploadHash);

		const fileInfo = await api.request(readFile(upload.id));

		expect(fileInfo).toMatchObject({
			filename_disk: expect.toSatisfy((value: string) => UUID.test(value.toLowerCase())),
			filename_download: 'image.jpg',
			filesize: expect.toSatisfy((val) => String(val) === '41274'),
			id: upload.id,
			storage: 'minio',
			title: 'Image',
			type: 'image/jpg',
		});
	});

	test('delete a file from minio', async () => {
		const file = await fs.readFile(join(import.meta.dirname, 'image.jpg'));
		const blob = new Blob([file], { type: 'image/jpg' });
		const form = new FormData();
		form.set('storage', 'minio');
		form.set('file', blob, 'image.jpg');

		const upload = await api.request(uploadFiles(form));

		await api.request(deleteFile(upload.id));

		await expect(api.request(readFile(upload.id))).rejects.toThrowError();
	});
}

for (const storage of ['local', ...(options.extras?.minio ? ['minio'] : [])]) {
	test(`replace the contents of a file on ${storage}`, async () => {
		const file = await fs.readFile(join(import.meta.dirname, 'image.jpg'));

		const form = new FormData();
		form.set('storage', storage);
		form.set('title', 'Original Title');
		form.set('description', 'The original description');
		form.set('file', new Blob([file], { type: 'image/jpg' }), 'image.jpg');

		const upload = await api.request(uploadFiles(form));

		expect(upload).toMatchObject({ storage, title: 'Original Title', description: 'The original description' });

		const replacement = new FormData();
		replacement.set('file', new Blob([file], { type: 'image/jpg' }), 'replacement.jpg');

		const response = await fetch(`http://localhost:${port}/files/${upload.id}`, {
			method: 'PATCH',
			headers: { Authorization: 'Bearer admin' },
			body: replacement,
		});

		expect(response.status).toBe(200);

		const updated = await api.request(readFile(upload.id));

		// Replacing the contents keeps the metadata but swaps the downloadable name
		expect(updated).toMatchObject({
			id: upload.id,
			storage,
			title: 'Original Title',
			description: 'The original description',
			filename_download: 'replacement.jpg',
			filesize: expect.toSatisfy((value) => String(value) === '41274'),
		});

		const contents = await api.request(readAssetArrayBuffer(upload.id));

		expect(createHash('sha256').update(Buffer.from(contents)).digest('hex')).toBe(
			createHash('sha256').update(file).digest('hex'),
		);
	});
}
