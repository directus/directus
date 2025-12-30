<script setup lang="ts">
import { Header, Sort } from './types';
import VCheckbox from '@/components/v-checkbox.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VMenu from '@/components/v-menu.vue';
import { useEventListener } from '@/composables/use-event-listener';
import { useUserStore } from '@/stores/user';
import { hideDragImage } from '@/utils/hide-drag-image';
import { useSync } from '@directus/composables';
import type { ShowSelect } from '@directus/types';
import { clone, throttle } from 'lodash';
import { computed, ref, useSlots } from 'vue';
import Draggable from 'vuedraggable';

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
const userStore = useUserStore();

const isRTL = computed(() => userStore.textDirection === 'rtl');

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
		const deltaX = event.pageX - resizeStartX.value;
		const newWidth = resizeStartWidth.value + (isRTL.value ? -deltaX : deltaX);
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
		<Draggable
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
				>
					<VIcon v-tooltip="$t('toggle_manual_sorting')" name="sort" small clickable @click="toggleManualSort" />
				</th>

				<th v-if="showSelect !== 'none'" class="select cell" scope="col">
					<VCheckbox
						v-if="showSelect === 'multiple'"
						:model-value="allItemsSelected"
						:indeterminate="someItemsSelected"
						@update:model-value="toggleSelectAll"
					/>
				</th>
			</template>

			<template #item="{ element: header }">
				<th :class="getClassesForHeader(header)" class="cell" scope="col" :style="{ inlineSize: header.width + 'px' }">
					<VMenu v-if="hasHeaderContextMenuSlot" show-arrow placement="bottom-start">
						<template #activator="{ toggle }">
							<div class="content reorder-handle">
								<button class="header-btn" type="button" @click="toggle">
									<span class="name">
										<span v-if="header.description" v-tooltip="header.description" class="description-dot"></span>
										<slot :name="`header.${header.value}`" :header="header">
											{{ header.text }}
										</slot>
									</span>

									<VIcon :name="sort.by === header.value ? 'sort' : 'arrow_drop_down'" class="action-icon" small />
								</button>
							</div>
						</template>

						<slot name="header-context-menu" v-bind="{ header }" />
					</VMenu>

					<div v-else class="content reorder-handle">
						<button
							class="header-btn"
							type="button"
							:disabled="!header.sortable"
							:aria-label="header.sortable ? $t(getTooltipForSortIcon(header)) : undefined"
							@click="changeSort(header)"
						>
							<span class="name">
								<span v-if="header.description" v-tooltip="header.description" class="description-dot"></span>
								<slot :name="`header.${header.value}`" :header="header">
									{{ header.text }}
								</slot>
							</span>

							<VIcon
								v-if="header.sortable"
								v-tooltip.top="$t(getTooltipForSortIcon(header))"
								name="sort"
								class="action-icon"
								small
							/>
						</button>
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
		</Draggable>
		<!-- </tr> -->
	</thead>
</template>

<style lang="scss" scoped>
.table-header {
	.cell {
		position: relative;
		block-size: 50px; /* +2px for bottom border */
		padding: 0 12px;
		font-weight: 500;
		font-size: 14px;
		background-color: var(--v-table-background-color, var(--theme--background));
		border-block-end: var(--theme--border-width) solid var(--theme--border-color-subdued);

		&.select {
			--focus-ring-offset: var(--focus-ring-offset-invert);
		}

		&.select,
		&.manual {
			display: flex;
			align-items: center;
		}

		.content {
			display: flex;
			align-items: center;
			block-size: 100%;
			color: var(--theme--foreground-accent);
			font-weight: 600;

			.header-btn {
				inline-size: 100%;
				display: flex;
				align-items: center;
				justify-content: start;

				.name,
				.action-button {
					overflow: hidden;
					white-space: nowrap;
					text-overflow: ellipsis;
				}

				&:focus-visible .action-icon {
					opacity: 1;
				}
			}
		}

		&.small {
			padding: 0;

			.content {
				justify-content: center;

				.header-btn {
					inline-size: auto;
				}

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
		position: relative;

		.action-icon {
			margin-inline-start: 4px;
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
		padding-inline-end: 0;
	}

	.fixed {
		position: sticky;
		inset-block-start: var(--v-table-sticky-offset-top, 0);
		z-index: 3;
	}

	.manual {
		color: var(--theme--foreground-subdued);

		.v-icon {
			position: relative;
			inset-inline-start: 2px;
		}

		&.sorted-manually {
			color: var(--theme--foreground);
		}
	}

	.resize-handle {
		position: absolute;
		inset-block-start: 0;
		inset-inline-end: 0;
		inline-size: 5px;
		block-size: 100%;
		cursor: ew-resize;
		transition: opacity var(--fast) var(--transition);

		&::after {
			position: relative;
			inset-block-start: 20%;
			inset-inline-start: 3px;
			display: block;
			inline-size: var(--theme--border-width);
			block-size: 60%;
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
		inline-size: 2px;
		content: '';
		display: block;
		position: absolute;
		inset-inline-end: 0;
		inset-block-start: 20%;
		block-size: 60%;
		background-color: var(--theme--primary);
	}

	&::before {
		inset-inline: 0 auto;
	}
}

:deep(.sortable-fallback) {
	display: none;
}

.description-dot {
	inline-size: 8px;
	block-size: 8px;
	background-color: var(--theme--foreground-subdued);
	display: inline-block;
	border-radius: 50%;
	border: var(--theme--background) 6px solid;
	box-sizing: content-box;
	margin-inline-end: 8px;
	vertical-align: middle;
}
</style>
