<template>
	<div class="metric-list" :class="{ 'has-header': showHeader }">
		<div>
			<v-list class="metric-list">
				<v-list-item
					v-for="row in data.sort((a, b) =>
						sortDirection === 'desc'
							? b[aggregateFunction][aggregateField] - a[aggregateFunction][aggregateField]
							: a[aggregateFunction][aggregateField] - b[aggregateFunction][aggregateField]
					)"
					:key="row['group'][groupByField]"
					class="metric-list-item"
				>
					<div
						class="metric-bar"
						:style="{ width: widthOfRow(row), 'background-color': `${color ? color : '#6644FF'}50` }"
					>
						<div class="metric-bar-text">
							<render-template :item="{[groupByField]: row['group'][groupByField]}" :collection="collection" :template="`{{${groupByField}}}`" />
						</div>

						<div class="metric-bar-number" :style="{ color: `${color ? chroma(color).darken(2).hex() : '#6644FF'}` }">
							{{ prefix }} {{ displayValue(row[aggregateFunction][aggregateField]) }} {{ suffix }}
						</div>
					</div>

					<div class="spacer" />
				</v-list-item>
			</v-list>
		</div>
	</div>
</template>

<script setup lang="ts">
import chroma from 'chroma-js';
import { useI18n } from 'vue-i18n';
import { formatNumber } from '@/utils/format-number';
import type { Style, Notation, Unit } from '@/utils/format-number';

const props = withDefaults(
	defineProps<{
		showHeader?: boolean;
		groupByField?: string;
		aggregateField?: string;
		aggregateFunction?: string;
		sortDirection?: string;
		color?: string;

		notation?: Notation;
		numberStyle?: Style;
		unit?: Unit;
		minimumFractionDigits?: number;
		maximumFractionDigits?: number;

		prefix?: string | null;
		suffix?: string | null;
		collection: string;
		dashboard: string;
		data?: object;
	}>(),
	{
		showHeader: false,
		groupByField: '',
		aggregateField: '',
		aggregateFunction: '',
		sortDirection: 'desc',
		color: '',
		notation: 'standard',
		numberStyle: 'decimal',
		unit: undefined,
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
		prefix: '',
		suffix: '',
		data: () => ({}),
	}
);

const { locale } = useI18n();

function widthOfRow(row: any) {
	const aggFunc = props.aggregateFunction;
	const aggField = props.aggregateField;
	const data = props.data;
	return `${(row[aggFunc][aggField] / Math.max(...data.map((o) => o[aggFunc][aggField]))) * 100 + 0}%`;
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
	});
}


</script>

<style scoped>
.metric-list {
	--v-list-padding: 0;
	--v-list-border-radius: 0;
	--v-list-item-border-radius: 0;
	--v-list-item-padding: 6px;
	--v-list-item-margin: 0;
	height: 100%;
	padding: 0 6px;
	overflow-y: auto;
	overflow-x: hidden;
}
.metric-list-item {
	height: 36px;
	border-bottom: var(--border-width) solid var(--border-subdued);
	/* display: block; */
}

.metric-list-item:last-child {
	border-bottom: 0px;
}

.metric-bar {
	display: flex;
	justify-content: space-between;
	border-radius: 4px;
	padding: 2px;
}

.metric-bar-text {
	padding: 0 6px;
	white-space: pre;
}

.metric-bar-number {
	padding: 0 4px;
	font-weight: 600;
	white-space: pre;
	font-size: 13px;
}
</style>
