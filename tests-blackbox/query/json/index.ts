import { PrepareRequest, RequestOptions } from '@utils/prepare-request';
import * as testsSchema from '@schema/index';
import { ClientFilterOperator } from '@directus/shared/types';
import { merge, set } from 'lodash';
import {
	FilterEmptyValidator,
	FilterValidator,
	processValidation,
	TestsCollectionSchema,
	TestsFieldSchema,
} from '@query/filter';
import { SeedFunctions } from '@common/seed-functions';
import vendors from '@common/get-dbs-to-test';

export const jsonValuesQuantity = 2;
const JSONFieldDataTypes = ['string', 'integer', 'float', 'boolean'];
let cachedJSONFieldSchema: TestsFieldSchema | undefined;

type generateJSONSchemaOptions = { isNested: false } | { isNested: true; nestedField: string };

function generateJSONSchema(
	schema: TestsFieldSchema,
	dataTypes: string[],
	options: generateJSONSchemaOptions = { isNested: false }
) {
	const generatedSchema: TestsFieldSchema = {};

	for (const key of dataTypes) {
		const fieldKey = `field_${key.toLowerCase()}`;
		generatedSchema[fieldKey] = {
			field: fieldKey,
			type: key,
			filters: true,
			possibleValues: SeedFunctions.generateValues[key as keyof typeof SeedFunctions.generateValues]({
				quantity: jsonValuesQuantity,
				seed: options.isNested ? `${options.nestedField}_${fieldKey}` : fieldKey,
			}),
		};
	}

	if (options.isNested) {
		schema[options.nestedField] = {
			field: options.nestedField,
			type: 'json',
			filters: false,
			possibleValues: [],
			children: generatedSchema,
		};
	} else {
		merge(schema, generatedSchema);
	}
}

export function getJSONFieldSchema(): TestsFieldSchema {
	if (cachedJSONFieldSchema) return cachedJSONFieldSchema;

	cachedJSONFieldSchema = {};

	generateJSONSchema(cachedJSONFieldSchema, JSONFieldDataTypes);
	generateJSONSchema(cachedJSONFieldSchema, JSONFieldDataTypes, { isNested: true, nestedField: 'nested_object' });

	return cachedJSONFieldSchema;
}

export const processJsonFields = (
	requestOptions: RequestOptions,
	collection: string,
	schema: TestsCollectionSchema,
	jsonSchema: TestsFieldSchema,
	parentField?: string,
	parentJSONField?: string
) => {
	const filterKey = parentField ? `${parentField}.${schema.field}` : schema.field;

	describe(`Fields & Aliases: ${filterKey} (${schema.type})`, () => {
		for (const jsonField of Object.keys(jsonSchema)) {
			if (jsonSchema && jsonSchema[jsonField]?.type === 'json' && jsonSchema[jsonField].children) {
				processJsonFields(requestOptions, collection, schema, jsonSchema[jsonField].children!, parentField, jsonField);
				continue;
			}

			if (jsonSchema[jsonField].filters !== false) {
				// Process fields & aliases
				const jsonFieldKey = parentJSONField
					? `${filterKey}$.${parentJSONField}.${jsonField}`
					: `${filterKey}$.${jsonField}`;
				const alias = jsonFieldKey.split('.').join('-');

				describe(`${jsonFieldKey} (${jsonSchema[jsonField].type})`, () => {
					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const parsedFilter = {};
						set(parsedFilter, filterKey, { _nnull: true });

						let targetSchema: {
							filterOperatorList: any;
							generateFilterForDataType: any;
							type?: 'integer' | 'string' | 'float' | 'boolean' | 'json';
							getValidatorFunction?: (filter: ClientFilterOperator) => FilterValidator;
							getEmptyAllowedFunction?: (filter: ClientFilterOperator) => FilterEmptyValidator;
						};

						switch (jsonSchema[jsonField].type) {
							case 'integer':
								targetSchema = testsSchema.SchemaInteger;
								break;
							case 'float':
								targetSchema = testsSchema.SchemaFloat;
								break;
							case 'string':
								targetSchema = testsSchema.SchemaString;
								break;
							case 'boolean':
								targetSchema = testsSchema.SchemaBoolean;
								break;
							case 'json':
								targetSchema = testsSchema.SchemaJSON;
								break;
							default:
								throw new Error(`Unimplemented ${jsonSchema[jsonField].type} filter operator`);
						}

						// Action
						const response = await PrepareRequest(vendor, requestOptions).query({
							filter: parsedFilter,
							fields: alias,
							alias: {
								[alias]: `json(${jsonFieldKey})`,
							},
						});

						// Assert
						expect(response.status).toBe(200);

						const possibleValues = jsonSchema[jsonField].possibleValues;
						const generatedFilters = targetSchema.generateFilterForDataType(
							'eq',
							possibleValues
						) as testsSchema.GeneratedFilter[];

						for (const filter of generatedFilters) {
							const parsedFilterKeyParts = (
								filterKey.includes(':')
									? filterKey.split('.').map((key) => {
											if (!key.includes(':')) return key;
											return key.split(':')[0];
									  })
									: filterKey.split('.')
							)
								.map((key) => {
									if (key.includes('$')) return;
									return key;
								})
								.filter((key) => key);

							parsedFilterKeyParts[parsedFilterKeyParts.length - 1] = alias;

							const parsedFilterKey = parsedFilterKeyParts.join('.');

							processValidation(response.body.data, parsedFilterKey, filter, possibleValues);
						}
					});
				});
			}
		}
	});
};
