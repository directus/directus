import { PrepareRequest, RequestOptions } from '@utils/prepare-request';
import * as testsSchema from '@schema/index';
import { ClientFilterOperator } from '@directus/shared/types';
import { isInteger, merge, set } from 'lodash';
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

type generateJSONSchemaOptions =
	| { isNested: false; isArray: false }
	| { isNested: true; isArray?: false; nestedField: string }
	| { isNested?: false; isArray: true }
	| { isNested?: true; isArray: true; nestedField: string };

function getJSONSchema(dataTypes: string[], options: generateJSONSchemaOptions = { isNested: false, isArray: false }) {
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

	return generatedSchema;
}

function generateJSONSchema(
	schema: TestsFieldSchema,
	dataTypes: string[],
	options: generateJSONSchemaOptions = { isNested: false, isArray: false }
) {
	let generatedSchema: TestsFieldSchema = {};

	if (options.isArray) {
		if (dataTypes.length === 1) {
			for (let index = 0; index < jsonValuesQuantity; index++) {
				generatedSchema[index] = {
					field: index.toString(),
					type: dataTypes[0],
					filters: true,
					possibleValues: SeedFunctions.generateValues[dataTypes[0] as keyof typeof SeedFunctions.generateValues]({
						quantity: jsonValuesQuantity,
						seed: options.isNested ? `${options.nestedField}_${index}` : index.toString(),
					}),
				};
			}
		} else {
			for (let index = 0; index < jsonValuesQuantity; index++) {
				generatedSchema[index] = {
					field: index.toString(),
					type: 'json',
					filters: true,
					possibleValues: [],
					children: getJSONSchema(dataTypes, {
						isNested: true,
						nestedField: options.isNested ? `${options.nestedField}_${index}` : index.toString(),
					}),
				};
			}
		}
	} else {
		generatedSchema = getJSONSchema(dataTypes, options);
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
	generateJSONSchema(cachedJSONFieldSchema, JSONFieldDataTypes, {
		isNested: true,
		isArray: true,
		nestedField: 'nested_array',
	});

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

	describe(
		parentJSONField
			? `${filterKey}.$${parentJSONField ?? ''} (${schema.type})`
			: `Fields & Aliases: ${filterKey} (${schema.type})`,
		() => {
			for (const jsonField of Object.keys(jsonSchema)) {
				const isArrayFieldKey = isInteger(parseInt(jsonField));

				if (jsonSchema && jsonSchema[jsonField]?.type === 'json' && jsonSchema[jsonField].children) {
					if (isArrayFieldKey) {
						processJsonFields(
							requestOptions,
							collection,
							schema,
							jsonSchema[jsonField].children!,
							parentField,
							`${parentJSONField ?? ''}[${[jsonField]}]`
						);
					} else {
						processJsonFields(
							requestOptions,
							collection,
							schema,
							jsonSchema[jsonField].children!,
							parentField,
							jsonField
						);
					}

					continue;
				}

				if (jsonSchema[jsonField].filters !== false) {
					// Process fields & aliases
					const alias = `alias_${jsonField}`;
					let jsonFieldKey = '';

					if (isArrayFieldKey) {
						jsonFieldKey = parentJSONField
							? `${filterKey}$.${parentJSONField}[${jsonField}]`
							: `${filterKey}$[${jsonField}]`;
					} else {
						jsonFieldKey = parentJSONField
							? `${filterKey}$.${parentJSONField}.${jsonField}`
							: `${filterKey}$.${jsonField}`;
					}

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
								let stripArrayValue = false;

								switch (vendor) {
									case 'postgres':
										if (['string', 'boolean'].includes(jsonSchema[jsonField].type)) {
											stripArrayValue = true;
										}
										break;
								}

								processValidation(response.body.data, parsedFilterKey, filter, possibleValues, true, stripArrayValue);
							}
						});
					});
				}
			}
		}
	);
};
