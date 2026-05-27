<script setup lang="ts">
import { ref } from 'vue';
import VCheckbox from './v-checkbox.vue';

const value = ref();
</script>

<template>
	<Story title="VCheckbox">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<VCheckbox v-model="value" v-bind="state">My Checkbox</VCheckbox>
		</template>

		<template #controls>
			<HstCheckbox v-model="value" title="Value" />
		</template>
	</Story>
</template>
