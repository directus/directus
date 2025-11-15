<script setup lang="ts">
import { ref } from 'vue';
import VCheckbox from './v-checkbox.vue';

const value = ref();
</script>

<template>
	<Story title="VCheckbox" icon="material-symbols:check-box">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-checkbox v-model="value" v-bind="state">My Checkbox</v-checkbox>
		</template>

		<template #controls>
			<HstCheckbox v-model="value" title="Value" />
		</template>
	</Story>
</template>
