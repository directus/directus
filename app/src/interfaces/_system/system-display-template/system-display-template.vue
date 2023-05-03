<template>
	<div class="system-display-template">
		<v-notice v-if="collection === null" type="info">
			{{ t('interfaces.system-display-template.select_a_collection') }}
		</v-notice>

		<v-field-template
			v-else
			:collection="collection"
			:model-value="value"
			:disabled="disabled"
			@update:model-value="$emit('input', $event)"
		/>
	</div>
</template>

<script setup lang="ts">
import { useCollectionsStore } from '@/stores/collections';
import { computed, inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	value: string | null;
	disabled?: boolean;
	collectionField?: string;
	collectionName?: string;
}>();

defineEmits<{
	(e: 'input', value: string | null): void;
}>();

const { t } = useI18n();

const collectionsStore = useCollectionsStore();

const values = inject('values', ref<Record<string, any>>({}));

const collection = computed(() => {
	if (!props.collectionField) {
		if (props.collectionName) return props.collectionName;
		return null;
	}

	const collectionName = values.value[props.collectionField];

	const collectionExists = !!collectionsStore.collections.find(
		(collection) => collection.collection === collectionName
	);

	if (collectionExists === false) return null;
	return collectionName;
});
</script>
