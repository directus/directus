<script setup lang="ts">
import VOverlay from './v-overlay.vue';

function initState() {
	return {
		active: true,
	};
}
</script>

<template>
	<Story title="VOverlay" :init-state="initState">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<VOverlay v-bind="state" />
			<div>This is hidden behind the overlay.</div>
		</template>
	</Story>
</template>
