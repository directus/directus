<template>
	<v-select
		:model-value="value"
		:disabled="disabled"
		:items="items"
		:placeholder="t('select_a_collection')"
		@update:model-value="$emit('input', $event)"
	/>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useCollectionsStore } from '@/stores/';
import { useI18n } from 'vue-i18n';

export default defineComponent({
	props: {
		value: {
			type: String,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		includeSystem: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['input'],
	setup(props) {
		const { t } = useI18n();

		const collectionsStore = useCollectionsStore();

		const collections = computed(() => {
			return [
				...collectionsStore.collections.filter((collection) => collection.collection.startsWith('directus_') === false),
				...(props.includeSystem ? collectionsStore.crudSafeSystemCollections : []),
			];
		});

		const items = computed(() => {
			return collections.value.map((collection) => ({
				text: collection.name,
				value: collection.collection,
			}));
		});

		return { items, t };
	},
});
</script>
