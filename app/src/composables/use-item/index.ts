import { useCollection } from '@directus/composables';
import { isSystemCollection } from '@directus/system-data';
import { Alterations, Field, Item, PrimaryKey, Query, Relation } from '@directus/types';
import { getEndpoint, isObject } from '@directus/utils';
import { jsonToGraphQLQuery } from 'json-to-graphql-query';
import { cloneDeep, mergeWith } from 'lodash';
import { computed, ComputedRef, isRef, MaybeRef, ref, Ref, unref, watch } from 'vue';
import { UsablePermissions, usePermissions } from '../use-permissions';
import { getGraphqlQueryFields } from './lib/get-graphql-query-fields';
import { transformM2AAliases } from './lib/transform-m2a-aliases';
import { useNestedValidation } from '@/composables/use-nested-validation';
import { VALIDATION_TYPES } from '@/constants';
import { i18n } from '@/lang';
import sdk from '@/sdk';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { APIError } from '@/types/error';
import { applyConditions } from '@/utils/apply-conditions';
import { getDefaultValuesFromFields } from '@/utils/get-default-values-from-fields';
import { getFieldsInGroup } from '@/utils/get-fields-in-group';
import { mergeItemData } from '@/utils/merge-item-data';
import { notify } from '@/utils/notify';
import { pushGroupOptionsDown } from '@/utils/push-group-options-down';
import { translate } from '@/utils/translate-object-values';
import { unexpectedError } from '@/utils/unexpected-error';
import { validateItem } from '@/utils/validate-item';

type UsableItem<T extends Item> = {
	edits: Ref<Item>;
	hasEdits: ComputedRef<boolean>;
	item: Ref<T | null>;
	permissions: UsablePermissions;
	error: Ref<any>;
	loading: ComputedRef<boolean>;
	saving: Ref<boolean>;
	refresh: () => void;
	save: () => Promise<T | undefined>;
	isNew: ComputedRef<boolean>;
	remove: () => Promise<void>;
	deleting: Ref<boolean>;
	archive: () => Promise<void>;
	isArchived: ComputedRef<boolean | null>;
	archiving: Ref<boolean>;
	saveAsCopy: () => Promise<PrimaryKey | null>;
	getItem: () => Promise<void>;
	validationErrors: Ref<any[]>;
};

