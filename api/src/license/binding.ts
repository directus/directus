import type { Knex } from 'knex';
import { getLicenseKeyState } from './get-key.js';
import { readLicenseState, updateLicenseState } from './storage.js';
import type { LicenseSource, LicenseStatus, LicenseTerminalStatus } from './types.js';

type CurrentLicenseBinding = {
	licenseKey: string | undefined;
	source: LicenseSource;
	durableStatus: LicenseStatus | null;
	terminal: LicenseTerminalStatus;
	storedKeyHash: string | null;
	storedProjectId: string | null;
	graceOn: string | Date | null;
};

export async function getCurrentLicenseBinding(knex?: Knex): Promise<CurrentLicenseBinding> {
	const [{ licenseKey, source }, storedState] = await Promise.all([getLicenseKeyState(knex), readLicenseState(knex)]);
	const durableStatus = storedState?.license_status;
	const terminal = storedState?.license_terminal_status;

	return {
		licenseKey,
		source,
		durableStatus:
			durableStatus === 'inactive' || durableStatus === 'active' || durableStatus === 'deactivated'
				? durableStatus
				: null,
		terminal: terminal === 'canceled' || terminal === 'expired' ? terminal : null,
		storedKeyHash: storedState?.license_key_hash ?? null,
		storedProjectId: storedState?.project_id ?? null,
		graceOn: storedState?.license_grace_on ?? null,
	};
}

export async function clearLicenseState(data?: { licenseStatus?: LicenseStatus }, knex?: Knex) {
	await updateLicenseState(
		{
			license_token: null,
			license_key: null,
			license_key_hash: null,
			license_status: data?.licenseStatus ?? 'inactive',
			license_terminal_status: null,
			license_grace_on: null,
		},
		knex,
	);
}
