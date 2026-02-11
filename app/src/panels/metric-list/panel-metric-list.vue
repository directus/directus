<script setup lang="ts">
import { cssVar } from '@directus/utils/browser';
import { isNil } from 'lodash';
import { computed, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import type { Notation, Style, Unit } from '@/utils/format-number';
import { formatNumber } from '@/utils/format-number';
import RenderTemplate from '@/views/private/components/render-template.vue';

export interface Group {
	[groupByField: string]: string;
}

export interface Aggregate {
	[aggregateFunction: string]: {
		[aggregateField: string]: number;
	};
}

type DataPoint = Aggregate & { group: Group };

const props = withDefaults(
	defineProps<{
		showHeader?: boolean;
		groupByField?: string;
		aggregateField?: string;
		aggregateFunction?: string;
		sortDirection?: string;

		notation?: Notation;
		numberStyle?: Style;
		unit?: Unit;
		prefix?: string | null;
		suffix?: string | null;
		minimumFractionDigits?: number;
		maximumFractionDigits?: number;
		conditionalFormatting?: Record<string, any>[];
		collection: string;
		dashboard: string;
		data?: Array<DataPoint>;
	}>(),
	{
		showHeader: false,
		groupByField: '',
		aggregateField: '',
		aggregateFunction: '',
		sortDirection: 'desc',

		notation: 'standard',
		numberStyle: 'decimal',
		unit: undefined,
		prefix: '',
		suffix: '',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
		conditionalFormatting: () => [],
		data: () => [],
	},
);

const { locale } = useI18n();

const sortedData = computed(() => {
	const dataArray = unref(props.data);

	if (!dataArray || dataArray.length === 0) return [];

	if (!props.aggregateFunction || !props.aggregateField) return dataArray;

	return dataArray.sort((a: DataPoint, b: DataPoint) => {
		const aValue = a[props.aggregateFunction]?.[props.aggregateField] ?? 0;
		const bValue = b[props.aggregateFunction]?.[props.aggregateField] ?? 0;

		if (aValue === undefined || bValue === undefined) return 0;

		return props.sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
	});
});

function widthOfRow(row: any) {
	const aggFunc = props.aggregateFunction;
	const aggField = props.aggregateField;
	const data = props.data;
	return `${(row[aggFunc][aggField] / Math.max(...data.map((o) => o[aggFunc]?.[aggField] ?? 0))) * 100 + 0}%`;
}

function displayValue(value: number) {
	if (value === null || value === undefined) {
		return 0;
	}

	return formatNumber(Number(value), locale.value, {
		notation: props.notation,
		style: props.numberStyle,
		unit: props.unit,
		minimumFractionDigits: props.minimumFractionDigits,
		maximumFractionDigits: props.maximumFractionDigits,
		currency: props.numberStyle === 'currency' ? String(props.unit) : undefined,
	});
}

function getColor(input?: number) {
	if (isNil(input)) return null;

	let matchingFormat = null;

	for (const format of props.conditionalFormatting || []) {
		if (matchesOperator(format)) {
			matchingFormat = format;
		}
	}

	return matchingFormat?.color || cssVar('--theme--primary-subdued');

	function matchesOperator(format: Record<string, any>) {
		if (typeof input === 'string') {
			const value = input;
			const compareValue = format.value ?? '';

			switch (format.operator || '>=') {
				case '=':
					return value === compareValue;
				case '!=':
					return value !== compareValue;
			}
		} else {
			const value = Number(input);
			const compareValue = Number(format.value ?? 0);

			switch (format.operator || '>=') {
				case '=':
					return value === compareValue;
				case '!=':
					return value !== compareValue;
				case '>':
					return value > compareValue;
				case '>=':
					return value >= compareValue;
				case '<':
					return value < compareValue;
				case '<=':
					return value < compareValue;
			}
		}

		return false;
	}
}
</script>

<template>
	<div class="metric-list" :class="{ 'has-header': showHeader }">
		<div>
			<VList class="metric-list">
				<VListItem v-for="row in sortedData" :key="row['group'][groupByField]" class="metric-list-item">
					<div class="metric-row">
						<div class="metric-labels" :style="{ minInlineSize: widthOfRow(row) }">
							<div class="metric-bar-text">
								<RenderTemplate
									:item="{ [groupByField]: row['group'][groupByField] }"
									:collection="collection"
									:template="`{{${groupByField}}}`"
								/>
							</div>

							<div
								class="metric-bar-number"
								:style="{
									color: getColor(row[aggregateFunction]?.[aggregateField]),
								}"
							>
								{{ prefix }}{{ displayValue(row[aggregateFunction]?.[aggregateField] ?? 0) }}{{ suffix }}
							</div>
						</div>

						<div
							v-if="row[aggregateFunction]?.[aggregateField]"
							class="metric-bar-visual"
							:style="{
								inlineSize: widthOfRow(row),
								'background-color': getColor(row[aggregateFunction]?.[aggregateField]),
							}"
						/>
					</div>
				</VListItem>
			</VList>
		</div>
	</div>
</template>

<style scoped>
.metric-list {
	--v-list-padding: 0;
	--v-list-border-radius: 0;
	--v-list-item-border-radius: 0;
	--v-list-item-padding: 6px;
	--v-list-item-margin: 0;
	block-size: 100%;
	padding: 6px;
	overflow: hidden auto;
}

.metric-list-item {
	border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);
}

.metric-list-item:last-child {
	border-block-end: 0;
}

.metric-row {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 4px;
	inline-size: 100%;
	padding-block: 4px;
}

.metric-labels {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 8px;
	min-inline-size: max-content;
}

.metric-bar-visual {
	block-size: 20px;
	border-radius: 6px;
}

.metric-bar-text {
	white-space: pre;
	overflow: hidden;
	text-overflow: ellipsis;
	font-size: 14px;
}

.metric-bar-number {
	font-weight: 600;
	white-space: pre;
	font-size: 14px;
	flex-shrink: 0;
}
</style>
