<template>
	<div
		class="panel"
		:style="positionStyling"
		:class="{
			editing: editMode,
			dragging,
			'br-tl': dragging || panel.borderRadius[0],
			'br-tr': dragging || panel.borderRadius[1],
			'br-br': dragging || panel.borderRadius[2],
			'br-bl': dragging || panel.borderRadius[3],
		}"
		data-move
		@pointerdown="onPointerDown('move', $event)"
	>
		<div v-if="panel.show_header" class="header">
			<v-icon class="icon" :style="iconColor" :name="headerIcon" />
			<v-text-overflow class="name selectable" :text="panel.name || ''" />
			<div class="spacer" />
			<v-icon v-if="panel.note" v-tooltip="panel.note" class="note" name="info" />
		</div>

		<div v-if="editMode" class="edit-actions" @pointerdown.stop>
			<v-icon
				v-tooltip="t('edit')"
				class="edit-icon"
				name="edit"
				clickable
				@click.stop="$router.push(`/insights/${panel.dashboard}/${panel.id}`)"
			/>

			<v-menu placement="bottom-end" show-arrow>
				<template #activator="{ toggle }">
					<v-icon class="more-icon" name="more_vert" clickable @click="toggle" />
				</template>

				<v-list>
					<v-list-item clickable :disabled="panel.id.startsWith('_')" @click="$emit('move')">
						<v-list-item-icon>
							<v-icon class="move-icon" name="input" />
						</v-list-item-icon>
						<v-list-item-content>
							{{ t('copy_to') }}
						</v-list-item-content>
					</v-list-item>

					<v-list-item clickable @click="$emit('duplicate')">
						<v-list-item-icon>
							<v-icon name="control_point_duplicate" />
						</v-list-item-icon>
						<v-list-item-content>{{ t('duplicate') }}</v-list-item-content>
					</v-list-item>

					<v-list-item class="delete-action" clickable @click="$emit('delete')">
						<v-list-item-icon>
							<v-icon name="delete" />
						</v-list-item-icon>
						<v-list-item-content>{{ t('delete_panel') }}</v-list-item-content>
					</v-list-item>
				</v-list>
			</v-menu>
		</div>

		<div class="resize-details">
			({{ positioning.x - 1 }}:{{ positioning.y - 1 }}) {{ positioning.width }}×{{ positioning.height }}
		</div>

		<div v-if="editMode" class="resize-handlers">
			<div class="top" @pointerdown.stop="onPointerDown('resize-top', $event)" />
			<div class="right" @pointerdown.stop="onPointerDown('resize-right', $event)" />
			<div class="bottom" @pointerdown.stop="onPointerDown('resize-bottom', $event)" />
			<div class="left" @pointerdown.stop="onPointerDown('resize-left', $event)" />
			<div class="top-left" @pointerdown.stop="onPointerDown('resize-top-left', $event)" />
			<div class="top-right" @pointerdown.stop="onPointerDown('resize-top-right', $event)" />
			<div class="bottom-right" @pointerdown.stop="onPointerDown('resize-bottom-right', $event)" />
			<div class="bottom-left" @pointerdown.stop="onPointerDown('resize-bottom-left', $event)" />
		</div>

		<div class="panel-content" :class="{ 'has-header': panel.show_header }">
			<component
				:is="`panel-${panel.type}`"
				v-bind="panel.options"
				:id="panel.id"
				:show-header="panel.show_header"
				:height="panel.height"
				:width="panel.width"
				:dashboard="panel.dashboard"
				:now="now"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import { getPanels } from '@/panels';
import { Panel } from '@directus/shared/types';
import { defineComponent, PropType, computed, ref, reactive } from 'vue';
import { throttle, omit } from 'lodash';
import { useI18n } from 'vue-i18n';

