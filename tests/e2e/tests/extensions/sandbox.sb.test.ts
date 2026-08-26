import { fileURLToPath } from 'node:url';
import { sandbox } from '@directus/sandbox';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

/**
 * End-to-end coverage for the isolated-vm based API extension sandbox.
 *
 * Loads a real sandboxed endpoint extension into a booted Directus instance and drives it over
 * HTTP. This exercises the host<->isolate bridging in `api/src/extensions/lib/sandbox`
 * (instantiateSandboxSdk, generateApiExtensionsSandboxEntrypoint, callReference and the SDK host
 * functions), which is the surface most at risk across an isolated-vm major upgrade and was
 * previously untested.
 */

const extensionsPath = fileURLToPath(new URL('./__fixtures__/extensions', import.meta.url));

describe('isolated-vm extension sandbox', () => {
	let directus: Awaited<ReturnType<typeof sandbox>>;
	let baseUrl: string;

	beforeAll(async () => {
		directus = await sandbox(database, {
			env: {
				DB_FILENAME: `directus_test_${getUID()}.db`,
				EXTENSIONS_PATH: extensionsPath,
				// Generous headroom over the 1000ms default so the bridging round-trip isn't
				// timed out under load in CI.
				EXTENSIONS_SANDBOX_TIMEOUT: '10000',
				EXTENSIONS_SANDBOX_MEMORY: '100',
			},
		});

		baseUrl = `http://localhost:${directus.apis[0].port}`;
	}, 120_000);

	afterAll(async () => {
		if (directus) await directus.stop();
	});

	test('runs a sandboxed endpoint and bridges the log + sleep host functions', async () => {
		const res = await fetch(`${baseUrl}/sandboxed-endpoint/ping?greeting=hi`);

		expect(res.status).toBe(200);

		const body = JSON.parse(await res.text());

		expect(body).toMatchObject({ ok: true });
		expect(body.url).toContain('greeting=hi');
	});

	test('denies a host function for a scope the extension did not request', async () => {
		const res = await fetch(`${baseUrl}/sandboxed-endpoint/forbidden`);

		// The `request` scope was not granted, so the call throws inside the isolate and the
		// error propagates back across the boundary as a failed response.
		expect(res.status).toBeGreaterThanOrEqual(400);
	});
});
