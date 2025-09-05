import { ContentVersion, User } from '@directus/types';
import { Revision } from '@/types/revisions';
import { isNil, isEqual } from 'lodash';
import { computed, ref, type Ref } from 'vue';

type Comparison = {
	outdated: boolean;
	mainHash: string;
	current: Record<string, any>;
	main: Record<string, any>;
};

export function useComparison(currentVersion: Ref<ContentVersion>) {
	const selectedComparisonFields = ref<string[]>([]);
	const comparedData = ref<Comparison | null>(null);
	const userUpdated = ref<User | null>(null);
	const mainItemUserUpdated = ref<User | null>(null);

	const currentVersionDisplayName = computed(() =>
		isNil(currentVersion.value.name) ? currentVersion.value.key : currentVersion.value.name,
	);

	const mainHash = computed(() => comparedData.value?.mainHash ?? '');

	const versionDateUpdated = computed(() => {
		if (!currentVersion.value.date_updated) return null;
		return new Date(currentVersion.value.date_updated);
	});

	const mainItemDateUpdated = computed(() => {
		if (!comparedData.value?.main) return null;

		const dateField =
			comparedData.value.main.date_updated || comparedData.value.main.modified_on || comparedData.value.main.updated_on;

		if (!dateField) return null;
		return new Date(dateField);
	});

	const fieldsWithDifferences = computed(() => {
		if (!comparedData.value) return [];
		return getFieldsWithDifferences(comparedData.value);
	});

	const allFieldsSelected = computed(() => {
		const availableFields = fieldsWithDifferences.value;
		return (
			availableFields.length > 0 && availableFields.every((field) => selectedComparisonFields.value.includes(field))
		);
	});

	const someFieldsSelected = computed(() => {
		const availableFields = fieldsWithDifferences.value;
		return (
			availableFields.length > 0 && availableFields.some((field) => selectedComparisonFields.value.includes(field))
		);
	});

	const availableFieldsCount = computed(() => {
		return fieldsWithDifferences.value.length;
	});

	const comparisonFields = computed(() => {
		return new Set(fieldsWithDifferences.value);
	});

	function getFieldsWithDifferences(comparedData: Comparison): string[] {
		return Object.keys(comparedData.current).filter((fieldKey) => {
			const versionValue = comparedData.current[fieldKey];
			const mainValue = comparedData.main[fieldKey];
			return !isEqual(versionValue, mainValue);
		});
	}

	function addField(field: string) {
		selectedComparisonFields.value = [...selectedComparisonFields.value, field];
	}

	function removeField(field: string) {
		selectedComparisonFields.value = selectedComparisonFields.value.filter((f: string) => f !== field);
	}

	function toggleSelectAll() {
		const availableFields = fieldsWithDifferences.value;

		if (allFieldsSelected.value) {
			selectedComparisonFields.value = [];
		} else {
			selectedComparisonFields.value = [...new Set([...selectedComparisonFields.value, ...availableFields])];
		}
	}

	function toggleComparisonField(fieldKey: string) {
		if (selectedComparisonFields.value.includes(fieldKey)) {
			removeField(fieldKey);
		} else {
			addField(fieldKey);
		}
	}

	function normalizeComparisonData(comparisonData: ContentVersion | Revision, comparisonType: 'version' | 'revision') {
		const normalizedData = {};

		if (comparisonType === 'version') {
			// normalize the version data
		} else if (comparisonType === 'revision') {
			// normalize the revision data
		} else {
			throw new Error('Invalid comparison type');
		}

		// return the comparison data with the fields normalized
		return normalizedData;
	}

	return {
		selectedComparisonFields,
		comparedData,
		userUpdated,
		mainItemUserUpdated,
		normalizeComparisonData,
		currentVersionDisplayName,
		mainHash,
		versionDateUpdated,
		mainItemDateUpdated,
		fieldsWithDifferences,
		allFieldsSelected,
		someFieldsSelected,
		availableFieldsCount,
		comparisonFields,

		getFieldsWithDifferences,
		addField,
		removeField,
		toggleSelectAll,
		toggleComparisonField,
	};
}
