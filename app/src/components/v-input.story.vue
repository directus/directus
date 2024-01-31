<script setup lang="ts">
import { ref } from 'vue';
import VInput from './v-input.vue';

const value = ref('Shut up and take my money. 💸');
</script>

<template>
	<Story title="VInput">
		<template #default="{ state: { _hPropState, _hPropDefs, $data: _, ...state } }">
			<v-input v-model="value" v-bind="state" />
		</template>

		<template #controls>
			<HstText v-model="value" title="Value" />
		</template>
	</Story>
</template>
