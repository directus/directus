<template>
	<div class="v-table" :class="{ loading }">
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
				@toggle-select-all="onToggleSelectAll"
			>
				<template v-for="header in _headers" #[`header.${header.value}`]>
					<slot :header="header" :name="`header.${header.value}`" />
				</template>
			</table-header>
			<thead v-if="loading" class="loading-indicator" :class="{ sticky: fixedHeader }">
				<th scope="colgroup" :style="{ gridColumn: loadingColSpan }">
					<v-progress-linear indeterminate v-if="loading" />
				</th>
			</thead>
			<tbody v-if="loading && items.length === 0">
				<tr class="loading-text">
					<td :style="{ gridColumn: loadingColSpan }">{{ loadingText }}</td>
				</tr>
			</tbody>
			<draggable
				v-else
				v-model="_items"
				tag="tbody"
				handle=".drag-handle"
				:disabled="_sort.by !== '$manual'"
				@end="onEndDrag"
			>
				<table-row
					v-for="item in _items"
					:key="item[itemKey]"
					:headers="_headers"
					:item="item"
					:show-select="showSelect"
					:show-manual-sort="showManualSort"
					:is-selected="getSelectedState(item)"
					:subdued="loading"
					:sorted-manually="_sort.by === '$manual'"
					:has-click-listener="hasRowClick"
					:height="rowHeight"
					@click="hasRowClick ? $emit('click:row', item) : null"
					@item-selected="onItemSelected"
				>
					<template v-for="header in _headers" #[`item.${header.value}`]>
						<slot :item="item" :name="`item.${header.value}`" />
					</template>
				</table-row>
			</draggable>
		</table>
		<slot name="footer" />
	</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, PropType } from '@vue/composition-api';
import { Header, HeaderRaw, Item, ItemSelectEvent, Sort } from './types';
import TableHeader from './table-header/';
import TableRow from './table-row/';
import { sortBy, clone, forEach, pick } from 'lodash';
import { i18n } from '@/lang/';
import draggable from 'vuedraggable';

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
		selection: {
			type: Array as PropType<Item[]>,
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
		serverSort: {
			type: Boolean,
			default: false,
		},
		rowHeight: {
			type: Number,
			default: 48,
		},
	},
	setup(props, { emit, listeners }) {
		const _headers = computed({
			get: () => {
				return props.headers.map((header: HeaderRaw) => ({
					...HeaderDefaults,
					...header,
				}));
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

		const loadingColSpan = computed<string>(() => {
			let length = _headers.value.length;
			if (props.showSelect) length = length + 1;
			if (props.showManualSort) length = length + 1;
			return `1 / span ${length}`;
		});

		const _items = computed({
			get: () => {
				if (props.serverSort === true || _sort.value.by === '$manual') {
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
			return props.selection.length === props.items.length;
		});

		const someItemsSelected = computed<boolean>(() => {
			return props.selection.length > 0 && allItemsSelected.value === false;
		});

		const hasRowClick = computed<boolean>(() => listeners.hasOwnProperty('click:row'));

		const columnStyle = computed<string>(() => {
			let gridTemplateColumns = _headers.value
				.map((header, index, array) => {
					if (index !== array.length - 1) {
						return header.width ? `${header.width}px` : 'min-content';
					} else {
						return `minmax(min-content, 1fr)`;
					}
				})
				.reduce((acc, val) => (acc += ' ' + val), '');

			if (props.showSelect) gridTemplateColumns = 'auto ' + gridTemplateColumns;
			if (props.showManualSort) gridTemplateColumns = 'auto ' + gridTemplateColumns;
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
			onEndDrag,
			hasRowClick,
			loadingColSpan,
			columnStyle,
		};

		function onItemSelected(event: ItemSelectEvent) {
			emit('item-selected', event);

			const selection: Item[] = clone(props.selection);

			if (event.value === true) {
				selection.push(event.item);
			} else {
				const itemIndex: number = selection.findIndex(
					(item: Item) => item[props.itemKey] === event.item[props.itemKey]
				);

				selection.splice(itemIndex, 1);
			}

			emit('select', selection);
		}

		function getSelectedState(item: Item) {
			const selectedKeys = props.selection.map((item: Item) => item[props.itemKey]);
			return selectedKeys.includes(item[props.itemKey]);
		}

		function onToggleSelectAll(value: boolean) {
			if (value === true) {
				emit('select', clone(props.items));
			} else {
				emit('select', []);
			}
		}

		interface VueDraggableDropEvent extends CustomEvent {
			oldIndex: number;
			newIndex: number;
		}

		function onEndDrag(event: VueDraggableDropEvent) {
			emit('drop', { oldIndex: event.oldIndex, newIndex: event.newIndex });
		}
	},
});
</script>

<style lang="scss" scoped>
.v-table {
	--v-table-height: auto;
	--v-table-sticky-offset-top: 0;

	position: relative;
	height: var(--v-table-height);
	overflow-y: auto;

	table {
		display: grid;
		grid-template-columns: var(--grid-columns);
		min-width: 100%;
		border-spacing: 0;

		::v-deep {
			tbody,
			thead,
			tr {
				display: contents;
			}

			td,
			th {
				color: var(--foreground-normal);

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

				position: relative;
				top: -2px;
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

		.loading-text {
			text-align: center;

			td {
				padding: 16px;
				color: var(--foreground-subdued);
			}
		}
	}
}
</style>
