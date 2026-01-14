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
			// skip Pk
			if (field.schema?.is_primary_key || field.schema?.has_auto_increment) continue;
			// skip aliases or missing type
			if (!field.type || ALIAS_TYPES.includes(field.type)) continue;

			field.schema = {
				...field.schema,
				is_unique: false,
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

		const shadowCollection = `directus_version_${relation.collection}`;

		// TODO: Perfer cache bust? Edge case of self reference and enabled.
		const schema = await getSchema({ database: this.knex, bypassCache: true });

		try {
			await transaction(this.knex, async (trx) => {
				if (relation.related_collection) {
					await trx.schema.alterTable(shadowCollection, async (table) => {
						// Copied from RelationsService.alterType
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
							const alterField = table.specificType(relation.field!, 'int unsigned');

							// Maintains the non-nullable state
							if (!fieldOverview?.nullable) {
								alterField.notNullable();
							}

							alterField.alter();
						}

						const constraintName: string = getDefaultIndexName('foreign', shadowCollection, relation.field!);

						const builder = table
							.foreign(relation.field!, constraintName)
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

					// duplicate relational field with a prefix if the pointed relation is also versioned
					if (schema.collections[relation.related_collection]!.versioned) {
						const shadowRelatedCollection = `directus_version_${relation.related_collection}`;
						const shadowField = `directus_${relation.field}`;

						const fieldsService = new FieldsService({ knex: trx, schema });

						const field = (await fieldsService.readOne(relation.collection!, relation.field!)) as Field;

						await trx.schema.alterTable(shadowCollection, (table) => {
							fieldsService.addColumnToTable(table, shadowCollection, {
								...field,
								field: shadowField,
								schema: { ...field.schema, is_unique: false },
							});

							// Copied from RelationsService.alterType
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
								const alterField = table.specificType(shadowField, 'int unsigned');

								// Maintains the non-nullable state
								if (!fieldOverview?.nullable) {
									alterField.notNullable();
								}

								alterField.alter();
							}

							const constraintName: string = getDefaultIndexName('foreign', shadowRelatedCollection, shadowField);

							const builder = table
								.foreign(shadowField, constraintName)
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

					await trx.schema.alterTable(shadowCollection, async (table) => {
						let constraintName: string = getDefaultIndexName('foreign', shadowCollection, field);

						// If the FK already exists in the DB, drop it first
						if (relation?.schema) {
							constraintName = relation.schema.constraint_name || constraintName;
							table.dropForeign(field, constraintName);

							constraintName = this.helpers.schema.constraintName(constraintName);
							relation.schema.constraint_name = constraintName;
						}

						// Copied from RelationsService.alterType
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
							const alterField = table.specificType(relation.field!, 'int unsigned');

							// Maintains the non-nullable state
							if (!fieldOverview?.nullable) {
								alterField.notNullable();
							}

							alterField.alter();
						}

						const builder = table
							.foreign(field, constraintName || undefined)
							.references(
								`${relation.related_collection!}.${this.schema.collections[relation.related_collection!]!.primary}`,
							);

						if (relation.schema?.on_delete) {
							builder.onDelete(relation.schema.on_delete);
						}

						if (relation.schema?.on_update) {
							builder.onUpdate(relation.schema.on_update);
						}

						// update duplicate relational field if pointed relation is also versioned
						if (this.schema.collections[relation.related_collection!]!.versioned) {
							const shadowRelatedCollection = `directus_version_${relation.related_collection}`;
							const shadowField = `directus_${field}`;

							let constraintName: string = getDefaultIndexName('foreign', shadowRelatedCollection, shadowField);

							// If the FK already exists in the DB, drop it first
							if (relation?.schema) {
								constraintName = relation.schema.constraint_name || constraintName;
								table.dropForeign(shadowField, constraintName);

								constraintName = this.helpers.schema.constraintName(constraintName);
								relation.schema.constraint_name = constraintName;
							}

							// Copied from RelationsService.alterType
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

								// Maintains the non-nullable state
								if (!fieldOverview?.nullable) {
									alterField.notNullable();
								}

								alterField.alter();
							}

							const builder = table
								.foreign(field, constraintName || undefined)
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

	async deleteShadowRelation(relation: Relation, constraints: (string | null)[]) {
		const shadowCollection = `directus_version_${relation.collection}`;

		const existingRelation = this.schema.relations.find(
			(existingRelation) =>
				existingRelation.collection === shadowCollection && existingRelation.field === relation.field,
		);

		if (existingRelation?.schema?.constraint_name && constraints.includes(existingRelation.schema.constraint_name)) {
			await this.knex.schema.alterTable(existingRelation.collection, (table) => {
				table.dropForeign(existingRelation.field, existingRelation.schema!.constraint_name!);
			});
		}

		// delete duplicate constraint and field if pointer is versioned
		if (relation.related_collection && this.schema.collections[relation.related_collection]?.versioned) {
			const shadowRelatedCollection = `directus_${relation.related_collection}`;
			const shadowField = `directus_${relation.field}`;

			const existingRelation = this.schema.relations.find(
				(existingRelation) =>
					existingRelation.collection === shadowRelatedCollection && existingRelation.field === shadowField,
			);

			if (existingRelation?.schema?.constraint_name && constraints.includes(existingRelation.schema.constraint_name)) {
				await this.knex.schema.alterTable(existingRelation.collection, (table) => {
					table.dropForeign(existingRelation.field, existingRelation.schema!.constraint_name!);
				});

				// drop duplicate now that FK removed
				await this.knex.schema.alterTable(shadowRelatedCollection, (table) => {
					table.dropColumn(shadowField);
				});
			}
		}
	}

	async createShadowField(
		collection: string,
		field: Partial<Field> & { field: string; type: Type | null },
		table?: Knex.CreateTableBuilder, // allows collection creation to)
	) {
		const fieldsService = new FieldsService({ knex: this.knex, schema: this.schema });

		const shadowCollection = `directus_version_${collection}`;

		if (table) {
			fieldsService.addColumnToTable(table, shadowCollection, field);
		} else {
			await this.knex.schema.alterTable(shadowCollection, (table) => {
				fieldsService.addColumnToTable(table, shadowCollection, field);
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

		await this.knex.schema.alterTable(shadowCollection, (table) => {
			fieldsService.addColumnToTable(table, shadowCollection, field, {
				existing,
			});
		});
	}

	async deleteShadowField(collection: string, field: string) {
		const shadowCollection = `directus_version_${collection}`;

		await this.knex.schema.alterTable(shadowCollection, (table) => {
			table.dropColumn(field);
		});
	}
}
