<script setup lang="ts">
import { ref } from 'vue';
import VDetail from './v-detail.vue';

const value = ref(false);
</script>

<template>
	<Story title="VDetail">
		<v-detail v-model="value">
			<v-list-item block>A more detailed something!</v-list-item>
		</v-detail>

		<template #controls>
			<HstCheckbox v-model="value" title="Value" />
		</template>
	</Story>
</template>
