import { ContentVersion, User } from '@directus/types';
import { Revision } from '@/types/revisions';
import { computed, ref, watch, type Ref } from 'vue';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import type {
	ComparisonData,
	VersionComparisonResponse,
	RevisionComparisonResponse,
	NormalizedComparisonData,
} from '../comparison-utils';
import {
	toggleFieldInSelection,
	toggleAllFields,
	areAllFieldsSelected,
	areSomeFieldsSelected,
	normalizeComparisonData as normalizeComparisonDataUtil,
} from '../comparison-utils';
import { mergeWith } from 'lodash';

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

	const normalizedData = computed((): NormalizedComparisonData | null => {
		if (!comparisonData.value) return null;
		return normalizeComparisonDataUtil(comparisonData.value);
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
		return normalizedData.value?.main?.displayName || 'Main';
	});

	const deltaDisplayName = computed(() => {
		return normalizedData.value?.current?.displayName || '';
	});

	const isLatestRevision = ref(false);
	const latestRevisionLoading = ref(false);

	async function checkIfLatestRevision() {
		if (!isRevisionMode.value || !comparisonData.value) {
			isLatestRevision.value = false;
			return;
		}

		const initialSelectedId = comparisonData.value.initialSelectedDeltaId;
		const selectableDeltas = comparisonData.value.selectableDeltas;

		if (!initialSelectedId || !selectableDeltas?.length) {
			isLatestRevision.value = false;
			return;
		}

		const firstRevision = selectableDeltas[0];

		if (!firstRevision || !('collection' in firstRevision) || !('item' in firstRevision)) {
			isLatestRevision.value = false;
			return;
		}

		const collection = firstRevision.collection;
		const item = firstRevision.item;

		latestRevisionLoading.value = true;

		try {
			const response = await api.get('/revisions', {
				params: {
					filter: {
						collection: {
							_eq: collection,
						},
						item: {
							_eq: item,
						},
					},
					sort: '-id',
					limit: 1,
					fields: ['id', 'activity.timestamp'],
				},
			});

			const latestRevision = response.data.data?.[0];

			if (!latestRevision) {
				isLatestRevision.value = false;
				return;
			}

			isLatestRevision.value = latestRevision.id === initialSelectedId;
		} catch (error) {
			unexpectedError(error);
			isLatestRevision.value = false;
		} finally {
			latestRevisionLoading.value = false;
		}
	}

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

	watch(
		comparisonData,
		(newData) => {
			if (newData && isRevisionMode.value) {
				checkIfLatestRevision();
			} else {
				isLatestRevision.value = false;
			}
		},
		{ immediate: true, deep: true },
	);

	watch(
		() => comparisonData.value?.initialSelectedDeltaId,
		(newId) => {
			if (newId && isRevisionMode.value) {
				checkIfLatestRevision();
			}
		},
		{ immediate: true },
	);

	async function fetchUserUpdated() {
		const normalized = normalizedData.value;
		if (!normalized?.current.user?.id) return;

		userLoading.value = true;

		try {
			const response = await api.get(`/users/${normalized.current.user.id}`, {
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
		const normalized = normalizedData.value;
		if (!normalized?.main.user?.id) return;

		mainItemUserLoading.value = true;

		try {
			const response = await api.get(`/users/${normalized.main.user.id}`, {
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

			return {
				main: data.main,
				current: data.current,
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
	 * - main: complete item state BEFORE this revision was applied
	 * - current: complete item state AFTER this revision was applied
	 */
	async function buildRevisionComparison(
		revision: Revision | RevisionComparisonResponse,
		currentVersion?: Ref<ContentVersion | null>,
		revisions?: Ref<Revision[] | null>,
	): Promise<ComparisonData> {
		const revisionData = revision.data || {};

		const revisionsList = revisions?.value || [];
		const revisionId = 'id' in revision ? revision.id : null;
		const currentRevisionIndex = revisionId ? revisionsList.findIndex((r) => r.id === revisionId) : -1;
		const previousRevision = currentRevisionIndex > 0 ? revisionsList[currentRevisionIndex - 1] : null;

		// Resolve main item and current version delta
		let mainItem: Record<string, any> = {};
		let versionDelta: Record<string, any> = {};

		if (currentVersion?.value) {
			const versionComparison = await fetchVersionComparison(currentVersion.value.id);
			mainItem = versionComparison.main || {};
			versionDelta = versionComparison.current || {};
		} else if ('collection' in revision && 'item' in revision) {
			try {
				const { collection, item } = revision as { collection: string; item: string | number };
				const itemResponse = await api.get(`/items/${collection}/${item}`);
				mainItem = itemResponse.data?.data || {};
			} catch (error) {
				unexpectedError(error);
				mainItem = {};
			}
		}

		const replaceArrays = (objValue: any, srcValue: any) => {
			if (Array.isArray(objValue) || Array.isArray(srcValue)) {
				return srcValue;
			}

			return undefined;
		};

		const deltaMerged = mergeWith({}, mainItem, versionDelta, previousRevision?.data || {}, replaceArrays);

		if (previousRevision?.activity?.timestamp) {
			deltaMerged.date_updated = previousRevision.activity.timestamp;
		}

		const mainMerged = mergeWith({}, mainItem, versionDelta, revisionData, replaceArrays);

		if ('activity' in revision && (revision as any)?.activity?.timestamp) {
			mainMerged.date_updated = (revision as any).activity.timestamp;
		}

		return {
			main: mainMerged,
			current: deltaMerged,
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
		mainHash,
		allFieldsSelected,
		someFieldsSelected,
		availableFieldsCount,
		comparisonFields,
		isVersionMode,
		isRevisionMode,
		isLatestRevision,
		latestRevisionLoading,
		userLoading,
		mainItemUserLoading,
		baseDisplayName,
		deltaDisplayName,
		normalizedData,
		toggleSelectAll,
		toggleComparisonField,
		fetchUserUpdated,
		fetchMainItemUserUpdated,
		checkIfLatestRevision,
		normalizeComparisonData,
	};
}
