import { InvalidPayloadException } from '../exceptions';
import { AbstractServiceOptions, Relation, SchemaOverview } from '../types';

export class TranslationsService {
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.schema = options.schema;
	}

	/**
	 * Gets relation info for specific translation field of specific collection
	 * @param { string } collectionName Collection name
	 * @param { string } translationsFieldName Name of the translations field
	 * @returns { Promise<Relation> } Related relation object
	 */
	public getTranslationsRelation(collectionName: string, translationsFieldName: string): Relation {
		if (!this.schema.collections[collectionName]) {
			throw new InvalidPayloadException(`No schema information found for '${collectionName}' collection.`);
		}
		const fields = this.schema.collections[collectionName].fields;
		const translationsFields = Object.values(fields).filter((field) => field.special.includes('translations'));
		const translationsFieldsNames = translationsFields
			.map((field) => field.field)
			.filter((f) => f === translationsFieldName);
		const relation = this.schema.relations.find(
			(relation: any) =>
				relation.one_collection === collectionName && translationsFieldsNames.includes(relation.one_field)
		);
		if (!relation) {
			throw new InvalidPayloadException(
				`No relationship information found for '${translationsFieldName}' translations field in '${collectionName}' collection.`
			);
		}
		return relation;
	}
}
