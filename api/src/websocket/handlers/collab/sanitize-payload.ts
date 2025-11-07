import type { Accountability, Item, SchemaOverview } from '@directus/types';
import { isObject } from '@directus/utils';
import { getRelationInfo } from '../../../utils/get-relation-info.js';

export async function sanitizePayload(
	accountability: Accountability,
	collection: string,
	item: string,
	version: string | null,
	payload: Record<string, unknown>,
	ctx: Pick<Context, 'database' | 'services'> & { schema: SchemaOverview; checkFields?: boolean },
) {
	const { services, database: knex, schema, checkFields } = ctx;

	const sanitizedPayload: Record<string, unknown> = {};

	for (const field of Object.keys(payload)) {
		if (checkFields !== false) {
			try {
				// Ensure they can read the field in the room, otherwise skip entire payload/processing
				await new services.ItemsService(collection, {
					knex,
					accountability,
					schema,
				}).readOne(primaryKey, { fields: [field] });
			} catch {
				continue;
			}
		}

		// Reset check fields
		ctx.checkFields = true;

		const relation = getRelationInfo(schema.relations, collection, field);

		const value = payload[field];

		const fieldSchema = schema.collections[collection]?.fields?.[field];

		if (relation === null) {
			// skip processing hash or password fields, they will be snyced on save
			if (fieldSchema?.special.some((v) => v === 'conceal' || v === 'hash')) {
				continue;
			}

			sanitizedPayload[field] = value;
		} else if (relation.type === 'm2a') {
			const m2aPayload = value as Record<string, unknown>;

			// Do not process m2a if no selected collection
			if (!relation.collection || !(relation.collection in payload)) continue;

			const m2oCollection = payload[relation.collection] as string;
			const m2aRelatedPrimaryKey = schema.collections[m2oCollection].primary;

			const isNew = !(m2aRelatedPrimaryKey in m2aPayload);

			// M2A "Add Existing" or Update
			const m2aSanitizedUpdatePayload = await sanitizePayload(
				accountability,
				`${m2oCollection}:${isNew ? null : m2aPayload[m2aRelatedPrimaryKey]}`,
				m2aPayload,
				{ ...ctx, checkFields: !isNew },
			);

			if (m2aSanitizedUpdatePayload) {
				sanitizedPayload[field] = m2aSanitizedUpdatePayload;
			}
		} else if (relation.type === 'm2o') {
			const relatedPrimaryKey = schema.collections[relation.collection!].primary;

			const m2oPayload = value as number | string | bigint | Partial<Item> | null;

			const isNew = isObject(m2oPayload) && !(relatedPrimaryKey in m2oPayload);

			if (['number', 'string', 'bigint'].includes(typeof m2oPayload)) {
				// "Add Existing"
				const m2oSanitizedExistingPayload = await sanitizePayload(
					accountability,
					`${relation.collection}:${m2oPayload}`,
					{ [relatedPrimaryKey]: m2oPayload },
					ctx,
				);

				if (m2oSanitizedExistingPayload) {
					sanitizedPayload[field] = m2oSanitizedExistingPayload[relatedPrimaryKey];
				}
			} else if (isObject(m2oPayload)) {
				// Update Existing
				const m2oSanitizedUpdatePayload = await sanitizePayload(
					accountability,
					`${relation.collection}:${isNew ? null : m2oPayload[relatedPrimaryKey]}`,
					m2oPayload,
					{ ...ctx, checkFields: !isNew },
				);

				if (m2oSanitizedUpdatePayload) {
					sanitizedPayload[field] = m2oSanitizedUpdatePayload;
				}
			} else if (m2oPayload === null) {
				// Delete Existing
				sanitizedPayload[field] = m2oPayload;
			}
		} else if (relation.type === 'o2m') {
			// Will have object syntax field: { create:[]; update:[]; delete:[] }

			const o2mPayload = value as
				| { create: Partial<Item>[]; update: Partial<Item>[]; delete: number[] }
				| number[]
				| typeof UNDEFINED_VALUE
				| null;

			// Discard will send array of ids o2mPayload: [1,2,3] instead of object syntax
			if (Array.isArray(o2mPayload)) {
				continue;
			}

			// Undoing an action sends undefined
			if (o2mPayload === UNDEFINED_VALUE || o2mPayload === null) {
				sanitizedPayload[field] = o2mPayload;
				continue;
			}

			const relatedPrimaryKey = schema.collections[relation.collection!].primary;

			const o2mSanitizedCreatePayloads: Partial<Item>[] = [];
			for (const create of o2mPayload.create) {
				// skip "Create New"
				const isNew = !(relation.payloadField in create);

				const o2mSanitizedExistingPayload = await sanitizePayload(
					accountability,
					`${relation.collection}:${isNew ? null : create[relation.payloadField]}`,
					create,
					{ ...ctx, checkFields: false },
				);

				if (o2mSanitizedExistingPayload) {
					if (relation.junctionField && !(relation.junctionField in o2mSanitizedExistingPayload)) {
						o2mSanitizedExistingPayload[relation.junctionField] = {};
					}

					o2mSanitizedCreatePayloads.push(o2mSanitizedExistingPayload);
				}
			}

			const o2mSanitizedUpdatePayloads: Partial<Item>[] = [];
			for (const update of o2mPayload.update) {
				// "Add Existing" for O2M and "Update" for O2M/M2A/M2M
				const updatePrimaryKey = update[relatedPrimaryKey] ? relatedPrimaryKey : relation.payloadField;

				const o2mSanitizedUpdatePayload = await sanitizePayload(
					accountability,
					`${relation.collection}:${update[updatePrimaryKey]}`,
					update,
					ctx,
				);

				if (o2mSanitizedUpdatePayload) {
					o2mSanitizedUpdatePayloads.push(o2mSanitizedUpdatePayload);
				}
			}

			const o2mSanitizedDelPayloads: number[] = [];
			for (const del of o2mPayload.delete) {
				// Delete
				const o2mSanitizedDelPayload = await sanitizePayload(
					accountability,
					`${relation.collection}:${del}`,
					{ [relatedPrimaryKey]: del },
					ctx,
				);

				if (o2mSanitizedDelPayload) {
					o2mSanitizedDelPayloads.push(o2mSanitizedDelPayload[relatedPrimaryKey] as number);
				}
			}

			// do not send update if all payloads are filtered out
			if (
				o2mSanitizedCreatePayloads.length === 0 &&
				o2mSanitizedDelPayloads.length === 0 &&
				o2mSanitizedUpdatePayloads.length == 0 &&
				(o2mSanitizedCreatePayloads.length !== o2mPayload.create.length ||
					o2mSanitizedUpdatePayloads.length !== o2mPayload.update.length ||
					o2mSanitizedDelPayloads.length !== o2mPayload.delete.length)
			) {
				continue;
			}

			sanitizedPayload[field] = {
				create: o2mSanitizedCreatePayloads,
				update: o2mSanitizedUpdatePayloads,
				delete: o2mSanitizedDelPayloads,
			};
		}
	}

	return Object.keys(sanitizedPayload).length > 0 ? sanitizedPayload : null;
}
