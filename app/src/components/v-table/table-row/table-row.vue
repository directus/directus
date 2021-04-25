<template functional>
	<tr
		class="table-row"
		:class="{ subdued: props.subdued, clickable: props.hasClickListener }"
		@click="listeners.click"
		:style="{
			'--table-row-height': props.height + 2 + 'px',
			'--table-row-line-height': 1,
		}"
	>
		<td v-if="props.showManualSort" class="manual cell" @click.stop>
			<v-icon name="drag_handle" class="drag-handle" :class="{ 'sorted-manually': props.sortedManually }" />
		</td>

		<td v-if="props.showSelect" class="select cell" @click.stop>
			<v-checkbox :inputValue="props.isSelected" @change="listeners['item-selected']" />
		</td>

		<td class="cell" :class="`align-${header.align}`" v-for="header in props.headers" :key="header.value">
			<slot :name="`item.${header.value}`" :item="props.item">
				<v-text-overflow
					v-if="
						header.value.split('.').reduce((acc, val) => {
							return acc[val];
						}, props.item)
					"
					:text="
						header.value.split('.').reduce((acc, val) => {
							return acc[val];
						}, props.item)
					"
				/>
				<value-null v-else />
			</slot>
		</td>

		<td class="spacer cell" />
		<td v-if="$scopedSlots['item-append']" class="append cell" @click.stop>
			<slot name="item-append" />
		</td>
	</tr>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { Header } from '../types';

export default defineComponent({
	props: {
		headers: {
			type: Array as PropType<Header[]>,
			required: true,
		},
		item: {
			type: Object,
			required: true,
		},
		showSelect: {
			type: Boolean,
			default: false,
		},
		showManualSort: {
			type: Boolean,
			default: false,
		},
		isSelected: {
			type: Boolean,
			default: false,
		},
		subdued: {
			type: Boolean,
			default: false,
		},
		sortedManually: {
			type: Boolean,
			default: false,
		},
		hasClickListener: {
			type: Boolean,
			default: false,
		},
		height: {
			type: Number,
			default: 48,
		},
	},
});
</script>

<style lang="scss" scoped>
.table-row {
	height: var(--table-row-height);

	.cell {
		display: flex;
		align-items: center;
		padding: 8px 0;
		padding-left: 12px;
		overflow: hidden;
		line-height: var(--table-row-line-height);
		white-space: nowrap;
		text-overflow: ellipsis;
		background-color: var(--v-table-background-color);
		border-bottom: 2px solid var(--border-subdued);

		&:last-child {
			padding: 0 12px 0 12px;
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
		background-color: var(--background-subdued);
		cursor: pointer;
	}

	.drag-handle {
		--v-icon-color: var(--foreground-subdued);

		&.sorted-manually {
			--v-icon-color: var(--foreground-normal);

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
}
</style>
