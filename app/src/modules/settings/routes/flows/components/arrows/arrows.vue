<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import { computed, unref } from 'vue';
import { GRID_SIZE, PANEL_HEIGHT, PANEL_WIDTH } from '../../constants';
import { ParentInfo } from '../../flow.vue';
import { ArrowInfo } from '../operation.vue';
import { generateArrows } from './lib/generate-arrows';

const props = withDefaults(
	defineProps<{
		panels: Record<string, any>[];
		arrowInfo?: ArrowInfo;
		parentPanels: Record<string, ParentInfo>;
		editMode?: boolean;
		hoveredPanel?: string | null;
		subdued?: boolean;
	}>(),
	{
		arrowInfo: undefined,
		editMode: false,
		hoveredPanel: null,
		subdued: false,
	},
);

const userStore = useUserStore();

const isRTL = computed(() => userStore.textDirection === 'rtl');

const size = computed(() => {
	let width = 0,
		height = 0;

	for (const panel of props.panels) {
		width = Math.max(width, (panel.x + PANEL_WIDTH) * GRID_SIZE);
		height = Math.max(height, (panel.y + PANEL_HEIGHT) * GRID_SIZE);
	}

	if (props.arrowInfo) {
		width = Math.max(width, props.arrowInfo.pos.x + 10);
		height = Math.max(height, props.arrowInfo.pos.y + 10);
	}

	return { width: width + 100, height: height + 100 };
});

const arrows = computed(() => {
	return generateArrows(props.panels as any, {
		arrowInfo: props.arrowInfo,
		editMode: props.editMode,
		hoveredPanel: props.hoveredPanel,
		parentPanels: props.parentPanels,
		size: unref(size),
	});
});
</script>

<template>
	<div class="arrow-container">
		<svg :width="size.width" :height="size.height" class="arrows" :class="{ mirrored: isRTL }">
			<TransitionGroup name="fade">
				<path
					v-for="arrow in arrows"
					:key="arrow.id"
					:class="{ [arrow.type]: true, subdued: subdued || arrow.loner, hint: arrow.isHint }"
					:d="arrow.d"
					stroke-linecap="round"
				/>
			</TransitionGroup>
		</svg>
	</div>
</template>

<style scoped lang="scss">
.arrow-container {
	position: relative;

	.arrows {
		position: absolute;
		inset-block-start: 0;
		z-index: 1;
		inset-inline-start: var(--content-padding);
		pointer-events: none;

		&.mirrored {
			transform: scaleX(-1);
		}

		path {
			fill: transparent;
			stroke: var(--theme--primary);
			stroke-width: 2px;
			transition: stroke var(--fast) var(--transition);
			transform: translateX(0);

			&.reject {
				stroke: var(--theme--secondary);
			}

			&.subdued {
				stroke: var(--theme--foreground-subdued);
			}

			&.fade-enter-active,
			&.fade-leave-active {
				transition: var(--fast) var(--transition);
				transition-property: opacity, transform;
			}

			&.fade-enter-from,
			&.fade-leave-to {
				position: absolute;
				opacity: 0;
				transform: translateX(-4px);
			}
		}
	}
}
</style>
