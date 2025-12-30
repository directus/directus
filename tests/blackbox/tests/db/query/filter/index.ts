import * as testsSchema from '../../schema/index';
import vendors from '@common/get-dbs-to-test';
import type { PrimaryKeyType } from '@common/types';
import type { ClientFilterOperator } from '@directus/types';
import { PrepareRequest, type RequestOptions } from '@utils/prepare-request';
import { get, set } from 'lodash-es';
import { describe, expect, it, type SuiteCollector } from 'vitest';

export type FilterValidator = (inputValue: any, possibleValues: any) => boolean;
export type FilterEmptyValidator = (inputValue: any, possibleValues: any) => boolean;

export type CachedTestsSchema = {
	[pkType in PrimaryKeyType]: TestsSchema;
};

export type TestsSchema = {
	[collection: string]: TestsFieldSchema;
};

export type TestsFieldSchema = {
	[field: string]: TestsCollectionSchema;
};

export type TestsCollectionSchema = {
	field: string;
	type: string;
	isPrimaryKey?: boolean;
	filters: string[] | boolean;
	possibleValues: any;
	children?: TestsFieldSchema;
	relatedCollection?: string;
};

export type TestsSchemaVendorValues = {
	[record: string]: TestsSchemaVendorValues | any[];
};

export const CheckQueryFilters = (
	requestOptions: RequestOptions,
	collection: string,
	testsFieldSchema: TestsFieldSchema,
	vendorSchemaValues: TestsSchemaVendorValues,
): SuiteCollector => {
	return describe(`Global Query Filters (${requestOptions.method.toUpperCase()} ${requestOptions.path})`, () => {
		for (const field in testsFieldSchema) {
			processSchemaFields(requestOptions, collection, testsFieldSchema[field]!, vendorSchemaValues);
		}
	});
};

const processSchemaFields = (
	requestOptions: RequestOptions,
	collection: string,
	schema: TestsCollectionSchema,
	vendorSchemaValues: TestsSchemaVendorValues,
	parentField?: string,
) => {
	let filterOperatorList: ClientFilterOperator[] = [];

	let targetSchema: {
		filterOperatorList: any;
		generateFilterForDataType: any;
		type?: 'integer' | 'uuid' | 'string' | 'alias' | 'bigInteger' | 'float' | 'dateTime' | 'boolean' | 'json';
		getValidatorFunction?: (filter: ClientFilterOperator) => FilterValidator;
		getEmptyAllowedFunction?: (filter: ClientFilterOperator) => FilterEmptyValidator;
	};

	switch (schema.type) {
		case 'alias':
			targetSchema = testsSchema.SchemaAlias;
			break;
		case 'integer':
			targetSchema = testsSchema.SchemaInteger;
			break;
		case 'bigInteger':
			targetSchema = testsSchema.SchemaBigInteger;
			break;
		case 'decimal':
			targetSchema = testsSchema.SchemaDecimal;
			break;
		case 'float':
			targetSchema = testsSchema.SchemaFloat;
			break;
		case 'string':
			targetSchema = testsSchema.SchemaString;
			break;
		case 'csv':
			targetSchema = testsSchema.SchemaCSV;
			break;
		case 'hash':
			targetSchema = testsSchema.SchemaHash;
			break;
		case 'text':
			targetSchema = testsSchema.SchemaText;
			break;
		case 'dateTime':
			targetSchema = testsSchema.SchemaDateTime;
			break;
		case 'date':
			targetSchema = testsSchema.SchemaDate;
			break;
		case 'time':
			targetSchema = testsSchema.SchemaTime;
			break;
		case 'timestamp':
			targetSchema = testsSchema.SchemaTimestamp;
			break;
		case 'boolean':
			targetSchema = testsSchema.SchemaBoolean;
			break;
		case 'json':
			targetSchema = testsSchema.SchemaJSON;
			break;
		case 'uuid':
			targetSchema = testsSchema.SchemaUUID;
			break;
		default:
			throw new Error(`Unimplemented ${schema.type} filter operator`);
	}

	if (schema.filters === true) {
		filterOperatorList = targetSchema.filterOperatorList;
	} else if (Array.isArray(schema.filters)) {
		for (const filter of schema.filters) {
			filterOperatorList.push(filter as ClientFilterOperator);
		}
	}

	// Process filters
	for (const filterOperator of filterOperatorList) {
		const filterKey = parentField ? `${parentField}.${schema.field}` : schema.field;

		describe(`Field: ${filterKey} (${schema.type})`, () => {
			describe(`_${filterOperator}`, () => {
				it.each(vendors)('%s', async (vendor) => {
					// TODO: Enable query filter testing for Oracle
					if (vendor === 'oracle') {
						expect(true).toBe(true);
						return;
					}

					// Oracle does not have a time datatype
					// if (vendor === 'oracle' && schema.type === 'time') {
					// 	expect(true).toBe(true);
					// 	return;
					// }

					const schemaValues = get(vendorSchemaValues, `${vendor}.${collection}.${filterKey}`);
					const possibleValues = Array.isArray(schemaValues) ? schemaValues : schema.possibleValues;

					const generatedFilters = targetSchema.generateFilterForDataType(
						filterOperator,
						possibleValues,
					) as testsSchema.GeneratedFilter[];

					for (const filter of generatedFilters) {
						// Setup
						const parsedFilter = {};
						set(parsedFilter, filterKey, filter.filter);

						// Action
						const response = await PrepareRequest(vendor, requestOptions).query({
							filter: parsedFilter,
							fields: Array(filterKey.split('.').length).fill('*').join('.'),
						});

						// Assert
						expect(response.status).toBe(200);

						const parsedFilterKey = filterKey.includes(':')
							? filterKey
									.split('.')
									.map((key) => {
										if (!key.includes(':')) return key;
										return key.split(':')[0];
									})
									.join('.')
							: filterKey;

						processValidation(response.body.data, parsedFilterKey, filter, possibleValues, true);
					}
				});
			});
		});
	}

	// Continue to process children schema
	if (schema.children) {
		for (const child of Object.keys(schema.children)) {
			const newParentField = parentField ? `${parentField}.${schema.field}` : schema.field;
			processSchemaFields(requestOptions, collection, schema.children[child]!, vendorSchemaValues, newParentField);
		}
	}
};

