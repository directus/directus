<script setup lang="ts">
import { ref } from 'vue';
import VCollectionFieldTemplate from './v-collection-field-template.vue';

const collection = ref('articles');
const value = ref('');
</script>

<template>
	<Story title="VCollectionFieldTemplate" icon="material-symbols:data-object">
		<v-collection-field-template v-model="value" :collection />

		<template #controls>
			<HstText v-model="collection" title="Collection" />
			<HstText v-model="value" title="Value" />
		</template>
	</Story>
</template>
