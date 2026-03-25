<script setup lang="ts">
import VProgressCircular from './v-progress-circular.vue';

function initState() {
	return {
		value: 70,
	};
}
</script>

<template>
	<Story title="VProgressCircular" :init-state="initState">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<VProgressCircular v-bind="state" />
		</template>
	</Story>
</template>
