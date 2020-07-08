/**
 * Process a given payload for a collection to ensure the special fields (hash, uuid, date etc) are
 * handled correctly.
 */

import { System } from '../types/field';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import database from '../database';
import { clone } from 'lodash';
import { File } from '../types/files';

type Operation = 'create' | 'read' | 'update';

/**
 * Process and update all the special fields in the given payload
 *
 * @param collection Collection the payload goes in
 * @param operation If this is on create or on update
 * @param payload The actual payload itself
 * @returns The updated payload
 */
export const processValues = async (
	operation: Operation,
	collection: string,
	payload: Record<string, any> | Record<string, any>[]
) => {
	let processedPayload = clone(payload);

	if (Array.isArray(payload) === false) {
		processedPayload = [processedPayload];
	}

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

	console.log(processedPayload);

	/** @TODO
	 *
	 * - Make config.ts file in root
	 * - Have it cache settings / env vars a la graphql/dataloader (memory-cache)
	 * - Have it have a function to reload env vars
	 */

	// Return the payload in it's original format
	if (Array.isArray(payload) === false) {
		return processedPayload[0];
	}

	return processedPayload;
};

async function processField(
	field: Pick<System, 'field' | 'special'>,
	payload: Record<string, any>,
	operation: Operation
) {
	switch (field.special) {
		case 'hash':
			return await genHash(operation, payload[field.field], payload);
		case 'uuid':
			return await genUUID(operation, payload[field.field], payload);
		case 'file-links':
			// This is a system special type that only works on directus_files
			return await genFileLinks(operation, payload[field.field], payload as File);
		default:
			return payload[field.field];
	}
}

/**
 * @note The following functions can be called _a lot_. Make sure to utilize some form of caching
 * if you have to rely on heavy operations
 */

async function genHash(operation: Operation, value: any, payload: Record<string, any>) {
	if (!value) return;

	if (operation === 'create' || operation === 'update') {
		return await argon2.hash(String(value));
	}

	return value;
}

async function genUUID(operation: Operation, value: any, payload: Record<string, any>) {
	if (operation === 'create' && !value) {
		return uuidv4();
	}

	return value;
}

async function genFileLinks(operation: Operation, value: undefined, payload: File) {
	if (operation === 'read' && payload) {
		return {
			asset_url: new URL(`/assets/${payload.id}`, process.env.PUBLIC_URL),
		};
	}

	// This is an non-existing column, so there isn't any data to save
	return undefined;
}
