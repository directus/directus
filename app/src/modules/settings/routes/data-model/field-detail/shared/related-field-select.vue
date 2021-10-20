<template>
	<v-input
		:modelValue="modelValue"
		@update:model-value="$emit('update:modelValue', $event)"
		db-safe
		:nullable="false"
		:disabled="disabled"
		:placeholder="t('foreign_key') + '...'"
		:class="{ matches: fieldExists }"
	>
		<template v-if="fields && fields.length > 0 && !disabled" #append>
			<v-menu show-arrow placement="bottom-end">
				<template #activator="{ toggle }">
					<v-icon v-tooltip="t('select_existing')" name="list_alt" clickable @click="toggle" />
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

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFieldsStore } from '@/stores';

export default defineComponent({
	props: {
		modelValue: {
			type: String,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		collection: {
			type: String,
			default: null,
		},
		typeDenyList: {
			type: Array as PropType<string[]>,
			default: () => [],
		},
	},
	emits: ['update:modelValue'],
	setup(props) {
		const { t } = useI18n();
		const fieldsStore = useFieldsStore();

		const fields = computed(() => {
			if (!props.collection) return [];

			return fieldsStore.getFieldsForCollectionAlphabetical(props.collection).map((field) => ({
				text: field.field,
				value: field.field,
				disabled: !field.schema || field.schema?.is_primary_key || props.typeDenyList.includes(field.type),
			}));
		});

		const fieldExists = computed(() => {
			if (!props.collection || !props.modelValue) return false;
			return !!fieldsStore.getField(props.collection, props.modelValue);
		});

		return { t, fields, fieldExists };
	},
});
</script>
