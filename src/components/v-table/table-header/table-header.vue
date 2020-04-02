<template>
	<thead class="table-header" :class="{ dragging }">
		<tr :class="{ fixed }">
			<th v-if="showManualSort" class="manual cell" @click="toggleManualSort" scope="col">
				<v-icon name="sort" class="drag-handle" small />
			</th>

			<th v-if="showSelect" class="select cell" scope="col">
				<v-checkbox
					:inputValue="allItemsSelected"
					:indeterminate="someItemsSelected"
					@change="toggleSelectAll"
				/>
			</th>

			<th
				v-for="(header, index) in headers"
				:key="header.value"
				:class="getClassesForHeader(header)"
				class="cell"
				scope="col"
			>
				<div class="content" @click="changeSort(header)">
					<span v-show="header.width > 90 || header.width === null">
						<slot :name="`header.${header.value}`" :header="header">
							{{ header.text }}
						</slot>
					</span>
					<v-icon v-if="header.sortable" name="sort" class="sort-icon" small />
				</div>
				<span
					class="resize-handle"
					v-if="showResize && index !== headers.length - 1"
					@click.stop
					@mousedown="onResizeHandleMouseDown(header, $event)"
				/>
			</th>
		</tr>
	</thead>
</template>

<script lang="ts">
import { defineComponent, ref, PropType } from '@vue/composition-api';
import useEventListener from '@/compositions/use-event-listener';
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
	},
	setup(props, { emit }) {
		const dragging = ref<boolean>(false);
		const dragStartX = ref<number>(0);
		const dragStartWidth = ref<number>(0);
		const dragHeader = ref<Header>(null);

		useEventListener(window, 'mousemove', throttle(onMouseMove, 40));
		useEventListener(window, 'mouseup', onMouseUp);

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

		function onResizeHandleMouseDown(header: Header, event: MouseEvent) {
			const target = event.target as HTMLDivElement;
			const parent = target.parentElement as HTMLTableHeaderCellElement;

			dragging.value = true;
			dragStartX.value = event.pageX;
			dragStartWidth.value = parent.offsetWidth;
			dragHeader.value = header;
		}

		function onMouseMove(event: MouseEvent) {
			if (dragging.value === true) {
				const newWidth = dragStartWidth.value + (event.pageX - dragStartX.value);
				const currentHeaders = clone(props.headers);
				const newHeaders = currentHeaders.map((existing: Header) => {
					if (existing.value === dragHeader.value?.value) {
						return {
							...existing,
							width: Math.max(50, newWidth),
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
			if (props.sort.by === '$manual') {
				emit('update:sort', {
					by: null,
					desc: false,
				});
			} else {
				emit('update:sort', {
					by: '$manual',
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
		height: 48px;
		padding: 0 20px;
		font-weight: 500;
		font-size: 14px;
		background-color: var(--background-page);
		border-bottom: 1px solid var(--border-normal);

		&.select,
		&.sort {
			display: flex;
			align-items: center;
		}

		.content {
			display: flex;
			align-items: center;
			height: 100%;
			font-weight: 600;

			> span {
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
			}
		}
	}

	.sortable {
		.sort-icon {
			margin-left: 4px;
			transform: scaleY(-1);
			opacity: 0;
			transition: opacity var(--fast) var(--transition);
		}

		&:hover .sort-icon {
			opacity: 0.5;
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

	.fixed th {
		position: sticky;
		top: var(--v-table-sticky-offset-top);
		z-index: 2;
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
			left: 2px;
			display: block;
			width: 1px;
			height: 100%;
			background-color: var(--border-normal);
			content: '';
		}

		&:hover::after {
			background-color: var(--foreground-subdued);
		}
	}

	th:hover .resize-handle {
		opacity: 1;
	}
}
</style>
