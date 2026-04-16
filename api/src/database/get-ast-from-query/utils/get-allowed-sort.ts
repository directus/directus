import type { Accountability, Query, Relation } from '@directus/types';
import { fetchAllowedFields } from '../../../permissions/modules/fetch-allowed-fields/fetch-allowed-fields.js';
import type { Context } from '../../../permissions/types.js';

export type GetAllowedSortFieldOptions = {
	collection: string;
	accountability: Accountability | null;
	query?: Query;
	relation?: Relation;
};

// Field types that cannot be used as a sort column at the database level.
// Picking one of these as a fallback sort causes the database to throw
// (e.g. PostgreSQL "could not identify an ordering operator for type json").
const NON_SORTABLE_TYPES = ['json', 'alias'];

export async function getAllowedSort(options: GetAllowedSortFieldOptions, context: Context) {
	// We'll default to the primary key for the standard sort output
	let sortField: string | null = context.schema.collections[options.collection]!.primary;

	// If a custom manual sort field is configured, use that
	if (context.schema.collections[options.collection]?.sortField) {
		sortField = context.schema.collections[options.collection]!.sortField as string;
	}

	// If a sort field is defined on the relation, use that
	if (options.relation?.meta?.sort_field) {
		sortField = options.relation.meta.sort_field;
	}

	if (options.accountability && options.accountability.admin === false) {
		// Verify that the user has access to the sort field
		const permissionBasedAllowedFields = await fetchAllowedFields(
			{
				collection: options.collection,
				action: 'read',
				accountability: options.accountability,
			},
			context,
		);

		// Exclude non-sortable field types from fallback candidates so we don't
		// pick e.g. a JSON field and cause the database to error on sort.
		const collectionFields = context.schema.collections[options.collection]?.fields ?? {};

		const allowedFields = permissionBasedAllowedFields.filter((field) => {
			if (field === '*') return true;
			const fieldInfo = collectionFields[field];
			if (!fieldInfo) return true;
			return !NON_SORTABLE_TYPES.includes(fieldInfo.type);
		});

		if (allowedFields.length === 0) {
			sortField = null;
		} else if (allowedFields.includes('*') === false && allowedFields.includes(sortField) === false) {
			// If the sort field is not allowed, default to the first allowed field
			sortField = allowedFields[0]!;
		}
	}

	// When group by is used, default to the first column provided in the group by clause
	if (options.query?.group?.[0]) {
		sortField = options.query.group[0];
	}

	if (sortField) return [sortField];
	return null;
}
