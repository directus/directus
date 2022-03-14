<template>
	<thead class="table-header" :class="{ dragging }">
		<tr :class="{ fixed }">
			<th
				v-if="showManualSort"
				class="manual cell"
				:class="{ 'sorted-manually': sort.by === manualSortKey }"
				scope="col"
				@click="toggleManualSort"
			>
				<v-icon v-tooltip="t('toggle_manual_sorting')" name="sort" small />
			</th>

			<th v-if="showSelect !== 'none'" class="select cell" scope="col">
				<v-checkbox
					v-if="showSelect === 'multiple'"
					:model-value="allItemsSelected"
					:indeterminate="someItemsSelected"
					@update:model-value="toggleSelectAll"
				/>
			</th>

			<th v-for="header in headers" :key="header.value" :class="getClassesForHeader(header)" class="cell" scope="col">
				<v-menu v-if="hasHeaderContextMenuSlot" show-arrow placement="bottom-start">
					<template #activator="{ toggle }">
						<div class="content" @click="toggle">
							<span v-show="header.width === null || header.width > 90">
								<slot :name="`header.${header.value}`" :header="header">
									{{ header.text }}
								</slot>
							</span>

							<v-icon
								v-if="hasHeaderContextMenuSlot"
								:name="sort.by === header.value ? 'sort' : 'arrow_drop_down'"
								class="action-icon"
								small
							/>
						</div>
					</template>

					<slot name="header-context-menu" v-bind="{ header }" />
				</v-menu>

				<div v-else class="content" @click="changeSort(header)">
					<span v-show="header.width === null || header.width > 90">
						<slot :name="`header.${header.value}`" :header="header">
							{{ header.text }}
						</slot>
					</span>

					<v-icon
						v-if="header.sortable"
						v-tooltip.top="t(getTooltipForSortIcon(header))"
						name="sort"
						class="action-icon"
						small
					/>
				</div>
				<span
					v-if="showResize"
					class="resize-handle"
					@click.stop
					@pointerdown="onResizeHandleMouseDown(header, $event)"
				/>
			</th>

			<th class="spacer cell" scope="col" />
			<td v-if="$slots['header-append']" class="manual append cell" @click.stop>
				<slot name="header-append" />
			</td>
			<th v-if="hasItemAppendSlot && !$slots['header-append']" class="spacer cell" scope="col" />
		</tr>
	</thead>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { computed, ref, useSlots } from 'vue';
import { ShowSelect } from '@directus/shared/types';
import useEventListener from '@/composables/use-event-listener';
import { Header, Sort } from './types';
import { throttle, clone } from 'lodash';

interface Props {
	headers: Header[];
	sort: Sort;
	showSelect?: ShowSelect;
	showResize?: boolean;
	showManualSort?: boolean;
	someItemsSelected?: boolean;
	allItemsSelected?: boolean;
	fixed?: boolean;
	mustSort?: boolean;
	hasItemAppendSlot?: boolean;
	manualSortKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
	showSelect: 'none',
	showResize: false,
	showManualSort: false,
	someItemsSelected: false,
	allItemsSelected: false,
	fixed: false,
	mustSort: false,
	hasItemAppendSlot: false,
	manualSortKey: undefined,
});

const emit = defineEmits(['update:sort', 'toggle-select-all', 'update:headers']);
const { t } = useI18n();

const dragging = ref<boolean>(false);
const dragStartX = ref<number>(0);
const dragStartWidth = ref<number>(0);
const dragHeader = ref<Header | null>(null);

const slots = useSlots();

const hasHeaderContextMenuSlot = computed(() => slots['header-context-menu'] !== undefined);

useEventListener(window, 'pointermove', throttle(onMouseMove, 40));
useEventListener(window, 'pointerup', onMouseUp);

function getClassesForHeader(header: Header) {
	const classes: string[] = [];

	if (header.align) {
		classes.push(`align-${header.align}`);
	}

	if (header.sortable || hasHeaderContextMenuSlot.value) {
		classes.push('actionable');
	}

	if (props.sort.by === header.value) {
		if (props.sort.desc === false) {
			classes.push('sort-asc');
		} else {
			classes.push('sort-desc');
		}
	}

	return classes;
}

