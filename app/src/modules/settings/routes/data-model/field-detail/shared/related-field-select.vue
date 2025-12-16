<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VMenu from '@/components/v-menu.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useFieldsStore } from '@/stores/fields';
import { computed } from 'vue';

const props = withDefaults(
	defineProps<{
		modelValue?: string;
		disabled?: boolean;
		collection?: string;
		disabledFields?: string[];
		typeDenyList?: string[];
		typeAllowList?: string[];
		placeholder?: string;
		nullable?: boolean;
	}>(),
	{
		disabledFields: () => [],
		typeDenyList: () => [],
	},
);

defineEmits(['update:modelValue']);

const fieldsStore = useFieldsStore();

const fields = computed(() => {
	if (!props.collection) return [];

	return fieldsStore.getFieldsForCollectionAlphabetical(props.collection).map((field) => ({
		text: field.field,
		value: field.field,
		disabled:
			!field.schema ||
			!!field.schema?.is_primary_key ||
			props.disabledFields.includes(field.field) ||
			props.typeDenyList.includes(field.type) ||
			(props.typeAllowList && !props.typeAllowList.includes(field.type)),
	}));
});

const fieldExists = computed(() => {
	if (!props.collection || !props.modelValue) return false;
	return !!fieldsStore.getField(props.collection, props.modelValue);
});
</script>

<template>
	<v-input
		:model-value="modelValue"
		db-safe
		:nullable="nullable"
		:disabled="disabled"
		:placeholder="placeholder || $t('foreign_key')"
		:class="{ matches: fieldExists }"
		@update:model-value="$emit('update:modelValue', $event)"
	>
		<template v-if="fields && fields.length > 0 && !disabled" #append>
			<v-menu show-arrow placement="bottom-end">
				<template #activator="{ toggle }">
					<v-icon v-tooltip="$t('select_existing')" name="list_alt" clickable @click="toggle" />
				</template>

				<v-list class="monospace">
					<v-list-item
						v-for="field in fields"
						:key="field.value"
						:active="modelValue === field.value"
						:disabled="field.disabled"
						clickable
						@click="$emit('update:modelValue', field.value)"
					>
						<v-list-item-content>
							{{ field.text }}
						</v-list-item-content>
					</v-list-item>
				</v-list>
			</v-menu>
		</template>

		<template v-if="disabled" #input>
			<v-text-overflow :text="modelValue" />
		</template>
	</v-input>
</template>
