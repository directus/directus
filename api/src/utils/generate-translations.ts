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

function buildTranslationsAliasField(
	languagesFields: Record<string, unknown>,
): Partial<Field> & { field: string; type: Type | null } {
	return {
		field: 'translations',
		type: 'alias',
		meta: {
			interface: 'translations',
			special: ['translations'],
			options: {
				languageField: languagesFields['name'] ? 'name' : null,
				languageDirectionField: languagesFields['direction'] ? 'direction' : null,
			},
		} as unknown as FieldMeta,
	};
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

		const validateExistingTranslationsCollection = async (): Promise<{
			parentRelation: Relation;
			languageRelation: Relation;
		}> => {
			const invalidCollectionError = new InvalidPayloadError({
				reason: `Collection "${translationsCollection}" is not a valid translations collection for "${collection}"`,
			});

			// Find parent relation — first try intact (one_field set), then orphaned (one_field null)
			let parentRelations = currentSchema.relations.filter(
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

			// When the translations alias field is deleted, one_field gets set to null.
			// Detect this orphaned state and restore the field + relation.
			if (parentRelations.length === 0) {
				const orphanedRelations = currentSchema.relations.filter(
					(relation) =>
						relation.collection === translationsCollection &&
						relation.related_collection === collection &&
						(relation.meta?.one_collection === null || relation.meta?.one_collection === collection) &&
						(relation.meta?.many_collection === null || relation.meta?.many_collection === translationsCollection) &&
						relation.meta?.one_field === null &&
						typeof relation.meta?.junction_field === 'string' &&
						relation.meta.junction_field.length > 0,
				);

				if (orphanedRelations.length === 1) {
					const orphanedRelation = orphanedRelations[0]!;
					const languageFkField = orphanedRelation.meta!.junction_field!;

					const orphanedLanguageRelation = currentSchema.relations.find(
						(relation) =>
							relation.collection === translationsCollection &&
							relation.field === languageFkField &&
							relation.meta?.junction_field === orphanedRelation.field &&
							typeof relation.related_collection === 'string' &&
							relation.related_collection.length > 0,
					);

					if (!orphanedLanguageRelation) throw invalidCollectionError;

					const resolvedLangsCollection = orphanedLanguageRelation.related_collection!;
					const langsFields = currentSchema.collections[resolvedLangsCollection]?.fields ?? {};

					// Recreate the translations alias field on the parent collection
					const fieldsService = new FieldsService(getServiceOptions(currentSchema));

					await fieldsService.createField(
						collection,
						buildTranslationsAliasField(langsFields),
						undefined,
						mutationOptions,
					);

					// Update relation meta to restore one_field (use ItemsService directly to
					// avoid RelationsService.updateOne which triggers alterTable/alterType)
					const relationsItemService = new ItemsService('directus_relations', {
						knex: trx,
						schema: currentSchema,
					});

					await relationsItemService.updateOne(
						orphanedRelation.meta!.id,
						{ one_field: 'translations' },
						mutationOptions,
					);

					// Refresh schema and sourceCollection reference after restoration
					currentSchema = await getSchema({ database: trx, bypassCache: true });

					// Re-query with the intact filter now that one_field is restored
					parentRelations = currentSchema.relations.filter(
						(relation) =>
							relation.collection === translationsCollection &&
							relation.related_collection === collection &&
							relation.meta?.one_field === 'translations' &&
							typeof relation.meta?.junction_field === 'string' &&
							relation.meta.junction_field.length > 0,
					);
				}
			}

			if (parentRelations.length !== 1) throw invalidCollectionError;

			const parentRelation = parentRelations[0]!;
			const translationField = parentRelation.meta!.one_field!;

			// Use currentSchema (may have been refreshed after orphan recovery) instead of
			// the potentially stale sourceCollection snapshot
			const currentSourceCollection = currentSchema.collections[collection];
			const sourceTranslationField = currentSourceCollection?.fields[translationField];

			const sourceTranslationSpecials = Array.isArray(sourceTranslationField?.special)
				? sourceTranslationField.special
				: [];

			if (!sourceTranslationField || !sourceTranslationSpecials.includes('translations')) {
				throw invalidCollectionError;
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

			if (!languageRelation) throw invalidCollectionError;

			return { parentRelation, languageRelation };
		};

		const existingTranslationsCollection = currentSchema.collections[translationsCollection];

		if (existingTranslationsCollection) {
			const { parentRelation, languageRelation } = await validateExistingTranslationsCollection();

			// Filter out fields that already exist in the junction table (e.g. when re-enabling
			// translations after deleting the alias field but keeping the junction)
			const newFieldNames = fieldNames.filter((fieldName) => {
				if (sourceCollection.fields[fieldName] === undefined) {
					throw new InvalidPayloadError({ reason: `Field "${fieldName}" does not exist on "${collection}"` });
				}

				return existingTranslationsCollection.fields[fieldName] === undefined;
			});

			if (newFieldNames.length > 0) {
				const sourceFieldsService = new FieldsService(getServiceOptions(currentSchema));

				const sourceFields = await Promise.all(
					newFieldNames.map(async (fieldName) => (await sourceFieldsService.readOne(collection, fieldName)) as Field),
				);

				validateFieldsEligibility(sourceFields);

				const clonedFields = cloneFields({ fields: newFieldNames, sourceFields });

				// Rebuild sort order so new fields are interleaved with existing fields
				// in the same relative order as the parent collection
				const allParentFields: { field: string; sort: number | null }[] = await trx
					.from('directus_fields')
					.where({ collection })
					.select('field', 'sort');

				const parentSortMap = new Map(allParentFields.map((f) => [f.field, f.sort ?? Infinity]));

				const existingTransFields: { field: string; sort: number | null }[] = await trx
					.from('directus_fields')
					.where({ collection: translationsCollection })
					.select('field', 'sort');

				const systemFieldNames = new Set(['id', parentRelation.field, languageRelation.field]);

				const maxSystemSort = existingTransFields
					.filter((f) => systemFieldNames.has(f.field))
					.reduce((max, f) => Math.max(max, f.sort ?? 0), 0);

				const existingContentFields = existingTransFields.filter((f) => !systemFieldNames.has(f.field));

				const allContentFieldNames = [...existingContentFields.map((f) => f.field), ...newFieldNames];

				allContentFieldNames.sort((a, b) => {
					const diff = (parentSortMap.get(a) ?? Infinity) - (parentSortMap.get(b) ?? Infinity);
					if (diff !== 0) return diff;
					return a.localeCompare(b);
				});

				let nextSort = maxSystemSort + 1;
				const sortAssignments = new Map<string, number>();

				for (const fieldName of allContentFieldNames) {
					sortAssignments.set(fieldName, nextSort++);
				}

				for (const existing of existingContentFields) {
					const newSort = sortAssignments.get(existing.field);

					if (newSort !== undefined && newSort !== existing.sort) {
						await trx('directus_fields')
							.where({ collection: translationsCollection, field: existing.field })
							.update({ sort: newSort });
					}
				}

				for (const clonedField of clonedFields) {
					const sort = sortAssignments.get(clonedField.field);

					if (sort !== undefined) {
						clonedField.meta = { ...clonedField.meta, sort };
					}
				}

				clonedFields.sort(
					(a, b) => (sortAssignments.get(a.field) ?? Infinity) - (sortAssignments.get(b.field) ?? Infinity),
				);

				const fieldsService = new FieldsService(getServiceOptions(currentSchema));

				for (const clonedField of clonedFields) {
					await fieldsService.createField(
						translationsCollection,
						clonedField as Parameters<FieldsService['createField']>[1],
						undefined,
						mutationOptions,
					);
				}
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

		let languagePrimaryKeyField: string;
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
			} as unknown as RelationMeta,
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

		await fieldsService.createField(
			collection,
			buildTranslationsAliasField(resolvedLanguagesCollection.fields),
			undefined,
			mutationOptions,
		);

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