export default defineComponent({
	name: 'Panel',
	props: {
		panel: {
			type: Object as PropType<Panel>,
			required: true,
		},
		editMode: {
			type: Boolean,
			default: false,
		},
		now: {
			type: Date,
			required: true,
		},
	},
	emits: ['update', 'move', 'duplicate', 'delete'],
	setup(props, { emit }) {
		const { t } = useI18n();
		const { panels } = getPanels();

		const panelTypeInfo = computed(() => {
			return panels.value.find((panelConfig) => {
				return panelConfig.id === props.panel.type;
			});
		});

		const headerIcon = computed(() => {
			return props.panel.icon ? props.panel.icon : panelTypeInfo.value.icon;
		});
		/**
		 * When drag-n-dropping for positioning/resizing, we're
		 */
		const editedPosition = reactive<Partial<Panel>>({
			position_x: undefined,
			position_y: undefined,
			width: undefined,
			height: undefined,
		});

		const { onPointerDown, onPointerUp, onPointerMove, dragging } = useDragDrop();

		const positioning = computed(() => {
			if (dragging.value) {
				return {
					x: editedPosition.position_x ?? props.panel.position_x,
					y: editedPosition.position_y ?? props.panel.position_y,
					width: editedPosition.width ?? props.panel.width,
					height: editedPosition.height ?? props.panel.height,
				};
			}

			return {
				x: props.panel.position_x,
				y: props.panel.position_y,
				width: props.panel.width,
				height: props.panel.height,
			};
		});

		const positionStyling = computed(() => {
			if (dragging.value) {
				return {
					'--pos-x': editedPosition.position_x ?? props.panel.position_x,
					'--pos-y': editedPosition.position_y ?? props.panel.position_y,
					'--width': editedPosition.width ?? props.panel.width,
					'--height': editedPosition.height ?? props.panel.height,
				};
			}

			return {
				'--pos-x': props.panel.position_x,
				'--pos-y': props.panel.position_y,
				'--width': props.panel.width,
				'--height': props.panel.height,
			};
		});

		const iconColor = computed(() => ({
			'--v-icon-color': props.panel.color || 'var(--primary)',
		}));

		return {
			headerIcon,
			positioning,
			positionStyling,
			iconColor,
			onPointerDown,
			onPointerUp,
			onPointerMove,
			dragging,
			editedPosition,
			t,
			omit,
		};

		function useDragDrop() {
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
				if (props.editMode === false) return;
				if (dragging.value === false) return;

				const pointerDeltaX = event.pageX - pointerStartPosX;
				const pointerDeltaY = event.pageY - pointerStartPosY;

				const gridDeltaX = Math.round(pointerDeltaX / 20);
				const gridDeltaY = Math.round(pointerDeltaY / 20);

				if (operation === 'move') {
					editedPosition.position_x = panelStartPosX + gridDeltaX;
					editedPosition.position_y = panelStartPosY + gridDeltaY;

					if (editedPosition.position_x < 1) editedPosition.position_x = 1;
					if (editedPosition.position_y < 1) editedPosition.position_y = 1;
				} else {
					if (operation.includes('top')) {
						editedPosition.height = panelStartHeight - gridDeltaY;
						editedPosition.position_y = panelStartPosY + gridDeltaY;
					}

					if (operation.includes('right')) {
						editedPosition.width = panelStartWidth + gridDeltaX;
					}

					if (operation.includes('bottom')) {
						editedPosition.height = panelStartHeight + gridDeltaY;
					}

					if (operation.includes('left')) {
						editedPosition.width = panelStartWidth - gridDeltaX;
						editedPosition.position_x = panelStartPosX + gridDeltaX;
					}

					const minWidth = panelTypeInfo.value?.minWidth || 6;
					const minHeight = panelTypeInfo.value?.minHeight || 6;

					if (editedPosition.position_x && editedPosition.position_x < 1) editedPosition.position_x = 1;
					if (editedPosition.position_y && editedPosition.position_y < 1) editedPosition.position_y = 1;
					if (editedPosition.width && editedPosition.width < minWidth) editedPosition.width = minWidth;
					if (editedPosition.height && editedPosition.height < minHeight) editedPosition.height = minHeight;
				}
			}, 20);

			return { dragging, onPointerDown, onPointerUp, onPointerMove };

			function onPointerDown(op: Operation, event: PointerEvent) {
				if (props.editMode === false) return;

				operation = op;

				dragging.value = true;

				pointerStartPosX = event.pageX;
				pointerStartPosY = event.pageY;

				panelStartPosX = props.panel.position_x;
				panelStartPosY = props.panel.position_y;

				panelStartWidth = props.panel.width;
				panelStartHeight = props.panel.height;

				window.addEventListener('pointerup', onPointerUp);
				window.addEventListener('pointermove', onPointerMove);
			}

			function onPointerUp() {
				dragging.value = false;
				if (props.editMode === false) return;
				emit('update', editedPosition);
				window.removeEventListener('pointerup', onPointerUp);
				window.removeEventListener('pointermove', onPointerMove);

				editedPosition.position_x = undefined;
				editedPosition.position_y = undefined;
				editedPosition.width = undefined;
				editedPosition.height = undefined;
			}
		}
	},
});
</script>

