import { AbstractServiceOptions, Accountability, SchemaOverview } from '../types';
import xliff from 'xliff';
import { UnprocessableEntityException } from '../exceptions';
import { FieldsService } from './fields';
import { ItemsService } from './items';

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

	async toXliff(collection: string, data: any[]) {
		const fields = await this.fieldsService.readAll(collection);
		const translationsFields = fields.filter((field) => field.type === 'translations');
		const translationsFieldsNames = translationsFields.map((field) => field.field);
		const relations = this.schema.relations.filter(
			(relation: any) => relation.one_collection === collection && translationsFieldsNames.includes(relation.one_field)
		);
		const json = {
			resources: {},
			sourceLanguage: this.language,
		};
		if (relations.length === 0) {
			throw new UnprocessableEntityException(`Information about translations cannot be found.`);
		}
		for (const relation of relations) {
			const translationsCollection = relation.many_collection;
			const translationsKeyField = relation.one_primary;
			const translationsFieldName = relation.one_field;
			const translationsIdFieldName = relation.many_primary;
			const tranlsationsExternalKey = relation.junction_field;
			const translationsParentField = relation.many_field;
			const translations = data.map((r: any) => {
				return {
					id: r[translationsKeyField],
					translationIds: r[translationsFieldName],
				};
			});
			const resources = {};
			const translationsIds = translations.reduce((acc: any[], val: any) => {
				return val.translationIds.length > 0 ? [...acc, ...val.translationIds] : acc;
			}, []);
			const itemsService = new ItemsService(translationsCollection, {
				accountability: this.accountability,
				schema: this.schema,
			});
			// making query to bring records for all found translations for current language
			const translationItems = await itemsService.readByQuery({
				filter: {
					[translationsIdFieldName]: { _in: translationsIds },
					[tranlsationsExternalKey]: { _eq: this.language },
				},
				limit: -1,
			});
			// obtaining values of translatable fields and putting them to the dictionary
			if (translationItems && translationItems.length > 0) {
				translationItems.forEach((item: any) => {
					const translation = translations.find((t: any) => t.translationIds.includes(item[translationsKeyField]));
					// removing system fields from output
					const { id, status, sort, user_created, date_created, user_updated, date_updated, ...rest } = item;
					// ensuring that key field was removed
					delete rest[translationsKeyField];
					delete rest[tranlsationsExternalKey];
					delete rest[translationsParentField];
					Object.keys(rest).forEach((key) => {
						(resources as any)[`${translation.id}.${key}`] = {
							source: rest[key],
						};
					});
				});
			}
			json.resources[translationsCollection] = resources;
		}
		const output = (await this.version) === 1 ? xliff.jsToXliff12(json) : xliff.js2xliff(json);
		return output;
	}
}
