<template>
	<div class="v-form" ref="el" :class="gridClass">
		<div v-for="field in formFields" class="field" :key="field.field" :class="field.width">
			<v-menu
				v-if="field.hideLabel !== true"
				placement="bottom-start"
				show-arrow
				close-on-content-click
				:disabled="
					loading ||
					field.readonly === true ||
					(batchMode && batchActiveFields.includes(field.field) === false)
				"
			>
				<template #activator="{ toggle, active }">
					<div class="label type-label">
						<v-checkbox
							v-if="batchMode"
							@change="toggleBatchField(field)"
							:input-value="batchActiveFields"
							:value="field.field"
						/>
						<span @click="toggle">
							{{ field.name }}
							<v-icon class="required" sup name="star" v-if="field.required" />
							<v-icon class="ctx-arrow" :class="{ active }" name="arrow_drop_down" />
						</span>
					</div>
				</template>

				<v-list dense>
					<v-list-item
						@click="setValue(field, null)"
						:disabled="values[field.field] === null"
					>
						<v-list-item-icon><v-icon name="delete_outline" /></v-list-item-icon>
						<v-list-item-content>{{ $t('clear_value') }}</v-list-item-content>
					</v-list-item>
					<v-list-item
						@click="unsetValue(field)"
						:disabled="
							field.default_value === undefined ||
							values[field.field] === field.default_value
						"
					>
						<v-list-item-icon>
							<v-icon name="settings_backup_restore" />
						</v-list-item-icon>
						<v-list-item-content>{{ $t('reset_to_default') }}</v-list-item-content>
					</v-list-item>
					<v-list-item
						v-if="initialValues"
						@click="unsetValue(field)"
						:disabled="
							initialValues[field.field] === undefined ||
							values[field.field] === initialValues[field.field]
						"
					>
						<v-list-item-icon>
							<v-icon name="undo" />
						</v-list-item-icon>
						<v-list-item-content>{{ $t('undo_changes') }}</v-list-item-content>
					</v-list-item>
				</v-list>
			</v-menu>

			<div
				class="interface"
				:class="{
					subdued: batchMode && batchActiveFields.includes(field.field) === false,
				}"
			>
				<v-skeleton-loader v-if="loading && field.hideLoader !== true" />
				<component
					:is="`interface-${field.interface}`"
					v-bind="field.options"
					:disabled="
						field.readonly ||
						(batchMode && batchActiveFields.includes(field.field) === false)
					"
					:value="
						values[field.field] === undefined
							? field.default_value
							: values[field.field]
					"
					:width="field.width"
					:type="field.type"
					@input="setValue(field, $event)"
				/>
			</div>

			<small class="note" v-if="field.note" v-html="marked(field.note)" />
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import { useFieldsStore } from '@/stores/fields';
import { Field } from '@/stores/fields/types';
import { useElementSize } from '@/composables/use-element-size';
import { isEmpty } from '@/utils/is-empty';
import { clone } from 'lodash';
import { FormField } from './types';
import interfaces from '@/interfaces';
import marked from 'marked';

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
		loading: {
			type: Boolean,
			default: false,
		},
		batchMode: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const el = ref<Element>(null);
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

				/**
				 * @NOTE
				 *
				 * This can be optimized by combining a bunch of these maps and filters
				 */

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

				// Make sure all form fields have a width associated with it
				formFields = formFields.map((field) => {
					if (!field.width) {
						field.width = 'full';
					}

					return field;
				});

				// Make sure all used interfaces actually exist, default to text-input if not
				formFields = formFields.map((field) => {
					const interfaceUsed = interfaces.find((int) => int.id === field.interface);
					const interfaceExists = interfaceUsed !== undefined;

					if (interfaceExists === false) {
						/**
						 * @NOTE
						 * Can be optimized by making the default smarter based on type used for the
						 * field
						 */
						field.interface = 'text-input';
					}

					if (interfaceUsed?.hideLabel === true) {
						(field as FormField).hideLabel = true;
					}

					if (interfaceUsed?.hideLoader === true) {
						(field as FormField).hideLoader = true;
					}

					return field;
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

			return { formFields, gridClass };
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
					batchActiveFields.value = batchActiveFields.value.filter(
						(fieldKey) => fieldKey !== field.field
					);

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
				[start] minmax(0, var(--v-form-column-max-width)) [half] minmax(
					0,
					var(--v-form-column-max-width)
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

.interface {
	position: relative;

	.v-skeleton-loader {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 2;
		width: 100%;
		height: 100%;
	}

	&.subdued {
		opacity: 0.5;
	}
}

.label {
	position: relative;
	display: flex;
	width: max-content;
	margin-bottom: 8px;
	cursor: pointer;

	.v-checkbox {
		margin-right: 4px;
	}

	.required {
		--v-icon-color: var(--primary);

		margin-left: -3px;
	}

	.ctx-arrow {
		position: absolute;
		top: -3px;
		right: -20px;
		color: var(--foreground-subdued);
		opacity: 0;
		transition: opacity var(--fast) var(--transition);

		&.active {
			opacity: 1;
		}
	}

	&:hover {
		.ctx-arrow {
			opacity: 1;
		}
	}
}

.note {
	display: block;
	margin-top: 4px;
	color: var(--foreground-subdued);
	font-style: italic;
}
</style>
