<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useUserStore } from '@/stores/user';
import type { Panel } from '@directus/extensions';
import { throttle } from 'lodash';
import { StyleValue, computed, reactive, ref } from 'vue';

export type AppTile = {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	name?: string;
	icon?: string;
	color?: string;
	note?: string;
	showHeader?: boolean;
	minWidth?: number;
	minHeight?: number;
	draggable?: boolean;
	borderRadius?: [boolean, boolean, boolean, boolean];
	data?: Record<string, any>;
};

// Right now, it is not possible to do type Props = AppTile & {resizable?: boolean; editMode?: boolean}
type Props = {
	/** The id of the tile */
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
	/** What title to display on the panel */
	name?: string;
	/** What icon to show next to the title */
	icon?: string;
	/** The color theme of the panel */
	color?: string;
	/** Adds a note beneath the title */
	note?: string;
	/** Allows to hide the header */
	showHeader?: boolean;
	minWidth?: number;
	minHeight?: number;
	/** If enabled, makes the tile draggable */
	draggable?: boolean;
	/** Add or remove rounded corners from the panels */
	borderRadius?: [boolean, boolean, boolean, boolean];
	/** If enabled, allows for resizing of the tile */
	resizable?: boolean;
	/** Enable the edit mode of the panel */
	editMode?: boolean;
	/** Shows options when the `editMode` is active */
	showOptions?: boolean;
	/** Constantly updates position, not only after the dragend */
	alwaysUpdatePosition?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
	name: undefined,
	icon: 'space_dashboard',
	color: 'var(--theme--primary)',
	note: undefined,
	showHeader: true,
	minWidth: 8,
	minHeight: 6,
	resizable: true,
	editMode: false,
	draggable: true,
	borderRadius: () => [true, true, true, true],
	showOptions: true,
	alwaysUpdatePosition: false,
});

const emit = defineEmits(['update', 'move', 'duplicate', 'delete', 'edit', 'preview']);

const userStore = useUserStore();

/**
 * When drag-n-dropping for positioning/resizing, we're
 */
const editedPosition = reactive<Partial<Panel>>({
	position_x: undefined,
	position_y: undefined,
	width: undefined,
	height: undefined,
});

const { onPointerDown, dragging } = useDragDrop();

const positioning = computed(() => {
	if (dragging.value) {
		return {
			x: editedPosition.position_x ?? props.x,
			y: editedPosition.position_y ?? props.y,
			width: editedPosition.width ?? props.width,
			height: editedPosition.height ?? props.height,
		};
	}

	return {
		x: props.x,
		y: props.y,
		width: props.width,
		height: props.height,
	};
});

const positionStyling = computed(() => {
	if (dragging.value) {
		return {
			'--pos-x': editedPosition.position_x ?? props.x,
			'--pos-y': editedPosition.position_y ?? props.y,
			'--width': editedPosition.width ?? props.width,
			'--height': editedPosition.height ?? props.height,
		} as StyleValue;
	}

	return {
		'--pos-x': props.x,
		'--pos-y': props.y,
		'--width': props.width,
		'--height': props.height,
	} as StyleValue;
});

const iconColor = computed(() => ({
	'--v-icon-color': props.color,
}));

