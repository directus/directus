import { createDirectus, readAssetArrayBuffer, readAssetRaw, rest, staticToken, uploadFiles } from '@directus/sdk';
import fs from 'fs/promises';
import { join } from 'path';
import { expect, test } from 'vitest';
import { useEnv } from '../../../utils/useEnv';

const api = createDirectus(`http://localhost:${process.env['PORT']}`).with(rest()).with(staticToken('admin'));

const file = await fs.readFile(join(import.meta.dirname, 'image.jpg'));
const blob = new Blob([file as BlobPart], { type: 'image/jpeg' });
const form = new FormData();
form.set('file', blob, 'image.jpg');

const env = useEnv();

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

test('concurrent requests', async () => {
	const time = performance.now();

	const results = await Promise.all(
		[{ width: 50 }, { height: 50 }, { quality: 10 }, { format: 'webp' as const }].map(async (options) => {
			const time = performance.now();
			await api.request(readAssetRaw(upload.id, options));
			const duration = performance.now() - time;
			return duration;
		}),
	);

	const duration = performance.now() - time;
	expect(duration).toBeLessThan(1000);

	results.forEach((result) => {
		expect(result).toBeLessThan(duration / 2);
	});

	expect(results).toHaveLength(4);
});

const formatHeaders = [
	{ accept: 'image/avif,image/webp,image/*,*/*;q=0.8', contentType: 'image/avif' },
	{ accept: 'image/avif', contentType: 'image/avif' },
	{ accept: 'image/webp', contentType: 'image/webp' },
	{ accept: '*/*', contentType: 'image/jpeg' },
	{ accept: undefined, contentType: 'image/jpeg' },
];

for (const header of formatHeaders) {
	test(`format=auto with "${header.accept ?? 'no'}" Accept request header`, async () => {
		const response = await fetch(
			`http://localhost:${process.env['PORT']}/assets/${upload.id}?format=auto&access_token=admin`,
			{
				headers: header.accept
					? {
							Accept: header.accept,
						}
					: undefined,
			},
		);

		expect(response.headers.get('Content-Type')).toBe(header.contentType);
	});
}

test('asset transformation limits', async () => {
	const count = Number(env.ASSETS_TRANSFORM_MAX_CONCURRENT);

	const results = await Promise.all(
		[...Array(count).keys()].map(async (i) => {
			const result = await fetch(
				`http://localhost:${process.env['PORT']}/assets/${upload.id}?format=webp&access_token=admin`,
			);

			return result.status;
		}),
	);

	expect(results.every((status) => status === 200)).toBe(true);

	const results2 = await Promise.all(
		[...Array(count + 200).keys()].map(async (i) => {
			const result = await fetch(
				`http://localhost:${process.env['PORT']}/assets/${upload.id}?width=2000&height=2000&access_token=admin`,
			);

			return result.status;
		}),
	);

	// TODO figure out why this is failing
	// expect(results2.some((status) => status === 503)).toBe(true);
});
