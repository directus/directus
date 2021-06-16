<template>
	<v-notice v-if="items.length === 0">
		{{ t('no_collections') }}
	</v-notice>
	<interface-select-multiple-checkbox
		v-else
		:choices="items"
		@input="$emit('input', $event)"
		:value="value"
		:disabled="disabled"
	/>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed } from 'vue';
import { useCollectionsStore } from '@/stores/';

export default defineComponent({
	emits: ['input'],
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
		const { t } = useI18n();

		const collectionsStore = useCollectionsStore();

		const collections = computed(() => {
			if (props.includeSystem) return collectionsStore.collections;

			return collectionsStore.collections.filter(
				(collection) => collection.collection.startsWith('directus_') === false
			);
		});

		const items = computed(() => {
			return collections.value.map((collection) => ({
				text: collection.name,
				value: collection.collection,
			}));
		});

		return { t, items };
	},
});
</script>