<style scoped>
.panel {
	--pos-x: 1;
	--pos-y: 1;
	--width: 6;
	--height: 6;

	position: relative;
	display: block;
	grid-row: var(--pos-y) / span var(--height);
	grid-column: var(--pos-x) / span var(--width);
	background-color: var(--background-page);
	border: 1px solid var(--border-subdued);
	box-shadow: 0 0 0 1px var(--border-subdued);
}

.panel:hover {
	z-index: 3;
}

.panel.editing {
	border-color: var(--border-normal);
	box-shadow: 0 0 0 1px var(--border-normal);
	cursor: move;
}

.panel.editing:hover {
	border-color: var(--border-normal-alt);
	box-shadow: 0 0 0 1px var(--border-normal-alt);
}

.panel.editing.dragging {
	z-index: 3 !important;
	border-color: var(--primary);
	box-shadow: 0 0 0 1px var(--primary);
}

.resize-details {
	position: absolute;
	top: 0;
	right: 0;
	z-index: 2;
	padding: 17px 14px;
	color: var(--foreground-subdued);
	font-weight: 500;
	font-size: 15px;
	font-family: var(--family-monospace);
	font-style: normal;
	line-height: 1;
	text-align: right;
	background-color: var(--background-page);
	border-top-right-radius: var(--border-radius-outline);
	opacity: 0;
	transition: opacity var(--fast) var(--transition), color var(--fast) var(--transition);
	pointer-events: none;
}

.panel.editing.dragging .resize-details {
	opacity: 1;
}

.panel-content {
	position: relative;
	width: 100%;
	height: 100%;
	overflow: hidden;
}

.panel-content.has-header {
	height: calc(100% - 48px);
}

.panel.editing .panel-content {
	pointer-events: none;
}

.header {
	display: flex;
	align-items: center;
	height: 48px;
	padding: 12px;
}

.icon {
	--v-icon-color: var(--foreground-subdued);

	margin-right: 4px;
}

.name {
	color: var(--foreground-normal-alt);
	font-weight: 600;
	font-size: 16px;
	font-family: var(--family-sans-serif);
	font-style: normal;
}

.spacer {
	flex-grow: 1;
}

.more-icon,
.edit-icon,
.note {
	--v-icon-color: var(--foreground-subdued);
	--v-icon-color-hover: var(--foreground-normal);
}

.delete-action {
	--v-list-item-color: var(--danger);
	--v-list-item-color-hover: var(--danger);
	--v-list-item-icon-color: var(--danger);
}

.edit-actions {
	position: absolute;
	top: 0;
	right: 0;
	z-index: 2;
	display: flex;
	gap: 4px;
	align-items: center;
	padding: 12px 12px 8px;
	background-color: var(--background-page);
	border-top-right-radius: var(--border-radius-outline);
}

.resize-handlers div {
	position: absolute;
	z-index: 2;
}

.resize-handlers .top {
	top: -3px;
	width: 100%;
	height: 10px;
	cursor: ns-resize;
}

.resize-handlers .right {
	top: 0;
	right: -3px;
	width: 10px;
	height: 100%;
	cursor: ew-resize;
}

.resize-handlers .bottom {
	bottom: -3px;
	width: 100%;
	height: 10px;
	cursor: ns-resize;
}

.resize-handlers .left {
	top: 0;
	left: -3px;
	width: 10px;
	height: 100%;
	cursor: ew-resize;
}

.resize-handlers .top-left {
	top: -3px;
	left: -3px;
	width: 14px;
	height: 14px;
	cursor: nwse-resize;
}

.resize-handlers .top-right {
	top: -3px;
	right: -3px;
	width: 14px;
	height: 14px;
	cursor: nesw-resize;
}

.resize-handlers .bottom-right {
	right: -3px;
	bottom: -3px;
	width: 14px;
	height: 14px;
	cursor: nwse-resize;
}

.resize-handlers .bottom-left {
	bottom: -3px;
	left: -3px;
	width: 14px;
	height: 14px;
	cursor: nesw-resize;
}

.br-tl {
	border-top-left-radius: var(--border-radius-outline);
}

.br-tr {
	border-top-right-radius: var(--border-radius-outline);
}

.br-br {
	border-bottom-right-radius: var(--border-radius-outline);
}

.br-bl {
	border-bottom-left-radius: var(--border-radius-outline);
}
</style>
