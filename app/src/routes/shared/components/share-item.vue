<template>
	<v-form
		v-model="item"
		:collection="collection"
		:initial-values="item"
		:primary-key="primaryKey"
		disabled
		:loading="loading"
	/>
</template>

<script lang="ts">
import { defineComponent, toRefs } from 'vue';
import { useItem } from '@/composables/use-item';

export default defineComponent({
	id: 'ShareItem',
	props: {
		collection: {
			type: String,
			required: true,
		},
		primaryKey: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const { collection, primaryKey } = toRefs(props);

		const { item, loading } = useItem(collection, primaryKey);

		return { item, loading };
	},
});
</script>
