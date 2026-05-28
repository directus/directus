import { VERSION_KEY_DRAFT } from '@directus/constants';
import type { ContentVersion, Filter, Item, PrimaryKey } from '@directus/types';
import { useRouteQuery } from '@vueuse/router';
import { isEqual } from 'lodash';
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

export function useVersions(collection: Ref<string>, isSingleton: Ref<boolean>, primaryKey: Ref<PrimaryKey | null>) {
	const currentVersion = ref<ContentVersionMaybeNew | null>(null);
	const rawVersions = ref<ContentVersion[] | null>(null);
	const deleteVersionLoading = ref(false);
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

	const isNewItem = computed(() => primaryKey.value === '+');

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

			const newSelected = newQueryVersion
				? (newVersions.find((version) => version.key === newQueryVersion && isVersionSelectable(version)) ?? null)
				: null;

			if (newSelected && currentVersion.value && newSelected.id === currentVersion.value.id) {
				Object.assign(currentVersion.value, newSelected);
			} else {
				currentVersion.value = newSelected;
			}

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
		[collection, isSingleton, primaryKey, queryVersionId],
		([newCollection], [oldCollection]) => {
			if (oldCollection && newCollection !== oldCollection) currentVersion.value = null;
			getVersions();
		},
		{ immediate: true },
	);

	async function getVersions() {
		if (!readVersionsAllowed.value) return;

		if (!isSingleton.value && !primaryKey.value) return;

		if (isNewItem.value && !queryVersionId.value) {
			// Drop versions carried over from a previously viewed item so the unsaved itemless version starts with no versions loaded
			rawVersions.value = null;
			return;
		}

		try {
			const filterConditions: Filter[] = [{ collection: { _eq: collection.value } }];

			if (isNewItem.value) {
				// No parent item yet — match item-less drafts; scope to a specific version if known
				filterConditions.push({ item: { _null: true } });

				if (queryVersionId.value) filterConditions.push({ id: { _eq: queryVersionId.value } });
			} else if (primaryKey.value) {
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

	function versionErrorHandler(error: any, opts: { silent?: boolean } = {}) {
		if (currentVersion.value && currentVersion.value.id !== '+' && error?.response?.status === 403) {
			throw Object.assign(error, { versionGone: true });
		}

		if (error?.response?.status === 422) {
			const driftError = error.response.data?.errors?.find(
				(err: APIError) => err?.extensions?.code === 'VERSION_HASH_MISMATCH',
			);

			if (driftError) {
				throw Object.assign(error, {
					versionDrift: true,
					mainHash: driftError.extensions.mainHash as string,
				});
			}
		}

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

			if (otherErrors.length > 0 && !opts.silent) {
				otherErrors.forEach(unexpectedError);
			}
		} else if (!opts.silent) {
			unexpectedError(error);
		}

		throw error;
	}

	async function saveVersion(
		edits: Ref<Record<string, any>>,
		item: Ref<Item | null>,
		opts?: { patchRevision?: boolean },
	) {
		if (!currentVersion.value || !primaryKey.value) return;

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

			// New versions have no prior revision to coalesce into
			const shouldPatchRevision = opts?.patchRevision === true && currentVersion.value.id !== '+';

			const endpoint = shouldPatchRevision
				? `/versions/${versionId}/save?patchRevision`
				: `/versions/${versionId}/save`;

			const editsToSave = { ...edits.value };

			const {
				data: { data: savedData },
			} = await api.post(endpoint, editsToSave);

			item.value = item.value ? Object.assign(item.value, savedData) : savedData;
			clearSavedEditKeys(edits, editsToSave);

			if (isNewItem.value) queryVersionId.value = versionId;

			await getVersions();

			return savedData;
		} catch (error) {
			versionErrorHandler(error, { silent: true });
		}
	}

	function clearSavedEditKeys(edits: Ref<Record<string, any>>, savedEdits: Record<string, any>) {
		for (const key of Object.keys(savedEdits)) {
			if (isEqual(edits.value[key], savedEdits[key])) delete edits.value[key];
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
		createVersionsAllowed,
		currentVersion,
		versions,
		getVersions,
		addVersion,
		updateVersion,
		deleteVersion,
		deleteVersionLoading,
		saveVersion,
		validationErrors,
		publishVersionLoading,
		publishVersion,
		isItemlessVersion,
	};
}
