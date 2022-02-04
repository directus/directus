<template>
	<div class="v-table" :class="{ loading, inline, disabled }">
		<table
			:summary="internalHeaders.map((header) => header.text).join(', ')"
			:style="{
				'--grid-columns': columnStyle,
			}"
		>
			<table-header
				v-model:headers="internalHeaders"
				v-model:sort="internalSort"
				:show-select="showSelect"
				:show-resize="showResize"
				:some-items-selected="someItemsSelected"
				:all-items-selected="allItemsSelected"
				:fixed="fixedHeader"
				:show-manual-sort="showManualSort"
				:must-sort="mustSort"
				:has-item-append-slot="hasItemAppendSlot"
				:manual-sort-key="manualSortKey"
				@toggle-select-all="onToggleSelectAll"
			>
				<template v-for="header in internalHeaders" #[`header.${header.value}`]>
					<slot :header="header" :name="`header.${header.value}`" />
				</template>
			</table-header>
			<thead v-if="loading" class="loading-indicator" :class="{ sticky: fixedHeader }">
				<th scope="colgroup" :style="{ gridColumn: fullColSpan }">
					<v-progress-linear v-if="loading" indeterminate />
				</th>
			</thead>
			<tbody v-if="loading && items.length === 0">
				<tr class="loading-text">
					<td :style="{ gridColumn: fullColSpan }">{{ loadingText }}</td>
				</tr>
			</tbody>
			<tbody v-if="!loading && items.length === 0">
				<tr class="no-items-text">
					<td :style="{ gridColumn: fullColSpan }">{{ noItemsText }}</td>
				</tr>
			</tbody>
			<draggable
				v-else
				v-model="internalItems"
				:force-fallback="true"
				:item-key="itemKey"
				tag="tbody"
				handle=".drag-handle"
				:disabled="disabled || internalSort.by !== manualSortKey"
				:set-data="hideDragImage"
				@end="onSortChange"
			>
				<template #item="{ element }">
					<table-row
						:headers="internalHeaders"
						:item="element"
						:show-select="!disabled && showSelect"
						:show-manual-sort="!disabled && showManualSort"
						:is-selected="getSelectedState(element)"
						:subdued="loading"
						:sorted-manually="internalSort.by === manualSortKey"
						:has-click-listener="!disabled && clickable"
						:height="rowHeight"
						@click="clickable ? $emit('click:row', { item: element, event: $event }) : null"
						@item-selected="
							onItemSelected({
								item: element,
								value: !getSelectedState(element),
							})
						"
					>
						<template v-for="header in internalHeaders" #[`item.${header.value}`]>
							<slot :item="element" :name="`item.${header.value}`" />
						</template>

						<template v-if="hasItemAppendSlot" #item-append>
							<slot name="item-append" :item="element" />
						</template>
					</table-row>
				</template>
			</draggable>
		</table>
		<slot name="footer" />
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, PropType } from 'vue';
import { Header, HeaderRaw, Item, ItemSelectEvent, Sort } from './types';
import TableHeader from './table-header/';
import TableRow from './table-row/';
import { sortBy, clone, forEach, pick } from 'lodash';
import { i18n } from '@/lang/';
import Draggable from 'vuedraggable';
import hideDragImage from '@/utils/hide-drag-image';

const HeaderDefaults: Header = {
	text: '',
	value: '',
	align: 'left',
	sortable: true,
	width: null,
};

