import type { Column, SchemaOverview } from '@directus/schema';
import type { FieldMeta } from '@directus/types';
import { parseJSON } from '@directus/utils';
import { getNodeEnv } from '@directus/utils/node';
import { useLogger } from '../logger/index.js';
import getLocalType from './get-local-type.js';

export default function getDefaultValue(
	column: SchemaOverview[string]['columns'][string] | Column,
	field?: { special?: FieldMeta['special'] },
): string | boolean | number | Record<string, any> | any[] | null {
	const type = getLocalType(column, field);

	const defaultValue = column.default_value ?? null;
	if (defaultValue === null) return null;
	if (defaultValue === '0000-00-00 00:00:00') return null;

	switch (type) {
		case 'bigInteger':
		case 'integer':
		case 'decimal':
		case 'float':
			return Number.isNaN(Number(defaultValue)) === false ? Number(defaultValue) : defaultValue;
		case 'boolean':
			return castToBoolean(defaultValue);
		case 'json':
			return castToObject(defaultValue);
		default:
			return defaultValue;
	}
}

function castToBoolean(value: any): boolean {
	if (typeof value === 'boolean') return value;

	if (value === 0 || value === '0') return false;
	if (value === 1 || value === '1') return true;

	if (value === 'false' || value === false) return false;
	if (value === 'true' || value === true) return true;

	return Boolean(value);
}

function castToObject(value: any): any | any[] {
	const logger = useLogger();

	if (!value) return value;

	if (typeof value === 'object') return value;

	if (typeof value === 'string') {
		try {
			return parseJSON(value);
		} catch (err: any) {
			if (getNodeEnv() === 'development') {
				logger.error(err);
			}

			return value;
		}
	}

	return {};
}
