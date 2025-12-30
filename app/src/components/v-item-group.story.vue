<script setup lang="ts">
import VItemGroup from './v-item-group.vue';
import VItem from './v-item.vue';
import { ref } from 'vue';

const value = ref(['item1']);
</script>

<template>
	<Story title="VItemGroup">
		<VItemGroup v-model="value">
			<VItem v-slot="{ active }" watch value="item1">First item is active: {{ active }}</VItem>
			<VItem v-slot="{ active }" value="item2">Second item is active: {{ active }}</VItem>
		</VItemGroup>

		<template #controls>
			<HstJson v-model="value" title="Value" />
		</template>
	</Story>
</template>
