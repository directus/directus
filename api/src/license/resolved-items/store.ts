import type { LicenseResolvedItems } from '@directus/types';
import { getDatabase, getDatabaseClient } from '../../database/index.js';
import { SettingsService } from '../../services/settings.js';
import { getSchema } from '../../utils/get-schema.js';
import { transaction } from '../../utils/transaction.js';

export async function readResolvedItems(): Promise<LicenseResolvedItems | null> {
	const settingsService = new SettingsService({ schema: await getSchema(), accountability: null });
	const { resolved_items } = await settingsService.readSingleton({ fields: ['resolved_items'] });

	return resolved_items ?? null;
}

// Not runExclusive: waiting callers get the leader's result and never run their own fn
export async function updateResolvedItems(
	fn: (current: LicenseResolvedItems | null) => LicenseResolvedItems,
): Promise<LicenseResolvedItems> {
	const schema = await getSchema();

	return transaction(getDatabase(), async (trx) => {
		// SQLite serializes writers already and has no row locks
		if (getDatabaseClient(trx) !== 'sqlite') {
			// No first()/limit(): Oracle rejects FOR UPDATE inside the subquery they produce
			await trx('directus_settings').select('id').forUpdate();
		}

		const settingsService = new SettingsService({ schema, knex: trx, accountability: null });
		const { resolved_items } = await settingsService.readSingleton({ fields: ['resolved_items'] });

		const next = fn(resolved_items ?? null);

		await settingsService.upsertSingleton({ resolved_items: next });

		return next;
	});
}
