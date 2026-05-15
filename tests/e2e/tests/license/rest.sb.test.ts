import { randomUUID } from 'crypto';
import {
	activateLicense,
	applyLicenseResolution,
	CORE_LICENSE,
	deactivateLicense,
	deleteLicenseAddon,
	generateLicensePendingResolution,
	previewLicense,
	readAddons,
	readLicense,
	readLicenseAddons,
	type ReadLicenseOutput,
	updateLicense,
	updateLicenseAddon,
} from '@directus/license';
import { createLicense } from '@directus/mock-license-server';
import { sandbox, type Sandbox } from '@directus/sandbox';
import {
	createCollection,
	createDirectus,
	createUser,
	type DirectusClient,
	readCollection,
	readMe,
	rest,
	type RestClient,
	staticToken,
	updateSettings,
} from '@directus/sdk';
import type { User } from '@directus/types';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { registerLicense } from './shared.js';

let directus: Sandbox;
let api: DirectusClient<any> & RestClient<any>;

const license = createLicense({ meta: { name: 'og-license' } });
const otherLicense = createLicense({ meta: { name: 'changed-license' } });

const restrictedLicense = createLicense({
	meta: { name: 'restricted-license' },
	entitlements: {
		collections: { limit: 1 },
		seats: { limit: 1 },
		custom_llms_enabled: { default: false },
	},
});

const seatsAddon = randomUUID();

const addonLicense = createLicense({
	meta: { name: 'addon-license' },
	entitlements: {
		seats: { limit: 1 },
	},
	addons: [
		{
			id: seatsAddon,
			active_quantity: 0,
			billing_interval: 'monthly',
			description: 'Alodda Seats addon',
			icon: 'group',
			min_quantity: 0,
			max_quantity: 10,
			name: 'Gimme more seats',
			pricing_summary: 'pay os som 💰',
			unit: 'seats',
			upgrade_required: false,
		},
	],
});

beforeAll(async () => {
	const devMode = process.env['NODE_ENV'] === 'development';

	directus = await sandbox(database, {
		dev: devMode,
		watch: devMode,
		prefix: database,
		env: {
			CACHE_SCHEMA: 'false',
			DB_FILENAME: `directus_test_${getUID()}.db`,
			LOG_LEVEL: 'debug',
		},
		extras: {
			license: true,
		},
		cache: false,
	});

	api = createDirectus<any>(`http://localhost:${directus.apis[0].port}`).with(rest()).with(staticToken('admin'));

	await registerLicense(directus.env.LICENSE_PORT, license);
	await registerLicense(directus.env.LICENSE_PORT, otherLicense);
	await registerLicense(directus.env.LICENSE_PORT, restrictedLicense);
	await registerLicense(directus.env.LICENSE_PORT, addonLicense);
});

afterAll(async () => {
	await directus.stop();
});

test('preview a license key', async () => {
	const result = await api.request(previewLicense({ license_key: license.key }));

	expect(result).toEqual({
		expires_at: license.meta.expires_at,
		plan_name: license.name,
		production_enabled: true,
	});
});

test('activate a license key', async () => {
	await api.request(activateLicense({ license_key: license.key }));

	const licenseInfo: ReadLicenseOutput = await api.request(readLicense());

	expect(licenseInfo.name).toEqual(license.meta.name);
	expect(licenseInfo.entitlements).toEqual(license.entitlements);
});

test('prevent activating key on project with existing license', async () => {
	await expect(api.request(activateLicense({ license_key: license.key }))).rejects.toThrowError(
		'A license was already activated',
	);
});

test('reading a license', async () => {
	const activeLicense = await api.request(readLicense());

	expect(activeLicense).toEqual({
		entitlements: license.entitlements,
		expires_at: license.meta.expires_at,
		grace_period: license.meta.grace_period,
		name: license.meta.name,
		offline: false,
		source: 'settings',
		status: 'active',
		usage: expect.any(Object),
	});
});

test('updating the license', async () => {
	await api.request(updateLicense({ license_key: otherLicense.key }));

	const licenseInfo: ReadLicenseOutput = await api.request(readLicense());

	expect(licenseInfo.name).toEqual(otherLicense.meta.name);
	expect(licenseInfo.entitlements).toEqual(otherLicense.entitlements);
});

test('reading the other license', async () => {
	const activeLicense = await api.request(readLicense());

	expect(activeLicense).toEqual({
		entitlements: otherLicense.entitlements,
		expires_at: otherLicense.meta.expires_at,
		grace_period: otherLicense.meta.grace_period,
		name: otherLicense.meta.name,
		offline: false,
		source: 'settings',
		status: 'active',
		usage: expect.any(Object),
	});
});

