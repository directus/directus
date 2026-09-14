import fs from 'fs/promises';
import { join } from 'path';
import { sandbox } from '@directus/sandbox';
import { createDirectus, rest, staticToken, uploadFiles } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { afterAll, expect, test } from 'vitest';

/** How many transforms the instance will run at once before turning requests away. */
const MAX_CONCURRENT = 2;

const directus = await sandbox(database, {
	inspect: false,
	prefix: 'assets-limits',
	port: sandboxPort(),
	env: {
		ASSETS_TRANSFORM_MAX_CONCURRENT: String(MAX_CONCURRENT),
		DB_FILENAME: `directus_test_${getUID()}.db`,
	},
	docker: { suffix: getUID() },
});

const url = `http://localhost:${directus.apis[0]!.port}`;
const api = createDirectus<any>(url).with(rest()).with(staticToken('admin'));

afterAll(async () => {
	await directus.stop();
});

const png = await fs.readFile(join(import.meta.dirname, 'directus.png'));

const form = new FormData();
form.set('storage', 'local');
form.set('file', new Blob([png], { type: 'image/png' }), 'directus.png');

const { id } = await api.request(uploadFiles(form));

/** Each request asks for a different size, so none of them can be served from cache. */
function transforms(count: number) {
	return Array.from({ length: count }, (_, index) =>
		fetch(`${url}/assets/${id}?width=${1000 + index}&height=${1000 + index}&access_token=admin`),
	);
}

test('transforms up to the concurrency limit all succeed', { timeout: 60_000 }, async () => {
	const responses = await Promise.all(transforms(MAX_CONCURRENT));

	expect(responses.map((response) => response.status)).toEqual(Array.from({ length: MAX_CONCURRENT }, () => 200));
});

test('transforms over the concurrency limit are turned away', { timeout: 120_000 }, async () => {
	const attempts = 100;

	const responses = await Promise.all(transforms(attempts));

	const statuses = responses.map((response) => response.status);
	const unavailable = statuses.filter((status) => status === 503).length;

	expect(unavailable).toBeGreaterThanOrEqual(1);
	expect(statuses.filter((status) => status === 200).length).toBe(attempts - unavailable);
});
