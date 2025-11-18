import api from '@/api';
import { useNestedValidation } from '@/composables/use-nested-validation';
import { VALIDATION_TYPES } from '@/constants';
import { APIError } from '@/types/error';
import { getDefaultValuesFromFields } from '@/utils/get-default-values-from-fields';
import { mergeItemData } from '@/utils/merge-item-data';
import { pushGroupOptionsDown } from '@/utils/push-group-options-down';
import { unexpectedError } from '@/utils/unexpected-error';
import { validateItem } from '@/utils/validate-item';
import { ContentVersion, Filter, Item, Query } from '@directus/types';
import { useRouteQuery } from '@vueuse/router';
import { Ref, computed, ref, unref, watch } from 'vue';
import { useCollectionPermissions, usePermissions } from './use-permissions';

export function useVersions(collection: Ref<string>, isSingleton: Ref<boolean>, primaryKey: Ref<string | null>) {
	const currentVersion = ref<ContentVersion | null>(null);
	const versions = ref<ContentVersion[] | null>(null);
	const loading = ref(false);
	const saveVersionLoading = ref(false);
	const validationErrors = ref<any[]>([]);

	const { readAllowed: readVersionsAllowed } = useCollectionPermissions('directus_versions');

	const queryVersion = useRouteQuery<string | null>('version', null, {
		transform: (value) => (Array.isArray(value) ? value[0] : value),
		mode: 'push',
	});

	const permissions = usePermissions(collection, primaryKey, false);
	const fieldsWithPermissions = permissions.itemPermissions.fields;
	const { nestedValidationErrors } = useNestedValidation();
	const defaultValues = getDefaultValuesFromFields(fieldsWithPermissions);

	watch(
		[queryVersion, versions],
		([newQueryVersion, newVersions]) => {
			if (!newVersions) return;

			let version;

			if (queryVersion.value) {
				version = newVersions.find((version) => version.key === newQueryVersion);
			}

			if (version?.key !== currentVersion.value?.key) {
				validationErrors.value = [];
			}

			currentVersion.value = version ?? null;
		},
		{ immediate: true },
	);

	watch(currentVersion, (newCurrentVersion) => {
		queryVersion.value = newCurrentVersion?.key ?? null;
		validationErrors.value = [];
	});

	const query = computed<Query>(() => {
		if (!currentVersion.value) return {};

		return {
			version: currentVersion.value.key,
			versionRaw: true,
		};
	});

	watch(
		[collection, isSingleton, primaryKey],
		([newCollection], [oldCollection]) => {
			if (newCollection !== oldCollection) currentVersion.value = null;
			getVersions();
		},
		{ immediate: true },
	);

	return {
		readVersionsAllowed,
		currentVersion,
		versions,
		loading,
		query,
		getVersions,
		addVersion,
		updateVersion,
		deleteVersion,
		saveVersionLoading,
		saveVersion,
		validationErrors,
	};

	function saveVersionErrorHandler(error: any) {
		if (error?.response?.data?.errors) {
			validationErrors.value = error.response.data.errors
				.filter((err: APIError) => VALIDATION_TYPES.includes(err?.extensions?.code))
				.map((err: APIError) => {
					return err.extensions;
				});

			const otherErrors = error.response.data.errors.filter(
				(err: APIError) => !VALIDATION_TYPES.includes(err?.extensions?.code),
			);

			if (otherErrors.length > 0) {
				otherErrors.forEach(unexpectedError);
			}
		} else {
			unexpectedError(error);
		}

		throw error;
	}

	async function getVersions() {
		if (!readVersionsAllowed.value) return;

		if ((!isSingleton.value && !primaryKey.value) || primaryKey.value === '+') return;

		loading.value = true;

		try {
			const filter: Filter = {
				_and: [
					{
						collection: {
							_eq: unref(collection),
						},
					},
					...(primaryKey.value
						? [
								{
									item: {
										_eq: primaryKey.value,
									},
								},
							]
						: []),
				],
			};

			const response = await api.get(`/versions`, {
				params: {
					filter,
					sort: '-date_created',
					fields: ['*'],
				},
			});

			versions.value = response.data.data;
		} catch (error) {
			unexpectedError(error);
		} finally {
			loading.value = false;
		}
	}

	async function addVersion(version: ContentVersion) {
		versions.value = [...(versions.value ? versions.value : []), version];
		queryVersion.value = version.key;
	}

	async function updateVersion(updates: { key: string; name?: string | null }) {
		if (!currentVersion.value || !versions.value) return;

		const currentVersionId = currentVersion.value.id;

		const versionToUpdate = versions.value.find((version) => version.id === currentVersionId);

		if (versionToUpdate) {
			versionToUpdate.key = updates.key;
			if ('name' in updates) versionToUpdate.name = updates.name ?? null;
			currentVersion.value = versionToUpdate;
		}
	}

	async function deleteVersion() {
		if (!currentVersion.value || !versions.value) return;

		const currentVersionId = currentVersion.value.id;

		const index = versions.value.findIndex((version) => version.id === currentVersionId);

		if (index !== undefined) {
			currentVersion.value = null;
			versions.value.splice(index, 1);
		}
	}

	async function saveVersion(edits: Ref<Record<string, any>>, item: Ref<Item>) {
		if (!currentVersion.value) return;
		saveVersionLoading.value = true;
		validationErrors.value = [];

		const payloadToValidate = mergeItemData(defaultValues.value, item.value, edits.value);

		const fields = pushGroupOptionsDown(fieldsWithPermissions.value);

		const errors = validateItem(payloadToValidate, fields, false, false, currentVersion.value);
		if (nestedValidationErrors.value?.length) errors.push(...nestedValidationErrors.value);

		if (errors.length > 0) {
			validationErrors.value = errors;
			saveVersionLoading.value = false;
			throw errors;
		}

		try {
			const response = await api.post(`/versions/${currentVersion.value.id}/save`, unref(edits));
			const savedData = response.data.data;

			// Update local item with the saved changes
			Object.assign(item.value, savedData);
			edits.value = {};

			await getVersions();

			return savedData;
		} catch (error) {
			saveVersionErrorHandler(error);
		} finally {
			saveVersionLoading.value = false;
		}
	}
}
