/**
 * Will check the fields system table for any special operations that need to be done on the field
 * value, this can include hashing the value or generating a UUID
 */

import { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import { FieldInfo } from '../types/field';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

type Operation = 'create' | 'update';

/**
 * @TODO
 *
 * Move this out of the middleware into a service
 */

const processPayload = (operation: Operation) => {
	const middleware: RequestHandler = asyncHandler(async (req, res, next) => {
		const fieldsInCollection = await req.loaders.fieldsByCollection.load(req.collection);

		const specialFields = fieldsInCollection.filter((field) => {
			if (field instanceof Error) return false;
			return field.special !== null;
		});

		for (const field of specialFields) {
			req.body[field.field] = await processField(req.collection, field, req.body, operation);
		}

		next();
	});

	return middleware;
};

async function processField(
	collection: string,
	field: FieldInfo,
	payload: Record<string, any>,
	operation: Operation
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

async function genUUID(operation: Operation) {
	if (operation === 'create') {
		return uuidv4();
	}
}

export default processPayload;
