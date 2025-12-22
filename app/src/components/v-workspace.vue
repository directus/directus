<script setup lang="ts">
import VWorkspaceTile from '@/components/v-workspace-tile.vue';
import { useElementSize } from '@directus/composables';
import { cssVar } from '@directus/utils/browser';
import { computed, inject, ref } from 'vue';
import { AppTile } from './v-workspace-tile.vue';

interface Props {
	/** What tiles to render inside the workspace */
	tiles: AppTile[];
	/** Enables the edit mode */
	editMode?: boolean;
	/** Sets zoom and position so that all components are perfectly shown */
	zoomToFit?: boolean;
	/** Makes the panel resizable */
	resizable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	editMode: false,
	zoomToFit: false,
	resizable: true,
});

defineEmits<{
	update: [value: { edits: Event; id: AppTile['id'] }];
	move: [value: AppTile['id']];
	delete: [value: AppTile['id']];
	duplicate: [value: AppTile];
	edit: [value: AppTile];
	preview: [value: AppTile];
}>();

const mainElement = inject('main-element', ref<Element>());
const mainElementSize = useElementSize(mainElement);

const paddingSize = computed(() => Number(cssVar('--content-padding', mainElement.value)?.slice(0, -2) || 0));

const workspaceSize = computed(() => {
	const furthestTileX = props.tiles.reduce(
		(aggr, tile) => {
			if (tile.x + tile.width > aggr.x + aggr.width) {
				aggr.x = tile.x;
				aggr.width = tile.width;
			}

			return aggr;
		},
		{ x: 0, width: 0 },
	);

	const furthestTileY = props.tiles.reduce(
		(aggr, tile) => {
			if (tile.y + tile.height > aggr.y + aggr.height) {
				aggr.y = tile.y;
				aggr.height = tile.height;
			}

			return aggr;
		},
		{ y: 0, height: 0 },
	);

	if (props.editMode === true) {
		return {
			width: (furthestTileX.x + furthestTileX.width + 25) * 20,
			height: (furthestTileY.y + furthestTileY.height + 25) * 20,
		};
	}

	return {
		width: (furthestTileX.x + furthestTileX.width - 1) * 20,
		height: (furthestTileY.y + furthestTileY.height - 1) * 20,
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

<template>
	<div
		class="v-workspace"
		:class="{ editing: editMode }"
		:style="{ inlineSize: workspaceBoxSize.width + 'px', blockSize: workspaceBoxSize.height + 'px' }"
	>
		<div
			class="workspace"
			:style="{
				transform: `scale(${zoomScale})`,
				inlineSize: workspaceSize.width + 'px',
				blockSize: workspaceSize.height + 'px',
			}"
		>
			<template v-if="!$slots.tile">
				<VWorkspaceTile
					v-for="tile in tiles"
					:key="tile.id"
					v-bind="tile"
					:edit-mode="editMode"
					:resizable="resizable"
					@preview="$emit('preview', tile)"
					@edit="$emit('edit', tile)"
					@update="$emit('update', { edits: $event, id: tile.id })"
					@move="$emit('move', tile.id)"
					@delete="$emit('delete', tile.id)"
					@duplicate="$emit('duplicate', tile)"
				>
					<slot :tile="tile"></slot>
				</VWorkspaceTile>
			</template>
			<template v-else>
				<template v-for="tile in tiles" :key="tile.id">
					<slot name="tile" :tile="tile"></slot>
				</template>
			</template>
		</div>
	</div>
</template>

<style scoped>
.v-workspace {
	position: relative;
}

.workspace {
	position: absolute;
	inset-inline-start: var(--content-padding);
	display: grid;
	grid-template-rows: repeat(auto-fill, 20px);
	grid-template-columns: repeat(auto-fill, 20px);
	min-inline-size: calc(100%);
	min-block-size: calc(100% - 120px);
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
	inset-block-start: -4px;
	inset-inline-start: -4px;
	display: block;
	inline-size: calc(100% + 8px);
	block-size: calc(100% + 8px);
	background-image: radial-gradient(var(--theme--form--field--input--border-color) 10%, transparent 10%);
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
