<template>
	<div class="panel" :style="positioning" :class="{ editing: editMode, dragging }" @pointerdown="onPointerDown">
		<div class="header" v-if="panel.show_header">
			<v-icon class="icon" :style="iconColor" :name="panel.icon" />
			<v-text-overflow class="name" :text="panel.name" />
			<div class="spacer" />
			<v-icon v-if="panel.note" name="info" v-tooltip="panel.note" />
		</div>

		<div class="edit-actions" v-if="editMode">
			<v-icon
				small
				class="edit-icon"
				name="edit"
				v-tooltip="$t('edit')"
				@click="$router.push(`/insights/${panel.dashboard}/${panel.id}`)"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import { Panel } from '@/types';
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import { throttle } from 'lodash';

export default defineComponent({
	name: 'panel',
	props: {
		panel: {
			type: Object as PropType<Panel>,
			required: true,
		},
		editMode: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const positioning = computed(() => {
			return {
				'--pos-x': props.panel.position_x,
				'--pos-y': props.panel.position_y,
				'--width': props.panel.width,
				'--height': props.panel.height,
			};
		});

		const iconColor = computed(() => ({
			'--v-icon-color': props.panel.color,
		}));

		const { onPointerDown, onPointerUp, onPointerMove, dragging } = useDragDrop();

		return { positioning, iconColor, onPointerDown, onPointerUp, onPointerMove, dragging };

		function useDragDrop() {
			const dragging = ref(false);

			let pointerStartPosX = 0;
			let pointerStartPosY = 0;
			let panelStartPosX = 0;
			let panelStartPosY = 0;

			const onPointerMove = throttle((event: PointerEvent) => {
				if (props.editMode === false) return;
				if (dragging.value === false) return;

				const pointerDeltaX = event.pageX - pointerStartPosX;
				const pointerDeltaY = event.pageY - pointerStartPosY;

				const edits: { position_x?: number; position_y?: number } = {
					position_x: panelStartPosX + Math.round(pointerDeltaX / 20),
					position_y: panelStartPosY + Math.round(pointerDeltaY / 20),
				};

				emit('update', edits);
			}, 50);

			return { dragging, onPointerDown, onPointerUp, onPointerMove };

			function onPointerDown(event: PointerEvent) {
				if (props.editMode === false) return;
				dragging.value = true;

				pointerStartPosX = event.pageX;
				pointerStartPosY = event.pageY;

				panelStartPosX = props.panel.position_x;
				panelStartPosY = props.panel.position_y;

				window.addEventListener('pointerup', onPointerUp);
				window.addEventListener('pointermove', onPointerMove);
			}

			function onPointerUp() {
				if (props.editMode === false) return;
				dragging.value = false;
				window.removeEventListener('pointerup', onPointerUp);
				window.removeEventListener('pointermove', onPointerMove);
			}
		}
	},
});
</script>

<style scoped>
.panel {
	--pos-x: 5;
	--pos-y: 5;
	--width: 5;
	--height: 5;

	position: relative;
	display: block;
	grid-row: var(--pos-y) / span var(--height);
	grid-column: var(--pos-x) / span var(--width);
	overflow: hidden;
	background-color: var(--background-page);
	border-radius: var(--border-radius-outline);
	box-shadow: 0 0 0 2px var(--border-normal);
}

.panel:hover {
	z-index: 3;
}

.panel.editing {
	cursor: move;
}

.panel.editing:hover {
	box-shadow: 0 0 0 2px var(--border-normal-alt);
}

.panel.editing.dragging {
	box-shadow: 0 0 0 2px var(--primary);
}

.header {
	display: flex;
	align-items: center;
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

.edit-icon {
	--v-icon-color: var(--foreground-subdued);
	--v-icon-color-hover: var(--foreground-normal);
}

.edit-actions {
	position: absolute;
	top: 0;
	right: 0;
	display: flex;
	align-items: center;
	padding: 12px;
	background-color: var(--background-page);
}
</style>
