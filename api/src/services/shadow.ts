import type { Column } from '@directus/schema';
import type {
	AbstractServiceOptions,
	Accountability,
	Field,
	RawField,
	Relation,
	SchemaOverview,
	Type,
} from '@directus/types';
import type { Knex } from 'knex';
import { ALIAS_TYPES } from '../constants.js';
import type { Helpers } from '../database/helpers/index.js';
import { getHelpers } from '../database/helpers/index.js';
import getDatabase from '../database/index.js';
import { getDefaultIndexName } from '../utils/get-default-index-name.js';
import { getSchema } from '../utils/get-schema.js';
import { transaction } from '../utils/transaction.js';
import { FieldsService } from './fields.js';
import { RelationsService } from './relations.js';

export class ShadowsService {
	knex: Knex;
	helpers: Helpers;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.helpers = getHelpers(this.knex);
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}

	async createShadowTable(collection: string, fields?: Array<RawField | Field>) {
		const injectedPrimaryKeyField: RawField = {
			field: 'id',
			type: 'integer',
			meta: {
				hidden: true,
				interface: 'numeric',
				readonly: true,
			},
			schema: {
				is_primary_key: true,
				has_auto_increment: true,
			},
		};

		const shadowCollection = `directus_version_${collection}`;
		const shadowFields = [injectedPrimaryKeyField];

		for (const field of fields ?? []) {
			// Skip original primary keys or auto-increment columns
			if (field.schema?.is_primary_key || field.schema?.has_auto_increment) continue;
			// Skip aliases or fields without a concrete database type
			if (!field.type || ALIAS_TYPES.includes(field.type)) continue;

			// Shadow tables should not enforce uniqueness
			field.schema = {
				...field.schema,
				is_unique: false,
				// TODO: is_indexes if is_unque true?
			};

			shadowFields.push(field);
		}

		const fieldsService = new FieldsService({ knex: this.knex, schema: this.schema });

		await this.knex.schema.createTable(shadowCollection, (table) => {
			for (const shadowField of shadowFields) {
				fieldsService.addColumnToTable(table, shadowCollection, shadowField);
			}
		});
	}

	async dropShadowTable(collection: string) {
		const shadowCollection = `directus_version_${collection}`;

		await this.knex.schema.dropTableIfExists(shadowCollection);
	}

	async createShadowRelation(relation: Partial<Relation>) {
		const runPostColumnChange = await this.helpers.schema.preColumnChange();
		this.helpers.schema.preRelationChange(relation);

		/*
		 *  Bypass Perfer cache bust?
		 * Avoid edge cases with self-referencing relations that are added on createTable
		 */
		const schema = await getSchema({ database: this.knex, bypassCache: true });

		try {
			await transaction(this.knex, async (trx) => {
				if (relation.related_collection) {
					const shadowCollection = `directus_version_${relation.collection}`;
					const shadowField = relation.field!;

					await trx.schema.alterTable(shadowCollection, async (table) => {
						// Copied from RelationsService.alterType, required for MySQL
						const fieldOverview = schema.collections[relation.collection!]!.fields[shadowField];

						const relatedFieldDBType =
							schema.collections[relation.related_collection!]!.fields[
								schema.collections[relation.related_collection!]!.primary
							]!.dbType;

						if (
							fieldOverview?.dbType !== relatedFieldDBType &&
							fieldOverview?.dbType === 'int' &&
							relatedFieldDBType === 'int unsigned'
						) {
							const alterField = table.specificType(shadowField, 'int unsigned');

							// Preserve nullibility
							if (!fieldOverview?.nullable) {
								alterField.notNullable();
							}

							alterField.alter();
						}

						const constraintName: string = getDefaultIndexName('foreign', shadowCollection, shadowField);

						const builder = table
							.foreign(shadowField, constraintName)
							.references(
								`${relation.related_collection!}.${schema.collections[relation.related_collection!]!.primary}`,
							);

						if (relation.schema?.on_delete) {
							builder.onDelete(relation.schema.on_delete);
						}

						if (relation.schema?.on_update) {
							builder.onUpdate(relation.schema.on_update);
						}
					});

					/**
					 * If the related collection is versioned, create a duplicated prefixed FK
					 * that points to the related shadow table.
					 *
					 * TODO: Research stringified value showing instead of raw (e.g. 'null' vs NULL) only for duplicate
					 */
					if (schema.collections[relation.related_collection]!.versioned) {
						const shadowRelatedCollection = `directus_version_${relation.related_collection}`;

						const fieldsService = new FieldsService({ knex: trx, schema });

						const field = (await fieldsService.readOne(relation.collection!, relation.field!)) as Field;

						const shadowRelatedField = {
							...field,
							field: `directus_${relation.field}`,
							schema: {
								...field.schema,
								is_unique: false,
							},
						};

						await trx.schema.alterTable(shadowCollection, (table) => {
							fieldsService.addColumnToTable(table, shadowCollection, shadowRelatedField);

							// Copied from RelationsService.alterType, required for MySQL
							const fieldOverview = schema.collections[relation.collection!]!.fields[relation.field!];

							const relatedFieldDBType =
								schema.collections[relation.related_collection!]!.fields[
									schema.collections[relation.related_collection!]!.primary
								]!.dbType;

							if (
								fieldOverview?.dbType !== relatedFieldDBType &&
								fieldOverview?.dbType === 'int' &&
								relatedFieldDBType === 'int unsigned'
							) {
								const alterField = table.specificType(shadowRelatedField.field, 'int unsigned');

								// Preserve nullibility
								if (!fieldOverview?.nullable) {
									alterField.notNullable();
								}

								alterField.alter();
							}

							const constraintName: string = getDefaultIndexName(
								'foreign',
								shadowRelatedCollection,
								shadowRelatedField.field,
							);

							const builder = table
								.foreign(shadowRelatedField.field, constraintName)
								.references(`${shadowRelatedCollection}.${schema.collections[shadowRelatedCollection]!.primary}`);

							if (relation.schema?.on_delete) {
								builder.onDelete(relation.schema.on_delete);
							}

							if (relation.schema?.on_update) {
								builder.onUpdate(relation.schema.on_update);
							}
						});
					}
				}
			});
		} finally {
			if (runPostColumnChange) {
				await this.helpers.schema.postColumnChange();
			}
		}
	}

	async updateShadowRelation(field: string, relation: Partial<Relation>) {
		const runPostColumnChange = await this.helpers.schema.preColumnChange();
		this.helpers.schema.preRelationChange(relation);

		try {
			await transaction(this.knex, async (trx) => {
				if (relation.related_collection) {
					const shadowCollection = `directus_version_${relation.collection}`;
					const shadowField = field;

					await trx.schema.alterTable(shadowCollection, async (table) => {
						let constraintName: string = getDefaultIndexName('foreign', shadowCollection, shadowField);

						// Drop existing FK if present
						if (relation?.schema) {
							constraintName = relation.schema.constraint_name || constraintName;
							table.dropForeign(shadowField, constraintName);

							constraintName = this.helpers.schema.constraintName(constraintName);
							relation.schema.constraint_name = constraintName;
						}

						// Copied from RelationsService.alterType, required for MySQL
						const fieldOverview = this.schema.collections[relation.collection!]!.fields[relation.field!];

						const relatedFieldDBType =
							this.schema.collections[relation.related_collection!]!.fields[
								this.schema.collections[relation.related_collection!]!.primary
							]!.dbType;

						if (
							fieldOverview?.dbType !== relatedFieldDBType &&
							fieldOverview?.dbType === 'int' &&
							relatedFieldDBType === 'int unsigned'
						) {
							const alterField = table.specificType(shadowField, 'int unsigned');

							// Preserve nullibility
							if (!fieldOverview?.nullable) {
								alterField.notNullable();
							}

							alterField.alter();
						}

						const builder = table
							.foreign(shadowField, constraintName || undefined)
							.references(
								`${relation.related_collection!}.${this.schema.collections[relation.related_collection!]!.primary}`,
							);

						if (relation.schema?.on_delete) {
							builder.onDelete(relation.schema.on_delete);
						}

						if (relation.schema?.on_update) {
							builder.onUpdate(relation.schema.on_update);
						}

						/**
						 * Update duplicated FK if related collection is versioned.
						 */
						if (this.schema.collections[relation.related_collection!]!.versioned) {
							const shadowRelatedCollection = `directus_version_${relation.related_collection}`;
							const shadowRelatedField = `directus_${field}`;

							let constraintName: string = getDefaultIndexName('foreign', shadowRelatedCollection, shadowRelatedField);

							// Drop existing FK if present
							if (relation?.schema) {
								constraintName = relation.schema.constraint_name || constraintName;
								table.dropForeign(shadowRelatedField, constraintName);

								constraintName = this.helpers.schema.constraintName(constraintName);
								relation.schema.constraint_name = constraintName;
							}

							// Copied from RelationsService.alterType, required for MySQL
							const fieldOverview = this.schema.collections[relation.collection!]!.fields[relation.field!];

							const relatedFieldDBType =
								this.schema.collections[relation.related_collection!]!.fields[
									this.schema.collections[relation.related_collection!]!.primary
								]!.dbType;

							if (
								fieldOverview?.dbType !== relatedFieldDBType &&
								fieldOverview?.dbType === 'int' &&
								relatedFieldDBType === 'int unsigned'
							) {
								const alterField = table.specificType(shadowRelatedField, 'int unsigned');

								// Maintains the non-nullable state
								if (!fieldOverview?.nullable) {
									alterField.notNullable();
								}

								alterField.alter();
							}

							const builder = table
								.foreign(shadowRelatedField, constraintName || undefined)
								.references(`${shadowRelatedCollection}.${this.schema.collections[shadowRelatedCollection]!.primary}`);

							if (relation.schema?.on_delete) {
								builder.onDelete(relation.schema.on_delete);
							}

							if (relation.schema?.on_update) {
								builder.onUpdate(relation.schema.on_update);
							}
						}
					});
				}
			});
		} finally {
			if (runPostColumnChange) {
				await this.helpers.schema.postColumnChange();
			}
		}
	}

	async deleteShadowRelation(relation: Relation, constraints?: (string | null)[]) {
		const shadowCollection = `directus_version_${relation.collection}`;

		let constraintNames = constraints;

		if (!constraintNames) {
			const relationsService = new RelationsService({ knex: this.knex, schema: this.schema });
			const existingConstraints = await relationsService.foreignKeys();
			constraintNames = existingConstraints.map((key) => key.constraint_name);
		}

		const existingRelation = this.schema.relations.find(
			(existingRelation) =>
				existingRelation.collection === shadowCollection && existingRelation.field === relation.field,
		);

		if (
			existingRelation?.schema?.constraint_name &&
			constraintNames.includes(existingRelation.schema.constraint_name)
		) {
			await this.knex.schema.alterTable(existingRelation.collection, (table) => {
				table.dropForeign(existingRelation.field, existingRelation.schema!.constraint_name!);
			});
		}

		// Remove duplicated FK + column when related collection is versioned
		if (relation.related_collection && this.schema.collections[relation.related_collection]?.versioned) {
			const shadowRelatedCollection = `directus_version_${relation.related_collection}`;
			const shadowRelatedField = `directus_${relation.field}`;

			const existingRelatedRelation = this.schema.relations.find(
				(existingRelation) =>
					existingRelation.collection === shadowRelatedCollection && existingRelation.field === shadowRelatedField,
			);

			if (
				existingRelatedRelation?.schema?.constraint_name &&
				constraintNames.includes(existingRelatedRelation.schema.constraint_name)
			) {
				// remove FK
				await this.knex.schema.alterTable(existingRelatedRelation.collection, (table) => {
					table.dropForeign(existingRelatedRelation.field, existingRelatedRelation.schema!.constraint_name!);
				});
			}

			// drop duplicate
			await this.knex.schema.alterTable(shadowRelatedCollection, (table) => {
				table.dropColumn(shadowRelatedField);
			});
		}
	}

	async createShadowField(
		collection: string,
		field: Partial<Field> & { field: string; type: Type | null },
		table?: Knex.CreateTableBuilder, // allows collection creation to)
	) {
		const fieldsService = new FieldsService({ knex: this.knex, schema: this.schema });

		const shadowCollection = `directus_version_${collection}`;

		const shadowField = {
			...field,
			schema: {
				...field.schema,
				is_unique: false,
			},
		};

		if (table) {
			fieldsService.addColumnToTable(table, shadowCollection, shadowField);
		} else {
			await this.knex.schema.alterTable(shadowCollection, (table) => {
				fieldsService.addColumnToTable(table, shadowCollection, shadowField);
			});
		}
	}

	async updateShadowField(
		collection: string,
		field: RawField | (Partial<Field> & { field: string; type: Type | null }),
		existing: Column,
	) {
		const fieldsService = new FieldsService({ knex: this.knex, schema: this.schema });

		const shadowCollection = `directus_version_${collection}`;

		const shadowField = {
			...field,
			schema: {
				...field.schema,
				is_unique: false,
			},
		};

		await this.knex.schema.alterTable(shadowCollection, (table) => {
			// Update primary shadow column
			fieldsService.addColumnToTable(table, shadowCollection, shadowField, {
				existing,
			});

			// Check for duplicated M2O FK to versioned table
			shadowField.field = `directus_${shadowField.field}`;

			const relation = this.schema.relations.find(
				(relation) => relation.collection === shadowCollection && relation.field === shadowField.field,
			);

			if (relation) {
				fieldsService.addColumnToTable(table, shadowCollection, shadowField, {
					existing,
				});
			}
		});
	}

	async deleteShadowField(collection: string, field: string) {
		const shadowCollection = `directus_version_${collection}`;

		// if is m2o delete duplicate if existing and drop FKs
		const relation = this.schema.relations.find(
			(relation) => relation.collection === shadowCollection && relation.field === field,
		);

		if (relation) {
			await this.deleteShadowRelation(relation);
		}

		await this.knex.schema.alterTable(shadowCollection, (table) => {
			table.dropColumn(field);
		});
	}
}
