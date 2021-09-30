import api from '@/api';
import { useCollection } from '@directus/shared/composables';
import { VALIDATION_TYPES } from '@/constants';
import { i18n } from '@/lang';
import { APIError } from '@/types';
import { notify } from '@/utils/notify';
import { unexpectedError } from '@/utils/unexpected-error';
import { AxiosResponse } from 'axios';
import { computed, ComputedRef, Ref, ref, watch } from 'vue';
import { validatePayload } from '@directus/shared/utils';
import { Filter, Item, Field } from '@directus/shared/types';
import { isNil, flatten, merge } from 'lodash';
import { FailedValidationException } from '@directus/shared/exceptions';
import { getEndpoint } from '@/utils/get-endpoint';
import { parseFilter } from '@/utils/parse-filter';

type UsableItem = {
	edits: Ref<Record<string, any>>;
	item: Ref<Record<string, any> | null>;
	error: Ref<any>;
	loading: Ref<boolean>;
	saving: Ref<boolean>;
	refresh: () => void;
	save: () => Promise<any>;
	isNew: ComputedRef<boolean>;
	remove: () => Promise<void>;
	deleting: Ref<boolean>;
	archive: () => Promise<void>;
	isArchived: ComputedRef<boolean | null>;
	archiving: Ref<boolean>;
	saveAsCopy: () => Promise<any>;
	isBatch: ComputedRef<boolean>;
	getItem: () => Promise<void>;
	validationErrors: Ref<any[]>;
};

