import type { Knex } from 'knex';

export async function up(knex: Knex) {
	const panels = await knex('directus_panels').where('type', '=', 'metric').select();

	const updates: Promise<number>[] = [];

	for (const panel of panels) {
		let options = panel.options;

		// Check if the options are stringified and parse them
		const wasStringified = typeof options === 'string';

		if (wasStringified) {
			options = JSON.parse(options);
		}

		// Not expected, just to be on the safe side
		if (!options) continue;

		let needsUpdate = false;

		// Check and update abbreviate -> notation
		if (options.abbreviate === true) {
			options.notation = 'compact';
			delete options.abbreviate;
			needsUpdate = true;
		}

		// Check and update decimals -> minimumFractionDigits and maximumFractionDigits
		if (typeof options.decimals === 'number') {
			options.minimumFractionDigits = options.decimals;
			options.maximumFractionDigits = options.decimals;
			delete options.decimals;
			needsUpdate = true;
		}

		// Update the row with modified options if necessary
		if (needsUpdate) {
			// Convert the options back to string if they were stringified initially
			if (wasStringified) {
				options = JSON.stringify(options);
			}

			updates.push(knex('directus_panels').update({ options }).where('id', panel.id));
		}
	}

	return Promise.all(updates);
}

export async function down(knex: Knex) {
	const panels = await knex('directus_panels').where('type', '=', 'metric').select();

	const updates: Promise<number>[] = [];

	for (const panel of panels) {
		let options = panel.options;

		// Check if the options are stringified and parse them
		const wasStringified = typeof options === 'string';

		if (wasStringified) {
			options = JSON.parse(options);
		}

		// Not expected, just to be on the safe side
		if (!options) continue;

		let needsUpdate = false;

		// Revert notation -> abbreviate
		if (options.notation === 'compact') {
			options.abbreviate = true;
			delete options.notation;
			needsUpdate = true;
		}

		// Revert minimumFractionDigits and maximumFractionDigits -> decimals
		if (
			typeof options.minimumFractionDigits === 'number' &&
			options.minimumFractionDigits === options.maximumFractionDigits
		) {
			options.decimals = options.minimumFractionDigits;
			delete options.minimumFractionDigits;
			delete options.maximumFractionDigits;
			needsUpdate = true;
		}

		// Update the row with reverted options if necessary
		if (needsUpdate) {
			// Convert the options back to string if they were stringified initially
			if (wasStringified) {
				options = JSON.stringify(options);
			}

			updates.push(knex('directus_panels').update({ options }).where('id', panel.id));
		}
	}

	return Promise.all(updates);
}
