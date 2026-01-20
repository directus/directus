import type { ContentVersion, Filter, Item, PrimaryKey, Query } from '@directus/types';
import { useRouteQuery } from '@vueuse/router';
import { computed, ref, type Ref, watch } from 'vue';
import { useCollectionPermissions, usePermissions } from './use-permissions';
import api from '@/api';
import { useNestedValidation } from '@/composables/use-nested-validation';
import { VALIDATION_TYPES } from '@/constants';
import { DRAFT_VERSION_KEY } from '@/constants';
import { APIError } from '@/types/error';
import type { ContentVersionMaybeNew, ContentVersionWithType, NewContentVersion } from '@/types/versions';
import { getDefaultValuesFromFields } from '@/utils/get-default-values-from-fields';
import { mergeItemData } from '@/utils/merge-item-data';
import { pushGroupOptionsDown } from '@/utils/push-group-options-down';
import { unexpectedError } from '@/utils/unexpected-error';
import { validateItem } from '@/utils/validate-item';

export function useVersions(collection: Ref<string>, isSingleton: Ref<boolean>, primaryKey: Ref<string | null>) {
	const currentVersion = ref<ContentVersionMaybeNew | null>(null);
	const rawVersions = ref<ContentVersion[] | null>(null);
	const loading = ref(false);
	const saveVersionLoading = ref(false);
	const validationErrors = ref<any[]>([]);

	const { createAllowed: createVersionsAllowed, readAllowed: readVersionsAllowed } =
		useCollectionPermissions('directus_versions');

	const queryVersion = useRouteQuery<string | null>('version', null, {
		transform: (value) => (Array.isArray(value) ? value[0] : value),
		mode: 'push',
	});

	const permissions = usePermissions(collection, primaryKey, false);
	const fieldsWithPermissions = permissions.itemPermissions.fields;
	const { nestedValidationErrors } = useNestedValidation();
	const defaultValues = getDefaultValuesFromFields(fieldsWithPermissions);

	const query = computed<Query>(() => {
		if (!currentVersion.value || currentVersion.value.id === '+') return {};

		return {
			version: currentVersion.value.key,
			versionRaw: true,
		};
	});

	const versions = computed<ContentVersionMaybeNew[]>(() => {
		const draftVersion = getGlobalVersion(DRAFT_VERSION_KEY);
		const globalVersionKeys = [DRAFT_VERSION_KEY];
		const localVersions = rawVersions.value?.filter(versionNotInGlobals)?.map(versionAddLocalType) ?? [];

		return [draftVersion, ...localVersions];

		function getGlobalVersion(key: ContentVersion['key'], name: string | null = null) {
			const type = 'global';
			const existingVersion = rawVersions.value?.find((version) => version.key === key);

			if (existingVersion) {
				return { ...existingVersion, name, type } as ContentVersionWithType;
			}

			return { id: '+', key, name, type } as NewContentVersion;
		}

		function versionNotInGlobals(version: ContentVersion) {
			return !globalVersionKeys.includes(version.key);
		}

		function versionAddLocalType(version: ContentVersion): ContentVersionWithType {
			return { ...version, type: 'local' };
		}
	});

	watch(
		[queryVersion, rawVersions],
		([newQueryVersion, newRawVersions]) => {
			if (!newRawVersions) return;

			const previouslySelectedKey = currentVersion.value?.key;

			currentVersion.value = newQueryVersion
				? (versions.value?.find((version) => version.key === newQueryVersion && isVersionSelectable(version)) ?? null)
				: null;

			if (currentVersion.value?.key !== previouslySelectedKey) {
				validationErrors.value = [];
			}
		},
		{ immediate: true },
	);

	watch(currentVersion, (newCurrentVersion) => {
		queryVersion.value = newCurrentVersion?.key ?? null;
		validationErrors.value = [];
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
					{ collection: { _eq: collection.value } },
					...(primaryKey.value ? [{ item: { _eq: primaryKey.value } }] : []),
				],
			};

			const response = await api.get(`/versions`, {
				params: {
					filter,
					sort: '-date_created',
					fields: ['*'],
				},
			});

			rawVersions.value = response.data.data;
		} catch (error) {
			unexpectedError(error);
		} finally {
			loading.value = false;
		}
	}

	async function addVersion(version: ContentVersion) {
		rawVersions.value = [...(rawVersions.value ? rawVersions.value : []), version];
		queryVersion.value = version.key;
	}

	async function updateVersion(updates: { key: string; name?: string | null }) {
		if (!currentVersion.value || !rawVersions.value) return;

		const currentVersionId = currentVersion.value.id;
		const versionToUpdate = rawVersions.value.find((version) => version.id === currentVersionId);

		if (versionToUpdate) {
			versionToUpdate.key = updates.key;
			if ('name' in updates) versionToUpdate.name = updates.name ?? null;
			currentVersion.value = versions.value.find((version) => version.id === currentVersionId) ?? null;
		}
	}

	async function deleteVersion() {
		if (currentVersion.value?.type === 'global') {
			await getVersions();
			return;
		}

		if (!currentVersion.value || !rawVersions.value) return;

		const currentVersionId = currentVersion.value.id;

		const index = rawVersions.value.findIndex((version) => version.id === currentVersionId);

		if (index !== undefined) {
			currentVersion.value = null;
			rawVersions.value.splice(index, 1);
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
			let versionId: PrimaryKey;

			if (currentVersion.value.id === '+') {
				const {
					data: { data: version },
				} = await api.post(`/versions`, {
					key: currentVersion.value.key,
					collection: collection.value,
					item: String(primaryKey.value),
				});

				versionId = version.id;
			} else {
				versionId = currentVersion.value.id;
			}

			const {
				data: { data: savedData },
			} = await api.post(`/versions/${versionId}/save`, edits.value);

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

	function isVersionSelectable(version: ContentVersionMaybeNew) {
		return version.id === '+' ? createVersionsAllowed.value : readVersionsAllowed.value;
	}
}
