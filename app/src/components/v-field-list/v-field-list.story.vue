<script setup lang="ts">
import { ref } from 'vue';
import VFieldList from './v-field-list.vue';

const collection = ref('articles');
</script>

<template>
	<Story title="VFieldList">
		<v-field-list :collection="collection" />

		<template #controls>
			<HstText v-model="collection" title="Collection" />
		</template>
	</Story>
</template>
