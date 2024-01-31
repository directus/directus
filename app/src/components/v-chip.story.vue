<script setup lang="ts">
import VChip from './v-chip.vue';
</script>

<template>
	<Story title="VChip">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-chip v-bind="state">Cake</v-chip>
		</template>
	</Story>
</template>
