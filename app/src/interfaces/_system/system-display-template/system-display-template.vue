<script setup lang="ts">
import { FieldNode, useFieldTree } from '@/composables/use-field-tree';
import { useCollectionsStore } from '@/stores/collections';
import type { Field } from '@directus/types';
import { computed, inject, ref, unref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	value: string | null;
	placeholder?: string | null;
	disabled?: boolean;
	collectionField?: string;
	collectionName?: string;
	fields?: FieldNode[];
	injectVersionField?: boolean;
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
		(collection) => collection.collection === collectionName,
	);

	if (collectionExists === false) return null;
	return collectionName;
});

const injectValue = computed(() => {
	if (!props.injectVersionField) return null;

	const versioningEnabled = values.value['versioning'];

	if (!versioningEnabled) return null;

	const fakeVersionField: Field = {
		collection: unref(collection),
		field: '$version',
		schema: null,
		name: t('version'),
		type: 'integer',
		meta: {
			id: -1,
			collection: unref(collection),
			field: '$version',
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

	return { fields: [fakeVersionField] };
});

const { treeList, loadFieldRelations } = useFieldTree(collection, injectValue);

const tree = computed(() => {
	if (props.fields) {
		return { list: props.fields };
	}

	if (collection.value === null) {
		return null;
	}

	return { list: treeList.value, pathLoader: loadFieldRelations };
});
</script>

<template>
	<div class="system-display-template">
		<v-notice v-if="tree === null">
			{{ t('interfaces.system-display-template.select_a_collection') }}
		</v-notice>
		<v-field-template
			v-else
			:tree="tree.list"
			:model-value="value"
			:disabled="disabled"
			:placeholder="placeholder"
			:load-path-level="tree.pathLoader"
			@update:model-value="$emit('input', $event)"
		/>
	</div>
</template>
