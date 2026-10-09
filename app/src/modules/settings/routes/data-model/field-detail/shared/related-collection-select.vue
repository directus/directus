<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VSelect from '@/components/v-select/v-select.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useCollectionsStore } from '@/stores/collections';

const props = defineProps<{
	modelValue?: string;
	disabled?: boolean;
}>();

defineEmits(['update:modelValue']);

const { t } = useI18n();
const collectionsStore = useCollectionsStore();

const collectionExists = computed(() => {
	return !!collectionsStore.getCollection(props.modelValue);
});

const availableCollections = computed(() => {
	return [
		...collectionsStore.databaseCollections.filter((collection) => collection.meta),
		{
			divider: true,
		},
		{
			collection: t('system'),
			selectable: false,
			children: collectionsStore.crudSafeSystemCollections,
		},
	];
});
</script>

<template>
	<VInput
		key="related-collection-select"
		:model-value="modelValue"
		:class="{ matches: collectionExists }"
		db-safe
		:nullable="false"
		:disabled="disabled"
		:placeholder="$t('collection') + '...'"
		@update:model-value="$emit('update:modelValue', $event)"
	>
		<template v-if="!disabled" #append>
			<VSelect
				:items="availableCollections"
				:model-value="modelValue"
				:attached="false"
				show-arrow
				placement="bottom-end"
				item-value="collection"
				item-text="collection"
				item-disabled="meta.singleton"
				item-label-font-family="var(--theme--fonts--monospace--font-family)"
				@update:model-value="$emit('update:modelValue', $event)"
			>
				<template #preview="{ toggle }">
					<VIcon v-tooltip="$t('select_existing')" name="list_alt" clickable :disabled="disabled" @click="toggle" />
				</template>
			</VSelect>
		</template>

		<template v-if="disabled" #input>
			<VTextOverflow :text="modelValue" />
		</template>
	</VInput>
</template>
