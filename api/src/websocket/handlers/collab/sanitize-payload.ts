import type { Accountability, Permission, SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { fetchPermissions } from '../../../permissions/lib/fetch-permissions.js';
import { fetchPolicies } from '../../../permissions/lib/fetch-policies.js';
import { asyncDeepMapWithSchema } from '../../../utils/versioning/deep-map-with-schema.js';
import { isEmpty } from 'lodash-es';
import { getService } from '../../../utils/get-service.js';

export async function sanitizePayload(
	collection: string,
	payload: Record<string, unknown>,
	ctx: { knex: Knex; schema: SchemaOverview; accountability: Accountability },
) {
	const { accountability, schema } = ctx;
	const policies = await fetchPolicies(accountability, { knex: ctx.knex, schema: ctx.schema });

	const permissions = await fetchPermissions(
		{ policies, accountability, action: 'read', bypassDynamicVariableProcessing: true },
		{ knex: ctx.knex, schema: ctx.schema },
	);

	const permissionsByCollection = permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
		if (!(perm.collection in acc)) acc[perm.collection] = [];
		acc[perm.collection]!.push(perm);
		return acc;
	}, {});

	return await asyncDeepMapWithSchema(
		payload,
		async ([key, value], context) => {
			if (context.field.special.some((v) => v === 'conceal' || v === 'hash')) return;

			// Filter out {} or [] values for relations
			if ((context.relationType === 'm2o' || context.relationType === 'a2o') && isEmpty(value)) return;

			// For o2m and o2a relations, ignore empty arrays or arrays with only empty values
			if ((context.relationType === 'o2m' || context.relationType === 'o2a') && Array.isArray(value)) {
				value = (value as Array<unknown>).filter((v) => !isEmpty(v));

				if ((value as Array<unknown>).length === 0) return;
			}

			const readAllowed =
				permissionsByCollection[context.collection.collection]?.some(
					(perm) => perm.fields && (perm.fields.includes(String(key)) || perm.fields.includes('*')),
				) ?? false;

			if (!readAllowed) return;

			try {
				const service = getService(context.collection.collection, ctx);
				const pk = context.object[context.collection.primary];
				if (pk) await service.readOne(pk, { fields: [String(key)] });
			} catch {
				return;
			}

			return [key, value];
		},
		{
			schema,
			collection,
		},
		{
			detailedUpdateSyntax: true,
			omitUnknownFields: true,
			mapPrimaryKeys: true,
		},
	);
}
