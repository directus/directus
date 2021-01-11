<template>
	<v-notice v-if="!collectionField && !collectionName" type="warning">
		{{ $t('interfaces.display-template.collection_field_not_setup') }}
	</v-notice>
	<v-notice v-else-if="!collectionName" type="warning">
		{{ $t('interfaces.display-template.select_a_collection') }}
	</v-notice>
	<v-field-template v-else :collection="collectionName" @input="$listeners.input" :value="value" :disabled="disabled" />
</template>

<script lang="ts">
import { defineComponent, inject, ref, computed } from '@vue/composition-api';
import { useCollectionsStore } from '@/stores/collections';

export default defineComponent({
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		value: {
			type: String,
			default: null,
		},
		collectionField: {
			type: String,
			default: null,
		},
		collection: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const collectionsStore = useCollectionsStore();

		const values = inject('values', ref<Record<string, any>>({}));

		const collectionName = computed(() => {
			if (!props.collectionField && !props.collection) return null;

			if (props.collection) return props.collection;

			const collectionName = props.collection || values.value[props.collectionField];
			const collectionExists = !!collectionsStore.state.collections.find(
				(collection) => collection.collection === collectionName
			);
			if (collectionExists === false) return null;
			return collectionName;
		});

		return { collectionName };
	},
});
</script>
