import { createDirectus, readAssetArrayBuffer, rest, staticToken, uploadFiles } from '@directus/sdk';
import fs from 'fs/promises';
import { join } from 'path';
import { expect, inject, test } from 'vitest';

const api = createDirectus(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));

test('resize to 50x50', async () => {
	const file = await fs.readFile(join(import.meta.dirname, 'image.jpg'));
	const blob = new Blob([file as BlobPart], { type: 'image/jpeg' });
	const form = new FormData();
	form.set('file', blob, 'image.jpg');

	const upload = await api.request(uploadFiles(form));

	const scaled = Buffer.from(
		await api.request(
			readAssetArrayBuffer(upload.id, {
				width: 50,
			}),
		),
	);

	expect(scaled).toMatchFile(join(import.meta.dirname, 'img_50x50.jpg'));
});