function useDragDrop() {
	const isLTR = userStore.textDirection === 'ltr';

	const dragging = ref(false);

	let pointerStartPosX = 0;
	let pointerStartPosY = 0;

	let panelStartPosX = 0;
	let panelStartPosY = 0;
	let panelStartWidth = 0;
	let panelStartHeight = 0;

	type Operation =
		| 'move'
		| 'resize-top'
		| 'resize-right'
		| 'resize-bottom'
		| 'resize-left'
		| 'resize-top-left'
		| 'resize-top-right'
		| 'resize-bottom-right'
		| 'resize-bottom-left';

	let operation: Operation = 'move';

	const onPointerMove = throttle((event: PointerEvent) => {
		if (props.editMode === false || dragging.value === false || props.draggable === false) return;

		const pointerDeltaX = event.pageX - pointerStartPosX;
		const pointerDeltaY = event.pageY - pointerStartPosY;

		const gridDeltaX = Math.round(pointerDeltaX / 20);
		const gridDeltaY = Math.round(pointerDeltaY / 20);

		if (operation === 'move') {
			editedPosition.position_y = panelStartPosY + gridDeltaY;

			if (isLTR) {
				editedPosition.position_x = panelStartPosX + gridDeltaX;
			} else {
				editedPosition.position_x = panelStartPosX - gridDeltaX;
			}

			if (editedPosition.position_x < 1) editedPosition.position_x = 1;
			if (editedPosition.position_y < 1) editedPosition.position_y = 1;
		} else {
			if (operation.includes('top')) {
				editedPosition.height = panelStartHeight - gridDeltaY;
				editedPosition.position_y = panelStartPosY + gridDeltaY;
			}

			if (operation.includes('right')) {
				if (isLTR) {
					editedPosition.width = panelStartWidth + gridDeltaX;
				} else {
					editedPosition.width = panelStartWidth - gridDeltaX;
				}
			}

			if (operation.includes('bottom')) {
				editedPosition.height = panelStartHeight + gridDeltaY;
			}

			if (operation.includes('left')) {
				if (isLTR) {
					editedPosition.width = panelStartWidth - gridDeltaX;
					editedPosition.position_x = panelStartPosX + gridDeltaX;
				} else {
					editedPosition.width = panelStartWidth + gridDeltaX;
					editedPosition.position_x = panelStartPosX - gridDeltaX;
				}
			}

			const minWidth = props.minWidth;
			const minHeight = props.minHeight;

			if (editedPosition.position_x && editedPosition.position_x < 1) editedPosition.position_x = 1;
			if (editedPosition.position_y && editedPosition.position_y < 1) editedPosition.position_y = 1;
			if (editedPosition.width && editedPosition.width < minWidth) editedPosition.width = minWidth;
			if (editedPosition.height && editedPosition.height < minHeight) editedPosition.height = minHeight;
		}

		if (props.alwaysUpdatePosition) emit('update', editedPosition);
	}, 20);

	return { dragging, onPointerDown, onPointerUp, onPointerMove };

	function onPointerDown(op: Operation, event: PointerEvent) {
		if (props.editMode === false || props.draggable === false) return;

		operation = op;

		dragging.value = true;

		pointerStartPosX = event.pageX;
		pointerStartPosY = event.pageY;

		panelStartPosX = props.x;
		panelStartPosY = props.y;

		panelStartWidth = props.width;
		panelStartHeight = props.height;

		window.addEventListener('pointerup', onPointerUp);
		window.addEventListener('pointermove', onPointerMove);
	}

	function onPointerUp() {
		dragging.value = false;

		if (
			props.editMode === false ||
			props.draggable === false ||
			Object.values(editedPosition).every((v) => v === undefined)
		) {
			return;
		}

		emit('update', editedPosition);
		window.removeEventListener('pointerup', onPointerUp);
		window.removeEventListener('pointermove', onPointerMove);

		editedPosition.position_x = undefined;
		editedPosition.position_y = undefined;
		editedPosition.width = undefined;
		editedPosition.height = undefined;
	}
}
</script>

