import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	const panels = await knex('directus_panels').where('type', '=', 'metric').select();

	for (const panel of panels) {
		let options = panel.options;

		// Check if the options are stringified and parse them
		const wasStringified = typeof options === 'string';
		if (wasStringified) {
			options = JSON.parse(options);
		}

		let needsUpdate = false;

		// Check and update abbreviate -> notation
		if (options && options.abbreviate === true) {
			options.notation = 'compact';
			delete options.abbreviate;
			needsUpdate = true;
		}

		// Check and update decimals -> minimumFractionDigits and maximumFractionDigits
		if (options && typeof options.decimals === 'number') {
			options.minimumFractionDigits = options.decimals;
			options.maximumFractionDigits = options.decimals;
			delete options.decimals;
			needsUpdate = true;
		}

		// Convert the options back to string if they were stringified initially
		if (wasStringified) {
			options = JSON.stringify(options);
		}

		// Update the row with modified options if necessary
		if (needsUpdate) {
			await knex('directus_panels').update({ options }).where('id', panel.id);
		}
	}
}

export async function down(knex: Knex): Promise<void> {
	const panels = await knex('directus_panels').where('type', '=', 'metric').select();

	for (const panel of panels) {
		let options = panel.options;

		// Check if the options are stringified and parse them
		const wasStringified = typeof options === 'string';
		if (wasStringified) {
			options = JSON.parse(options);
		}

		let needsUpdate = false;

		// Revert notation -> abbreviate
		if (options && options.notation === 'compact') {
			options.abbreviate = true;
			delete options.notation;
			needsUpdate = true;
		}

		// Revert minimumFractionDigits and maximumFractionDigits -> decimals
		if (
			options &&
			typeof options.minimumFractionDigits === 'number' &&
			options.minimumFractionDigits === options.maximumFractionDigits
		) {
			options.decimals = options.minimumFractionDigits;
			delete options.minimumFractionDigits;
			delete options.maximumFractionDigits;
			needsUpdate = true;
		}

		// Convert the options back to string if they were stringified initially
		if (wasStringified) {
			options = JSON.stringify(options);
		}

		// Update the row with reverted options if necessary
		if (needsUpdate) {
			await knex('directus_panels').update({ options }).where('id', panel.id);
		}
	}
}
