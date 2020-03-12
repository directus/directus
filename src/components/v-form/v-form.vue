<template>
	<div class="v-form" ref="el" :class="gridClass">
		<div v-for="field in formFields" class="field" :key="field.field" :class="field.width">
			<label>{{ field.name }}</label>
			<interface-text-input :value="initialValues[field.field]" :options="field.options" />
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import { useFieldsStore } from '@/stores/fields';
import { useElementSize } from '@/compositions/use-element-size';
import { isEmpty } from '@/utils/is-empty';

type FieldValues = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[field: string]: any;
};

export default defineComponent({
	props: {
		collection: {
			type: String,
			required: true
		},
		initialValues: {
			type: Object as PropType<FieldValues>,
			default: null
		},
		edits: {
			type: Object as PropType<FieldValues>,
			default: null
		}
	},
	setup(props) {
		const el = ref<Element>(null);

		const fieldsStore = useFieldsStore();

		const fieldsInCollection = computed(() =>
			fieldsStore.state.fields.filter(field => field.collection === props.collection)
		);

		const formFields = computed(() => {
			let fields = [...fieldsInCollection.value];

			// Filter out the fields that are marked hidden on detail
			fields = fields.filter(field => {
				const hiddenDetail = field.hidden_detail;
				if (isEmpty(hiddenDetail)) return true;
				return hiddenDetail === false;
			});

			// Sort the fields on the sort column value
			fields = fields.sort((a, b) => {
				if (a.sort == b.sort) return 0;
				if (a.sort === null) return 1;
				if (b.sort === null) return -1;
				return a.sort > b.sort ? 1 : -1;
			});

			// Change the class to half-right if the current element is preceded by another half width field
			// this makes them align side by side
			fields = fields.map((field, index, fields) => {
				if (index === 0) return field;

				if (field.width === 'half') {
					const prevField = fields[index - 1];

					if (prevField.width === 'half') {
						field.width = 'half-right';
					}
				}

				return field;
			});

			return fields;
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

		return { el, width, formFields, gridClass };
	}
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
