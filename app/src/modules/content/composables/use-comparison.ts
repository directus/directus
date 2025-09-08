import { ContentVersion, User } from '@directus/types';
import { Revision } from '@/types/revisions';
import { computed, ref, type Ref } from 'vue';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import {
	type NormalizedComparison,
	getFieldsWithDifferences,
	getVersionDisplayName,
	getRevisionDisplayName,
	getVersionUserId,
	getRevisionUserId,
	getVersionDate,
	getMainItemDate,
	getMainItemUserId,
	addFieldToSelection,
	removeFieldFromSelection,
	toggleFieldInSelection,
	toggleAllFields,
	createRevisionComparison,
	areAllFieldsSelected,
	areSomeFieldsSelected,
} from '../comparison-utils';

interface UseComparisonOptions {
	currentVersion?: Ref<ContentVersion | undefined>;
	selectedRevision?: Ref<number | undefined>;
	revisions?: Ref<Revision[] | undefined>;
	comparisonType?: Ref<'version' | 'revision' | undefined>;
}

export function useComparison(options: UseComparisonOptions) {
	const { currentVersion, selectedRevision, revisions, comparisonType } = options;
	const selectedComparisonFields = ref<string[]>([]);
	const comparedData = ref<NormalizedComparison | null>(null);
	const userUpdated = ref<User | null>(null);
	const mainItemUserUpdated = ref<User | null>(null);

	// Loading states
	const loading = ref(false);
	const userLoading = ref(false);
	const mainItemUserLoading = ref(false);

	const isVersionMode = computed(() => comparisonType?.value === 'version');
	const isRevisionMode = computed(() => comparisonType?.value === 'revision');

	const currentRevision = computed(() => revisions?.value?.find((r) => r.id === selectedRevision?.value) as Revision);

	const previousRevision = computed(() =>
		selectedRevision?.value
			? (revisions?.value?.find((r) => r.id === selectedRevision.value! - 1) as Revision)
			: undefined,
	);

	const currentItem = computed(() => (isVersionMode.value ? currentVersion?.value : currentRevision.value));

	const revisionDateCreated = computed(() => {
		if (!currentItem.value) return null;
		const ts = (currentItem.value as Revision)?.activity?.timestamp;
		return ts ? new Date(ts) : null;
	});

	const currentVersionDisplayName = computed(() => {
		if (isVersionMode.value && currentVersion?.value) {
			return getVersionDisplayName(currentVersion.value);
		} else if (isRevisionMode.value && currentRevision.value) {
			return getRevisionDisplayName(currentRevision.value);
		}

		return '';
	});

	const mainHash = computed(() => comparedData.value?.mainHash ?? '');

	const versionDateUpdated = computed(() => {
		if (isVersionMode.value && currentVersion?.value) {
			return getVersionDate(currentVersion.value);
		}

		return null;
	});

	const mainItemDateUpdated = computed(() => {
		if (!comparedData.value?.main) return null;
		return getMainItemDate(comparedData.value.main);
	});

	const fieldsWithDifferences = computed(() => {
		if (!comparedData.value) return [];
		return getFieldsWithDifferences(comparedData.value);
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

	function addField(field: string) {
		selectedComparisonFields.value = addFieldToSelection(selectedComparisonFields.value, field);
	}

	function removeField(field: string) {
		selectedComparisonFields.value = removeFieldFromSelection(selectedComparisonFields.value, field);
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

	async function getComparison() {
		loading.value = true;

		try {
			if (currentVersion?.value) {
				const result = await api.get(`/versions/${currentVersion.value.id}/compare`).then((res) => res.data.data);
				comparedData.value = result as NormalizedComparison;
			}

			if (isRevisionMode.value && currentRevision.value) {
				const mainItem = await api
					.get(`/items/${currentRevision.value.collection}/${currentRevision.value.item}`)
					.then((res) => res.data.data);

				let baselineLeft: Record<string, any> = mainItem;

				if (currentVersion?.value) {
					try {
						const versionCompare = await api
							.get(`/versions/${currentVersion.value.id}/compare`)
							.then((res) => res.data.data as NormalizedComparison);

						// Use the computed current version view as the baseline
						baselineLeft = versionCompare.current || baselineLeft;
					} catch {
						// fallback to mainItem if version compare fails
						baselineLeft = mainItem;
					}
				}

				comparedData.value = createRevisionComparison(baselineLeft, currentRevision.value, previousRevision.value);
			}

			if (comparedData.value) {
				selectedComparisonFields.value = getFieldsWithDifferences(comparedData.value);
			}

			await fetchMainItemUserUpdated();
		} catch (error) {
			unexpectedError(error);
		} finally {
			loading.value = false;
		}
	}

	async function fetchUserUpdated() {
		let userId: string | null = null;

		if (isVersionMode.value && currentVersion?.value) {
			userId = getVersionUserId(currentVersion.value);
		} else if (isRevisionMode.value && currentRevision.value) {
			userId = getRevisionUserId(currentRevision.value);
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
		if (!comparedData.value?.main) return;

		const userField = getMainItemUserId(comparedData.value.main);

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

	return {
		selectedComparisonFields,
		comparedData,
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
		currentRevision,
		previousRevision,
		currentItem,
		revisionDateCreated,
		loading,
		userLoading,
		mainItemUserLoading,
		addField,
		removeField,
		toggleSelectAll,
		toggleComparisonField,
		getComparison,
		fetchUserUpdated,
		fetchMainItemUserUpdated,
	};
}