<template>
	<div
		class="v-workspace-tile"
		:style="positionStyling"
		:class="{
			editing: editMode,
			draggable,
			dragging,
			'br-tl': dragging || borderRadius[0],
			'br-tr': dragging || borderRadius[1],
			'br-br': dragging || borderRadius[2],
			'br-bl': dragging || borderRadius[3],
		}"
		data-move
		@pointerdown="onPointerDown('move', $event)"
	>
		<div v-if="showHeader" class="header">
			<v-icon class="icon" :style="iconColor" :name="icon" small />
			<v-text-overflow class="name" :text="name || ''" />
			<div class="spacer" />
			<v-icon v-if="note" v-tooltip="note" class="note" name="info" />
		</div>

		<div v-if="editMode" class="edit-actions" @pointerdown.stop>
			<v-icon v-tooltip="$t('edit')" class="edit-icon" name="edit" clickable @click="$emit('edit')" />

			<v-menu v-if="showOptions" placement="bottom-end" show-arrow>
				<template #activator="{ toggle }">
					<v-icon class="more-icon" name="more_vert" clickable @click="toggle" />
				</template>

				<v-list>
					<v-list-item clickable :disabled="id.startsWith('_')" @click="$emit('move')">
						<v-list-item-icon>
							<v-icon class="move-icon" name="input" />
						</v-list-item-icon>
						<v-list-item-content>
							{{ $t('copy_to') }}
						</v-list-item-content>
					</v-list-item>

					<v-list-item clickable @click="$emit('duplicate')">
						<v-list-item-icon>
							<v-icon name="control_point_duplicate" />
						</v-list-item-icon>
						<v-list-item-content>{{ $t('duplicate') }}</v-list-item-content>
					</v-list-item>

					<v-list-item class="delete-action" clickable @click="$emit('delete')">
						<v-list-item-icon>
							<v-icon name="delete" />
						</v-list-item-icon>
						<v-list-item-content>{{ $t('delete') }}</v-list-item-content>
					</v-list-item>
				</v-list>
			</v-menu>
		</div>

		<div class="resize-details">
			({{ positioning.x - 1 }}:{{ positioning.y - 1 }})
			<template v-if="resizable">{{ positioning.width }}×{{ positioning.height }}</template>
		</div>

		<div v-if="editMode && resizable" class="resize-handlers">
			<div class="top" @pointerdown.stop="onPointerDown('resize-top', $event)" />
			<div class="right" @pointerdown.stop="onPointerDown('resize-right', $event)" />
			<div class="bottom" @pointerdown.stop="onPointerDown('resize-bottom', $event)" />
			<div class="left" @pointerdown.stop="onPointerDown('resize-left', $event)" />
			<div class="top-left" @pointerdown.stop="onPointerDown('resize-top-left', $event)" />
			<div class="top-right" @pointerdown.stop="onPointerDown('resize-top-right', $event)" />
			<div class="bottom-right" @pointerdown.stop="onPointerDown('resize-bottom-right', $event)" />
			<div class="bottom-left" @pointerdown.stop="onPointerDown('resize-bottom-left', $event)" />
		</div>

		<div class="tile-content" :class="{ 'has-header': showHeader }">
			<slot></slot>
			<div v-if="$slots.footer" class="footer">
				<slot name="footer"></slot>
			</div>
		</div>
		<slot name="body"></slot>
	</div>
</template>

<style scoped lang="scss">
.v-workspace-tile {
	--pos-x: 1;
	--pos-y: 1;
	--width: 6;
	--height: 6;

	position: relative;
	display: block;
	grid-row: var(--pos-y) / span var(--height);
	grid-column: var(--pos-x) / span var(--width);
	background-color: var(--theme--background);
	border: calc(var(--theme--border-width) / 2) solid var(--theme--border-color-subdued);
	box-shadow: 0 0 0 calc(var(--theme--border-width) / 2) var(--theme--border-color-subdued);
	z-index: 1;
	transition: var(--fast) var(--transition);
	transition-property: border, box-shadow;

	&:hover {
		z-index: 3;
	}

	&.editing {
		&.draggable {
			border-color: var(--theme--form--field--input--border-color);
			box-shadow: 0 0 0 calc(var(--theme--border-width) / 2) var(--theme--form--field--input--border-color);
			cursor: move;
		}

		&.draggable:hover {
			border-color: var(--theme--form--field--input--border-color-hover);
			box-shadow: 0 0 0 calc(var(--theme--border-width) / 2) var(--theme--form--field--input--border-color-hover);
		}

		&.dragging {
			z-index: 3 !important;
			border-color: var(--theme--form--field--input--border-color-focus);
			box-shadow: 0 0 0 calc(var(--theme--border-width) / 2) var(--theme--primary);
		}

		&.dragging .resize-details {
			opacity: 1;
		}

		& .tile-content {
			pointer-events: none;
		}
	}
}

