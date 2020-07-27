/**
 * Process a given payload for a collection to ensure the special fields (hash, uuid, date etc) are
 * handled correctly.
 */

import { System } from '../types/field';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import database from '../database';
import { clone, isObject } from 'lodash';
import { Relation, Item } from '../types';
import * as ItemsService from './items';
import { URL } from 'url';

type Operation = 'create' | 'read' | 'update';

type Transformers = {
	[type: string]: (operation: Operation, value: any, payload: Partial<Item>) => Promise<any>;
};

/**
 * @todo allow this to be extended
 *
 * @todo allow these extended special types to have "field dependencies"?
 * f.e. the file-links transformer needs the id and filename_download to be fetched from the DB
 * in order to work
 */
const transformers: Transformers = {
	async hash(operation, value) {
		if (!value) return;

		if (operation === 'create' || operation === 'update') {
			return await argon2.hash(String(value));
		}

		return value;
	},
	async uuid(operation, value) {
		if (operation === 'create' && !value) {
			return uuidv4();
		}

		return value;
	},
	async 'file-links'(operation, value, payload) {
		if (operation === 'read' && payload && payload.storage && payload.filename_disk) {
			const publicKey = `STORAGE_${payload.storage.toUpperCase()}_PUBLIC_URL`;

			return {
				asset_url: new URL(`/assets/${payload.id}`, process.env.PUBLIC_URL),
				public_url: new URL(payload.filename_disk, process.env[publicKey]),
			};
		}

		// This is an non-existing column, so there isn't any data to save
		return undefined;
	},
};

/**
 * Process and update all the special fields in the given payload
 *
 * @param collection Collection the payload goes in
 * @param operation If this is on create or on update
 * @param payload The actual payload itself
 * @returns The updated payload
 */

export async function processValues(
	operation: Operation,
	collection: string,
	payload: Partial<Item>
): Promise<Partial<Item>>;
export async function processValues(
	operation: Operation,
	collection: string,
	payload: Partial<Item>[]
): Promise<Partial<Item>[]>;
export async function processValues(
	operation: Operation,
	collection: string,
	payload: Partial<Item> | Partial<Item>[]
): Promise<Partial<Item> | Partial<Item>[]> {
	const processedPayload = Array.isArray(payload) ? clone(payload) : [clone(payload)];

	const specialFieldsInCollection = await database
		.select('field', 'special')
		.from<System>('directus_fields')
		.where({ collection: collection })
		.whereNotNull('special');

	await Promise.all(
		processedPayload.map(async (record: any) => {
			await Promise.all(
				specialFieldsInCollection.map(async (field) => {
					record[field.field] = await processField(field, record, operation);
				})
			);
		})
	);

	if (['create', 'update'].includes(operation)) {
		processedPayload.forEach((record) => {
			for (const [key, value] of Object.entries(record)) {
				if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
					record[key] = JSON.stringify(value);
				}
			}
		});
	}

	if (Array.isArray(payload)) {
		return processedPayload;
	}

	return processedPayload[0];
}

async function processField(
	field: Pick<System, 'field' | 'special'>,
	payload: Partial<Item>,
	operation: Operation
) {
	if (!field.special) return payload[field.field];

	if (transformers.hasOwnProperty(field.special)) {
		return await transformers[field.special](operation, payload[field.field], payload);
	}

	return payload[field.field];
}

/**
 * Recursively checks for nested relational items, and saves them bottom up, to ensure we have IDs etc ready
 */
export const processM2O = async (collection: string, payload: Partial<Item>) => {
	const payloadClone = clone(payload);

	const relations = await database
		.select<Relation[]>('*')
		.from('directus_relations')
		.where({ many_collection: collection });

	// Only process related records that are actually in the payload
	const relationsToProcess = relations.filter((relation) => {
		return (
			payloadClone.hasOwnProperty(relation.many_field) &&
			isObject(payloadClone[relation.many_field])
		);
	});

	// Save all nested m2o records
	await Promise.all(
		relationsToProcess.map(async (relation) => {
			const relatedRecord: Partial<Item> = payloadClone[relation.many_field];
			const hasPrimaryKey = relatedRecord.hasOwnProperty(relation.one_primary);

			let relatedPrimaryKey: string | number;

			if (hasPrimaryKey) {
				relatedPrimaryKey = relatedRecord[relation.one_primary];
				await ItemsService.updateItem(
					relation.one_collection,
					relatedPrimaryKey,
					relatedRecord
				);
			} else {
				relatedPrimaryKey = await ItemsService.createItem(
					relation.one_collection,
					relatedRecord
				);
			}

			// Overwrite the nested object with just the primary key, so the parent level can be saved correctly
			payloadClone[relation.many_field] = relatedPrimaryKey;
		})
	);

	return payloadClone;
};

export const processO2M = async (collection: string, payload: Partial<Item>) => {
	const payloadClone = clone(payload);

	const relations = await database
		.select<Relation[]>('*')
		.from('directus_relations')
		.where({ one_collection: collection });

	// Only process related records that are actually in the payload
	const relationsToProcess = relations.filter((relation) => {
		return (
			payloadClone.hasOwnProperty(relation.one_field) &&
			Array.isArray(payloadClone[relation.one_field])
		);
	});

	// Save all nested o2m records
	await Promise.all(
		relationsToProcess.map(async (relation) => {
			const relatedRecords = payloadClone[relation.one_field];

			await Promise.all(
				relatedRecords.map(async (relatedRecord: Partial<Item>, index: number) => {
					relatedRecord[relation.many_field] = payloadClone[relation.one_primary];

					const hasPrimaryKey = relatedRecord.hasOwnProperty(relation.many_primary);

					let relatedPrimaryKey: string | number;

					if (hasPrimaryKey) {
						relatedPrimaryKey = relatedRecord[relation.many_primary];

						await ItemsService.updateItem(
							relation.many_collection,
							relatedPrimaryKey,
							relatedRecord
						);
					} else {
						relatedPrimaryKey = await ItemsService.createItem(
							relation.many_collection,
							relatedRecord
						);
					}

					relatedRecord[relation.many_primary] = relatedPrimaryKey;

					payloadClone[relation.one_field][index] = relatedRecord;
				})
			);
		})
	);

	return payloadClone;
};
