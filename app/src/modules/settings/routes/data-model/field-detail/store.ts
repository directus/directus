/**
 * This is a "local store" meant to make the field data shareable between the different panes
 * and components within the field setup modal flow.
 *
 * It's reset every time the modal opens and shouldn't be used outside of the field-detail flow.
 */

import { getDisplays } from '@/displays';
import { getInterfaces } from '@/interfaces';
import {
	DeepPartial,
	DisplayConfig,
	Field,
	InterfaceConfig,
	Item,
	LocalType,
	Collection,
	Relation,
} from '@directus/shared/types';
import { useCollectionsStore, useFieldsStore, useRelationsStore } from '@/stores/';

import { clone, throttle } from 'lodash';
import { computed, ComputedRef, nextTick, reactive, watch, WatchStopHandle } from 'vue';

type GenerationInfo = {
	name: string;
	type: 'collection' | 'field';
};

let state: {
	fieldData: DeepPartial<Field>;
	relations: DeepPartial<Relation>[];
	newCollections: DeepPartial<Collection & { fields?: DeepPartial<Field>[]; $type?: string }>[];
	newFields: DeepPartial<Field & { $type?: string }>[];
	updateFields: DeepPartial<Field & { $type?: string }>[];
	newRows: Record<string, Item[]>;
	autoFillJunctionRelation: boolean;
};

let availableInterfaces: ComputedRef<InterfaceConfig[]>;
let availableDisplays: ComputedRef<DisplayConfig[]>;
let generationInfo: ComputedRef<GenerationInfo[]>;

export { state, availableInterfaces, availableDisplays, generationInfo, initLocalStore, clearLocalStore };

