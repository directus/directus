<template>
	<field-select-menu
		attached
		:fields="fields"
		:model-value="modelValue"
		:filter="modelValue"
		@update:model-value="emitValue($event)"
	>
		<template #activator="{ activate, deactivate: deactivateOuter }">
			<v-input
				:model-value="modelValue"
				db-safe
				:nullable="nullable"
				:disabled="disabled"
				:placeholder="placeholder"
				:class="{ matches: fieldExists }"
				@focus="activate"
				@update:model-value="emitValue($event)"
			>
				<template v-if="fields && fields.length > 0 && !disabled" #append>
					<field-select-menu
						show-arrow
						placement="bottom-end"
						:fields="fields"
						:model-value="modelValue"
						@update:model-value="emitValue($event)"
					>
						<template #activator="{ toggle }">
							<v-icon
								v-tooltip="t('select_existing')"
								name="list_alt"
								clickable
								@click="
									toggle();
									deactivateOuter();
								"
							/>
						</template>
					</field-select-menu>
				</template>

				<template v-if="disabled" #input>
					<v-text-overflow :text="modelValue" />
				</template>
			</v-input>
		</template>
	</field-select-menu>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFieldsStore } from '@/stores/fields';
import { i18n } from '@/lang';
import FieldSelectMenu from './field-select-menu.vue';

export default defineComponent({
	components: { FieldSelectMenu },
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
		disabledFields: {
			type: Array as PropType<string[]>,
			default: () => [],
		},
		typeDenyList: {
			type: Array as PropType<string[]>,
			default: () => [],
		},
		typeAllowList: {
			type: Array as PropType<string[]>,
			default: undefined,
		},
		placeholder: {
			type: String,
			default: () => i18n.global.t('foreign_key') + '...',
		},
		nullable: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const { t } = useI18n();
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

		const emitValue = (field: string) => emit('update:modelValue', field);

		return { t, fields, fieldExists, emitValue };
	},
});
</script>

<style lang="scss" scoped>
.v-input.matches {
	--v-input-color: var(--primary);
}
</style>
