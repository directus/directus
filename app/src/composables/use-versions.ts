import api from '@/api';
import { usePermissionsStore } from '@/stores/permissions';
import { unexpectedError } from '@/utils/unexpected-error';
import { Filter, Query, ContentVersion } from '@directus/types';
import { Ref, computed, ref, unref, watch } from 'vue';

export function useVersions(collection: Ref<string>, isSingleton: Ref<boolean>, primaryKey: Ref<string | null>) {
	const { hasPermission } = usePermissionsStore();

	const readVersionsAllowed = computed<boolean>(() => hasPermission('directus_versions', 'read'));

	const currentVersion = ref<ContentVersion | null>(null);
	const versions = ref<ContentVersion[] | null>(null);
	const loading = ref(false);
	const saveVersionLoading = ref(false);

	const query = computed<Query>(() => {
		if (!currentVersion.value) return {};

		return {
			version: currentVersion.value.key,
		};
	});

	watch(
		[collection, isSingleton, primaryKey],
		([newCollection, _newIsSingleton, _newPrimaryKey], [oldCollection, _oldIsSingleton, _oldPrimaryKey]) => {
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

		currentVersion.value = version;
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

	async function saveVersion(edits: Ref<Record<string, any>>) {
		if (!currentVersion.value) return;

		saveVersionLoading.value = true;

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
