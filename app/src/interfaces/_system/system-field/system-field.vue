<script setup lang="ts">
import { Field } from '@directus/types';
import { computed, inject, ref, watch } from 'vue';
import VNotice from '@/components/v-notice.vue';
import VSelect from '@/components/v-select/v-select.vue';
import { useFieldsStore } from '@/stores/fields';

const props = withDefaults(
	defineProps<{
		value: string | null;
		collectionField?: string;
		collectionName?: string;
		typeAllowList?: string[];
		disabled?: boolean;
		placeholder?: string;
		allowNone?: boolean;
		allowPrimaryKey?: boolean;
		allowForeignKeys?: boolean;
	}>(),
	{
		typeAllowList: () => [],
		allowForeignKeys: true,
	},
);

const emit = defineEmits<{
	(e: 'input', value: string | null): void;
}>();

const fieldsStore = useFieldsStore();

const values = inject('values', ref<Record<string, any>>({}));

const collection = computed(() => values.value[props.collectionField!] || props.collectionName);

const fields = computed(() => {
	if (!props.collectionField && !props.collectionName) return [];
	return fieldsStore.getFieldsForCollection(collection.value);
});

// Reset value whenever the chosen collection changes
watch(collection, (newCol, oldCol) => {
	if (oldCol && newCol !== oldCol) {
		emit('input', null);
	}
});

const selectItems = computed(() =>
	fields.value.map((field: Field) => {
		let disabled = false;

		if (props.allowPrimaryKey === false && field?.schema?.is_primary_key === true) disabled = true;
		if (props.allowForeignKeys === false && field?.schema?.foreign_key_table) disabled = true;
		if (props.typeAllowList.length > 0 && props.typeAllowList.includes(field.type) === false) disabled = true;

		return {
			text: field.name,
			value: field.field,
			disabled,
		};
	}),
);
</script>

<template>
	<VNotice v-if="!collectionField && !collectionName" type="warning">
		{{ $t('collection_field_not_setup') }}
	</VNotice>
	<VNotice v-else-if="selectItems.length === 0" type="warning">
		{{ $t('select_a_collection') }}
	</VNotice>
	<VSelect
		v-else
		:show-deselect="allowNone"
		:model-value="value"
		:disabled="disabled"
		:items="selectItems"
		:placeholder="placeholder || $t('select_a_field')"
		@update:model-value="$emit('input', $event)"
	/>
</template>
