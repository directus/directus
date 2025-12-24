<script setup lang="ts">
import VFieldTemplate from '@/components/v-field-template/v-field-template.vue';
import VNotice from '@/components/v-notice.vue';
import { useFakeVersionField } from '@/composables/use-fake-version-field';
import { FieldNode, useFieldTree } from '@/composables/use-field-tree';
import { useCollectionsStore } from '@/stores/collections';
import { computed, inject, ref } from 'vue';

const props = withDefaults(
	defineProps<{
		value: string | null;
		placeholder?: string | null;
		disabled?: boolean;
		collectionField?: string;
		collectionName?: string;
		fields?: FieldNode[];
		injectVersionField?: boolean;
		includeRelations?: boolean;
	}>(),
	{
		includeRelations: true,
	},
);

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

const { treeList, loadFieldRelations } = useFieldTree(collection, injectFields, () => true, props.includeRelations);

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
		<VNotice v-if="tree === null">
			{{ $t('interfaces.system-display-template.select_a_collection') }}
		</VNotice>
		<VFieldTemplate
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
