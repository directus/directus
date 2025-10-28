import api from '@/api';
import { useFieldsStore } from '@/stores/fields';
import type { Revision } from '@/types/revisions';
import { getDefaultValuesFromFields } from '@/utils/get-default-values-from-fields';
import { unexpectedError } from '@/utils/unexpected-error';
import type { ContentVersion, PrimaryKey, User } from '@directus/types';
import { getEndpoint } from '@directus/utils';
import { has, mergeWith } from 'lodash';
import { computed, ref, watch, type Ref } from 'vue';
import {
	applyValuesToSpecialFields,
	areAllFieldsSelected,
	areSomeFieldsSelected,
	getNormalizedComparisonData,
	getRevisionFields,
	replaceArraysInMergeCustomizer,
	toggleAllFields,
	toggleFieldInSelection,
	type ComparisonData,
	type NormalizedComparisonData,
	type NormalizedUser,
	type VersionComparisonResponse,
} from '../comparison-utils';

interface UseComparisonOptions {
	collection: Ref<string>;
	primaryKey: Ref<PrimaryKey>;
	mode: Ref<'version' | 'revision'>;
	currentVersion: Ref<ContentVersion | null | undefined>;
	currentRevision: Ref<Revision | null | undefined>;
	revisions: Ref<Revision[] | null | undefined>;
}

export function useComparison(options: UseComparisonOptions) {
	const { collection, primaryKey, mode, currentVersion, currentRevision, revisions } = options;

	const selectedComparisonFields = ref<string[]>([]);
	const userUpdated = ref<User | null>(null);
	const mainItemUserUpdated = ref<User | null>(null);

	const userLoading = ref(false);
	const mainItemUserLoading = ref(false);
	const fieldsStore = useFieldsStore();

	const comparisonData = ref<ComparisonData | null>(null);

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

	async function fetchComparisonData() {
		try {
			if (mode.value === 'version' && currentVersion.value) {
				comparisonData.value = await fetchVersionComparison(currentVersion.value);
			} else if (mode.value === 'revision' && currentRevision.value) {
				comparisonData.value = await buildRevisionComparison(
					currentRevision.value,
					currentVersion.value,
					revisions.value,
				);
			}
		} catch (error) {
			unexpectedError(error);
		}
	}

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

	async function fetchVersionComparison(version: ContentVersion): Promise<ComparisonData> {
		try {
			const response = await api.get(`/versions/${version.id}/compare`);
			const data: VersionComparisonResponse = response.data.data;
			const base = data.main || {};
			const incomingMerged = mergeWith({}, base, data.current || {}, replaceArraysInMergeCustomizer);

			const mainVersionMeta = await fetchLatestRevisionActivityOfMainVersion(collection.value, primaryKey.value);

			return {
				base,
				incoming: incomingMerged,
				mainVersionMeta,
				selectableDeltas: [version],
				comparisonType: 'version',
				outdated: data.outdated,
				mainHash: data.mainHash,
				initialSelectedDeltaId: version.id,
			};
		} catch (error) {
			unexpectedError(error);
			throw error;
		}
	}

	async function fetchLatestRevisionActivityOfMainVersion(collection: string, item: PrimaryKey) {
		try {
			type RevisionResponse = { data: Pick<Revision, 'activity'>[] };

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
		revision: Revision,
		currentVersion: ContentVersion | null | undefined,
		revisions: Revision[] | null | undefined,
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
		comparisonData,
		selectedComparisonFields,
		userUpdated,
		mainItemUserUpdated,
		mainHash,
		allFieldsSelected,
		someFieldsSelected,
		availableFieldsCount,
		comparisonFields,
		userLoading,
		mainItemUserLoading,
		baseDisplayName,
		deltaDisplayName,
		normalizedData,
		toggleSelectAll,
		toggleComparisonField,
		fetchComparisonData,
		fetchUserUpdated,
		fetchMainItemUserUpdated,
	};
}
