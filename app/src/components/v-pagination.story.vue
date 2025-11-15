<script setup lang="ts">
import { ref } from 'vue';
import VPagination from './v-pagination.vue';

function initState() {
	return {
		length: 7,
		totalVisible: 4,
	};
}

const value = ref(3);
</script>

<template>
	<Story title="VPagination" icon="material-symbols:steppers" :init-state="initState">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-pagination v-model="value" v-bind="state" />
		</template>

		<template #controls>
			<HstNumber v-model="value" title="Value" />
		</template>
	</Story>
</template>
