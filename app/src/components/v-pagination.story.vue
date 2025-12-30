<script setup lang="ts">
import VPagination from './v-pagination.vue';
import { ref } from 'vue';

function initState() {
	return {
		length: 7,
		totalVisible: 4,
	};
}

const value = ref(3);
</script>

<template>
	<Story title="VPagination" :init-state="initState">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<VPagination v-model="value" v-bind="state" />
		</template>

		<template #controls>
			<HstNumber v-model="value" title="Value" />
		</template>
	</Story>
</template>