export function useItem(collection: Ref<string>, primaryKey: Ref<string | number | null>): UsableItem {
	const { info: collectionInfo, primaryKeyField, fields } = useCollection(collection);
	const item = ref<Record<string, any> | null>(null);
	const error = ref<any>(null);
	const validationErrors = ref<any[]>([]);
	const loading = ref(false);
	const saving = ref(false);
	const deleting = ref(false);
	const archiving = ref(false);
	const edits = ref<Record<string, any>>({});
	const isNew = computed(() => primaryKey.value === '+');
	const isBatch = computed(() => typeof primaryKey.value === 'string' && primaryKey.value.includes(','));
	const isSingle = computed(() => !!collectionInfo.value?.meta?.singleton);

	const isArchived = computed(() => {
		if (!collectionInfo.value?.meta?.archive_field) return null;

		if (collectionInfo.value.meta.archive_value === 'true') {
			return item.value?.[collectionInfo.value.meta.archive_field] === true;
		}

		return item.value?.[collectionInfo.value.meta.archive_field] === collectionInfo.value.meta.archive_value;
	});

	const itemEndpoint = computed(() => {
		if (isSingle.value) {
			return getEndpoint(collection.value);
		}

		return `${getEndpoint(collection.value)}/${encodeURIComponent(primaryKey.value as string)}`;
	});

	watch([collection, primaryKey], refresh, { immediate: true });

	return {
		edits,
		item,
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
		isBatch,
		getItem,
		validationErrors,
	};

	async function getItem() {
		loading.value = true;
		error.value = null;

		try {
			const response = await api.get(itemEndpoint.value);
			setItemValueToResponse(response);
		} catch (err: any) {
			error.value = err;
		} finally {
			loading.value = false;
		}
	}

	async function save() {
		saving.value = true;
		validationErrors.value = [];

		const errors = validate(edits.value);

		if (errors.length > 0) {
			validationErrors.value = errors;
			saving.value = false;
			throw errors;
		}

		try {
			let response;

			if (isNew.value === true) {
				response = await api.post(getEndpoint(collection.value), edits.value);

				notify({
					title: i18n.global.t('item_create_success', isBatch.value ? 2 : 1),
					type: 'success',
				});
			} else {
				response = await api.patch(itemEndpoint.value, edits.value);

				notify({
					title: i18n.global.t('item_update_success', isBatch.value ? 2 : 1),
					type: 'success',
				});
			}

			setItemValueToResponse(response);
			edits.value = {};
			return response.data.data;
		} catch (err: any) {
			if (err?.response?.data?.errors) {
				validationErrors.value = err.response.data.errors
					.filter((err: APIError) => VALIDATION_TYPES.includes(err?.extensions?.code))
					.map((err: APIError) => {
						return err.extensions;
					});

				const otherErrors = err.response.data.errors.filter(
					(err: APIError) => VALIDATION_TYPES.includes(err?.extensions?.code) === false
				);

				if (otherErrors.length > 0) {
					otherErrors.forEach(unexpectedError);
				}
			} else {
				unexpectedError(err);
			}

			throw err;
		} finally {
			saving.value = false;
		}
	}

	async function saveAsCopy() {
		saving.value = true;
		validationErrors.value = [];

		const fields = collectionInfo.value?.meta?.item_duplication_fields || ['*'];

		const itemData = await api.get(itemEndpoint.value, { params: { fields } });

		const newItem: { [field: string]: any } = {
			...(itemData.data.data || {}),
			...edits.value,
		};

		// Make sure to delete the primary key
		if (primaryKeyField.value && primaryKeyField.value.field in newItem) {
			delete newItem[primaryKeyField.value.field];
		}

		const errors = validate(newItem);

		if (errors.length > 0) {
			validationErrors.value = errors;
			saving.value = false;
			throw errors;
		}

		try {
			const response = await api.post(getEndpoint(collection.value), newItem);

			notify({
				title: i18n.global.t('item_create_success', 1),
				type: 'success',
			});

			// Reset edits to the current item
			edits.value = {};

			return primaryKeyField.value ? response.data.data[primaryKeyField.value.field] : null;
		} catch (err: any) {
			if (err?.response?.data?.errors) {
				validationErrors.value = err.response.data.errors
					.filter((err: APIError) => err?.extensions?.code === 'FAILED_VALIDATION')
					.map((err: APIError) => {
						return err.extensions;
					});
			} else {
				unexpectedError(err);
				throw err;
			}
		} finally {
			saving.value = false;
		}
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

			item.value = {
				...item.value,
				[field]: value,
			};

			await api.patch(itemEndpoint.value, {
				[field]: value,
			});

			notify({
				title: i18n.global.t('item_delete_success', isBatch.value ? 2 : 1),
				type: 'success',
			});
		} catch (err: any) {
			unexpectedError(err);
			throw err;
		} finally {
			archiving.value = false;
		}
	}

	async function remove() {
		deleting.value = true;

		try {
			await api.delete(itemEndpoint.value);

			item.value = null;

			notify({
				title: i18n.global.t('item_delete_success', isBatch.value ? 2 : 1),
				type: 'success',
			});
		} catch (err: any) {
			unexpectedError(err);
			throw err;
		} finally {
			deleting.value = false;
		}
	}

	function refresh() {
		error.value = null;
		loading.value = false;
		saving.value = false;
		deleting.value = false;

		if (isNew.value === true) {
			item.value = null;
		} else {
			getItem();
		}
	}

	function setItemValueToResponse(response: AxiosResponse) {
		if (isBatch.value === false) {
			item.value = response.data.data;
		} else {
			const valuesThatAreEqual = { ...response.data.data[0] };

			response.data.data.forEach((existingItem: any) => {
				for (const [key, value] of Object.entries(existingItem)) {
					if (valuesThatAreEqual[key] !== value) {
						delete valuesThatAreEqual[key];
					}
				}
			});

			item.value = valuesThatAreEqual;
		}
	}

	function validate(item: Item) {
		const validationRules = {
			_and: [] as Filter['_and'],
		} as Filter;

		const applyConditions = (field: Field) => {
			if (field.meta && Array.isArray(field.meta?.conditions)) {
				const conditions = [...field.meta.conditions].reverse();

				const matchingCondition = conditions.find((condition) => {
					if (!condition.rule || Object.keys(condition.rule).length !== 1) return;
					const rule = parseFilter(condition.rule);
					const errors = validatePayload(rule, item, { requireAll: true });
					return errors.length === 0;
				});

				if (matchingCondition) {
					return {
						...field,
						meta: merge({}, field.meta || {}, {
							readonly: matchingCondition.readonly,
							options: matchingCondition.options,
							hidden: matchingCondition.hidden,
							required: matchingCondition.required,
						}),
					};
				}

				return field;
			} else {
				return field;
			}
		};

		const fieldsWithConditions = fields.value.map((field) => applyConditions(field));

		const requiredFields = fieldsWithConditions.filter((field) => field.meta?.required === true);

		for (const field of requiredFields) {
			if (isNew.value === true && isNil(field.schema?.default_value)) {
				validationRules._and!.push({
					[field.field]: {
						_submitted: true,
					},
				});
			}

			validationRules._and!.push({
				[field.field]: {
					_nnull: true,
				},
			});
		}

		return flatten(
			validatePayload(validationRules, item).map((error) =>
				error.details.map((details) => new FailedValidationException(details).extensions)
			)
		);
	}
}
