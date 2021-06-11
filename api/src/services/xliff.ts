import xliff from 'xliff';
import { omit, groupBy } from 'lodash';
import { InvalidPayloadException } from '../exceptions';
import { AbstractServiceOptions, Accountability, SchemaOverview, Relation, PrimaryKey } from '../types';
import { ItemsService } from './items';

export enum XliffSupportedFormats {
	XLIFF_1_2 = 'xliff', // 1.2
	XLIFF_2_0 = 'xliff2', // 2.0
}

export type XliffServiceOptions = AbstractServiceOptions & {
	language?: string;
	format: string;
};

export class XliffService {
	accountability: Accountability | null;
	schema: SchemaOverview;
	language?: string;
	format: string;

	constructor(options: XliffServiceOptions) {
		this.accountability = options.accountability || null;
		this.schema = options.schema;
		this.language = options.language;
		this.format = options.format;
	}

	async fromXliff(
		collectionName: string,
		parentCollectionName: string,
		parentKeyFieldName: string,
		languageKeyFieldName: string | null,
		content: string
	): Promise<PrimaryKey[]> {
		// check if passed file is not empty
		if (!content || content.length === 0) {
			throw new InvalidPayloadException(`There is no content to import.`);
		}
		if (!languageKeyFieldName) {
			throw new InvalidPayloadException(`Parameter 'languageKeyFieldName' is not set.`);
		}
		// convert passed Xliff content to json format
		const json = await (this.format === XliffSupportedFormats.XLIFF_1_2
			? xliff.xliff12ToJs(content)
			: xliff.xliff2js(content));
		// prepare output object
		const savedKeys = await this.import(
			collectionName,
			parentCollectionName,
			parentKeyFieldName,
			languageKeyFieldName,
			json
		);
		return savedKeys;
	}

	async toXliff(
		collectionName: string,
		parentKeyFieldName: string,
		languageKeyFieldName: string | null,
		data: any[]
	): Promise<any> {
		if (!languageKeyFieldName) {
			throw new InvalidPayloadException(`Parameter 'languageKeyFieldName' is not set.`);
		}
		if (!this.language) {
			throw new InvalidPayloadException(`Language has to be specified.`);
		}
		if (!data || data.length === 0) {
			throw new InvalidPayloadException(`Body has to be a non-empty array of translatable items.`);
		}
		const json = {
			resources: {},
			sourceLanguage: this.language,
		};
		(json.resources as any)[collectionName] = await this.getXliffResources(
			collectionName,
			parentKeyFieldName,
			languageKeyFieldName,
			data
		);
		const output = await (this.format === XliffSupportedFormats.XLIFF_1_2
			? xliff.jsToXliff12(json)
			: xliff.js2xliff(json));
		return output;
	}

