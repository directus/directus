import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import database from '../database';
import { clone, isObject, cloneDeep } from 'lodash';
import { Item, AbstractServiceOptions, Accountability, PrimaryKey, SchemaOverview } from '../types';
import { ItemsService } from './items';
import { Knex } from 'knex';
import { format, formatISO, parse, parseISO } from 'date-fns';
import { ForbiddenException } from '../exceptions';
import { toArray } from '../utils/to-array';
import { systemRelationRows } from '../database/system-data/relations';
import { InvalidPayloadException } from '../exceptions';
import { isPlainObject } from 'lodash';
import Joi from 'joi';

type Action = 'create' | 'read' | 'update';

type Transformers = {
	[type: string]: (context: {
		action: Action;
		value: any;
		payload: Partial<Item>;
		accountability: Accountability | null;
	}) => Promise<any>;
};

type Alterations = {
	create: {
		[key: string]: any;
	}[];
	update: {
		[key: string]: any;
	}[];
	delete: (Number | String)[];
};

/**
 * Process a given payload for a collection to ensure the special fields (hash, uuid, date etc) are
 * handled correctly.
 */
export class PayloadService {
	accountability: Accountability | null;
	knex: Knex;
	collection: string;
	schema: SchemaOverview;

	constructor(collection: string, options: AbstractServiceOptions) {
		this.accountability = options.accountability || null;
		this.knex = options.knex || database;
		this.collection = collection;
		this.schema = options.schema;

		return this;
	}

	/**
	 * @todo allow this to be extended
	 *
	 * @todo allow these extended special types to have "field dependencies"?
	 * f.e. the file-links transformer needs the id and filename_download to be fetched from the DB
	 * in order to work
	 */
	public transformers: Transformers = {
		async hash({ action, value }) {
			if (!value) return;

			if (action === 'create' || action === 'update') {
				return await argon2.hash(String(value));
			}

			return value;
		},
		async uuid({ action, value }) {
			if (action === 'create' && !value) {
				return uuidv4();
			}

			return value;
		},
		async boolean({ action, value }) {
			if (action === 'read') {
				return value === true || value === 1 || value === '1';
			}

			return value;
		},
		async json({ action, value }) {
			if (action === 'read') {
				if (typeof value === 'string') {
					try {
						return JSON.parse(value);
					} catch {
						return value;
					}
				}
			}

			return value;
		},
		async conceal({ action, value }) {
			if (action === 'read') return value ? '**********' : null;
			return value;
		},
		async 'user-created'({ action, value, payload, accountability }) {
			if (action === 'create') return accountability?.user || null;
			return value;
		},
		async 'user-updated'({ action, value, payload, accountability }) {
			if (action === 'update') return accountability?.user || null;
			return value;
		},
		async 'role-created'({ action, value, payload, accountability }) {
			if (action === 'create') return accountability?.role || null;
			return value;
		},
		async 'role-updated'({ action, value, payload, accountability }) {
			if (action === 'update') return accountability?.role || null;
			return value;
		},
		async 'date-created'({ action, value }) {
			if (action === 'create') return new Date();
			return value;
		},
		async 'date-updated'({ action, value }) {
			if (action === 'update') return new Date();
			return value;
		},
		async csv({ action, value }) {
			if (!value) return;
			if (action === 'read') return value.split(',');

			if (Array.isArray(value)) return value.join(',');
			return value;
		},
	};

	processValues(action: Action, payloads: Partial<Item>[]): Promise<Partial<Item>[]>;
	processValues(action: Action, payload: Partial<Item>): Promise<Partial<Item>>;
	async processValues(
		action: Action,
		payload: Partial<Item> | Partial<Item>[]
	): Promise<Partial<Item> | Partial<Item>[]> {
		let processedPayload = toArray(payload);

		if (processedPayload.length === 0) return [];

		const fieldsInPayload = Object.keys(processedPayload[0]);

		let specialFieldsInCollection = Object.entries(this.schema.collections[this.collection].fields).filter(
			([name, field]) => field.special && field.special.length > 0
		);

		if (action === 'read') {
			specialFieldsInCollection = specialFieldsInCollection.filter(([name, field]) => {
				return fieldsInPayload.includes(name);
			});
		}

		await Promise.all(
			processedPayload.map(async (record: any) => {
				await Promise.all(
					specialFieldsInCollection.map(async ([name, field]) => {
						const newValue = await this.processField(field, record, action, this.accountability);
						if (newValue !== undefined) record[name] = newValue;
					})
				);
			})
		);

		await this.processDates(processedPayload, action);

		if (['create', 'update'].includes(action)) {
			processedPayload.forEach((record) => {
				for (const [key, value] of Object.entries(record)) {
					if (Array.isArray(value) || (typeof value === 'object' && value instanceof Date !== true && value !== null)) {
						record[key] = JSON.stringify(value);
					}
				}
			});
		}

		if (Array.isArray(payload)) {
			return processedPayload;
		}

		return processedPayload[0];
	}

