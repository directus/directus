import { ContentVersion, User } from '@directus/types';
import { Revision } from '@/types/revisions';
import { computed, ref, watch, type Ref } from 'vue';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';
import type { ComparisonData } from '../normalize-comparison-data';
import {
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
		addField,
		removeField,
		toggleSelectAll,
		toggleComparisonField,
		fetchUserUpdated,
		fetchMainItemUserUpdated,
	};
}