test('deactivate the license', async () => {
	await api.request(deactivateLicense());

	const activeLicense = await api.request(readLicense());

	expect(activeLicense).toEqual({
		entitlements: CORE_LICENSE.entitlements,
		expires_at: CORE_LICENSE.meta.expires_at,
		grace_period: CORE_LICENSE.meta.grace_period,
		name: CORE_LICENSE.meta.name,
		offline: true,
		source: 'settings',
		status: 'active',
		usage: expect.any(Object),
	});
});

test('check resolution with no conflicts', async () => {
	const result = await api.request(generateLicensePendingResolution());

	expect(result).toEqual([]);
});

let newUser: User | undefined;

test('check resolution with conflicts', async () => {
	await api.request(createCollection({ collection: 'A', meta: {}, schema: {} }));
	await api.request(createCollection({ collection: 'B', meta: {}, schema: {} }));

	const admin = await api.request(readMe());

	newUser = await api.request(
		createUser({
			first_name: 'John',
			last_name: 'Doe',
			email: 'test@example.com',
			password: 'pw',
			status: 'active',
			role: admin['role'],
		}) as any,
	);

	// Activate license that is more restrictive than core
	await api.request(activateLicense({ license_key: restrictedLicense.key }));

	await api.request(updateSettings({ ai_openai_compatible_api_key: 'test' }));

	const result = await api.request(generateLicensePendingResolution());

	expect(result).toEqual([
		{
			candidates: [
				{
					admin: true,
					avatar: null,
					first_name: 'John',
					id: newUser!.id,
					last_name: 'Doe',
				},
			],
			key: 'seats',
			kind: 'limit',
			limit: 1,
			usage: 2,
		},
		{
			candidates: ['A', 'B'],
			key: 'collections',
			kind: 'limit',
			limit: 1,
			usage: 2,
		},
		{
			key: 'custom_llms_enabled',
			kind: 'feature_gate',
		},
	]);
});

test('partially resolve conflicts', async () => {
	await api.request(applyLicenseResolution({ collections: ['B'] }));

	const result = await api.request(generateLicensePendingResolution());

	expect(result).toEqual([
		{
			candidates: [
				{
					admin: true,
					avatar: null,
					first_name: 'John',
					id: newUser!.id,
					last_name: 'Doe',
				},
			],
			key: 'seats',
			kind: 'limit',
			limit: 1,
			usage: 2,
		},
		{
			key: 'custom_llms_enabled',
			kind: 'feature_gate',
		},
	]);

	const collectionA = await api.request(readCollection('A'));
	const collectionB = await api.request(readCollection('B'));

	expect(collectionA).toMatchObject({
		collection: 'A',
		meta: {
			status: 'active',
		},
	});

	expect(collectionB).toMatchObject({
		collection: 'B',
		meta: {
			status: 'inactive',
		},
	});
});

test('fully resolve conflicts', async () => {
	await api.request(applyLicenseResolution({ seats: [newUser!.id] }));

	await api.request(updateSettings({ ai_openai_compatible_api_key: null }));

	const result = await api.request(generateLicensePendingResolution());

	expect(result).toEqual([]);
});

test('read addons where none are available', async () => {
	const result = await api.request(readLicenseAddons());

	expect(result).toEqual([]);
});

test('read addons', async () => {
	await api.request(updateLicense({ license_key: addonLicense.key }));

	const result = await api.request(readLicenseAddons());

	expect(result).toEqual([
		{
			active_quantity: 0,
			description: 'Alodda Seats addon',
			icon: 'group',
			id: seatsAddon,
			max_quantity: 10,
			min_quantity: 0,
			name: 'Gimme more seats',
			pricing_summary: 'pay os som 💰',
			upgrade_required: false,
		},
	]);
});

test('increase an addons quantity', async () => {
	await api.request(updateLicenseAddon(seatsAddon, { quantity: 2 }));

	const activeLicense = await api.request(readLicense());

	const result = await api.request(readLicenseAddons());

	expect(result).toMatchObject([
		{
			active_quantity: 2,
		},
	]);

	expect(activeLicense).toMatchObject({
		entitlements: {
			seats: {
				limit: 3,
				addon: 2,
			},
		},
	});
});

test('decrease an addons quantity', async () => {
	await api.request(updateLicenseAddon(seatsAddon, { quantity: 1 }));

	const activeLicense = await api.request(readLicense());

	const result = await api.request(readLicenseAddons());

	expect(result).toMatchObject([
		{
			active_quantity: 1,
		},
	]);

	expect(activeLicense).toMatchObject({
		entitlements: {
			seats: {
				limit: 2,
				addon: 1,
			},
		},
	});
});

test('delete an addon', async () => {
	await api.request(deleteLicenseAddon(seatsAddon));

	const activeLicense = await api.request(readLicense());

	const result = await api.request(readLicenseAddons());

	expect(result).toMatchObject([
		{
			active_quantity: 0,
		},
	]);

	// Limit will be updated at the next billing cycle.
	expect(activeLicense).toMatchObject({
		entitlements: {
			seats: {
				limit: 2,
			},
		},
	});
});
