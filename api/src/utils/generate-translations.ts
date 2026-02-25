import { InvalidPayloadError } from '@directus/errors';
import type {
	AbstractServiceOptions,
	ActionEventParams,
	Field,
	FieldMeta,
	MutationOptions,
	Relation,
	RelationMeta,
	SchemaOverview,
	Type,
} from '@directus/types';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';
import emitter from '../emitter.js';
import { useLogger } from '../logger/index.js';
import { CollectionsService } from '../services/collections.js';
import { FieldsService } from '../services/fields.js';
import { ItemsService } from '../services/items.js';
import { RelationsService } from '../services/relations.js';
import { getSchema } from './get-schema.js';
import { transaction } from './transaction.js';
import { cloneFields, validateFieldsEligibility } from './translations-shared.js';
import { dbSafeIdentifierSchema } from './translations-validation.js';

const logger = useLogger();

function findDuplicate(names: string[]): string | undefined {
	return names.find((name, index) => names.indexOf(name) !== index);
}

const GenerateTranslationsInput = z.object({
	collection: dbSafeIdentifierSchema,
	fields: z.array(dbSafeIdentifierSchema).min(1),
	translationsCollection: dbSafeIdentifierSchema.optional(),
	languagesCollection: dbSafeIdentifierSchema.optional(),
	parentFkField: dbSafeIdentifierSchema.optional(),
	languageFkField: dbSafeIdentifierSchema.optional(),
	createLanguagesCollection: z.boolean().optional().default(true),
	seedLanguages: z.boolean().optional().default(true),
});

export type GenerateTranslationsResult =
	| { created: true; translationsCollection: string; languagesCollection: string; fields: string[] }
	| { created: false; translationsCollection: string; fields: string[] };

