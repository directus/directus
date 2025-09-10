import { computed, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { localizedFormat } from '@/utils/localized-format';
import type { ComparisonData, NormalizedComparisonData, NormalizedItem } from '../comparison-utils';
import { normalizeComparisonData } from '../comparison-utils';

interface UseNormalizedComparisonOptions {
	comparisonData: Ref<ComparisonData | null>;
}

export function useNormalizedComparison(options: UseNormalizedComparisonOptions) {
	const { comparisonData } = options;
	const { t } = useI18n();

	// Normalized data for consistent access
	const normalizedData = computed((): NormalizedComparisonData | null => {
		if (!comparisonData.value) return null;
		return normalizeComparisonData(comparisonData.value);
	});

	// Computed properties for easy access to normalized data
	const baseItem = computed((): NormalizedItem | null => {
		return normalizedData.value?.base || null;
	});

	const deltaItem = computed((): NormalizedItem | null => {
		return normalizedData.value?.delta || null;
	});

	const selectableItems = computed((): NormalizedItem[] => {
		return normalizedData.value?.selectableDeltas || [];
	});

	const fieldsWithDifferences = computed((): string[] => {
		return normalizedData.value?.fieldsWithDifferences || [];
	});

	const comparisonType = computed(() => {
		return normalizedData.value?.comparisonType || null;
	});

	const isVersionMode = computed(() => comparisonType.value === 'version');
	const isRevisionMode = computed(() => comparisonType.value === 'revision');

	// Formatted display values
	const baseDisplayName = computed(() => {
		return baseItem.value?.displayName || 'Main';
	});

	const deltaDisplayName = computed(() => {
		return deltaItem.value?.displayName || '';
	});

	const baseDateFormatted = computed(() => {
		const date = baseItem.value?.date.dateObject;
		if (!date) return null;

		const dateStr = localizedFormat(date, String(t('date-fns_date_short')));
		const timeStr = localizedFormat(date, String(t('date-fns_time')));
		return `${dateStr} ${timeStr}`;
	});

	const deltaDateFormatted = computed(() => {
		const date = deltaItem.value?.date.dateObject;
		if (!date) return null;

		const dateStr = localizedFormat(date, String(t('date-fns_date_short')));
		const timeStr = localizedFormat(date, String(t('date-fns_time')));
		return `${dateStr} ${timeStr}`;
	});

	const baseUserDisplayName = computed(() => {
		return baseItem.value?.user?.displayName || t('unknown_user');
	});

	const deltaUserDisplayName = computed(() => {
		return deltaItem.value?.user?.displayName || t('unknown_user');
	});

	// Selectable items for dropdowns
	const selectableOptions = computed(() => {
		return selectableItems.value.map((item) => {
			const date = item.date.dateObject;
			let text = item.displayName;

			if (date) {
				const dateStr = localizedFormat(date, String(t('date-fns_date_short')));
				const timeStr = localizedFormat(date, String(t('date-fns_time')));
				const user = item.user?.displayName || t('unknown_user');
				text = `${dateStr} (${timeStr}) - ${user}`;
			}

			return {
				text,
				value: item.id,
				item,
			};
		});
	});

	const getItemById = (id: string | number): NormalizedItem | null => {
		return selectableItems.value.find((item) => item.id === id) || null;
	};

	const getCurrentItem = (): NormalizedItem | null => {
		return deltaItem.value;
	};

	const getMainItem = (): NormalizedItem | null => {
		return baseItem.value;
	};

	return {
		normalizedData,
		baseItem,
		deltaItem,
		selectableItems,
		fieldsWithDifferences,
		comparisonType,

		isVersionMode,
		isRevisionMode,

		baseDisplayName,
		deltaDisplayName,
		baseDateFormatted,
		deltaDateFormatted,
		baseUserDisplayName,
		deltaUserDisplayName,

		selectableOptions,

		getItemById,
		getCurrentItem,
		getMainItem,
	};
}