function processValidation(
	data: any,
	key: string,
	filter: testsSchema.GeneratedFilter,
	possibleValues: any[],
	assert = true,
): boolean {
	const keys = key.split('.');

	if (keys.length === 1 && keys[0]) {
		if (Array.isArray(data)) {
			let found = false;

			for (const item of data) {
				try {
					if (filter.validatorFunction(get(item, keys[0]), filter.value)) {
						found = true;
						break;
					}
				} catch {
					continue;
				}
			}

			if (assert) {
				if (data.length === 0) {
					if (filter.emptyAllowedFunction(filter.value, possibleValues)) {
						expect(true).toBe(true);
						return false;
					}

					expect(found).toBe(true);
					return false;
				} else {
					expect(found).toBe(true);
					return true;
				}
			} else {
				return found;
			}
		} else {
			let validationResult;

			try {
				validationResult = filter.validatorFunction(get(data, keys[0]), filter.value);
			} catch {
				validationResult = false;
			}

			if (assert) {
				expect(validationResult).toBe(true);
				return true;
			} else {
				return validationResult;
			}
		}
	} else {
		const currentKey = keys[0]!;
		keys.shift();

		if (Array.isArray(data)) {
			let found = false;

			for (const item of data) {
				if (processValidation(get(item, currentKey), keys.join('.'), filter, possibleValues, false)) {
					found = true;
					break;
				}
			}

			if (assert) {
				if (filter.emptyAllowedFunction(filter.value, possibleValues)) {
					expect(true).toBe(true);
					return true;
				}

				expect(found).toBe(true);
				return true;
			} else {
				return found;
			}
		} else {
			if (assert) {
				expect(processValidation(get(data, currentKey), keys.join('.'), filter, possibleValues, assert)).toBe(true);
				return true;
			} else {
				return processValidation(get(data, currentKey), keys.join('.'), filter, possibleValues, assert);
			}
		}
	}
}
