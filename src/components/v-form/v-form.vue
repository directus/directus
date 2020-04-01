<template>
	<div class="v-form" ref="el" :class="gridClass">
		<div v-for="field in formFields" class="field" :key="field.field" :class="field.width">
			<label>{{ field.name }}</label>
			<interface-text-input
				:disabled="field.readonly"
				:value="values[field.field]"
				@input="onInput(field, $event)"
				v-bind="field.options"
			/>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import { useFieldsStore } from '@/stores/fields';
import { Field } from '@/stores/fields/types';
import { useElementSize } from '@/compositions/use-element-size';
import { isEmpty } from '@/utils/is-empty';
import { clone } from 'lodash';
import { FormField } from './types';

type FieldValues = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[field: string]: any;
};

export default defineComponent({
	model: {
		prop: 'edits',
	},
	props: {
		collection: {
			type: String,
			default: undefined,
		},
		fields: {
			type: Array as PropType<FormField[]>,
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
	},
	setup(props, { emit }) {
		const el = ref<Element>(null);
		const fieldsStore = useFieldsStore();

		const fields = computed(() => {
			if (props.collection) {
				return fieldsStore.state.fields.filter(
					(field) => field.collection === props.collection
				);
			}

			if (props.fields) {
				return props.fields;
			}

			throw new Error('[v-form]: You need to pass either the collection or fields prop.');
		});

		const formFields = computed(() => {
			let formFields = [...fields.value];

			// Filter out the fields that are marked hidden on detail
			formFields = formFields.filter((field) => {
				const hiddenDetail = field.hidden_detail;
				if (isEmpty(hiddenDetail)) return true;
				return hiddenDetail === false;
			});

			// Sort the fields on the sort column value
			formFields = formFields.sort((a, b) => {
				if (a.sort == b.sort) return 0;
				if (a.sort === null || a.sort === undefined) return 1;
				if (b.sort === null || b.sort === undefined) return -1;
				return a.sort > b.sort ? 1 : -1;
			});

			// Change the class to half-right if the current element is preceded by another half width field
			// this makes them align side by side
			formFields = formFields.map((field, index, formFields) => {
				if (index === 0) return field;

				if (field.width === 'half') {
					const prevField = formFields[index - 1];

					if (prevField.width === 'half') {
						field.width = 'half-right';
					}
				}

				return field;
			});

			return formFields;
		});

		const { width } = useElementSize(el);

		const gridClass = computed<string | null>(() => {
			if (el.value === null) return null;

			if (width.value > 612 && width.value <= 700) {
				return 'grid';
			} else {
				return 'grid with-fill';
			}

			return null;
		});

		const values = computed(() => {
			return Object.assign({}, props.initialValues, props.edits);
		});

		return { el, width, formFields, gridClass, values, onInput };

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		function onInput(field: Field, value: any) {
			const edits = props.edits ? clone(props.edits) : {};
			edits[field.field] = value;
			emit('input', edits);
		}
	},
});
</script>

<style lang="scss" scoped>
.v-form {
	--v-form-column-width: 300px;
	--v-form-row-max-height: calc(var(--v-form-column-width) * 2);
	--v-form-horizontal-gap: 12px;
	--v-form-vertical-gap: 52px;

	&.grid {
		display: grid;
		grid-template-columns: [start] minmax(0, 1fr) [half] minmax(0, 1fr) [full];
		gap: var(--v-form-vertical-gap) var(--v-form-horizontal-gap);

		&.with-fill {
			grid-template-columns:
				[start] minmax(0, var(--v-form-column-width)) [half] minmax(
					0,
					var(--v-form-column-width)
				)
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
