<template>
	<v-notice v-if="!collectionField" type="warning">
		{{ $t('interfaces.display-template.collection_field_not_setup') }}
	</v-notice>
	<v-notice v-else-if="collection === null" type="warning">
		{{ $t('interfaces.display-template.select_a_collection') }}
	</v-notice>
	<v-field-template v-else :collection="collection" @input="$listeners.input" :value="value" :disabled="disabled" />
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
	},
	setup(props) {
		const collectionsStore = useCollectionsStore();

		const values = inject('values', ref<Record<string, any>>({}));

		const collection = computed(() => {
			if (!props.collectionField) return null;
			const collectionName = values.value[props.collectionField];
			const collectionExists = !!collectionsStore.state.collections.find(
				(collection) => collection.collection === collectionName
			);
			if (collectionExists === false) return null;
			return collectionName;
		});

		return { collection };
	},
});
</script>
