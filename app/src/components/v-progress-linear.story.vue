<script setup lang="ts">
import VProgressLinear from './v-progress-linear.vue';

function initState() {
	return {
		value: 70,
		colorful: true,
	};
}
</script>

<template>
	<Story title="VProgressLinear" :init-state="initState">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-progress-linear v-bind="state" />
		</template>
	</Story>
</template>