.resize-details {
	position: absolute;
	inset-block-end: 0;
	inset-inline-end: 0;
	z-index: 2;
	padding: 2px 11.5px 11.5px 2px;
	color: var(--theme--foreground-subdued);
	font-weight: 500;
	font-size: 12px;
	font-family: var(--theme--fonts--monospace--font-family);
	font-style: normal;
	line-height: 1;
	text-align: end;
	border-start-end-radius: var(--theme--border-radius);
	border-end-end-radius: var(--theme--border-radius);
	border-start-start-radius: var(--theme--border-radius);
	background-color: var(--theme--background);
	opacity: 0;
	transition:
		opacity var(--fast) var(--transition),
		color var(--fast) var(--transition);
	pointer-events: none;
}

.tile-content {
	position: relative;
	display: flex;
	flex-direction: column;
	inline-size: 100%;
	block-size: 100%;
	overflow: hidden;
}

.tile-content.has-header {
	block-size: calc(100% - 42px);
}

.header {
	display: flex;
	align-items: center;
	block-size: 42px;
	padding: 12px;
}

.footer {
	padding: 0 12px;
	border-block-start: 2px solid var(--theme--border-color-subdued);
	margin-block-start: auto;
	padding-block-start: 8px;
}

.icon {
	--v-icon-color: var(--theme--foreground-subdued);

	margin-inline-end: 4px;
}

.name {
	color: var(--theme--foreground-accent);
	font-weight: 600;
	font-size: 16px;
	font-family: var(--theme--fonts--sans--font-family);
	font-style: normal;
}

.spacer {
	flex-grow: 1;
}

.more-icon,
.edit-icon,
.note {
	--v-icon-color: var(--theme--foreground);
	--v-icon-color-hover: var(--theme--foreground-accent);
}

.delete-action {
	--v-list-item-color: var(--theme--danger);
	--v-list-item-color-hover: var(--theme--danger);
	--v-list-item-icon-color: var(--theme--danger);
}

.edit-actions {
	position: absolute;
	inset-block-start: 0;
	inset-inline-end: 0;
	z-index: 2;
	display: flex;
	gap: 4px;
	align-items: center;
	padding: 7px;
	border-start-end-radius: var(--theme--border-radius);
	border-end-end-radius: var(--theme--border-radius);
	border-end-start-radius: var(--theme--border-radius);
	background-color: var(--theme--background);
}

.resize-handlers div {
	position: absolute;
	z-index: 2;
}

.resize-handlers .top {
	inset-block-start: -3px;
	inline-size: 100%;
	block-size: 10px;
	cursor: ns-resize;
}

.resize-handlers .right {
	inset-block-start: 0;
	inset-inline-end: -3px;
	inline-size: 10px;
	block-size: 100%;
	cursor: ew-resize;
}

.resize-handlers .bottom {
	inset-block-end: -3px;
	inline-size: 100%;
	block-size: 10px;
	cursor: ns-resize;
}

.resize-handlers .left {
	inset-block-start: 0;
	inset-inline-start: -3px;
	inline-size: 10px;
	block-size: 100%;
	cursor: ew-resize;
}

.resize-handlers .top-left {
	inset-block-start: -3px;
	inset-inline-start: -3px;
	inline-size: 14px;
	block-size: 14px;
	cursor: nwse-resize;

	html[dir='rtl'] & {
		cursor: nesw-resize;
	}
}

.resize-handlers .top-right {
	inset-block-start: -3px;
	inset-inline-end: -3px;
	inline-size: 14px;
	block-size: 14px;
	cursor: nesw-resize;

	html[dir='rtl'] & {
		cursor: nwse-resize;
	}
}

.resize-handlers .bottom-right {
	inset-inline-end: -3px;
	inset-block-end: -3px;
	inline-size: 14px;
	block-size: 14px;
	cursor: nwse-resize;

	html[dir='rtl'] & {
		cursor: nesw-resize;
	}
}

.resize-handlers .bottom-left {
	inset-block-end: -3px;
	inset-inline-start: -3px;
	inline-size: 14px;
	block-size: 14px;
	cursor: nesw-resize;

	html[dir='rtl'] & {
		cursor: nwse-resize;
	}
}

.br-tl {
	border-start-start-radius: var(--theme--border-radius);
}

.br-tr {
	border-start-end-radius: var(--theme--border-radius);
}

.br-br {
	border-end-end-radius: var(--theme--border-radius);
}

.br-bl {
	border-end-start-radius: var(--theme--border-radius);
}
</style>
