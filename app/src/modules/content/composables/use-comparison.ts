import api from '@/api';
import { useFieldsStore } from '@/stores/fields';
import type { Revision } from '@/types/revisions';
import { unexpectedError } from '@/utils/unexpected-error';
import { isSystemCollection } from '@directus/system-data';
import type { ContentVersion, User } from '@directus/types';
import {
	toggleFieldInSelection,
	toggleAllFields,
	areAllFieldsSelected,
	areSomeFieldsSelected,
	normalizeComparisonData as normalizeComparisonDataUtil,
	mergeMainItemKeysIntoRevision,
	copyRelationalFieldsFromBaseToIncoming,
	replaceArraysInMergeCustomizer,
	getSystemCollectionItemUrl,
	type ComparisonData,
	type VersionComparisonResponse,
	type RevisionComparisonResponse,
	type NormalizedComparisonData,
} from '../comparison-utils';
import { mergeWith } from 'lodash';
import { computed, ref, watch, type Ref } from 'vue';

interface UseComparisonOptions {
	comparisonData: Ref<ComparisonData | null>;
	collection?: Ref<string>;
}

export function useComparison(options: UseComparisonOptions) {
	const { comparisonData, collection } = options;
	const selectedComparisonFields = ref<string[]>([]);
	const userUpdated = ref<User | null>(null);
	const mainItemUserUpdated = ref<User | null>(null);

	const userLoading = ref(false);
	const mainItemUserLoading = ref(false);
	const fieldsStore = useFieldsStore();

	const isVersionMode = computed(() => comparisonData.value?.comparisonType === 'version');
	const isRevisionMode = computed(() => comparisonData.value?.comparisonType === 'revision');

	const normalizedData = computed((): NormalizedComparisonData | null => {
		if (!comparisonData.value) return null;

		let fieldMetadata: Record<string, any> | undefined;

		if (collection?.value) {
			const collectionFields = fieldsStore.getFieldsForCollection(collection.value);
			fieldMetadata = Object.fromEntries(collectionFields.map((field) => [field.field, field]));
		}

		return normalizeComparisonDataUtil(comparisonData.value, fieldMetadata);
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
		return normalizedData.value?.base?.displayName || 'Current';
	});

	const deltaDisplayName = computed(() => {
		return normalizedData.value?.incoming?.displayName || '';
	});

	function debugComparison(label?: string) {
		const normalized = normalizedData.value;

		let mode = 'unknown';

		if (isRevisionMode.value) {
			mode = 'revision';
		} else if (isVersionMode.value) {
			mode = 'version';
		}

		const fields = fieldsWithDifferences.value || [];
		const selected = selectedComparisonFields.value || [];

		const header = label ? `Comparison Debug: ${label}` : 'Comparison Debug';

		// eslint-disable-next-line no-console
		console.groupCollapsed(header);

		try {
			// eslint-disable-next-line no-console
			console.info('Mode:', mode);
			// eslint-disable-next-line no-console
			console.info('Available fields with differences (%d):', fields.length, fields);
			// eslint-disable-next-line no-console
			console.info('Selected fields (%d):', selected.length, selected);

			if (normalized) {
				// eslint-disable-next-line no-console
				console.info('Base item:', normalized.base);
				// eslint-disable-next-line no-console
				console.info('Incoming item:', normalized.incoming);
			} else {
				// eslint-disable-next-line no-console
				console.warn('No normalized data available');
			}

			if (comparisonData.value?.comparisonType === 'revision') {
				const selectedId = normalized?.initialSelectedDeltaId ?? null;

				const revisions = (comparisonData.value.selectableDeltas as Revision[]) || [];

				const matching =
					typeof selectedId !== 'undefined' && selectedId !== null
						? revisions.find((r) => r && 'id' in r && r.id === selectedId)
						: revisions[0];

				if (matching) {
					// eslint-disable-next-line no-console
					console.info('Revision (from drawer list):', matching);
				} else {
					// eslint-disable-next-line no-console
					console.warn('No matching revision found for selectedId:', selectedId);
				}

				// Provide a quick diff map for changed fields

				const diffPreview: Record<string, { base: any; incoming: any }> = {};

				for (const key of fields) {
					diffPreview[key] = {
						base: (comparisonData.value.base as any)?.[key],
						incoming: (comparisonData.value.incoming as any)?.[key],
					};
				}

				// eslint-disable-next-line no-console
				console.info('Field diffs preview:', diffPreview);
			}
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Error in debugComparison:', error);
		} finally {
			// eslint-disable-next-line no-console
			console.groupEnd();
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

	async function fetchUserUpdated() {
		const normalized = normalizedData.value;
		if (!normalized?.incoming?.user?.id) return;

		userLoading.value = true;

		try {
			const response = await api.get(`/users/${normalized.incoming.user.id}`, {
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
		if (!normalized?.base.user?.id) return;

		mainItemUserLoading.value = true;

		try {
			const response = await api.get(`/users/${normalized.base.user.id}`, {
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
		type: 'version',
		currentVersion?: ContentVersion | null,
		versions?: Ref<ContentVersion[] | null>,
		revisions?: Revision[] | null,
	): Promise<ComparisonData>;
	async function normalizeComparisonData(
		id: number,
		type: 'revision',
		currentVersion?: ContentVersion | null,
		versions?: Ref<ContentVersion[] | null>,
		revisions?: Revision[] | null,
	): Promise<ComparisonData>;
	async function normalizeComparisonData(
		id: string | number,
		type: 'version' | 'revision',
		currentVersion?: ContentVersion | null,
		versions?: Ref<ContentVersion[] | null>,
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
		versions?: Ref<ContentVersion[] | null>,
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
		versions?: Ref<ContentVersion[] | null>,
	): ContentVersion | null {
		if (currentVersion?.id === versionId) {
			return currentVersion;
		}

		if (versions?.value) {
			return versions.value.find((version) => version.id === versionId) || null;
		}

		return null;
	}

	function getRevisionFromComposable(revisionId: number, revisions?: Revision[] | null): Revision | null {
		if (revisions) {
			return revisions.find((revision) => revision.id === revisionId) || null;
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
			const base = data.main || {};
			const incomingMerged = mergeWith({}, base, data.current || {}, replaceArraysInMergeCustomizer);

			return {
				base,
				incoming: incomingMerged,
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

	/**
	 * Builds comparison data from revision data
	 * - main: complete item state BEFORE this revision was applied
	 * - current: complete item state AFTER this revision was applied
	 */
	async function buildRevisionComparison(
		revision: Revision | RevisionComparisonResponse,
		currentVersion?: ContentVersion | null,
		revisions?: Revision[] | null,
	): Promise<ComparisonData> {
		// Resolve main item and current version delta
		let mainItem: Record<string, any> = {};
		let versionDelta: Record<string, any> = {};

		if (currentVersion) {
			const versionComparison = await fetchVersionComparison(currentVersion.id);
			mainItem = versionComparison.base || {};
			versionDelta = versionComparison.incoming || {};
		} else if ('collection' in revision && 'item' in revision) {
			const { collection, item } = revision as { collection: string; item: string | number };

			const isSystem = isSystemCollection(collection);

			if (isSystem) {
				const systemEndpoint = getSystemCollectionItemUrl(collection, item);

				if (systemEndpoint) {
					try {
						const itemResponse = await api.get(systemEndpoint);
						mainItem = itemResponse.data?.data || {};
					} catch {
						mainItem = {};
					}
				} else {
					mainItem = {};
				}
			} else {
				try {
					const itemResponse = await api.get(`/items/${collection}/${item}`);
					mainItem = itemResponse.data?.data || {};
				} catch (error: any) {
					unexpectedError(error);
					mainItem = {};
				}
			}
		}

		const baseMerged = mergeWith({}, mainItem, versionDelta || {}, replaceArraysInMergeCustomizer);

		const targetCollection = revision.collection || collection?.value || '';
		const fields = fieldsStore.getFieldsForCollection(targetCollection);

		// Merge main item keys into revision data with default values for missing fields
		const revisionData = revision.data || {};
		const revisionDataWithDefaults = mergeMainItemKeysIntoRevision(revisionData, baseMerged, fields);
		const incomingMerged = mergeWith({}, revisionDataWithDefaults, replaceArraysInMergeCustomizer);

		if ('activity' in revision && (revision as any)?.activity?.timestamp) {
			incomingMerged.date_updated = (revision as any).activity.timestamp;
		}

		const incomingWithRelationalFields = copyRelationalFieldsFromBaseToIncoming(baseMerged, incomingMerged, fields);
		const revisionsList = revisions || [];
		const revisionId = 'id' in revision ? revision.id : null;

		return {
			base: baseMerged,
			incoming: incomingWithRelationalFields,
			selectableDeltas: revisionsList,
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
		debugComparison,
		toggleSelectAll,
		toggleComparisonField,
		fetchUserUpdated,
		fetchMainItemUserUpdated,
		normalizeComparisonData,
	};
}
