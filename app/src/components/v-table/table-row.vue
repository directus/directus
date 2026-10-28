<script setup lang="ts">
import type { ShowSelect } from '@directus/types';
import { computed, h, renderSlot, type Slots } from 'vue';
import type { Header, Item } from './types';
import VCheckbox from '@/components/v-checkbox.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import ValueNull from '@/views/private/components/value-null.vue';

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
		itemSlots?: Slots;
	}>(),
	{
		showSelect: 'none',
		showManualSort: false,
		isSelected: false,
		subdued: false,
		sortedManually: false,
		hasClickListener: false,
		height: 48,
		itemSlots: () => ({}),
	},
);

const emit = defineEmits(['click', 'item-selected']);

// Inline vars instead of CSS v-bind(): v-bind() adds a MutationObserver and a document-wide query per row
const rowStyle = computed(() => ({
	'--table-row-height': props.height + 2 + 'px',
	'--table-row-image-height': props.height - 16 + 'px',
}));

// The table's item slots come in as a prop rather than as slots on this component. vuedraggable renders
// rows with plain render functions, so Vue re-renders any row that receives slots whenever the list
// re-renders. Without slots, a row only re-renders when its own props change.
function renderCell(header: Header) {
	return renderSlot(props.itemSlots, `item.${header.value}`, { item: props.item }, () => {
		const value = header.value.split('.').reduce((acc, val) => acc[val], props.item);
		return [value ? h(VTextOverflow, { text: value }) : h(ValueNull)];
	});
}

function onKeydown(e: KeyboardEvent) {
	if (e.metaKey) return;
	if ((e.target as HTMLElement)?.tagName === 'TR' && ['Enter', ' '].includes(e.key)) emit('click', e);
}

function onClick(event: MouseEvent) {
	const rowAction = (event.target as HTMLElement | null)?.closest('[data-row-action]');

	if (rowAction && (event.currentTarget as HTMLElement).contains(rowAction)) {
		return;
	}

	emit('click', event);
}
</script>

<template>
	<tr
		class="table-row"
		:class="{ subdued: subdued, clickable: hasClickListener }"
		:style="rowStyle"
		:tabindex="hasClickListener ? 0 : undefined"
		@click="onClick"
		@keydown="onKeydown"
	>
		<td v-if="showManualSort" class="manual cell" data-row-action>
			<VIcon name="drag_handle" class="drag-handle" :class="{ 'sorted-manually': sortedManually }" />
		</td>

		<td v-if="showSelect !== 'none'" class="select cell" data-row-action>
			<VCheckbox
				:icon-on="showSelect === 'one' ? 'radio_button_checked' : undefined"
				:icon-off="showSelect === 'one' ? 'radio_button_unchecked' : undefined"
				:model-value="isSelected"
				@update:model-value="$emit('item-selected', $event)"
			/>
		</td>

		<td v-for="header in headers" :key="header.value" class="cell" :class="`align-${header.align}`">
			<component :is="renderCell(header)" />
		</td>

		<td class="spacer cell" />
		<td v-if="itemSlots['item-append']" class="append cell" data-row-action>
			<component :is="renderSlot(itemSlots, 'item-append', { item })" />
		</td>
	</tr>
</template>

<style lang="scss" scoped>
.table-row {
	--focus-ring-offset: var(--focus-ring-offset-invert);

	block-size: var(--table-row-height);

	.cell {
		display: flex;
		align-items: center;
		padding: 0.4375rem 0.6875rem;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		background-color: var(--v-table-background-color, transparent);
		border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);

		&:last-child {
			padding: 0 0.6875rem;
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
		block-size: var(--table-row-height);

		img {
			block-size: var(--table-row-image-height);
		}
	}
}
</style>
