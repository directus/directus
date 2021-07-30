<template>
	<v-item-group class="group-accordion">
		<accordion-section
			v-for="accordionField in rootFields"
			:key="accordionField.field"
			:field="accordionField"
			:fields="fields"
			:values="values"
			:initial-values="initialValues"
			:disabled="disabled"
			:batch-mode="batchMode"
			:batch-active-fields="batchActiveFields"
			:primary-key="primaryKey"
			:loading="loading"
			:validation-errors="validationErrors"
			:group="field.meta.id"
			@apply="$emit('apply', $event)"
		/>
	</v-item-group>
</template>

<script lang="ts">
import { Field } from '@directus/shared/types';
import { defineComponent, PropType, computed } from 'vue';
import { ValidationError } from '@directus/shared/types';
import AccordionSection from './accordion-section.vue';

export default defineComponent({
	name: 'InterfaceGroupAccordion',
	components: { AccordionSection },
	props: {
		field: {
			type: Object as PropType<Field>,
			required: true,
		},
		fields: {
			type: Array as PropType<Field[]>,
			required: true,
		},
		values: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		initialValues: {
			type: Object as PropType<Record<string, unknown>>,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		batchMode: {
			type: Boolean,
			default: false,
		},
		batchActiveFields: {
			type: Array as PropType<string[]>,
			default: () => [],
		},
		primaryKey: {
			type: [Number, String],
			required: true,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		validationErrors: {
			type: Array as PropType<ValidationError[]>,
			default: () => [],
		},
	},
	emits: ['apply'],
	setup(props) {
		const rootFields = computed(() => {
			return props.fields.filter((field) => field.meta?.group === props.field.meta?.id);
		});

		return { rootFields };
	},
});
</script>
