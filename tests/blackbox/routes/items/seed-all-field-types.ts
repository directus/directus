import { CreateField, CreateItem, ReadItem } from '@common/functions';
import type { Vendor } from '@common/get-dbs-to-test';
import { SeedFunctions } from '@common/seed-functions';
import type { PrimaryKeyType } from '@common/types';
import type { TestsFieldSchema } from '@query/filter';
import { expect } from 'vitest';

const valuesQuantity = 2;

export function getTestsAllTypesSchema(): TestsFieldSchema {
	const fieldSchema: TestsFieldSchema = {};

	for (const key of Object.keys(SeedFunctions.generateValues)) {
		const field = `test_${key.toLowerCase()}`;

		fieldSchema[field] = {
			field: field,
			type: key,
			filters: true,
			possibleValues: SeedFunctions.generateValues[key as keyof typeof SeedFunctions.generateValues]({
				quantity: valuesQuantity,
			}),
		};
	}

	return fieldSchema;
}

export const seedAllFieldTypesStructure = async (vendor: Vendor, collection: string, setDefaultValues = false) => {
	try {
		const fieldSchema = getTestsAllTypesSchema();

		// Create fields
		for (const key of Object.keys(fieldSchema)) {
			let meta = {};
			let schema = {};

			const fieldType = fieldSchema[key].type;

			if (fieldType === 'uuid') {
				meta = { special: ['uuid'] };
			}

			if (setDefaultValues && SeedFunctions.generateValues[fieldType as keyof typeof SeedFunctions.generateValues]) {
				schema = {
					default_value: SeedFunctions.generateValues[fieldType as keyof typeof SeedFunctions.generateValues]({
						quantity: 1,
						seed: `${collection}_${fieldType}`,
						vendor,
						isDefaultValue: true,
					})[0],
				};
			}

			await CreateField(vendor, {
				collection: collection,
				field: fieldSchema[key].field.toLowerCase(),
				type: fieldType,
				meta,
				schema,
			});
		}

		expect(true).toBeTruthy();
	} catch (error) {
		expect(error).toBeFalsy();
	}
};

export const seedAllFieldTypesValues = async (vendor: Vendor, collection: string, pkType: PrimaryKeyType) => {
	try {
		const fieldSchema = getTestsAllTypesSchema();

		// Create items
		let generatedStringIdCounter = 0;

		for (const key of Object.keys(fieldSchema)) {
			// Oracle does not have a time datatype
			if (vendor === 'oracle' && fieldSchema[key].type === 'time') {
				continue;
			}

			const items = [];
			const castValueToString = ['bigInteger'].includes(fieldSchema[key].type);

			if (pkType === 'string') {
				for (let i = 0; i < fieldSchema[key].possibleValues.length; i++) {
					items.push({
						id: SeedFunctions.generateValues.string({
							quantity: 1,
							seed: `id-${generatedStringIdCounter}`,
						})[0],
						[fieldSchema[key].field]: castValueToString
							? String(fieldSchema[key].possibleValues[i])
							: fieldSchema[key].possibleValues[i],
					});

					generatedStringIdCounter++;
				}
			} else {
				for (const value of fieldSchema[key].possibleValues) {
					items.push({
						[fieldSchema[key].field]: castValueToString ? String(value) : value,
					});
				}
			}

			if (items.length > 0) {
				await CreateItem(vendor, {
					collection: collection,
					item: items,
				});
			}
		}

		expect(true).toBeTruthy();
	} catch (error) {
		expect(error).toBeFalsy();
	}
};

export const seedO2MAliasAllFieldTypesValues = async (
	vendor: Vendor,
	collection: string,
	pkType: PrimaryKeyType,
	aliasField: string,
	possibleKeys: any[]
) => {
	try {
		const fieldSchema = getTestsAllTypesSchema();

		// Create items
		let generatedStringIdCounter = 0;
		const items = [];

		for (const aliasKey of possibleKeys) {
			for (let i = 0; i < valuesQuantity; i++) {
				const item: any = {};

				if (pkType === 'string') {
					item['id'] = SeedFunctions.generateValues.string({
						quantity: 1,
						seed: `id-${generatedStringIdCounter}`,
					})[0];

					generatedStringIdCounter++;
				}

				item[aliasField] = aliasKey;

				for (const key of Object.keys(fieldSchema)) {
					// Oracle does not have a time datatype
					if (vendor === 'oracle' && fieldSchema[key].type === 'time') {
						continue;
					}

					const castValueToString = ['bigInteger'].includes(fieldSchema[key].type);

					item[fieldSchema[key].field] = castValueToString
						? String(fieldSchema[key].possibleValues[i])
						: fieldSchema[key].possibleValues[i];
				}

				items.push(item);
			}
		}

		if (items.length > 0) {
			await CreateItem(vendor, {
				collection: collection,
				item: items,
			});
		}

		expect(true).toBeTruthy();
	} catch (error) {
		expect(error).toBeFalsy();
	}
};

export const seedM2MAliasAllFieldTypesValues = async (
	vendor: Vendor,
	collection: string,
	otherCollection: string,
	junctionCollection: string,
	junctionField: string,
	otherJunctionField: string,
	possibleKeys: any[],
	otherPossibleKeys: any[]
) => {
	try {
		const collectionItems = await ReadItem(vendor, { collection: collection, fields: ['*'] });
		const otherCollectionItems = await ReadItem(vendor, { collection: otherCollection, fields: ['*'] });
		const newCollectionKeys = collectionItems.map((i: any) => i.id).filter((i: any) => !possibleKeys.includes(i));

		const newOtherCollectionKeys = otherCollectionItems
			.map((i: any) => i.id)
			.filter((i: any) => !otherPossibleKeys.includes(i));

		if (newCollectionKeys.length !== newOtherCollectionKeys.length) {
			expect('Keys should have the same length').toBeFalsy();
		} else {
			const items = [];

			for (let i = 0; i < newCollectionKeys.length; i++) {
				items.push({ [junctionField]: newCollectionKeys[i], [otherJunctionField]: newOtherCollectionKeys[i] });
			}

			await CreateItem(vendor, { collection: junctionCollection, item: items });

			expect(true).toBeTruthy();
		}
	} catch (error) {
		expect(error).toBeFalsy();
	}
};

export const seedM2AAliasAllFieldTypesValues = async (
	vendor: Vendor,
	collection: string,
	junctionCollection: string,
	relatedCollection: string,
	possibleKeys: any[],
	otherPossibleKeys: any[]
) => {
	try {
		const collectionItems = await ReadItem(vendor, { collection: collection, fields: ['id'] });
		const otherCollectionItems = await ReadItem(vendor, { collection: relatedCollection, fields: ['id'] });
		const newCollectionKeys = collectionItems.map((i: any) => i.id).filter((i: any) => !possibleKeys.includes(i));

		const newOtherCollectionKeys = otherCollectionItems
			.map((i: any) => i.id)
			.filter((i: any) => !otherPossibleKeys.includes(i));

		if (newCollectionKeys.length !== newOtherCollectionKeys.length) {
			expect('Keys should have the same length').toBeFalsy();
		} else {
			const items = [];

			for (let i = 0; i < newCollectionKeys.length; i++) {
				items.push({
					[`${junctionCollection}_id`]: newCollectionKeys[i],
					item: newOtherCollectionKeys[i].toString(),
					collection: relatedCollection,
				});
			}

			await CreateItem(vendor, { collection: junctionCollection, item: items });

			expect(true).toBeTruthy();
		}
	} catch (error) {
		expect(error).toBeFalsy();
	}
};
