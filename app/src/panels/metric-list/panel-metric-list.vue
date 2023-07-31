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

const props = withDefaults(
	defineProps<{
		showHeader?: boolean;
		groupByField?: string;
		aggregateField?: string;
		aggregateFunction?: string;
		sortDirection?: string;
		color?: string;
		notation?: string;
		style?: string;
		unit?: string;
		decimals?: number;
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
		style: 'decimal',
		unit: '',
		decimals: 0,
		prefix: '',
		suffix: '',
		data: () => ({}),
	}
);

// This needs to use in18 but I was having trouble importing the package and using the n() function

const { n, locale } = useI18n();

function round(n, r) {
    let int = Math.floor(n).toString()
    if (int[0] == '-' || int[0] == '+') int = int.slice(int[1], int.length)
    return n.toPrecision(int.length + r)
}

function widthOfRow(row) {
	const aggFunc = props.aggregateFunction;
	const aggField = props.aggregateField;
	const data = props.data;
	return `${(row[aggFunc][aggField] / Math.max(...data.map((o) => o[aggFunc][aggField]))) * 100 + 0}%`;
}

function displayValue(value) {
	if (value === null || value === undefined) {
		return 0;
	}

	let formatOptions = {
		notation: props.notation,
		minimumFractionDigits: props.decimals ?? 0,
		maximumFractionDigits: props.decimals ?? 0,
		style: props.format,
	}

	if(props.style == 'unit'){
		return new Intl.NumberFormat(locale.value, {...formatOptions, unit: props.unit}).format(Number(value));
	} else {
		return n(Number(value), props.style, formatOptions);
	}
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
