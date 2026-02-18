import type {
	AbstractServiceOptions,
	Accountability,
	Field,
	Item,
	Query,
	QueryOptions,
	RawField,
	Relation,
	SchemaOverview,
	Type,
} from '@directus/types';
import { omit } from 'graphql-compose';
import type { Knex } from 'knex';
import { ALIAS_TYPES, INJECTED_PRIMARY_KEY_FIELD } from '../constants.js';
import type { Helpers } from '../database/helpers/index.js';
import { getHelpers } from '../database/helpers/index.js';
import getDatabase from '../database/index.js';
import { getSchema } from '../utils/get-schema.js';
import { transaction } from '../utils/transaction.js';
import { FieldsService } from './fields.js';
import { ItemsService } from './items.js';
import { RelationsService } from './relations.js';
import { getShadowName } from './shadows/get-shadow-name.js';
import { isShadow } from './shadows/is-shadow.js';

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

	private injectedFields() {
		return [INJECTED_PRIMARY_KEY_FIELD];
	}

	private buildField(field: string, opts?: { shadow?: boolean }): string;
	private buildField(field: RawField, opts?: { shadow?: boolean }): RawField;
	private buildField(field: Field, opts?: { shadow?: boolean }): Field;
	private buildField(field: string | RawField | Field, opts?: { shadow?: boolean }): string | RawField | Field {
		if (typeof field === 'string') {
			if (isShadow(field, 'field')) return field;

			return opts?.shadow ? getShadowName(field, 'field') : field;
		}

		const shadowField = Object.assign({}, field) as RawField | Field;

		if (isShadow(shadowField.field, 'field')) return shadowField;

		// rename if shadow
		if (opts?.shadow) {
			shadowField.field = getShadowName(shadowField.field, 'field');
			shadowField.name &&= getShadowName(shadowField.name, 'field');
			shadowField.collection &&= getShadowName(shadowField.collection, 'collection');

			if (shadowField.schema) {
				shadowField.schema.name &&= getShadowName(shadowField.schema.name, 'field');
				shadowField.schema.table &&= getShadowName(shadowField.schema.table, 'collection');
			}
		}

		// Shadow tables should not enforce uniqueness
		if (shadowField.schema && shadowField.schema.is_unique) {
			shadowField.schema.is_unique = false;
			// TODO: is_indexes if is_unique true?
		}

		// Nullify meta
		// TODO: Should we be tracking it?
		shadowField.meta = null;

		return shadowField;
	}

	private buildRelation(relation: Partial<Relation>, opts?: { shadow?: boolean }): Partial<Relation> {
		const shadowRelation = Object.assign({}, relation) as Partial<Relation>;

		if (isShadow(shadowRelation.collection, 'collection')) return shadowRelation;

		if (opts?.shadow) {
			shadowRelation.field &&= getShadowName(shadowRelation.field, 'field');
			shadowRelation.collection &&= getShadowName(shadowRelation.collection, 'collection');
			shadowRelation.related_collection &&= getShadowName(shadowRelation.related_collection, 'collection');
		} else {
			shadowRelation.collection &&= getShadowName(shadowRelation.collection, 'collection');
		}

		// Nullify meta
		// TODO: Should we be tracking it?
		shadowRelation.meta = null;

		return shadowRelation;
	}

	async createTable(collection: string, fields?: Array<RawField | Field>) {
		const shadowCollection = getShadowName(collection, 'collection');
		const shadowFields = this.injectedFields();

		for (const field of fields ?? []) {
			// Skip original primary key so we can use injected
			// TODO: add `directus_id` field pointing to main table
			if (field.schema?.is_primary_key) continue;

			// Skip aliases or fields without a concrete database type
			if (!field.type || ALIAS_TYPES.includes(field.type)) continue;

			shadowFields.push(this.buildField(field));
		}

		await transaction(this.knex, async (trx) => {
			const shadowsService = new ShadowsService({ knex: trx, schema: this.schema });
			const fieldsService = new FieldsService({ knex: trx, schema: this.schema });

			await trx.schema.createTable(shadowCollection, (table) => {
				for (const shadowField of shadowFields) {
					fieldsService.addColumnToTable(table, shadowCollection, shadowField);
				}
			});

			// link any existing relation fields
			for (const relation of this.schema.relations) {
				// Skip processing existing shadow table relations
				if (isShadow(relation.collection, 'collection')) continue;

				if (relation.collection === collection) {
					// M2O relation defined on the current collection
					await shadowsService.createRelation(relation);
				} else if (
					relation.related_collection === collection &&
					this.schema.collections[relation.collection]?.versioned
				) {
					// M2O relation from another (versioned) collection pointing to this one
					await shadowsService.createRelation(relation, { shadow: true });
				}
			}
		});
	}

	async dropTable(collection: string) {
		const shadowCollection = getShadowName(collection, 'collection');

		await transaction(this.knex, async (trx) => {
			const shadowsService = new ShadowsService({ knex: trx, schema: this.schema });

			// Drop any m2o duplicates pointing to it
			for (const relation of this.schema.relations) {
				if (relation.collection !== shadowCollection && relation.related_collection !== shadowCollection) continue;

				// Delete related o2m fields that point to current collection
				if (relation.related_collection && relation.meta?.one_field) {
					await shadowsService.deleteField(relation.related_collection, relation.meta.one_field);
				}

				// Delete related m2o fields that point to current collection
				if (relation.related_collection === shadowCollection) {
					await shadowsService.deleteField(relation.collection, relation.field);
				}
			}

			await trx.schema.dropTable(shadowCollection);
		});
	}

	async createRelation(relation: Partial<Relation>, opts?: { shadow?: boolean }) {
		if (!relation.related_collection) return;

		const shadowRelation = this.buildRelation(relation);
		let shadowPointerRelation: null | Partial<Relation> = null;

		await transaction(this.knex, async (trx) => {
			// refresh to get self versioned marked
			const schema = await getSchema({ database: trx, bypassCache: true });

			/**
			 * If the related collection is versioned, create a duplicated prefixed FK
			 * field/relation that points to the related shadow table.
			 *
			 */
			if (schema.collections[relation.related_collection!]?.versioned) {
				shadowPointerRelation = this.buildRelation(relation, { shadow: true });

				const fieldsService = new FieldsService({ knex: trx, schema });

				const pointerField = (await fieldsService.readOne(relation.collection!, relation.field!)) as Field;

				const shadowPointerField = this.buildField(pointerField, { shadow: true }) as Field;

				// We create field here so we can create relation later
				const shadowsService = new ShadowsService({
					knex: trx,
					schema,
				});

				await shadowsService.createField(shadowPointerRelation.collection!, shadowPointerField);
			}

			const relationsService = new RelationsService({
				knex: trx,
				// refresh schema so new field is present
				schema: await getSchema({ database: trx, bypassCache: true }),
			});

			if (opts?.shadow !== true) {
				await relationsService.createOne(shadowRelation);
			}

			if (shadowPointerRelation) {
				await relationsService.createOne(shadowPointerRelation);
			}
		});
	}

	async updateRelation(relation: Partial<Relation>, opts?: { shadow?: boolean }) {
		if (!relation.related_collection) return;

		const shadowRelation = this.buildRelation(relation);
		let shadowPointerRelation: null | Partial<Relation> = null;

		await transaction(this.knex, async (trx) => {
			/**
			 * If the related collection is versioned, create a duplicated prefixed FK
			 * that points to the related shadow table.
			 */
			if (this.schema.collections[relation.related_collection!]?.versioned) {
				shadowPointerRelation = this.buildRelation(relation, { shadow: true });
			}

			const relationsService = new RelationsService({
				knex: trx,
				// refresh schema so new field is present
				schema: await getSchema({ database: trx, bypassCache: true }),
			});

			if (opts?.shadow !== true) {
				await relationsService.updateOne(shadowRelation.collection!, shadowRelation.field!, shadowRelation);
			}

			if (shadowPointerRelation) {
				await relationsService.updateOne(shadowRelation.collection!, shadowRelation.field!, shadowPointerRelation);
			}
		});
	}

	async deleteRelation(relation: Relation, opts?: { shadow?: boolean }) {
		await transaction(this.knex, async (trx) => {
			const relationsService = new RelationsService({ knex: trx, schema: this.schema });

			if (opts?.shadow !== true) {
				const shadowRelation = this.buildRelation(relation);
				await relationsService.deleteOne(shadowRelation.collection!, shadowRelation.field!);
			}

			// Remove duplicated FK + column if present
			const shadowPointerRelation = this.buildRelation(relation, { shadow: true });

			// drop FK
			await relationsService.deleteOne(shadowPointerRelation.collection!, shadowPointerRelation.field!);

			// delete duplicated field
			await this.knex.schema.alterTable(shadowPointerRelation.collection!, (table) => {
				table.dropColumn(shadowPointerRelation.field!);
			});
		});
	}

	async createField(
		collection: string,
		field: Partial<Field> & { field: string; type: Type | null },
		table?: Knex.CreateTableBuilder, // allows collection creation to)
	) {
		const fieldsService = new FieldsService({ knex: this.knex, schema: this.schema });

		const shadowCollection = isShadow(collection, 'collection') ? collection : getShadowName(collection, 'collection');

		const shadowField = this.buildField(field) as Field;

		await fieldsService.createField(shadowCollection, shadowField, table);
	}

	async updateField(collection: string, field: RawField | (Partial<Field> & { field: string; type: Type | null })) {
		await transaction(this.knex, async (trx) => {
			const fieldsService = new FieldsService({ knex: trx, schema: this.schema });

			const shadowCollection = isShadow(collection, 'collection')
				? collection
				: getShadowName(collection, 'collection');

			const shadowField = this.buildField(field) as RawField;

			await fieldsService.updateField(shadowCollection, shadowField);

			// update duplicated M2O FK to versioned table
			const isM2O = this.schema.relations.find(
				(relation) => relation.collection === collection && relation.field === field.field,
			);

			if (isM2O) {
				const shadowedField = this.buildField(field, { shadow: true }) as RawField;
				await fieldsService.updateField(shadowCollection, shadowedField);
			}
		});
	}

	async deleteField(collection: string, field: string) {
		const shadowCollection = isShadow(collection, 'collection') ? collection : getShadowName(collection, 'collection');

		const fieldsService = new FieldsService({ knex: this.knex, schema: this.schema });

		await fieldsService.deleteField(shadowCollection, field);

		// delete duplicated M2O FK to versioned table
		const shadowedField = this.buildField(field, { shadow: true });

		const isM2O = this.schema.relations.find(
			(relation) => relation.collection === shadowCollection && relation.field === shadowedField,
		);

		if (isM2O) {
			await fieldsService.deleteField(shadowCollection, shadowedField);
		}
	}
}
