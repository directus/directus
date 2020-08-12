<template>
	<div class="v-form" ref="el" :class="gridClass">
		<form-field
			v-for="field in formFields"
			:field="field"
			:key="field.field"
			:value="(edits || {})[field.field]"
			:initial-value="(initialValues || {})[field.field]"
			:disabled="disabled"
			:batch-mode="batchMode"
			:batch-active="batchActiveFields.includes(field.field)"
			:primary-key="primaryKey"
			:loading="loading"
			@input="setValue(field, $event)"
			@unset="unsetValue(field)"
			@toggle-batch="toggleBatchField(field)"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import { useFieldsStore } from '@/stores/';
import { Field } from '@/types';
import { useElementSize } from '@/composables/use-element-size';
import { clone } from 'lodash';
import marked from 'marked';
import FormField from './form-field.vue';
import useFormFields from '@/composables/use-form-fields';

type FieldValues = {
	[field: string]: any;
};

export default defineComponent({
	components: { FormField },
	model: {
		prop: 'edits',
	},
	props: {
		collection: {
			type: String,
			default: undefined,
		},
		fields: {
			type: Array as PropType<Field[]>,
			default: undefined,
		},
		initialValues: {
			type: Object as PropType<FieldValues>,
			default: null,
		},
		edits: {
			type: Object as PropType<FieldValues>,
			default: null,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		batchMode: {
			type: Boolean,
			default: false,
		},
		primaryKey: {
			type: [String, Number],
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const el = ref<Element | null>(null);
		const fieldsStore = useFieldsStore();

		const values = computed(() => {
			return Object.assign({}, props.initialValues, props.edits);
		});

		const { formFields, gridClass } = useForm();

		const { toggleBatchField, batchActiveFields } = useBatch();

		return {
			el,
			formFields,
			gridClass,
			values,
			setValue,
			batchActiveFields,
			toggleBatchField,
			unsetValue,
			marked,
		};

		function useForm() {
			const fields = computed(() => {
				if (props.collection) {
					return fieldsStore.state.fields.filter((field) => field.collection === props.collection);
				}

				if (props.fields) {
					return props.fields;
				}

				throw new Error('[v-form]: You need to pass either the collection or fields prop.');
			});

			const { formFields } = useFormFields(fields);

			const { width } = useElementSize(el);

			const gridClass = computed<string | null>(() => {
				if (el.value === null) return null;

				if (width.value > 612 && width.value <= 792) {
					return 'grid';
				} else {
					return 'grid with-fill';
				}

				return null;
			});

			return { formFields, gridClass, isDisabled };

			function isDisabled(field: Field) {
				return (
					props.loading ||
					props.disabled === true ||
					field.meta.readonly === true ||
					(props.batchMode && batchActiveFields.value.includes(field.field) === false)
				);
			}
		}

		function setValue(field: Field, value: any) {
			const edits = props.edits ? clone(props.edits) : {};
			edits[field.field] = value;
			emit('input', edits);
		}

		function unsetValue(field: Field) {
			if (props.edits?.hasOwnProperty(field.field)) {
				const newEdits = { ...props.edits };
				delete newEdits[field.field];
				emit('input', newEdits);
			}
		}

		function useBatch() {
			const batchActiveFields = ref<string[]>([]);

			return { batchActiveFields, toggleBatchField };

			function toggleBatchField(field: Field) {
				if (batchActiveFields.value.includes(field.field)) {
					batchActiveFields.value = batchActiveFields.value.filter((fieldKey) => fieldKey !== field.field);

					unsetValue(field);
				} else {
					batchActiveFields.value = [...batchActiveFields.value, field.field];
				}
			}
		}
	},
});
</script>

<style>
body {
	--v-form-column-width: var(--form-column-width);
	--v-form-column-max-width: var(--form-column-max-width);
	--v-form-row-max-height: calc(var(--v-form-column-width) * 2);
	--v-form-horizontal-gap: var(--form-horizontal-gap);
	--v-form-vertical-gap: var(--form-vertical-gap);
}
</style>

<style lang="scss" scoped>
.v-form {
	&.grid {
		display: grid;
		grid-template-columns: [start] minmax(0, 1fr) [half] minmax(0, 1fr) [full];
		gap: var(--v-form-vertical-gap) var(--v-form-horizontal-gap);

		&.with-fill {
			grid-template-columns:
				[start] minmax(0, var(--v-form-column-max-width)) [half] minmax(0, var(--v-form-column-max-width))
				[full] 1fr [fill];
		}
	}

	& > .half,
	& > .half-left,
	& > .half-space {
		grid-column: start / half;
	}

	& > .half-right {
		grid-column: half / full;
	}

	& > .full {
		grid-column: start / full;
	}

	& > .fill {
		grid-column: start / fill;
	}
}
</style>
