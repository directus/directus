<template>
	<div
		class="v-workspace"
		:class="{ editing: editMode }"
		:style="{ width: workspaceBoxSize.width + 'px', height: workspaceBoxSize.height + 'px' }"
	>
		<div
			class="workspace"
			:style="{
				transform: `scale(${zoomScale})`,
				width: workspaceSize.width + 'px',
				height: workspaceSize.height + 'px',
			}"
		>
			<template v-if="!$slots.panel">
				<v-workspace-tile
					v-for="panel in panels"
					:key="panel.id"
					v-bind="panel"
					:edit-mode="editMode"
					:resizable="resizable"
					@preview="$emit('preview', panel)"
					@edit="$emit('edit', panel)"
					@update="$emit('update', { edits: $event, id: panel.id })"
					@move="$emit('move', panel.id)"
					@delete="$emit('delete', panel.id)"
					@duplicate="$emit('duplicate', panel)"
				>
					<slot :panel="panel"></slot>
				</v-workspace-tile>
			</template>
			<template v-else>
				<template v-for="panel in panels" :key="panel.id">
					<slot name="panel" :panel="panel"></slot>
				</template>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import { useElementSize } from '@/composables/use-element-size';
import { AppTile } from './v-workspace-tile.vue';
import { cssVar } from '@directus/shared/utils/browser';

const props = withDefaults(
	defineProps<{
		panels: AppTile[];
		editMode?: boolean;
		zoomToFit?: boolean;
		resizable?: boolean;
	}>(),
	{
		editMode: false,
		zoomToFit: false,
		resizable: true,
	}
);

defineEmits(['update', 'move', 'delete', 'duplicate', 'edit', 'preview']);

const mainElement = inject('main-element', ref<Element>());
const mainElementSize = useElementSize(mainElement);

const paddingSize = computed(() => Number(cssVar('--content-padding', mainElement.value)?.slice(0, -2) || 0));

const workspaceSize = computed(() => {
	const furthestPanelX = props.panels.reduce(
		(aggr, panel) => {
			if (panel.x! > aggr.x!) {
				aggr.x = panel.x!;
				aggr.width = panel.width!;
			}

			return aggr;
		},
		{ x: 0, width: 0 }
	);

	const furthestPanelY = props.panels.reduce(
		(aggr, panel) => {
			if (panel.y! > aggr.y!) {
				aggr.y = panel.y!;
				aggr.height = panel.height!;
			}

			return aggr;
		},
		{ y: 0, height: 0 }
	);

	if (props.editMode === true) {
		return {
			width: (furthestPanelX.x! + furthestPanelX.width! + 25) * 20,
			height: (furthestPanelY.y! + furthestPanelY.height! + 25) * 20,
		};
	}

	return {
		width: (furthestPanelX.x! + furthestPanelX.width! - 1) * 20,
		height: (furthestPanelY.y! + furthestPanelY.height! - 1) * 20,
	};
});

const zoomScale = computed(() => {
	if (props.zoomToFit === false) return 1;

	const { width, height } = mainElementSize;

	const scaleWidth: number = (width.value - paddingSize.value * 2) / workspaceSize.value.width;
	const scaleHeight: number = (height.value - 114 - paddingSize.value * 2) / workspaceSize.value.height;

	return Math.min(scaleWidth, scaleHeight);
});

const workspaceBoxSize = computed(() => {
	return {
		width: workspaceSize.value.width * zoomScale.value + paddingSize.value * 2,
		height: workspaceSize.value.height * zoomScale.value + paddingSize.value * 2,
	};
});
</script>

<style scoped>
.v-workspace {
	position: relative;
}

.workspace {
	position: absolute;
	left: var(--content-padding);
	display: grid;
	grid-template-rows: repeat(auto-fill, 20px);
	grid-template-columns: repeat(auto-fill, 20px);
	min-width: calc(100%);
	min-height: calc(100% - 120px);
	transform: scale(1);
	transform-origin: top left;

	/* This causes the header bar to "unhinge" on the left edge :C */

	/* transition: transform var(--slow) var(--transition); */
}

.workspace > * {
	z-index: 2;
}

.workspace::before {
	position: absolute;
	top: -4px;
	left: -4px;
	display: block;
	width: calc(100% + 8px);
	height: calc(100% + 8px);
	background-image: radial-gradient(var(--border-normal) 10%, transparent 10%);
	background-position: -6px -6px;
	background-size: 20px 20px;
	opacity: 0;
	transition: opacity var(--slow) var(--transition);
	content: '';
	pointer-events: none;
}

.v-workspace.editing .workspace::before {
	opacity: 1;
}
</style>