	async processField(
		field: SchemaOverview['collections'][string]['fields'][string],
		payload: Partial<Item>,
		action: Action,
		accountability: Accountability | null
	) {
		if (!field.special) return payload[field.field];
		const fieldSpecials = field.special ? toArray(field.special) : [];

		let value = clone(payload[field.field]);

		for (const special of fieldSpecials) {
			if (this.transformers.hasOwnProperty(special)) {
				value = await this.transformers[special]({
					action,
					value,
					payload,
					accountability,
				});
			}
		}

		return value;
	}

	/**
	 * Knex returns `datetime` and `date` columns as Date.. This is wrong for date / datetime, as those
	 * shouldn't return with time / timezone info respectively
	 */
	async processDates(payloads: Partial<Record<string, any>>[], action: Action) {
		const fieldsInCollection = Object.entries(this.schema.collections[this.collection].fields);

		const dateColumns = fieldsInCollection.filter(([name, field]) =>
			['dateTime', 'date', 'timestamp'].includes(field.type)
		);

		if (dateColumns.length === 0) return payloads;

		for (const [name, dateColumn] of dateColumns) {
			for (const payload of payloads) {
				let value = payload[name];

				if (value === null || value === '0000-00-00') {
					payload[name] = null;
					continue;
				}

				if (!value) continue;

				if (action === 'read') {
					if (typeof value === 'string') value = new Date(value);

					if (dateColumn.type === 'timestamp') {
						const newValue = formatISO(value);
						payload[name] = newValue;
					}

					if (dateColumn.type === 'dateTime') {
						// Strip off the Z at the end of a non-timezone datetime value
						const newValue = format(value, "yyyy-MM-dd'T'HH:mm:ss");
						payload[name] = newValue;
					}

					if (dateColumn.type === 'date') {
						// Strip off the time / timezone information from a date-only value
						const newValue = format(value, 'yyyy-MM-dd');
						payload[name] = newValue;
					}
				} else {
					if (value instanceof Date === false) {
						if (dateColumn.type === 'date') {
							const newValue = parse(value, 'yyyy-MM-dd', new Date());
							payload[name] = newValue;
						}

						if (dateColumn.type === 'timestamp' || dateColumn.type === 'dateTime') {
							const newValue = parseISO(value);
							payload[name] = newValue;
						}
					}
				}
			}
		}

		return payloads;
	}

	/**
	 * Recursively save/update all nested related Any-to-One items
	 */
	async processA2O(data: Partial<Item>): Promise<{ payload: Partial<Item>; revisions: PrimaryKey[] }> {
		const relations = this.schema.relations.filter((relation) => {
			return relation.many_collection === this.collection;
		});

		const revisions: PrimaryKey[] = [];

		let payload = cloneDeep(data);

		// Only process related records that are actually in the payload
		const relationsToProcess = relations.filter((relation) => {
			return payload.hasOwnProperty(relation.many_field) && isPlainObject(payload[relation.many_field]);
		});

		for (const relation of relationsToProcess) {
			// If the required a2o configuration fields are missing, this is a m2o instead of an a2o
			if (!relation.one_collection_field || !relation.one_allowed_collections) continue;

			const relatedCollection = payload[relation.one_collection_field];

			if (!relatedCollection) {
				throw new InvalidPayloadException(
					`Can't update nested record "${relation.many_collection}.${relation.many_field}" without field "${relation.many_collection}.${relation.one_collection_field}" being set`
				);
			}

			const allowedCollections = relation.one_allowed_collections;

			if (allowedCollections.includes(relatedCollection) === false) {
				throw new InvalidPayloadException(
					`"${relation.many_collection}.${relation.many_field}" can't be linked to collection "${relatedCollection}`
				);
			}

			const itemsService = new ItemsService(relatedCollection, {
				accountability: this.accountability,
				knex: this.knex,
				schema: this.schema,
			});

			const relatedPrimary = this.schema.collections[relatedCollection].primary;
			const relatedRecord: Partial<Item> = payload[relation.many_field];
			const hasPrimaryKey = relatedRecord.hasOwnProperty(relatedPrimary);

			let relatedPrimaryKey: PrimaryKey = relatedRecord[relatedPrimary];

			const exists =
				hasPrimaryKey &&
				!!(await this.knex
					.select(relatedPrimary)
					.from(relatedCollection)
					.where({ [relatedPrimary]: relatedPrimaryKey })
					.first());

			if (exists) {
				await itemsService.updateOne(relatedPrimaryKey, relatedRecord);
			} else {
				relatedPrimaryKey = await itemsService.createOne(relatedRecord, {
					onRevisionCreate: (id) => revisions.push(id),
				});
			}

			// Overwrite the nested object with just the primary key, so the parent level can be saved correctly
			payload[relation.many_field] = relatedPrimaryKey;
		}

		return { payload, revisions };
	}

