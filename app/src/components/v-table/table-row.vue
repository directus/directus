<script setup lang="ts">
import type { ShowSelect } from '@directus/types';
import { computed } from 'vue';
import type { Header, Item } from './types';

const props = withDefaults(
	defineProps<{
		headers: Header[];
		item: Item;
		showSelect?: ShowSelect;
		showManualSort?: boolean;
		isSelected?: boolean;
		subdued?: boolean;
		sortedManually?: boolean;
		hasClickListener?: boolean;
		height?: number;
	}>(),
	{
		showSelect: 'none',
		showManualSort: false,
		isSelected: false,
		subdued: false,
		sortedManually: false,
		hasClickListener: false,
		height: 48,
	},
);

const emit = defineEmits(['click', 'item-selected']);

const cssHeight = computed(() => {
	return {
		tableRow: props.height + 2 + 'px',
		renderTemplateImage: props.height - 16 + 'px',
	};
});

function onKeydown(e: KeyboardEvent) {
	if (e.metaKey) return;
	if ((e.target as HTMLElement)?.tagName === 'TR' && ['Enter', ' '].includes(e.key)) emit('click', e);
}
</script>

<template>
	<tr
		class="table-row"
		:class="{ subdued: subdued, clickable: hasClickListener }"
		:tabindex="hasClickListener ? 0 : undefined"
		@click="$emit('click', $event)"
		@keydown="onKeydown"
	>
		<td v-if="showManualSort" class="manual cell" @click.stop>
			<v-icon name="drag_handle" class="drag-handle" :class="{ 'sorted-manually': sortedManually }" />
		</td>

		<td v-if="showSelect !== 'none'" class="select cell" @click.stop>
			<v-checkbox
				:icon-on="showSelect === 'one' ? 'radio_button_checked' : undefined"
				:icon-off="showSelect === 'one' ? 'radio_button_unchecked' : undefined"
				:model-value="isSelected"
				@update:model-value="$emit('item-selected', $event)"
			/>
		</td>

		<td v-for="header in headers" :key="header.value" class="cell" :class="`align-${header.align}`">
			<slot :name="`item.${header.value}`" :item="item">
				<v-text-overflow
					v-if="
						header.value.split('.').reduce((acc, val) => {
							return acc[val];
						}, item)
					"
					:text="
						header.value.split('.').reduce((acc, val) => {
							return acc[val];
						}, item)
					"
				/>
				<value-null v-else />
			</slot>
		</td>

		<td class="spacer cell" />
		<td v-if="$slots['item-append']" class="append cell" @click.stop>
			<slot name="item-append" />
		</td>
	</tr>
</template>

<style lang="scss" scoped>
.table-row {
	--focus-ring-offset: var(--focus-ring-offset-invert);

	block-size: v-bind('cssHeight.tableRow');

	.cell {
		display: flex;
		align-items: center;
		padding: 8px 12px;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		background-color: var(--v-table-background-color, transparent);
		border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);

		&:last-child {
			padding: 0 12px;
		}

		&.select {
			display: flex;
			align-items: center;
		}
	}

	&.subdued .cell {
		opacity: 0.3;
	}

	&.clickable:not(.subdued):hover .cell {
		background-color: var(--theme--background-subdued);
		cursor: pointer;
	}

	.drag-handle {
		--v-icon-color: var(--theme--foreground-subdued);

		&.sorted-manually {
			--v-icon-color: var(--theme--foreground);

			&:hover {
				cursor: ns-resize;
			}
		}
	}

	.append {
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	:deep(.render-template) {
		block-size: v-bind('cssHeight.tableRow');

		img {
			block-size: v-bind('cssHeight.renderTemplateImage');
		}
	}
}
</style>
