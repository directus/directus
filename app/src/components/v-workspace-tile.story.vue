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
	<Story title="VWorkspaceTile" :init-state="initState">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<VWorkspaceTile v-bind="state">Contents of the tile</VWorkspaceTile>
		</template>
	</Story>
</template>
