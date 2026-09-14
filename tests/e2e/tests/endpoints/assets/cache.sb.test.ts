import fs from 'fs/promises';
import { join } from 'path';
import { type sandbox as Sandbox, sandbox } from '@directus/sandbox';
import { createDirectus, readFile, rest, staticToken, uploadFiles } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const png = await fs.readFile(join(import.meta.dirname, 'directus.png'));
const avif = await fs.readFile(join(import.meta.dirname, 'directus.avif'));

/**
 * `ASSETS_CACHE_REVALIDATE` turns the asset cache from "trust it for a while" into "ask every
 * time", which changes both the Cache-Control it sends and whether it answers a conditional
 * request with a 304.
 */
const CONFIGS = [
	{ name: 'revalidation on', revalidate: true },
	{ name: 'revalidation off', revalidate: false },
] as const;

for (const { name, revalidate } of CONFIGS) {
	describe(`assets with ${name}`, () => {
		let directus: Awaited<ReturnType<typeof Sandbox>>;
		let url: string;
		let api: ReturnType<typeof createDirectus<any>> & any;

		beforeAll(async () => {
			directus = await sandbox(database, {
				inspect: false,
				prefix: `assets-cache-${revalidate}`,
				port: sandboxPort(CONFIGS.findIndex((config) => config.revalidate === revalidate)),
				env: {
					...(revalidate ? { ASSETS_CACHE_REVALIDATE: 'true' } : { ASSETS_CACHE_TTL: '1h' }),
					DB_FILENAME: `directus_test_${getUID()}_${revalidate}.db`,
				},
				docker: { suffix: `${getUID()}${revalidate}` },
			});

			url = `http://localhost:${directus.apis[0]!.port}`;
			api = createDirectus<any>(url).with(rest()).with(staticToken('admin'));
		}, 120_000);

		afterAll(async () => {
			await directus.stop();
		});

		/** Uploads the fixture and returns its id. */
		async function uploadPng() {
			const form = new FormData();
			form.set('storage', 'local');
			form.set('file', new Blob([png], { type: 'image/png' }), 'directus.png');

			const file = await api.request(uploadFiles(form));

			return { id: file.id as string };
		}

		const get = (id: string, headers: Record<string, string> = {}) =>
			fetch(`${url}/assets/${id}?access_token=admin`, { headers });

		if (revalidate) {
			test('the response asks the client to revalidate, and carries an ETag for the file version', async () => {
				const { id } = await uploadPng();

				const response = await get(id);

				expect(response.status).toBe(200);
				expect(response.headers.get('cache-control')).toBe('max-age=0, must-revalidate');

				// The ETag is the file's modified_on as unix seconds, which Last-Modified spells out
				const etag = response.headers.get('etag')!;
				const lastModified = response.headers.get('last-modified')!;

				expect(etag).toMatch(/^"\d+"$/);
				expect(new Date(lastModified).getTime() / 1000).toBe(Number(etag.slice(1, -1)));
			});

			test('a matching If-None-Match is answered with 304', async () => {
				const { id } = await uploadPng();

				const etag = (await get(id)).headers.get('etag')!;

				const response = await get(id, { 'If-None-Match': etag });

				expect(response.status).toBe(304);
				expect(await response.text()).toBe('');
			});

			test('an If-Modified-Since after the file changed is answered with 304', async () => {
				const { id } = await uploadPng();

				const lastModified = (await get(id)).headers.get('last-modified')!;

				expect((await get(id, { 'If-Modified-Since': lastModified })).status).toBe(304);
			});

			test('replacing the file gives it a new ETag', async () => {
				const { id } = await uploadPng();

				const first = await get(id);
				const oldEtag = first.headers.get('etag')!;
				const oldLastModified = first.headers.get('last-modified')!;

				// The ETag has a resolution of a second, so the replacement has to land in the next one
				await new Promise((resolve) => setTimeout(resolve, 1000));

				const replacement = new FormData();
				replacement.set('file', new Blob([avif], { type: 'image/avif' }), 'directus.avif');

				await fetch(`${url}/files/${id}`, {
					method: 'PATCH',
					headers: { Authorization: 'Bearer admin' },
					body: replacement,
				});

				expect(await api.request(readFile(id))).toBeDefined();

				const response = await get(id, { 'If-None-Match': oldEtag });

				expect(response.status).toBe(200);
				expect(response.headers.get('etag')).not.toBe(oldEtag);
				expect(response.headers.get('last-modified')).not.toBe(oldLastModified);
			});
		} else {
			test('the response may be cached for the configured lifetime without revalidating', async () => {
				const { id } = await uploadPng();

				const response = await get(id);

				expect(response.status).toBe(200);
				expect(response.headers.get('cache-control')).toContain('max-age=3600');
				expect(response.headers.get('cache-control')).not.toContain('must-revalidate');
			});

			test('a conditional request is answered with the full body anyway', async () => {
				const { id } = await uploadPng();

				const etag = (await get(id)).headers.get('etag')!;

				expect((await get(id, { 'If-None-Match': etag })).status).toBe(200);
			});
		}
	});
}
