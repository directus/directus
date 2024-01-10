<script setup lang="ts">
import VDivider from './v-divider.vue';
</script>

<template>
	<Story title="VDivider">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-divider v-bind="state" />
		</template>
	</Story>
</template>
