<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
	defineProps<{
		maxRows?: number;
		maxCols?: number;
	}>(),
	{
		maxRows: 10,
		maxCols: 10,
	},
);

const emit = defineEmits<{ select: [size: { rows: number; cols: number }] }>();

const { t } = useI18n();

// 1-based highlight extent; 0 means nothing is hovered/focused yet.
const hoveredRows = ref(0);
const hoveredCols = ref(0);

const rows = computed(() => Array.from({ length: props.maxRows }, (_, i) => i + 1));
const cols = computed(() => Array.from({ length: props.maxCols }, (_, i) => i + 1));

const caption = computed(() =>
	hoveredRows.value > 0
		? t('wysiwyg_options.table_insert_size', { cols: hoveredCols.value, rows: hoveredRows.value })
		: t('wysiwyg_options.table_insert'),
);

function highlight(row: number, col: number): void {
	hoveredRows.value = row;
	hoveredCols.value = col;
}

function reset(): void {
	hoveredRows.value = 0;
	hoveredCols.value = 0;
}

/** Insert a table of the given size. Exposed for unit testing. */
function select(rows: number, cols: number): void {
	emit('select', { rows, cols });
}

function onKeydown(event: KeyboardEvent): void {
	// Start from the top-left cell once the grid gains keyboard focus.
	let row = hoveredRows.value || 1;
	let col = hoveredCols.value || 1;

	switch (event.key) {
		case 'ArrowUp':
			row = Math.max(1, row - 1);
			break;
		case 'ArrowDown':
			row = Math.min(props.maxRows, row + 1);
			break;
		case 'ArrowLeft':
			col = Math.max(1, col - 1);
			break;
		case 'ArrowRight':
			col = Math.min(props.maxCols, col + 1);
			break;
		case 'Enter':
		case ' ':
			event.preventDefault();
			select(row, col);
			return;
		default:
			return;
	}

	event.preventDefault();
	highlight(row, col);
}

defineExpose({ select });
</script>

<template>
	<div class="table-grid-picker">
		<div
			class="grid"
			role="grid"
			tabindex="0"
			:aria-label="t('wysiwyg_options.table_insert')"
			@mouseleave="reset"
			@focus="highlight(1, 1)"
			@keydown="onKeydown"
		>
			<button
				v-for="cell in rows.flatMap((row) => cols.map((col) => ({ row, col })))"
				:key="`${cell.row}-${cell.col}`"
				type="button"
				class="cell"
				:class="{ active: cell.row <= hoveredRows && cell.col <= hoveredCols }"
				:aria-label="t('wysiwyg_options.table_insert_size', { cols: cell.col, rows: cell.row })"
				tabindex="-1"
				@mouseover="highlight(cell.row, cell.col)"
				@click="select(cell.row, cell.col)"
			/>
		</div>
		<div class="caption">{{ caption }}</div>
	</div>
</template>

<style lang="scss" scoped>
.table-grid-picker {
	padding: 0.5rem;
}

.grid {
	display: grid;
	grid-template-columns: repeat(v-bind(maxCols), 1rem);
	padding-block-start: 0.0625rem;
	padding-inline-start: 0.0625rem;
	outline: none;
}

.cell {
	inline-size: 1rem;
	block-size: 1rem;
	padding: 0;
	margin-block-start: -0.0625rem;
	margin-inline-start: -0.0625rem;
	border: 0.0625rem solid var(--theme--form--field--input--border-color);
	background-color: var(--theme--background-subdued);
	cursor: pointer;

	&.active {
		position: relative;
		z-index: 1;
		border-color: var(--theme--foreground);
		background-color: var(--primary-dimmed);
	}
}

.caption {
	margin-block-start: 0.5rem;
	color: var(--theme--foreground);
	font-size: 0.8125rem;
	text-align: center;
}
</style>
