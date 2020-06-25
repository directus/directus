/**
 * # PayloadService
 *
 * Process a given payload for a collection to ensure the special fields (hash, uuid, date etc) are
 * handled correctly.
 */

import { FieldInfo } from '../types/field';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import database from '../database';
import { clone } from 'lodash';

/**
 * Process and update all the special fields in the given payload
 *
 * @param collection Collection the payload goes in
 * @param operation If this is on create or on update
 * @param payload The actual payload itself
 * @returns The updated payload
 */
export const processValues = async (
	operation: 'create' | 'update',
	collection: string,
	payload: Record<string, any>
) => {
	const processedPayload = clone(payload);
	const specialFieldsInCollection = await database
		.select('field', 'special')
		.from('directus_fields')
		.where({ collection: collection })
		.whereNotNull('special');

	for (const field of specialFieldsInCollection) {
		processedPayload[field.field] = await processField(field, processedPayload, operation);
	}

	return processedPayload;
};

async function processField(
	field: FieldInfo,
	payload: Record<string, any>,
	operation: 'create' | 'update'
) {
	switch (field.special) {
		case 'hash':
			return await genHash(payload[field.field]);
		case 'uuid':
			return await genUUID(operation);
	}
}

async function genHash(value: string | number) {
	return await bcrypt.hash(value, Number(process.env.SALT_ROUNDS));
}

async function genUUID(operation: 'create' | 'update') {
	if (operation === 'create') {
		return uuidv4();
	}
}
