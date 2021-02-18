<template>
	<div class="v-table" :class="{ loading, inline, disabled }">
		<table
			:summary="_headers.map((header) => header.text).join(', ')"
			:style="{
				'--grid-columns': columnStyle,
			}"
		>
			<table-header
				:headers.sync="_headers"
				:sort.sync="_sort"
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
				<template v-for="header in _headers" #[`header.${header.value}`]>
					<slot :header="header" :name="`header.${header.value}`" />
				</template>
			</table-header>
			<thead v-if="loading" class="loading-indicator" :class="{ sticky: fixedHeader }">
				<th scope="colgroup" :style="{ gridColumn: fullColSpan }">
					<v-progress-linear indeterminate v-if="loading" />
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
				v-model="_items"
				tag="tbody"
				handle=".drag-handle"
				:disabled="disabled || _sort.by !== manualSortKey"
				:set-data="hideDragImage"
				@end="onSortChange"
			>
				<table-row
					v-for="item in _items"
					:key="item[itemKey]"
					:headers="_headers"
					:item="item"
					:show-select="!disabled && showSelect"
					:show-manual-sort="!disabled && showManualSort"
					:is-selected="getSelectedState(item)"
					:subdued="loading"
					:sorted-manually="_sort.by === manualSortKey"
					:has-click-listener="!disabled && hasRowClick"
					:height="rowHeight"
					@click="hasRowClick ? $emit('click:row', item) : null"
					@item-selected="onItemSelected"
				>
					<template v-for="header in _headers" #[`item.${header.value}`]>
						<slot :item="item" :name="`item.${header.value}`" />
					</template>

					<template v-if="hasItemAppendSlot" #item-append>
						<slot name="item-append" :item="item" />
					</template>
				</table-row>
			</draggable>
		</table>
		<slot name="footer" />
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, PropType, onMounted, watch } from '@vue/composition-api';
import { Header, HeaderRaw, Item, ItemSelectEvent, Sort } from './types';
import TableHeader from './table-header/';
import TableRow from './table-row/';
import { sortBy, clone, forEach, pick } from 'lodash';
import { i18n } from '@/lang/';
import draggable from 'vuedraggable';
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
		draggable,
	},
	model: {
		prop: 'selection',
		event: 'select',
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
		selection: {
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
			default: i18n.t('loading'),
		},
		noItemsText: {
			type: String,
			default: i18n.t('no_items'),
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
	},
	setup(props, { emit, listeners, slots }) {
		const _headers = computed({
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
		const _localSort = ref<Sort>({
			by: null,
			desc: false,
		});

		const _sort = computed({
			get: () => props.sort || _localSort.value,
			set: (newSort: Sort) => {
				emit('update:sort', newSort);
				_localSort.value = newSort;
			},
		});

		const hasItemAppendSlot = computed(() => slots['item-append'] !== undefined);

		const fullColSpan = computed<string>(() => {
			let length = _headers.value.length + 1; // +1 account for spacer
			if (props.showSelect) length++;
			if (props.showManualSort) length++;
			if (hasItemAppendSlot.value) length++;

			return `1 / span ${length}`;
		});

		const _items = computed({
			get: () => {
				if (props.serverSort === true || _sort.value.by === props.manualSortKey) {
					return props.items;
				}

				if (_sort.value.by === null) return props.items;

				const itemsSorted = sortBy(props.items, [_sort.value.by]);
				if (_sort.value.desc === true) return itemsSorted.reverse();
				return itemsSorted;
			},
			set: (value: object[]) => {
				emit('update:items', value);
			},
		});

		const allItemsSelected = computed<boolean>(() => {
			return props.loading === false && props.selection.length === props.items.length;
		});

		const someItemsSelected = computed<boolean>(() => {
			return props.selection.length > 0 && allItemsSelected.value === false;
		});

		const hasRowClick = computed<boolean>(() => listeners.hasOwnProperty('click:row'));

		const columnStyle = computed<string>(() => {
			let gridTemplateColumns = _headers.value
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
			_headers,
			_items,
			_sort,
			allItemsSelected,
			getSelectedState,
			onItemSelected,
			onToggleSelectAll,
			someItemsSelected,
			onSortChange,
			hasRowClick,
			fullColSpan,
			columnStyle,
			hasItemAppendSlot,
			hideDragImage,
		};

		function onItemSelected(event: ItemSelectEvent) {
			if (props.disabled) return;

			emit('item-selected', event);

			let selection = clone(props.selection) as any[];

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

			emit('select', selection);
		}

		function getSelectedState(item: Item) {
			const selectedKeys = props.selectionUseKeys
				? props.selection
				: props.selection.map((item: any) => item[props.itemKey]);
			return selectedKeys.includes(item[props.itemKey]);
		}

		function onToggleSelectAll(value: boolean) {
			if (props.disabled) return;

			if (value === true) {
				if (props.selectionUseKeys) {
					emit(
						'select',
						clone(props.items).map((item) => item[props.itemKey])
					);
				} else {
					emit('select', clone(props.items));
				}
			} else {
				emit('select', []);
			}
		}

		interface EndEvent extends CustomEvent {
			oldIndex: number;
			newIndex: number;
		}

		function onSortChange(event: EndEvent) {
			if (props.disabled) return;

			const item = _items.value[event.oldIndex][props.itemKey];
			const to = _items.value[event.newIndex][props.itemKey];

			emit('manual-sort', { item, to });
		}
	},
});
</script>

<style>
body {
	--v-table-height: auto;
	--v-table-sticky-offset-top: 0;
	--v-table-color: var(--foreground-normal);
	--v-table-background-color: var(--background-page);
}
</style>

<style lang="scss" scoped>
.v-table {
	position: relative;
	height: var(--v-table-height);
	overflow-y: auto;

	table {
		min-width: 100%;
		border-collapse: collapse;
		border-spacing: 0;

		tbody {
			display: contents;
		}

		::v-deep {
			thead {
				display: contents;
			}

			tr,
			.loading-indicator {
				display: grid;
				grid-template-columns: var(--grid-columns);
			}

			td,
			th {
				color: var(--v-table-color);

				&.align-left {
					text-align: left;
				}

				&.align-center {
					text-align: center;
				}

				&.align-right {
					text-align: right;
				}
			}

			.loading-indicator {
				position: relative;
				z-index: 3;

				> th {
					margin-right: var(--content-padding);
				}
			}

			.sortable-ghost {
				.cell {
					background-color: var(--background-subdued);
				}
			}
		}
	}

	&.loading {
		table {
			pointer-events: none;
		}

		.loading-indicator {
			height: auto;
			padding: 0;
			border: none;

			.v-progress-linear {
				--v-progress-linear-height: 2px;
				--v-progress-linear-color: var(--border-normal-alt);

				position: absolute;
				top: -2px;
				left: 0;
				width: 100%;
			}

			th {
				padding: 0;
			}

			&.sticky th {
				position: sticky;
				top: 48px;
				z-index: 2;
			}
		}
	}

	.loading-text,
	.no-items-text {
		text-align: center;

		td {
			padding: 16px;
			color: var(--foreground-subdued);
		}
	}

	&.inline {
		border: 2px solid var(--border-normal);
		border-radius: var(--border-radius);

		table ::v-deep .table-row:last-of-type .cell {
			border-bottom: none;
		}
	}
}

.disabled {
	--v-table-color: var(--foreground-subdued);
	--v-table-background-color: var(--background-subdued);
}
</style>
