<template>
	<thead class="table-header" :class="{ dragging }">
		<tr :class="{ fixed }">
			<th
				v-if="showManualSort"
				class="manual cell"
				:class="{ 'sorted-manually': sort.by === manualSortKey }"
				@click="toggleManualSort"
				scope="col"
			>
				<v-icon v-tooltip="$t('toggle_manual_sorting')" name="sort" small />
			</th>

			<th v-if="showSelect" class="select cell" scope="col">
				<v-checkbox :inputValue="allItemsSelected" :indeterminate="someItemsSelected" @change="toggleSelectAll" />
			</th>

			<th v-for="header in headers" :key="header.value" :class="getClassesForHeader(header)" class="cell" scope="col">
				<div class="content" @click="changeSort(header)">
					<span v-show="header.width > 90 || header.width === null">
						<slot :name="`header.${header.value}`" :header="header">
							{{ header.text }}
						</slot>
					</span>
					<v-icon
						v-if="header.sortable"
						name="sort"
						class="sort-icon"
						small
						v-tooltip.top="$t(getTooltipForSortIcon(header))"
					/>
				</div>
				<span
					class="resize-handle"
					v-if="showResize"
					@click.stop
					@pointerdown="onResizeHandleMouseDown(header, $event)"
				/>
			</th>

			<th class="spacer cell" scope="col" />
			<th v-if="hasItemAppendSlot" class="spacer cell" scope="col" />
		</tr>
	</thead>
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from '@vue/composition-api';
import useEventListener from '@/composables/use-event-listener';
import { Header, Sort } from '../types';
import { throttle, clone } from 'lodash';

export default defineComponent({
	props: {
		headers: {
			type: Array as PropType<Header[]>,
			required: true,
		},
		sort: {
			type: Object as PropType<Sort>,
			required: true,
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
		someItemsSelected: {
			type: Boolean,
			default: false,
		},
		allItemsSelected: {
			type: Boolean,
			default: false,
		},
		fixed: {
			type: Boolean,
			default: false,
		},
		mustSort: {
			type: Boolean,
			default: false,
		},
		hasItemAppendSlot: {
			type: Boolean,
			default: false,
		},
		manualSortKey: {
			type: String,
			default: null,
		},
	},
	setup(props, { emit }) {
		const dragging = ref<boolean>(false);
		const dragStartX = ref<number>(0);
		const dragStartWidth = ref<number>(0);
		const dragHeader = ref<Header | null>(null);

		useEventListener(window, 'pointermove', throttle(onMouseMove, 40));
		useEventListener(window, 'pointerup', onMouseUp);

		return {
			changeSort,
			dragging,
			dragHeader,
			dragStartWidth,
			dragStartX,
			getClassesForHeader,
			onMouseMove,
			onResizeHandleMouseDown,
			toggleManualSort,
			toggleSelectAll,
			getTooltipForSortIcon,
		};

		function getClassesForHeader(header: Header) {
			const classes: string[] = [];

			if (header.align) {
				classes.push(`align-${header.align}`);
			}

			if (header.sortable) {
				classes.push('sortable');
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
	},
});
</script>

<style lang="scss" scoped>
.table-header {
	.cell {
		position: relative;
		height: 50px; // +2px for bottom border
		padding: 0 12px;
		font-weight: 500;
		font-size: 14px;
		background-color: var(--v-table-background-color);
		border-bottom: 2px solid var(--border-subdued);

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

	.sortable {
		cursor: pointer;
		.sort-icon {
			margin-left: 4px;
			color: var(--foreground-subdued);
			transform: scaleY(-1);
			opacity: 0;
			transition: opacity var(--fast) var(--transition);
		}

		&:hover .sort-icon {
			opacity: 1;
		}

		&.sort-asc,
		&.sort-desc {
			.sort-icon {
				opacity: 1;
			}
		}

		&.sort-desc {
			.sort-icon {
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
		opacity: 0;
		transition: opacity var(--fast) var(--transition);

		&::after {
			position: relative;
			top: 20%;
			left: 2px;
			display: block;
			width: 2px;
			height: 60%;
			background-color: var(--border-subdued);
			content: '';
		}

		&:hover::after {
			background-color: var(--foreground-subdued);
		}
	}

	&:hover .resize-handle {
		opacity: 1;
	}
}
</style>
