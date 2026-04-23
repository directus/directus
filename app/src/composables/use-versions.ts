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

export function useVersions(
	collection: Ref<string>,
	isSingleton: Ref<boolean>,
	/**
	 * Resolved item PK: null for pristine singletons (item-less), '+' for new items
	 * before their first save, or the actual PK for existing items.
	 */
	primaryKey: Ref<PrimaryKey | null>,
) {
	const currentVersion = ref<ContentVersionMaybeNew | null>(null);
	const rawVersions = ref<ContentVersion[] | null>(null);
	const loading = ref(false);
	const deleteVersionLoading = ref(false);
	const saveVersionLoading = ref(false);
	const publishVersionLoading = ref(false);
	const validationErrors = ref<any[]>([]);

	const { createAllowed: createVersionsAllowed, readAllowed: readVersionsAllowed } =
		useCollectionPermissions('directus_versions');

	const queryVersionId = useRouteQuery<PrimaryKey | null>('versionId', null, {
		transform: (value) => (Array.isArray(value) ? value[0] : value),
		mode: 'push',
	});

	const queryVersion = useRouteQuery<string | null>('version', null, {
		transform: (value) => (Array.isArray(value) ? value[0] : value),
		mode: 'push',
	});

	/**
	 * True when the current PK indicates no backing item exists yet — either a pristine singleton
	 * (`null`) or a new-item route (`'+'`). Distinct from `isItemlessVersion`, which additionally
	 * requires a saved version row.
	 */
	const isNewItem = computed(() => !primaryKey.value || primaryKey.value === '+');

	/**
	 * True when a saved version row exists (`currentVersion.id` is a real DB id) AND the backing
	 * item hasn't been saved yet (`isNewItem`). Represents the on-disk state
	 * `directus_versions.item IS NULL`.
	 */
	const isItemlessVersion = computed(() => {
		const version = currentVersion.value;
		if (!version || version.id === '+') return false;
		return (version as ContentVersionWithType).item === null;
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
		[queryVersion, versions],
		([newQueryVersion, newVersions]) => {
			if (!newVersions) return;

			const previouslySelectedKey = currentVersion.value?.key;

			currentVersion.value = newQueryVersion
				? (newVersions.find((version) => version.key === newQueryVersion && isVersionSelectable(version)) ?? null)
				: null;

			if (currentVersion.value?.key !== previouslySelectedKey) {
				validationErrors.value = [];
			}
		},
		{ immediate: true },
	);

	watch(currentVersion, (newCurrentVersion) => {
		queryVersion.value = newCurrentVersion?.key ?? null;

		queryVersionId.value =
			newCurrentVersion && isNewItem.value && newCurrentVersion.id !== '+' ? newCurrentVersion.id : null;

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

		if (!isSingleton.value && !primaryKey.value) return;

		if (primaryKey.value === '+' && !queryVersionId.value) return;

		loading.value = true;

		try {
			const filterConditions: Filter[] = [{ collection: { _eq: collection.value } }];

			if (isNewItem.value) {
				// No parent item yet — match item-less drafts; scope to a specific version if known
				filterConditions.push({ item: { _null: true } });
				if (queryVersionId.value) filterConditions.push({ id: { _eq: queryVersionId.value } });
			} else {
				filterConditions.push({ item: { _eq: String(primaryKey.value) } });
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

	async function deleteVersion(versionId: PrimaryKey) {
		deleteVersionLoading.value = true;

		try {
			await api.delete(`/versions/${versionId}`);

			const indexToRemove = rawVersions.value?.findIndex((v) => v.id === versionId) ?? -1;
			if (indexToRemove !== -1) rawVersions.value?.splice(indexToRemove, 1);
		} catch (error) {
			unexpectedError(error);
			throw error;
		} finally {
			deleteVersionLoading.value = false;
		}
	}

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

	async function saveVersion(edits: Ref<Record<string, any>>, item: Ref<Item | null>) {
		if (!currentVersion.value) return;
		// Non-singletons must have a PK (either '+' for new or the real one); null PK is only valid for pristine singletons
		if (!primaryKey.value && !isSingleton.value) return;

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
					item: isNewItem.value ? null : String(primaryKey.value),
				});

				versionId = version.id;
			} else {
				versionId = currentVersion.value.id;
			}

			const {
				data: { data: savedData },
			} = await api.post(`/versions/${versionId}/save`, edits.value);

			// Update local item with the saved changes
			item.value = item.value ? Object.assign(item.value, savedData) : savedData;
			edits.value = {};

			if (isNewItem.value) queryVersionId.value = versionId;

			await getVersions();

			return savedData;
		} catch (error) {
			versionErrorHandler(error);
		} finally {
			saveVersionLoading.value = false;
		}
	}

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

	function isVersionSelectable(version: ContentVersionMaybeNew) {
		return version.id === '+' ? createVersionsAllowed.value : readVersionsAllowed.value;
	}

	return {
		readVersionsAllowed,
		currentVersion,
		versions,
		loading,
		getVersions,
		addVersion,
		updateVersion,
		deleteVersion,
		deleteVersionLoading,
		saveVersionLoading,
		saveVersion,
		validationErrors,
		publishVersionLoading,
		publishVersion,
		isItemlessVersion,
	};
}
