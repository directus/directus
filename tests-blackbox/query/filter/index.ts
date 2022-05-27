import { PrepareRequest, RequestOptions } from '@utils/prepare-request';
import vendors from '@common/get-dbs-to-test';
import * as testsSchema from '@schema/index';
import { ClientFilterOperator } from '@directus/shared/types';
import { get, set } from 'lodash';
import { PrimaryKeyType } from '@common/types';

export type FilterValidator = (inputValue: any, compareValue: any) => boolean;

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

export const CheckQueryFilters = (requestOptions: RequestOptions, fields: TestsFieldSchema) => {
	return describe(`Global Query Filters (${requestOptions.method.toUpperCase()} ${requestOptions.path})`, () => {
		for (const schemaField in fields) {
			processSchemaFields(requestOptions, fields[schemaField]);
		}
	});
};

const processSchemaFields = (requestOptions: RequestOptions, schema: TestsCollectionSchema, parentField?: string) => {
	let filterOperatorList: ClientFilterOperator[] = [];
	let targetSchema = null;

	switch (schema.type) {
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

	const filters: Record<string, testsSchema.GeneratedFilter[]> = {};

	for (const filterOperator of filterOperatorList) {
		const generatedFilters = targetSchema.generateFilterForDataType(filterOperator, schema.possibleValues);
		if (generatedFilters.length > 0) {
			filters[filterOperator] = generatedFilters;
		}
	}

	// Process filters
	for (const field of Object.keys(filters)) {
		const operatorFilters = filters[field];
		const filterKey = parentField ? `${parentField}.${schema.field}` : schema.field;

		describe(`Field: ${filterKey} (${schema.type})`, () => {
			describe(`_${field}`, () => {
				it.each(vendors)('%s', async (vendor) => {
					for (const filter of operatorFilters) {
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
						for (const item of response.body.data) {
							expect(filter.validatorFunction(get(item, filterKey), filter.value)).toBe(true);
						}
					}
				});
			});
		});
	}

	// Continue to process children schema
	if (schema.children) {
		for (const child of Object.keys(schema.children)) {
			const newParentField = parentField ? `${parentField}.${schema.field}` : schema.field;
			processSchemaFields(requestOptions, schema.children[child], newParentField);
		}
	}
};
