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
			:inject="injectValue"
			@update:model-value="$emit('input', $event)"
		/>
	</div>
</template>

<script setup lang="ts">
import { useCollectionsStore } from '@/stores/collections';
import type { Field } from '@directus/types';
import { computed, inject, ref, unref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	value: string | null;
	disabled?: boolean;
	collectionField?: string;
	collectionName?: string;
	injectBranchField?: boolean;
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

// TODO Initial version, probably needs polishing
const injectValue = computed(() => {
	if (!props.injectBranchField) return null;

	const branchesEnabled = values.value['branches_enabled'];

	if (!branchesEnabled) return null;

	const fakeBranchField: Field = {
		collection: unref(collection),
		field: '$branch',
		schema: null,
		name: 'Branch',
		type: 'integer',
		meta: {
			id: -1,
			collection: unref(collection),
			field: '$branch',
			sort: null,
			special: null,
			interface: null,
			options: null,
			display: null,
			display_options: null,
			hidden: false,
			translations: null,
			readonly: true,
			width: 'full',
			group: null,
			note: null,
			required: false,
			conditions: null,
			validation: null,
			validation_message: null,
		},
	};

	return { fields: [fakeBranchField] };
});
</script>
