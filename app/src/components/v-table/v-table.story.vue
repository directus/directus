<script setup lang="ts">
import { ref } from 'vue';
import { Header, Sort } from './types';
import VTable from './v-table.vue';

const sort = ref<Sort>({
	by: 'title',
	desc: true,
});

const selection = ref<string[]>([]);

const headers = ref<Header[]>([
	{
		text: 'Title',
		align: 'right',
		description: 'Title',
		sortable: true,
		value: 'title',
		width: 100,
	},
	{
		text: 'Content',
		align: 'right',
		description: 'Content',
		sortable: true,
		value: 'content',
		width: 200,
	},
]);

const items = ref([
	{
		id: 1,
		title: 'Article A',
		content: 'Lorem Ipsum',
	},
	{
		id: 2,
		title: 'Article B',
		content: 'Lorem Ipsum',
	},
]);
</script>

<template>
	<Story title="VTable">
		<v-table v-model:headers="headers" v-model:sort="sort" v-model="selection" v-model:items="items" />
		<template #controls>
			<HstJson v-model="selection" title="Selection" />
			<HstJson v-model="headers" title="Headers" />
			<HstJson v-model="sort" title="Sort" />
			<HstJson v-model="items" title="Items" />
		</template>
	</Story>
</template>
