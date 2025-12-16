<script setup lang="ts">
import { ref } from 'vue';
import VItemGroup from './v-item-group.vue';
import VItem from './v-item.vue';

const value = ref(['item1']);
</script>

<template>
	<Story title="VItemGroup">
		<v-item-group v-model="value">
			<v-item v-slot="{ active }" watch value="item1">First item is active: {{ active }}</v-item>
			<v-item v-slot="{ active }" value="item2">Second item is active: {{ active }}</v-item>
		</v-item-group>

		<template #controls>
			<HstJson v-model="value" title="Value" />
		</template>
	</Story>
</template>
