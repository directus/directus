import xliff from 'xliff';
import { omit } from 'lodash';
import { InvalidPayloadException, UnprocessableEntityException } from '../exceptions';
import { AbstractServiceOptions, Accountability, Relation, SchemaOverview } from '../types';
import { FieldsService } from './fields';
import { ItemsService } from './items';

const systemFields = ['id', 'status', 'sort', 'user_created', 'date_created', 'user_updated', 'date_updated'];

export type XliffServiceOptions = AbstractServiceOptions & {
	language: string;
	version: 1 | 2;
};

export class XliffService {
	accountability: Accountability | null;
	schema: SchemaOverview;
	fieldsService: FieldsService;
	language: string;
	version: number;

	constructor(options: XliffServiceOptions) {
		this.accountability = options.accountability || null;
		this.schema = options.schema;
		this.language = options.language;
		this.version = options.version;
		this.fieldsService = new FieldsService({
			accountability: this.accountability,
			schema: this.schema,
		});
	}

	async toXliff(collection: string, data?: any[]) {
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
		const output = await (this.version === 1 ? xliff.jsToXliff12(json) : xliff.js2xliff(json));
		return output;
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
