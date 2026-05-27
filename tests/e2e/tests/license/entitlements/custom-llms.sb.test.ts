import { activateLicense, deactivateLicense } from '@directus/license';
import { createLicense, mockClient } from '@directus/mock-license-server';
import { sandbox, type Sandbox } from '@directus/sandbox';
import {
	createDirectus,
	type DirectusClient,
	readSettings,
	rest,
	type RestClient,
	staticToken,
	updateSettings,
} from '@directus/sdk';
import { database } from '@utils/constants.js';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createSandboxOptions } from '../shared.js';

const unlimitedLicense = createLicense({
	meta: { name: 'unlimited' },
	entitlements: { custom_llms_enabled: { default: true } },
});

describe('custom_llms_enabled', () => {
	let directus: Sandbox;
	let api: DirectusClient<unknown> & RestClient<unknown>;

	beforeAll(async () => {
		directus = await sandbox(
			database,
			createSandboxOptions({
				extras: { license: true },
				knex: true,
				hooks: {
					beforeApi: async ({ env }) => {
						const base = `http://localhost:${env.LICENSE_PORT}`;
						await mockClient.registerLicense(base, unlimitedLicense);
					},
				},
			}),
		);

		api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));
	});

	afterAll(async () => {
		await directus?.stop();
	});

	describe('custom_llms_enabled=false', () => {
		test('PATCH /settings with custom llm field rejects with RESOURCE_RESTRICTED', async () => {
			await expect(api.request(updateSettings({ ai_openai_compatible_name: 'test-provider' }))).rejects.toMatchObject({
				errors: [
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: 'RESOURCE_RESTRICTED',
							category: 'custom_llms_enabled',
						}),
					}),
				],
			});
		});

		test('GET /settings strips custom llm fields', async () => {
			await directus.knex!('directus_settings').update({ ai_openai_compatible_name: 'test-provider' });

			const settings = await api.request(readSettings());

			expect(settings['ai_openai_compatible_name']).toBeNull();
		});

		test('PATCH /settings of unrelated field succeeds', async () => {
			const descriptor = `gate-negative-control-${Date.now()}`;

			const response = await api.request(updateSettings({ project_descriptor: descriptor }));

			expect(response).toEqual(expect.objectContaining({ project_descriptor: descriptor }));
		});

		test('PATCH /settings with mixed allowed + restricted fields rejects', async () => {
			const attempted = `gate-mixed-attempted-${Date.now()}`;

			await expect(
				api.request(
					updateSettings({
						project_descriptor: attempted,
						ai_openai_compatible_api_key: 'sk-test',
					} as any),
				),
			).rejects.toMatchObject({
				errors: [
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: 'RESOURCE_RESTRICTED',
							category: 'custom_llms_enabled',
						}),
					}),
				],
			});
		});
	});

	describe('custom_llms_enabled=true', () => {
		beforeAll(async () => {
			await api.request(activateLicense({ license_key: unlimitedLicense.key }));
		});

		afterAll(async () => {
			await api.request(deactivateLicense());
		});

		test('PATCH /settings with custom llm fields succeeds', async () => {
			await expect(api.request(updateSettings({ ai_openai_compatible_name: 'test-provider' }))).resolves.not.toThrow();
		});

		test('GET /settings does NOT strip custom llm fields', async () => {
			await api.request(updateSettings({ ai_openai_compatible_name: 'test-provider' }));

			const settings = await api.request(readSettings());

			expect(settings['ai_openai_compatible_name']).toEqual('test-provider');
		});
	});
});
