<script setup lang="ts">
import VSheet from './v-sheet.vue';
</script>

<template>
	<Story title="VSheet">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-sheet v-bind="state">This is some wanky sheet that is not even used inside Directus.</v-sheet>
		</template>
	</Story>
</template>
