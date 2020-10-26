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

let state: any;
let availableInterfaces: ComputedRef<InterfaceConfig[]>;
let availableDisplays: ComputedRef<DisplayConfig[]>;

export { state, availableInterfaces, availableDisplays, initLocalStore, clearLocalStore };

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
				precision: null,
				scale: null,
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
				const matchesLocalType = inter.localTypes?.includes(type);
				let matchesRelation = false;

				if (type === 'standard' || type === 'presentation') {
					matchesRelation = inter.relationship === null || inter.relationship === undefined;
				} else if (type === 'file') {
					matchesRelation = inter.relationship === 'm2o';
				} else if (type === 'files') {
					matchesRelation = inter.relationship === 'm2m';
				} else if (type === 'translations') {
					matchesRelation = inter.relationship === 'translations';
				} else {
					matchesRelation = inter.relationship === type;
				}

				return matchesType && matchesRelation && (matchesLocalType === undefined || matchesLocalType);
			})
			.sort((a, b) => (a.name > b.name ? 1 : -1));
	});

	availableDisplays = computed(() =>
		displays.value.filter((display) => {
			const matchesType = display.types.includes(state.fieldData?.type || 'alias');
			let matchesLocalType = display.localTypes?.includes(type);
			return matchesType && (matchesLocalType === undefined || matchesLocalType);
		})
	);

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

	if (type === 'file') {
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

	if (type === 'm2o') {
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

	if (type === 'o2m') {
		delete state.fieldData.schema;
		state.fieldData.type = null;

		const syncNewCollectionsO2M = throttle(() => {
			const collectionName = state.relations[0].many_collection;
			const fieldName = state.relations[0].many_field;

			if (collectionExists(collectionName)) {
				state.newCollections = [];
			} else {
				state.newCollections = [
					{
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
					},
				];

				state.relations[0].many_primary = 'id';
			}

			if (collectionExists(collectionName)) {
				if (fieldExists(collectionName, fieldName)) {
					state.newFields = [];
				} else {
					state.newFields = [
						{
							$type: 'manyRelated',
							collection: collectionName,
							field: fieldName,
							type: fieldsStore.getPrimaryKeyFieldForCollection(collection)?.type,
							schema: {},
						},
					];
				}
			} else {
				state.newFields = [
					{
						$type: 'manyRelated',
						collection: collectionName,
						field: fieldName,
						type: 'integer',
						schema: {},
					},
				];
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

		watch([() => state.relations[0].many_collection, () => state.relations[0].many_field], syncNewCollectionsO2M);
	}

	if (type === 'm2m' || type === 'files' || type === 'translations') {
		delete state.fieldData.schema;
		state.fieldData.type = null;

		const syncNewCollectionsM2M = throttle(([junctionCollection, manyCurrent, manyRelated, relatedCollection]) => {
			state.newCollections = state.newCollections.filter(
				(col: any) => ['junction', 'related'].includes(col.$type) === false
			);
			state.newFields = state.newFields.filter(
				(field: Partial<Field> & { $type: string }) =>
					['manyCurrent', 'manyRelated'].includes(field.$type) === false
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
					type: collectionExists(junctionCollection)
						? fieldsStore.getPrimaryKeyFieldForCollection(junctionCollection)?.type
						: 'integer',
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
		}, 50);

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
					const pkField = fieldsStore.getPrimaryKeyFieldForCollection(state.relations[0].many_collection)
						?.field;
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
			],
			syncNewCollectionsM2M
		);

		watch(
			() => state.fieldData.field,
			() => {
				state.relations[0].one_field = state.fieldData.field;

				if (collectionExists(state.fieldData.field) && type !== 'translations') {
					state.relations[0].many_collection = `${state.relations[0].one_collection}_${state.relations[1].one_collection}`;
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
									state.relations[0].many_collection = `${state.relations[0].one_collection}_${state.relations[1].one_collection}`;
									state.relations[1].many_collection = `${state.relations[0].one_collection}_${state.relations[1].one_collection}`;
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

			state.relations[0].many_field = `${collection}_${
				fieldsStore.getPrimaryKeyFieldForCollection(collection)?.field
			}`;

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
	}

	if (type === 'presentation') {
		delete state.fieldData.schema;
		state.fieldData.type = null;

		state.fieldData.meta.special = ['alias', 'no-data'];
	}

	if (type === 'standard') {
		watch(
			() => state.fieldData.type,
			() => {
				state.fieldData.meta.interface = null;
				state.fieldData.meta.options = null;
				state.fieldData.meta.display = null;
				state.fieldData.meta.display_options = null;
				state.fieldData.meta.special = null;
				state.fieldData.schema.default_value = undefined;

				switch (state.fieldData.type) {
					case 'uuid':
						state.fieldData.meta.special = ['uuid'];
						break;
					case 'json':
						state.fieldData.meta.special = ['json'];
						break;
					case 'csv':
						state.fieldData.meta.special = ['csv'];
						break;
					case 'boolean':
						state.fieldData.meta.special = ['boolean'];
						state.fieldData.schema.is_nullable = false;
						state.fieldData.schema.default_value = false;
						break;
					default:
						state.fieldData.schema.default_value = undefined;
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
