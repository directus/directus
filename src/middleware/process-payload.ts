/**
 * Will check the fields system table for any special operations that need to be done on the field
 * value, this can include hashing the value or generating a UUID
 */

import { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import { FieldInfo } from '../types/field';
import bcrypt from 'bcrypt';

type Operation = 'create' | 'update';

/**
 * @TODO
 *
 * This needs a bit of extra thinking.
 * - There's a difference between update / create payload processing
 * - Some processing types need the whole payload (slug)
 * - What happens for fields that aren't in the payload but need to be set on create?
 */

const processPayload = (operation: Operation) => {
	const middleware: RequestHandler = asyncHandler(async (req, res, next) => {
		// Get the fields that have a special operation associated with them
		const fieldsInPayload = Object.keys(req.body);

		const fieldInfoForFields = await req.loaders.fields.loadMany(
			fieldsInPayload.map((field) => ({
				collection: req.collection,
				field: field,
			}))
		);

		const specialFields = fieldInfoForFields.filter((field) => {
			if (field instanceof Error) return false;
			return field.special !== null;
		}) as FieldInfo[];

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
			return await hash(payload[field.field]);
	}
}

async function hash(value: string | number) {
	return await bcrypt.hash(value, Number(process.env.SALT_ROUNDS));
}

export default processPayload;