	/**
	 * Save/update all nested related m2o items inside the payload
	 */
	async processM2O(data: Partial<Item>): Promise<{ payload: Partial<Item>; revisions: PrimaryKey[] }> {
		const payload = cloneDeep(data);

		// All the revisions saved on this level
		let revisions: PrimaryKey[] = [];

		// Many to one relations that exist on the current collection
		const relations = this.schema.relations.filter((relation) => {
			return relation.many_collection === this.collection;
		});

		// Only process related records that are actually in the payload
		const relationsToProcess = relations.filter((relation) => {
			return payload.hasOwnProperty(relation.many_field) && isObject(payload[relation.many_field]);
		});

		for (const relation of relationsToProcess) {
			// If no "one collection" exists, this is a A2O, not a M2O
			if (!relation.one_collection || !relation.one_primary) continue;

			// Items service to the related collection
			const itemsService = new ItemsService(relation.one_collection, {
				accountability: this.accountability,
				knex: this.knex,
				schema: this.schema,
			});

			const relatedRecord: Partial<Item> = payload[relation.many_field];
			const hasPrimaryKey = relatedRecord.hasOwnProperty(relation.one_primary);

			if (['string', 'number'].includes(typeof relatedRecord)) continue;

			let relatedPrimaryKey: PrimaryKey = relatedRecord[relation.one_primary];

			const exists =
				hasPrimaryKey &&
				!!(await this.knex
					.select(relation.one_primary)
					.from(relation.one_collection)
					.where({ [relation.one_primary]: relatedPrimaryKey })
					.first());

			if (exists) {
				await itemsService.updateOne(relatedPrimaryKey, relatedRecord);
			} else {
				relatedPrimaryKey = await itemsService.createOne(relatedRecord, {
					onRevisionCreate: (id) => revisions.push(id),
				});
			}

			// Overwrite the nested object with just the primary key, so the parent level can be saved correctly
			payload[relation.many_field] = relatedPrimaryKey;
		}

		return { payload, revisions };
	}

	/**
	 * Recursively save/update all nested related o2m items
	 */
	async processO2M(data: Partial<Item>, parent: PrimaryKey): Promise<{ revisions: PrimaryKey[] }> {
		const revisions: PrimaryKey[] = [];

		const relations = this.schema.relations.filter((relation) => {
			return relation.one_collection === this.collection;
		});

		let payload = cloneDeep(data);

		// Only process related records that are actually in the payload
		const relationsToProcess = relations.filter((relation) => {
			if (!relation.one_field) return false;
			return payload.hasOwnProperty(relation.one_field);
		});

		const nestedUpdateSchema = Joi.object({
			create: Joi.array().items(Joi.object().unknown()),
			update: Joi.array().items(Joi.object().unknown()),
			delete: Joi.array().items(Joi.string(), Joi.number()),
		});

		for (const relation of relationsToProcess) {
			if (!payload[relation.one_field!]) continue;

			const itemsService = new ItemsService(relation.many_collection, {
				accountability: this.accountability,
				knex: this.knex,
				schema: this.schema,
			});

			const relatedRecords: Partial<Item>[] = [];

			// Nested array of individual items
			if (Array.isArray(payload[relation.one_field!])) {
				for (let i = 0; i < (payload[relation.one_field!] || []).length; i++) {
					const relatedRecord = (payload[relation.one_field!] || [])[i];

					let record = cloneDeep(relatedRecord);

					if (typeof relatedRecord === 'string' || typeof relatedRecord === 'number') {
						const exists = !!(await this.knex
							.select(relation.many_primary)
							.from(relation.many_collection)
							.where({ [relation.many_primary]: record })
							.first());

						if (exists === false) {
							throw new ForbiddenException(undefined, {
								item: record,
								collection: relation.many_collection,
							});
						}

						record = {
							[relation.many_primary]: relatedRecord,
						};
					}

					relatedRecords.push({
						...record,
						[relation.many_field]: parent || payload[relation.one_primary!],
					});
				}

				const savedPrimaryKeys = await itemsService.upsertMany(relatedRecords);

				await itemsService.updateByQuery(
					{
						filter: {
							_and: [
								{
									[relation.many_field]: {
										_eq: parent,
									},
								},
								{
									[relation.many_primary]: {
										_nin: savedPrimaryKeys,
									},
								},
							],
						},
					},
					{ [relation.many_field]: null }
				);
			}
			// "Updates" object w/ create/update/delete
			else {
				const alterations = payload[relation.one_field!] as Alterations;
				const { error } = nestedUpdateSchema.validate(alterations);
				if (error) throw new InvalidPayloadException(`Invalid one-to-many update structure: ${error.message}`);

				if (alterations.create) {
					await itemsService.createMany(
						alterations.create.map((item) => ({
							...item,
							[relation.many_field]: parent || payload[relation.one_primary!],
						}))
					);
				}

				if (alterations.update) {
					const primaryKeyField = this.schema.collections[this.collection].primary;

					for (const item of alterations.update) {
						await itemsService.updateOne(item[primaryKeyField], {
							...item,
							[relation.many_field]: parent || payload[relation.one_primary!],
						});
					}
				}

				if (alterations.delete) {
					await itemsService.updateByQuery(
						{
							filter: {
								_and: [
									{
										[relation.many_field]: {
											_eq: parent,
										},
									},
									{
										[relation.many_primary]: {
											_in: alterations.delete,
										},
									},
								],
							},
						},
						{ [relation.many_field]: null }
					);
				}
			}
		}

		return { revisions };
	}
}
