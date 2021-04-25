<template>
	<v-notice v-if="items.length === 0">
		{{ $t('no_collections') }}
	</v-notice>
	<interface-checkboxes v-else :choices="items" @input="$listeners.input" :value="value" :disabled="disabled" />
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import { useCollectionsStore } from '@/stores/';

export default defineComponent({
	props: {
		value: {
			type: Array,
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
	setup(props) {
		const collectionsStore = useCollectionsStore();

		const collections = computed(() => {
			if (props.includeSystem) return collectionsStore.state.collections;

			return collectionsStore.state.collections.filter(
				(collection) => collection.collection.startsWith('directus_') === false
			);
		});

		const items = computed(() => {
			return collections.value.map((collection) => ({
				text: collection.name,
				value: collection.collection,
			}));
		});

		return { items };
	},
});
</script>
