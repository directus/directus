<script setup lang="ts">
import VIcon from './v-icon.vue';

function initState() {
	return {
		name: 'cruelty_free',
	};
}
</script>

<template>
	<Story title="VIcon" :init-state="initState">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-icon v-bind="state" />
		</template>
	</Story>
</template>
