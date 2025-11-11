<script setup lang="ts">
import { FieldNode, useFieldTree } from '@/composables/use-field-tree';
import { useCollectionsStore } from '@/stores/collections';
import { useFakeVersionField } from '@/composables/use-fake-version-field';
import { computed, inject, ref } from 'vue';

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

const versioningEnabled = computed(() => Boolean(values.value.versioning && props.injectVersionField));
const { fakeVersionField } = useFakeVersionField(collection, versioningEnabled);

const injectFields = computed(() => {
	return fakeVersionField.value ? { fields: [fakeVersionField.value] } : null;
});

const { treeList, loadFieldRelations } = useFieldTree(collection, injectFields);

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
			{{ $$t('interfaces.system-display-template.select_a_collection') }}
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
