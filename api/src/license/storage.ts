import type { Knex } from 'knex';
import { getDatabase } from '../database/index.js';
import { decrypt, encrypt } from '../utils/encrypt.js';
import { getSecret } from '../utils/get-secret.js';
import type { LicenseStatus, LicenseTerminalStatus } from './types.js';

type LicenseStateUpdate = {
	license_token?: string | null;
	license_key?: string | null;
	license_key_hash?: string | null;
	license_status?: LicenseStatus | null;
	license_terminal_status?: LicenseTerminalStatus;
	license_grace_on?: string | Date | null;
	project_id?: string | null;
};

export async function readLicenseState(knex?: Knex) {
	const database = knex ?? getDatabase();

	return database
		.select(
			'license_token',
			'license_key',
			'license_key_hash',
			'license_status',
			'license_terminal_status',
			'license_grace_on',
			'project_id',
		)
		.from('directus_settings')
		.first();
}

export async function updateLicenseState(data: LicenseStateUpdate, knex?: Knex) {
	const database = knex ?? getDatabase();
	await database('directus_settings').update(data).where('id', 1);
}

export async function saveLicenseKey(licenseKey: string | null, knex?: Knex): Promise<void> {
	if (licenseKey === null) {
		await updateLicenseState({ license_key: null }, knex);
		return;
	}

	const secret = getSecret();
	const encrypted = await encrypt(licenseKey, secret);
	await updateLicenseState({ license_key: encrypted }, knex);
}

export async function saveLicenseToken(token: string | null, knex?: Knex): Promise<void> {
	if (token === null) {
		await updateLicenseState({ license_token: null }, knex);
		return;
	}

	const secret = getSecret();
	const encrypted = await encrypt(token, secret);
	await updateLicenseState({ license_token: encrypted }, knex);
}

export async function getLicenseToken(knex?: Knex): Promise<string | undefined> {
	const database = knex ?? getDatabase();
	const settingsRow = await database.select('license_token').from('directus_settings').first();
	const encryptedToken = settingsRow?.license_token;

	if (typeof encryptedToken !== 'string' || encryptedToken === '') {
		return undefined;
	}

	const secret = getSecret();
	return decrypt(encryptedToken, secret);
}
