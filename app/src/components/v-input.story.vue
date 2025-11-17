<script setup lang="ts">
import { ref } from 'vue';
import VInput from './v-input.vue';

const value = ref('Shut up and take my money. 💸');
</script>

<template>
	<Story title="VInput" icon="material-symbols:edit-square">
		<v-input v-model="value" />

		<template #controls>
			<HstText v-model="value" title="Value" />
		</template>
	</Story>
</template>
