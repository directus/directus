import { PrepareRequest, RequestOptions } from '@utils/prepare-request';
import vendors from '@common/get-dbs-to-test';
import * as testsSchema from '@schema/index';
import { ClientFilterOperator } from '@directus/shared/types';
import { get } from 'lodash';

export type FilterValidator = (inputValue: any, compareValue: any) => boolean;

export type TestsSchema = {
	[key: string]: TestsFieldSchema;
};

export type TestsFieldSchema = {
	[field: string]: TestsCollectionSchema;
};

export type TestsCollectionSchema = {
	field: string;
	type: string;
	filters: string[] | boolean;
	possibleValues: any;
	children: TestsCollectionSchema[] | null;
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
	for (const key of Object.keys(filters)) {
		const operatorFilters = filters[key];

		describe(`Field: ${parentField ? parentField + '.' : ''}${schema.field} (${schema.type})`, () => {
			describe(`_${key}`, () => {
				it.each(vendors)('%s', async (vendor) => {
					for (const filter of operatorFilters) {
						// Action
						const response = await PrepareRequest(vendor, requestOptions).query({
							filter: {
								[schema.field]: filter.filter,
							},
						});

						// Assert
						expect(response.status).toBe(200);
						for (const item of response.body.data) {
							expect(
								filter.validatorFunction(
									get(item, parentField ? `${parentField}.${schema.field}` : schema.field),
									filter.value
								)
							).toBe(true);
						}
					}
				});
			});
		});
	}

	// Continue to process children schema
	if (schema.children) {
		for (const children of schema.children) {
			const newParentField = parentField ? `${parentField}.${schema.field}` : schema.field;
			processSchemaFields(requestOptions, children, newParentField);
		}
	}
};
