<script setup lang="ts">
import VBadge from './v-badge.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

function initState() {
	return {
		value: '+9',
	};
}
</script>

<template>
	<Story title="VBadge" :init-state="initState">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<VBadge v-bind="state"><VIcon name="notifications_active" /></VBadge>
		</template>
	</Story>
</template>