function initLocalStore(collection: string, field: string, type: LocalType): void {
	const fieldsStore = useFieldsStore();
	const relationsStore = useRelationsStore();
	const collectionsStore = useCollectionsStore();

	const { interfaces } = getInterfaces();
	const { displays } = getDisplays();

	clearLocalStore();

	availableInterfaces = computed<InterfaceConfig[]>(() => {
		return interfaces.value
			.filter((inter: InterfaceConfig) => {
				// Filter out all system interfaces
				if (inter.system === true) return false;

				const matchesType = inter.types.includes(state.fieldData?.type || 'alias');
				const matchesLocalType = (inter.groups || ['standard']).includes(type);

				return matchesType && matchesLocalType;
			})
			.sort((a: InterfaceConfig, b: InterfaceConfig) => (a.name > b.name ? 1 : -1));
	});

	availableDisplays = computed(() => {
		return displays.value
			.filter((inter: DisplayConfig) => {
				const matchesType = inter.types.includes(state.fieldData?.type || 'alias');
				const matchesLocalType = (inter.groups || ['standard']).includes(type);

				return matchesType && matchesLocalType;
			})
			.sort((a: DisplayConfig, b: DisplayConfig) => (a.name > b.name ? 1 : -1));
	});

	generationInfo = computed(() => {
		return [
			...state.newCollections.map(
				(newCollection): GenerationInfo => ({
					name: newCollection.collection!,
					type: 'collection',
				})
			),
			...state.newCollections
				.filter((newCollection) => !!newCollection.fields)
				.map((newCollection) =>
					newCollection.fields!.map((field) => ({ ...field, collection: newCollection.collection }))
				)
				.flat()
				.map(
					(newField): GenerationInfo => ({
						name: `${newField.collection}.${newField.field}`,
						type: 'field',
					})
				),
			...state.newFields.map(
				(newField): GenerationInfo => ({
					name: `${newField.collection}.${newField.field}`,
					type: 'field',
				})
			),
		];
	});

	const isExisting = field !== '+';

	if (isExisting) {
		const existingField = clone(fieldsStore.getField(collection, field));

		state.fieldData.field = existingField.field;
		state.fieldData.type = existingField.type;
		state.fieldData.schema = existingField.schema;
		state.fieldData.meta = existingField.meta;

		state.relations = relationsStore.getRelationsForField(collection, field);

		// Make sure every relation has a schema we can operate on
		for (const relation of state.relations) {
			if (!relation.schema) {
				relation.schema = {
					on_delete: 'SET NULL',
				};
			}
		}
	} else {
		state.autoFillJunctionRelation = true;

		watch(
			() => availableInterfaces.value,
			() => {
				if (availableInterfaces.value.length === 1 && state.fieldData.meta) {
					state.fieldData.meta.interface = availableInterfaces.value[0].id;
				}
			}
		);

		watch(
			() => availableDisplays.value,
			() => {
				if (availableDisplays.value.length === 1 && state.fieldData.meta) {
					state.fieldData.meta.display = availableDisplays.value[0].id;
				}
			}
		);
	}

	// Auto generate translations
	if (isExisting === false && type === 'translations' && state.fieldData.meta) {
		state.fieldData.meta.interface = 'translations';
	}

	if (type === 'file') useFile();
	else if (type === 'm2o') useM2O();
	else if (type === 'm2m' || type === 'files' || type === 'translations') useM2M();
	else if (type === 'o2m') useO2M();
	else if (type === 'presentation') usePresentation();
	else if (type === 'group') useGroup();
	else if (type === 'm2a') useM2A();
	else useStandard();

	function useFile() {
		if (!isExisting) {
			state.fieldData.type = 'uuid';

			state.relations = [
				{
					collection: collection,
					field: '',
					related_collection: 'directus_files',
					meta: {
						sort_field: null,
					},
				},
			];
		}

		watch(
			() => state.fieldData.field,
			() => {
				state.relations[0].field = state.fieldData.field;
			}
		);
	}

	function useM2O() {
		const syncNewCollectionsM2O = throttle(() => {
			const collectionName = state.relations[0].related_collection;

			if (!collectionName || collectionExists(collectionName)) {
				state.newCollections = [];
			} else {
				const pkFieldName = state.newCollections?.[0]?.fields?.[0]?.field || 'id';

				state.newCollections = [
					{
						collection: collectionName,
						fields: [
							{
								field: pkFieldName,
								type: 'integer',
								schema: {
									has_auto_increment: true,
									is_primary_key: true,
								},
								meta: {
									hidden: true,
								},
							},
						],
					},
				];
			}
		}, 50);

		if (isExisting === false) {
			state.relations = [
				{
					collection: collection,
					field: '',
					related_collection: '',
					meta: {
						sort_field: null,
					},
					schema: {
						on_delete: 'SET NULL',
					},
				},
			];
		}

		watch(
			() => state.relations[0].collection,
			() => {
				if (state.relations[0].collection === state.relations[0].related_collection) {
					state.relations[0].schema = {
						...state.relations[0].schema,
						on_delete: 'NO ACTION',
					};
				}
			}
		);

		watch(
			() => state.fieldData.field,
			() => {
				state.relations[0].field = state.fieldData.field;
			}
		);

		// Make sure to keep the current m2o field type in sync with the primary key of the
		// selected related collection
		watch(
			() => state.relations[0].related_collection,
			() => {
				if (state.relations[0].related_collection && collectionExists(state.relations[0].related_collection)) {
					const field = fieldsStore.getPrimaryKeyFieldForCollection(state.relations[0].related_collection);
					state.fieldData.type = field.type;
				} else {
					state.fieldData.type = 'integer';
				}
			}
		);

		// Sync the "auto generate related o2m"
		watch(
			() => state.relations[0].related_collection,
			() => {
				if (state.newFields.length > 0 && state.relations[0].related_collection) {
					state.newFields[0].collection = state.relations[0].related_collection;
				}
			}
		);

		watch([() => state.relations[0].related_collection], syncNewCollectionsM2O);
	}

	function useO2M() {
		delete state.fieldData.schema;
		state.fieldData.type = 'alias';

		const syncNewCollectionsO2M = throttle(([collectionName, fieldName, sortField]) => {
			state.newCollections = state.newCollections.filter((col: any) => ['related'].includes(col.$type) === false);
			state.newFields = state.newFields.filter((field) => ['manyRelated', 'sort'].includes(field.$type!) === false);

			if (collectionName && collectionExists(collectionName) === false) {
				state.newCollections.push({
					$type: 'related',
					collection: collectionName,
					fields: [
						{
							field: 'id',
							type: 'integer',
							schema: {
								has_auto_increment: true,
								is_primary_key: true,
							},
							meta: {
								hidden: true,
							},
						},
					],
				});
			}

			if (fieldName && fieldExists(collectionName, fieldName) === false) {
				state.newFields.push({
					$type: 'manyRelated',
					collection: collectionName,
					field: fieldName,
					type: collectionExists(collection)
						? fieldsStore.getPrimaryKeyFieldForCollection(collection)?.type
						: 'integer',
					schema: {},
				});
			}

			if (sortField && fieldExists(collectionName, sortField) === false) {
				state.newFields.push({
					$type: 'sort',
					collection: collectionName,
					field: sortField,
					type: 'integer',
					schema: {},
					meta: {
						hidden: true,
					},
				});
			}
		}, 50);

		if (!isExisting) {
			state.fieldData.meta = {
				...(state.fieldData.meta || {}),
				special: ['o2m'],
			};

			state.relations = [
				{
					collection: '',
					field: '',
					related_collection: collection,
					meta: {
						one_field: state.fieldData.field,
						sort_field: null,
						one_deselect_action: 'nullify',
					},
					schema: {
						on_delete: 'SET NULL',
					},
				},
			];
		}

		watch(
			() => state.relations[0].collection,
			() => {
				if (state.relations[0].collection === state.relations[0].related_collection) {
					state.relations[0].schema = {
						...state.relations[0].schema,
						on_delete: 'NO ACTION',
					};
				}
			}
		);

		watch(
			() => state.fieldData.field,
			() => {
				state.relations[0].meta = {
					...(state.relations[0].meta || {}),
					one_field: state.fieldData.field,
				};
			}
		);

		watch(
			[() => state.relations[0].collection, () => state.relations[0].field, () => state.relations[0].meta?.sort_field],
			([collectionName, fieldName, sortField]) => {
				syncNewCollectionsO2M([collectionName, fieldName, sortField]);
				syncOnDeleteTrigger(collectionName, fieldName);
			}
		);

		/**
		 * Syncs the on_delete value of the existing relationship with the new o2m one, so you don't
		 * accidentally override it
		 */
		function syncOnDeleteTrigger(collection?: string | null, field?: string | null) {
			if (!collection || !field) return;

			const existingRelation = relationsStore.getRelationForField(collection, field) || {};
			if (!existingRelation) return;

			state.relations[0].schema = {
				on_delete: existingRelation.schema?.on_delete || 'SET NULL',
			};
		}
	}

	function useM2M() {
		delete state.fieldData.schema;
		state.fieldData.type = 'alias';

		const syncNewCollectionsM2M = throttle(
			([junctionCollection, manyCurrent, manyRelated, relatedCollection, sortField]) => {
				state.newCollections = state.newCollections.filter(
					(col: any) => ['junction', 'related'].includes(col.$type) === false
				);
				state.newFields = state.newFields.filter(
					(field) => ['manyCurrent', 'manyRelated', 'sort'].includes(field.$type!) === false
				);

				if (collectionExists(junctionCollection) === false) {
					state.newCollections.push({
						$type: 'junction',
						collection: junctionCollection,
						meta: {
							hidden: true,
							icon: 'import_export',
						},
						fields: [
							{
								field: 'id',
								type: 'integer',
								schema: {
									has_auto_increment: true,
								},
								meta: {
									hidden: true,
								},
							},
						],
					});
				}

				if (fieldExists(junctionCollection, manyCurrent) === false) {
					state.newFields.push({
						$type: 'manyCurrent',
						collection: junctionCollection,
						field: manyCurrent,
						type: fieldsStore.getPrimaryKeyFieldForCollection(collection)!.type,
						schema: {},
						meta: {
							hidden: true,
						},
					});
				}

				if (fieldExists(junctionCollection, manyRelated) === false) {
					if (type === 'translations') {
						state.newFields.push({
							$type: 'manyRelated',
							collection: junctionCollection,
							field: manyRelated,
							type: collectionExists(relatedCollection)
								? fieldsStore.getPrimaryKeyFieldForCollection(relatedCollection)?.type
								: 'string',
							schema: {},
							meta: {
								hidden: true,
							},
						});
					} else {
						state.newFields.push({
							$type: 'manyRelated',
							collection: junctionCollection,
							field: manyRelated,
							type: collectionExists(relatedCollection)
								? fieldsStore.getPrimaryKeyFieldForCollection(relatedCollection)?.type
								: 'integer',
							schema: {},
							meta: {
								hidden: true,
							},
						});
					}
				}

				if (collectionExists(relatedCollection) === false) {
					if (type === 'translations') {
						state.newCollections.push({
							$type: 'related',
							collection: relatedCollection,
							meta: {
								icon: 'translate',
							},
							fields: [
								{
									field: 'code',
									type: 'string',
									schema: {
										is_primary_key: true,
									},
									meta: {
										interface: 'input',
										options: {
											iconLeft: 'vpn_key',
										},
										width: 'half',
									},
								},
								{
									field: 'name',
									type: 'string',
									schema: {},
									meta: {
										interface: 'input',
										options: {
											iconLeft: 'translate',
										},
										width: 'half',
									},
								},
							],
						});
					} else {
						state.newCollections.push({
							$type: 'related',
							collection: relatedCollection,
							fields: [
								{
									field: 'id',
									type: 'integer',
									schema: {
										has_auto_increment: true,
									},
									meta: {
										hidden: true,
									},
								},
							],
						});
					}
				}

				if (type === 'translations') {
					if (collectionExists(relatedCollection) === false) {
						state.newRows = {
							[relatedCollection]: [
								{
									code: 'en-US',
									name: 'English',
								},
								{
									code: 'de-DE',
									name: 'German',
								},
								{
									code: 'fr-FR',
									name: 'French',
								},
								{
									code: 'ru-RU',
									name: 'Russian',
								},
								{
									code: 'es-ES',
									name: 'Spanish',
								},
								{
									code: 'it-IT',
									name: 'Italian',
								},
								{
									code: 'pt-BR',
									name: 'Portuguese',
								},
							],
						};
					} else {
						state.newRows = {};
					}
				}

				if (sortField && fieldExists(junctionCollection, sortField) === false) {
					state.newFields.push({
						$type: 'sort',
						collection: junctionCollection,
						field: sortField,
						type: 'integer',
						schema: {},
						meta: {
							hidden: true,
						},
					});
				}
			},
			50
		);

		if (!isExisting) {
			state.fieldData.meta = {
				...(state.fieldData.meta || {}),
				special: [type],
			};

			state.relations = [
				{
					collection: '',
					field: '',
					related_collection: collection,
					meta: {
						one_field: state.fieldData.field,
						sort_field: null,
						one_deselect_action: 'nullify',
					},
					schema: {
						on_delete: 'SET NULL',
					},
				},
				{
					collection: '',
					field: '',
					related_collection: '',
					meta: {
						one_field: null,
						sort_field: null,
						one_deselect_action: 'nullify',
					},
					schema: {
						on_delete: 'SET NULL',
					},
				},
			];
		}

		watch(
			() => state.relations[0].collection,
			() => {
				if (state.relations[0].collection === state.relations[0].related_collection) {
					state.relations[0].schema = {
						...state.relations[0].schema,
						on_delete: 'NO ACTION',
					};
				}
			}
		);

		watch(
			() => state.relations[1].collection,
			() => {
				if (state.relations[1].collection === state.relations[1].related_collection) {
					state.relations[1].schema = {
						...state.relations[1].schema,
						on_delete: 'NO ACTION',
					};
				}
			}
		);

		watch(
			() => state.relations[0].field,
			() => {
				state.relations[1].meta = {
					...(state.relations[1].meta || {}),
					junction_field: state.relations[0].field,
				};
			}
		);

		watch(
			() => state.relations[1].field,
			() => {
				state.relations[0].meta = {
					...(state.relations[0].meta || {}),
					junction_field: state.relations[1].field,
				};
			}
		);

		watch(
			[
				() => state.relations[0].collection,
				() => state.relations[0].field,
				() => state.relations[1].field,
				() => state.relations[1].related_collection,
				() => state.relations[0].meta?.sort_field,
			],
			([junctionCollection, manyCurrent, manyRelated, relatedCollection, sortField]) => {
				syncNewCollectionsM2M([junctionCollection, manyCurrent, manyRelated, relatedCollection, sortField]);
				syncOnDeleteTrigger(junctionCollection, manyCurrent);
			}
		);

		watch(
			() => state.fieldData.field,
			() => {
				state.relations[0].meta = {
					...(state.relations[0].meta || {}),
					one_field: state.fieldData.field,
				};

				/**
				 * When the pane is opened, if the current fieldname is the actual name of a related collection, we auto-fill all
				 * the fields as if that related collection was already selected
				 */
				if (state.fieldData.field && collectionExists(state.fieldData.field) && type !== 'translations') {
					autoFillFields(state.fieldData.field);
				}
			}
		);

		if (type === 'files') {
			nextTick(() => {
				state.relations[1].related_collection = state.relations[1].related_collection || 'directus_files';
			});
		}

		if (type !== 'translations') {
			let stop: WatchStopHandle;

			watch(
				() => state.autoFillJunctionRelation,
				(startWatching) => {
					if (startWatching) {
						stop = watch(
							() => state.relations[1].related_collection,
							(newRelatedCollection) => autoFillFields(newRelatedCollection)
						);
					} else {
						stop?.();
					}
				},
				{ immediate: true }
			);
		}

		if (type === 'translations') {
			watch(
				() => state.relations[0].collection,
				(newManyCollection) => {
					state.relations[1].collection = newManyCollection;
				},
				{ immediate: true }
			);

			if (isExisting === false) {
				state.relations[0].collection = `${collection}_translations`;
				state.relations[0].field = `${collection}_${fieldsStore.getPrimaryKeyFieldForCollection(collection)?.field}`;
				state.relations[1].related_collection = 'languages';

				const relatedPKField =
					fieldsStore.getPrimaryKeyFieldForCollection(state.relations[1].related_collection)?.field || 'id';
				state.relations[1].field = `${state.relations[1].related_collection}_${relatedPKField}`;

				state.fieldData.field = 'translations';
				state.relations[0].meta = {
					...(state.relations[0].meta || {}),
					one_field: 'translations',
				};
			}
		}

		function autoFillFields(relatedCollection: string | null | undefined) {
			const currentPKField = fieldsStore.getPrimaryKeyFieldForCollection(collection)?.field || 'id';

			if (!relatedCollection) {
				state.relations[0].collection = undefined;
				state.relations[1].collection = undefined;

				state.relations[0].related_collection = collection;
				state.relations[1].related_collection = undefined;

				state.relations[0].field = undefined;
				state.relations[1].field = undefined;
			} else {
				const junctionCollection = getAutomaticJunctionCollectionName(collection, relatedCollection);
				const relatedPKField =
					fieldsStore.getPrimaryKeyFieldForCollection(relatedCollection)?.field ||
					state.newCollections?.find((collection) => collection.$type === 'related')?.fields?.[0]?.field ||
					'id';

				state.relations[0].collection = junctionCollection;
				state.relations[1].collection = junctionCollection;

				state.relations[0].related_collection = collection;
				state.relations[1].related_collection = relatedCollection;

				state.relations[0].field = `${collection}_${currentPKField}`;
				state.relations[1].field = `${relatedCollection}_${relatedPKField}`;

				if (state.relations[0].field === state.relations[1].field) {
					state.relations[1].field = `related_${state.relations[1].field}`;
				}
			}
		}

		/**
		 * Generate junction collection name for two given collections. Most of the time, it'll just
		 * combine the two with a `_`. It'll check if that collection already exists, and append an
		 * index if the junction collection already exists and is used for something else
		 */
		function getAutomaticJunctionCollectionName(collectionA: string, collectionB: string) {
			let index = 0;
			let name = getName(index);

			while (collectionExists(name)) {
				index++;
				name = getName(index);
			}

			return name;

			function getName(index: number) {
				let name = `${collectionA}_${collectionB}`;

				if (name.startsWith('directus_')) {
					name = 'junction_' + name;
				}

				if (index) return name + '_' + index;
				return name;
			}
		}

		/**
		 * Syncs the on_delete value of the existing relationship with the new m2m one, so you don't
		 * accidentally override it
		 */
		function syncOnDeleteTrigger(collection?: string | null, field?: string | null) {
			if (!collection || !field) return;

			const existingRelation = relationsStore.getRelationForField(collection, field) || {};
			if (!existingRelation) return;

			state.relations[0].schema = {
				on_delete: existingRelation.schema?.on_delete || 'SET NULL',
			};
		}
	}

	function useM2A() {
		delete state.fieldData.schema;
		state.fieldData.type = 'alias';

		const syncNewCollectionsM2A = throttle(
			([junctionCollection, manyCurrent, manyRelated, oneCollectionField, sortField]) => {
				state.newCollections = state.newCollections.filter(
					(col: any) => ['junction', 'related'].includes(col.$type) === false
				);

				state.newFields = state.newFields.filter(
					(field) => ['manyCurrent', 'manyRelated', 'collectionField', 'sort'].includes(field.$type!) === false
				);

				if (collectionExists(junctionCollection) === false) {
					state.newCollections.push({
						$type: 'junction',
						collection: junctionCollection,
						meta: {
							hidden: true,
							icon: 'import_export',
						},
						fields: [
							{
								field: 'id',
								type: 'integer',
								schema: {
									has_auto_increment: true,
								},
								meta: {
									hidden: true,
								},
							},
						],
					});
				}

				if (fieldExists(junctionCollection, manyCurrent) === false) {
					state.newFields.push({
						$type: 'manyCurrent',
						collection: junctionCollection,
						field: manyCurrent,
						type: fieldsStore.getPrimaryKeyFieldForCollection(collection)!.type,
						schema: {},
						meta: {
							hidden: true,
						},
					});
				}

				if (fieldExists(junctionCollection, manyRelated) === false) {
					state.newFields.push({
						$type: 'manyRelated',
						collection: junctionCollection,
						field: manyRelated,
						// We'll have to save the foreign key as a string, as that's the only way to safely
						// be able to store the PK of multiple typed collections
						type: 'string',
						schema: {},
						meta: {
							hidden: true,
						},
					});
				}

				if (fieldExists(junctionCollection, oneCollectionField) === false) {
					state.newFields.push({
						$type: 'collectionField',
						collection: junctionCollection,
						field: oneCollectionField,
						type: 'string', // directus_collections.collection is a string
						schema: {},
						meta: {
							hidden: true,
						},
					});
				}

				if (sortField && fieldExists(junctionCollection, sortField) === false) {
					state.newFields.push({
						$type: 'sort',
						collection: junctionCollection,
						field: sortField,
						type: 'integer',
						schema: {},
						meta: {
							hidden: true,
						},
					});
				}
			},
			50
		);

		if (!isExisting) {
			state.fieldData.meta = {
				...(state.fieldData.meta || {}),
				special: [type],
			};

			state.relations = [
				{
					collection: '',
					field: '',
					related_collection: collection,
					meta: {
						one_field: state.fieldData.field,
						sort_field: null,
						one_deselect_action: 'nullify',
					},
					schema: {
						on_delete: 'SET NULL',
					},
				},
				{
					collection: '',
					field: '',
					related_collection: null,
					meta: {
						one_field: null,
						one_allowed_collections: [],
						one_collection_field: '',
						sort_field: null,
						one_deselect_action: 'nullify',
					},
				},
			];
		}

		watch(
			() => state.relations[0].collection,
			() => {
				if (state.relations[0].collection === state.relations[0].related_collection) {
					state.relations[0].schema = {
						...state.relations[0].schema,
						on_delete: 'NO ACTION',
					};
				}
			}
		);

		watch(
			() => state.relations[0].field,
			() => {
				state.relations[1].meta = {
					...(state.relations[1].meta || {}),
					junction_field: state.relations[0].field,
				};
			}
		);

		watch(
			() => state.relations[1].field,
			() => {
				state.relations[0].meta = {
					...(state.relations[0].meta || {}),
					junction_field: state.relations[1].field,
				};
			}
		);

		watch(
			[
				() => state.relations[0].collection,
				() => state.relations[0].field,
				() => state.relations[1].field,
				() => state.relations[1].meta?.one_collection_field,
				() => state.relations[0].meta?.sort_field,
			],
			syncNewCollectionsM2A
		);

		watch(
			() => state.fieldData.field,
			() => {
				state.relations[0].meta = {
					...(state.relations[0].meta || {}),
					one_field: state.fieldData.field,
				};

				if (state.autoFillJunctionRelation) {
					state.relations[0].collection = `${state.relations[0].related_collection}_${state.fieldData.field}`;
					state.relations[1].collection = `${state.relations[0].related_collection}_${state.fieldData.field}`;
				}
			}
		);

		watch(
			() => state.autoFillJunctionRelation,
			() => {
				if (state.autoFillJunctionRelation === true) {
					const currentPrimaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(collection)?.field || 'id';
					state.relations[0].collection = `${state.relations[0].related_collection}_${state.fieldData.field}`;
					state.relations[1].collection = `${state.relations[0].related_collection}_${state.fieldData.field}`;
					state.relations[0].field = `${state.relations[0].related_collection}_${currentPrimaryKeyField}`;
					state.relations[1].meta = {
						...(state.relations[1].meta || {}),
						one_collection_field: 'collection',
					};
					state.relations[1].field = 'item';
				}
			},
			{ immediate: true }
		);
	}

	function usePresentation() {
		delete state.fieldData.schema;
		state.fieldData.type = 'alias';
		state.fieldData.meta = {
			...(state.fieldData.meta || {}),
			special: ['alias', 'no-data'],
		};
	}

	function useGroup() {
		delete state.fieldData.schema;
		state.fieldData.type = 'alias';
		state.fieldData.meta = {
			...(state.fieldData.meta || {}),
			special: ['alias', 'no-data', 'group'],
		};
	}

	function useStandard() {
		watch(
			() => state.fieldData.type,
			() => {
				state.fieldData.meta = {
					...(state.fieldData.meta || {}),
					interface: null,
					options: null,
					display: null,
					display_options: null,
					special: null,
				};

				state.fieldData.schema = {
					...(state.fieldData.schema || {}),
					default_value: undefined,
					max_length: undefined,
					is_nullable: true,
					geometry_type: undefined,
				};

				switch (state.fieldData.type) {
					case 'uuid':
						state.fieldData.meta.special = ['uuid'];
						break;
					case 'hash':
						state.fieldData.meta.special = ['hash'];
						break;
					case 'json':
						state.fieldData.meta.special = ['json'];
						break;
					case 'csv':
						state.fieldData.meta.special = ['csv'];
						break;
					case 'boolean':
						state.fieldData.meta.special = ['boolean'];
						state.fieldData.schema.default_value = false;
						state.fieldData.schema.is_nullable = false;
						break;
					case 'geometry':
						state.fieldData.meta.special = ['geometry'];
						break;
				}
			}
		);
	}

	function collectionExists(collection: string) {
		return collectionsStore.getCollection(collection) !== null;
	}

	function fieldExists(collection: string, field: string) {
		return collectionExists(collection) && !!fieldsStore.getField(collection, field);
	}
}

function clearLocalStore(): void {
	state = reactive({
		fieldData: {
			field: '',
			type: 'string',
			schema: {
				default_value: undefined,
				max_length: undefined,
				is_nullable: true,
				is_unique: false,
				numeric_precision: null,
				numeric_scale: null,
				geometry_type: undefined,
			},
			meta: {
				hidden: false,
				interface: undefined,
				options: undefined,
				display: undefined,
				display_options: undefined,
				readonly: false,
				special: undefined,
				note: undefined,
			},
		},
		relations: [],
		newCollections: [],
		newFields: [],
		updateFields: [],
		newRows: {},

		autoFillJunctionRelation: false,
	});
}
