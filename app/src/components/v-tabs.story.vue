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
		<v-tabs v-model="value">
			<v-tab>Foods</v-tab>
			<v-tab>Drinks</v-tab>
			<v-tab>Extras</v-tab>
		</v-tabs>
		<v-tabs-items :model-value="value">
			<v-tab-item>
				<h1>This is the first page</h1>
			</v-tab-item>
			<v-tab-item>
				<h1>This is the second page</h1>
			</v-tab-item>
			<v-tab-item>
				<h1>This is the third page</h1>
			</v-tab-item>
		</v-tabs-items>

		<template #controls>
			<HstJson v-model="value" title="Value" />
		</template>
	</Story>
</template>
