/**
 * This is a "local store" meant to make the field data shareable between the different panes
 * and components within the field setup modal flow.
 *
 * It's reset every time the modal opens and shouldn't be used outside of the field-detail flow.
 */

import { useFieldsStore, useRelationsStore, useCollectionsStore } from '@/stores/';
import { reactive, watch, computed, ComputedRef, WatchStopHandle } from '@vue/composition-api';
import { clone, throttle } from 'lodash';
import { getInterfaces } from '@/interfaces';
import { getDisplays } from '@/displays';
import { InterfaceConfig } from '@/interfaces/types';
import { DisplayConfig } from '@/displays/types';
import { Field, localTypes } from '@/types';
import Vue from 'vue';

const fieldsStore = useFieldsStore();
const relationsStore = useRelationsStore();
const collectionsStore = useCollectionsStore();

type GenerationInfo = {
	name: string;
	type: 'collection' | 'field';
};

let state: any;
let availableInterfaces: ComputedRef<InterfaceConfig[]>;
let availableDisplays: ComputedRef<DisplayConfig[]>;
let generationInfo: ComputedRef<GenerationInfo[]>;

export { state, availableInterfaces, availableDisplays, generationInfo, initLocalStore, clearLocalStore };

function initLocalStore(collection: string, field: string, type: typeof localTypes[number]) {
	const interfaces = getInterfaces();
	const displays = getDisplays();

	state = reactive<any>({
		fieldData: {
			field: '',
			type: 'string',
			schema: {
				default_value: undefined,
				max_length: undefined,
				is_nullable: true,
				numeric_precision: null,
				numeric_scale: null,
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

		autoFillJunctionRelation: true,
	});

	availableInterfaces = computed<InterfaceConfig[]>(() => {
		return interfaces.value
			.filter((inter) => {
				// Filter out all system interfaces
				if (inter.system === true) return false;

				const matchesType = inter.types.includes(state.fieldData?.type || 'alias');
				const matchesLocalType = (inter.groups || ['standard']).includes(type);

				return matchesType && matchesLocalType;
			})
			.sort((a, b) => (a.name > b.name ? 1 : -1));
	});

	availableDisplays = computed(() => {
		return displays.value
			.filter((inter) => {
				const matchesType = inter.types.includes(state.fieldData?.type || 'alias');
				const matchesLocalType = (inter.groups || ['standard']).includes(type) || true;

				return matchesType && matchesLocalType;
			})
			.sort((a, b) => (a.name > b.name ? 1 : -1));
	});

	generationInfo = computed(() => {
		return [
			...state.newCollections.map((newCollection: any) => ({
				name: newCollection.collection,
				type: 'collection',
			})),
			...state.newCollections
				.map((newCollection: any) =>
					newCollection.fields.map((field: any) => ({ ...field, collection: newCollection.collection }))
				)
				.flat()
				.map((newField: any) => ({
					name: `${newField.collection}.${newField.field}`,
					type: 'field',
				})),
			...state.newFields.map((newField: any) => ({
				name: `${newField.collection}.${newField.field}`,
				type: 'field',
			})),
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
	} else {
		watch(
			() => availableInterfaces.value,
			() => {
				if (availableInterfaces.value.length === 1) {
					state.fieldData.meta.interface = availableInterfaces.value[0].id;
				}
			}
		);

		watch(
			() => availableDisplays.value,
			() => {
				if (availableDisplays.value.length === 1) {
					state.fieldData.meta.display = availableDisplays.value[0].id;
				}
			}
		);
	}

	// Auto generate translations
	if (isExisting === false && type === 'translations') {
		state.fieldData.meta.interface = 'translations';
	}

	if (type === 'file') useFile();
	else if (type === 'm2o') useM2O();
	else if (type === 'm2m' || type === 'files' || type === 'translations') useM2M();
	else if (type === 'o2m') useO2M();
	else if (type === 'presentation') usePresentation();
	else if (type === 'm2a') useM2A();
	else useStandard();

	function useFile() {
		if (!isExisting) {
			state.fieldData.type = 'uuid';

			state.relations = [
				{
					many_collection: collection,
					many_field: '',
					many_primary: fieldsStore.getPrimaryKeyFieldForCollection(collection)?.field,
					one_collection: 'directus_files',
					one_primary: fieldsStore.getPrimaryKeyFieldForCollection('directus_files')?.field,
				},
			];
		}

		watch(
			() => state.fieldData.field,
			() => {
				state.relations[0].many_field = state.fieldData.field;
			}
		);
	}

	function useM2O() {
		const syncNewCollectionsM2O = throttle(() => {
			const collectionName = state.relations[0].one_collection;

			if (collectionExists(collectionName)) {
				state.newCollections = [];
			} else {
				state.newCollections = [
					{
						collection: collectionName,
						fields: [
							{
								field: state.relations[0].one_primary,
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
					many_collection: collection,
					many_field: '',
					many_primary: fieldsStore.getPrimaryKeyFieldForCollection(collection)?.field,
					one_collection: '',
					one_primary: '',
				},
			];
		}

		watch(
			() => state.fieldData.field,
			() => {
				state.relations[0].many_field = state.fieldData.field;
			}
		);

		// Make sure to keep the current m2o field type in sync with the primary key of the
		// selected related collection
		watch(
			() => state.relations[0].one_collection,
			() => {
				if (collectionExists(state.relations[0].one_collection)) {
					const field = fieldsStore.getPrimaryKeyFieldForCollection(state.relations[0].one_collection);
					state.fieldData.type = field.type;
					state.relations[0].one_primary = field.field;
				} else {
					state.fieldData.type = 'integer';
				}
			}
		);

		// Sync the "auto generate related o2m"
		watch(
			() => state.relations[0].one_collection,
			() => {
				if (state.newFields.length > 0) {
					state.newFields[0].collection = state.relations[0].one_collection;
				}
			}
		);

		watch([() => state.relations[0].one_collection, () => state.relations[0].one_primary], syncNewCollectionsM2O);
	}

	function useO2M() {
		delete state.fieldData.schema;
		state.fieldData.type = null;

		const syncNewCollectionsO2M = throttle(([collectionName, fieldName, sortField]) => {
			state.newCollections = state.newCollections.filter((col: any) => ['related'].includes(col.$type) === false);

			state.newFields = state.newFields.filter(
				(field: Partial<Field> & { $type: string }) => ['manyRelated', 'sort'].includes(field.$type) === false
			);

			if (collectionExists(collectionName) === false) {
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

				state.relations[0].many_primary = 'id';
			}

			if (fieldExists(collectionName, fieldName) === false) {
				state.newFields.push({
					$type: 'manyRelated',
					collection: collectionName,
					field: fieldName,
					type: collectionExists(collectionName)
						? fieldsStore.getPrimaryKeyFieldForCollection(collectionName)?.type
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
			state.fieldData.meta.special = ['o2m'];

			state.relations = [
				{
					many_collection: '',
					many_field: '',
					many_primary: '',

					one_collection: collection,
					one_field: state.fieldData.field,
					one_primary: fieldsStore.getPrimaryKeyFieldForCollection(collection)?.field,
				},
			];
		}

		watch(
			() => state.fieldData.field,
			() => {
				state.relations[0].one_field = state.fieldData.field;
			}
		);

		watch(
			() => state.relations[0].many_collection,
			() => {
				if (collectionExists(state.relations[0].many_collection)) {
					state.relations[0].many_primary = fieldsStore.getPrimaryKeyFieldForCollection(
						state.relations[0].many_collection
					).field;
				}
			}
		);

		watch(
			[
				() => state.relations[0].many_collection,
				() => state.relations[0].many_field,
				() => state.relations[0].sort_field,
			],
			syncNewCollectionsO2M
		);
	}

	function useM2M() {
		delete state.fieldData.schema;
		state.fieldData.type = null;

		const syncNewCollectionsM2M = throttle(
			([junctionCollection, manyCurrent, manyRelated, relatedCollection, sortField]) => {
				state.newCollections = state.newCollections.filter(
					(col: any) => ['junction', 'related'].includes(col.$type) === false
				);
				state.newFields = state.newFields.filter(
					(field: Partial<Field> & { $type: string }) =>
						['manyCurrent', 'manyRelated', 'sort'].includes(field.$type) === false
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

					state.relations[0].many_primary = 'id';
					state.relations[1].many_primary = 'id';
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
									field: state.relations[1].one_primary,
									type: 'string',
									schema: {
										is_primary_key: true,
									},
									meta: {
										interface: 'text-input',
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
										interface: 'text-input',
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
									field: state.relations[1].one_primary,
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
			state.fieldData.meta.special = [type];

			state.relations = [
				{
					many_collection: '',
					many_field: '',
					many_primary: '',
					one_collection: collection,
					one_field: state.fieldData.field,
					one_primary: fieldsStore.getPrimaryKeyFieldForCollection(collection)?.field,
				},
				{
					many_collection: '',
					many_field: '',
					many_primary: '',
					one_collection: '',
					one_field: null,
					one_primary: '',
				},
			];
		}

		watch(
			() => state.relations[0].many_collection,
			() => {
				if (collectionExists(state.relations[0].many_collection)) {
					const pkField = fieldsStore.getPrimaryKeyFieldForCollection(state.relations[0].many_collection)?.field;
					state.relations[0].many_primary = pkField;
					state.relations[1].many_primary = pkField;
				}
			}
		);

		watch(
			() => state.relations[0].many_field,
			() => {
				state.relations[1].junction_field = state.relations[0].many_field;
			}
		);

		watch(
			() => state.relations[1].many_field,
			() => {
				state.relations[0].junction_field = state.relations[1].many_field;
			}
		);

		watch(
			() => state.relations[1].one_collection,
			() => {
				if (collectionExists(state.relations[1].one_collection)) {
					state.relations[1].one_primary = fieldsStore.getPrimaryKeyFieldForCollection(
						state.relations[1].one_collection
					)?.field;
				}
			}
		);

		watch(
			[
				() => state.relations[0].many_collection,
				() => state.relations[0].many_field,
				() => state.relations[1].many_field,
				() => state.relations[1].one_collection,
				() => state.relations[0].sort_field,
			],
			syncNewCollectionsM2M
		);

		watch(
			() => state.fieldData.field,
			() => {
				state.relations[0].one_field = state.fieldData.field;

				if (collectionExists(state.fieldData.field) && type !== 'translations') {
					state.relations[0].many_collection = getAutomaticJunctionCollectionName(
						state.relations[0].one_collection,
						state.relations[1].one_collection
					);
					state.relations[0].many_field = `${state.relations[0].one_collection}_${state.relations[0].one_primary}`;
					state.relations[1].one_collection = state.fieldData.field;

					state.relations[1].one_primary = fieldsStore.getPrimaryKeyFieldForCollection(collection)?.field;
					state.relations[1].many_collection = `${state.relations[0].one_collection}_${state.relations[1].one_collection}`;
					state.relations[1].many_field = `${state.relations[1].one_collection}_${state.relations[1].one_primary}`;

					if (state.relations[0].many_field === state.relations[1].many_field) {
						state.relations[1].many_field = `${state.relations[1].one_collection}_related_${state.relations[1].one_primary}`;
					}
				}
			}
		);

		if (type === 'files') {
			Vue.nextTick(() => {
				state.relations[1].one_collection = 'directus_files';
				state.relations[1].one_primary = 'id';
			});
		}

		if (type !== 'translations') {
			let stop: WatchStopHandle;

			watch(
				() => state.autoFillJunctionRelation,
				(startWatching) => {
					if (startWatching) {
						stop = watch(
							[() => state.relations[1].one_collection, () => state.relations[1].one_primary],
							([newRelatedCollection, newRelatedPrimary]: string[]) => {
								if (newRelatedCollection) {
									state.relations[0].many_collection = getAutomaticJunctionCollectionName(
										state.relations[0].one_collection,
										state.relations[1].one_collection
									);
									state.relations[1].many_collection = getAutomaticJunctionCollectionName(
										state.relations[0].one_collection,
										state.relations[1].one_collection
									);
									state.relations[0].many_field = `${state.relations[0].one_collection}_${state.relations[0].one_primary}`;
								}

								if (newRelatedPrimary) {
									state.relations[1].many_field = `${state.relations[1].one_collection}_${state.relations[1].one_primary}`;
								}

								if (state.relations[0].many_field === state.relations[1].many_field) {
									state.relations[1].many_field = `${state.relations[1].one_collection}_related_${state.relations[1].one_primary}`;
								}
							}
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
				() => state.relations[0].many_collection,
				(newManyCollection: string) => {
					state.relations[1].many_collection = newManyCollection;
				},
				{ immediate: true }
			);

			state.relations[0].many_collection = `${collection}_translations`;

			state.relations[0].many_field = `${collection}_${fieldsStore.getPrimaryKeyFieldForCollection(collection)?.field}`;

			state.relations[1].one_collection = 'languages';

			if (collectionExists('languages')) {
				state.relations[1].one_primary = fieldsStore.getPrimaryKeyFieldForCollection('languages')?.field;
			} else {
				state.relations[1].one_primary = 'code';
			}

			state.relations[1].many_field = `${state.relations[1].one_collection}_${state.relations[1].one_primary}`;

			state.fieldData.field = 'translations';
			state.relations[0].one_field = 'translations';
		}

		function getAutomaticJunctionCollectionName(left: string, right: string) {
			let index = 2;
			let name = getName(index);

			while (collectionExists(name)) {
				index++;
				name = getName(index);
			}

			return name;

			function getName(index: number) {
				const name = `${state.relations[0].one_collection}_${state.relations[1].one_collection}`;
				if (index) return name + '_' + index;
				return name;
			}
		}
	}

	function useM2A() {
		delete state.fieldData.schema;
		state.fieldData.type = null;

		const syncNewCollectionsM2A = throttle(
			([junctionCollection, manyCurrent, manyRelated, oneCollectionField, sortField]) => {
				state.newCollections = state.newCollections.filter(
					(col: any) => ['junction', 'related'].includes(col.$type) === false
				);

				state.newFields = state.newFields.filter(
					(field: Partial<Field> & { $type: string }) =>
						['manyCurrent', 'manyRelated', 'collectionField', 'sort'].includes(field.$type) === false
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

					state.relations[0].many_primary = 'id';
					state.relations[1].many_primary = 'id';
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
			state.fieldData.meta.special = [type];

			state.relations = [
				{
					many_collection: '',
					many_field: '',
					many_primary: '',
					one_collection: collection,
					one_field: state.fieldData.field,
					one_primary: fieldsStore.getPrimaryKeyFieldForCollection(collection)?.field,
				},
				{
					many_collection: '',
					many_field: '',
					many_primary: '',
					one_collection: null,
					one_field: null,
					one_primary: null,
					one_allowed_collections: [],
					one_collection_field: '',
				},
			];
		}

		watch(
			() => state.relations[0].many_collection,
			() => {
				if (collectionExists(state.relations[0].many_collection)) {
					const pkField = fieldsStore.getPrimaryKeyFieldForCollection(state.relations[0].many_collection)?.field;
					state.relations[0].many_primary = pkField;
					state.relations[1].many_primary = pkField;
				}
			}
		);

		watch(
			() => state.relations[0].many_field,
			() => {
				state.relations[1].junction_field = state.relations[0].many_field;
			}
		);

		watch(
			() => state.relations[1].many_field,
			() => {
				state.relations[0].junction_field = state.relations[1].many_field;
			}
		);

		watch(
			[
				() => state.relations[0].many_collection,
				() => state.relations[0].many_field,
				() => state.relations[1].many_field,
				() => state.relations[1].one_collection_field,
				() => state.relations[0].sort_field,
			],
			syncNewCollectionsM2A
		);

		watch(
			() => state.fieldData.field,
			() => {
				state.relations[0].one_field = state.fieldData.field;

				if (state.autoFillJunctionRelation) {
					state.relations[0].many_collection = `${state.relations[0].one_collection}_${state.fieldData.field}`;
					state.relations[1].many_collection = `${state.relations[0].one_collection}_${state.fieldData.field}`;
				}
			}
		);

		watch(
			() => state.autoFillJunctionRelation,
			() => {
				if (state.autoFillJunctionRelation === true) {
					state.relations[0].many_collection = `${state.relations[0].one_collection}_${state.fieldData.field}`;
					state.relations[1].many_collection = `${state.relations[0].one_collection}_${state.fieldData.field}`;
					state.relations[0].many_field = `${state.relations[0].one_collection}_${state.relations[0].one_primary}`;
					state.relations[1].one_collection_field = 'collection';
					state.relations[1].many_field = 'item';
				}
			},
			{ immediate: true }
		);
	}

	function usePresentation() {
		delete state.fieldData.schema;
		state.fieldData.type = null;

		state.fieldData.meta.special = ['alias', 'no-data'];
	}

	function useStandard() {
		watch(
			() => state.fieldData.type,
			() => {
				state.fieldData.meta.interface = null;
				state.fieldData.meta.options = null;
				state.fieldData.meta.display = null;
				state.fieldData.meta.display_options = null;
				state.fieldData.meta.special = null;
				state.fieldData.schema.default_value = undefined;
				state.fieldData.schema.max_length = undefined;
				state.fieldData.schema.is_nullable = true;

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

function clearLocalStore() {
	state = null;
}
