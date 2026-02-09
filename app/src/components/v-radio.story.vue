<script setup lang="ts">
import VRadio from './v-radio.vue';

function initState() {
	return {
		value: '1',
		label: 'My Radio',
		modelValue: '1',
	};
}
</script>

<template>
	<Story title="VRadio" :init-state="initState">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<VRadio v-bind="state" />
		</template>
	</Story>
</template>
