import {
	createDirectus,
	deleteFile,
	readAssetArrayBuffer,
	readFile,
	rest,
	staticToken,
	uploadFiles,
} from '@directus/sdk';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import { join } from 'path';
import { expect, test } from 'vitest';
import { UUID } from '@utils/regex.js';
import { useOptions } from '@utils/useOptions.js';

const api = createDirectus<unknown>(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));
const options = useOptions();

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
