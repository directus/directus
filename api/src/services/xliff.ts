import xliff from 'xliff';
import { omit } from 'lodash';
import { InvalidPayloadException, UnprocessableEntityException } from '../exceptions';
import { AbstractServiceOptions, Accountability, Field, Relation, SchemaOverview } from '../types';
import { FieldsService } from './fields';
import { ItemsService } from './items';

const systemFields = ['id', 'status', 'sort', 'user_created', 'date_created', 'user_updated', 'date_updated'];

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

	async fromXliff(collection: string, content: string, translationsFieldName: string | undefined) {
		if (!content || content.length === 0) {
			throw new InvalidPayloadException(`There is no content to import.`);
		}
		const fields = await this.fieldsService.readAll(collection);
		const translationsFields = fields.filter((field) => (field.type as string) === 'translations');
		const translationsFieldsNames = translationsFields.map((field) => field.field);
		let translationsField: Field | undefined = undefined;
		if (translationsFieldName) {
			translationsField = translationsFields.find((t) => t.field === translationsFieldName);
			throw new InvalidPayloadException(
				`Field '${translationsFieldName}' doesn't exist in '${collection}' collection.`
			);
		}
		const relations = this.schema.relations.filter(
			(relation: any) =>
				relation.one_collection === collection &&
				(translationsField
					? relation.one_field === translationsField.field
					: translationsFieldsNames.includes(relation.one_field))
		);
		const json = await (this.format === XliffSupportedFormats.XLIFF_1_2
			? xliff.xliff12ToJs(content)
			: xliff.xliff2js(content));
		const language = this.language || json.targetLanguage;
		if (!language) {
			throw new InvalidPayloadException(`Cannot obtain information about target language.`);
		}
		for (const relation of relations) {
			const translatedItems = json.resources[relation.many_collection];
			if (!translatedItems) {
				throw new InvalidPayloadException(`The import file doesn't match the target collection.`);
			}
			const itemsService = new ItemsService(relation.many_collection, {
				accountability: this.accountability,
				schema: this.schema,
			});
			const fields = await this.fieldsService.readAll(relation.many_collection);
			const items = Object.keys(translatedItems).map((key) => {
				const [parentKey, fieldName] = key.split('.');
				if (!parentKey || !fieldName) {
					throw new InvalidPayloadException(`The import file doesn't match the target collection.`);
				}
				const content = translatedItems[key].target;
				return { parentKey, fieldName, content };
			});
		}
	}

	async toXliff(collection: string, data?: any[]): Promise<any> {
		const fields = await this.fieldsService.readAll(collection);
		const translationsFields = fields.filter((field) => (field.type as string) === 'translations');
		const translationsFieldsNames = translationsFields.map((field) => field.field);
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

	// prepares output for specific relation
	private async getXliffResources(relation: Relation, data: any[]) {
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
				const translatableData = this.cleanupEmptyFields(
					omit(item, [...systemFields, translationsKeyField, tranlsationsExternalKey, translationsParentField])
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
	private cleanupEmptyFields(item: any) {
		Object.keys(item).forEach((key) => {
			// '== null' checks for both null and undefined
			if (item[key] == null) item[key] = '';
		});
		return item;
	}
}