export async function generateTranslations(
	input: unknown,
	options: AbstractServiceOptions,
): Promise<GenerateTranslationsResult> {
	const parseResult = GenerateTranslationsInput.safeParse(input);

	if (!parseResult.success) {
		throw new InvalidPayloadError({ reason: fromZodError(parseResult.error).message });
	}

	if (!options.knex) {
		throw new Error('Knex instance is required to generate translations');
	}

	const {
		collection,
		fields: fieldNames,
		translationsCollection = `${parseResult.data.collection}_translations`,
		languagesCollection = 'languages',
		parentFkField,
		languageFkField,
		createLanguagesCollection = true,
		seedLanguages = true,
	} = parseResult.data;

	const nestedActionEvents: ActionEventParams[] = [];

	const mutationOptions: MutationOptions = {
		autoPurgeSystemCache: false,
		bypassEmitAction: (params) => nestedActionEvents.push(params),
		bypassLimits: true,
	};

	const result = await transaction<GenerateTranslationsResult>(options.knex, async (trx) => {
		let currentSchema = options.schema ?? (await getSchema({ database: trx, bypassCache: true }));

		const getServiceOptions = (schema: SchemaOverview): AbstractServiceOptions => ({
			accountability: options.accountability,
			knex: trx,
			schema,
		});

		const sourceCollection = currentSchema.collections[collection];

		if (!sourceCollection) {
			throw new InvalidPayloadError({ reason: `Collection "${collection}" does not exist` });
		}

		const duplicateRequestedField = findDuplicate(fieldNames);

		if (duplicateRequestedField) {
			throw new InvalidPayloadError({
				reason: `Field "${duplicateRequestedField}" would be created multiple times on "${translationsCollection}"`,
			});
		}

		const readSourceFields = async (): Promise<Field[]> => {
			const sourceFieldsService = new FieldsService(getServiceOptions(currentSchema));

			return Promise.all(
				fieldNames.map(async (fieldName) => (await sourceFieldsService.readOne(collection, fieldName)) as Field),
			);
		};

		const validateExistingTranslationsCollection = (): { parentRelation: Relation; languageRelation: Relation } => {
			const parentRelations = currentSchema.relations.filter(
				(relation) =>
					relation.collection === translationsCollection &&
					relation.related_collection === collection &&
					(relation.meta?.one_collection === null || relation.meta?.one_collection === collection) &&
					(relation.meta?.many_collection === null || relation.meta?.many_collection === translationsCollection) &&
					typeof relation.meta?.one_field === 'string' &&
					relation.meta.one_field.length > 0 &&
					typeof relation.meta?.junction_field === 'string' &&
					relation.meta.junction_field.length > 0,
			);

			if (parentRelations.length !== 1) {
				throw new InvalidPayloadError({
					reason: `Collection "${translationsCollection}" is not a valid translations collection for "${collection}"`,
				});
			}

			const parentRelation = parentRelations[0]!;
			const translationField = parentRelation.meta!.one_field!;
			const sourceTranslationField = sourceCollection.fields[translationField];

			const sourceTranslationSpecials = Array.isArray(sourceTranslationField?.special)
				? sourceTranslationField.special
				: [];

			if (!sourceTranslationField || !sourceTranslationSpecials.includes('translations')) {
				throw new InvalidPayloadError({
					reason: `Collection "${translationsCollection}" is not a valid translations collection for "${collection}"`,
				});
			}

			const languageForeignKeyField = parentRelation.meta!.junction_field!;

			const languageRelation = currentSchema.relations.find(
				(relation) =>
					relation.collection === translationsCollection &&
					relation.field === languageForeignKeyField &&
					relation.meta?.junction_field === parentRelation.field &&
					typeof relation.related_collection === 'string' &&
					relation.related_collection.length > 0,
			);

			if (!languageRelation) {
				throw new InvalidPayloadError({
					reason: `Collection "${translationsCollection}" is not a valid translations collection for "${collection}"`,
				});
			}

			return { parentRelation, languageRelation };
		};

		const existingTranslationsCollection = currentSchema.collections[translationsCollection];

		if (existingTranslationsCollection) {
			validateExistingTranslationsCollection();

			for (const fieldName of fieldNames) {
				if (sourceCollection.fields[fieldName] === undefined) {
					throw new InvalidPayloadError({ reason: `Field "${fieldName}" does not exist on "${collection}"` });
				}

				if (existingTranslationsCollection.fields[fieldName] !== undefined) {
					throw new InvalidPayloadError({
						reason: `Field "${fieldName}" already exists on "${translationsCollection}"`,
					});
				}
			}

			const sourceFields = await readSourceFields();

			validateFieldsEligibility(sourceFields);

			const clonedFields = cloneFields({ fields: fieldNames, sourceFields });
			const fieldsService = new FieldsService(getServiceOptions(currentSchema));

			for (const clonedField of clonedFields) {
				await fieldsService.createField(
					translationsCollection,
					clonedField as Parameters<FieldsService['createField']>[1],
					undefined,
					mutationOptions,
				);
			}

			return {
				created: false as const,
				translationsCollection,
				fields: fieldNames,
			};
		}

		const hasTranslationsSpecial = Object.values(sourceCollection.fields).some(
			(field) => Array.isArray(field.special) && field.special.includes('translations'),
		);

		if (hasTranslationsSpecial) {
			throw new InvalidPayloadError({ reason: `Field with special "translations" already exists on "${collection}"` });
		}

		if (sourceCollection.fields['translations']) {
			throw new InvalidPayloadError({ reason: `Field "translations" already exists on "${collection}"` });
		}

		const parentFieldNames = Object.keys(sourceCollection.fields);
		const parentPrimaryKeyField = sourceCollection.primary;

		if (!parentPrimaryKeyField) {
			throw new InvalidPayloadError({ reason: `Collection "${collection}" does not have a primary key` });
		}

		const parentPrimaryKeyType = (sourceCollection.fields[parentPrimaryKeyField]?.type ?? 'integer') as Type;

		for (const fieldName of fieldNames) {
			if (!parentFieldNames.includes(fieldName)) {
				throw new InvalidPayloadError({ reason: `Field "${fieldName}" does not exist on "${collection}"` });
			}
		}

		let languagePrimaryKeyField = 'code';
		let languagePrimaryKeyType: Type;

		if (currentSchema.collections[languagesCollection]) {
			const existingLanguagesCollection = currentSchema.collections[languagesCollection];

			languagePrimaryKeyField = existingLanguagesCollection.primary;
			languagePrimaryKeyType = (existingLanguagesCollection.fields[languagePrimaryKeyField]?.type ?? 'string') as Type;
		} else if (createLanguagesCollection) {
			const collectionsService = new CollectionsService(getServiceOptions(currentSchema));

			await collectionsService.createOne(
				{
					collection: languagesCollection,
					meta: {},
					schema: { name: languagesCollection },
					fields: [
						{
							field: 'code',
							type: 'string',
							schema: { is_primary_key: true },
							meta: {},
						},
						{
							field: 'name',
							type: 'string',
							schema: {},
							meta: {},
						},
						{
							field: 'direction',
							type: 'string',
							schema: { default_value: 'ltr' },
							meta: {
								interface: 'select-dropdown',
								options: {
									choices: [
										{ text: '$t:left_to_right', value: 'ltr' },
										{ text: '$t:right_to_left', value: 'rtl' },
									],
								},
								display: 'labels',
								display_options: {
									choices: [
										{ text: '$t:left_to_right', value: 'ltr' },
										{ text: '$t:right_to_left', value: 'rtl' },
									],
									format: false,
								},
							},
						},
					],
				},
				mutationOptions,
			);

			currentSchema = await getSchema({ database: trx, bypassCache: true });

			const createdLanguagesCollection = currentSchema.collections[languagesCollection];

			if (!createdLanguagesCollection) {
				throw new InvalidPayloadError({
					reason: `Languages collection "${languagesCollection}" was not found in refreshed schema`,
				});
			}

			languagePrimaryKeyField = createdLanguagesCollection.primary;

			languagePrimaryKeyType = (createdLanguagesCollection.fields[languagePrimaryKeyField]?.type ?? 'string') as Type;

			if (seedLanguages) {
				const itemsService = new ItemsService(languagesCollection, getServiceOptions(currentSchema));

				await itemsService.createMany(
					[
						{ code: 'en-US', name: 'English', direction: 'ltr' },
						{ code: 'ar-SA', name: 'Arabic', direction: 'rtl' },
						{ code: 'de-DE', name: 'German', direction: 'ltr' },
						{ code: 'fr-FR', name: 'French', direction: 'ltr' },
						{ code: 'ru-RU', name: 'Russian', direction: 'ltr' },
						{ code: 'es-ES', name: 'Spanish', direction: 'ltr' },
						{ code: 'it-IT', name: 'Italian', direction: 'ltr' },
						{ code: 'pt-BR', name: 'Portuguese', direction: 'ltr' },
					],
					mutationOptions,
				);
			}
		} else {
			throw new InvalidPayloadError({ reason: `Languages collection "${languagesCollection}" does not exist` });
		}

		const sourceFields = await readSourceFields();

		validateFieldsEligibility(sourceFields);

		const resolvedParentForeignKeyField = parentFkField ?? `${collection}_${parentPrimaryKeyField}`;
		const resolvedLanguageForeignKeyField = languageFkField ?? `${languagesCollection}_${languagePrimaryKeyField}`;
		const targetFieldNames = ['id', resolvedParentForeignKeyField, resolvedLanguageForeignKeyField, ...fieldNames];
		const duplicateTargetField = findDuplicate(targetFieldNames);

		if (duplicateTargetField) {
			throw new InvalidPayloadError({
				reason: `Field "${duplicateTargetField}" would be created multiple times on "${translationsCollection}"`,
			});
		}

		const clonedFields = cloneFields({
			fields: fieldNames,
			sourceFields,
		});

		const collectionsService = new CollectionsService(getServiceOptions(currentSchema));

		await collectionsService.createOne(
			{
				collection: translationsCollection,
				meta: { hidden: true, icon: 'import_export' },
				schema: { name: translationsCollection },
				fields: [
					{
						field: 'id',
						type: 'integer',
						schema: { has_auto_increment: true },
						meta: { hidden: true },
					},
					{
						field: resolvedParentForeignKeyField,
						type: parentPrimaryKeyType,
						schema: {},
						meta: { hidden: true },
					},
					{
						field: resolvedLanguageForeignKeyField,
						type: languagePrimaryKeyType,
						schema: {},
						meta: { hidden: true },
					},
					...clonedFields,
				],
			},
			mutationOptions,
		);

		currentSchema = await getSchema({ database: trx, bypassCache: true });

		const relationsService = new RelationsService(getServiceOptions(currentSchema));
		const onDeleteSchema = { on_delete: 'SET NULL' } as NonNullable<Relation['schema']>;

		const parentRelationPayload: Partial<Relation> = {
			collection: translationsCollection,
			field: resolvedParentForeignKeyField,
			related_collection: collection,
			meta: {
				one_field: 'translations',
				sort_field: null,
				one_deselect_action: 'nullify',
				junction_field: resolvedLanguageForeignKeyField,
			} as unknown as RelationMeta,
			schema: onDeleteSchema,
		};

		await relationsService.createOne(parentRelationPayload, mutationOptions);

		const languageRelationPayload: Partial<Relation> = {
			collection: translationsCollection,
			field: resolvedLanguageForeignKeyField,
			related_collection: languagesCollection,
			meta: {
				one_field: null,
				sort_field: null,
				one_deselect_action: 'nullify',
				junction_field: resolvedParentForeignKeyField,
			},
			schema: onDeleteSchema,
		};

		await relationsService.createOne(languageRelationPayload, mutationOptions);

		currentSchema = await getSchema({ database: trx, bypassCache: true });

		const fieldsService = new FieldsService(getServiceOptions(currentSchema));

		const resolvedLanguagesCollection = currentSchema.collections[languagesCollection];

		if (!resolvedLanguagesCollection) {
			throw new InvalidPayloadError({
				reason: `Languages collection "${languagesCollection}" was not found in refreshed schema`,
			});
		}

		const languagesFields = resolvedLanguagesCollection.fields;
		const languageField = languagesFields['name'] ? 'name' : null;
		const languageDirectionField = languagesFields['direction'] ? 'direction' : null;

		const translationsAliasField: Partial<Field> & { field: string; type: Type | null } = {
			field: 'translations',
			type: 'alias',
			meta: {
				interface: 'translations',
				special: ['translations'],
				options: {
					languageField,
					languageDirectionField,
				},
			} as unknown as FieldMeta,
		};

		await fieldsService.createField(collection, translationsAliasField, undefined, mutationOptions);

		return {
			created: true as const,
			translationsCollection,
			languagesCollection,
			fields: fieldNames,
		};
	});

	if (nestedActionEvents.length > 0) {
		try {
			const updatedSchema = await getSchema({ database: options.knex, bypassCache: true });

			for (const nestedActionEvent of nestedActionEvents) {
				nestedActionEvent.context.schema = updatedSchema;
				emitter.emitAction(nestedActionEvent.event, nestedActionEvent.meta, nestedActionEvent.context);
			}
		} catch (error) {
			logger.warn(error, 'Failed to emit nested translation actions after generate-translations commit');
		}
	}

	return result;
}
