import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import { Filter, Query, Version } from '@directus/types';
import { computed, ref, Ref, unref, watch } from 'vue';

export function useVersions(collection: Ref<string>, isSingleton: Ref<boolean>, primaryKey: Ref<string | null>) {
	const currentVersion = ref<Version | null>(null);
	const versions = ref<Version[] | null>(null);
	const loading = ref(false);
	const saveVersionLoading = ref(false);

	const query = computed<Query>(() => {
		if (!currentVersion.value) return {};

		return {
			version: currentVersion.value.name,
		};
	});

	watch(
		[collection, isSingleton, primaryKey],
		([newCollection, _newIsSingleton, _newPrimaryKey], [oldCollection, _oldIsSingleton, _oldPrimaryKey]) => {
			if (newCollection !== oldCollection) currentVersion.value = null;
			getVersions();
		},
		{ immediate: true }
	);

	return {
		currentVersion,
		versions,
		loading,
		query,
		getVersions,
		addVersion,
		renameVersion,
		deleteVersion,
		saveVersionLoading,
		saveVersion,
	};

	async function getVersions() {
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
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			loading.value = false;
		}
	}

	async function addVersion(version: Version, switchToVersion: boolean) {
		versions.value = [...(versions.value ? versions.value : []), version];

		if (switchToVersion) {
			currentVersion.value = version;
		}
	}

	async function renameVersion(name: string) {
		if (!currentVersion.value || !versions.value) return;

		const currentVersionId = currentVersion.value.id;

		const versionToRename = versions.value.find((version) => version.id === currentVersionId);

		if (versionToRename) {
			versionToRename.name = name;
			currentVersion.value = versionToRename;
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
		} catch (err: any) {
			unexpectedError(err);
		} finally {
			saveVersionLoading.value = false;
		}
	}
}
