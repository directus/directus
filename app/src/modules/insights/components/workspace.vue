<template>
	<div class="workspace" :class="{ editing: editMode }" :style="[workspaceSize, { transform: `scale(${zoomScale})` }]">
		<insights-panel
			v-for="panel in panels"
			:key="panel.id"
			:panel="panel"
			:edit-mode="editMode"
			@update="$emit('update', { edits: $event, id: panel.id })"
			@delete="$emit('delete', panel.id)"
			@duplicate="$emit('duplicate', panel)"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, inject, ref } from 'vue';
import { Panel } from '@/types';
import InsightsPanel from '../components/panel.vue';
import { useElementSize } from '@/composables/use-element-size';

export default defineComponent({
	name: 'insights-workspace',
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
	},
	setup(props) {
		const mainElement = inject('main-element', ref<Element>());
		const mainElementSize = useElementSize(mainElement);

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

			let contentPaddingPx = 32;

			if (document.querySelector('#main-content')) {
				const contentPadding = getComputedStyle(
					document.querySelector('#main-content') as HTMLElement
				).getPropertyValue('--content-padding');

				contentPaddingPx = Number(contentPadding.substring(0, contentPadding.length - 2));
			}

			if (props.editMode === true) {
				return {
					width: (furthestPanelX.position_x! + furthestPanelX.width! + 25) * 20 + 'px',
					height: (furthestPanelY.position_y! + furthestPanelY.height! + 25) * 20 + 'px',
				};
			}

			return {
				width: (furthestPanelX.position_x! + furthestPanelX.width! - 1) * 20 + contentPaddingPx + 'px',
				height: (furthestPanelY.position_y! + furthestPanelY.height! - 1) * 20 + contentPaddingPx + 'px',
			};
		});

		const zoomScale = computed(() => {
			if (props.zoomToFit === false) return 1;

			const { width, height } = mainElementSize;

			const contentPadding = getComputedStyle(document.querySelector('#main-content') as HTMLElement).getPropertyValue(
				'--content-padding'
			);

			const contentPaddingPx = Number(contentPadding.substring(0, contentPadding.length - 2));

			const scaleWidth: number =
				(width.value - 2 * contentPaddingPx) /
				Number(workspaceSize.value.width.substring(0, workspaceSize.value.width.length - 2));

			const scaleHeight: number =
				(height.value - 114 - contentPaddingPx) /
				Number(workspaceSize.value.height.substring(0, workspaceSize.value.height.length - 2));

			return Math.min(scaleWidth, scaleHeight);
		});

		return { workspaceSize, mainElement, zoomScale };
	},
});
</script>

<style scoped>
.workspace {
	display: grid;
	grid-template-rows: repeat(auto-fill, 20px);
	grid-template-columns: repeat(auto-fill, 20px);
	min-width: calc(100% - var(--content-padding) - var(--content-padding));
	min-height: calc(100% - 120px);
	margin-left: var(--content-padding);
	overflow: visible;
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

.workspace.editing::before {
	opacity: 1;
}
</style>
