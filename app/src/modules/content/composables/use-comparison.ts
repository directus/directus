import { ContentVersion, User } from '@directus/types';
import { Revision } from '@/types/revisions';
import { computed, ref, watch, type Ref } from 'vue';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import type { ComparisonData, VersionComparisonResponse, RevisionComparisonResponse } from '../comparison-utils';
import {
	getFieldsWithDifferences,
	getVersionDisplayName,
	getRevisionDisplayName,
	getVersionUserId,
	getRevisionUserId,
	getVersionDate,
	getMainItemDate,
	getMainItemUserId,
	toggleFieldInSelection,
	toggleAllFields,
	areAllFieldsSelected,
	areSomeFieldsSelected,
} from '../comparison-utils';

interface UseComparisonOptions {
	comparisonData: Ref<ComparisonData | null>;
}

export function useComparison(options: UseComparisonOptions) {
	const { comparisonData } = options;
	const selectedComparisonFields = ref<string[]>([]);
	const userUpdated = ref<User | null>(null);
	const mainItemUserUpdated = ref<User | null>(null);

	const userLoading = ref(false);
	const mainItemUserLoading = ref(false);

	const isVersionMode = computed(() => comparisonData.value?.comparisonType === 'version');
	const isRevisionMode = computed(() => comparisonData.value?.comparisonType === 'revision');

	const currentItem = computed(() => {
		if (isVersionMode.value) {
			return comparisonData.value?.selectableDeltas?.[0] as ContentVersion;
		} else if (isRevisionMode.value) {
			return comparisonData.value?.selectableDeltas?.[0] as Revision;
		}

		return null;
	});

	const revisionDateCreated = computed(() => {
		if (!currentItem.value) return null;
		const ts = (currentItem.value as Revision)?.activity?.timestamp;
		return ts ? new Date(ts) : null;
	});

	const currentVersionDisplayName = computed(() => {
		if (isVersionMode.value && currentItem.value) {
			return getVersionDisplayName(currentItem.value as ContentVersion);
		} else if (isRevisionMode.value && currentItem.value) {
			return getRevisionDisplayName(currentItem.value as Revision);
		}

		return '';
	});

	const mainHash = computed(() => comparisonData.value?.mainHash ?? '');

	const versionDateUpdated = computed(() => {
		if (isVersionMode.value && currentItem.value) {
			return getVersionDate(currentItem.value as ContentVersion);
		}

		return null;
	});

	const mainItemDateUpdated = computed(() => {
		if (!comparisonData.value?.base) return null;
		return getMainItemDate(comparisonData.value.base);
	});

	const fieldsWithDifferences = computed(() => {
		if (!comparisonData.value) return [];

		const normalizedComparison = {
			outdated: comparisonData.value.outdated || false,
			mainHash: comparisonData.value.mainHash || '',
			current: comparisonData.value.delta,
			main: comparisonData.value.base,
		};

		return getFieldsWithDifferences(normalizedComparison);
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

	async function fetchUserUpdated() {
		let userId: string | null = null;

		if (isVersionMode.value && currentItem.value) {
			userId = getVersionUserId(currentItem.value as ContentVersion);
		} else if (isRevisionMode.value && currentItem.value) {
			userId = getRevisionUserId(currentItem.value as Revision);
		}

		if (!userId) return;

		userLoading.value = true;

		try {
			const response = await api.get(`/users/${userId}`, {
				params: {
					fields: ['id', 'first_name', 'last_name', 'email'],
				},
			});

			userUpdated.value = response.data.data;
		} catch (error) {
			unexpectedError(error);
		} finally {
			userLoading.value = false;
		}
	}

	async function fetchMainItemUserUpdated() {
		if (!comparisonData.value?.base) return;

		const userField = getMainItemUserId(comparisonData.value.base);

		if (!userField) return;

		mainItemUserLoading.value = true;

		try {
			const response = await api.get(`/users/${userField}`, {
				params: {
					fields: ['id', 'first_name', 'last_name', 'email'],
				},
			});

			mainItemUserUpdated.value = response.data.data;
		} catch (error) {
			unexpectedError(error);
		} finally {
			mainItemUserLoading.value = false;
		}
	}

	// Data fetching functions from normalize-comparison-data.ts
	async function normalizeComparisonData(
		id: string,
		type: 'version' | 'revision',
		currentVersion?: Ref<ContentVersion | null>,
		versions?: Ref<ContentVersion[] | null>,
		revisions?: Ref<Revision[] | null>,
	): Promise<ComparisonData> {
		if (type === 'version') {
			return await normalizeVersionComparison(id, currentVersion, versions);
		} else {
			return await normalizeRevisionComparison(id, currentVersion, revisions);
		}
	}

	async function normalizeVersionComparison(
		versionId: string,
		currentVersion?: Ref<ContentVersion | null>,
		versions?: Ref<ContentVersion[] | null>,
	): Promise<ComparisonData> {
		const version = getVersionFromComposable(versionId, currentVersion, versions);

		if (!version) {
			return await fetchVersionComparison(versionId, undefined, versions);
		}

		return await fetchVersionComparison(version.id, version, versions);
	}

	async function normalizeRevisionComparison(
		revisionId: string,
		currentVersion?: Ref<ContentVersion | null>,
		revisions?: Ref<Revision[] | null>,
	): Promise<ComparisonData> {
		const revision = getRevisionFromComposable(revisionId, revisions);

		if (!revision) {
			return await fetchRevisionComparison(revisionId, currentVersion, revisions);
		}

		return await buildRevisionComparison(revision, currentVersion, revisions);
	}

	function getVersionFromComposable(
		versionId: string,
		currentVersion?: Ref<ContentVersion | null>,
		versions?: Ref<ContentVersion[] | null>,
	): ContentVersion | null {
		if (currentVersion?.value && currentVersion.value.id === versionId) {
			return currentVersion.value;
		}

		if (versions?.value) {
			return versions.value.find((version) => version.id === versionId) || null;
		}

		return null;
	}

	function getRevisionFromComposable(revisionId: string, revisions?: Ref<Revision[] | null>): Revision | null {
		if (revisions?.value) {
			return revisions.value.find((revision) => revision.id === parseInt(revisionId)) || null;
		}

		return null;
	}

	async function fetchVersionComparison(
		versionId: string,
		version?: ContentVersion,
		versions?: Ref<ContentVersion[] | null>,
	): Promise<ComparisonData> {
		try {
			const response = await api.get(`/versions/${versionId}/compare`);
			const data: VersionComparisonResponse = response.data.data;

			// data.main is the complete main item (this should be the base/left side)
			// data.current contains the version's changes (this should be the delta/right side)
			const base = data.main;
			const delta = data.current;

			return {
				base,
				delta,
				selectableDeltas: versions?.value ?? (version ? [version] : []),
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

	async function fetchRevisionComparison(
		revisionId: string,
		currentVersion?: Ref<ContentVersion | null>,
		revisions?: Ref<Revision[] | null>,
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
		} catch (error) {
			unexpectedError(error);
			throw error;
		}
	}

	/**
	 * Builds comparison data from revision data
	 * - base: the complete item state BEFORE this revision was applied
	 * - delta: the complete item state AFTER this revision was applied
	 */
	async function buildRevisionComparison(
		revision: Revision | RevisionComparisonResponse,
		currentVersion?: Ref<ContentVersion | null>,
		revisions?: Ref<Revision[] | null>,
	): Promise<ComparisonData> {
		const revisionData = revision.data || {};

		let base: Record<string, any>;

		const revisionsList = revisions?.value || [];

		const revisionId = 'id' in revision ? revision.id : null;
		const currentRevisionIndex = revisionId ? revisionsList.findIndex((r) => r.id === revisionId) : -1;

		if (currentRevisionIndex > 0) {
			// Use the previous revision's data as the base (state before this revision)
			const previousRevision = revisionsList[currentRevisionIndex - 1];
			base = previousRevision?.data || {};

			// Add timestamp information to the base data for proper display
			if (previousRevision?.activity?.timestamp) {
				base = {
					...base,
					date_updated: previousRevision.activity.timestamp,
				};
			}
		} else {
			// This is the first revision, so we need to get the original item state
			if (currentVersion?.value) {
				const versionComparison = await fetchVersionComparison(currentVersion.value.id);
				base = versionComparison.base;
			} else {
				throw new Error('Cannot build revision comparison: no current version available');
			}
		}

		const delta = revisionData;

		return {
			base,
			delta,
			selectableDeltas: revisionsList,
			comparisonType: 'revision',
			outdated: false,
			mainHash: '',
			currentVersion: currentVersion?.value || null,
			initialSelectedDeltaId: revisionId || undefined,
		};
	}

	return {
		selectedComparisonFields,
		userUpdated,
		mainItemUserUpdated,
		currentVersionDisplayName,
		mainHash,
		versionDateUpdated,
		mainItemDateUpdated,
		fieldsWithDifferences,
		allFieldsSelected,
		someFieldsSelected,
		availableFieldsCount,
		comparisonFields,
		isVersionMode,
		isRevisionMode,
		currentItem,
		revisionDateCreated,
		userLoading,
		mainItemUserLoading,
		toggleSelectAll,
		toggleComparisonField,
		fetchUserUpdated,
		fetchMainItemUserUpdated,
		normalizeComparisonData,
		normalizeVersionComparison,
		normalizeRevisionComparison,
		fetchVersionComparison,
		fetchRevisionComparison,
		buildRevisionComparison,
	};
}
