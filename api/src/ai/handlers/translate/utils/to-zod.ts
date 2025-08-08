import { z } from 'zod';

export const objectToZodSchema = (obj: Record<string, unknown>): z.ZodObject => {
	const fields: [key: string, type: z.core.SomeType][] = [];

	for (const [key, value] of Object.entries(obj)) {
		fields.push([key, castToZodType(value)]);
	}

	return z.object(Object.fromEntries(fields));
};

export const castToZodType = (value: unknown): z.core.SomeType => {
	switch (typeof value) {
		case 'string':
			return z.string();
		case 'number':
			return z.number();
		case 'bigint':
			return z.bigint();
		case 'boolean':
			return z.boolean();
		case 'symbol':
			return z.symbol();
		case 'undefined':
			return z.undefined();
		case 'object':
		case 'function':
		default:
			throw new Error(`Cannot convert type "${typeof value}" to zod type`);
	}
};
