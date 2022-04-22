<template>
	<div
		class="workspace-padding-box"
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
			<insights-panel
				v-for="panel in panels"
				:key="panel.id"
				:panel="panel"
				:edit-mode="editMode"
				:now="now"
				@update="$emit('update', { edits: $event, id: panel.id })"
				@move="$emit('move', panel.id)"
				@delete="$emit('delete', panel.id)"
				@duplicate="$emit('duplicate', panel)"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, inject, ref } from 'vue';
import { Panel } from '@directus/shared/types';
import InsightsPanel from '../components/panel.vue';
import { useElementSize } from '@/composables/use-element-size';

export default defineComponent({
	name: 'InsightsWorkspace',
	components: { InsightsPanel },
	props: {
		panels: {
			type: Array as PropType<Panel[]>,
			required: true,
		},
		editMode: {
			type: Boolean,
			default: false,
		},
		zoomToFit: {
			type: Boolean,
			default: false,
		},
		now: {
			type: Date,
			required: true,
		},
	},
	emits: ['update', 'move', 'delete', 'duplicate'],
	setup(props) {
		const mainElement = inject('main-element', ref<Element>());
		const mainElementSize = useElementSize(mainElement);

		const paddingSize = computed(() => Number(getVar('--content-padding')?.slice(0, -2) || 0));

		const workspaceSize = computed(() => {
			const furthestPanelX = props.panels.reduce(
				(aggr, panel) => {
					if (panel.position_x! > aggr.position_x!) {
						aggr.position_x = panel.position_x!;
						aggr.width = panel.width!;
					}

					return aggr;
				},
				{ position_x: 0, width: 0 }
			);

			const furthestPanelY = props.panels.reduce(
				(aggr, panel) => {
					if (panel.position_y! > aggr.position_y!) {
						aggr.position_y = panel.position_y!;
						aggr.height = panel.height!;
					}

					return aggr;
				},
				{ position_y: 0, height: 0 }
			);

			if (props.editMode === true) {
				return {
					width: (furthestPanelX.position_x! + furthestPanelX.width! + 25) * 20,
					height: (furthestPanelY.position_y! + furthestPanelY.height! + 25) * 20,
				};
			}

			return {
				width: (furthestPanelX.position_x! + furthestPanelX.width! - 1) * 20,
				height: (furthestPanelY.position_y! + furthestPanelY.height! - 1) * 20,
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

		return { workspaceSize, workspaceBoxSize, mainElement, zoomScale };

		function getVar(cssVar: string) {
			if (!mainElement.value) return;
			return getComputedStyle(mainElement.value).getPropertyValue(cssVar).trim();
		}
	},
});
</script>

<style scoped>
.workspace-padding-box {
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

.workspace-padding-box.editing .workspace::before {
	opacity: 1;
}
</style>
