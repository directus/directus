import { createDirectus, readAssetArrayBuffer, rest, staticToken, uploadFiles } from '@directus/sdk';
import fs from 'fs/promises';
import { join } from 'path';
import { expect, test } from 'vitest';

const api = createDirectus(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));

const file = await fs.readFile(join(import.meta.dirname, 'image.jpg'));
const blob = new Blob([file as BlobPart], { type: 'image/jpeg' });
const form = new FormData();
form.set('file', blob, 'image.jpg');

const upload = await api.request(uploadFiles(form));

test('resize to 50x50', async () => {
	const scaled = Buffer.from(
		await api.request(
			readAssetArrayBuffer(upload.id, {
				width: 50,
			}),
		),
	);

	await expect(scaled).toMatchFile(join(import.meta.dirname, 'img_50x50.jpg'));
});

test('quality of 10', async () => {
	const scaled = Buffer.from(
		await api.request(
			readAssetArrayBuffer(upload.id, {
				quality: 10,
			}),
		),
	);

	await expect(scaled).toMatchFile(join(import.meta.dirname, 'img_quality_10.jpg'));
});

test('format webp', async () => {
	const scaled = Buffer.from(
		await api.request(
			readAssetArrayBuffer(upload.id, {
				format: 'webp',
			}),
		),
	);

	await expect(scaled).toMatchFile(join(import.meta.dirname, 'img_format_webp.webp'));
});

test('transform grayscale', async () => {
	const scaled = Buffer.from(
		await api.request(
			readAssetArrayBuffer(upload.id, {
				transforms: [['grayscale']],
			}),
		),
	);

	await expect(scaled).toMatchFile(join(import.meta.dirname, 'img_grayscale.jpg'));
});