export function useItem<T extends Item>(
	collection: Ref<string>,
	primaryKey: Ref<PrimaryKey | null>,
	query: MaybeRef<Query> = {},
): UsableItem<T> {
	const { info: collectionInfo, primaryKeyField } = useCollection(collection);
	const item: Ref<T | null> = ref(null);
	const error = ref<any>(null);
	const validationErrors = ref<any[]>([]);
	const loadingItem = ref(false);
	const saving = ref(false);
	const deleting = ref(false);
	const archiving = ref(false);
	const edits = ref<Item>({});
	const hasEdits = computed(() => Object.keys(edits.value).length > 0);
	const isNew = computed(() => primaryKey.value === '+');
	const isSingle = computed(() => !!collectionInfo.value?.meta?.singleton);

	const isArchived = computed(() => {
		if (!collectionInfo.value?.meta?.archive_field) return null;

		if (collectionInfo.value.meta.archive_value === 'true') {
			return item.value?.[collectionInfo.value.meta.archive_field] === true;
		}

		return item.value?.[collectionInfo.value.meta.archive_field] === collectionInfo.value.meta.archive_value;
	});

	const permissions = usePermissions(collection, primaryKey, isNew);
	const fieldsWithPermissions = permissions.itemPermissions.fields;

	const loading = computed(() => loadingItem.value || permissions.itemPermissions.loading.value);

	const itemEndpoint = computed(() => {
		if (isSingle.value) {
			return getEndpoint(collection.value);
		}

		return `${getEndpoint(collection.value)}/${encodeURIComponent(primaryKey.value as string)}`;
	});

	const defaultValues = getDefaultValuesFromFields(fieldsWithPermissions);

	watch([collection, primaryKey, ...(isRef(query) ? [query] : [])], refresh);

	refreshItem();

	const { nestedValidationErrors } = useNestedValidation();

	return {
		edits,
		hasEdits,
		item,
		permissions,
		error,
		loading,
		saving,
		refresh,
		save,
		isNew,
		remove,
		deleting,
		archive,
		isArchived,
		archiving,
		saveAsCopy,
		getItem,
		validationErrors,
	};

	async function getItem() {
		loadingItem.value = true;
		error.value = null;

		try {
			const item = await sdk.request<T>(() => ({ path: itemEndpoint.value, params: unref(query) }));
			setItemValueToResponse(item);
		} catch (err) {
			error.value = err;
		} finally {
			loadingItem.value = false;
		}
	}

	function shouldClearField(field: Field, currentValues: Record<string, any>): boolean {
		if (!field.meta?.conditions) return false;

		const fieldWithConditions = applyConditions(currentValues, field);
		return !!fieldWithConditions.meta?.hidden && !!fieldWithConditions.meta?.clear_hidden_value_on_save;
	}

	function clearHiddenFieldsByCondition(edits: Item, fields: Field[], defaultValues: any, item: any): Item {
		const currentValues = mergeItemData(defaultValues, item, edits);

		const fieldsToClearMap: Map<string, any> = new Map();

		function addFieldToClear(field: Field) {
			const defaultValue = field.schema?.default_value;
			fieldsToClearMap.set(field.field, defaultValue !== undefined ? defaultValue : null);
		}

		for (const field of fields) {
			if (shouldClearField(field, currentValues)) {
				// If this is a group field that should be cleared, clear all fields within the group
				if (field.meta?.special?.includes('group')) {
					const fieldsInGroup = getFieldsInGroup(field.field, fields);

					for (const groupField of fieldsInGroup) {
						addFieldToClear(groupField);
					}
				} else {
					// For non-group fields, add the field itself to be cleared
					addFieldToClear(field);
				}
			}
		}

		if (fieldsToClearMap.size === 0) {
			return edits;
		}

		const editsWithClearedValues = cloneDeep(edits);

		for (const [field, defaultValue] of fieldsToClearMap) {
			editsWithClearedValues[field] = defaultValue;
		}

		return editsWithClearedValues;
	}

	async function save() {
		saving.value = true;
		validationErrors.value = [];

		const fields = pushGroupOptionsDown(fieldsWithPermissions.value);

		const editsWithClearedValues = clearHiddenFieldsByCondition(edits.value, fields, defaultValues.value, item.value);

		const payloadToValidate = mergeItemData(defaultValues.value, item.value ?? {}, editsWithClearedValues);

		const errors = validateItem(payloadToValidate, fields, isNew.value);
		if (nestedValidationErrors.value?.length) errors.push(...nestedValidationErrors.value);

		if (errors.length > 0) {
			validationErrors.value = errors;
			saving.value = false;
			throw errors;
		}

		try {
			let response;

			if (isNew.value) {
				response = await sdk.request<T>(() => ({
					path: getEndpoint(collection.value),
					method: 'POST',
					body: JSON.stringify(editsWithClearedValues),
				}));

				notify({
					title: i18n.global.t('item_create_success', 1),
				});
			} else {
				response = await sdk.request<T>(() => ({
					path: itemEndpoint.value,
					method: 'PATCH',
					body: JSON.stringify(editsWithClearedValues),
				}));

				notify({
					title: i18n.global.t('item_update_success', 1),
				});
			}

			setItemValueToResponse(response);
			edits.value = {};
			return response;
		} catch (error) {
			saveErrorHandler(error);
		} finally {
			saving.value = false;
		}
	}

	async function saveAsCopy() {
		saving.value = true;
		validationErrors.value = [];

		const fields = collectionInfo.value?.meta?.item_duplication_fields ?? [];

		const { queryFields, m2aAliasMap } = getGraphqlQueryFields(fields, collection.value);
		const alias = isSystemCollection(collection.value) ? collection.value.substring(9) : collection.value;

		const query = jsonToGraphQLQuery({
			query: {
				item: {
					__aliasFor: `${alias}_by_id`,
					__args: {
						id: primaryKey.value,
					},
					...queryFields,
				},
			},
		});

		const graphqlEndpoint = isSystemCollection(collection.value) ? '/graphql/system' : '/graphql';
		let response;

		try {
			response = await sdk.request<Item>(() => ({
				path: graphqlEndpoint,
				method: 'POST',
				body: JSON.stringify({ query }),
			}));
		} catch (error) {
			saving.value = false;
			unexpectedError(error);
			throw error;
		}

		// Transform aliased M2A fields back to their original names
		const itemData = transformM2AAliases(response.item, m2aAliasMap);

		const newItem: Item = {
			...(itemData || {}),
			...cloneDeep(edits.value),
		};

		clearPrimaryKey(primaryKeyField.value, newItem);

		const fieldsStore = useFieldsStore();
		const relationsStore = useRelationsStore();
		const relations = relationsStore.getRelationsForCollection(collection.value);

		for (const relation of relations) {
			const oneField = relation.meta?.one_field;
			if (!oneField || !(oneField in newItem)) continue;

			const relatedPrimaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(relation.collection);
			if (!relatedPrimaryKeyField) continue;

			const existsJunctionRelated = relationsStore.relations.find(
				(r) => r.collection === relation.collection && r.meta?.many_field === relation.meta?.junction_field,
			);

			if (Array.isArray(newItem[oneField])) {
				const existingItems = await findExistingRelatedItems(relation, relatedPrimaryKeyField);

				if (existingItems.length > 0) {
					newItem[oneField] = newItem[oneField].map((relatedItem: Item | PrimaryKey) => {
						const existingItem = existingItems.find(
							(existingItem) =>
								// Loose equality because GraphQL always returns primary key as string
								existingItem[relatedPrimaryKeyField.field] ==
								(isObject(relatedItem) ? relatedItem[relatedPrimaryKeyField.field] : relatedItem),
						);

						if (existingItem) {
							clearPrimaryKey(primaryKeyField.value, existingItem);
							clearJunctionRelatedKey(relation, existsJunctionRelated, existingItem);
							relatedItem = existingItem;
						}

						return relatedItem;
					});
				}
			} else if (isObject(newItem[oneField])) {
				const newRelatedItem = newItem[oneField] as Alterations;

				const existingItems = (await findExistingRelatedItems(relation, relatedPrimaryKeyField)).filter(
					(item) => !newRelatedItem.delete.includes(item[relatedPrimaryKeyField.field]),
				);

				for (const item of newRelatedItem.update) {
					let data;

					const existingItemIndex = existingItems.findIndex(
						(existingItem) => existingItem[relatedPrimaryKeyField.field] === item[relatedPrimaryKeyField.field],
					);

					if (existingItemIndex > -1) {
						data = mergeWith(existingItems[existingItemIndex], item, (objValue) => {
							if (Array.isArray(objValue)) return objValue;
							return;
						});

						existingItems.splice(existingItemIndex, 1);
					} else {
						data = item;
					}

					clearPrimaryKey(relatedPrimaryKeyField, data);
					clearJunctionRelatedKey(relation, existsJunctionRelated, data);

					newRelatedItem.create.push(data);
				}

				for (const item of existingItems) {
					clearPrimaryKey(relatedPrimaryKeyField, item);

					newRelatedItem.create.push(item);
				}

				newRelatedItem.update.length = 0;
			}
		}

		const errors = validateItem(newItem, fieldsWithPermissions.value, isNew.value);
		if (nestedValidationErrors.value?.length) errors.push(...nestedValidationErrors.value);

		if (errors.length > 0) {
			validationErrors.value = errors;
			saving.value = false;
			throw errors;
		}

		try {
			const response = await sdk.request<Item>(() => ({
				path: getEndpoint(collection.value),
				method: 'POST',
				body: JSON.stringify(newItem),
			}));

			notify({
				title: i18n.global.t('item_create_success', 1),
			});

			// Reset edits to the current item
			edits.value = {};

			return primaryKeyField.value ? response[primaryKeyField.value.field] : null;
		} catch (error) {
			saveErrorHandler(error);
		} finally {
			saving.value = false;
		}

		async function findExistingRelatedItems(relation: Relation, relatedPrimaryKeyField: Field): Promise<Item[]> {
			const existingRelatedItem = itemData[relation.meta!.one_field!];

			if (!existingRelatedItem) return [];

			const existingIds = existingRelatedItem.filter(
				(item: unknown) => isObject(item) && relatedPrimaryKeyField.field in item,
			);

			if (existingIds.length === 0) return [];

			const fieldsToFetch = new Set(
				fields.reduce((accumulator, currentValue) => {
					const [onePart, ...remainingParts] = currentValue.split('.');

					if (onePart === relation.meta!.one_field! && remainingParts.length > 0)
						accumulator.push(remainingParts.join('.'));

					return accumulator;
				}, [] as string[]),
			);

			if (fieldsToFetch.size > 0) fieldsToFetch.add(relatedPrimaryKeyField.field);

			const response = await sdk.request<Item[]>(() => ({
				path: getEndpoint(relation.collection),
				params: {
					fields: Array.from(fieldsToFetch),
					[`filter[${relation.field}][_eq]`]: primaryKey.value,
				},
			}));

			return response;
		}

		function clearPrimaryKey(primaryKeyField: Field | null, item: Item) {
			if (primaryKeyField?.schema?.has_auto_increment || primaryKeyField?.meta?.special?.includes('uuid')) {
				delete item[primaryKeyField.field];
			}
		}

		function clearJunctionRelatedKey(relation: Relation, existsJunctionRelated: Relation | undefined, item: Item) {
			if (!relation.meta?.junction_field || !isObject(item[relation.meta.junction_field]) || !existsJunctionRelated)
				return;

			let junctionRelatedPrimaryKeyField = null;

			if (existsJunctionRelated.related_collection)
				junctionRelatedPrimaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(
					existsJunctionRelated.related_collection,
				);
			else if (
				existsJunctionRelated.meta?.one_collection_field &&
				item[existsJunctionRelated.meta.one_collection_field]
			)
				junctionRelatedPrimaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(
					item[existsJunctionRelated.meta.one_collection_field],
				);

			const relatedItem = item[relation.meta.junction_field];

			if (isObject(relatedItem)) clearPrimaryKey(junctionRelatedPrimaryKeyField, relatedItem);
		}
	}

	function saveErrorHandler(error: any) {
		if (error?.errors) {
			validationErrors.value = error.errors
				.filter((err: APIError) => VALIDATION_TYPES.includes(err?.extensions?.code))
				.map((err: APIError) => {
					return err.extensions;
				});

			const otherErrors = error.errors.filter((err: APIError) => !VALIDATION_TYPES.includes(err?.extensions?.code));

			if (otherErrors.length > 0) {
				otherErrors.forEach(unexpectedError);
			}
		} else {
			unexpectedError(error);
		}

		throw error;
	}

	async function archive() {
		if (!collectionInfo.value?.meta?.archive_field) return;

		archiving.value = true;

		const field = collectionInfo.value.meta.archive_field;

		let archiveValue: any = collectionInfo.value.meta.archive_value;
		if (archiveValue === 'true') archiveValue = true;
		if (archiveValue === 'false') archiveValue = false;

		let unarchiveValue: any = collectionInfo.value.meta.unarchive_value;
		if (unarchiveValue === 'true') unarchiveValue = true;
		if (unarchiveValue === 'false') unarchiveValue = false;

		try {
			let value: any = item.value && item.value[field] === archiveValue ? unarchiveValue : archiveValue;

			if (value === 'true') value = true;
			if (value === 'false') value = false;

			await sdk.request(() => ({
				path: itemEndpoint.value,
				method: 'PATCH',
				body: JSON.stringify({
					[field]: value,
				}),
			}));

			item.value = {
				...(item.value as T),
				[field]: value,
			};

			notify({
				title:
					value === archiveValue ? i18n.global.t('item_delete_success', 1) : i18n.global.t('item_update_success', 1),
			});
		} catch (error) {
			unexpectedError(error);
			throw error;
		} finally {
			archiving.value = false;
		}
	}

	async function remove() {
		deleting.value = true;

		try {
			await sdk.request(() => ({ path: itemEndpoint.value, method: 'DELETE' }));

			item.value = null;

			notify({
				title: i18n.global.t('item_delete_success', 1),
			});
		} catch (error) {
			unexpectedError(error);
			throw error;
		} finally {
			deleting.value = false;
		}
	}

	function refresh() {
		error.value = null;
		validationErrors.value = [];
		loadingItem.value = false;
		saving.value = false;
		deleting.value = false;
		archiving.value = false;

		item.value = null;

		refreshItem();
		permissions.itemPermissions.refresh();
	}

	function refreshItem() {
		if (isNew.value) {
			item.value = null;
		} else {
			getItem();
		}
	}

	function setItemValueToResponse(response: T) {
		if (
			(isSystemCollection(collection.value) && collection.value !== 'directus_collections') ||
			(collection.value === 'directus_collections' && isSystemCollection(response.collection ?? ''))
		) {
			response = translate(response);
		}

		item.value = response;
	}
}
