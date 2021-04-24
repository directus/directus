import xliff from 'xliff';
import { omit, groupBy } from 'lodash';
import { InvalidPayloadException, UnprocessableEntityException } from '../exceptions';
import { AbstractServiceOptions, Accountability, Field, Relation, SchemaOverview } from '../types';
import { FieldsService } from './fields';
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
	fieldsService: FieldsService;
	language?: string;
	format: string;

	constructor(options: XliffServiceOptions) {
		this.accountability = options.accountability || null;
		this.schema = options.schema;
		this.language = options.language;
		this.format = options.format;
		this.fieldsService = new FieldsService({
			accountability: this.accountability,
			schema: this.schema,
		});
	}

	async fromXliff(collection: string, translationsFieldName: string | undefined, content: string) {
		// check if passed file is not empty
		if (!content || content.length === 0) {
			throw new InvalidPayloadException(`There is no content to import.`);
		}
		const fields = await this.fieldsService.readAll(collection);
		const translationsFields = fields.filter((field) => (field.type as string) === 'translations');
		const translationsFieldsNames = translationsFields.map((field) => field.field);
		let translationsField: Field | undefined = undefined;
		// validate if translations field name exist in collection
		if (translationsFieldName) {
			translationsField = translationsFields.find((t) => t.field === translationsFieldName);
			if (!translationsField) {
				throw new InvalidPayloadException(
					`Field '${translationsFieldName}' doesn't exist in '${collection}' collection.`
				);
			}
		}
		// obtain relations related to translations fields
		const relations = this.schema.relations.filter(
			(relation: any) =>
				relation.one_collection === collection &&
				(translationsField
					? relation.one_field === translationsField.field
					: translationsFieldsNames.includes(relation.one_field))
		);
		// convert passed Xliff content to json format
		const json = await (this.format === XliffSupportedFormats.XLIFF_1_2
			? xliff.xliff12ToJs(content)
			: xliff.xliff2js(content));
		// prepare output object
		let output: any = null;
		for (const relation of relations) {
			const savedKeys = await this.import(relation, json);
			output = { ...output, [relation.many_collection]: savedKeys };
		}
		return output;
	}

	async toXliff(collection: string, translationsFieldName: string, data: any[]): Promise<any> {
		if (!this.language) {
			throw new InvalidPayloadException(`Language has to be specified.`);
		}
		const fields = await this.fieldsService.readAll(collection);
		const translationsFields = fields.filter((field) => (field.type as string) === 'translations');
		const translationsFieldsNames = translationsFields
			.map((field) => field.field)
			.filter((f) => f === translationsFieldName);

		const relations = this.schema.relations.filter(
			(relation: any) => relation.one_collection === collection && translationsFieldsNames.includes(relation.one_field)
		);
		const json = {
			resources: {},
			sourceLanguage: this.language,
		};
		if (!data || data.length === 0) {
			throw new InvalidPayloadException(`Body has to be a non-empty array of translatable items.`);
		}
		if (relations.length === 0) {
			throw new UnprocessableEntityException(`Information about translations cannot be found.`);
		}
		for (const relation of relations) {
			(json.resources as any)[relation.many_collection] = await this.getXliffResources(relation, data);
		}
		const output = await (this.format === XliffSupportedFormats.XLIFF_1_2
			? xliff.jsToXliff12(json)
			: xliff.js2xliff(json));
		return output;
	}

	static validateFormat(format: string): boolean {
		return (<any>Object).values(XliffSupportedFormats).includes(format);
	}

	// importing data related to specific translation field
	private async import(relation: Relation, json: any) {
		const language = this.language || json.targetLanguage;
		// check if language explicitly specified or at least exists in the imported file
		if (!language) {
			throw new InvalidPayloadException(`Cannot obtain information about target language.`);
		}
		const collectionName = <string>relation.many_collection;
		const keyFieldName = <string>relation.many_primary;
		const externalFieldName = <string>relation.junction_field;
		const parentFieldName = <string>relation.many_field;
		const parentCollectionName = <string>relation.one_collection;
		const parentCollectionKeyFieldName = <string>relation.one_primary;
		const nonTranslatableFields = [keyFieldName, externalFieldName, parentFieldName];
		const isLanguageValid = await this.validateLanguage(collectionName, externalFieldName, language);
		// ensure that passed language exists in related collection
		if (!isLanguageValid) {
			throw new InvalidPayloadException(`Target language '${language} is not supported.`);
		}
		const translatedItems = json.resources[relation.many_collection];
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
		const fields = await this.fieldsService.readAll(collectionName);
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
					nonTranslatableFields.includes(item.fieldName) || !fields.find((field) => field.field === item.fieldName)
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
				[parentFieldName]: { _in: parentKeys },
				[externalFieldName]: { _eq: language },
			},
			limit: 1,
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
			const existingItem = existingItems?.find((item: any) => item[parentFieldName].toString() == parentKey);
			// if there is item in database - add it to the storage that will be used for updating existing  items
			if (existingItem) {
				itemsToUpdate.push({ ...existingItem, ...translations });
			}
			// only add new translation if there related parent item exists
			else if (parentItems?.find((item: any) => item[parentCollectionKeyFieldName].toString() === parentKey)) {
				itemsToAdd.push({
					...translations,
					[parentFieldName]: parentKey,
					[externalFieldName]: language,
				});
			}
		}
		// return arrays of primary keys for new and updated translation items
		return [...(await itemsService.update(itemsToUpdate)), ...(await itemsService.createMany(itemsToAdd))];
	}

	// validates if language related to specific translations collection
	private async validateLanguage(collection: string, field: string, language: string): Promise<boolean> {
		const relation = this.schema.relations.find(
			(relation: any) => relation.many_collection === collection && relation.many_field === field
		);
		if (relation) {
			const itemsService = new ItemsService(relation.one_collection as string, {
				accountability: this.accountability,
				schema: this.schema,
			});
			const item = await itemsService.readByKey(language);
			return item !== null;
		}
		throw new Error(`Cannot find languages relationship for '${collection}' collection.`);
	}

	// prepares output for specific relation
	private async getXliffResources(relation: Relation, data: any[]): Promise<any> {
		const translationsCollection = <string>relation.many_collection;
		const translationsKeyField = <string>relation.one_primary;
		const tranlsationsExternalKey = <string>relation.junction_field;
		const translationsParentField = <string>relation.many_field;
		// getting items keys values
		const itemsKeys = data.map((r: any) => r[translationsKeyField]);
		// initializing output object
		const resources = {};
		const itemsService = new ItemsService(translationsCollection, {
			accountability: this.accountability,
			schema: this.schema,
		});
		// making query to bring records for all found translations for current language
		const translationItems = await itemsService.readByQuery({
			filter: {
				[translationsParentField]: { _in: itemsKeys },
				[tranlsationsExternalKey]: { _eq: this.language },
			},
			limit: -1,
		});
		// obtaining values of translatable fields and putting them to the dictionary
		if (translationItems && translationItems.length > 0) {
			translationItems.forEach((item: any) => {
				// removing system and key fields from output
				const translatableData = XliffService.cleanupEmptyFields(
					omit(item, [translationsKeyField, tranlsationsExternalKey, translationsParentField])
				);

				// populating output object with translations data
				Object.keys(translatableData).forEach((key) => {
					(resources as any)[`${item[translationsParentField]}.${key}`] = {
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
