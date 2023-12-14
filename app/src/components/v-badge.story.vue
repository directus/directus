<script setup lang="ts">
import VBadge from './v-badge.vue';

function initState() {
	return {
		value: '+9',
	};
}
</script>

<template>
	<Story title="VBadge" :init-state="initState">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-badge v-bind="state"><v-icon name="notifications_active" /></v-badge>
		</template>
	</Story>
</template>
