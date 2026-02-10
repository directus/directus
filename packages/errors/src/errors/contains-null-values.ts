import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export interface ContainsNullValuesErrorExtensions {
	collection: string;
	field: string;
}

export const messageConstructor = ({ collection, field }: ContainsNullValuesErrorExtensions) =>
	`Field "${field}" in collection "${collection}" contains null values.`;

export const ContainsNullValuesError: DirectusErrorConstructor<ContainsNullValuesErrorExtensions> =
	createError<ContainsNullValuesErrorExtensions>(ErrorCode.ContainsNullValues, messageConstructor, 400);
