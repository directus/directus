<script setup lang="ts">
import VWorkspaceTile from './v-workspace-tile.vue';

function initState() {
	return {
		name: 'My Tile',
		id: '1',
		x: 0,
		y: 0,
		width: 10,
		height: 10,
	};
}
</script>

<template>
	<Story title="VWorkspaceTile" icon="material-symbols:crop-square" :init-state="initState">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-workspace-tile v-bind="state">Contents of the tile</v-workspace-tile>
		</template>
	</Story>
</template>
