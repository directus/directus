<script setup lang="ts">
import { useEventListener } from '@/composables/use-event-listener';
import { hideDragImage } from '@/utils/hide-drag-image';
import { useSync } from '@directus/composables';
import type { ShowSelect } from '@directus/extensions';
import { clone, throttle } from 'lodash';
import { computed, ref, useSlots } from 'vue';
import { useI18n } from 'vue-i18n';
import Draggable from 'vuedraggable';
import { Header, Sort } from './types';

const props = withDefaults(
	defineProps<{
		headers: Header[];
		sort: Sort;
		reordering: boolean;
		allowHeaderReorder: boolean;
		showSelect?: ShowSelect;
		showResize?: boolean;
		showManualSort?: boolean;
		someItemsSelected?: boolean;
		allItemsSelected?: boolean;
		fixed?: boolean;
		mustSort?: boolean;
		hasItemAppendSlot?: boolean;
		manualSortKey?: string;
	}>(),
	{
		showSelect: 'none',
		showResize: false,
		showManualSort: false,
		someItemsSelected: false,
		allItemsSelected: false,
		fixed: false,
		mustSort: false,
		hasItemAppendSlot: false,
		manualSortKey: undefined,
	},
);

const emit = defineEmits(['update:sort', 'toggle-select-all', 'update:headers', 'update:reordering']);
const { t } = useI18n();

const resizing = ref<boolean>(false);
const resizeStartX = ref<number>(0);
const resizeStartWidth = ref<number>(0);
const resizeHeader = ref<Header | null>(null);

const slots = useSlots();

const hasHeaderContextMenuSlot = computed(() => slots['header-context-menu'] !== undefined);

useEventListener(window, 'pointermove', throttle(onMouseMove, 40));
useEventListener(window, 'pointerup', onMouseUp);

const headersWritable = useSync(props, 'headers', emit);

function getClassesForHeader(header: Header) {
	const classes: string[] = [];

	if (header.align) {
		classes.push(`align-${header.align}`);
	}

	if (header.sortable || hasHeaderContextMenuSlot.value) {
		classes.push('actionable');
	}

	if (header.width && header.width < 90) {
		classes.push('small');
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
	if (props.sort.by === null || props.sort.by !== header.value) return 'sort_asc';
	return props.sort.desc === false ? 'sort_desc' : 'disable_sort';
}

function changeSort(header: Header) {
	if (header.sortable === false) return;
	if (resizing.value === true) return;

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

	resizing.value = true;
	resizeStartX.value = event.pageX;
	resizeStartWidth.value = parent.offsetWidth;
	resizeHeader.value = header;
}

function onMouseMove(event: PointerEvent) {
	if (resizing.value === true) {
		const newWidth = resizeStartWidth.value + (event.pageX - resizeStartX.value);
		const currentHeaders = clone(props.headers);

		const newHeaders = currentHeaders.map((existing: Header) => {
			if (existing.value === resizeHeader.value?.value) {
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
	if (resizing.value === true) {
		resizing.value = false;
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

<template>
	<thead class="table-header" :class="{ resizing, reordering }">
		<draggable
			v-model="headersWritable"
			:class="{ fixed }"
			item-key="value"
			tag="tr"
			:disabled="!allowHeaderReorder"
			:set-data="hideDragImage"
			handle=".reorder-handle"
			animation="150"
			ghost-class="header-order-ghost"
			swap-threshold="0.5"
			v-bind="{ 'force-fallback': true }"
			@start="$emit('update:reordering', true)"
			@end="$emit('update:reordering', false)"
		>
			<template #header>
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
			</template>

			<template #item="{ element: header }">
				<th :class="getClassesForHeader(header)" class="cell" scope="col" :style="{ width: header.width + 'px' }">
					<v-menu v-if="hasHeaderContextMenuSlot" show-arrow placement="bottom-start">
						<template #activator="{ toggle }">
							<div class="content reorder-handle" @click="toggle">
								<span class="name">
									<span v-if="header.description" v-tooltip="header.description" class="description-dot"></span>
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

					<div v-else class="content reorder-handle" @click="changeSort(header)">
						<span class="name">
							<span v-if="header.description" v-tooltip="header.description" class="description-dot"></span>
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
			</template>

			<template #footer>
				<th class="spacer cell" scope="col" />
				<td v-if="$slots['header-append']" class="manual append cell" @click.stop>
					<slot name="header-append" />
				</td>
				<th v-if="hasItemAppendSlot && !$slots['header-append']" class="spacer cell" scope="col" />
			</template>
		</draggable>
		<!-- </tr> -->
	</thead>
</template>

<style lang="scss" scoped>
.table-header {
	.cell {
		position: relative;
		height: 50px; /* +2px for bottom border */
		padding: 0 12px;
		font-weight: 500;
		font-size: 14px;
		background-color: var(--v-table-background-color, var(--theme--background));
		border-bottom: var(--theme--border-width) solid var(--theme--border-color-subdued);

		&.select,
		&.manual {
			display: flex;
			align-items: center;
		}

		.content {
			display: flex;
			align-items: center;
			height: 100%;
			color: var(--theme--foreground-accent);
			font-weight: 600;

			> span {
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
			}
		}

		&.small {
			padding: 0;
			.content {
				justify-content: center;

				.name {
					display: none;
				}

				.action-icon {
					margin: 0;
				}
			}
		}
	}

	&.reordering {
		cursor: grabbing;
	}

	.actionable {
		cursor: pointer;
		position: relative;

		.action-icon {
			margin-left: 4px;
			color: var(--theme--foreground-subdued);
			opacity: 0;
			transition: opacity var(--fast) var(--transition);
			transform: scaleY(-1);
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

	:not(&.resizing) .sortable {
		cursor: pointer;
	}

	.select,
	.manual {
		padding-right: 0;
	}

	.fixed {
		position: sticky;
		top: var(--v-table-sticky-offset-top, 0);
		z-index: 3;
	}

	.manual {
		color: var(--theme--foreground-subdued);
		cursor: pointer;

		.v-icon {
			position: relative;
			left: 2px;
		}

		&.sorted-manually {
			color: var(--theme--foreground);
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
			left: 3px;
			display: block;
			width: var(--theme--border-width);
			height: 60%;
			background-color: var(--theme--border-color-subdued);
			content: '';
			transition: background-color var(--fast) var(--transition);
		}

		&:hover::after {
			background-color: var(--theme--primary);
		}
	}
}

.spacer.cell {
	padding: 0;
}

:deep(.header-order-ghost) {
	&::after,
	&::before {
		width: 2px;
		content: '';
		display: block;
		position: absolute;
		right: 0;
		top: 20%;
		height: 60%;
		background-color: var(--theme--primary);
	}

	&::before {
		right: auto;
		left: 0;
	}
}

:deep(.sortable-fallback) {
	display: none;
}

.description-dot {
	width: 8px;
	height: 8px;
	background-color: var(--theme--foreground-subdued);
	display: inline-block;
	border-radius: 50%;
	border: var(--theme--background) 6px solid;
	box-sizing: content-box;
	margin-right: 8px;
	vertical-align: middle;
}
</style>
