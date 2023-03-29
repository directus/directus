<template>
	<v-notice v-if="items.length === 0">
		{{ t('no_collections') }}
	</v-notice>
	<interface-select-multiple-checkbox
		v-else
		:choices="items"
		:value="value"
		:disabled="disabled"
		@input="$emit('input', $event)"
	/>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed } from 'vue';
import { useCollectionsStore } from '@/stores/collections';

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
		includeSingleton: {
			type: Boolean,
			default: true,
		},
	},
	emits: ['input'],
	setup(props) {
		const { t } = useI18n();

		const collectionsStore = useCollectionsStore();

		const collections = computed(() => {
			let collections = collectionsStore.collections;
			if (!props.includeSingleton) {
				collections = collections.filter((collection) => collection?.meta?.singleton === false);
			}

			if (props.includeSystem) return collections;

			return collections.filter((collection) => collection.collection.startsWith('directus_') === false);
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
