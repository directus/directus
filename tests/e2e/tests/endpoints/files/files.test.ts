import { createDirectus, readAssetArrayBuffer, readFile, rest, staticToken, uploadFiles } from '@directus/sdk';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import { join } from 'path';
import { expect, test } from 'vitest';
import { UUID } from '../../../utils/regex';

const api = createDirectus(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));

test('upload a file', async () => {
	const file = await fs.readFile(join(import.meta.dirname, 'image.jpg'));
	const blob = new Blob([file as BlobPart], { type: 'image/jpg' });
	const form = new FormData();
	form.set('file', blob, 'image.jpg');

	const upload = await api.request(uploadFiles(form));
	const read = await api.request(readAssetArrayBuffer(upload.id));

	const originalHash = createHash('sha256').update(file).digest('hex');
	const uploadHash = createHash('sha256').update(Buffer.from(read)).digest('hex');

	expect(originalHash).toEqual(uploadHash);

	const fileInfo = await api.request(readFile(upload.id));

	expect(fileInfo).toMatchObject({
		filename_disk: expect.toSatisfy(UUID),
		filename_download: 'image.jpg',
		filesize: expect.toSatisfy((val) => String(val) === '41274'),
		id: upload.id,
		storage: 'local',
		title: 'Image',
		type: 'image/jpg',
	});
});