function getTooltipForSortIcon(header: Header) {
	return props.sort.by === header.value && props.sort.desc === false ? 'sort_desc' : 'sort_asc';
}

function changeSort(header: Header) {
	if (header.sortable === false) return;
	if (dragging.value === true) return;

	if (header.value === props.sort.by) {
		if (props.mustSort) {
			return emit('update:sort', {
				by: props.sort.by,
				desc: !props.sort.desc,
			});
		}

		if (props.sort.desc === false) {
			return emit('update:sort', {
				by: props.sort.by,
				desc: true,
			});
		}

		return emit('update:sort', {
			by: null,
			desc: false,
		});
	}

	return emit('update:sort', {
		by: header.value,
		desc: false,
	});
}

function toggleSelectAll() {
	emit('toggle-select-all', !props.allItemsSelected);
}

function onResizeHandleMouseDown(header: Header, event: PointerEvent) {
	const target = event.target as HTMLDivElement;
	const parent = target.parentElement as HTMLTableHeaderCellElement;

	dragging.value = true;
	dragStartX.value = event.pageX;
	dragStartWidth.value = parent.offsetWidth;
	dragHeader.value = header;
}

function onMouseMove(event: PointerEvent) {
	if (dragging.value === true) {
		const newWidth = dragStartWidth.value + (event.pageX - dragStartX.value);
		const currentHeaders = clone(props.headers);
		const newHeaders = currentHeaders.map((existing: Header) => {
			if (existing.value === dragHeader.value?.value) {
				return {
					...existing,
					width: Math.max(32, newWidth),
				};
			}

			return existing;
		});
		emit('update:headers', newHeaders);
	}
}

function onMouseUp() {
	if (dragging.value === true) {
		dragging.value = false;
	}
}

function toggleManualSort() {
	if (props.sort.by === props.manualSortKey) {
		emit('update:sort', {
			by: null,
			desc: false,
		});
	} else {
		emit('update:sort', {
			by: props.manualSortKey,
			desc: false,
		});
	}
}
</script>

<style lang="scss" scoped>
.table-header {
	.cell {
		position: relative;
		height: 50px; /* +2px for bottom border */
		padding: 0 12px;
		font-weight: 500;
		font-size: 14px;
		background-color: var(--v-table-background-color);
		border-bottom: var(--border-width) solid var(--border-subdued);

		&.select,
		&.manual {
			display: flex;
			align-items: center;
		}

		.content {
			display: flex;
			align-items: center;
			height: 100%;
			color: var(--foreground-normal-alt);
			font-weight: 600;

			> span {
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
			}
		}
	}

	.actionable {
		cursor: pointer;
		position: relative;

		.action-icon {
			margin-left: 4px;
			color: var(--foreground-subdued);
			opacity: 0;
			transition: opacity var(--fast) var(--transition);
		}

		&:hover .action-icon {
			opacity: 1;
		}

		&.sort-asc,
		&.sort-desc {
			.action-icon {
				opacity: 1;
				transform: scaleY(-1);
			}
		}

		&.sort-desc {
			.action-icon {
				transform: scaleY(1);
			}
		}
	}

	:not(&.dragging) .sortable {
		cursor: pointer;
	}

	.select,
	.manual {
		padding-right: 0;
	}

	.fixed {
		position: sticky;
		top: var(--v-table-sticky-offset-top);
		z-index: 3;
	}

	.manual {
		color: var(--foreground-subdued);
		cursor: pointer;

		.v-icon {
			position: relative;
			left: 2px;
		}

		&.sorted-manually {
			color: var(--foreground-normal);
		}
	}

	.resize-handle {
		position: absolute;
		top: 0;
		right: 0;
		width: 5px;
		height: 100%;
		cursor: ew-resize;
		transition: opacity var(--fast) var(--transition);

		&::after {
			position: relative;
			top: 20%;
			left: 2px;
			display: block;
			width: var(--border-width);
			height: 60%;
			background-color: var(--border-subdued);
			content: '';
			transition: background-color var(--fast) var(--transition);
		}

		&:hover::after {
			background-color: var(--primary);
		}
	}
}

.spacer.cell {
	padding: 0;
}
</style>