	// importing data related to specific translation field
	private async import(
		collectionName: string,
		parentCollectionName: string,
		parentKeyFieldName: string,
		languageKeyFieldName: string,
		data: any
	) {
		const language = this.language || data.targetLanguage;
		// check if language explicitly specified or at least exists in the imported file
		if (!language) {
			throw new InvalidPayloadException(`Cannot obtain information about target language.`);
		}
		const keyFieldName = this.schema.collections[collectionName].primary;
		if (!keyFieldName) {
			throw new InvalidPayloadException(`The primary key field for '${collectionName}' is not set.`);
		}
		const parentCollectionKeyFieldName = this.schema.collections[parentCollectionName].primary;
		const nonTranslatableFields = [keyFieldName, languageKeyFieldName, parentKeyFieldName];
		const isLanguageValid = await this.validateLanguage(collectionName, languageKeyFieldName, language);
		// ensure that passed language exists in related collection
		if (!isLanguageValid) {
			throw new InvalidPayloadException(`Target language '${language} is not supported.`);
		}
		const translatedItems = data.resources[collectionName];
		// ensure that imported file has translated items for the currently processed translations collection
		if (!translatedItems) {
			throw new InvalidPayloadException(`The xliff file doesn't match the target collection.`);
		}
		const itemsService = new ItemsService(collectionName, {
			accountability: this.accountability,
			schema: this.schema,
		});
		const parentItemsService = new ItemsService(parentCollectionName, {
			accountability: this.accountability,
			schema: this.schema,
		});
		const fields = this.schema.collections[collectionName].fields;
		// extract data items from the xliff object
		const items = Object.keys(translatedItems).map((key) => {
			const index = key.lastIndexOf('.');
			// the key format is {parentKeyValue}.{translatableFieldName}, where {parentKeyValue}
			// may have a '.' as well in case if it's a custom string key
			const parentKey = index >= 0 ? key.substr(0, index) : null;
			const fieldName = index >= 0 ? key.substr(index + 1) : null;
			if (!parentKey || !fieldName) {
				throw new InvalidPayloadException(`The xliff file has a wrong structure.`);
			}
			const content = translatedItems[key].target;
			return { parentKey, fieldName, content };
		});
		// ensure that fields in imported items are matching fields in database
		if (
			items.some(
				(item) =>
					nonTranslatableFields.includes(item.fieldName) ||
					!Object.values(fields).find((field) => field.field === item.fieldName)
			)
		) {
			throw new InvalidPayloadException(`The xliff file has a wrong structure.`);
		}
		// group data items by the value of the key field from the parent collection
		const groups = groupBy(items, (item) => item.parentKey);
		const parentKeys = Object.keys(groups);
		const parentItems = await parentItemsService.readByQuery({
			filter: {
				[parentCollectionKeyFieldName]: { _in: parentKeys },
			},
			limit: -1,
		});
		// find translation items in database that matching data items from xliff file
		const existingItems = await itemsService.readByQuery({
			filter: {
				[parentKeyFieldName]: { _in: parentKeys },
				[languageKeyFieldName]: { _eq: language },
			},
			limit: -1,
		});
		const itemsToUpdate = [];
		const itemsToAdd = [];
		// process only those items that have a corresponded parent item in database
		for (const parentKey of parentKeys) {
			// aggregate translations into single object
			const translations = groups[parentKey].reduce((acc, val) => {
				return { ...acc, [val.fieldName]: val.content };
			}, {});
			// validate if there is already an existing translation item in the database
			const existingItem = existingItems?.find((item: any) => item[parentKeyFieldName].toString() == parentKey);
			// if there is item in database - add it to the storage that will be used for updating existing  items
			if (existingItem) {
				itemsToUpdate.push({ ...existingItem, ...translations });
			}
			// only add new translation if there related parent item exists
			else if (parentItems?.find((item: any) => item[parentCollectionKeyFieldName].toString() === parentKey)) {
				itemsToAdd.push({
					...translations,
					[parentKeyFieldName]: parentKey,
					[languageKeyFieldName]: language,
				});
			}
		}
		// return arrays of primary keys for new and updated translation items
		return [...(await itemsService.update(itemsToUpdate)), ...(await itemsService.createMany(itemsToAdd))];
	}

	static validateFormat(format: string): boolean {
		return (<any>Object).values(XliffSupportedFormats).includes(format);
	}

	// validates if language related to specific translations collection
	private async validateLanguage(collection: string, field: string, language: string): Promise<boolean> {
		const relation = this.schema.relations.find(
			(relation: Relation) => relation.meta?.many_collection === collection && relation.meta?.many_field === field
		);
		if (relation) {
			const itemsService = new ItemsService(relation.meta?.one_collection as string, {
				accountability: this.accountability,
				schema: this.schema,
			});
			const item = await itemsService.readByKey(language);
			return item !== null;
		}
		throw new InvalidPayloadException(`Cannot find languages relationship for '${collection}' collection.`);
	}

	// prepares output for specific relation
	private async getXliffResources(
		collectionName: string,
		parentKeyFieldName: string,
		languageKeyFieldName: string,
		data: any[]
	): Promise<any> {
		const keyFieldName = this.schema.collections[collectionName].primary;
		if (!keyFieldName) {
			throw new InvalidPayloadException(`The primary key field for '${collectionName}' is not set.`);
		}
		// getting items keys values
		const itemsKeys = data.map((r: any) => r[keyFieldName]);
		// initializing output object
		const resources = {};
		const itemsService = new ItemsService(collectionName, {
			accountability: this.accountability,
			schema: this.schema,
		});
		// making query to bring records for all found translations for current language
		const translationItems = await itemsService.readByQuery({
			filter: {
				[parentKeyFieldName]: { _in: itemsKeys },
				[languageKeyFieldName]: { _eq: this.language },
			},
			limit: -1,
		});
		// obtaining values of translatable fields and putting them to the dictionary
		if (translationItems && translationItems.length > 0) {
			translationItems.forEach((item: any) => {
				// removing system and key fields from output
				const translatableData = XliffService.cleanupEmptyFields(
					omit(item, [keyFieldName, languageKeyFieldName, parentKeyFieldName])
				);

				// populating output object with translations data
				Object.keys(translatableData).forEach((key) => {
					(resources as any)[`${item[parentKeyFieldName]}.${key}`] = {
						source: translatableData[key],
					};
				});
			});
		}
		return resources;
	}

	// replaces null/undefined values with empty strings
	private static cleanupEmptyFields(item: any) {
		Object.keys(item).forEach((key) => {
			// '== null' checks for both null and undefined
			if (item[key] == null) item[key] = '';
		});
		return item;
	}
}
