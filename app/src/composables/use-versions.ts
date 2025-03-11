import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { ContentVersion, Filter, Query } from '@directus/types';
import { useRouteQuery } from '@vueuse/router';
import { Ref, computed, ref, unref, watch } from 'vue';
import { useCollectionPermissions, usePermissions } from './use-permissions';
import { mergeWith } from 'lodash';
import { pushGroupOptionsDown } from '@/utils/push-group-options-down';
import { validateItem } from '@/utils/validate-item';
import { useNestedValidation } from '@/composables/use-nested-validation';

export function useVersions(collection: Ref<string>, isSingleton: Ref<boolean>, primaryKey: Ref<string | null>) {
	const currentVersion = ref<ContentVersion | null>(null);
	const versions = ref<ContentVersion[] | null>(null);
	const loading = ref(false);
	const saveVersionLoading = ref(false);
	const validationErrors = ref<any[]>([]);
	const saving = ref(false);

	const { readAllowed: readVersionsAllowed } = useCollectionPermissions('directus_versions');

	const queryVersion = useRouteQuery<string | null>('version', null, {
		transform: (value) => (Array.isArray(value) ? value[0] : value),
		mode: 'push',
	});

	const permissions = usePermissions(collection, primaryKey, false);
	const fieldsWithPermissions = permissions.itemPermissions.fields;
	const { nestedValidationErrors } = useNestedValidation();

	watch(
		[queryVersion, versions],
		([newQueryVersion, newVersions]) => {
			if (!newVersions) return;

			let version;

			if (queryVersion.value) {
				version = newVersions.find((version) => version.key === newQueryVersion);
			}

			if (version?.key === currentVersion.value?.key) return;

			currentVersion.value = version ?? null;
		},
		{ immediate: true },
	);

	watch(currentVersion, (newCurrentVersion) => {
		queryVersion.value = newCurrentVersion?.key ?? null;
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
	};

	async function getVersions() {
		if (!readVersionsAllowed.value) return;

		if ((!isSingleton && !primaryKey.value) || primaryKey.value === '+') return;

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

	async function saveVersion(edits: Ref<Record<string, any>>, item: Ref<Record<string, any>>) {
		if (!currentVersion.value) return;

		saveVersionLoading.value = true;

		const payloadToValidate = mergeWith({}, item.value, edits.value, function (_from: any, to: any) {
			if (typeof to !== 'undefined') {
				return to;
			}
		});

		const fields = pushGroupOptionsDown(fieldsWithPermissions.value);

		const errors = validateItem(payloadToValidate, fields, false, false, currentVersion.value);
		if (nestedValidationErrors.value?.length) errors.push(...nestedValidationErrors.value);

		//FIXME: Conditions based on $version are not producing validation errors when they should, and are being passed to the server
		if (errors.length > 0) {
			validationErrors.value = errors;
			saving.value = false;
			throw errors;
		}

		try {
			await api.post(`/versions/${currentVersion.value.id}/save`, unref(edits));
		} catch (error) {
			unexpectedError(error);
			throw error;
		} finally {
			saveVersionLoading.value = false;
		}
	}
}
