import { type JSONSchema7 } from 'ai';
import { parseJsonSchema7 } from './parse-json-schema-7.js';

export const zodJsonSchema7Parser = (schema: unknown): schema is JSONSchema7 => {
	try {
		parseJsonSchema7(schema as unknown);
		return true;
	} catch {
		return false;
	}
};
