import type { Filter, LogicalFilterAND } from '@directus/types';
import { parseJSON } from '@directus/utils';
import type { Knex } from 'knex';

type OldFilter = {
	key: string;
	field: string;
	value: any;
	operator: string;
};

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_presets', (table) => {
		table.json('filter');
	});

	const presets = await knex
		.select<
			{ id: number; filters: string | OldFilter[]; layout_query: string | Record<string, any> }[]
		>('id', 'filters', 'layout_query')
		.from('directus_presets');

	for (const preset of presets) {
		if (preset.filters) {
			const oldFilters: OldFilter[] =
				(typeof preset.filters === 'string' ? parseJSON(preset.filters) : preset.filters) ?? [];

			if (oldFilters.length === 0) continue;

			const newFilter: Filter = {
				_and: [],
			};

			for (const oldFilter of oldFilters) {
				if (oldFilter.key === 'hide-archived') continue;

				newFilter._and.push({
					[oldFilter.field]: {
						['_' + oldFilter.operator]: oldFilter.value,
					},
				});
			}

			if (newFilter._and.length > 0) {
				await knex('directus_presets')
					.update({ filter: JSON.stringify(newFilter) })
					.where('id', '=', preset.id);
			}
		}

		if (preset.layout_query) {
			const layoutQuery: Record<string, any> =
				typeof preset.layout_query === 'string' ? parseJSON(preset.layout_query) : preset.layout_query;

			for (const [layout, query] of Object.entries(layoutQuery)) {
				if (query.sort) {
					query.sort = [query.sort];
				}

				layoutQuery[layout] = query;
			}

			await knex('directus_presets')
				.update({ layout_query: JSON.stringify(layoutQuery) })
				.where('id', '=', preset.id);
		}
	}

	await knex.schema.alterTable('directus_presets', (table) => {
		table.dropColumn('filters');
	});
}

export async function down(knex: Knex): Promise<void> {
	const { nanoid } = await import('nanoid');

	await knex.schema.alterTable('directus_presets', (table) => {
		table.json('filters');
	});

	const presets = await knex
		.select<
			{ id: number; filter: string | OldFilter[]; layout_query: string | Record<string, any> }[]
		>('id', 'filter', 'layout_query')
		.from('directus_presets');

	for (const preset of presets) {
		if (preset.filter) {
			const newFilter: LogicalFilterAND =
				(typeof preset.filter === 'string' ? parseJSON(preset.filter) : preset.filter) ?? {};

			if (Object.keys(newFilter).length === 0) continue;

			const oldFilters: OldFilter[] = [];

			for (const filter of newFilter._and ?? []) {
				const field = Object.keys(filter)?.[0];
				const operator = Object.keys(Object.values(filter)?.[0] ?? {})?.[0];
				const value = Object.values(Object.values(filter)?.[0] ?? {})?.[0];

				if (!field || !operator || !value) continue;

				oldFilters.push({
					key: nanoid(),
					field,
					operator: operator.substring(1),
					value,
				});
			}

			if (oldFilters.length > 0) {
				await knex('directus_presets')
					.update({ filters: JSON.stringify(oldFilters) })
					.where('id', '=', preset.id);
			}
		}

		if (preset.layout_query) {
			const layoutQuery: Record<string, any> =
				typeof preset.layout_query === 'string' ? parseJSON(preset.layout_query) : preset.layout_query;

			for (const [layout, query] of Object.entries(layoutQuery)) {
				if (query.sort && Array.isArray(query.sort)) {
					query.sort = query.sort?.[0] ?? null;
				}

				layoutQuery[layout] = query;
			}

			await knex('directus_presets')
				.update({ layout_query: JSON.stringify(layoutQuery) })
				.where('id', '=', preset.id);
		}
	}

	await knex.schema.alterTable('directus_presets', (table) => {
		table.dropColumn('filter');
	});
}
