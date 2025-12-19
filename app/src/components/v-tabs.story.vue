<script setup lang="ts">
import { ref } from 'vue';
import VTabItem from './v-tab-item.vue';
import VTab from './v-tab.vue';
import VTabsItems from './v-tabs-items.vue';
import VTabs from './v-tabs.vue';

const value = ref([1]);
</script>

<template>
	<Story title="VTabs">
		<VTabs v-model="value">
			<VTab>Foods</VTab>
			<VTab>Drinks</VTab>
			<VTab>Extras</VTab>
		</VTabs>
		<VTabsItems :model-value="value">
			<VTabItem>
				<h1>This is the first page</h1>
			</VTabItem>
			<VTabItem>
				<h1>This is the second page</h1>
			</VTabItem>
			<VTabItem>
				<h1>This is the third page</h1>
			</VTabItem>
		</VTabsItems>

		<template #controls>
			<HstJson v-model="value" title="Value" />
		</template>
	</Story>
</template>
