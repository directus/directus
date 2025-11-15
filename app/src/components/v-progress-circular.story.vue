<script setup lang="ts">
import VProgressCircular from './v-progress-circular.vue';

function initState() {
	return {
		value: 70,
	};
}
</script>

<template>
	<Story title="VProgressCircular" icon="material-symbols:replay" :init-state="initState">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-progress-circular v-bind="state" />
		</template>
	</Story>
</template>
