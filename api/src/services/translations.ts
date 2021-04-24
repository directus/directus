import { AbstractServiceOptions, Relation, SchemaOverview } from '../types';
import { FieldsService } from './fields';

export class TranslationsService {
	fieldsService: FieldsService;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.schema = options.schema;
		this.fieldsService = new FieldsService(options);
	}

	/**
	 * Gets relation info for specific translation field of specific collection
	 * @param { string } collectionName Collection name
	 * @param { string } translationsFieldName Name of the translations field
	 * @returns { Promise<Relation> } Related relation object
	 */
	public async getTranslationsRelation(collectionName: string, translationsFieldName: string): Promise<Relation> {
		const fields = await this.fieldsService.readAll(collectionName);
		const translationsFields = fields.filter((field) => (field.type as string) === 'translations');
		const translationsFieldsNames = translationsFields
			.map((field) => field.field)
			.filter((f) => f === translationsFieldName);

		const relation = this.schema.relations.find(
			(relation: any) =>
				relation.one_collection === collectionName && translationsFieldsNames.includes(relation.one_field)
		);
		if (!relation) {
			throw new Error(
				`No relationship information found for '${translationsFieldName}' translations field in '${collectionName}' collection.`
			);
		}
		return relation;
	}
}