export default defineComponent({
	components: {
		TableHeader,
		TableRow,
		Draggable,
	},
	props: {
		headers: {
			type: Array as PropType<HeaderRaw[]>,
			required: true,
		},
		items: {
			type: Array as PropType<Item[]>,
			required: true,
		},
		itemKey: {
			type: String,
			default: 'id',
		},
		sort: {
			type: Object as PropType<Sort>,
			default: null,
		},
		mustSort: {
			type: Boolean,
			default: false,
		},
		showSelect: {
			type: Boolean,
			default: false,
		},
		showResize: {
			type: Boolean,
			default: false,
		},
		showManualSort: {
			type: Boolean,
			default: false,
		},
		manualSortKey: {
			type: String,
			default: null,
		},
		modelValue: {
			type: Array as PropType<any>,
			default: () => [],
		},
		fixedHeader: {
			type: Boolean,
			default: false,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		loadingText: {
			type: String,
			default: i18n.global.t('loading'),
		},
		noItemsText: {
			type: String,
			default: i18n.global.t('no_items'),
		},
		serverSort: {
			type: Boolean,
			default: false,
		},
		rowHeight: {
			type: Number,
			default: 48,
		},
		selectionUseKeys: {
			type: Boolean,
			default: false,
		},
		inline: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		clickable: {
			type: Boolean,
			default: true,
		},
	},
	emits: [
		'click:row',
		'update:sort',
		'update:items',
		'item-selected',
		'update:modelValue',
		'manual-sort',
		'update:headers',
	],
	setup(props, { emit, slots }) {
		const internalHeaders = computed({
			get: () => {
				return props.headers
					.map((header: HeaderRaw) => ({
						...HeaderDefaults,
						...header,
					}))
					.map((header) => {
						if (header.width && header.width < 24) {
							header.width = 24;
						}

						return header;
					});
			},
			set: (newHeaders: Header[]) => {
				emit(
					'update:headers',
					// We'll return the original headers with the updated values, so we don't stage
					// all the default values
					newHeaders.map((header) => {
						const keysThatArentDefault: string[] = [];

						forEach(header, (value, key: string) => {
							const objKey = key as keyof Header;

							if (value !== HeaderDefaults[objKey]) {
								keysThatArentDefault.push(key);
							}
						});

						return pick(header, keysThatArentDefault);
					})
				);
			},
		});

		// In case the sort prop isn't used, we'll use this local sort state as a fallback.
		// This allows the table to allow inline sorting on column ootb without the need for
		const internalLocalSort = ref<Sort>({
			by: null,
			desc: false,
		});

		const internalSort = computed({
			get: () => props.sort || internalLocalSort.value,
			set: (newSort: Sort) => {
				emit('update:sort', newSort);
				internalLocalSort.value = newSort;
			},
		});

		const hasItemAppendSlot = computed(() => slots['item-append'] !== undefined);

		const fullColSpan = computed<string>(() => {
			let length = internalHeaders.value.length + 1; // +1 account for spacer
			if (props.showSelect) length++;
			if (props.showManualSort) length++;
			if (hasItemAppendSlot.value) length++;

			return `1 / span ${length}`;
		});

		const internalItems = computed({
			get: () => {
				if (props.serverSort === true || internalSort.value.by === props.manualSortKey) {
					return props.items;
				}

				if (internalSort.value.by === null) return props.items;

				const itemsSorted = sortBy(props.items, [internalSort.value.by]);
				if (internalSort.value.desc === true) return itemsSorted.reverse();
				return itemsSorted;
			},
			set: (value: Item[]) => {
				emit('update:items', value);
			},
		});

		const allItemsSelected = computed<boolean>(() => {
			return props.loading === false && props.modelValue.length === props.items.length;
		});

		const someItemsSelected = computed<boolean>(() => {
			return props.modelValue.length > 0 && allItemsSelected.value === false;
		});

		const columnStyle = computed<string>(() => {
			let gridTemplateColumns = internalHeaders.value
				.map((header) => {
					return header.width ? `${header.width}px` : '160px';
				})
				.reduce((acc, val) => (acc += ' ' + val), '');

			if (props.showSelect) gridTemplateColumns = '36px ' + gridTemplateColumns;
			if (props.showManualSort) gridTemplateColumns = '36px ' + gridTemplateColumns;

			gridTemplateColumns = gridTemplateColumns + ' 1fr';

			if (hasItemAppendSlot.value) gridTemplateColumns += ' auto';

			return gridTemplateColumns;
		});

		return {
			internalHeaders,
			internalItems,
			internalSort,
			allItemsSelected,
			getSelectedState,
			onItemSelected,
			onToggleSelectAll,
			someItemsSelected,
			onSortChange,
			fullColSpan,
			columnStyle,
			hasItemAppendSlot,
			hideDragImage,
		};

		function onItemSelected(event: ItemSelectEvent) {
			if (props.disabled) return;

			emit('item-selected', event);

			let selection = clone(props.modelValue) as any[];

			if (event.value === true) {
				if (props.selectionUseKeys) {
					selection.push(event.item[props.itemKey]);
				} else {
					selection.push(event.item);
				}
			} else {
				selection = selection.filter((item) => {
					if (props.selectionUseKeys) {
						return item !== event.item[props.itemKey];
					}

					return item[props.itemKey] !== event.item[props.itemKey];
				});
			}

			emit('update:modelValue', selection);
		}

		function getSelectedState(item: Item) {
			const selectedKeys = props.selectionUseKeys
				? props.modelValue
				: props.modelValue.map((item: any) => item[props.itemKey]);
			return selectedKeys.includes(item[props.itemKey]);
		}

		function onToggleSelectAll(value: boolean) {
			if (props.disabled) return;

			if (value === true) {
				if (props.selectionUseKeys) {
					emit(
						'update:modelValue',
						clone(props.items).map((item) => item[props.itemKey])
					);
				} else {
					emit('update:modelValue', clone(props.items));
				}
			} else {
				emit('update:modelValue', []);
			}
		}

		interface EndEvent extends CustomEvent {
			oldIndex: number;
			newIndex: number;
		}

		function onSortChange(event: EndEvent) {
			if (props.disabled) return;

			const item = internalItems.value[event.oldIndex][props.itemKey];
			const to = internalItems.value[event.newIndex][props.itemKey];

			emit('manual-sort', { item, to });
		}
	},
});
</script>

<style scoped>
:global(body) {
	--v-table-height: auto;
	--v-table-sticky-offset-top: 0;
	--v-table-color: var(--foreground-normal);
	--v-table-background-color: var(--background-input);
}

.v-table {
	position: relative;
	height: var(--v-table-height);
	overflow-y: auto;
}

table {
	min-width: 100%;
	border-collapse: collapse;
	border-spacing: 0;
}

table tbody {
	display: contents;
}

table :deep(thead) {
	display: contents;
}

table :deep(td),
table :deep(th) {
	color: var(--v-table-color);
}

table :deep(tr),
table :deep(.loading-indicator) {
	display: grid;
	grid-template-columns: var(--grid-columns);
}

table :deep(td.align-left),
table :deep(th.align-left) {
	text-align: left;
}

table :deep(td.align-center),
table :deep(th.align-center) {
	text-align: center;
}

table :deep(td.align-right),
table :deep(th.align-right) {
	text-align: right;
}

table :deep(.loading-indicator) {
	position: relative;
	z-index: 3;
}

table :deep(.loading-indicator > th) {
	margin-right: var(--content-padding);
}

table :deep(.sortable-ghost .cell) {
	background-color: var(--background-subdued);
}

.loading table {
	pointer-events: none;
}

.loading .loading-indicator {
	height: auto;
	padding: 0;
	border: none;
}

.loading .loading-indicator .v-progress-linear {
	--v-progress-linear-height: 2px;
	--v-progress-linear-color: var(--border-normal-alt);

	position: absolute;
	top: -2px;
	left: 0;
	width: 100%;
}

.loading .loading-indicator th {
	padding: 0;
}

.loading .loading-indicator.sticky th {
	position: sticky;
	top: 48px;
	z-index: 2;
}

.loading-text,
.no-items-text {
	text-align: center;
	background-color: var(--background-input);
}

.loading-text td,
.no-items-text td {
	padding: 16px;
	color: var(--foreground-subdued);
}

.inline {
	border: 2px solid var(--border-normal);
	border-radius: var(--border-radius);
}

.inline table :deep(.table-row:last-of-type .cell) {
	border-bottom: none;
}

.disabled {
	--v-table-color: var(--foreground-subdued);
	--v-table-background-color: var(--background-subdued);
}
</style>
