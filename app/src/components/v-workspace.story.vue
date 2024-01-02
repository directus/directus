<script setup lang="ts">
import VWorkspace from './v-workspace.vue';

function initState() {
	return {
		editMode: false,
		tiles: [
			{
				id: '1',
				x: 1,
				y: 1,
				width: 10,
				height: 10,
				name: 'My Tile 1',
			},
			{
				id: '2',
				x: 15,
				y: 5,
				width: 10,
				height: 10,
				name: 'My Tile 2',
			},
		],
	};
}
</script>

<template>
	<Story title="VWorkspace" :init-state="initState">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-workspace v-bind="state" />
		</template>
	</Story>
</template>
