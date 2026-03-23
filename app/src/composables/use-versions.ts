import { VERSION_KEY_DRAFT } from '@directus/constants';
import type { ContentVersion, Filter, Item, PrimaryKey } from '@directus/types';
import { useRouteQuery } from '@vueuse/router';
import { computed, ref, type Ref, watch } from 'vue';
import { useCollectionPermissions } from './use-permissions';
import api from '@/api';
import { VALIDATION_TYPES } from '@/constants';
import { APIError } from '@/types/error';
import type { ContentVersionMaybeNew, ContentVersionWithType, NewContentVersion } from '@/types/versions';
import { unexpectedError } from '@/utils/unexpected-error';

export interface PublishVersionOptions {
	mainHash?: string;
	fields?: string[];
}

export function useVersions(collection: Ref<string>, isSingleton: Ref<boolean>, primaryKey: Ref<string | null>) {
	const currentVersion = ref<ContentVersionMaybeNew | null>(null);
	const rawVersions = ref<ContentVersion[] | null>(null);
	const loading = ref(false);
	const validationErrors = ref<any[]>([]);

	const { createAllowed: createVersionsAllowed, readAllowed: readVersionsAllowed } =
		useCollectionPermissions('directus_versions');

	const queryVersionId = useRouteQuery<string | null>('versionId', null, {
		transform: (value) => (Array.isArray(value) ? value[0] : value),
		mode: 'push',
	});

	const queryVersion = useRouteQuery<string | null>('version', null, {
		transform: (value) => (Array.isArray(value) ? value[0] : value),
		mode: 'push',
	});

	const versions = computed<ContentVersionMaybeNew[]>(() => {
		const draftVersion = getGlobalVersion(VERSION_KEY_DRAFT);
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
			return version.key !== VERSION_KEY_DRAFT;
		}

		function versionAddLocalType(version: ContentVersion): ContentVersionWithType {
			return { ...version, type: 'local' };
		}
	});

	watch(
		[queryVersion, queryVersionId, versions],
		([newQueryVersion, newQueryVersionId, newVersions]) => {
			if (!newVersions) return;

			const previouslySelectedKey = currentVersion.value?.key;

			if (newQueryVersion) {
				let found: ContentVersionMaybeNew | null = null;

				if (newQueryVersionId) {
					// Item-less draft: find by ID first (version may not be loaded yet on first render)
					found =
						newVersions.find((version) => version.id === newQueryVersionId && isVersionSelectable(version)) ?? null;
				}

				if (!found) {
					// Fall back to key-based lookup (normal versions, or before rawVersions loads)
					found =
						newVersions.find((version) => version.key === newQueryVersion && isVersionSelectable(version)) ?? null;
				}

				currentVersion.value = found;
			} else {
				currentVersion.value = null;
			}

			if (currentVersion.value?.key !== previouslySelectedKey) {
				validationErrors.value = [];
			}
		},
		{ immediate: true },
	);

	watch(currentVersion, (newCurrentVersion) => {
		queryVersion.value = newCurrentVersion?.key ?? null;

		if (newCurrentVersion !== null) {
			// Sync queryVersionId to the selected version's real ID (null for synthetic '+' versions)
			queryVersionId.value = newCurrentVersion.id !== '+' ? newCurrentVersion.id : null;
		}

		validationErrors.value = [];
	});

	watch(
		[collection, isSingleton, primaryKey],
		([newCollection], [oldCollection]) => {
			if (oldCollection && newCollection !== oldCollection) currentVersion.value = null;
			getVersions();
		},
		{ immediate: true },
	);

	async function getVersions() {
		if (!readVersionsAllowed.value) return;

		// No collection context
		if (!isSingleton.value && !primaryKey.value) return;

		// For new items ('+'): only fetch if there's a versionId in URL (returning to a previously
		// saved item-less draft). Fresh new items have no versions yet — skip the API call.
		if (primaryKey.value === '+' && !queryVersionId.value) return;

		loading.value = true;

		try {
			const filterConditions: Filter[] = [{ collection: { _eq: collection.value } }];

			if (primaryKey.value && primaryKey.value !== '+') {
				filterConditions.push({ item: { _eq: primaryKey.value } });
			} else if (primaryKey.value === '+' && queryVersionId.value) {
				filterConditions.push({ item: { _null: true } }, { id: { _eq: queryVersionId.value } });
			}

			const filter: Filter = { _and: filterConditions };

			const { data: response } = await api.get(`/versions`, {
				params: {
					filter,
					sort: '-date_created',
					fields: ['*'],
				},
			});

			rawVersions.value = response.data;
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

	function deleteVersion(deleteOnPublish = true) {
		if (!currentVersion.value || !rawVersions.value) return;

		const isLocalVersion = currentVersion.value?.type === 'local';
		const currentVersionId = currentVersion.value.id;

		const index = rawVersions.value.findIndex((version) => version.id === currentVersionId);

		if (index !== -1) {
			if (isLocalVersion || deleteOnPublish) currentVersion.value = null;
			rawVersions.value.splice(index, 1);
		}
	}

	// Save version

	const saveVersionLoading = ref(false);

	function versionErrorHandler(error: any) {
		if (error?.response?.data?.errors) {
			const serverValidationErrors = error.response.data.errors
				.filter((err: APIError) => VALIDATION_TYPES.includes(err?.extensions?.code))
				.map((err: APIError) => err.extensions);

			const existingFields = new Set(validationErrors.value.map((e: any) => e.field));

			validationErrors.value = [
				...validationErrors.value,
				...serverValidationErrors.filter((e: any) => !existingFields.has(e.field)),
			];

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

	/** @param actualPrimaryKey Resolved PK of the item — needed because for singletons the route PK is null */
	async function saveVersion(
		edits: Ref<Record<string, any>>,
		item: Ref<Item | null>,
		actualPrimaryKey: PrimaryKey | null,
	) {
		if (!currentVersion.value || !actualPrimaryKey) return;

		saveVersionLoading.value = true;
		validationErrors.value = [];

		try {
			let versionId: PrimaryKey;

			if (currentVersion.value.id === '+') {
				const {
					data: { data: version },
				} = await api.post(`/versions`, {
					key: currentVersion.value.key,
					collection: collection.value,
					item: actualPrimaryKey === '+' ? null : String(actualPrimaryKey),
				});

				versionId = version.id;
				// Sync rawVersions so the [queryVersion, queryVersionId, versions] watcher can find the version
				rawVersions.value = [...(rawVersions.value ?? []), version];
				// Update URL: posts/+?version=draft&versionId=<id>
				queryVersion.value = version.key;
				queryVersionId.value = version.id;
			} else {
				versionId = currentVersion.value.id;
			}

			const {
				data: { data: savedData },
			} = await api.post(`/versions/${versionId}/save`, edits.value);

			// Update local item with the saved changes
			item.value = item.value ? Object.assign(item.value, savedData) : savedData;
			edits.value = {};

			if (primaryKey.value !== '+') {
				await getVersions();
			}

			return savedData;
		} catch (error) {
			versionErrorHandler(error);
		} finally {
			saveVersionLoading.value = false;
		}
	}

	// Publish version

	const publishVersionLoading = ref(false);

	async function publishVersion(
		versionId: PrimaryKey,
		options: PublishVersionOptions = {},
	): Promise<PrimaryKey | null> {
		publishVersionLoading.value = true;
		const { mainHash, fields } = options;

		try {
			const body: Record<string, any> = {};
			if (mainHash !== undefined) body['mainHash'] = mainHash;
			if (fields !== undefined) body['fields'] = fields;

			const {
				data: { data: itemKey },
			} = await api.post(`/versions/${versionId}/promote`, body);

			return itemKey ?? null;
		} catch (error) {
			versionErrorHandler(error);
			return null;
		} finally {
			publishVersionLoading.value = false;
		}
	}

	async function removeVersion(versionId: PrimaryKey) {
		loading.value = true;

		try {
			await api.delete(`/versions/${versionId}`);

			const index = rawVersions.value?.findIndex((v) => v.id === versionId) ?? -1;
			if (index !== -1) rawVersions.value?.splice(index, 1);
			if (currentVersion.value?.id === versionId) currentVersion.value = null;
		} catch (error) {
			unexpectedError(error);
			throw error;
		} finally {
			loading.value = false;
		}
	}

	function isVersionSelectable(version: ContentVersionMaybeNew) {
		return version.id === '+' ? createVersionsAllowed.value : readVersionsAllowed.value;
	}

	return {
		readVersionsAllowed,
		currentVersion,
		versions,
		loading,
		queryVersionId,
		getVersions,
		addVersion,
		updateVersion,
		deleteVersion,
		saveVersionLoading,
		saveVersion,
		validationErrors,
		publishVersionLoading,
		publishVersion,
		removeVersion,
	};
}
