import api from '@/api';
import { useFieldsStore } from '@/stores/fields';
import type { Revision, RevisionPartial } from '@/types/revisions';
import { getDefaultValuesFromFields } from '@/utils/get-default-values-from-fields';
import { unexpectedError } from '@/utils/unexpected-error';
import type { ContentVersion, PrimaryKey, User } from '@directus/types';
import { getEndpoint } from '@directus/utils';
import {
	toggleFieldInSelection,
	toggleAllFields,
	areAllFieldsSelected,
	areSomeFieldsSelected,
	getNormalizedComparisonData,
	applyValuesToSpecialFields,
	getRevisionFields,
	replaceArraysInMergeCustomizer,
	type ComparisonData,
	type VersionComparisonResponse,
	type RevisionComparisonResponse,
	type NormalizedComparisonData,
	type NormalizedUser,
} from '../comparison-utils';
import { has, mergeWith } from 'lodash';
import { computed, ref, watch, type Ref } from 'vue';

interface UseComparisonOptions {
	comparisonData: Ref<ComparisonData | null>;
	collection: Ref<string>;
	primaryKey: Ref<PrimaryKey>;
}

export function useComparison(options: UseComparisonOptions) {
	const { comparisonData, collection, primaryKey } = options;
	const selectedComparisonFields = ref<string[]>([]);
	const userUpdated = ref<User | null>(null);
	const mainItemUserUpdated = ref<User | null>(null);

	const userLoading = ref(false);
	const mainItemUserLoading = ref(false);
	const fieldsStore = useFieldsStore();

	const isVersionMode = computed(() => comparisonData.value?.comparisonType === 'version');
	const isRevisionMode = computed(() => comparisonData.value?.comparisonType === 'revision');

	const normalizedData = computed<NormalizedComparisonData | null>(() => {
		if (!comparisonData.value) return null;

		const collectionFields = fieldsStore.getFieldsForCollection(collection.value);
		const fieldMetadata = Object.fromEntries(collectionFields.map((field) => [field.field, field]));

		return getNormalizedComparisonData(comparisonData.value, fieldMetadata);
	});

	const mainHash = computed(() => normalizedData.value?.mainHash ?? '');

	const fieldsWithDifferences = computed(() => {
		return normalizedData.value?.fieldsWithDifferences || [];
	});

	const allFieldsSelected = computed(() => {
		return areAllFieldsSelected(selectedComparisonFields.value, fieldsWithDifferences.value);
	});

	const someFieldsSelected = computed(() => {
		return areSomeFieldsSelected(selectedComparisonFields.value, fieldsWithDifferences.value);
	});

	const availableFieldsCount = computed(() => {
		return fieldsWithDifferences.value.length;
	});

	const comparisonFields = computed(() => {
		return new Set(fieldsWithDifferences.value);
	});

	const baseDisplayName = computed(() => {
		return normalizedData.value?.base?.displayName || '';
	});

	const deltaDisplayName = computed(() => {
		return normalizedData.value?.incoming?.displayName || '';
	});

	function toggleSelectAll() {
		selectedComparisonFields.value = toggleAllFields(
			selectedComparisonFields.value,
			fieldsWithDifferences.value,
			allFieldsSelected.value,
		);
	}

	function toggleComparisonField(fieldKey: string) {
		selectedComparisonFields.value = toggleFieldInSelection(selectedComparisonFields.value, fieldKey);
	}

	watch(
		fieldsWithDifferences,
		(newFields) => {
			if (newFields.length > 0) {
				selectedComparisonFields.value = newFields;
			} else {
				selectedComparisonFields.value = [];
			}
		},
		{ immediate: true },
	);

	async function fetchUserDetails(user: NormalizedUser | null | undefined, loading: Ref<boolean>) {
		if (!user) return;

		const fields = ['id', 'first_name', 'last_name', 'email'];

		if (fields.every((field) => has(user, field))) {
			return user as unknown as User;
		}

		const userId = user.id ?? user;
		if (typeof userId !== 'string') return;

		loading.value = true;

		try {
			const response = await api.get(`/users/${userId}`, {
				params: { fields },
			});

			return response.data.data;
		} catch (error) {
			unexpectedError(error);
		} finally {
			loading.value = false;
		}
	}

	async function fetchUserUpdated() {
		userUpdated.value = (await fetchUserDetails(normalizedData.value?.incoming?.user, userLoading)) ?? null;
	}

	async function fetchMainItemUserUpdated() {
		mainItemUserUpdated.value = (await fetchUserDetails(normalizedData.value?.base?.user, mainItemUserLoading)) ?? null;
	}

	async function normalizeComparisonData(
		id: string,
		type: 'version',
		currentVersion?: ContentVersion | null,
		versions?: ContentVersion[] | null,
		revisions?: Revision[] | null,
	): Promise<ComparisonData>;
	async function normalizeComparisonData(
		id: number,
		type: 'revision',
		currentVersion?: ContentVersion | null,
		versions?: ContentVersion[] | null,
		revisions?: Revision[] | null,
	): Promise<ComparisonData>;
	async function normalizeComparisonData(
		id: string | number,
		type: 'version' | 'revision',
		currentVersion?: ContentVersion | null,
		versions?: ContentVersion[] | null,
		revisions?: Revision[] | null,
	): Promise<ComparisonData> {
		if (type === 'version') {
			return await normalizeVersionComparison(id as string, currentVersion, versions);
		} else {
			return await normalizeRevisionComparison(id as number, currentVersion, revisions);
		}
	}

	async function normalizeVersionComparison(
		versionId: string,
		currentVersion?: ContentVersion | null,
		versions?: ContentVersion[] | null,
	): Promise<ComparisonData> {
		const version = getVersionFromComposable(versionId, currentVersion, versions);

		if (!version) {
			return await fetchVersionComparison(versionId, undefined, versions);
		}

		return await fetchVersionComparison(version.id, version, versions);
	}

	async function normalizeRevisionComparison(
		revisionId: number,
		currentVersion?: ContentVersion | null,
		revisions?: Revision[] | null,
	): Promise<ComparisonData> {
		const revision = getRevisionFromComposable(revisionId, revisions);

		if (!revision) {
			return await fetchRevisionComparison(revisionId, currentVersion, revisions);
		}

		return await buildRevisionComparison(revision, currentVersion, revisions);
	}

	function getVersionFromComposable(
		versionId: string,
		currentVersion?: ContentVersion | null,
		versions?: ContentVersion[] | null,
	): ContentVersion | null {
		if (currentVersion?.id === versionId) {
			return currentVersion;
		}

		if (versions) {
			return versions.find((version) => version.id === versionId) || null;
		}

		return null;
	}

	function getRevisionFromComposable(revisionId: number, revisions?: Revision[] | null): Revision | null {
		if (revisions) {
			return revisions.find((revision) => revision.id === revisionId) || null;
		}

		return null;
	}

	async function fetchRevisionComparison(
		revisionId: number,
		currentVersion?: ContentVersion | null,
		revisions?: Revision[] | null,
	): Promise<ComparisonData> {
		try {
			const response = await api.get(`/revisions/${revisionId}`, {
				params: {
					fields: [
						'id',
						'data',
						'delta',
						'collection',
						'item',
						'activity.action',
						'activity.timestamp',
						'activity.user',
					],
				},
			});

			const revision: RevisionComparisonResponse = response.data.data;

			return await buildRevisionComparison(revision, currentVersion, revisions);
		} catch (error: any) {
			unexpectedError(error);
			throw error;
		}
	}

	async function fetchVersionComparison(
		versionId: string,
		version?: ContentVersion,
		versions?: ContentVersion[] | null,
	): Promise<ComparisonData> {
		try {
			const response = await api.get(`/versions/${versionId}/compare`);
			const data: VersionComparisonResponse = response.data.data;
			const base = data.main || {};
			const incomingMerged = mergeWith({}, base, data.current || {}, replaceArraysInMergeCustomizer);

			const mainVersionMeta = await fetchLatestRevisionActivityOfMainVersion(collection.value, primaryKey.value);

			return {
				base,
				incoming: incomingMerged,
				mainVersionMeta,
				selectableDeltas: versions ?? (version ? [version] : []),
				comparisonType: 'version' as const,
				outdated: data.outdated,
				mainHash: data.mainHash,
				initialSelectedDeltaId: version?.id,
			};
		} catch (error) {
			unexpectedError(error);
			throw error;
		}
	}

	async function fetchLatestRevisionActivityOfMainVersion(collection: string, item: PrimaryKey) {
		try {
			type RevisionResponse = { data: Pick<RevisionPartial, 'activity'>[] };

			const response = await api.get<RevisionResponse>('/revisions', {
				params: {
					filter: {
						_and: [{ collection: { _eq: collection } }, { item: { _eq: item } }, { version: { _null: true } }],
					},
					sort: '-id',
					limit: 1,
					fields: [
						'activity.timestamp',
						'activity.user.id',
						'activity.user.email',
						'activity.user.first_name',
						'activity.user.last_name',
					],
				},
			});

			return response.data.data?.[0]?.activity as ComparisonData['mainVersionMeta'] | undefined;
		} catch (error) {
			unexpectedError(error);
			throw error;
		}
	}

	async function fetchVersionComparisonForRevision(versionId: string) {
		try {
			const response = await api.get(`/versions/${versionId}/compare`);
			const data: VersionComparisonResponse = response.data.data;
			const main = data.main || {};
			const mainMergedWithVersionLatest = mergeWith({}, main, data.current || {}, replaceArraysInMergeCustomizer);

			return {
				main,
				base: mainMergedWithVersionLatest,
			};
		} catch (error) {
			unexpectedError(error);
			throw error;
		}
	}

	async function fetchMainVersion(collection: string, item: PrimaryKey): Promise<Record<string, any>> {
		const endpoint = getEndpoint(collection);
		const itemEndpoint = `${endpoint}/${item}`;

		try {
			const itemResponse = await api.get(itemEndpoint);
			return itemResponse.data?.data || {};
		} catch (error) {
			unexpectedError(error);
			throw error;
		}
	}

	async function buildRevisionComparison(
		revision: Revision | RevisionComparisonResponse,
		currentVersion?: ContentVersion | null,
		revisions?: Revision[] | null,
	): Promise<ComparisonData> {
		let base: Record<string, any> = {};
		let incoming = revision.data || {};
		const activity = revision?.activity;
		const revisionsList = revisions || [];
		const revisionId = 'id' in revision ? revision.id : null;
		const targetCollection = revision.collection || collection.value || '';
		const fields = fieldsStore.getFieldsForCollection(targetCollection);
		const revisionDelta = Object.keys(revision.delta ?? {});
		const revisionFields = new Set(getRevisionFields(revisionDelta, fields));

		if (currentVersion) {
			const versionComparison = await fetchVersionComparisonForRevision(currentVersion.id);
			base = versionComparison.base;
			incoming = mergeWith({}, versionComparison.main, incoming, replaceArraysInMergeCustomizer);
		} else if ('collection' in revision && 'item' in revision) {
			const { collection, item } = revision as { collection: string; item: string | number };
			base = await fetchMainVersion(collection, item);
			const defaultValues = getDefaultValuesFromFields(fields).value;
			incoming = mergeWith({}, defaultValues, incoming, replaceArraysInMergeCustomizer);
		}

		// Revisions do not support relational fields. Therefore, we merge these fields, as well as the primary key, from the base into the incoming object. For date_created and user_created, we populate them from the activity if available.
		const specialFields = applyValuesToSpecialFields(fields, incoming, base, activity);
		incoming = mergeWith({}, incoming, specialFields, replaceArraysInMergeCustomizer);

		return {
			base,
			incoming,
			selectableDeltas: revisionsList,
			revisionFields,
			comparisonType: 'revision',
			outdated: false,
			mainHash: '',
			currentVersion: currentVersion || null,
			initialSelectedDeltaId: revisionId || undefined,
		};
	}

	return {
		selectedComparisonFields,
		userUpdated,
		mainItemUserUpdated,
		mainHash,
		allFieldsSelected,
		someFieldsSelected,
		availableFieldsCount,
		comparisonFields,
		isVersionMode,
		isRevisionMode,
		userLoading,
		mainItemUserLoading,
		baseDisplayName,
		deltaDisplayName,
		normalizedData,
		toggleSelectAll,
		toggleComparisonField,
		fetchUserUpdated,
		fetchMainItemUserUpdated,
		normalizeComparisonData,
	};
}
