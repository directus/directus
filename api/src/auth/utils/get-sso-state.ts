import { toBoolean } from '@directus/utils';
import type { Knex } from 'knex';
import getDatabase from '../../database/index.js';
import { getLicenseEntitlements } from '../../license/summary.js';

type SSOState = {
	enabled: boolean;
	disabled: boolean;
	transitional: boolean;
};

export async function getSSOState(knexArg?: Knex): Promise<SSOState> {
	const knex = knexArg ?? getDatabase();

	const [entitlements, settings] = await Promise.all([
		getLicenseEntitlements(knex),
		knex.select('sso_disabled').from('directus_settings').first(),
	]);

	const enabled = entitlements.sso_enabled === true;
	const disabled = toBoolean(settings?.['sso_disabled']);

	return {
		enabled,
		disabled,
		transitional: enabled === false && disabled === false,
	};
}
